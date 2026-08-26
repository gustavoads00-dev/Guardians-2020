const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldLinkMapLogic = `    const linksCriativos = data['Links - Criativos N8N'] || [];

    const linkMap = new Map<string, string>();
    linksCriativos.forEach(l => {
      const name = String(l['ad_name'] || '').trim();
      const link = String(l['Link'] || '').trim();
      if (name && link) linkMap.set(name, link);
    });`;

const newLinkMapLogic = `    const linkMap = new Map<string, string>();
    criativos.forEach(c => {
      const name = String(c.ad_name || c['Ad Name'] || c['Nome do anúncio'] || c['NOME DO ANÚNCIO'] || '').trim();
      const link = String(c['Creative Instagram Permalink'] || c.permalink || '').trim();
      if (name && link && !linkMap.has(name)) {
        linkMap.set(name, link);
      }
    });`;

if (content.includes(oldLinkMapLogic)) {
    content = content.replace(oldLinkMapLogic, newLinkMapLogic);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Replaced link map logic");
} else {
    console.log("Could not find the old link map logic.");
}
