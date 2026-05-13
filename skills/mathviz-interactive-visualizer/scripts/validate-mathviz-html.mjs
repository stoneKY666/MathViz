#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

function validateInteractiveHtml(html) {
  const errors = [];
  const warnings = [];

  if (!/<!doctype html>/i.test(html)) errors.push('Missing <!DOCTYPE html>.');
  if (!/<html[\s>]/i.test(html)) errors.push('Missing <html> root element.');
  if (!/<head[\s>]/i.test(html)) errors.push('Missing <head> section.');
  if (!/<body[\s>]/i.test(html)) errors.push('Missing <body> section.');

  if (/\beval\s*\(/i.test(html)) errors.push('Disallowed JavaScript pattern: eval().');
  if (/\bnew\s+Function\s*\(/i.test(html)) errors.push('Disallowed JavaScript pattern: new Function().');

  const externalScripts = Array.from(html.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi), (match) => match[1]);
  for (const src of externalScripts) {
    const lower = src.toLowerCase();
    const allowed =
      lower.includes('cdn.tailwindcss.com') ||
      lower.includes('cdn.jsdelivr.net/npm/katex@') ||
      lower.includes('cdn.jsdelivr.net/npm/katex');
    if (!allowed) errors.push(`Disallowed external script source: ${src}`);
  }

  if (/\$\$[^$]+\$\$|\$[^$\n]+\$/g.test(html)) {
    warnings.push('Found $...$ or $$...$$ math delimiters; prefer \\(...\\) and \\[...\\].');
  }

  const hasInteractiveElements =
    /<(canvas|svg|button|input|select|textarea)\b/i.test(html) ||
    /\b(addEventListener|onclick=|oninput=|onchange=|requestAnimationFrame)\b/i.test(html);
  if (!hasInteractiveElements) errors.push('No interactive controls or event handlers detected.');

  const hasAnimationMechanism =
    /\brequestAnimationFrame\b/i.test(html) ||
    /\bsetInterval\b/i.test(html) ||
    /\bsetTimeout\b/i.test(html) ||
    /@keyframes/i.test(html) ||
    /\banimation\s*:/i.test(html);
  if (!hasAnimationMechanism) errors.push('No animation mechanism detected.');

  const hasAnimationControls =
    /(play|pause|reset|speed|start|stop|开始|暂停|重置|速度|播放|停止)/i.test(html) ||
    /id=["'][^"']*(play|pause|reset|speed|start|stop)[^"']*["']/i.test(html);
  if (!hasAnimationControls) warnings.push('No explicit animation control labels detected.');

  if (/<canvas\b/i.test(html) && !/addEventListener\(\s*['"]resize['"]/i.test(html)) {
    warnings.push('Canvas detected without explicit resize handler.');
  }
  if (/\bsetInterval\b/i.test(html) && !/\bclearInterval\b/i.test(html)) {
    warnings.push('setInterval used without clearInterval cleanup.');
  }
  if (/\bon(click|change|input|mousedown|mouseup|mousemove|touchstart)=/i.test(html)) {
    warnings.push('Inline event handlers detected; prefer addEventListener.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: node validate-mathviz-html.mjs <html-file>');
  process.exit(2);
}

let html;
try {
  html = readFileSync(file, 'utf8');
} catch (error) {
  console.error(`Failed to read ${file}: ${error.message}`);
  process.exit(2);
}

const result = validateInteractiveHtml(html);
console.log(`${basename(file)}: ${result.valid ? 'valid' : 'invalid'}`);

if (result.errors.length) {
  console.log('\nErrors:');
  for (const error of result.errors) console.log(`- ${error}`);
}

if (result.warnings.length) {
  console.log('\nWarnings:');
  for (const warning of result.warnings) console.log(`- ${warning}`);
}

process.exit(result.valid ? 0 : 1);
