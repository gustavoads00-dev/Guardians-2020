import Papa from 'papaparse';

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS633xawej_g4NqY1lvC6RwrM3y717c5nk1Znqm1iE0mBYsHiICWAC4s1DORbgj5YCFZvOaHEVTdKud/pub';

const SHEETS = [
  { gid: '2115178316', name: 'base_lovable' },
  { gid: '1289271915', name: 'meta-ads_dados' },
  { gid: '1206128987', name: 'meta-ads_dados_v2' },
];

export default async function handler(req: any, res: any) {
    try {
      const finalPayload: Record<string, any[]> = {};
      const debugInfo = [];

      for (const sheet of SHEETS) {
        if (sheet.gid.startsWith('REPLACE_ME')) {
            console.log(\`Skipping \${sheet.name} because GID is not configured.\`);
            debugInfo.push({ aba: sheet.name, status: 'skipped_missing_gid', linhas: 0 });
            continue;
        }
        
        const url = \`\${BASE_URL}?gid=\${sheet.gid}&single=true&output=csv\`;
        
        try {
          const response = await fetch(url);
          
          if (!response.ok) {
            console.warn(\`Failed to fetch sheet \${sheet.name} (Status: \${response.status})\`);
            debugInfo.push({ aba: sheet.name, status: \`error_\${response.status}\`, linhas: 0 });
            continue;
          }

          const csv = await response.text();
          
          if (csv.trim().startsWith('<!DOCTYPE html>') || csv.trim().startsWith('<html')) { 
             console.warn(\`Invalid content (HTML) received for sheet \${sheet.name}. Check GID.\`);
             debugInfo.push({ aba: sheet.name, status: 'error_html_response', linhas: 0 });
             continue;
          }

          const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
          
          finalPayload[sheet.name] = parsed.data;
          debugInfo.push({
            aba: sheet.name,
            status: "ok",
            linhas: parsed.data.length
          });
        } catch (e: any) {
          console.warn(\`Error fetching \${sheet.name}: \${e.message}\`);
          debugInfo.push({ aba: sheet.name, status: 'error_exception', linhas: 0 });
        }
      }

      res.status(200).json({
        success: true,
        totalAbas: SHEETS.length,
        abasLidas: Object.keys(finalPayload).length,
        debug: debugInfo,
        data: finalPayload
      });
    } catch (err: any) {
      console.log("Fetch exception:", err);
      res.status(500).json({ success: false, error: "Failed to fetch data from Google Sheets: " + err.message });
    }
}
