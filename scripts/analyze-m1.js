/**
 * 文件名称：analyze-m1.js
 * 文件作用：分析 MathViz 实验结果（M2.json），输出统计报告
 * 实现方式：读取 results/M2.json，按学科类别统计成功率、平均耗时、
 *          失败概念列表、验证警告及 HTML 尺寸分布，输出至控制台
 */

const path = require('path');
const d = require(path.join(__dirname, '..', 'results', 'M2.json'));
console.log('=== M1 Full Results ===');
console.log('Completed:', d.completed, '/', d.total);
console.log('Success:', d.successCount);
console.log('Partial:', d.partialCount);
console.log('Error:', d.errorCount);
console.log('');

// Per-category stats
const categories = {};
let totalDuration = 0;
let successDurations = [];
let errorDurations = [];

for (const r of d.results) {
  const sub = r.concept.subject;
  if (!categories[sub]) categories[sub] = { total: 0, success: 0, error: 0, partial: 0, durations: [] };
  categories[sub].total++;
  categories[sub][r.status]++;
  categories[sub].durations.push(r.duration);
  totalDuration += r.duration;
  if (r.status === 'success') successDurations.push(r.duration);
  else errorDurations.push(r.duration);
}

console.log('=== Per-Category ===');
for (const [cat, s] of Object.entries(categories)) {
  const avgDur = s.durations.reduce((a,b) => a+b, 0) / s.durations.length;
  console.log(cat + ': ' + s.success + '/' + s.total + ' success (' + (s.success/s.total*100).toFixed(0) + '%) avg=' + avgDur.toFixed(1) + 's');
}

console.log('');
console.log('=== Timing ===');
console.log('Total duration: ' + (totalDuration/60).toFixed(1) + ' min');
console.log('Avg per concept: ' + (totalDuration/d.results.length).toFixed(1) + 's');
if (successDurations.length > 0) {
  console.log('Avg success: ' + (successDurations.reduce((a,b)=>a+b,0)/successDurations.length).toFixed(1) + 's');
}
if (errorDurations.length > 0) {
  console.log('Avg error: ' + (errorDurations.reduce((a,b)=>a+b,0)/errorDurations.length).toFixed(1) + 's');
}

// Failed concepts
console.log('');
console.log('=== Failed Concepts ===');
for (const r of d.results) {
  if (r.status === 'error') {
    console.log(r.concept.name + ' (' + r.concept.subject + '): ' + r.error);
  }
}

// Validation stats
const withWarnings = d.results.filter(r => r.validation && r.validation.warnings && r.validation.warnings.length > 0);
console.log('');
console.log('=== Validation ===');
console.log('Concepts with warnings:', withWarnings.length);
for (const r of withWarnings) {
  console.log('  ' + r.concept.name + ': ' + r.validation.warnings.join('; '));
}

// HTML length stats
const htmlLens = d.results.filter(r => r.htmlLength).map(r => r.htmlLength);
if (htmlLens.length > 0) {
  console.log('');
  console.log('=== HTML Size ===');
  console.log('Min:', Math.min(...htmlLens), 'chars');
  console.log('Max:', Math.max(...htmlLens), 'chars');
  console.log('Avg:', Math.round(htmlLens.reduce((a,b)=>a+b,0)/htmlLens.length), 'chars');
}
