import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  MousePointer2, 
  BarChart3, 
  Calendar as CalendarIcon,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Filter,
  ExternalLink,
  Layers,
  PieChart as PieChartIcon,
  LayoutDashboard,
  ChevronUp,
  ChevronDown,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie,
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import { format, parse, isWithinInterval, startOfDay, endOfDay, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

interface LeadData {
  Data: string;
  Nome: string;
  'E-mail': string;
  Telefone: string;
  utm_campaign: string;
  utm_source: string;
  utm_medium: string;
  utm_term: string;
  utm_content: string;
}

interface MetaData {
  Date: string;
  'Campaign Name': string;
  'Ad Name': string;
  'Spend (Cost, Amount Spent)': string;
  Impressions: string;
  'Action Link Clicks': string;
  'Action Landing Page View': string;
  'Action 3s Video Views': string;
  'Action FB Pixel Purchase (Offsite Conversion)': string;
  'Ad Set Name': string;
}

interface CreativeLink {
  'Ad Name': string;
  Link: string;
}

interface RawData {
  'Compras Aprovadas - Principal - Final'?: any[];
  'Fb Criativos Básico ao Black'?: any[];
  'Fb Distribuição - Atração'?: any[];
  [key: string]: any[] | undefined;
}

interface ApiResponse {
  success: boolean;
  totalAbas?: number;
  abasLidas?: number;
  debug?: any[];
  data: RawData;
  error?: string;
}

interface DailyMetric {
  date: string;
  displayDate: string;
  investLeads: number;
  investDist: number;
  investTotal: number;
  lucroTotal: number;
  vendas: number;
  vendasTrafego: number;
  cpa: number;
  revenue: number;
  impressions: number;
  clicks: number;
  views: number;
  checkouts: number;
  connectRate: number;
  taxaCheckout: number;
  conversaoCheckout: number;
  cpm: number;
  ctr: number;
  pageConversion: number;
  [key: string]: any; // Support dynamic page conversion keys
}

interface CreativeMetric {
  name: string;
  link: string;
  spend: number;
  impressions: number;
  clicks: number;
  views: number;
  checkouts: number;
  sales: number;
  cpa: number;
  ctr: number;
  conversion: number;
  cpc: number;
  hookRate: number;
  hookEvents: number;
}

interface PageMetric {
  name: string;
  views: number;
  sales: number;
  conversion: number;
  revenue: number;
  returnPerCustomer: number;
  spend: number;
  cpa: number;
  checkouts: number;
  checkoutRate: number;
  checkoutConversion: number;
}

interface ProductMetric {
  name: string;
  sales: number;
}

// --- Constants & Helpers ---

const API_URL = '/api/data';
const COST_MULTIPLIER = 1.1215;
const SOURCE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'];

const parseBrNumber = (val: string | undefined): number => {
  if (!val) return 0;
  // Handle "1.234,56" or "1234,56"
  const clean = val.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const parseBrDate = (dateStr: any): Date => {
  if (!dateStr) return startOfDay(new Date());
  if (dateStr instanceof Date) return startOfDay(dateStr);
  
  if (typeof dateStr === 'string') {
    // Handle DD/MM/YYYY specifically to avoid TZ shifts
    const dmyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed
      const year = parseInt(dmyMatch[3], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }

    // Handle ISO strings (YYYY-MM-DD)
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }
    
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return startOfDay(d);
  }

  return startOfDay(new Date());
};

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatNumber = (val: number) => 
  new Intl.NumberFormat('pt-BR').format(val);

const formatPercent = (val: number) => 
  `${val.toFixed(2)}%`;

// --- Components ---

const SummaryCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  suffix = "", 
  prefix = "",
  color = "blue",
  subtitle,
  className
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend?: number; 
  suffix?: string;
  prefix?: string;
  color?: "blue" | "green" | "amber" | "rose" | "indigo" | "purple" | "slate" | "emerald";
  subtitle?: string;
  className?: string;
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className={cn("bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2 rounded-xl border", colorClasses[color])}>
          <Icon size={18} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full",
            trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend >= 0 ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="notranslate">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">{title}</p>
        <h3 className="text-xl font-black text-slate-900 leading-tight">
          {prefix}{value}{suffix}
        </h3>
        {subtitle && <p className="text-[10px] text-slate-400 font-medium mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col", className)}>
    <div className="mb-6 notranslate">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
    </div>
    <div className="flex-1 min-h-[300px] w-full">
      {children}
    </div>
  </div>
);

const TabButton = ({ active, onClick, children, icon: Icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: any }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-all rounded-xl",
      active 
        ? "text-indigo-600 bg-white shadow-sm" 
        : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
    )}
  >
    <Icon size={16} />
    {children}
  </button>
);

const FunnelStep = ({ label, value, subValue, color, isLast }: { label: string; value: string; subValue?: string; color: string; isLast?: boolean }) => (
  <div className="flex flex-col items-center w-full max-w-xl mx-auto">
    <div className={cn("w-full p-6 rounded-2xl text-white shadow-lg transform transition-transform hover:scale-[1.01] flex items-center justify-between", color)}>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">{label}</span>
        <div className="text-3xl font-black">{value}</div>
        {subValue && <div className="text-xs mt-1 font-bold opacity-90 bg-black/10 px-2 py-0.5 rounded-lg w-fit">{subValue}</div>}
      </div>
    </div>
  </div>
);

