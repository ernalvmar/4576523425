const fs = require('fs');
const path = require('path');

const logosDir = path.join(__dirname, '..', 'mock', 'logos');
const outputDir = path.join(__dirname, '..', 'app', 'src', 'data');

const logos = {};

// Read each logo
const files = fs.readdirSync(logosDir);
files.forEach(file => {
    const filePath = path.join(logosDir, file);
    const data = fs.readFileSync(filePath);
    const ext = path.extname(file).toLowerCase();
    let mime = 'image/png';
    if (ext === '.webp') mime = 'image/webp';
    if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';

    const base64 = data.toString('base64');
    const key = file.replace(/\.[^.]+$/, '').replace(/-/g, '_');
    logos[key] = `data:${mime};base64,${base64}`;
    console.log(`Converted: ${file} (${(data.length / 1024).toFixed(1)}KB) -> ${key}`);
});

// Write as a TS module
const output = `// Auto-generated logo data\n// Do not edit manually\n\n${Object.entries(logos).map(([k, v]) => `export const ${k.toUpperCase()} = '${v}';`).join('\n\n')}\n`;

fs.writeFileSync(path.join(outputDir, 'logos.ts'), output, 'utf8');
console.log('\nGenerated logos.ts');
