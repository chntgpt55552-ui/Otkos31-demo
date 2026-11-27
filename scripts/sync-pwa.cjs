// Regenerate the release snapshot after changing the page or its dependencies.
const fs = require('node:fs');
const {createHash} = require('node:crypto');
const html = fs.readFileSync('index.html','utf8');
const version = html.match(/window\.otVersion = '([\w.-]+)'/)[1];
const paths = ['./','icon.svg','manifest.webmanifest',...Array.from(html.matchAll(/<script src="([^"]+)"><\/script>/g), m => m[1])];
const assets = paths.map(path => {
 const data = fs.readFileSync(path === './' ? 'index.html' : path);
 return [path,'sha256-' + createHash('sha256').update(data).digest('base64')];
});
const worker = fs.readFileSync('sw.js','utf8');
const digest = createHash('sha256').update(JSON.stringify(assets)).digest('hex').slice(0,16);
const header = "const CACHE='otkos31-demo-v" + version + '-' + digest + "';\nconst ASSETS=" + JSON.stringify(assets,null,1) + ';\n';
const next = header + worker.slice(worker.indexOf('const ROOT='));
if (process.argv.includes('--check')) {
 if (next !== worker) throw Error('Run node scripts/sync-pwa.cjs and commit sw.js');
} else fs.writeFileSync('sw.js',next);
