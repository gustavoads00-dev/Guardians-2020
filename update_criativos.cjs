const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the criativos tab section
const oldTabContent = `<h3 className="text-lg font-bold text-slate-900">Performance por Criativo</h3>`;
const newTabContent = `<div className="bg-amber-50 text-amber-700 p-4 rounded-xl mb-4 font-medium flex items-center gap-2 border border-amber-200">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <p>Atenção: A análise e atribuição de leads por criativo contabiliza dados <strong>apenas a partir de 21/08/2026</strong>.</p>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Performance por Criativo - Captação</h3>`;

content = content.replace(oldTabContent, newTabContent);

// Fix references to creativeData in checkboxes and tables
content = content.replace(/processed\.creativeData/g, 'processed.creativeDataCaptacao');

// Duplicate the table block to render Branding next.
// Instead of complex parsing, let's just make the creative table a local component or use a wrapper, but it's simpler to just do a big replace.

fs.writeFileSync('src/App.tsx', content);
