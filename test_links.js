import fs from 'fs';
import path from 'path';

const workspaceDir = '/data/data/com.termux/files/home/storage/shared/tech-stack-architect';

console.log("=== Link Validation Audit ===");

let totalChecked = 0;
let totalFailed = 0;

function checkFileExists(targetPath, referer) {
    totalChecked++;
    let resolvedPath = targetPath;
    
    // Handle file:/// absolute URIs
    if (targetPath.startsWith('file:///')) {
        resolvedPath = targetPath.replace('file://', '');
    } else {
        // Resolve relative path based on referer directory
        resolvedPath = path.resolve(path.dirname(referer), targetPath);
    }
    
    // Strip anchors (#L123, etc.)
    resolvedPath = resolvedPath.split('#')[0];
    
    try {
        fs.accessSync(resolvedPath);
        console.log(`✔ OK: [${targetPath}] referenced by ${path.basename(referer)}`);
    } catch (e) {
        console.error(`❌ BROKEN: [${targetPath}] referenced by ${path.basename(referer)} (Resolved to: ${resolvedPath})`);
        totalFailed++;
    }
}

// 1. Audit DATABASE_SPECIFICATION.md
const specPath = path.join(workspaceDir, 'data/DATABASE_SPECIFICATION.md');
if (fs.existsSync(specPath)) {
    const specContent = fs.readFileSync(specPath, 'utf8');
    // Extract markdown links [text](url)
    const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(specContent)) !== null) {
        const url = match[1];
        if (url.startsWith('file:///')) {
            checkFileExists(url, specPath);
        }
    }
}

// 2. Audit content-detail.md
const contentDetailPath = path.join(workspaceDir, 'content-detail.md');
if (fs.existsSync(contentDetailPath)) {
    const contentDetailContent = fs.readFileSync(contentDetailPath, 'utf8');
    const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(contentDetailContent)) !== null) {
        const url = match[1];
        if (url.startsWith('file:///')) {
            checkFileExists(url, contentDetailPath);
        }
    }
}

// 3. Audit ui/index.html imports and links
const indexHtmlPath = path.join(workspaceDir, 'ui/index.html');
if (fs.existsSync(indexHtmlPath)) {
    const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Find stylesheet hrefs
    const hrefRegex = /href="([^"]+)"/g;
    let hrefMatch;
    while ((hrefMatch = hrefRegex.exec(indexContent)) !== null) {
        checkFileExists(hrefMatch[1], indexHtmlPath);
    }
    
    // Find script src
    const srcRegex = /src="([^"]+)"/g;
    let srcMatch;
    while ((srcMatch = srcRegex.exec(indexContent)) !== null) {
        checkFileExists(srcMatch[1], indexHtmlPath);
    }
}

// 4. Audit ui/style.css imports
const styleCssPath = path.join(workspaceDir, 'ui/style.css');
if (fs.existsSync(styleCssPath)) {
    const cssContent = fs.readFileSync(styleCssPath, 'utf8');
    const importRegex = /@import\s+url\("([^"]+)"\);/g;
    let importMatch;
    while ((importMatch = importRegex.exec(cssContent)) !== null) {
        checkFileExists(importMatch[1], styleCssPath);
    }
}

console.log(`\n=== Link Validation Summary ===`);
console.log(`Total Links Checked: ${totalChecked}`);
console.log(`Total Broken Links: ${totalFailed}`);

if (totalFailed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
