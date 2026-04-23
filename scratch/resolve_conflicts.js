import fs from 'fs';
import path from 'path';

const root = 'c:\\Aagosh\\CODE\\chat-app';

function resolveFile(filePath) {
    if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('package-lock.json')) return;
    
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        return;
    }

    if (!content.includes('<<<<<<<')) return;

    console.log(`Resolving conflicts in: ${filePath}`);

    // Split by lines to handle markers accurately
    const lines = content.split(/\r?\n/);
    const newLines = [];
    let state = 'normal'; // 'normal', 'head', 'remote'

    for (const line of lines) {
        if (line.startsWith('<<<<<<<')) {
            state = 'head';
            continue;
        }
        if (line.startsWith('=======')) {
            state = 'remote';
            continue;
        }
        if (line.startsWith('>>>>>>>')) {
            state = 'normal';
            continue;
        }

        if (state === 'normal' || state === 'head') {
            newLines.push(line);
        }
    }
    
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else {
            resolveFile(fullPath);
        }
    }
}

walk(root);
console.log('Done resolving conflict markers.');
