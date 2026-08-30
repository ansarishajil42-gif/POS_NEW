import fs from 'fs';
const content = fs.readFileSync('d:/Sharjeel/New_PoS/mobile_native/src/components/roles/HeadOffice.tsx', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.trim().startsWith('export function')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
