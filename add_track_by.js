const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processComponent(htmlPath) {
    const tsPath = htmlPath.replace('.html', '.ts');
    
    if (!fs.existsSync(tsPath)) return;

    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    let originalHtml = htmlContent;
    
    // Find *ngFor that don't have trackBy
    // Matches *ngFor="let item of list" or *ngFor="let item of list; let i = index"
    const ngForRegex = /\*ngFor\s*=\s*(["'])(.*?)(["'])/g;
    
    let htmlModified = false;
    
    htmlContent = htmlContent.replace(ngForRegex, (match, quote1, content, quote2) => {
        if (content.includes('trackBy')) return match;
        
        let newContent = content.trim();
        if (newContent.endsWith(';')) {
             newContent = newContent.slice(0, -1);
        }
        
        newContent += '; trackBy: trackByFn';
        htmlModified = true;
        return `*ngFor=${quote1}${newContent}${quote2}`;
    });

    if (htmlModified) {
        // Now update the TS file
        let tsContent = fs.readFileSync(tsPath, 'utf8');
        
        // If it doesn't already have trackByFn
        if (!tsContent.includes('trackByFn')) {
            // Check if it extends DataTableSelectionBase which now has trackByFn
            if (!tsContent.includes('DataTableSelectionBase(')) {
                // Find the last closing brace of the class
                const lastBraceIndex = tsContent.lastIndexOf('}');
                if (lastBraceIndex !== -1) {
                    const trackByMethod = `\n  trackByFn(index: number, item: any): any {\n    return item?._id || index;\n  }\n`;
                    tsContent = tsContent.slice(0, lastBraceIndex) + trackByMethod + tsContent.slice(lastBraceIndex);
                    fs.writeFileSync(tsPath, tsContent, 'utf8');
                    console.log('Added trackByFn to', tsPath);
                }
            } else {
                console.log('Skipped TS (has base class) for', tsPath);
            }
        }
        
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');
        console.log('Added trackBy to HTML', htmlPath);
    }
}

const targetDir = path.join(__dirname, 'adminx/src/app');

walkDir(targetDir, (filePath) => {
    if (filePath.endsWith('.component.html')) {
        processComponent(filePath);
    }
});
