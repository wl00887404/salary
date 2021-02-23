const { writeFileSync } = require('fs');
const { exec } = require('child_process');
const { last, sum } = require('lodash');
const pug = require('pug');

const config = require('./config');
const comments = require('./comments.json');
const assignments = require('./assignments.json');

const makeEvent = (commentSet, assignmentSet, key) => {
  const events = [];

  if (commentSet.has(key)) events.push('回覆問題');
  if (assignmentSet.has(key)) events.push('回覆作業問題');

  return events.join(' / ');
};

const toString = time => {
  const date = new Date(time);

  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const calc = (name, comments, assignments) => {
  const hoursPerComment = 1 / 5;
  const hoursPerAssignment = 1 / 10;

  comments = comments.map(toString);
  assignments = assignments.map(toString);

  const commentSet = new Set(comments);
  const assignmentSet = new Set(assignments);
  const resultMap = new Map();

  comments.forEach(comment => {
    const value = resultMap.get(comment) || 0;

    resultMap.set(comment, value + hoursPerComment);
  });

  assignments.map(toString).forEach(assignment => {
    const value = resultMap.get(assignment) || 0;

    resultMap.set(assignment, value + hoursPerAssignment);
  });

  resultMap.forEach((value, key) => {
    resultMap.set(key, Math.ceil(value / 0.25) * 0.25); // 不滿 0.25 取 0.25
  });

  return Array.from(resultMap)
    .sort(
      ([key1], [key2]) => new Date(key1).getTime() - new Date(key2).getTime(),
    )
    .map(([key, value]) => [
      '振志',
      name,
      makeEvent(commentSet, assignmentSet, key),
      key,
      value,
    ]);
};

const headers = [
  '姓名',
  '學期',
  'Event / Support',
  '日期',
  '時數(最小單位：0.25 小時)',
];

const results = config.targets
  .map(target => target.name)
  .map(name =>
    calc(
      name,
      comments.find(comment => comment.name === name).time,
      name === 'INTRO' ? assignments : [],
    ),
  )
  .flat()
  .sort((a, b) => new Date(a[3]).getTime() - new Date(b[3]).getTime());

writeFileSync(
  './result.html',
  pug.compileFile('./result.pug')({
    headers,
    results,
    sum: sum(results.map(last)),
  }),
);

exec('sensible-browser ./result.html');
process.exit();
