const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/styles.css');
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  ['oklch(0.55 0.17 249)', '#22C55E'], // Blue to Bright Green
  ['oklch(0.995 0.005 250)', '#FFFFFF'], // primary foreground to White
  ['oklch(0.8 0.145 78)', '#16A34A'], // Amber to Darker Green
  ['oklch(0.26 0.05 70)', '#FFFFFF'], // accent foreground to White
  ['oklch(0.55 0.17 249 / 0.13)', 'rgba(34, 197, 94, 0.13)'], // mesh gradient 1
  ['oklch(0.8 0.145 78 / 0.16)', 'rgba(22, 163, 74, 0.16)'], // mesh gradient 2
  ['oklch(0.68 0.14 165)', '#4ADE80'], // success to light green / chart-2
  ['oklch(0.68 0.14 165 / 0.1)', 'rgba(74, 222, 128, 0.1)'], // mesh gradient 3
  ['oklch(0.42 0.13 255)', '#16A34A'], // text-gradient start
  ['oklch(0.66 0.13 200)', '#15803D'], // text-gradient end
  ['oklch(0.19 0.04 258)', '#111827'] // Ink to very dark slate (blackish)
];

replacements.forEach(([from, to]) => {
  content = content.split(from).join(to);
});

fs.writeFileSync(file, content);
console.log('Updated styles.css with new colors');
