---
name: mathviz-interactive-visualizer
description: Use when creating, improving, or validating self-contained interactive math and science concept visualizations inspired by the MathViz agent workflow. This standalone skill helps agents produce animated HTML learning pages with scientific modeling, KaTeX formulas, controls, quality checks, and repair guidance without relying on any external project files.
---

# MathViz Interactive Visualizer

Use this standalone skill to turn math or science concepts into self-contained interactive HTML learning pages. It is inspired by the MathViz agent workflow, but does not depend on the MathViz application, repository layout, build system, prompts, or APIs.

## When To Use

- Creating a single HTML file that teaches a math, physics, chemistry, computer science, statistics, or engineering concept.
- Repairing an existing interactive explanation so it has clearer science, controls, animation, formulas, and safer JavaScript.
- Validating generated HTML against MathViz-style quality rules.

For the reusable method, read `references/method.md`. For generation rules and validation criteria, read `references/html-quality.md`.

## Concept Input

Collect or infer these fields:

- `conceptName` required: the concept to visualize.
- `subject` optional: math, physics, chemistry, computer science, data, or general.
- `conceptOverview` optional: short explanation and intended audience.
- `designIdea` optional: interaction or animation direction.
- `keyPoints` optional: 2-6 learning points.
- `language` optional: `zh-CN` or `en-US`.

If details are missing, make conservative assumptions and proceed. Ask only when scientific correctness would be ambiguous.

## Standalone Workflow

1. Build a scientific model before writing UI:
   - `core_formulas`: canonical formulas and variable meanings.
   - `mechanism`: cause-effect dynamics to show visually.
   - `constraints`: invariants, domains, units, or limiting cases.
   - `forbidden_errors`: common misconceptions or invalid visual behavior.
2. Design an interaction that exposes the mechanism directly. Prefer sliders, toggles, play/pause/reset, and live formula/value linkage.
3. Generate a complete HTML5 document:
   - Include `<!DOCTYPE html>`, `<html>`, `<head>`, and `<body>`.
   - Use Tailwind CDN only for styling when external CSS is needed.
   - Use pure JavaScript with clear state/update/render separation.
   - Prefer `requestAnimationFrame` for animation.
   - Use `\(...\)` and `\[...\]` for math so KaTeX can render it.
   - Include at least one animation control and one parameter control.
4. Validate and repair:
   - Run `node scripts/validate-mathviz-html.mjs <html-file>` from this skill directory when validating a generated file.
   - Treat validation errors as blockers.
   - Treat warnings as repair prompts unless the warning is intentional and harmless.
5. Deliver the HTML file or patch. Mention validation results and any remaining limitations.

## Safety And Quality Rules

- Do not use `eval`, `new Function`, dynamic script construction, or arbitrary remote scripts.
- Allowed external scripts are Tailwind CDN and KaTeX from jsDelivr.
- Keep generated HTML self-contained except for allowed CDN assets.
- Canvas scenes need a resize handler.
- Avoid inline event attributes; prefer `addEventListener`.
- Make the page useful as a standalone artifact: opening the file in a browser should show the explanation, animation, controls, and formulas.

## Output Contract

When generating HTML, produce one complete document, not a fragment. Prefer a clear layout:

- Header with concept title and one-sentence learning goal.
- Main visualization area using canvas, SVG, or DOM animation.
- Control panel with labeled inputs.
- Formula and explanation panel that updates as parameters change.
- Small notes for assumptions, domains, or edge cases.
