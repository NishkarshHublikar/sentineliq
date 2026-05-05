const randInt = (a, b) => {
  if (b === undefined) { b = a; a = 0 }
  const min = Math.ceil(Math.min(a, b))
  const max = Math.floor(Math.max(a, b))
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const test = (a, b) => {
  const counts = {};
  for (let i = 0; i < 10000; i++) {
    const v = randInt(a, b);
    counts[v] = (counts[v] || 0) + 1;
  }
  console.log(`randInt(${a}, ${b}):`, Object.keys(counts).sort((x, y) => x - y));
};

console.log("Testing inclusive range:");
test(0, 2); // Expected [0, 1, 2]
test(15, 17); // Expected [15, 16, 17]

console.log("\nTesting swapped arguments:");
test(2, 0); // Expected [0, 1, 2]

console.log("\nTesting single argument:");
test(2); // Expected [0, 1, 2]

console.log("\nTesting float robustness:");
test(0.5, 2.5); // Expected [1, 2]
