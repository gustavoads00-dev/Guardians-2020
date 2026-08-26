const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the metrics accumulation
const oldAccumulation = `        if (c._sourceTab === 'branding') {
          entry.investDist += invest;
        } else {
          entry.investLeads += invest;
        }
        entry.impressions += getNum(c, ['impressions', 'Impressions', 'Impressões']);
        entry.clicks += getNum(c, ['link_click', 'inline_link_clicks', 'clicks', 'Clicks', 'Cliques no link', 'Cliques']);
        entry.views += getNum(c, ['landing_page_view', 'Visualizações da página de destino', 'Page Views']); 
        // We do NOT add entry.vendas += c.leads here anymore, because vendas (leads) comes from base_lovable!`;

const newAccumulation = `        if (c._sourceTab === 'branding') {
          entry.investDist += invest;
        } else {
          entry.investLeads += invest;
          entry.impressions += getNum(c, ['impressions', 'Impressions', 'Impressões']);
          entry.clicks += getNum(c, ['link_click', 'inline_link_clicks', 'clicks', 'Clicks', 'Cliques no link', 'Cliques']);
          entry.views += getNum(c, ['landing_page_view', 'Visualizações da página de destino', 'Page Views']);
        }`;

content = content.replace(oldAccumulation, newAccumulation);

// Replace rawDailyData mappings
const oldRaw = `    let rawDailyData = Array.from(dailyMap.values()).map(d => {
      return {
        ...d,
        date: d.displayDate,
        rawDate: d.date,
        cpa: d.vendasTrafego > 0 ? d.investTotal / d.vendasTrafego : 0,
        cpm: d.impressions > 0 ? (d.investTotal / (d.impressions / 1000)) : 0,
        ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        connectRate: d.clicks > 0 ? (d.views / d.clicks) * 100 : 0,
        pageConversion: d.views > 0 ? (d.vendasTrafego / d.views) * 100 : 0
      };
    });`;

const newRaw = `    let rawDailyData = Array.from(dailyMap.values()).map(d => {
      return {
        ...d,
        date: d.displayDate,
        rawDate: d.date,
        cpa: d.vendasTrafego > 0 ? d.investLeads / d.vendasTrafego : 0,
        cpm: d.impressions > 0 ? (d.investLeads / (d.impressions / 1000)) : 0,
        ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        connectRate: d.clicks > 0 ? (d.views / d.clicks) * 100 : 0,
        pageConversion: d.views > 0 ? (d.vendasTrafego / d.views) * 100 : 0
      };
    });`;

content = content.replace(oldRaw, newRaw);

fs.writeFileSync('src/App.tsx', content);
