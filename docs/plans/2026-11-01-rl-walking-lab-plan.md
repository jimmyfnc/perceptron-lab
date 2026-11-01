# Teaching Robots to Walk: A Reinforcement Learning Lab

Nov 1, 2026 · James Caldwell · **Status: parked** — saved for later. Candidate for a
future "06 Reinforcement Learning" station (see the Perceptron Lab ideas at the end).

## Overview

By the end of this lab, a four-legged robot you trained on your own RTX 4090 walks
wherever a joystick tells it to, using the same recipe Embark Studios used for the
robots in ARC Raiders, at hobby scale.

ARC Raiders' enemies are real physics objects. Embark rejected hand animation, motion
capture and procedural animation, and instead trained neural networks with
reinforcement learning to drive the robots' joint motors (GDC 2026 session). This lab
rebuilds that idea step by step, each stage adding one new idea:

1. **CartPole**: the reinforcement learning loop on the smallest possible problem.
2. **MuJoCo Ant and HalfCheetah**: a physics body learns to run from nothing, and you
   meet reward hacking.
3. **GPU-parallel quadruped**: thousands of robots train at once on the 4090, so a
   quadruped learns to walk on command.
4. **ARC-RL Leaper**: an ARC Raiders-inspired robot with a reward built for style, not
   just speed.
5. **Memory**: an LSTM policy versus a memoryless one when the robot can't see
   everything it needs.

Each stage ends with a recorded video of the result, so you have portfolio material at
every step.

## Core concepts

**Reinforcement learning (RL) is a training method, not a kind of network**: an agent
gets better at a task by trial and error, guided only by a reward.

**The loop.** Each step, the environment hands the agent an _observation_ (joint
angles, body speed, the command it should follow). The agent's _policy_, a neural
network, picks an _action_ (target angles for each joint motor). The physics advances
one step and returns a _reward_: a score for how good that moment was. One run from
reset to fall or time-out is an _episode_. Training means changing the policy's weights
so the total reward per episode goes up. The observe → act → reward steps repeat every
physics step; the training update runs after each batch of steps.

**PPO** (Proximal Policy Optimization) is the default algorithm in this lab. It runs
the current policy for a batch of steps, works out which actions did better than
expected, nudges the policy toward them, and clips each update so the policy never
changes too much at once. **SAC** (Soft Actor-Critic) is the main alternative: it
learns from a replay buffer of past experience, so it needs fewer simulation steps;
ARC-RL's study is built around SAC-style methods.

**Where RNNs fit.** An RNN does not use reinforcement learning by default. An RNN is a
network architecture with memory: a hidden state carried from step to step. It is most
often trained with supervised learning (backpropagation through time on labeled
sequences). It meets RL when it _is_ the policy: RL then trains the RNN's weights from
rewards instead of labels. That pays off when one observation isn't enough, for example
a robot that has to remember that its last few steps slipped. Stage 5 tests exactly
that.

Three ways to make a robot walk:

| Approach                         | How it moves                                | Reacts to hits and lost legs | Cost to build                    |
| -------------------------------- | ------------------------------------------- | ---------------------------- | -------------------------------- |
| Procedural (like Strider)        | Rules place the feet, IK solves the joints  | No, it can't really fall     | Low: code only                   |
| Physics + hand-tuned controllers | Motors driven by hand-written balance logic | Yes, but brittle             | High tuning effort               |
| Learned (RL, like ARC Raiders)   | A trained network drives the motors         | Yes, learned from practice   | GPU training time, reward design |

## Setup

Run the whole lab inside **WSL2 (Ubuntu)** on Windows: JAX's CUDA wheels are
Linux-only, so stage 3's GPU training needs Linux, and keeping every stage in one
environment avoids two setups (JAX install guide). Stages 1 and 2 also run natively on
Windows if you want to start there.

1. Update the NVIDIA driver on Windows. WSL2 uses the Windows driver; never install a
   Linux NVIDIA driver inside WSL.
2. Install Ubuntu under WSL2 (PowerShell as admin), then reboot:

   ```powershell
   wsl --install -d Ubuntu-24.04
   ```

