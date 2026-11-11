# Perceptron Lab

**Live: [perceptronlab.com](https://perceptronlab.com)**

An interactive field manual for machine learning. It walks from classical ML through
neural networks, CNNs and transformers to diffusion models, and every concept has a
hands-on instrument you can poke at: drag a decision boundary, watch gradient descent
roll downhill, slide a convolution kernel across an image, inspect attention weights,
or replay a real diffusion run from noise to image.

## Modules

| Route | Topic |
| --- | --- |
| `/foundations` | Classical ML: decision boundaries, loss, fitting |
| `/neural-networks` | Perceptrons, MLPs, backpropagation and gradient descent |
| `/interlude` | Image interpolation and resampling |
| `/computer-vision` | Convolution, Sobel edge detection, receptive fields |
| `/transformers` | Tokens, attention, multi-head attention |
| `/diffusion` | Noise schedules, denoising, CFG scale |

## How it's built

- **React 19 + TanStack Start + Vite + Tailwind 4**, deployed to **Cloudflare Workers**.
- **No charting libraries.** Every visualization is hand-rolled Canvas 2D or SVG.
- **The math is real, not faked for the animation.** Convolution, attention, SVD, MLP
  training, gradient descent and diffusion sampling live as pure TypeScript in
  [`src/lib/`](src/lib), with colocated Vitest unit tests.
- Accessibility pass: keyboard controls, visible focus, text descriptions of each
  visual result, 44px touch targets.

## Run locally

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev      # http://localhost:8080
bun run test     # unit tests for the math in src/lib
bun run build
```

See [CHANGELOG.md](CHANGELOG.md) for the project history.
