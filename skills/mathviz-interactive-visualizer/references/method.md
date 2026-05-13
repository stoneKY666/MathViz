# MathViz Method

This skill packages the reusable idea behind MathViz as a standalone agent workflow. It is not tied to any application framework or repository.

## Core Idea

Do not ask an LLM to directly "make a pretty page" for a concept. First make the science explicit, then make the visualization obey that science, then validate the result.

Pipeline:

1. Scientific model.
2. Visualization design.
3. Self-contained HTML generation.
4. Quality validation.
5. Repair loop.

## Scientific Model

Create a compact model before coding:

```json
{
  "core_formulas": ["formula with variables and units"],
  "mechanism": ["what changes, why it changes, what remains invariant"],
  "constraints": ["domain, limiting cases, conservation laws, assumptions"],
  "forbidden_errors": ["misleading or scientifically invalid visual behavior"]
}
```

Examples:

- Simple harmonic motion: preserve sinusoidal position/velocity/acceleration relationships; avoid showing amplitude decay unless damping is a parameter.
- Gradient descent: show current point, gradient direction, learning rate, and loss history; avoid implying every step must reduce loss for all functions and step sizes.
- Central limit theorem: animate repeated sampling and histogram convergence; avoid claiming original data must be normal.

## Visualization Design

Prefer direct manipulation over passive explanation:

- Sliders for continuous parameters.
- Toggles for binary assumptions or display layers.
- Play, pause, reset, and speed controls for time.
- Draggable points for geometry or graph concepts.
- Live values and formulas tied to the visual state.

The animation should make one mechanism obvious. If the page teaches multiple mechanisms, use tabs or layers rather than crowding one scene.

## Generation Pattern

Use a single HTML file with:

- Semantic HTML sections.
- Tailwind CDN for quick layout and visual polish when useful.
- KaTeX CDN for formulas when formulas are present.
- A small JavaScript state object.
- `update()` for physics/math state.
- `render()` for drawing.
- `requestAnimationFrame(loop)` for animation.
- `bindControls()` for event listeners.
- `reset()` for deterministic restart.

## Validation And Repair

Run `scripts/validate-mathviz-html.mjs` on generated files. If it fails:

- Fix all errors first.
- Then address warnings that could harm portability, maintainability, or learner clarity.
- Re-run validation after repair.

Validation is intentionally structural. Passing validation does not prove scientific correctness; the scientific model and user-provided requirements still need a human-quality reasoning pass.