3. In Ubuntu, create the project and a Python 3.12 environment with uv:

   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   mkdir rl-lab && cd rl-lab
   uv venv --python 3.12
   source .venv/bin/activate
   ```

4. Stages 1, 2 and 5 (PyTorch stack):

   ```bash
   uv pip install "gymnasium[mujoco]" "stable-baselines3[extra]" sb3-contrib tensorboard moviepy
   ```

5. Stage 3 (JAX on the GPU):

   ```bash
   uv pip install -U "jax[cuda12]"
   python -c "import jax; print(jax.default_backend())"   # must print: gpu
   uv pip install playground
   ```

6. Two settings for the 4090, added to `~/.bashrc`:

   ```bash
   export MUJOCO_GL=egl                          # render videos off-screen on the GPU
   export JAX_DEFAULT_MATMUL_PRECISION=highest   # RTX 30/40 cards default to TF32, which hurts reproducibility
   ```

   The second line comes from MuJoCo Playground's own notes: RTX 30 and 40 series
   cards can give slightly different results run to run unless JAX uses full float32
   math.

One surprise to expect: Stable-Baselines3's PPO with small networks often runs faster
on the CPU than the GPU, because each step is tiny. The 4090 earns its keep in stage 3,
where the physics itself runs on the GPU.

## Stage 1: CartPole

A cart learns to balance a pole by sliding left or right; it's solved when it survives
the full 500 steps of an episode, and PPO usually gets there within 100,000 steps on
the CPU.

`stage1_cartpole.py`:

```python
import gymnasium as gym
from gymnasium.wrappers import RecordVideo
from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env

# 8 copies of the environment run side by side to collect experience faster
env = make_vec_env("CartPole-v1", n_envs=8)
model = PPO("MlpPolicy", env, verbose=1, tensorboard_log="runs/cartpole", device="cpu")
model.learn(total_timesteps=100_000)
model.save("models/ppo_cartpole")

# record one episode of the trained policy
vid = RecordVideo(gym.make("CartPole-v1", render_mode="rgb_array"), "videos/cartpole")
obs, _ = vid.reset(seed=0)
done = False
while not done:
    action, _ = model.predict(obs, deterministic=True)
    obs, reward, terminated, truncated, _ = vid.step(action)
    done = terminated or truncated
vid.close()
```

Run it, then open TensorBoard in a second terminal:

```bash
python stage1_cartpole.py
tensorboard --logdir runs
```

**What to watch:** `rollout/ep_rew_mean` (average reward per episode) climbing toward 500. Reward here is +1 per step the pole stays up, so the score literally means "steps
survived".

Try this:

- [ ] Train for 10,000 steps instead of 100,000 and compare the videos.
- [ ] Replace `model.predict` with `vid.action_space.sample()` to see a random policy,
      your baseline.
- [ ] Set `n_envs=1` and note how much slower learning gets in wall-clock time.

## Stage 2: MuJoCo Ant and HalfCheetah

A physics body with motors at every joint learns to run from random flailing, and it's
the first place you'll catch reward hacking in the act.

HalfCheetah is a 2D runner; Ant is a four-legged body in 3D. Both reward forward speed
and charge a small cost for using the motors. This stage uses SAC, which learns from a
replay buffer and suits these continuous-control tasks, and saves a checkpoint every
100,000 steps so you can watch the gait evolve.

`stage2_train.py`:

```python
import sys
import gymnasium as gym
from stable_baselines3 import SAC
from stable_baselines3.common.callbacks import CheckpointCallback

env_id = sys.argv[1] if len(sys.argv) > 1 else "HalfCheetah-v5"   # or Ant-v5
tag = env_id.split("-")[0].lower()

env = gym.make(env_id)
model = SAC("MlpPolicy", env, verbose=1, tensorboard_log=f"runs/{tag}", device="cuda")
save = CheckpointCallback(save_freq=100_000, save_path=f"models/{tag}", name_prefix=tag)
model.learn(total_timesteps=1_000_000, callback=save)
```

`stage2_record.py` turns every checkpoint into a clip, oldest first:

```python
import glob, os, sys
import gymnasium as gym
from gymnasium.wrappers import RecordVideo
from stable_baselines3 import SAC

env_id = sys.argv[1] if len(sys.argv) > 1 else "HalfCheetah-v5"
tag = env_id.split("-")[0].lower()
ckpts = sorted(glob.glob(f"models/{tag}/*.zip"), key=os.path.getmtime)

