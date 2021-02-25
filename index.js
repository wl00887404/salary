const { writeFileSync } = require('fs');
const { exec } = require('child_process');
const { last, sum } = require('lodash');
const pug = require('pug');

const { programs } = require('./config');
const commentsByProgram = require('./commentsByProgram.json');
const assignments = require('./assignments.json');

const makeEventFactory = (commentDates, assignmentDates) => {
  const distinctCommentDates = new Set(commentDates);
  const distinctAssignmentDates = new Set(assignmentDates);

  return key => {
    const events = [];

    if (distinctCommentDates.has(key)) events.push('回覆問題');
    if (distinctAssignmentDates.has(key)) events.push('回覆作業問題');

    return events.join(' / ');
  };
};

const toDateString = time => {
  const date = new Date(time);

  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const calc = (name, comments, assignments) => {
  const hoursPerComment = 1 / 5;
  const hoursPerAssignment = 1 / 10;

  // 只留下日期
  commentDates = comments.map(toDateString);
  assignmentDates = assignments.map(toDateString);

  const result = new Map();
  const makeEvent = makeEventFactory(commentDates, assignmentDates);

  commentDates.forEach(date => {
    const cumulativeHours = result.get(date) || 0; // 當天已累積的時數

    result.set(date, cumulativeHours + hoursPerComment);
  });

  assignmentDates.forEach(date => {
    const cumulativeHours = result.get(date) || 0; // 當天已累積的時數

    result.set(date, cumulativeHours + hoursPerAssignment);
  });

  // map 的 forEach key value 竟然是顛倒過來的
  result.forEach((cumulativeHours, date) => {
    result.set(date, Math.ceil(cumulativeHours / 0.25) * 0.25); // 不滿 0.25 取 0.25
  });

  return Array.from(result)
    .sort(
      ([date1], [date2]) =>
        new Date(date1).getTime() - new Date(date2).getTime(),
    )
    .map(([date, cumulativeHours]) => [
      '振志',
      name,
      makeEvent(date),
      date,
      cumulativeHours,
    ]);
};

const headers = [
  '姓名',
  '學期',
  'Event / Support',
  '日期',
  '時數(最小單位：0.25 小時)',
];

const results = programs
  .map(program => program.name)
  .map(name =>
    calc(name, commentsByProgram[name], name === 'INTRO' ? assignments : []),
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