const FunnelConversion = ({ value, label }: { value: string, label: string }) => (
  <div className="flex flex-col items-center py-4">
    <div className="w-px h-12 bg-slate-200 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-indigo-100 rounded-full px-6 py-2.5 text-sm font-black text-indigo-600 shadow-md whitespace-nowrap flex items-center gap-2">
        <TrendingUp size={16} className="text-emerald-500" />
        <span>{value}</span>
        <span className="text-slate-400 uppercase text-[10px] tracking-widest">{label}</span>
      </div>
    </div>
  </div>
);

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={handleCopy}
      title="Copiar link"
      className={cn(
        "p-1.5 rounded-lg transition-colors border flex-shrink-0",
        copied ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white text-slate-400 hover:text-indigo-600 border-slate-200 hover:border-indigo-200"
      )}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

// --- Main App ---

export default function App() {
  const [data, setData] = useState<RawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'metricas' | 'funil' | 'criativos'>('geral');
  const [creativeSearch, setCreativeSearch] = useState('');
  const [schema, setSchema] = useState<Record<string, string[]>>({});
  const [creativeSort, setCreativeSort] = useState<{ key: keyof CreativeMetric; direction: 'asc' | 'desc' }>({ key: 'sales', direction: 'desc' });
  const [pageSort, setPageSort] = useState<{ key: keyof PageMetric; direction: 'asc' | 'desc' }>({ key: 'sales', direction: 'desc' });
  const [selectedCreatives, setSelectedCreatives] = useState<Set<string>>(new Set());
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeQuickRange, setActiveQuickRange] = useState<number | 'today' | 'yesterday' | 'max' | null>(null);
  
  // Date Range State
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfDay(new Date(2026, 0, 1)),
    end: endOfDay(new Date())
  });

  const [maxAvailableDate, setMaxAvailableDate] = useState<Date>(new Date());
  const [minAvailableDate, setMinAvailableDate] = useState<Date>(new Date(2026, 0, 1));

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      const contentType = response.headers.get("content-type");
      
      if (!response.ok || (contentType && !contentType.includes("application/json"))) {
        const text = await response.text();
        console.log("Non-OK or Non-JSON response:", response.status);
        
        if (response.status === 403) {
          setError("Acesso Negado (403). No Google Apps Script, verifique se a implantação está configurada exatamente assim:\n1. Executar como: 'Eu' (seu email)\n2. Quem tem acesso: 'Qualquer pessoa'.\nATENÇÃO: Você deve gerar uma 'Nova versão' (em Gerenciar implantações > Editar > Versão > Nova versão) para aplicar as mudanças.");
        } else {
          try {
            // Attempt to parse JSON anyway in case the backend sent JSON with the wrong content-type
            const maybeJson = JSON.parse(text);
            if (maybeJson.error) {
              setError(maybeJson.error);
            } else {
              setError(`Erro do servidor (${response.status}): Resposta inválida.`);
            }
          } catch (e) {
            setError(`Erro do servidor (${response.status}): Falha ao carregar dados. Verifique a URL do Google Script.`);
          }
        }
        setLoading(false);
        return;
      }

      const json: ApiResponse = await response.json();
      if (json.success) {
        setData(json.data);
        // Extract schema
        const newSchema: Record<string, string[]> = {};
        Object.entries(json.data).forEach(([sheetName, rows]) => {
          if (rows && rows.length > 0) {
            newSchema[sheetName] = Object.keys(rows[0]);
          }
        });
        setSchema(newSchema);

        // Update end date based on all relevant sheets column A
        const criativos = json.data['Fb Criativos Básico ao Black'] || [];
        const compras = json.data['Compras Aprovadas - Principal - Final'] || [];
        const distribuicao = json.data['Fb Distribuição - Atração'] || [];
        
        const allDates: number[] = [];
        
        [criativos, compras, distribuicao].forEach(sheet => {
          sheet.forEach(row => {
            const d = Object.values(row)[0];
            if (!d || !String(d).trim()) return;
            const parsed = parseBrDate(d);
            if (!isNaN(parsed.getTime())) {
              allDates.push(parsed.getTime());
            }
          });
        });

        if (allDates.length > 0) {
          const maxDate = new Date(Math.max(...allDates));
          const minDate = new Date(Math.min(...allDates));
          setMaxAvailableDate(maxDate);
          setMinAvailableDate(minDate);
          
          // Only set initial date range if it hasn't been set by user or if it's the first load
          setDateRange(prev => {
            const isFirstLoad = isSameDay(prev.end, new Date()) || prev.start.getTime() === new Date(2026, 0, 1).getTime();
            if (isFirstLoad && activeQuickRange === null) {
              return { 
                start: startOfDay(minDate), 
                end: endOfDay(maxDate) 
              };
            }
            return prev;
          });
        }
      } else {
        setError(json.error || 'Falha ao carregar dados da planilha.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor de dados. Se você publicou na Vercel, verifique se a pasta /api foi incluída.');
      console.log("Fetch exception:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Data Processing ---

  const processed = useMemo(() => {
    if (!data) return null;

    const adsBranding = (data['meta-ads_dados_v2'] || []).map((c: any) => ({ ...c, _sourceTab: 'branding' }));
    const adsCaptacao = (data['meta-ads_dados'] || []).map((c: any) => ({ ...c, _sourceTab: 'captacao' }));
    const criativos = [...adsBranding, ...adsCaptacao];
    const leadsData = data['base_lovable'] || [];
    const linksCriativos = data['Links - Criativos N8N'] || [];

    const linkMap = new Map<string, string>();
    linksCriativos.forEach(l => {
      const name = String(l['ad_name'] || '').trim();
      const link = String(l['Link'] || '').trim();
      if (name && link) linkMap.set(name, link);
    });

    const startLimit = startOfDay(dateRange.start).getTime();
    const endLimit = endOfDay(dateRange.end).getTime();

    const filteredCriativos = criativos.filter(c => {
      const dateStr = c.date_start || c.Date || c.date || c.Data;
      if (!dateStr || !String(dateStr).trim()) return false;
      const d = parseBrDate(dateStr);
      const dTime = d.getTime();
      return dTime >= startLimit && dTime <= endLimit;
    });

    const filteredLeads = leadsData.filter(l => {
      const dateStr = l.Data || l.data || l.date || l.Date || l.created_at || l['Criado em'];
      if (!dateStr || !String(dateStr).trim()) return false;
      const d = parseBrDate(dateStr);
      const dTime = d.getTime();
      return dTime >= startLimit && dTime <= endLimit;
    });

    // Metrics Calculation
    // Ensure we handle both pt-BR numbers and raw numbers for meta-ads
    const getNum = (obj: any, keys: string[]) => {
      for (const k of keys) {
        if (obj[k] !== undefined) return parseBrNumber(String(obj[k]));
      }
      return 0;
    };

    const investBranding = filteredCriativos.filter(c => c._sourceTab === 'branding').reduce((acc, curr) => acc + getNum(curr, ['spend', 'Spend', 'amount_spent', 'Valor Usado', 'Valor gasto (BRL)', 'Valor Gasto']), 0);
    const investCaptacao = filteredCriativos.filter(c => c._sourceTab === 'captacao').reduce((acc, curr) => acc + getNum(curr, ['spend', 'Spend', 'amount_spent', 'Valor Usado', 'Valor gasto (BRL)', 'Valor Gasto']), 0);
    const investTotal = investBranding + investCaptacao;

    const totalImpressions = filteredCriativos.reduce((acc, curr) => acc + getNum(curr, ['impressions', 'Impressions', 'Impressões']), 0);
    const totalClicks = filteredCriativos.reduce((acc, curr) => acc + getNum(curr, ['link_click', 'inline_link_clicks', 'clicks', 'Clicks', 'Cliques no link', 'Cliques']), 0);
    const totalLandingViews = filteredCriativos.reduce((acc, curr) => acc + getNum(curr, ['landing_page_view', 'Visualizações da página de destino', 'Page Views']), 0);
    
    // Total leads comes from the leads database
    const totalLeads = filteredLeads.length;

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const connectRate = totalClicks > 0 ? (totalLandingViews / totalClicks) * 100 : 0;
    const pageConversion = totalLandingViews > 0 ? (totalLeads / totalLandingViews) * 100 : 0;
    const cpm = totalImpressions > 0 ? (investTotal / (totalImpressions / 1000)) : 0;
    const cpc = totalClicks > 0 ? (investTotal / totalClicks) : 0;
    const cpl = totalLeads > 0 ? (investTotal / totalLeads) : 0;

    // Audience (Público) Calculation
    const audienceMap = new Map<string, any>();
    audienceMap.set('Quente [Q]', { name: 'Quente [Q]', spend: 0, leads: 0, views: 0, clicks: 0, impressions: 0 });
    audienceMap.set('Frio [F]', { name: 'Frio [F]', spend: 0, leads: 0, views: 0, clicks: 0, impressions: 0 });
    audienceMap.set('Outros', { name: 'Outros', spend: 0, leads: 0, views: 0, clicks: 0, impressions: 0 });

    filteredCriativos.forEach(c => {
      const audName = String(c.adset_name || c['Ad Set Name'] || c['NOME DO CONJUNTO'] || '');
      let audKey = 'Outros';
      if (audName.includes('[Q]')) audKey = 'Quente [Q]';
      else if (audName.includes('[F]')) audKey = 'Frio [F]';

      const entry = audienceMap.get(audKey)!;
      entry.spend += getNum(c, ['spend', 'Spend', 'amount_spent', 'Valor Usado', 'Valor gasto (BRL)', 'Valor Gasto']);
      entry.leads += getNum(c, ['leads', 'Leads', 'Resultados', 'Cadastro']); // Keep Meta leads for attribution if available
      entry.views += getNum(c, ['landing_page_view', 'Visualizações da página de destino', 'Page Views']);
      entry.clicks += getNum(c, ['link_click', 'inline_link_clicks', 'clicks', 'Clicks', 'Cliques no link', 'Cliques']);
      entry.impressions += getNum(c, ['impressions', 'Impressions', 'Impressões']);
    });

    const audienceData = Array.from(audienceMap.values())
      .filter(a => a.impressions > 0 || a.spend > 0)
      .map(a => ({
        ...a,
        cpl: a.leads > 0 ? a.spend / a.leads : 0,
        ctr: a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0,
        cpc: a.clicks > 0 ? a.spend / a.clicks : 0,
        conversion: a.views > 0 ? (a.leads / a.views) * 100 : 0
      })).sort((a, b) => b.spend - a.spend);

    const dailyMap = new Map<string, DailyMetric>();
    let current = startOfDay(dateRange.start);
    while (current <= endOfDay(dateRange.end)) {
      const dStr = format(current, 'yyyy-MM-dd');
      dailyMap.set(dStr, {
        date: dStr,
        displayDate: format(current, 'dd/MM'),
        investLeads: 0,
        investDist: 0,
        investTotal: 0,
        lucroTotal: 0,
        vendas: 0, // Used for leads
        vendasTrafego: 0,
        cpa: 0, // Actually CPL
        revenue: 0,
        impressions: 0,
        clicks: 0,
        views: 0,
        checkouts: 0,
        connectRate: 0,
        taxaCheckout: 0,
        conversaoCheckout: 0,
        cpm: 0,
        ctr: 0,
        pageConversion: 0
      });
      current = subDays(current, -1);
    }

    // Add traffic metrics per day
    filteredCriativos.forEach(c => {
      const dateStr = c.date_start || c.Date || c.date || c.Data;
      if (!dateStr) return;
      const d = parseBrDate(dateStr);
      const dStr = format(d, 'yyyy-MM-dd');

      if (dailyMap.has(dStr)) {
        const entry = dailyMap.get(dStr)!;
        const invest = getNum(c, ['spend', 'Spend', 'amount_spent', 'Valor Usado', 'Valor gasto (BRL)', 'Valor Gasto']);
        entry.investTotal += invest;
        if (c._sourceTab === 'branding') {
          entry.investDist += invest;
        } else {
          entry.investLeads += invest;
        }
        entry.impressions += getNum(c, ['impressions', 'Impressions', 'Impressões']);
        entry.clicks += getNum(c, ['link_click', 'inline_link_clicks', 'clicks', 'Clicks', 'Cliques no link', 'Cliques']);
        entry.views += getNum(c, ['landing_page_view', 'Visualizações da página de destino', 'Page Views']); 
        // We do NOT add entry.vendas += c.leads here anymore, because vendas (leads) comes from base_lovable!
      }
    });

    // Add true leads from base_lovable per day
    filteredLeads.forEach(l => {
      const dateStr = l.Data || l.data || l.date || l.Date || l.created_at || l['Criado em'];
      if (!dateStr) return;
      const d = parseBrDate(dateStr);
      const dStr = format(d, 'yyyy-MM-dd');

      if (dailyMap.has(dStr)) {
        const entry = dailyMap.get(dStr)!;
        entry.vendas += 1; 
        entry.vendasTrafego += 1; 
      }
    });

    let rawDailyData = Array.from(dailyMap.values()).map(d => {
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
    });
    
    // Trim zero-data days from ends
    let firstDataIdx = rawDailyData.findIndex(d => d.impressions > 0 || d.investTotal > 0);
    let lastDataIdx = -1;
    for (let i = rawDailyData.length - 1; i >= 0; i--) {
        if (rawDailyData[i].impressions > 0 || rawDailyData[i].investTotal > 0) {
            lastDataIdx = i;
            break;
        }
    }
    
    let trimmedDailyData = rawDailyData;
    if (firstDataIdx !== -1 && lastDataIdx !== -1) {
        trimmedDailyData = rawDailyData.slice(firstDataIdx, lastDataIdx + 1);
    } else {
        trimmedDailyData = [];
    }

    const creativeMap = new Map<string, any>();
    filteredCriativos.forEach(c => {
      let name = c.ad_name || c['Ad Name'] || c['Nome do anúncio'] || c['NOME DO ANÚNCIO'] || 'Desconhecido';
      
      if (!creativeMap.has(name)) {
        creativeMap.set(name, {
          _sourceTab: c._sourceTab,
          name,
          link: linkMap.get(name) || '',
          spend: 0,
          impressions: 0,
          clicks: 0,
          views: 0,
          checkouts: 0,
          sales: 0,
          cpa: 0,
          ctr: 0,
          conversion: 0,
          cpc: 0,
          hookRate: 0,
          hookEvents: 0
        });
      }
      const entry = creativeMap.get(name)!;
      entry.spend += getNum(c, ['spend', 'Spend', 'amount_spent', 'Valor Usado', 'Valor gasto (BRL)', 'Valor Gasto']);
      entry.impressions += getNum(c, ['impressions', 'Impressions', 'Impressões']);
      entry.clicks += getNum(c, ['link_click', 'inline_link_clicks', 'clicks', 'Clicks', 'Cliques no link', 'Cliques']);
      entry.views += getNum(c, ['landing_page_view', 'Visualizações da página de destino', 'Page Views']); 
      // sales (leads) will be mapped from base_lovable later 
      entry.hookEvents += getNum(c, ['video_view', '3s_video_view', 'video_play_actions', 'View 3s']);
    });

    // Atribui os leads diretamente da base de captação (base_lovable)
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

    const creativeDataBranding = Array.from(creativeMap.values())
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

      investTotal,
      investBranding,
      investCaptacao,
      totalLeads,
      cpl,
      totalImpressions,
      totalClicks,
      totalLandingViews,
      ctr,
      cpm,
      cpc,
      connectRate,
      pageConversion,
      dailyData: trimmedDailyData,
      audienceData
    };
  }, [data, dateRange]);

  const recommendations = useMemo(() => {
    if (!processed) return [];
    const recs = [];

    // --- High Level Metrics Analysis ---
    if (processed.cpaTrafego > 50) { // Example threshold
      recs.push({
        title: "CPL de Tráfego elevado",
        description: `Seu CPL de tráfego (${formatCurrency(processed.cpaTrafego)}) está acima do benchmark recomendado.`,
        type: 'warning',
        icon: AlertCircle,
        category: 'Geral'
      });
    }

    // --- Creative Performance Analysis ---
    const avgCreativeCtr = processed.ctr;

    // Top Performing Creatives
    processed.creativeDataCaptacao.forEach(c => {
      if (c.sales > 0) {
        // High CTR & Low CPL
        if (c.ctr > avgCreativeCtr * 1.3 && c.cpa < processed.cpaTrafego * 0.8) {
          recs.push({
            title: `Escalar Criativo: ${c.name}`,
            description: `Este criativo está com CTR ${c.ctr.toFixed(2)}% e CPL de ${formatCurrency(c.cpa)}. Potencial de escala alto.`,
            type: 'success',
            icon: TrendingUp,
            category: 'Criativos',
            action: 'Aumentar Orçamento'
          });
        }
      } else if (c.spend > processed.investLeads * 0.1) {
        // High Spend, No Sales
        recs.push({
          title: `Alerta de Gasto: ${c.name}`,
          description: `Já gastou ${formatCurrency(c.spend)} sem gerar nenhuma venda. Recomendamos pausar.`,
          type: 'danger',
          icon: AlertCircle,
          category: 'Criativos',
          action: 'Pausar Criativo'
        });
      }
    });

    // --- Funnel Health Analysis ---
    if (processed.connectRate < 60) {
      recs.push({
        title: "Gargalo de Conexão Crítico",
        description: `Sua taxa de conexão está em ${processed.connectRate.toFixed(1)}%. Você está perdendo tráfego antes da página carregar.`,
        type: 'danger',
        icon: Zap,
        category: 'Funil'
      });
    }

    if (processed.checkoutRate < 5 && processed.totalViews > 100) {
      recs.push({
        title: "Baixa Taxa de Checkout",
        description: `Apenas ${processed.checkoutRate.toFixed(1)}% das pessoas que viram a página foram para o checkout.`,
        type: 'warning',
        icon: MousePointer2,
        category: 'Funil'
      });
    }

    return recs;
  }, [processed]);

  // Synchronize activeQuickRange whenever dateRange or available dates change
  useEffect(() => {
    if (!maxAvailableDate) return;

    const referenceDate = maxAvailableDate;
    const start = startOfDay(dateRange.start);
    const end = endOfDay(dateRange.end);

    const isToday = isSameDay(start, new Date()) && isSameDay(end, new Date());
    const isYesterday = isSameDay(start, subDays(new Date(), 1)) && isSameDay(end, subDays(new Date(), 1));
    const isMax = isSameDay(start, minAvailableDate) && isSameDay(end, maxAvailableDate);

    if (isToday) {
      setActiveQuickRange('today');
    } else if (isYesterday) {
      setActiveQuickRange('yesterday');
    } else if (isMax) {
      setActiveQuickRange('max');
    } else if (isSameDay(end, referenceDate)) {
      const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if ([7, 14, 30].includes(diff)) {
        setActiveQuickRange(diff as any);
      } else {
        setActiveQuickRange(null);
      }
    } else {
      setActiveQuickRange(null);
    }
  }, [dateRange, maxAvailableDate, minAvailableDate]);

  const setQuickRange = (days: number | 'today' | 'yesterday' | 'max') => {
    const referenceDate = maxAvailableDate || new Date();
    let end = endOfDay(referenceDate);
    let start = startOfDay(referenceDate);

    if (days === 'max') {
      start = startOfDay(minAvailableDate);
      end = endOfDay(maxAvailableDate);
    } else if (days === 'today') {
      const today = new Date();
      start = startOfDay(today);
      end = endOfDay(today);
    } else if (days === 'yesterday') {
      const yesterday = subDays(new Date(), 1);
      start = startOfDay(yesterday);
      end = endOfDay(yesterday);
    } else {
      start = startOfDay(subDays(referenceDate, (days as number) - 1));
      if (start < minAvailableDate) start = startOfDay(minAvailableDate);
    }
    setDateRange({ start, end });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value + 'T00:00:00');
    if (!isNaN(newDate.getTime())) {
      setDateRange(prev => ({ ...prev, start: startOfDay(newDate) }));
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value + 'T23:59:59');
    if (!isNaN(newDate.getTime())) {
      setDateRange(prev => ({ ...prev, end: endOfDay(newDate) }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <RefreshCw className="animate-spin text-indigo-600 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-800">Carregando Dashboard...</h2>
        <p className="text-slate-500">Buscando dados da planilha em tempo real</p>
      </div>
    );
  }

  if (error || !processed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md">
          <div className="bg-rose-50 text-rose-600 p-4 rounded-full w-fit mx-auto mb-6">
            <Zap size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Ops! Algo deu errado</h2>
          <p className="text-slate-500 mb-8">{error || 'Não foi possível processar os dados.'}</p>
          <button 
            onClick={fetchData}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
                <LayoutDashboard size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">Guardians 2020</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Análise dos leads vindos das fontes com UTM</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button 
                  onClick={() => setQuickRange('today')} 
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase",
                    activeQuickRange === 'today' ? "bg-white shadow-sm text-indigo-600" : "hover:bg-white text-slate-500"
                  )}
                >
                  Hoje
                </button>
                <button 
                  onClick={() => setQuickRange('yesterday')} 
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase",
                    activeQuickRange === 'yesterday' ? "bg-white shadow-sm text-indigo-600" : "hover:bg-white text-slate-500"
                  )}
                >
                  Ontem
                </button>
                <button 
                  onClick={() => setQuickRange(7)} 
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase",
                    activeQuickRange === 7 ? "bg-white shadow-sm text-indigo-600" : "hover:bg-white text-slate-500"
                  )}
                >
                  7D
                </button>
                <button 
                  onClick={() => setQuickRange(14)} 
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase",
                    activeQuickRange === 14 ? "bg-white shadow-sm text-indigo-600" : "hover:bg-white text-slate-500"
                  )}
                >
                  14D
                </button>
                <button 
                  onClick={() => setQuickRange(30)} 
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase",
                    activeQuickRange === 30 ? "bg-white shadow-sm text-indigo-600" : "hover:bg-white text-slate-500"
                  )}
                >
                  30D
                </button>
                <button 
                  onClick={() => setQuickRange('max')} 
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase",
                    activeQuickRange === 'max' ? "bg-white shadow-sm text-indigo-600" : "hover:bg-white text-slate-500"
                  )}
                >
                  Máximo
                </button>
              </div>
              
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={14} className="text-slate-400" />
                  <input 
                    type="date" 
                    value={format(dateRange.start, 'yyyy-MM-dd')}
                    onChange={handleStartDateChange}
                    className="text-[10px] font-black text-slate-700 uppercase bg-transparent border-none focus:ring-0 p-0 w-[90px] cursor-pointer"
                  />
                </div>
                <span className="text-slate-300 font-bold">-</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={format(dateRange.end, 'yyyy-MM-dd')}
                    onChange={handleEndDateChange}
                    className="text-[10px] font-black text-slate-700 uppercase bg-transparent border-none focus:ring-0 p-0 w-[90px] cursor-pointer"
                  />
                </div>
              </div>
              
              <button 
                onClick={fetchData}
                className="p-2.5 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-200/50 p-1.5 rounded-2xl w-fit border border-slate-200 mb-8 shadow-sm">
          <TabButton active={activeTab === 'geral'} onClick={() => setActiveTab('geral')} icon={PieChartIcon}>Geral</TabButton>
          <TabButton active={activeTab === 'metricas'} onClick={() => setActiveTab('metricas')} icon={TrendingUp}>Análise de Métricas</TabButton>
          <TabButton active={activeTab === 'funil'} onClick={() => setActiveTab('funil')} icon={Layers}>Funil</TabButton>
          <TabButton active={activeTab === 'criativos'} onClick={() => setActiveTab('criativos')} icon={Target}>Criativos</TabButton>
          
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard 
                  title="Investimento" 
                  value={formatCurrency(processed.investTotal)} 
                  icon={DollarSign} 
                  color="blue"
                  subtitle={`Branding: ${formatCurrency(processed.investBranding)} | Captação: ${formatCurrency(processed.investCaptacao)}`}
                />
                <SummaryCard 
                  title="Leads Totais" 
                  value={formatNumber(processed.totalLeads)} 
                  icon={Target} 
                  color="indigo"
                />
                <SummaryCard 
                  title="Custo por Lead (CPL)" 
                  value={formatCurrency(processed.captacaoCpl)} 
                  icon={MousePointer2} 
                  color="emerald"
                />
                <SummaryCard 
                  title="Visitas na Página" 
                  value={formatNumber(processed.captacaoLandingViews)} 
                  icon={Users} 
                  color="amber"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard title="CPM (Captação)" value={formatCurrency(processed.captacaoCpm)} icon={BarChart3} color="slate" />
                <SummaryCard title="CTR (Captação)" value={formatPercent(processed.captacaoCtr)} icon={TrendingUp} color="slate" />
                <SummaryCard title="Connect Rate (Captação)" value={formatPercent(processed.captacaoConnectRate)} icon={ArrowUpRight} color="slate" subtitle="Cliques → Visitas" />
                <SummaryCard title="Conversão LP (Captação)" value={formatPercent(processed.captacaoPageConversion)} icon={PieChartIcon} color="slate" subtitle="Visitas → Leads" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Investimento Diário x Leads">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={processed.dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `R$ ${value}`} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => value.toString()} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number, name: string) => [
                          name === 'Leads' ? value : formatCurrency(value), 
                          name
                        ]}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                      <Bar yAxisId="left" dataKey="investLeads" name="Captação" stackId="a" fill="#10b981" maxBarSize={40} />
                      <Bar yAxisId="left" dataKey="investDist" name="Branding" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Line yAxisId="right" type="monotone" dataKey="vendas" name="Leads" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Custo por Lead Diário (CPL)">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={processed.dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCPL" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `R$ ${value}`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), 'CPL']}
                      />
                      <Area type="monotone" dataKey="cpa" name="CPL" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCPL)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>
          )}

          {activeTab === 'metricas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Histórico CPM & CTR" subtitle="Evolução do custo e engajamento">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={processed.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number, name: string) => [name === 'CPM' ? formatCurrency(value) : value.toFixed(2) + '%', name]}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="center" 
                        iconType="circle" 
                        formatter={(value: string) => <span className="notranslate">{value}</span>}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '20px' }} 
                      />
                      <Area yAxisId="left" type="monotone" dataKey="cpm" name="CPM" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={3} />
                      <Line yAxisId="right" type="monotone" dataKey="ctr" name="CTR" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Histórico de Connect Rate" subtitle="Cliques vs Visualizações de Página">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={processed.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number, name: string) => [value.toFixed(2) + '%', name]}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="center" 
                        iconType="circle" 
                        formatter={(value: string) => <span className="notranslate">{value}</span>}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '20px' }} 
                      />
                      <Area type="monotone" dataKey="connectRate" name="Connect Rate" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard className="lg:col-span-2" title="Conversão da Página (LP para Leads)" subtitle="Evolução diária">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={processed.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number, name: string) => [value.toFixed(2) + '%', name]}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="center" 
                        iconType="circle" 
                        formatter={(value: string) => <span className="notranslate">{value}</span>}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '20px' }} 
                      />
                      <Area type="monotone" dataKey="pageConversion" name="Conversão da Página" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>
          )}

          {activeTab === 'funil' && (
            <div className="space-y-4 py-8">
              <div className="text-center mb-10 notranslate">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Funil de Conversão</h2>
                <p className="text-slate-500">Jornada completa do usuário desde a impressão até a captação do lead</p>
              </div>
              
              <div className="relative">
                <FunnelStep 
                  label="1. Impressões" 
                  value={formatNumber(processed.captacaoImpressions)} 
                  color="bg-slate-800"
                />
                
                <FunnelConversion 
                  value={formatPercent(processed.ctr)} 
                  label="CTR" 
                />

                <FunnelStep 
                  label="2. Cliques no Link" 
                  value={formatNumber(processed.captacaoClicks)}
                  subValue={`Custo por Clique: ${formatCurrency(processed.captacaoCpc)}`}
                  color="bg-indigo-600"
                />
                
                <FunnelConversion 
                  value={formatPercent(processed.connectRate)} 
                  label="Connect Rate" 
                />

                <FunnelStep 
                  label="3. Visualizações da Página" 
                  value={formatNumber(processed.captacaoLandingViews)}
                  color="bg-blue-600"
                />
                
                <FunnelConversion 
                  value={formatPercent(processed.pageConversion)} 
                  label="Conversão de LP" 
                />

                <FunnelStep 
                  label="4. Leads Captados" 
                  value={formatNumber(processed.totalLeads)}
                  subValue={`CPL: ${formatCurrency(processed.captacaoCpl)}`}
                  color="bg-emerald-500"
                  isLast
                />
              </div>
            </div>
          )}

          {activeTab === 'criativos' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="bg-amber-50 text-amber-700 p-4 rounded-xl mb-4 font-medium flex items-center gap-2 border border-amber-200">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <p>Atenção: A análise e atribuição de leads por criativo contabiliza dados <strong>apenas a partir de 21/08/2026</strong>.</p>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Performance por Criativo - Captação</h3>
                  <p className="text-slate-500 text-sm">Cruzamento de dados entre Fb Criativos e Compras Aprovadas</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Filtrar criativo..." 
                      className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-64"
                      value={creativeSearch}
                      onChange={(e) => setCreativeSearch(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => setShowOnlySelected(!showOnlySelected)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-bold transition-colors w-full sm:w-auto",
                      showOnlySelected 
                        ? "bg-indigo-600 text-white" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    Filtrar Selecionados ({selectedCreatives.size})
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4">
                        <input 
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={processed && processed.creativeDataCaptacao.length > 0 && selectedCreatives.size === processed.creativeDataCaptacao.length}
                          onChange={(e) => {
                            if (e.target.checked && processed) {
                              setSelectedCreatives(new Set(processed.creativeDataCaptacao.map(c => c.name)));
                            } else {
                              setSelectedCreatives(new Set());
                            }
                          }}
                        />
                      </th>
                      {[
                        { key: 'name', label: 'CRIATIVO' },
                        { key: 'link', label: 'LINK' },
                        { key: 'spend', label: 'GASTO' },
                        { key: 'clicks', label: 'CLIQUES' },
                        { key: 'cpc', label: 'CPC' },
                        { key: 'ctr', label: 'CTR' },
                        { key: 'hookRate', label: 'HOOK RATE' },
                        { key: 'sales', label: 'LEADS' },
                        { key: 'cpa', label: 'CPL DO TRÁFEGO' },
                        { key: 'conversion', label: 'CONV. PÁGINA' }
                      ].map((col) => (
                        <th 
                          key={col.key}
                          className="px-6 py-4 text-[10px] font-black text-slate-400 tracking-widest cursor-pointer hover:text-indigo-600 transition-colors uppercase"
                          onClick={() => {
                            setCreativeSort(prev => ({
                              key: col.key,
                              direction: prev.key === col.key && prev.direction === 'desc' ? 'asc' : 'desc'
                            }));
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {col.label}
                            {creativeSort.key === col.key && (
                              <ChevronDown 
                                size={14} 
                                className={cn("transition-transform", creativeSort.direction === 'asc' && "rotate-180")} 
                              />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processed?.creativeDataCaptacao
                      .filter(c => c.name.toLowerCase().includes(creativeSearch.toLowerCase()))
                      .filter(c => showOnlySelected ? selectedCreatives.has(c.name) : true)
                      .sort((a, b) => {
                        const valA = a[creativeSort.key];
                        const valB = b[creativeSort.key];
                        if (typeof valA === 'string' && typeof valB === 'string') {
                          return creativeSort.direction === 'desc' 
                            ? valB.localeCompare(valA) 
                            : valA.localeCompare(valB);
                        }
                        return creativeSort.direction === 'desc' 
                          ? (valB) - (valA) 
                          : (valA) - (valB);
                      })
                      .map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="checkbox"
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={selectedCreatives.has(c.name)}
                            onChange={(e) => {
                              const newSet = new Set(selectedCreatives);
                              if (e.target.checked) newSet.add(c.name);
                              else newSet.delete(c.name);
                              setSelectedCreatives(newSet);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{c.name}</td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {c.link ? (
                            <div className="flex items-center gap-2">
                              <a 
                                href={c.link} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                <ExternalLink size={14} />
                                <span className="text-[10px] font-black uppercase tracking-tight">Ver Criativo</span>
                              </a>
                              <CopyButton text={c.link} />
                            </div>
                          ) : (
                            <span className="text-slate-300 text-[10px] font-black uppercase tracking-tight italic">Sem Link</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{formatCurrency(c.spend)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{formatNumber(c.clicks)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{formatCurrency(c.cpc)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{c.ctr.toFixed(2)}%</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{c.hookRate.toFixed(2)}%</td>
                        <td className="px-6 py-4 text-sm font-black text-indigo-600">{formatNumber(c.sales)}</td>
                        <td className="px-6 py-4 text-sm font-black text-rose-600 notranslate">{formatCurrency(c.cpa)}</td>
                        <td className="px-6 py-4 text-sm text-emerald-600 font-black">{c.conversion.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Performance por Criativo - Branding</h3>
                </div>
              </div>
  <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4">
                        <input 
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={processed && processed.creativeDataBranding.length > 0 && selectedCreatives.size === processed.creativeDataBranding.length}
                          onChange={(e) => {
                            if (e.target.checked && processed) {
                              setSelectedCreatives(new Set(processed.creativeDataBranding.map(c => c.name)));
                            } else {
                              setSelectedCreatives(new Set());
                            }
                          }}
                        />
                      </th>
                      {[
                        { key: 'name', label: 'CRIATIVO' },
                        { key: 'link', label: 'LINK' },
                        { key: 'spend', label: 'GASTO' },
                        { key: 'clicks', label: 'CLIQUES' },
                        { key: 'cpc', label: 'CPC' },
                        { key: 'ctr', label: 'CTR' },
                        { key: 'hookRate', label: 'HOOK RATE' },
                        { key: 'sales', label: 'LEADS' },
                        { key: 'cpa', label: 'CPL DO TRÁFEGO' },
                        { key: 'conversion', label: 'CONV. PÁGINA' }
                      ].map((col) => (
                        <th 
                          key={col.key}
                          className="px-6 py-4 text-[10px] font-black text-slate-400 tracking-widest cursor-pointer hover:text-indigo-600 transition-colors uppercase"
                          onClick={() => {
                            setCreativeSort(prev => ({
                              key: col.key,
                              direction: prev.key === col.key && prev.direction === 'desc' ? 'asc' : 'desc'
                            }));
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {col.label}
                            {creativeSort.key === col.key && (
                              <ChevronDown 
                                size={14} 
                                className={cn("transition-transform", creativeSort.direction === 'asc' && "rotate-180")} 
                              />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processed?.creativeDataBranding
                      .filter(c => c.name.toLowerCase().includes(creativeSearch.toLowerCase()))
                      .filter(c => showOnlySelected ? selectedCreatives.has(c.name) : true)
                      .sort((a, b) => {
                        const valA = a[creativeSort.key];
                        const valB = b[creativeSort.key];
                        if (typeof valA === 'string' && typeof valB === 'string') {
                          return creativeSort.direction === 'desc' 
                            ? valB.localeCompare(valA) 
                            : valA.localeCompare(valB);
                        }
                        return creativeSort.direction === 'desc' 
                          ? (valB) - (valA) 
                          : (valA) - (valB);
                      })
                      .map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="checkbox"
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={selectedCreatives.has(c.name)}
                            onChange={(e) => {
                              const newSet = new Set(selectedCreatives);
                              if (e.target.checked) newSet.add(c.name);
                              else newSet.delete(c.name);
                              setSelectedCreatives(newSet);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{c.name}</td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {c.link ? (
                            <div className="flex items-center gap-2">
                              <a 
                                href={c.link} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                <ExternalLink size={14} />
                                <span className="text-[10px] font-black uppercase tracking-tight">Ver Criativo</span>
                              </a>
                              <CopyButton text={c.link} />
                            </div>
                          ) : (
                            <span className="text-slate-300 text-[10px] font-black uppercase tracking-tight italic">Sem Link</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{formatCurrency(c.spend)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{formatNumber(c.clicks)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{formatCurrency(c.cpc)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{c.ctr.toFixed(2)}%</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{c.hookRate.toFixed(2)}%</td>
                        <td className="px-6 py-4 text-sm font-black text-indigo-600">{formatNumber(c.sales)}</td>
                        <td className="px-6 py-4 text-sm font-black text-rose-600 notranslate">{formatCurrency(c.cpa)}</td>
                        <td className="px-6 py-4 text-sm text-emerald-600 font-black">{c.conversion.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      
      </main>
    </div>
  );
}
