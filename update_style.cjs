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
    
    // Replace card borders and shadow
    newContent = newContent.replace(/bg-white([^"]*)border-border([^"]*)shadow-sm/g, 'bg-white$1border-charcoal shadow-soft');
    
    // Some cards don't have shadow-sm but just border-border? Let's fix Dashboard and AccountCard mainly:
    newContent = newContent.replace(/bg-white border border-border/g, 'bg-white border border-charcoal');
    
    // Ensure shadow-sm is shadow-soft for cards
    newContent = newContent.replace(/rounded-xl p-5 shadow-sm/g, 'rounded-xl p-5 shadow-soft');
    newContent = newContent.replace(/rounded-2xl shadow-sm p-6/g, 'rounded-2xl shadow-soft p-6');
    newContent = newContent.replace(/rounded-2xl p-8 sm:p-12 text-center shadow-sm/g, 'rounded-2xl p-8 sm:p-12 text-center shadow-soft');
    
    // Also change hover:accent for the accent buttons to accent-hover, but that might be okay.
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log('Updated', filePath);
    }
  }
});
