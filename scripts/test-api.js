/**
 * 文件名称：test-api.js
 * 文件作用：快速验证 LLM API 连通性，发送简单请求确认密钥和端点可用
 * 实现方式：使用 OpenAI SDK 向配置的 API 端点发送一条简短消息，
 *          输出返回内容或错误信息
 */

const OpenAI = require('openai');
const c = new OpenAI({
  apiKey: 'sk-c6ws6881h3xkwxhwj48q8ufxplghilcg37v13vtmbm2cmlx8',
  baseURL: 'https://api.xiaomimimo.com/v1'
});
c.chat.completions.create({
  model: 'mimo-v2.5-pro',
  messages: [{role: 'user', content: 'Say hello in 5 words'}],
  max_tokens: 50,
  stream: false
}).then(r => {
  console.log('SUCCESS:', r.choices[0].message.content);
}).catch(e => {
  console.log('ERROR:', e.message || e);
});
