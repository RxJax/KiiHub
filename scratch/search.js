const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        searchDir(fullPath, query);
      }
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.js'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(query.toLowerCase())) {
        console.log(`Found in: ${fullPath}`);
      }
    }
  }
}

searchDir(process.argv[2] || '.', process.argv[3] || 'RxJax');
