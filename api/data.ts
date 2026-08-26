import Papa from 'papaparse';

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqfjKFDoUBtQ3srOsi-1-mzsMjSVdz5vGusc3KIde4SpdW_55vzBqydXpu7cyFFcY3sW4fni42SB3e/pub';
const SHEETS = [
  { gid: '169895505', name: 'Fb Criativos Sessão Estratégica' },
  { gid: '2002590010', name: 'Links - Criativos N8N' }
];

export default async function handler(req: any, res: any) {
    try {
      const finalPayload: Record<string, any[]> = {};
      const debugInfo = [];

      for (const sheet of SHEETS) {
        const url = `${BASE_URL}?gid=${sheet.gid}&single=true&output=csv`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sheet ${sheet.name} (Status: ${response.status})`);
        }

        const csv = await response.text();
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
        
        finalPayload[sheet.name] = parsed.data;
        debugInfo.push({
          aba: sheet.name,
          status: "ok",
          linhas: parsed.data.length
        });
      }

      res.status(200).json({
        success: true,
        totalAbas: SHEETS.length,
        abasLidas: Object.keys(finalPayload).length,
        debug: debugInfo,
        data: finalPayload
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to fetch data from Google Sheets: " + err.message });
    }
}
