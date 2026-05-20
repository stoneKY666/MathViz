/**
 * @file action.ts
 * @description 智能体动作（Action）的类型定义
 *
 * 定义了智能体执行过程中的动作接口。Action 为基础动作类型，
 * SpeechAction 继承自 Action 并扩展了语音相关的音频 ID 字段。
 *
 * @exports Action - 基础动作接口（id、type、text、narration）
 * @exports SpeechAction - 语音动作接口（扩展 audioId 字段）
 */

export interface Action {
  id?: string;
  type?: string;
  text?: string;
  narration?: string;
}

export interface SpeechAction extends Action {
  text?: string;
  narration?: string;
  audioId?: string;
}
