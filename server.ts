import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Papa from "papaparse";

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS633xawej_g4NqY1lvC6RwrM3y717c5nk1Znqm1iE0mBYsHiICWAC4s1DORbgj5YCFZvOaHEVTdKud/pub';

const SHEETS = [
  { gid: '2115178316', name: 'base_lovable' },
  { gid: '1289271915', name: 'meta-ads_dados' },
  { gid: '1206128987', name: 'meta-ads_dados_v2' }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Proxy Route
  app.get("/api/data", async (req, res) => {
    try {
      console.log("Fetching from Google Sheets...");
      
      const finalPayload: Record<string, any[]> = {};
      const debugInfo = [];

      for (const sheet of SHEETS) {
        if (sheet.gid.startsWith('REPLACE_ME')) {
            console.log(`Skipping ${sheet.name} because GID is not configured.`);
            debugInfo.push({ aba: sheet.name, status: 'skipped_missing_gid', linhas: 0 });
            continue;
        }
        
        const url = `${BASE_URL}?gid=${sheet.gid}&single=true&output=csv`;
        try {
          const response = await fetch(url);
          
          if (!response.ok) {
            console.warn(`Failed to fetch sheet ${sheet.name} (Status: ${response.status})`);
            debugInfo.push({ aba: sheet.name, status: `error_${response.status}`, linhas: 0 });
            continue;
          }

          const csv = await response.text();
          
          // Google Sheets returns HTML for invalid GIDs sometimes, checking if it looks like HTML
          if (csv.trim().startsWith('<!DOCTYPE html>') || csv.trim().startsWith('<html')) {
             console.warn(`Invalid content (HTML) received for sheet ${sheet.name}. Check GID.`);
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
          console.warn(`Error fetching ${sheet.name}: ${e.message}`);
          debugInfo.push({ aba: sheet.name, status: 'error_exception', linhas: 0 });
        }
      }

      res.json({
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
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
