const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. We'll update the return object to include captacao metrics
content = content.replace(
  /const creativeData = Array\.from\(creativeMap\.values\(\)\)[\s\S]*?return \{/g,
  `const creativeDataBranding = Array.from(creativeMap.values())
      .filter(c => c._sourceTab === 'branding')
      .map(c => ({
      ...c,
      cpa: c.sales > 0 ? c.spend / c.sales : 0,
      ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
      conversion: c.views > 0 ? (c.sales / c.views) * 100 : 0,
      cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
      hookRate: c.impressions > 0 ? (c.hookEvents / c.impressions) * 100 : 0
    })).sort((a, b) => b.spend - a.spend);
    
    const creativeDataCaptacao = Array.from(creativeMap.values())
      .filter(c => c._sourceTab === 'captacao')
      .map(c => ({
      ...c,
      cpa: c.sales > 0 ? c.spend / c.sales : 0,
      ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
      conversion: c.views > 0 ? (c.sales / c.views) * 100 : 0,
      cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
      hookRate: c.impressions > 0 ? (c.hookEvents / c.impressions) * 100 : 0
    })).sort((a, b) => b.spend - a.spend);

    const captacaoImpressions = filteredCriativos.filter(c => c._sourceTab === 'captacao').reduce((acc, curr) => acc + getNum(curr, ['impressions', 'Impressions', 'Impressões']), 0);
    const captacaoClicks = filteredCriativos.filter(c => c._sourceTab === 'captacao').reduce((acc, curr) => acc + getNum(curr, ['link_click', 'inline_link_clicks', 'clicks', 'Clicks', 'Cliques no link', 'Cliques']), 0);
    const captacaoLandingViews = filteredCriativos.filter(c => c._sourceTab === 'captacao').reduce((acc, curr) => acc + getNum(curr, ['landing_page_view', 'Visualizações da página de destino', 'Page Views']), 0);
    const captacaoLeads = totalLeads;
    
    const captacaoCtr = captacaoImpressions > 0 ? (captacaoClicks / captacaoImpressions) * 100 : 0;
    const captacaoConnectRate = captacaoClicks > 0 ? (captacaoLandingViews / captacaoClicks) * 100 : 0;
    const captacaoPageConversion = captacaoLandingViews > 0 ? (captacaoLeads / captacaoLandingViews) * 100 : 0;
    const captacaoCpm = captacaoImpressions > 0 ? (investCaptacao / (captacaoImpressions / 1000)) : 0;
    const captacaoCpc = captacaoClicks > 0 ? (investCaptacao / captacaoClicks) : 0;
    const captacaoCpl = captacaoLeads > 0 ? (investCaptacao / captacaoLeads) : 0;

    return {
      captacaoImpressions,
      captacaoClicks,
      captacaoLandingViews,
      captacaoCtr,
      captacaoConnectRate,
      captacaoPageConversion,
      captacaoCpm,
      captacaoCpc,
      captacaoCpl,
      creativeDataBranding,
      creativeDataCaptacao,
`
);

// We need to inject `_sourceTab` into creativeMap keys
// Look for where we loop through filteredCriativos to build creativeMap
content = content.replace(
  /const creativeMap = new Map<string, CreativeMetric>\(\);\s*filteredCriativos\.forEach\(c => {/g,
  `const creativeMap = new Map<string, any>();
    filteredCriativos.forEach(c => {`
);

// We also want to assign _sourceTab to creativeMap entries
content = content.replace(
  /if \(!creativeMap\.has\(name\)\) \{\s*creativeMap\.set\(name, \{/g,
  `if (!creativeMap.has(name)) {
        creativeMap.set(name, {
          _sourceTab: c._sourceTab,`
);

// Let's replace the entry.sales logic.
// We remove `entry.sales += getNum(...)` and instead, right after the loop, we map leads.
content = content.replace(
  /entry\.sales \+= getNum\(c, \['leads', 'Leads', 'Resultados', 'Cadastro'\]\);/g,
  `// sales (leads) will be mapped from base_lovable later`
);

// Map leads from base_lovable
content = content.replace(
  /const creativeDataBranding/g,
  `// Atribui os leads diretamente da base de captação (base_lovable)
    filteredLeads.forEach(l => {
      const adName = l.ad_name || '';
      if (adName && creativeMap.has(adName)) {
        creativeMap.get(adName).sales += 1;
      } else if (adName) {
         // Create if missing? It's fine to only count if ad exists, but let's create a placeholder if it doesn't exist to not lose leads.
         creativeMap.set(adName, {
            _sourceTab: 'captacao', // assume captação
            name: adName,
            link: linkMap.get(adName) || '',
            spend: 0,
            impressions: 0,
            clicks: 0,
            views: 0,
            checkouts: 0,
            sales: 1,
            cpa: 0,
            ctr: 0,
            conversion: 0,
            cpc: 0,
            hookRate: 0,
            hookEvents: 0
         });
      }
    });

    const creativeDataBranding`
);

// Now update the UI for "Análise de Métricas" tab to use captacao* metrics
// Find the activeTab === 'metricas' block
content = content.replace(
  /<SummaryCard title="CPM" value=\{formatCurrency\(processed\.cpm\)\} icon=\{BarChart3\} color="slate" \/>/g,
  `<SummaryCard title="CPM (Captação)" value={formatCurrency(processed.captacaoCpm)} icon={BarChart3} color="slate" />`
);
content = content.replace(
  /<SummaryCard title="CTR" value=\{formatPercent\(processed\.ctr\)\} icon=\{TrendingUp\} color="slate" \/>/g,
  `<SummaryCard title="CTR (Captação)" value={formatPercent(processed.captacaoCtr)} icon={TrendingUp} color="slate" />`
);
content = content.replace(
  /<SummaryCard title="Connect Rate" value=\{formatPercent\(processed\.connectRate\)\} icon=\{ArrowUpRight\} color="slate" subtitle="Cliques → Visitas" \/>/g,
  `<SummaryCard title="Connect Rate (Captação)" value={formatPercent(processed.captacaoConnectRate)} icon={ArrowUpRight} color="slate" subtitle="Cliques → Visitas" />`
);
content = content.replace(
  /<SummaryCard title="Conversão LP" value=\{formatPercent\(processed\.pageConversion\)\} icon=\{PieChartIcon\} color="slate" subtitle="Visitas → Leads" \/>/g,
  `<SummaryCard title="Conversão LP (Captação)" value={formatPercent(processed.captacaoPageConversion)} icon={PieChartIcon} color="slate" subtitle="Visitas → Leads" />`
);

// Now the funil tab
content = content.replace(
  /value=\{formatNumber\(processed\.totalImpressions\)\}/g,
  `value={formatNumber(processed.captacaoImpressions)}`
);
content = content.replace(
  /value=\{formatNumber\(processed\.totalClicks\)\}/g,
  `value={formatNumber(processed.captacaoClicks)}`
);
content = content.replace(
  /value=\{formatNumber\(processed\.totalLandingViews\)\}/g,
  `value={formatNumber(processed.captacaoLandingViews)}`
);
// For leads in Funil, it uses `processed.totalLeads`, which is already correct for captacao.

fs.writeFileSync('src/App.tsx', content);
