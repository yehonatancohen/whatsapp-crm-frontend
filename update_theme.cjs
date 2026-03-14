const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content;

    newContent = newContent.replace(/bg-slate-[89]00(?:\/50)?/g, 'bg-white');
    newContent = newContent.replace(/bg-slate-950/g, 'bg-cream');
    newContent = newContent.replace(/border-slate-[78]00(?:\/50)?/g, 'border-charcoal');
    newContent = newContent.replace(/text-slate-[123]00/g, 'text-charcoal');
    newContent = newContent.replace(/text-slate-[4]00/g, 'text-muted');
    newContent = newContent.replace(/text-slate-[56]00/g, 'text-faded');
    newContent = newContent.replace(/bg-slate-700(?:\/50)?/g, 'bg-cream');
    newContent = newContent.replace(/bg-slate-900/g, 'bg-cream');
    newContent = newContent.replace(/hover:bg-slate-600/g, 'hover:bg-cream-dark');
    
    // Emerald / Accent
    newContent = newContent.replace(/focus:border-emerald-[456]00/g, 'focus:border-accent');
    newContent = newContent.replace(/focus:ring-emerald-[456]00/g, 'focus:ring-accent');
    newContent = newContent.replace(/bg-emerald-[456]00/g, 'bg-accent');
    newContent = newContent.replace(/hover:bg-emerald-[456]00/g, 'hover:bg-accent-hover');
    newContent = newContent.replace(/text-emerald-[45]00/g, 'text-accent');
    newContent = newContent.replace(/hover:text-emerald-[345]00/g, 'hover:text-accent-hover');
    
    // Append shadow-soft if the regex matches
    newContent = newContent.replace(/(bg-white border border-charcoal rounded-[a-z0-9]+ p-[0-9]+(?:\s*sm:p-[0-9]+)?)(?!.*shadow)/g, '$1 shadow-soft');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log('Updated', filePath);
    }
  }
});
