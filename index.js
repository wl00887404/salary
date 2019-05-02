const { writeFileSync } = require("fs");

const main = cohort => {
  // 1/4
  const comments = require(`./comments${cohort}.json`);

  // 1/6
  const assignments = require(`./assignment${cohort}.json`);

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
    .sort(
      ([key1], [key2]) => new Date(key1).getTime() - new Date(key2).getTime()
    )
    .map(([key, value]) => {
      const date = new Date(key);
      return `${date.getMonth() + 1}, ${date.getDate()}, ${value}`;
    })
    .join("\n");

  writeFileSync(
    `./result${cohort}.csv`,
    "月, 日, 時數\n" + csv + `\n, 總和, ${sum}`
  );
};

main(2);
main(3);