for ckpt in ckpts:
    model = SAC.load(ckpt)
    name = os.path.basename(ckpt)[:-4]
    env = RecordVideo(gym.make(env_id, render_mode="rgb_array"), f"videos/{tag}", name_prefix=name)
    obs, _ = env.reset(seed=0)
    for _ in range(1000):
        action, _ = model.predict(obs, deterministic=True)
        obs, reward, terminated, truncated, _ = env.step(action)
        if terminated or truncated:
            break
    env.close()
```

```bash
python stage2_train.py HalfCheetah-v5
python stage2_record.py HalfCheetah-v5
```

**What to watch:** the reward curve in TensorBoard, then the clips in order. Early clips
flail; later ones settle into a rhythm nobody programmed.

**Reward hacking to look for:** HalfCheetah is known for sometimes flipping onto its
back and running upside down, because the reward only measures forward speed. It's the
same family of exploit as Embark's robots that suddenly started walking on two legs. If
you see it, that's the lesson: **the agent optimizes exactly what you reward, not what
you meant.**

Try this:

- [ ] Train Ant-v5 and compare its gait to the checkpoints of HalfCheetah.
- [ ] Swap SAC for PPO (same lines, plus `n_envs` via `make_vec_env`) and compare how
      many steps each needs.

## Stage 3: GPU-parallel quadruped

MuJoCo Playground runs thousands of robot copies on the GPU at once, which its authors
say trains policies in minutes on a single GPU (MuJoCo Playground paper). Here a
Unitree Go1 learns to follow a joystick.

**Why it's so much faster:** in stage 2, the CPU stepped one physics world at a time and
handed data to the network. Here the physics (MJX, MuJoCo rewritten in JAX), the network
and the training update all live on the 4090, so thousands of robots step together with
no copying back and forth.

The joystick task is the game-relevant one. The policy gets a command (forward speed,
sideways speed, turn rate) and is rewarded for matching it while staying upright and
smooth. That's the split Embark described: **game logic decides where to go, the
learned policy decides how to walk there.**

Install from source (the project recommends it for the latest fixes), inside WSL2:

```bash
git clone https://github.com/google-deepmind/mujoco_playground.git
cd mujoco_playground
uv venv --python 3.12 && source .venv/bin/activate
uv pip install -U "jax[cuda12]"
python -c "import jax; print(jax.default_backend())"   # gpu
uv --no-config sync --all-extras
```

Smoke test, then the quadruped:

```bash
uv --no-config run train-jax-ppo --env_name CartpoleBalance
uv --no-config run train-jax-ppo --env_name Go1JoystickFlatTerrain
uv --no-config run train-jax-ppo --env_name Go1JoystickRoughTerrain
```

The first locomotion run downloads the robot models (MuJoCo Menagerie) automatically.
Run `train-jax-ppo --help` for the current checkpoint, video and step-count flags; they
change between releases.

Watch it while it trains with rscope, Playground's live trajectory viewer:

```bash
uv pip install rscope
uv --no-config run train-jax-ppo --env_name Go1JoystickFlatTerrain --rscope_envs 16 --run_evals=False --deterministic_rscope=True
python -m rscope   # in a second terminal
```

Try this:

- [ ] Compare flat and rough terrain policies by running the flat one on rough ground.
- [ ] Note the wall-clock time for each run; that's your 4090 benchmark for the
      write-up.
- [ ] Look at the other Go1 tasks Playground ships, such as fall recovery and
      handstand.

NVIDIA Isaac Lab, built on Isaac Sim, is the heavier-weight alternative for the same
kind of GPU-parallel training, with more robots and sensors but a bigger install.

## Stage 4: ARC-RL and the Leaper

ARC-RL is an open-source set of four MuJoCo robots modeled on ARC Raiders' machines,
built to study the game-specific problem: **getting a walk that looks right, not just
one that's fast** (ARC-RL paper).

| Robot   | Body                       | Joints (DoF) |
| ------- | -------------------------- | ------------ |
| Leaper  | Quadruped, three-link legs | 12           |
| Bastion | Armored hexapod            | 12           |
| Queen   | Tall hexapod               | 18           |
| Tick    | Compact hexapod            | 18           |

The reward is the interesting part. All four robots share one reward formula; only a
few weights change per robot. Its pieces, per the paper:

- **Velocity tracking:** match the commanded speed (like the stage 3 joystick).
- **Survive bonus:** points for staying upright.
- **Gait compliance:** a bonus for stepping in a set rhythm and a cost for breaking it.
  This is where style enters: it's a hand-designed walking pattern written as a reward
  instead of an animation.
- **Action regularizers:** penalties for jerky, wasteful motor commands.
- **Three safety penalties and a posture anchor:** keep the body level and out of
  dangerous poses.

**Central Pattern Generators (CPGs).** The repo also ships a hand-built CPG walker per
robot: oscillators that drive the legs in a fixed rhythm, the robotics cousin of the
procedural gait in Strider. The paper uses them as reference walkers and as starter
data, and compares learning from scratch (SAC) with learning that starts from CPG data
(SACfD and others).

Getting started: clone the repo and follow its README for install and training
commands; the README wasn't reachable when this plan was written, so the exact script
names aren't here.

```bash
git clone https://github.com/CarloRomeo427/ARC_RL.git
cd ARC_RL
```

Try this:

- [ ] Record the Leaper's CPG walker, then a policy trained from scratch, side by side.
- [ ] Train with prior CPG data and compare how quickly it learns a stable gait.
- [ ] Set the gait-compliance weight to zero and watch what "fast but ugly" looks like;
      that's the tradeoff a game studio has to manage.

## Stage 5: Memory with an LSTM policy

This stage is where RNNs and RL meet: you hide information from the agent and test
whether a memory-based policy (an LSTM, a kind of RNN) beats a memoryless one.

**Experiment A: CartPole without velocities.** Remove the cart and pole speeds from the
observation. A single snapshot can't tell a pole that's falling from one that's rising,
so the agent has to remember the last few frames.

**Experiment B: Ant with a broken leg.** At the start of each episode one leg goes limp,
and the observation doesn't say which. The agent has to work out which leg is dead from
how its body responds, then adapt its gait.

`stage5_memory.py`:

```python
import sys
import numpy as np
import gymnasium as gym
from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import VecFrameStack
from sb3_contrib import RecurrentPPO

