/**
 * 文件名称：check-progress.js
 * 文件作用：快速查看 M1 实验批次的进度概览
 * 实现方式：读取 results/M1.json，输出已完成数、成功数、部分成功数及错误数
 */

const d = require('./results/M1.json');
console.log('M1 Progress: ' + d.completed + '/' + d.total + ' | Success: ' + d.successCount + ' | Partial: ' + d.partialCount + ' | Error: ' + d.errorCount);
