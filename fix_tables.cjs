const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace `processed?.creativeData` with `processed?.creativeDataCaptacao` for the first table
content = content.replace(/processed\?\.creativeData/g, 'processed?.creativeDataCaptacao');

// Duplicate the entire table component logic to render Branding
// I will just append a new table after the first one

const tableStartString = `<div className="overflow-x-auto">`;
const tableEndString = `</table>\n              </div>`;

const startIndex = content.indexOf(tableStartString);
const endIndex = content.indexOf(tableEndString) + tableEndString.length;

if (startIndex !== -1 && endIndex !== -1) {
  const captacaoTableCode = content.substring(startIndex, endIndex);
  
  // Replace references to creativeDataCaptacao in the new block to creativeDataBranding
  let brandingTableCode = captacaoTableCode.replace(/creativeDataCaptacao/g, 'creativeDataBranding');
  
  const brandingHeader = `
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Performance por Criativo - Branding</h3>
                </div>
              </div>
  `;
  
  const replacement = captacaoTableCode + brandingHeader + brandingTableCode;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('src/App.tsx', content);
} else {
    console.error("Could not find table boundaries");
}
