const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const files = execSync('grep -rl "MT Nexus" src/').toString().trim().split('\n');
files.forEach(file => {
  if (file && fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/MT Nexus/g, 'cloudynationpos');
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
