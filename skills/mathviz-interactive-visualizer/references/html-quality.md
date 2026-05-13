# MathViz HTML Quality Reference

Use this reference when generating or repairing standalone interactive concept pages.

## Scientific Model Checklist

Before writing HTML, define:

- Core formulas with variables and units when relevant.
- Mechanism shown by the animation.
- Parameter domains and limiting cases.
- Misconceptions the visualization must avoid.

The animation should reveal the model, not merely decorate text.

## Required HTML Properties

- Full document: `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`.
- Self-contained HTML with pure JavaScript.
- Tailwind CDN is allowed for styling.
- KaTeX CDN is allowed for math rendering.
- No other remote scripts unless the user explicitly asks and accepts the portability tradeoff.
- Math delimiters: prefer `\(...\)` and `\[...\]`.
- At least one visible animation.
- At least play/pause/reset or equivalent animation control.
- At least one parameter control: slider, number input, select, toggle, or draggable handle.
- State/update/render separation in JavaScript.

## Interaction Patterns By Subject

- Physics: vectors, motion trails, fields, force/mass/friction sliders, time controls.
- Math: graphs, draggable points, parameter sliders, live equation and value linkage.
- Chemistry: particles, reactions, state transitions, concentration and temperature controls.
- Computer science: step controls, highlighted algorithm state, queue/stack/graph transitions.
- Data/statistics: animated charts, filters, distributions, sampling, comparative overlays.

## Validation Errors

Treat these as blockers:

- Missing document structure.
- `eval()` or `new Function()`.
- Disallowed external scripts.
- No interactive element or event handler.
- No animation mechanism.

## Validation Warnings

Usually repair these:

- `$...$` or `$$...$$` math delimiters.
- No explicit animation control labels.
- Canvas without resize handling.
- `setInterval` without `clearInterval`.
- Inline event attributes such as `onclick` or `oninput`.

## Repair Strategy

When validation fails:

1. Preserve correct scientific content.
2. Replace unsafe or fragile JavaScript patterns.
3. Add missing controls and labels.
4. Add resize handling for canvas.
5. Convert inline handlers to `addEventListener`.
6. Re-run validation.
