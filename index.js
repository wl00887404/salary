const { readFileSync, writeFileSync } = require("fs");

const readYaml = path =>
  readFileSync(path, { encoding: "utf-8" })
    .split("\n")
    .map(raw => new Date(raw))
    .map(date => `2019-${date.getMonth() + 1}-${date.getDate()}`);

// 1/4
const comments = readYaml("./comments.yaml");

// 1/6
const assignments = readYaml("./assignments.yaml");

const commentsSet = new Set(comments);
const assignmentsSet = new Set(assignments);
const makeEvent = key => {
  const events = [];

  if (commentsSet.has(key)) events.push("回復問題");
  if (assignmentsSet.has(key)) events.push("回復作業問題");

  return events.join(" / ");
};

const result = new Map();

comments.forEach(comment => {
  const value = result.get(comment) || 0;
  result.set(comment, value + 1 / 4);
});

assignments.forEach(assignment => {
  const value = result.get(assignment) || 0;
  result.set(assignment, value + 1 / 6);
});

result.forEach((value, key) => {
  result.set(key, Math.ceil(value / 0.25) * 0.25); // 不滿 0.25 取 0.25
});

let sum = 0;
result.forEach(value => {
  sum += value;
});

let csv = Array.from(result)
  .sort(([key1], [key2]) => new Date(key1).getTime() - new Date(key2).getTime())
  .map(([key, value]) => `振志, INTRO, ${makeEvent(key)}, ${key}, ${value}`)
  .join("\n");

const headers = [
  "姓名",
  "學期",
  "Event / Support",
  "日期",
  "時數(最小單位：0.25 小時)"
];

writeFileSync(`./result.csv`, `${headers.join(", ")}\n${csv}\n總和, ${sum}`);
