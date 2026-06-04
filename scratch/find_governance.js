const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const terms = [/governance/i, /skii/i, /stake/i, /unstake/i];

console.log('Searching for files matching terms...');
walkDir('src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.json')) {
    const content = fs.readFileSync(filePath, 'utf8');
    terms.forEach(term => {
      if (term.test(content)) {
        console.log(`Found match for ${term} in ${filePath}`);
        // Log surrounding lines
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (term.test(line)) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    });
  }
});
