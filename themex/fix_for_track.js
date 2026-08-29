const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'app');

function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            scanDirectory(fullPath);
        } else if (stat.isFile() && fullPath.endsWith('.html')) {
            processHtmlFile(fullPath);
        }
    });
}

function processHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Match: @for (VAR of ARRAY; track $index)
    // We want to capture VAR (group 1)
    // Replace `track $index` with `track $1._id || $index`
    
    const regex = /@for\s*\(\s*([a-zA-Z0-9_]+)\s+of\s+([^;]+);\s*track\s+\$index\s*\)/g;
    
    content = content.replace(regex, (match, varName, arrayName) => {
        return `@for (${varName} of ${arrayName}; track ${varName}?._id || $index)`;
    });

    const regexMulti = /@for\s*\(\s*([a-zA-Z0-9_]+)\s+of\s+([\s\S]*?);\s*track\s+\$index\s*\)/g;
    content = content.replace(regexMulti, (match, varName, arrayName) => {
        return `@for (${varName} of ${arrayName}; track ${varName}?._id || $index)`;
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated track in: ${filePath}`);
    }
}

scanDirectory(srcDir);
console.log('Done fixing @for tracking.');
