const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const files = [
  'src/styles.css',
  'src/routes/demo.aggregators.tsx',
  'src/routes/index.tsx',
  'src/routes/demo.super-admin.tsx',
  'src/routes/demo.pos-till.tsx',
  'src/routes/demo.head-office.tsx',
  'src/routes/pricing.tsx',
  'src/components/site/Footer.tsx',
  'src/routes/__root.tsx',
  'src/components/site/Navbar.tsx',
  'README.md'
];

files.forEach(file => {
  const p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/MT Nexus/g, 'cloudynationpos');
    fs.writeFileSync(p, content);
    console.log('Updated ' + file);
  }
});