class HideVelocity(gym.ObservationWrapper):
    """CartPole sees only cart position and pole angle."""
    def __init__(self, env):
        super().__init__(env)
        self.observation_space = gym.spaces.Box(-np.inf, np.inf, (2,), np.float32)
    def observation(self, obs):
        return obs[[0, 2]].astype(np.float32)

class BrokenLeg(gym.ActionWrapper):
    """One random leg's two motors are switched off each episode (Ant's actions come in pairs per leg)."""
    def reset(self, **kwargs):
        self.leg = np.random.randint(4)
        return self.env.reset(**kwargs)
    def action(self, act):
        act = np.array(act, copy=True)
        act[2 * self.leg: 2 * self.leg + 2] = 0.0
        return act

exp, policy = sys.argv[1], sys.argv[2]          # exp: cartpole | ant   policy: mlp | stack | lstm
if exp == "cartpole":
    make, steps = (lambda: HideVelocity(gym.make("CartPole-v1"))), 300_000
else:
    make, steps = (lambda: BrokenLeg(gym.make("Ant-v5"))), 3_000_000

env = make_vec_env(make, n_envs=8)
log = f"runs/memory_{exp}_{policy}"
if policy == "lstm":
    model = RecurrentPPO("MlpLstmPolicy", env, verbose=1, tensorboard_log=log)
else:
    if policy == "stack":
        env = VecFrameStack(env, n_stack=4)     # memoryless network, but it sees the last 4 frames
    model = PPO("MlpPolicy", env, verbose=1, tensorboard_log=log)
