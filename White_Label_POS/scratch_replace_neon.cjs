const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const files = [
    'src/styles.css',
    'src/routes/demo.super-admin.tsx',
    'src/routes/demo.head-office.tsx',
    'src/components/site/mockups.tsx',
    'src/components/site/Logo.tsx'
];

files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        // Replace both uppercase and lowercase hex codes
        content = content.replace(/#22C55E/ig, '#39ff14');
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${file}`);
    }
});
