const rand    = (a, b, r) => a + r * (b - a)
const randInt = (a, b, r) => Math.floor(rand(a, b, r))

console.log('randInt(3, 0, 0):', randInt(3, 0, 0));
console.log('randInt(3, 0, 0.999):', randInt(3, 0, 0.999));
console.log('randInt(0, 3, 0):', randInt(0, 3, 0));
console.log('randInt(0, 3, 0.999):', randInt(0, 3, 0.999));


