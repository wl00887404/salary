const { readFileSync, writeFileSync } = require("fs");
const pug = require("pug");

const readYaml = (path) =>
  readFileSync(path, { encoding: "utf-8" })
    .split("\n")
    .filter((x) => x.trim())
    .map((raw) => new Date(raw))
    .map((date) => `2020-${date.getMonth() + 1}-${date.getDate()}`);

// 1/4
const hoursPerComment = 1 / 4;
const comments = readYaml("./comments.yaml");

// 1/6
// 學期一是 1/10 你要先講
const hoursPerAssignment = 1 / 10;
const assignments = readYaml("./assignments.yaml");

const commentsSet = new Set(comments);
const assignmentsSet = new Set(assignments);
const makeEvent = (key) => {
  const events = [];

  if (commentsSet.has(key)) events.push("回復問題");
  if (assignmentsSet.has(key)) events.push("回復作業問題");

  return events.join(" / ");
};

const resultMap = new Map();

comments.forEach((comment) => {
  const value = resultMap.get(comment) || 0;
  resultMap.set(comment, value + hoursPerComment);
});

assignments.forEach((assignment) => {
  const value = resultMap.get(assignment) || 0;
  resultMap.set(assignment, value + hoursPerAssignment);
});

resultMap.forEach((value, key) => {
  resultMap.set(key, Math.ceil(value / 0.25) * 0.25); // 不滿 0.25 取 0.25
});

let sum = 0;
resultMap.forEach((value) => {
  sum += value;
});

const headers = [
  "姓名",
  "學期",
  "Event / Support",
  "日期",
  "時數(最小單位：0.25 小時)",
];

const result = Array.from(resultMap)
  .sort(([key1], [key2]) => new Date(key1).getTime() - new Date(key2).getTime())
  .map(([key, value]) => ["振志", "INTRO", makeEvent(key), key, value]);

// const csv = result.map(columns => columns.join(", ")).join("\n");

// // with bom
// writeFileSync(
//   "./result.csv",
//   `\uFEFF${headers.join(", ")}\n${csv}\n\n,,,總和, ${sum}`
// );

writeFileSync(
  "./result.html",
  pug.compileFile("./result.pug")({
    headers,
    result,
    sum,
  })
);
