/**
 * @file agent-config.ts
 * @description 智能体（Agent）配置的类型定义
 *
 * 定义了智能体的基本属性接口，包括 ID、名称、语音合成（TTS）语音类型
 * 以及语音配置（包含语音提供商、模型和语音 ID）。
 *
 * @exports AgentConfig - 智能体配置接口
 */

export interface AgentConfig {
  id?: string;
  name?: string;
  ttsVoice?: string;
  voice?: string;
  voiceConfig?: {
    providerId: string;
    modelId?: string;
    voiceId: string;
  };
}
