/**
 * prompt-builder.ts - Prompt 构建器
 *
 * 根据生成阶段和输入参数构建 LLM 的 system/user prompt 对。
 * 支持三种 prompt 类型：
 *   1. 'interactive-scientific-model' — 科学建模阶段，生成结构化 JSON 约束
 *   2. 'interactive-html' — HTML 生成阶段，生成完整交互式页面
 *   3. 'interactive-html-repair' — 自动修复阶段，根据错误诊断修复 HTML
 * 使用 prompt-templates 中的模板，通过变量替换生成最终 prompt。
 *
 * @exports buildPrompt - 构建指定阶段的 prompt
 */

import {
  interactiveHtmlSystem,
  interactiveHtmlUser,
  repairSystem,
  repairUser,
  scientificModelSystem,
  scientificModelUser,
} from './prompt-templates';
import type { BuildPromptResult, InteractiveAgentDependencies } from './types';

function render(tpl: string, vars: Record<string, unknown>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

export function buildPrompt(
  promptId: 'interactive-scientific-model' | 'interactive-html' | 'interactive-html-repair',
  variables: Record<string, unknown>,
): BuildPromptResult {
  if (promptId === 'interactive-scientific-model') {
    return { system: scientificModelSystem, user: render(scientificModelUser, variables) };
  }
  if (promptId === 'interactive-html') {
    return { system: interactiveHtmlSystem, user: render(interactiveHtmlUser, variables) };
  }
  return { system: repairSystem, user: render(repairUser, variables) };
}

export const defaultDepsBuildPrompt: InteractiveAgentDependencies['buildPrompt'] = (id, vars) =>
  buildPrompt(id, vars);