model.learn(total_timesteps=steps)
model.save(f"models/memory_{exp}_{policy}")
```

```bash
for p in mlp stack lstm; do python stage5_memory.py cartpole $p; done
for p in mlp stack lstm; do python stage5_memory.py ant $p; done
```

When you run an LSTM policy yourself, it has to carry its memory between steps:

```python
state, start = None, np.ones((1,), dtype=bool)
action, state = model.predict(obs, state=state, episode_start=start, deterministic=True)
start = np.array([terminated or truncated])
```

Record your results (final `rollout/ep_rew_mean` from TensorBoard):

| Experiment              | Plain MLP (no memory) | MLP + 4 stacked frames | LSTM |
| ----------------------- | --------------------- | ---------------------- | ---- |
| CartPole, no velocities |                       |                        |      |
| Ant, random broken leg  |                       |                        |      |

**What to expect:** the plain MLP should struggle on CartPole, while stacked frames and
the LSTM both recover. The broken leg is the fairer test of memory, because the clue
(which leg is dead) has to be inferred over many steps, and stacking 4 frames may not be
enough.

## Debugging and reward hacking

**Most failed runs are a reward problem or a scaling problem, not a bug in the
algorithm; check the reward first.**

| Symptom                                                            | Likely cause                                       | First fix                                                                            |
| ------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Reward rises, behavior looks absurd (flipping, hopping, vibrating) | The reward pays for something you didn't mean      | Watch a video, then add a penalty or condition for the exploit                       |
| Robot learns to stand still                                        | Survive bonus outweighs the speed reward           | Lower the survive bonus or raise the tracking weight                                 |
| Jittery, buzzing joints                                            | No cost on jerky actions                           | Add or raise an action-smoothness penalty                                            |
| Reward flat from the start                                         | Observations or rewards on wildly different scales | Normalize them (`VecNormalize` in Stable-Baselines3)                                 |
| Learns, then collapses                                             | Updates too large                                  | Lower the learning rate; for PPO, check the clip range                               |
| Different result every run                                         | Random seeds, and TF32 math on RTX 30/40 cards     | Fix seeds, set `JAX_DEFAULT_MATMUL_PRECISION=highest`, run 3 seeds before concluding |

Habits that save hours:

- [ ] Record a video at every checkpoint; reward curves hide exploits that are obvious
      on screen.
- [ ] Change one thing per run and name the run after it (`ant_lr1e-4`,
      `ant_noSurvive`).
- [ ] Compare against a baseline: a random policy, or the previous best run.
- [ ] Keep a short run log: date, change, final reward, one line on what the video
      showed.

## Taking it back to games and the web

A trained policy is just a small neural network, so you can export it to ONNX and run it
in a browser or game engine without any of the training stack.

Export a Stable-Baselines3 PPO policy (pattern from the SB3 export guide):

```python
import torch as th
from stable_baselines3 import PPO

class OnnxablePolicy(th.nn.Module):
    def __init__(self, policy):
        super().__init__()
        self.policy = policy
    def forward(self, obs):
        return self.policy(obs, deterministic=True)   # returns actions, values, log_prob

model = PPO.load("models/ppo_cartpole.zip", device="cpu")
dummy = th.randn(1, *model.observation_space.shape)
th.onnx.export(OnnxablePolicy(model.policy), dummy, "cartpole_policy.onnx",
               opset_version=17, input_names=["input"])
```

Run it in the browser with onnxruntime-web:

```js
import * as ort from "onnxruntime-web";

const session = await ort.InferenceSession.create("cartpole_policy.onnx");
const input = new ort.Tensor("float32", Float32Array.from(obs), [1, obs.length]);
const out = await session.run({ input });
const action = Object.values(out)[0].data[0]; // first output = the action
```

If you trained with `VecNormalize`, export its observation mean and variance too and
apply them in JavaScript before each call, or the policy sees numbers it never trained
on.

### Ideas for Perceptron Lab and the portfolio

- [ ] A new numbered lab on perceptronlab.com (for example "06 Reinforcement
      Learning"), with a trained CartPole policy running live in the page next to a
      random one. Note: a CartPole MLP is small enough to run as hand-rolled JS matmuls
      from exported weights JSON (the site's "no heavy deps" convention) instead of
      adding onnxruntime-web.
- [ ] A "watch it learn" strip: the stage 2 checkpoint videos in order, from flailing to
      running.
- [ ] The stage 5 results table as an interactive chart: memory versus no memory.
- [ ] A write-up comparing Strider (procedural), a Playground Go1 (learned) and an
      ARC-RL Leaper (learned with style rewards).

## Sources

- _Learning to Move: Physics-Based Enemy Locomotion in ARC Raiders_ — GDC 2026 talk by
  Embark's machine learning research lead
- 4Gamer GDC 2026 report on the talk (Japanese): why Embark rejected hand animation,
  mocap and procedural animation
- _ARC-RL: A Reinforcement Learning Playground Inspired by ARC Raiders_ and its code
  (github.com/CarloRomeo427/ARC_RL)
- MuJoCo Playground paper and repository (github.com/google-deepmind/mujoco_playground)
- JAX installation guide: GPU wheels are Linux-only
- Stable-Baselines3: exporting models

The stage 5 wrappers were checked against Gymnasium 1.4 (CartPole-v1, Ant-v5,
HalfCheetah-v5 load and step); the training scripts were not run end to end.
