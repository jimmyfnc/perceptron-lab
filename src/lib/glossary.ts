/**
 * The decoder ring: plain-words definitions for the jargon the prose
 * leans on. One sentence each, no jargon inside a definition. Rendered
 * by <Term> as a dotted-underline popover — opt-in help, never a lecture.
 */

export const GLOSSARY: Record<string, string> = {
  model:
    "A program whose behavior was tuned from examples rather than written by hand — a big pile of adjustable numbers.",
  training:
    "Showing a model examples and nudging its numbers after each one until its answers stop being wrong.",
  weights:
    "The adjustable numbers inside a model — training is the process of finding good values for them.",
  parameters:
    "Another word for a model's adjustable numbers; 'an 860M-parameter model' just counts them.",
  loss: "A single number scoring how wrong the model currently is — training is the art of pushing it down.",
  gradient:
    "The direction of steepest improvement: for every adjustable number, which way (and how hard) to nudge it.",
  "learning rate":
    "The step size of training — how big a nudge each adjustable number gets per update.",
  optimizer:
    "The rule that decides each training step from the current slope — plain SGD steps straight downhill; fancier ones add memory.",
  epoch: "One full pass through the training examples.",
  classifier: "A model whose answer is a category: spam or not, cat or dog, class 0 or class 1.",
  regularization:
    "A penalty for complexity added during training, so the model only uses as much wiggle as the data can justify.",
  hyperparameter:
    "A setting you choose before training starts (like the step size or k) rather than a number the model learns.",
  "decision boundary":
    "The dividing line a classifier draws through the space of inputs — points on one side get one label, the other side the other.",
  overfitting:
    "Memorizing the training examples instead of learning the pattern — perfect on what it saw, poor on anything new.",
  "bias–variance":
    "The classic tradeoff: a model too simple to fit the pattern (bias) versus one so flexible it fits the noise (variance).",
  neuron:
    "The smallest unit of a network: multiply each input by a weight, add them up, pass the total through a simple bend.",
  activation:
    "The small nonlinear bend applied after a neuron's sum — the ingredient that lets stacked layers model curves.",
  MLP: "A multilayer perceptron: the plainest neural network — layers of neurons where each one feeds every neuron in the next layer.",
  backpropagation:
    "The bookkeeping that works out, for every weight in the network, how much it contributed to the error — in one backwards sweep.",
  "vanishing gradient":
    "When the training signal shrinks layer by layer on its way backwards until the early layers learn nothing at all.",
  kernel:
    "A tiny grid of weights (here 3×3) slid across an image, asking the same question at every position.",
  convolution:
    "Sliding a small grid of weights across an image and recording how strongly each spot responds.",
  "feature map":
    "The grid of responses a kernel writes as it slides — bright where the image matches its pattern.",
  pooling:
    "Shrinking a feature map by keeping a summary (usually the strongest response) of each small neighborhood.",
  "receptive field":
    "The patch of the original image a deep unit can actually see, through all the layers below it.",
  token: "The chunks a language model actually reads — usually word pieces, not whole words.",
  softmax:
    "Turns a list of raw scores into percentages that are positive and sum to 1 — bigger scores get a bigger share.",
  "dot product":
    "A similarity score between two arrows of numbers: multiply matching entries and add them up — big when they point the same way.",
  attention:
    "The mechanism that lets each token score every other token for relevance and blend in the useful ones.",
  "attention head":
    "One independent copy of the attention mechanism — each layer runs many in parallel so they can specialize.",
  embedding:
    "A list of numbers standing in for a word, token, or image — chosen so similar things get nearby lists.",
  "causal mask":
    "The rule forbidding a text generator from peeking at words that come later — it may only look backwards.",
  logits: "The raw, unnormalized scores a model emits before they're turned into probabilities.",
  CLIP: "A model trained to put images and their captions near each other in the same space of numbers — how prompts get understood.",
  "cross-attention":
    "Attention pointed across modalities: the image-maker's layers reading your prompt's tokens while they work.",
  diffusion:
    "Generating by un-ruining: train a model to remove a little noise, then run it many times starting from pure static.",
  latent:
    "A compressed stand-in for an image: a much smaller grid of numbers the model works on instead of raw pixels.",
  VAE: "The encoder/decoder pair that squeezes images into the compact working format and inflates results back to pixels.",
  "U-Net":
    "The network shape doing the denoising work in Stable Diffusion — it sees the image at several zoom levels at once.",
  CFG: "Classifier-free guidance: the knob deciding how hard each denoising step is pulled toward your prompt.",
  seed: "The number that picks the starting static — same seed, same prompt, same settings → the exact same image.",
  sampler:
    "The recipe deciding how big each denoising step is and how many to take (DDIM, Euler, and friends).",
  LoRA: "A small add-on file that nudges a big model's weights toward a new style — learned cheaply by betting the change is simple.",
  rank: "How many independent directions a grid of numbers really uses — low rank means a few patterns explain almost everything.",
  "singular value":
    "How much weight a matrix puts on each of its independent patterns, sorted strongest first.",
  tensor: "Just a grid of numbers — possibly with more than two dimensions.",
  GPU: "The graphics card: thousands of tiny calculators working at once, which is exactly what all this math wants.",
  temperature:
    "A knob that reshapes the model's word-choice odds — low keeps only safe favorites, high lets long-shot words into the draw.",
  "top-p":
    "A sampling rule that keeps just enough of the likeliest words to cover a set share of the odds, and drops the rest.",
  "system prompt":
    "Standing instructions given to a model before the conversation starts — who to be, what rules to follow.",
  agent:
    "A model given tools and a goal, allowed to act, observe what happened, and decide its own next step.",
  "context window":
    "The fixed amount of text a model can hold in mind at once — everything it knows about your task must fit inside.",
};

export type GlossaryKey = keyof typeof GLOSSARY;
