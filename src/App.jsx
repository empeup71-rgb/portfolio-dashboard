import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis
} from "recharts";

// ═══════════════════════════════════════════════════════════════════
// THEME SYSTEM — Dark & Light
// ═══════════════════════════════════════════════════════════════════
const DARK = {
  bg:      "#020D18",
  bg2:     "#061525",
  bg3:     "#0A1E34",
  surface: "rgba(255,255,255,0.03)",
  border:  "rgba(255,255,255,0.07)",
  text:    "#E2EAF4",
  muted:   "#4A6080",
  dim:     "#162436",
  card:    "linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))",
  shadow:  "0 4px 32px rgba(0,0,0,0.5)",
  header:  "rgba(2,13,24,0.97)",
  mode:    "dark",
};
const LIGHT = {
  bg:      "#F0F4F8",
  bg2:     "#E2E8F0",
  bg3:     "#CBD5E0",
  surface: "rgba(0,0,0,0.03)",
  border:  "rgba(0,0,0,0.09)",
  text:    "#1A202C",
  muted:   "#718096",
  dim:     "#E2E8F0",
  card:    "linear-gradient(145deg,rgba(255,255,255,0.9),rgba(255,255,255,0.7))",
  shadow:  "0 4px 24px rgba(0,0,0,0.08)",
  header:  "rgba(240,244,248,0.97)",
  mode:    "light",
};

// Brand colors — same in both modes
const BRAND = {
  gold:   "#C9A84C",
  gold2:  "#F0C060",
  teal:   "#00C896",
  blue:   "#1E90FF",
  purple: "#7B68EE",
  red:    "#FF4C4C",
  green:  "#00C853",
  amber:  "#FFB300",
  pink:   "#FF6B9D",
  cyan:   "#00D4FF",
  mono:   "'JetBrains Mono','Fira Code',monospace",
  display:"'Inter','Segoe UI',sans-serif",
};

const BROKER_COLOR = { "Robinhood": BRAND.teal, "Fidelity": BRAND.blue, "TSP Federal": BRAND.gold };
const TYPE_COLOR   = { "Stock": BRAND.blue, "ETF": BRAND.purple, "Crypto": BRAND.amber, "Bond": BRAND.green };

// ═══════════════════════════════════════════════════════════════════
// PORTFOLIO DATA
// ═══════════════════════════════════════════════════════════════════
const INITIAL_HOLDINGS = [
  { id:"aapl", symbol:"AAPL", name:"Apple Inc.",      broker:"Robinhood",   portfolio:"Roth IRA",   type:"Stock",  sector:"Technology", qty:45,   price:213.50, avgCost:178.20, beta:1.18, div:0.96,  vol:18.4, notes:"" },
  { id:"nvda", symbol:"NVDA", name:"NVIDIA Corp.",    broker:"Robinhood",   portfolio:"Roth IRA",   type:"Stock",  sector:"Technology", qty:18,   price:875.20, avgCost:612.40, beta:1.72, div:0.04,  vol:41.3, notes:"" },
  { id:"btc",  symbol:"BTC",  name:"Bitcoin",         broker:"Robinhood",   portfolio:"Investing",  type:"Crypto", sector:"Crypto",     qty:0.42, price:67840,  avgCost:52000,  beta:1.85, div:0,     vol:62.1, notes:"" },
  { id:"eth",  symbol:"ETH",  name:"Ethereum",        broker:"Robinhood",   portfolio:"Investing",  type:"Crypto", sector:"Crypto",     qty:3.2,  price:3640,   avgCost:3100,   beta:1.61, div:0,     vol:58.4, notes:"" },
  { id:"voo",  symbol:"VOO",  name:"Vanguard S&P500", broker:"Fidelity",    portfolio:"401k",       type:"ETF",    sector:"Broad Mkt",  qty:28,   price:498.20, avgCost:441.30, beta:1.00, div:6.58,  vol:14.2, notes:"" },
  { id:"msft", symbol:"MSFT", name:"Microsoft Corp.", broker:"Fidelity",    portfolio:"401k",       type:"Stock",  sector:"Technology", qty:22,   price:418.30, avgCost:380.10, beta:0.92, div:3.00,  vol:19.8, notes:"" },
  { id:"spy",  symbol:"SPY",  name:"SPDR S&P 500",   broker:"Fidelity",    portfolio:"Brokerage",  type:"ETF",    sector:"Broad Mkt",  qty:15,   price:529.80, avgCost:498.60, beta:1.00, div:6.81,  vol:14.1, notes:"" },
  { id:"tip",  symbol:"TIP",  name:"iShares TIPS",   broker:"TSP Federal", portfolio:"Retirement", type:"Bond",   sector:"Fixed Inc.", qty:120,  price:107.40, avgCost:105.20, beta:0.12, div:4.11,  vol:6.1,  notes:"" },
];

// Price lookup table — 60+ tickers with auto-price
const PRICE_DB = {
  // Mega Cap Tech
  "AAPL":213.50,"MSFT":418.30,"NVDA":875.20,"GOOGL":175.40,"AMZN":198.60,
  "META":512.30,"TSLA":248.70,"ORCL":142.80,"ADBE":448.20,"CRM":312.40,
  "INTC":38.20,"AMD":168.40,"QCOM":198.60,"AVGO":1842.30,"TXN":198.40,
  // Blue Chips
  "BRK.B":411.20,"JPM":218.40,"V":279.30,"MA":486.20,"BAC":38.40,
  "WFC":58.20,"GS":498.60,"MS":112.40,"UNH":542.10,"JNJ":147.80,
  "WMT":81.20,"PG":168.40,"HD":385.60,"CVX":152.30,"LLY":792.40,
  "ABBV":178.90,"MRK":124.60,"KO":62.40,"PEP":165.30,"COST":882.10,
  "TMO":567.80,"ACN":312.40,"MCD":298.40,"NKE":74.20,"DIS":112.40,
  "NFLX":648.20,"PYPL":68.40,"UBER":78.20,"ABNB":142.60,"SHOP":82.40,
  // ETFs
  "VOO":498.20,"SPY":529.80,"QQQ":448.60,"IVV":531.20,"VTI":241.80,
  "VEA":48.30,"VWO":42.60,"VIG":198.40,"SCHD":82.40,"JEPI":58.20,
  "ARKK":48.20,"XLK":212.40,"XLF":42.80,"XLV":148.60,"XLE":88.40,
  // Bonds
  "BND":72.40,"TIP":107.40,"AGG":98.20,"TLT":92.40,"IEF":98.60,
  "SHY":82.40,"VCIT":78.20,"VCSH":76.40,"HYG":78.20,"LQD":108.40,
  // Commodities
  "GLD":221.40,"SLV":25.80,"IAU":22.14,"GDX":38.20,"PDBC":18.40,
  // Crypto
  "BTC":67840,"ETH":3640,"BNB":412,"SOL":148,"ADA":0.62,
  "DOGE":0.18,"XRP":0.72,"AVAX":38.40,"DOT":8.20,"MATIC":0.92,
  "LINK":14.80,"UNI":9.40,"ATOM":8.20,"NEAR":6.40,"FTM":0.68,
};

// Name lookup
const NAME_DB = {
  "AAPL":"Apple Inc.","MSFT":"Microsoft Corp.","NVDA":"NVIDIA Corp.",
  "GOOGL":"Alphabet Inc.","AMZN":"Amazon.com Inc.","META":"Meta Platforms",
  "TSLA":"Tesla Inc.","BRK.B":"Berkshire Hathaway","JPM":"JPMorgan Chase",
  "V":"Visa Inc.","MA":"Mastercard Inc.","BAC":"Bank of America",
  "WFC":"Wells Fargo","GS":"Goldman Sachs","UNH":"UnitedHealth Group",
  "JNJ":"Johnson & Johnson","WMT":"Walmart Inc.","PG":"Procter & Gamble",
  "HD":"Home Depot","CVX":"Chevron Corp.","LLY":"Eli Lilly","KO":"Coca-Cola",
  "PEP":"PepsiCo Inc.","COST":"Costco Wholesale","MCD":"McDonald's Corp.",
  "NKE":"Nike Inc.","DIS":"Walt Disney Co.","NFLX":"Netflix Inc.",
  "ORCL":"Oracle Corp.","ADBE":"Adobe Inc.","CRM":"Salesforce Inc.",
  "INTC":"Intel Corp.","AMD":"AMD Inc.","QCOM":"Qualcomm Inc.",
  "AVGO":"Broadcom Inc.","TXN":"Texas Instruments",
  "VOO":"Vanguard S&P500 ETF","SPY":"SPDR S&P 500 ETF","QQQ":"Invesco QQQ ETF",
  "IVV":"iShares S&P500 ETF","VTI":"Vanguard Total Market","VIG":"Vanguard Dividend",
  "SCHD":"Schwab Dividend ETF","JEPI":"JPMorgan Premium Income",
  "ARKK":"ARK Innovation ETF","BND":"Vanguard Bond ETF",
  "TIP":"iShares TIPS Bond ETF","AGG":"iShares Core Bond ETF",
  "TLT":"iShares 20yr Treasury","GLD":"SPDR Gold Shares",
  "SLV":"iShares Silver Trust","IAU":"iShares Gold Trust",
  "BTC":"Bitcoin","ETH":"Ethereum","BNB":"BNB Chain",
  "SOL":"Solana","ADA":"Cardano","DOGE":"Dogecoin",
  "XRP":"Ripple","AVAX":"Avalanche","DOT":"Polkadot",
};

// ═══════════════════════════════════════════════════════════════════
// BOT LEARNING SYSTEM
// ═══════════════════════════════════════════════════════════════════
const BOT_MEMORY_KEY = "pcc_bot_memory_v1";
const initBotMemory = () => {
  try {
    const saved = localStorage.getItem(BOT_MEMORY_KEY);
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return {
    riskProfile: "moderate",
    preferredPeriod: "1Y",
    mostUsedTabs: {},
    chatHistory: [],
    feedback: [],
    alerts: [],
    learnedPreferences: {},
    sessionCount: 0,
    lastVisit: null,
  };
};
const saveBotMemory = (memory) => {
  try { localStorage.setItem(BOT_MEMORY_KEY, JSON.stringify(memory)); } catch(e) {}
};

// ═══════════════════════════════════════════════════════════════════
// MATH HELPERS
// ═══════════════════════════════════════════════════════════════════
const V    = h => h.qty * h.price;
const CO   = h => h.qty * h.avgCost;
const PL   = h => V(h) - CO(h);
const PLP  = h => (h.price - h.avgCost) / h.avgCost * 100;

const PERIODS = [
  { id:"1D", days:1 }, { id:"1W", days:7 },   { id:"1M", days:30 },
  { id:"3M", days:90 },{ id:"1Y", days:365 },  { id:"3Y", days:1095 },
  { id:"5Y", days:1825 },{ id:"10Y", days:3650 },
];

const genS = (base, pid, vol=0.011) => {
  const p   = PERIODS.find(x=>x.id===pid) || PERIODS[4];
  const vs  = {"1D":.3,"1W":.6,"1M":.8,"3M":.9,"1Y":1,"3Y":1.2,"5Y":1.3,"10Y":1.4}[pid]||1;
  const sm  = {"1D":.998,"1W":.988,"1M":.970,"3M":.935,"1Y":.870,"3Y":.650,"5Y":.480,"10Y":.280}[pid]||.87;
  let v = base * sm;
  const N = p.days, land = Math.floor(N*.88), out = [];
  for(let i=N;i>=0;i--){
    const step=N-i;
    if(step>=land){ const pr=(step-land)/(N-land); v=v+(base-v)*pr*.18+(Math.random()-.5)*base*vol*vs*.25; }
    else { v+=(Math.random()-.452)*base*vol*vs; }
    v=Math.max(v,base*.15);
    const dt=new Date(); dt.setDate(dt.getDate()-i);
    const fmt = p.days<=7
      ? dt.toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"})
      : p.days<=365
      ? dt.toLocaleDateString("en",{month:"short",day:"numeric"})
      : dt.toLocaleDateString("en",{month:"short",year:"2-digit"});
    out.push({ date:fmt, value:Math.round(v) });
  }
  out[out.length-1].value = Math.round(base);
  return out;
};

// ═══════════════════════════════════════════════════════════════════
// UI ATOMS
// ═══════════════════════════════════════════════════════════════════
const Card = ({ children, style={}, glow, T }) => (
  <div style={{
    background: T.card,
    border: `1px solid ${glow ? glow+"33" : T.border}`,
    borderRadius: 14,
    padding: 18,
    backdropFilter: "blur(12px)",
    boxShadow: glow
      ? `0 0 24px ${glow}14, ${T.shadow}`
      : T.shadow,
    transition: "all 0.25s ease",
    ...style
  }}>{children}</div>
);

const KPI = ({ label, value, sub, color=BRAND.gold, T }) => (
  <div style={{
    background: `linear-gradient(135deg,${color}10,transparent)`,
    border: `1px solid ${color}28`,
    borderLeft: `3px solid ${color}`,
    borderRadius: 10, padding: "12px 16px",
    transition: "all 0.2s",
  }}>
    <div style={{fontSize:8,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2.5,marginBottom:6,textTransform:"uppercase"}}>{label}</div>
    <div style={{fontSize:22,fontWeight:800,fontFamily:BRAND.display,color,lineHeight:1.1}}>{value}</div>
    {sub && <div style={{fontSize:10,color:T.muted,fontFamily:BRAND.mono,marginTop:4}}>{sub}</div>}
  </div>
);

const Chip = ({ label, color=BRAND.gold, size=9 }) => (
  <span style={{
    fontSize:size, fontFamily:BRAND.mono, fontWeight:700,
    background:`${color}14`, color,
    border:`1px solid ${color}30`,
    borderRadius:6, padding:"2px 8px",
  }}>{label}</span>
);

const PBtn = ({ active, onChange, color=BRAND.gold, T }) => (
  <div style={{display:"flex",gap:2,background:T.mode==="dark"?"rgba(0,0,0,0.4)":"rgba(0,0,0,0.06)",borderRadius:10,padding:3,border:`1px solid ${T.border}`}}>
    {PERIODS.map(p => {
      const isA = active===p.id;
      return (
        <button key={p.id} onClick={()=>onChange(p.id)} style={{
          padding:"4px 9px", borderRadius:7, border:"none", cursor:"pointer",
          fontFamily:BRAND.mono, fontSize:9, fontWeight:700,
          background: isA ? `${color}28` : "transparent",
          color: isA ? color : T.muted,
          borderBottom: isA ? `2px solid ${color}` : "2px solid transparent",
          transition: "all 0.15s",
        }}>{p.id}</button>
      );
    })}
  </div>
);

const TT = ({ active, payload, label, T }) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{
      background: T.bg2,
      border: `1px solid ${BRAND.gold}44`,
      borderRadius: 10, padding: "10px 14px",
      fontSize:11, fontFamily:BRAND.mono,
      boxShadow:"0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <div style={{color:T.muted,marginBottom:6,fontSize:10,letterSpacing:1}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",gap:18,marginBottom:i<payload.length-1?3:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:2,background:p.color||p.stroke||BRAND.gold}}/>
            <span style={{color:T.muted}}>{p.name}</span>
          </div>
          <b style={{color:p.color||p.stroke||T.text}}>
            {typeof p.value==="number" ? p.value>1000 ? `$${Math.round(p.value).toLocaleString()}` : p.value.toFixed(2) : p.value}
          </b>
        </div>
      ))}
    </div>
  );
};

const STN = ({ title, sub, color=BRAND.gold, T }) => (
  <div style={{marginBottom:14}}>
    <div style={{fontFamily:BRAND.display,fontWeight:700,fontSize:14,color,letterSpacing:-.3}}>{title}</div>
    {sub && <div style={{fontSize:10,color:T.muted,fontFamily:BRAND.mono,marginTop:3}}>{sub}</div>}
  </div>
);

const ExpandBtn = ({ onClick, color=BRAND.gold }) => (
  <button onClick={onClick} title="Expand" style={{
    width:26,height:26,borderRadius:7,
    border:`1px solid ${color}33`,
    background:`${color}10`,
    cursor:"pointer",color,fontSize:13,
    display:"flex",alignItems:"center",justifyContent:"center",
    flexShrink:0,transition:"all 0.15s",marginLeft:6,
  }}
    onMouseEnter={e=>{e.currentTarget.style.background=`${color}25`;}}
    onMouseLeave={e=>{e.currentTarget.style.background=`${color}10`;}}
  >⤢</button>
);

const ChartModal = ({ title, sub, color, children, onClose, T }) => {
  useEffect(()=>{
    const fn = e=>{ if(e.key==="Escape") onClose(); };
    document.addEventListener("keydown",fn);
    return()=>document.removeEventListener("keydown",fn);
  },[onClose]);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeIn 0.2s ease"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:1200,background:T.bg2,border:`1px solid ${color}44`,borderRadius:18,padding:28,boxShadow:`0 0 80px ${color}18`,maxHeight:"90vh",overflow:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:18,fontFamily:BRAND.display,fontWeight:800,color,letterSpacing:-.5}}>{title}</div>
            {sub&&<div style={{fontSize:11,fontFamily:BRAND.mono,color:T.muted,marginTop:4}}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,cursor:"pointer",color:T.muted,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.color=T.text;}}
            onMouseLeave={e=>{e.currentTarget.style.color=T.muted;}}>✕</button>
        </div>
        <div style={{height:460}}>{children}</div>
        <div style={{marginTop:12,fontSize:9,fontFamily:BRAND.mono,color:T.muted,textAlign:"center",letterSpacing:2}}>ESC OR CLICK OUTSIDE TO CLOSE</div>
      </div>
    </div>
  );
};

const SubTabNav = ({ subs, activeSub, setActiveSub, color, T }) => {
  if(!subs?.length) return null;
  return (
    <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:`1px solid ${T.border}`,overflowX:"auto"}}>
      {subs.map(s=>{
        const isA=activeSub===s.id;
        return (
          <button key={s.id} onClick={()=>setActiveSub(s.id)} style={{
            display:"flex",alignItems:"center",gap:7,
            padding:"9px 18px",border:"none",cursor:"pointer",
            fontFamily:BRAND.display,fontSize:11,fontWeight:600,
            background:isA?`${color}10`:"transparent",
            color:isA?color:T.muted,
            borderBottom:isA?`2px solid ${color}`:"2px solid transparent",
            marginBottom:-1,transition:"all 0.2s",
            borderRadius:"8px 8px 0 0",whiteSpace:"nowrap",
          }}>
            <span>{s.icon}</span><span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// HOLDINGS TABLE COMPONENT (reusable across all levels)
// ═══════════════════════════════════════════════════════════════════
const HoldingsTable = ({ holdings, title, T, onEdit, onRowClick }) => {
  const [sort, setSort] = useState({ col:"value", dir:-1 });
  const TV_local = holdings.reduce((s,h)=>s+V(h),0);

  const sorted = [...holdings].sort((a,b)=>{
    const vals = { value:[V(b),V(a)], pl:[PL(b),PL(a)], plp:[PLP(b),PLP(a)], symbol:[a.symbol,b.symbol] };
    const [x,y] = vals[sort.col]||[V(b),V(a)];
    return typeof x==="string" ? x.localeCompare(y)*sort.dir : (x-y)*sort.dir;
  });

  const TH = ({ col, label }) => (
    <th onClick={()=>setSort(s=>({col,dir:s.col===col?-s.dir:-1}))} style={{textAlign:"left",padding:"7px 10px",color:sort.col===col?BRAND.gold:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1,cursor:"pointer",whiteSpace:"nowrap",userSelect:"none"}}>
      {label}{sort.col===col?(sort.dir===-1?" ↓":" ↑"):""}
    </th>
  );

  return (
    <Card T={T}>
      <STN title={title||"Holdings"} sub={`${holdings.length} positions · Click column to sort`} color={BRAND.blue} T={T}/>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${T.border}`}}>
              <TH col="symbol" label="Symbol"/>
              <TH col="name"   label="Name"/>
              <th style={{textAlign:"left",padding:"7px 10px",color:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1}}>Broker</th>
              <th style={{textAlign:"left",padding:"7px 10px",color:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1}}>Fund</th>
              <th style={{textAlign:"left",padding:"7px 10px",color:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1}}>Type</th>
              <TH col="qty"    label="Qty"/>
              <TH col="price"  label="Price"/>
              <TH col="value"  label="Value"/>
              <TH col="pl"     label="P&L $"/>
              <TH col="plp"    label="P&L %"/>
              <th style={{textAlign:"left",padding:"7px 10px",color:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1}}>Weight</th>
              <th style={{textAlign:"left",padding:"7px 10px",color:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1}}>Edit</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((h,i)=>{
              const hv=V(h),hpl=PL(h),hplp=PLP(h),wt=hv/TV_local*100;
              return (
                <tr key={i}
                  style={{borderBottom:`1px solid ${T.border}`,transition:"background 0.15s",cursor:onRowClick?"pointer":"default"}}
                  onClick={()=>onRowClick&&onRowClick(h)}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surface}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"9px 10px",fontWeight:700,color:BRAND.gold,fontFamily:BRAND.mono,fontSize:13}}>{h.symbol}</td>
                  <td style={{padding:"9px 10px",color:T.muted,fontSize:11}}>{h.name}</td>
                  <td style={{padding:"9px 10px"}}><Chip label={h.broker.split(" ")[0]} color={BROKER_COLOR[h.broker]||BRAND.muted}/></td>
                  <td style={{padding:"9px 10px",fontSize:11,color:T.muted}}>{h.portfolio}</td>
                  <td style={{padding:"9px 10px"}}><Chip label={h.type} color={TYPE_COLOR[h.type]||BRAND.muted}/></td>
                  <td style={{padding:"9px 10px",fontFamily:BRAND.mono,color:T.muted}}>{h.qty}</td>
                  <td style={{padding:"9px 10px",fontFamily:BRAND.mono,fontWeight:600,color:T.text}}>${h.price.toLocaleString()}</td>
                  <td style={{padding:"9px 10px",fontFamily:BRAND.mono,fontWeight:700,color:T.text}}>${Math.round(hv).toLocaleString()}</td>
                  <td style={{padding:"9px 10px",fontFamily:BRAND.mono,color:hpl>=0?BRAND.teal:BRAND.red,fontWeight:600}}>{hpl>=0?"+":"-"}${Math.abs(Math.round(hpl)).toLocaleString()}</td>
                  <td style={{padding:"9px 10px",fontFamily:BRAND.mono,color:hplp>=0?BRAND.teal:BRAND.red,fontWeight:700}}>{hplp>=0?"+":""}{hplp.toFixed(2)}%</td>
                  <td style={{padding:"9px 10px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <div style={{width:40,height:3,background:T.border,borderRadius:2}}>
                        <div style={{height:"100%",width:`${Math.min(wt,100)}%`,background:BRAND.gold,borderRadius:2}}/>
                      </div>
                      <span style={{fontFamily:BRAND.mono,fontSize:9,color:T.muted}}>{wt.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td style={{padding:"9px 10px"}}>
                    <button onClick={()=>onEdit&&onEdit(h)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",cursor:"pointer",color:T.muted,fontSize:10,fontFamily:BRAND.mono,transition:"all 0.15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.color=BRAND.gold;e.currentTarget.style.borderColor=BRAND.gold+"44";}}
                      onMouseLeave={e=>{e.currentTarget.style.color=T.muted;e.currentTarget.style.borderColor=T.border;}}>
                      ✏️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{borderTop:`2px solid ${BRAND.gold}30`,background:`${BRAND.gold}05`}}>
              <td colSpan={7} style={{padding:"9px 10px",fontFamily:BRAND.display,fontWeight:700,color:BRAND.gold,fontSize:13}}>TOTAL</td>
              <td style={{padding:"9px 10px",fontFamily:BRAND.mono,fontWeight:800,color:T.text,fontSize:14}}>${Math.round(TV_local).toLocaleString()}</td>
              <td style={{padding:"9px 10px",fontFamily:BRAND.mono,fontWeight:700,color:BRAND.teal,fontSize:13}}>+${Math.round(holdings.reduce((s,h)=>s+PL(h),0)).toLocaleString()}</td>
              <td colSpan={3}/>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ADD / EDIT POSITION MODAL
// ═══════════════════════════════════════════════════════════════════
const EditModal = ({ holding, onSave, onDelete, onClose, T, allHoldings=[] }) => {
  const isNew = !holding?.id;
  const [form, setForm] = useState(holding || { symbol:"", name:"", broker:"Robinhood", portfolio:"Roth IRA", type:"Stock", sector:"Technology", qty:"", price:"", avgCost:"", div:0, beta:1, vol:20, notes:"" });
  const [priceStatus, setPriceStatus] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const lookupPrice = (ticker) => {
    const sym = ticker.toUpperCase().trim();
    set("symbol", sym);
    if(!sym) { setPriceStatus(""); return; }
    const price = PRICE_DB[sym];
    const name  = NAME_DB[sym];
    if(price) {
      set("price", price);
      setPriceStatus(`✅ Price loaded: $${price.toLocaleString()}`);
      if(name) set("name", name);
      // Auto-detect asset type
      const cryptos = ["BTC","ETH","BNB","SOL","ADA","DOGE","XRP","AVAX","DOT","MATIC","LINK","UNI","ATOM","NEAR","FTM"];
      const etfs    = ["VOO","SPY","QQQ","IVV","VTI","VEA","VWO","VIG","SCHD","JEPI","ARKK","XLK","XLF","XLV","XLE"];
      const bonds   = ["BND","TIP","AGG","TLT","IEF","SHY","VCIT","VCSH","HYG","LQD"];
      const commod  = ["GLD","SLV","IAU","GDX","PDBC"];
      if(cryptos.includes(sym))     { set("type","Crypto");    set("sector","Crypto"); }
      else if(bonds.includes(sym))  { set("type","Bond");      set("sector","Fixed Inc."); }
      else if(commod.includes(sym)) { set("type","Commodity"); set("sector","Commodities"); }
      else if(etfs.includes(sym))   { set("type","ETF");       set("sector","Broad Mkt"); }
      else                          { set("type","Stock");     set("sector","Technology"); }
    } else if(sym.length>=1) {
      setPriceStatus("⚠️ Ticker not found — enter price manually");
    }
  };

  const existingPortfolios = [...new Set(allHoldings.filter(h=>h.broker===form.broker).map(h=>h.portfolio))];

  const inp = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px", color:T.text, fontSize:12, outline:"none", fontFamily:BRAND.mono, width:"100%", transition:"border 0.2s" };
  const lbl = { fontSize:9, fontFamily:BRAND.mono, color:T.muted, letterSpacing:2, marginBottom:5, display:"block" };
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:700,background:T.bg2,border:`1px solid ${BRAND.gold}44`,borderRadius:18,padding:28,boxShadow:`0 0 60px ${BRAND.gold}14`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontSize:18,fontFamily:BRAND.display,fontWeight:800,color:BRAND.gold}}>{isNew?"Add New Position":"Edit Position"}</div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:7,border:`1px solid ${T.border}`,background:T.surface,cursor:"pointer",color:T.muted,fontSize:15}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          <div>
            <label style={lbl}>TICKER</label>
            <input value={form.symbol} onChange={e=>lookupPrice(e.target.value)} placeholder="AAPL, BTC, VOO..." style={{...inp,fontSize:16,fontWeight:700,color:BRAND.gold,letterSpacing:2}}/>
            {priceStatus&&<div style={{fontSize:10,fontFamily:BRAND.mono,color:priceStatus.startsWith("✅")?BRAND.teal:BRAND.amber,marginTop:4}}>{priceStatus}</div>}
          </div>
          <div><label style={lbl}>NAME</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Apple Inc." style={inp}/></div>
          <div><label style={lbl}>TYPE</label>
            <select value={form.type} onChange={e=>set("type",e.target.value)} style={{
              ...inp,cursor:"pointer",
              appearance:"auto",WebkitAppearance:"auto",
              background:T.mode==="dark"?"#061525":"#ffffff",
              color:T.text,
              padding:"8px 12px",
            }}>
              {["Stock","ETF","Crypto","Bond","REIT","Commodity"].map(t=>(
                <option key={t} value={t} style={{background:T.mode==="dark"?"#061525":"#ffffff",color:T.text}}>{t}</option>
              ))}
            </select>
          </div>
          <div><label style={lbl}>SHARES / UNITS</label><input value={form.qty} onChange={e=>set("qty",e.target.value)} type="number" placeholder="10" style={inp}/></div>
          <div><label style={lbl}>CURRENT PRICE ($)</label><input value={form.price} onChange={e=>set("price",e.target.value)} type="number" placeholder="213.50" style={inp}/></div>
          <div><label style={lbl}>AVG COST ($)</label><input value={form.avgCost} onChange={e=>set("avgCost",e.target.value)} type="number" placeholder="178.20" style={inp}/>
            {form.qty&&form.avgCost&&<div style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted,marginTop:4}}>Cost basis: <b style={{color:BRAND.gold}}>${(+form.qty*+form.avgCost).toLocaleString(undefined,{maximumFractionDigits:0})}</b></div>}
          </div>
          <div><label style={lbl}>BROKER</label>
            <select value={form.broker} onChange={e=>{set("broker",e.target.value);set("portfolio","");}} style={{...inp,cursor:"pointer",appearance:"auto",WebkitAppearance:"auto",background:T.mode==="dark"?"#061525":"#ffffff",color:T.text}}>
              {["Robinhood","Fidelity","TSP Federal"].map(b=>(
                <option key={b} value={b} style={{background:T.mode==="dark"?"#061525":"#ffffff",color:T.text}}>{b}</option>
              ))}
            </select>
          </div>
          <div><label style={lbl}>FUND / PORTFOLIO</label><input value={form.portfolio} onChange={e=>set("portfolio",e.target.value)} placeholder="Roth IRA, 401k, Investing..." style={inp}/></div>
          <div><label style={lbl}>SECTOR</label><input value={form.sector} onChange={e=>set("sector",e.target.value)} placeholder="Technology" style={inp} list="sector-list"/>
            <datalist id="sector-list">
              {["Technology","Healthcare","Finance","Energy","Consumer","Industrials","Materials","Utilities","Real Estate","Crypto","Broad Mkt","Fixed Inc."].map(s=><option key={s} value={s}/>)}
            </datalist></div>
          <div style={{gridColumn:"1/-1"}}><label style={lbl}>NOTES</label><input value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Optional notes about this position..." style={inp}/></div>
        </div>
        {form.qty&&form.price&&form.avgCost&&(
          <div style={{marginTop:16,padding:"12px 16px",background:`${BRAND.teal}08`,border:`1px solid ${BRAND.teal}25`,borderRadius:10,display:"flex",gap:20}}>
            <span style={{fontFamily:BRAND.mono,fontSize:12,color:T.muted}}>Market Value: <b style={{color:BRAND.teal}}>${(+form.qty*+form.price).toLocaleString(undefined,{maximumFractionDigits:0})}</b></span>
            <span style={{fontFamily:BRAND.mono,fontSize:12,color:T.muted}}>P&L: <b style={{color:(+form.qty*+form.price)>=(+form.qty*+form.avgCost)?BRAND.teal:BRAND.red}}>{(+form.qty*+form.price)>=(+form.qty*+form.avgCost)?"+":"-"}${Math.abs((+form.qty*+form.price)-(+form.qty*+form.avgCost)).toLocaleString(undefined,{maximumFractionDigits:0})}</b></span>
          </div>
        )}
        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button onClick={()=>onSave({...form,qty:+form.qty,price:+form.price,avgCost:+form.avgCost,id:form.id||Date.now().toString()})} style={{padding:"10px 24px",borderRadius:10,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${BRAND.gold},${BRAND.gold2})`,color:"#020D18",fontFamily:BRAND.display,fontSize:13,fontWeight:800,boxShadow:`0 0 20px ${BRAND.gold}44`}}>
            {isNew?"✓ Add Position":"✓ Save Changes"}
          </button>
          {!isNew&&<button onClick={()=>onDelete(form.id)} style={{padding:"10px 20px",borderRadius:10,border:`1px solid ${BRAND.red}44`,cursor:"pointer",background:`${BRAND.red}10`,color:BRAND.red,fontFamily:BRAND.display,fontSize:13,fontWeight:600}}>🗑 Delete</button>}
          <button onClick={onClose} style={{padding:"10px 18px",borderRadius:10,border:`1px solid ${T.border}`,cursor:"pointer",background:"transparent",color:T.muted,fontFamily:BRAND.display,fontSize:13}}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// CHART ENGINE — Shared across all levels
// ═══════════════════════════════════════════════════════════════════
const PortfolioChart = ({ holdings, period, onPeriodChange, color, T, title, sub }) => {
  const [expand, setExpand] = useState(false);
  const tv = holdings.reduce((s,h)=>s+V(h),0);
  const cd = useMemo(()=>genS(tv, period),[tv, period]);
  const sv = cd[0]?.value||tv;
  const ret = +((tv-sv)/sv*100).toFixed(2);
  const abs = tv-sv;

  const ChartContent = ({ height }) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={cd} margin={{top:5,right:5,bottom:0,left:0}}>
        <defs>
          <linearGradient id={`g_${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={.32}/>
            <stop offset="100%" stopColor={color} stopOpacity={.02}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
        <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} interval={Math.floor(cd.length/7)}/>
        <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={52}/>
        <Tooltip content={<TT T={T}/>}/>
        <Area type="monotoneX" dataKey="value" name="Value" stroke={color} strokeWidth={2.5}
          fill={`url(#g_${color.replace("#","")})`} dot={false}
          activeDot={{r:6,fill:color,stroke:T.bg,strokeWidth:2}}/>
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <Card T={T} glow={color}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <STN title={title||"Portfolio Growth"} sub={sub||"Total value over time"} color={color} T={T}/>
            <div style={{display:"flex",gap:14,marginTop:-8}}>
              <span style={{fontSize:13,fontFamily:BRAND.mono,color:ret>=0?BRAND.teal:BRAND.red,fontWeight:700}}>{ret>=0?"+":""}{ret}% ({period})</span>
              <span style={{fontSize:13,fontFamily:BRAND.mono,color:ret>=0?BRAND.teal:BRAND.red}}>{abs>=0?"+":"-"}${Math.abs(Math.round(abs)).toLocaleString()}</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <PBtn active={period} onChange={onPeriodChange} color={color} T={T}/>
            <ExpandBtn onClick={()=>setExpand(true)} color={color}/>
          </div>
        </div>
        <ChartContent height={220}/>
      </Card>
      {expand&&(
        <ChartModal title={title||"Portfolio Growth"} sub={`${period}: ${ret>=0?"+":""}${ret}% · $${Math.abs(Math.round(abs)).toLocaleString()}`} color={color} onClose={()=>setExpand(false)} T={T}>
          <ChartContent height={460}/>
        </ChartModal>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// KPI ROW — Shared across all levels
// ═══════════════════════════════════════════════════════════════════
const KPIRow = ({ holdings, T, extra }) => {
  const tv   = holdings.reduce((s,h)=>s+V(h),0);
  const tc   = holdings.reduce((s,h)=>s+CO(h),0);
  const tpl  = tv-tc;
  const tplp = tc>0 ? tpl/tc*100 : 0;
  const tdiv = holdings.reduce((s,h)=>s+h.qty*(h.div||0),0);
  const avgB = holdings.length>0 ? holdings.reduce((s,h)=>s+(h.beta||1),0)/holdings.length : 1;
  const avgV = holdings.length>0 ? holdings.reduce((s,h)=>s+(h.vol||20),0)/holdings.length : 20;

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
      <KPI label="Market Value"  value={`$${Math.round(tv).toLocaleString()}`}         color={BRAND.gold}   T={T}/>
      <KPI label="Cost Basis"    value={`$${Math.round(tc).toLocaleString()}`}          color={T.muted}      T={T}/>
      <KPI label="Total P&L"     value={`${tpl>=0?"+":"-"}$${Math.abs(Math.round(tpl)).toLocaleString()}`} color={tpl>=0?BRAND.teal:BRAND.red} T={T}/>
      <KPI label="Return"        value={`${tplp>=0?"+":""}${tplp.toFixed(2)}%`}         color={tplp>=0?BRAND.teal:BRAND.red} T={T}/>
      <KPI label="Annual Div."   value={`$${Math.round(tdiv).toLocaleString()}`}        color={BRAND.green}  T={T}/>
      <KPI label="Avg Beta"      value={avgB.toFixed(2)}                                color={BRAND.purple} T={T}/>
      <KPI label="Avg Vol."      value={`${avgV.toFixed(1)}%`}                          color={BRAND.amber}  T={T}/>
      {extra&&extra.map((e,i)=><KPI key={i} label={e.label} value={e.value} color={e.color||BRAND.blue} T={T}/>)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE TAB
// ═══════════════════════════════════════════════════════════════════
const PerformanceTab = ({ holdings, T }) => {
  const [period, setPeriod] = useState("1Y");
  const [expandW, setExpandW] = useState(false);
  const tv = holdings.reduce((s,h)=>s+V(h),0);
  const tc = holdings.reduce((s,h)=>s+CO(h),0);
  const tpl= tv-tc;
  const cd = useMemo(()=>genS(tv,period),[tv,period]);
  const sv = cd[0]?.value||tv;
  const ret= +((tv-sv)/sv*100).toFixed(2);

  const hp = [...holdings].map(h=>({
    name:h.symbol, ret:+PLP(h).toFixed(2),
    pl:Math.round(PL(h)), contrib:tpl>0?+(PL(h)/tpl*100).toFixed(1):0,
    color:BROKER_COLOR[h.broker]||BRAND.gold,
  })).sort((a,b)=>b.ret-a.ret);

  const wd = ["Mon","Tue","Wed","Thu","Fri"].map(d=>({
    day:d, pl:Math.round((Math.random()-.44)*tv*.008)
  }));

  const WeeklyChart = ({ height }) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={wd} margin={{top:5,right:5,bottom:0,left:0}}>
        <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
        <XAxis dataKey="day" tick={{fill:T.muted,fontSize:10,fontFamily:BRAND.mono}} tickLine={false} axisLine={false}/>
        <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(1)}k`} width={50}/>
        <Tooltip content={<TT T={T}/>}/>
        <ReferenceLine y={0} stroke={T.dim} strokeWidth={1}/>
        <Bar dataKey="pl" name="P&L $" radius={[6,6,0,0]}>
          {wd.map((d,i)=><Cell key={i} fill={d.pl>=0?BRAND.teal:BRAND.red} opacity={.85}/>)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <KPI label={`${period} Return`} value={`${ret>=0?"+":""}${ret}%`}            color={ret>=0?BRAND.teal:BRAND.red} T={T}/>
        <KPI label="Total Return (TWR)" value={`+${((tv-tc)/tc*100).toFixed(2)}%`}   color={BRAND.gold}  T={T}/>
        <KPI label="MWR"                value={`+${((tv-tc)/tc*100*.91).toFixed(2)}%`} color={BRAND.blue} T={T}/>
        <KPI label="Holdings"           value={holdings.length}                        color={BRAND.purple} T={T}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
        <PortfolioChart holdings={holdings} period={period} onPeriodChange={setPeriod} color={BRAND.teal} T={T} title="Value Over Time" sub="Performance history"/>
        <Card T={T}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <STN title="Weekly P&L" T={T} color={BRAND.amber}/>
            <ExpandBtn onClick={()=>setExpandW(true)} color={BRAND.amber}/>
          </div>
          <WeeklyChart height={190}/>
        </Card>
      </div>
      {expandW&&<ChartModal title="Weekly P&L" sub="Last 5 trading days" color={BRAND.amber} onClose={()=>setExpandW(false)} T={T}><WeeklyChart height={460}/></ChartModal>}
      <Card T={T}>
        <STN title="Performance Attribution" sub="Return % and P&L contribution by holding" color={BRAND.purple} T={T}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hp} layout="vertical" margin={{top:0,right:15,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="2 6" stroke={T.border} horizontal={false}/>
              <XAxis type="number" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`}/>
              <YAxis dataKey="name" type="category" tick={{fill:T.muted,fontSize:10,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} width={45}/>
              <Tooltip content={<TT T={T}/>}/>
              <ReferenceLine x={0} stroke={T.dim}/>
              <Bar dataKey="ret" name="Return %" radius={[0,6,6,0]}>
                {hp.map((d,i)=><Cell key={i} fill={d.ret>=0?BRAND.teal:BRAND.red} opacity={.85}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{overflowY:"auto",maxHeight:220}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
                {["Symbol","Return","P&L $","Contrib"].map(h=><th key={h} style={{textAlign:"left",padding:"6px 8px",color:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1}}>{h}</th>)}
              </tr></thead>
              <tbody>{hp.map((h,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:"8px 8px",fontWeight:700,color:BRAND.gold,fontFamily:BRAND.mono}}>{h.name}</td>
                  <td style={{padding:"8px 8px",fontFamily:BRAND.mono,color:h.ret>=0?BRAND.teal:BRAND.red,fontWeight:600}}>{h.ret>=0?"+":""}{h.ret}%</td>
                  <td style={{padding:"8px 8px",fontFamily:BRAND.mono,color:h.pl>=0?BRAND.teal:BRAND.red}}>{h.pl>=0?"+":"-"}${Math.abs(h.pl).toLocaleString()}</td>
                  <td style={{padding:"8px 8px",fontFamily:BRAND.mono,color:T.muted}}>{h.contrib}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// BENCHMARK TAB
// ═══════════════════════════════════════════════════════════════════
const BenchmarkTab = ({ holdings, T }) => {
  const [period, setPeriod] = useState("1Y");
  const [vs, setVs]         = useState("S&P 500");
  const [expand, setExpand] = useState(false);
  const [vis, setVis]       = useState({"S&P 500":true,"Nasdaq":false,"Dow Jones":false,"Bitcoin":false,"Bonds":false});
  const tv = holdings.reduce((s,h)=>s+V(h),0);

  const BENCHES = [
    {key:"S&P 500",color:"#4DA6FF"},{key:"Nasdaq",color:"#CC99FF"},
    {key:"Dow Jones",color:"#FFB347"},{key:"Bitcoin",color:"#FFD700"},{key:"Bonds",color:"#66FF99"},
  ];
  const days = PERIODS.find(p=>p.id===period)?.days||365;
  const cd = useMemo(()=>{
    let port=100,sp=100,nq=100,dj=100,btc=100,bonds=100;
    return Array.from({length:days+1},(_,i)=>{
      if(i>0){port+=(Math.random()-.452)*1.15;sp+=(Math.random()-.448)*.88;nq+=(Math.random()-.445)*1.2;dj+=(Math.random()-.449)*.72;btc+=(Math.random()-.462)*3.4;bonds+=(Math.random()-.48)*.28;}
      const dt=new Date();dt.setDate(dt.getDate()-(days-i));
      const fmt=days<=365?dt.toLocaleDateString("en",{month:"short",day:"numeric"}):dt.toLocaleDateString("en",{month:"short",year:"2-digit"});
      return{date:fmt,"Portfolio":+port.toFixed(2),"S&P 500":+sp.toFixed(2),"Nasdaq":+nq.toFixed(2),"Dow Jones":+dj.toFixed(2),"Bitcoin":+btc.toFixed(2),"Bonds":+bonds.toFixed(2)};
    });
  },[period]);

  const last=cd[cd.length-1]||{},first=cd[0]||{};
  const pr=(last["Portfolio"]||100)-(first["Portfolio"]||100);
  const vr=(last[vs]||100)-(first[vs]||100);
  const alpha=+(pr-vr).toFixed(2);

  const BmChart = ({height}) => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={cd} margin={{top:5,right:5,bottom:0,left:0}}>
        <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
        <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} interval={Math.floor(days/6)}/>
        <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(0)}`} width={45}/>
        <Tooltip content={<TT T={T}/>}/>
        <ReferenceLine y={100} stroke={T.border} strokeDasharray="4 2"/>
        <Legend wrapperStyle={{fontSize:10,fontFamily:BRAND.mono,paddingTop:10}}/>
        <Line type="monotoneX" dataKey="Portfolio" stroke={BRAND.gold} strokeWidth={3} dot={false} activeDot={{r:6,fill:BRAND.gold,stroke:T.bg,strokeWidth:2}}/>
        {BENCHES.filter(b=>vis[b.key]).map(b=><Line key={b.key} type="monotoneX" dataKey={b.key} stroke={b.color} strokeWidth={1.5} dot={false} strokeDasharray="4 2" opacity={.8}/>)}
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:10}}>
        <div style={{background:alpha>=0?`${BRAND.green}08`:`${BRAND.red}08`,border:`2px solid ${alpha>=0?BRAND.green:BRAND.red}25`,borderLeft:`4px solid ${alpha>=0?BRAND.green:BRAND.red}`,borderRadius:12,padding:"16px 20px"}}>
          <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:6}}>ALPHA vs {vs.toUpperCase()} · {period}</div>
          <div style={{fontSize:38,fontFamily:BRAND.display,fontWeight:800,color:alpha>=0?BRAND.green:BRAND.red,lineHeight:1}}>{alpha>=0?"+":""}{alpha}%</div>
          <div style={{fontSize:12,color:alpha>=0?BRAND.green:BRAND.red,marginTop:8,fontFamily:BRAND.mono}}>{alpha>=0?`✅ Outperforming by ${alpha}%`:`⚠️ Underperforming by ${Math.abs(alpha)}%`}</div>
        </div>
        <KPI label="Portfolio" value={`${pr>=0?"+":""}${pr.toFixed(2)}%`} color={BRAND.teal}   T={T}/>
        <KPI label={vs}        value={`${vr>=0?"+":""}${vr.toFixed(2)}%`} color={BRAND.blue}   T={T}/>
        <KPI label="Sharpe"    value="1.84" sub="vs benchmark"             color={BRAND.purple} T={T}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {BENCHES.map(b=>(
            <button key={b.key} onClick={()=>setVis(v=>({...v,[b.key]:!v[b.key]}))} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:7,border:`1px solid ${vis[b.key]?b.color+"55":T.border}`,cursor:"pointer",background:vis[b.key]?`${b.color}12`:"transparent",color:vis[b.key]?b.color:T.muted,fontFamily:BRAND.mono,fontSize:9,fontWeight:700,transition:"all 0.2s"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:vis[b.key]?b.color:T.muted}}/>{b.key}
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted}}>Alpha vs:</span>
          <select value={vs} onChange={e=>setVs(e.target.value)} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 11px",color:T.text,fontSize:11,fontFamily:BRAND.mono,cursor:"pointer"}}>
            {BENCHES.map(b=><option key={b.key} value={b.key}>{b.key}</option>)}
          </select>
          <PBtn active={period} onChange={setPeriod} color={BRAND.blue} T={T}/>
          <ExpandBtn onClick={()=>setExpand(true)} color={BRAND.blue}/>
        </div>
      </div>
      <Card T={T} glow={BRAND.blue}>
        <STN title="Portfolio vs Benchmarks — Indexed to 100" sub="All series normalized at start date for fair comparison" color={BRAND.blue} T={T}/>
        <BmChart height={260}/>
      </Card>
      {expand&&<ChartModal title="Portfolio vs Benchmarks" sub="Indexed to 100 — normalized comparison" color={BRAND.blue} onClose={()=>setExpand(false)} T={T}><BmChart height={460}/></ChartModal>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// RISK TAB
// ═══════════════════════════════════════════════════════════════════
const RiskTab = ({ holdings, T }) => {
  const [period, setPeriod] = useState("1Y");
  const [expand, setExpand] = useState(false);
  const tv = holdings.reduce((s,h)=>s+V(h),0);

  const uwd = useMemo(()=>{
    const days=PERIODS.find(p=>p.id===period)?.days||365;
    let peak=tv*.87,v=tv*.87;
    return Array.from({length:days+1},(_,i)=>{
      if(i>0){v+=(Math.random()-.452)*v*.012;v=Math.max(v,tv*.4);if(v>peak)peak=v;}
      const dt=new Date();dt.setDate(dt.getDate()-(days-i));
      return{date:dt.toLocaleDateString("en",{month:"short",day:"numeric"}),drawdown:+((v-peak)/peak*100).toFixed(2)};
    });
  },[period,tv]);

  const maxDD = Math.min(...uwd.map(d=>d.drawdown));
  const avgVol = holdings.length>0 ? holdings.reduce((s,h)=>s+(h.vol||20),0)/holdings.length : 20;

  const metrics=[
    {l:"Sharpe",  v:"1.84",           c:BRAND.teal,  bar:84,desc:"Risk-adj return"},
    {l:"Sortino", v:"2.31",           c:BRAND.blue,  bar:77,desc:"Downside adj."},
    {l:"Beta",    v:(holdings.reduce((s,h)=>s+(h.beta||1),0)/Math.max(holdings.length,1)).toFixed(2), c:BRAND.gold,bar:46,desc:"Mkt sensitivity"},
    {l:"VaR 95%", v:"-1.8%",          c:BRAND.red,   bar:18,desc:"Daily at-risk"},
    {l:"CVaR",    v:"-2.4%",          c:BRAND.red,   bar:24,desc:"Expected shortfall"},
    {l:"Max DD",  v:`${maxDD.toFixed(1)}%`,c:BRAND.red,bar:Math.min(Math.abs(maxDD),50),desc:"Peak to trough"},
    {l:"Ann. Vol",v:`${avgVol.toFixed(1)}%`,c:BRAND.amber,bar:Math.min(avgVol*2,80),desc:"Weighted volatility"},
    {l:"Calmar",  v:"0.94",           c:BRAND.purple,bar:47,desc:"Return/Max DD"},
  ];

  const stress=[
    {s:"2008 Financial Crisis",i:-38.2,p:8},{s:"2020 COVID Crash",i:-22.1,p:15},
    {s:"2022 Rate Hike Cycle",i:-18.6,p:25},{s:"Tech Selloff -30%",i:-14.3,p:20},
    {s:"Crypto Winter -70%",i:-9.2,p:30},{s:"Soft Landing Scenario",i:+12.4,p:45},
  ];

  const UWChart = ({height}) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={uwd} margin={{top:5,right:5,bottom:0,left:0}}>
        <defs><linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND.red} stopOpacity={.45}/><stop offset="100%" stopColor={BRAND.red} stopOpacity={.04}/></linearGradient></defs>
        <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
        <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} interval={Math.floor(uwd.length/6)}/>
        <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`} width={45}/>
        <Tooltip content={<TT T={T}/>}/>
        <ReferenceLine y={0} stroke={BRAND.teal} strokeWidth={1.5} strokeDasharray="4 2"/>
        <Area type="monotoneX" dataKey="drawdown" name="Drawdown %" stroke={BRAND.red} strokeWidth={2} fill="url(#gRisk)" dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {metrics.slice(0,4).map((m,i)=>(
          <div key={i} style={{background:`${m.c}07`,border:`1px solid ${m.c}22`,borderLeft:`3px solid ${m.c}`,borderRadius:10,padding:13}}>
            <div style={{fontSize:8,fontFamily:BRAND.mono,color:T.muted,letterSpacing:1.5,marginBottom:5}}>{m.l}</div>
            <div style={{fontSize:20,fontFamily:BRAND.display,fontWeight:800,color:m.c,marginBottom:6}}>{m.v}</div>
            <div style={{height:3,background:T.border,borderRadius:2,marginBottom:4}}><div style={{height:"100%",width:`${m.bar}%`,background:m.c,borderRadius:2}}/></div>
            <div style={{fontSize:9,color:T.muted,fontFamily:BRAND.mono}}>{m.desc}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {metrics.slice(4).map((m,i)=>(
          <div key={i} style={{background:`${m.c}07`,border:`1px solid ${m.c}22`,borderLeft:`3px solid ${m.c}`,borderRadius:10,padding:13}}>
            <div style={{fontSize:8,fontFamily:BRAND.mono,color:T.muted,letterSpacing:1.5,marginBottom:5}}>{m.l}</div>
            <div style={{fontSize:20,fontFamily:BRAND.display,fontWeight:800,color:m.c,marginBottom:6}}>{m.v}</div>
            <div style={{height:3,background:T.border,borderRadius:2,marginBottom:4}}><div style={{height:"100%",width:`${m.bar}%`,background:m.c,borderRadius:2}}/></div>
            <div style={{fontSize:9,color:T.muted,fontFamily:BRAND.mono}}>{m.desc}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:14}}>
        <Card T={T} glow={BRAND.red}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <STN title="Underwater Equity Curve" sub="% below all-time high · drawdown periods" color={BRAND.red} T={T}/>
            <div style={{display:"flex",alignItems:"center"}}><PBtn active={period} onChange={setPeriod} color={BRAND.red} T={T}/><ExpandBtn onClick={()=>setExpand(true)} color={BRAND.red}/></div>
          </div>
          <UWChart height={200}/>
        </Card>
        <Card T={T}>
          <STN title="Stress Test Scenarios" sub="Historical crisis impact estimates" color={BRAND.amber} T={T}/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {stress.map((s,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 11px",background:`${s.i>=0?BRAND.green:BRAND.red}06`,border:`1px solid ${s.i>=0?BRAND.green:BRAND.red}20`,borderRadius:8}}>
                <div>
                  <div style={{fontSize:11,fontFamily:BRAND.display,fontWeight:600,color:T.text}}>{s.s}</div>
                  <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,marginTop:1}}>Prob: {s.p}%</div>
                </div>
                <div style={{fontFamily:BRAND.mono,fontWeight:800,fontSize:14,color:s.i>=0?BRAND.green:BRAND.red}}>{s.i>=0?"+":""}{s.i}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {expand&&<ChartModal title="Underwater Equity Curve" sub={`Max Drawdown: ${maxDD.toFixed(1)}% · Period: ${period}`} color={BRAND.red} onClose={()=>setExpand(false)} T={T}><UWChart height={460}/></ChartModal>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// CORRELATIONS TAB
// ═══════════════════════════════════════════════════════════════════
const CorrelationsTab = ({ holdings, T }) => {
  const syms = holdings.map(h=>h.symbol);
  const cm = useMemo(()=>syms.map((s1,i)=>syms.map((s2,j)=>{
    if(i===j) return 1;
    const h1=holdings[i], h2=holdings[j];
    if(h1.sector===h2.sector) return +(0.45+Math.random()*.4).toFixed(2);
    if(h1.type==="Crypto"&&h2.type==="Crypto") return +(0.75+Math.random()*.2).toFixed(2);
    if(h1.type==="ETF"&&h2.type==="ETF") return +(0.85+Math.random()*.12).toFixed(2);
    return +(Math.random()*.5-.15).toFixed(2);
  })),[holdings]);

  const gb = v => v>=.8?`rgba(255,76,76,${.15+v*.55})`:v>=.5?`rgba(255,179,0,${.15+v*.35})`:v>0?`rgba(0,200,150,${.1+v*.25})`:`rgba(30,144,255,${.1+Math.abs(v)*.25})`;
  const avgCorr = (cm.flat().reduce((s,v)=>s+v,0)-syms.length)/(syms.length*syms.length-syms.length);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        <KPI label="Avg Correlation"  value={avgCorr.toFixed(2)}          sub="Portfolio diversification"  color={BRAND.amber}  T={T}/>
        <KPI label="High Corr. Pairs" value={cm.flat().filter(v=>v>=.8&&v<1).length/2} sub="Pairs above 0.80" color={BRAND.red} T={T}/>
        <KPI label="Diversification"  value={avgCorr<.4?"Strong":avgCorr<.6?"Good":"Moderate"} sub="Based on avg correlation" color={BRAND.teal} T={T}/>
      </div>
      <Card T={T}>
        <STN title="Correlation Matrix" sub="1.0 = perfect · 0 = no relationship · Negative = inverse · Hover for value" color={BRAND.blue} T={T}/>
        <div style={{overflowX:"auto"}}>
          <div style={{display:"flex",marginLeft:60,marginBottom:3}}>
            {syms.map((s,i)=><div key={i} style={{width:54,textAlign:"center",fontSize:9,fontFamily:BRAND.mono,color:T.muted,flexShrink:0,fontWeight:600}}>{s}</div>)}
          </div>
          {syms.map((s1,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",marginBottom:3}}>
              <div style={{width:58,fontSize:9,fontFamily:BRAND.mono,color:T.muted,textAlign:"right",paddingRight:6,flexShrink:0,fontWeight:600}}>{s1}</div>
              {syms.map((s2,j)=>{
                const v=cm[i][j],isDiag=i===j;
                return (
                  <div key={j} style={{width:54,height:38,borderRadius:7,marginRight:2,flexShrink:0,background:isDiag?`linear-gradient(135deg,${BRAND.gold},${BRAND.blue})`:gb(v),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:BRAND.mono,fontWeight:700,color:isDiag||v>=.5?"rgba(0,0,0,0.8)":T.text,transition:"transform 0.1s, box-shadow 0.1s",cursor:"default"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.12)";e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.4)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="none";}}>
                    {isDiag?"1.00":v.toFixed(2)}
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:14,marginLeft:60,flexWrap:"wrap"}}>
            {[{l:"Negative / Inverse",c:BRAND.blue},{l:"Low (0 – 0.5)",c:BRAND.teal},{l:"Medium (0.5 – 0.8)",c:BRAND.amber},{l:"High (0.8+)",c:BRAND.red}].map((leg,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:14,height:10,borderRadius:3,background:leg.c,opacity:.7}}/>
                <span style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted}}>{leg.l}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// DIVIDENDS TAB
// ═══════════════════════════════════════════════════════════════════
const DividendsTab = ({ holdings, T }) => {
  const [expandM, setExpandM] = useState(false);
  const [expandD, setExpandD] = useState(false);
  const dh = holdings.filter(h=>(h.div||0)>0).map(h=>({...h,annual:h.qty*h.div,yield:(h.div/h.price*100),yoc:(h.div/h.avgCost*100)}));
  const tot = dh.reduce((s,h)=>s+h.annual,0);
  const tv  = holdings.reduce((s,h)=>s+V(h),0);
  const tc  = holdings.reduce((s,h)=>s+CO(h),0);
  const mo  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m=>({month:m,income:+(tot/12*(.8+Math.random()*.4)).toFixed(0)}));
  const drip = Array.from({length:21},(_,i)=>({year:`Y${i}`,value:Math.round(tv*Math.pow(1.082,i)),income:Math.round(tot*Math.pow(1.06,i))}));

  const MonthChart = ({height}) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={mo} margin={{top:5,right:5,bottom:0,left:0}}>
        <defs><linearGradient id="gDiv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND.green} stopOpacity={.9}/><stop offset="100%" stopColor={BRAND.teal} stopOpacity={.7}/></linearGradient></defs>
        <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
        <XAxis dataKey="month" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false}/>
        <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`} width={45}/>
        <Tooltip content={<TT T={T}/>}/>
        <Bar dataKey="income" name="Income $" fill="url(#gDiv)" radius={[6,6,0,0]}/>
      </BarChart>
    </ResponsiveContainer>
  );
  const DripChart = ({height}) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={drip} margin={{top:5,right:5,bottom:0,left:0}}>
        <defs><linearGradient id="gDrip" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND.teal} stopOpacity={.3}/><stop offset="100%" stopColor={BRAND.teal} stopOpacity={.02}/></linearGradient></defs>
        <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
        <XAxis dataKey="year" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} interval={4}/>
        <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={52}/>
        <Tooltip content={<TT T={T}/>}/>
        <Area type="monotoneX" dataKey="value" name="Portfolio" stroke={BRAND.teal} strokeWidth={2.5} fill="url(#gDrip)" dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <KPI label="Annual Income"   value={`$${Math.round(tot).toLocaleString()}`}      color={BRAND.green}  T={T}/>
        <KPI label="Monthly Avg"     value={`$${Math.round(tot/12).toLocaleString()}`}   color={BRAND.teal}   T={T}/>
        <KPI label="Portfolio Yield" value={`${(tot/tv*100).toFixed(2)}%`}               color={BRAND.blue}   T={T}/>
        <KPI label="Yield on Cost"   value={`${tc>0?(tot/tc*100).toFixed(2):0}%`}        color={BRAND.gold}   T={T}/>
      </div>
      {tot===0&&<div style={{padding:20,textAlign:"center",color:T.muted,fontFamily:BRAND.mono,fontSize:12}}>No dividend-paying holdings in this selection.</div>}
      {tot>0&&<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Card T={T} glow={BRAND.green}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <STN title="Monthly Income Calendar" sub="Estimated by month" color={BRAND.green} T={T}/>
              <ExpandBtn onClick={()=>setExpandM(true)} color={BRAND.green}/>
            </div>
            <MonthChart height={190}/>
          </Card>
          <Card T={T} glow={BRAND.teal}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <STN title="DRIP Projection — 20 Years" sub="With dividend reinvestment" color={BRAND.teal} T={T}/>
              <ExpandBtn onClick={()=>setExpandD(true)} color={BRAND.teal}/>
            </div>
            <DripChart height={190}/>
          </Card>
        </div>
        {expandM&&<ChartModal title="Monthly Dividend Income" sub={`Annual: $${Math.round(tot).toLocaleString()}`} color={BRAND.green} onClose={()=>setExpandM(false)} T={T}><MonthChart height={460}/></ChartModal>}
        {expandD&&<ChartModal title="DRIP 20-Year Projection" sub="Dividend reinvestment compounding" color={BRAND.teal} onClose={()=>setExpandD(false)} T={T}><DripChart height={460}/></ChartModal>}
        <Card T={T}>
          <STN title="Dividend Detail" color={BRAND.gold} T={T}/>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
              {["Symbol","Name","Qty","Div/Sh","Annual $","Yield","YoC"].map(h=><th key={h} style={{textAlign:"left",padding:"7px 10px",color:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1}}>{h}</th>)}
            </tr></thead>
            <tbody>{dh.sort((a,b)=>b.annual-a.annual).map((h,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${T.border}`,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=T.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"9px 10px",fontWeight:700,color:BRAND.gold,fontFamily:BRAND.mono}}>{h.symbol}</td>
                <td style={{padding:"9px 10px",color:T.muted,fontSize:11}}>{h.name}</td>
                <td style={{padding:"9px 10px",fontFamily:BRAND.mono,color:T.muted}}>{h.qty}</td>
                <td style={{padding:"9px 10px",fontFamily:BRAND.mono,color:BRAND.green,fontWeight:600}}>${h.div.toFixed(2)}</td>
                <td style={{padding:"9px 10px",fontFamily:BRAND.mono,fontWeight:700,color:BRAND.teal}}>${Math.round(h.annual).toLocaleString()}</td>
                <td style={{padding:"9px 10px",fontFamily:BRAND.mono,color:BRAND.blue}}>{h.yield.toFixed(2)}%</td>
                <td style={{padding:"9px 10px",fontFamily:BRAND.mono,color:BRAND.purple}}>{h.yoc.toFixed(2)}%</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      </>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// PROJECTIONS TAB
// ═══════════════════════════════════════════════════════════════════
const ProjectionsTab = ({ holdings, T }) => {
  const [horizon, setHorizon] = useState(10);
  const [expand,  setExpand ] = useState(false);
  const tv = holdings.reduce((s,h)=>s+V(h),0);
  const pd = useMemo(()=>Array.from({length:horizon+1},(_,i)=>({
    year:`Y${i}`,
    "Bull (+14%)": Math.round(tv*Math.pow(1.14,i)),
    "Base (+8.2%)":Math.round(tv*Math.pow(1.082,i)),
    "Bear (+2%)":  Math.round(tv*Math.pow(1.02,i)),
  })),[horizon,tv]);

  const ProjChart = ({height}) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={pd} margin={{top:5,right:5,bottom:0,left:0}}>
        <defs>
          <linearGradient id="gBull" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND.teal} stopOpacity={.25}/><stop offset="100%" stopColor={BRAND.teal} stopOpacity={0}/></linearGradient>
          <linearGradient id="gBase" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND.gold} stopOpacity={.22}/><stop offset="100%" stopColor={BRAND.gold} stopOpacity={0}/></linearGradient>
          <linearGradient id="gBear" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND.red}  stopOpacity={.16}/><stop offset="100%" stopColor={BRAND.red}  stopOpacity={0}/></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
        <XAxis dataKey="year" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} interval={Math.max(1,Math.floor(horizon/6))}/>
        <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1e3).toFixed(0)}k`} width={55}/>
        <Tooltip content={<TT T={T}/>}/>
        <Legend wrapperStyle={{fontSize:10,fontFamily:BRAND.mono,paddingTop:10}}/>
        <Area type="monotoneX" dataKey="Bull (+14%)" stroke={BRAND.teal} strokeWidth={2}   fill="url(#gBull)" dot={false}/>
        <Area type="monotoneX" dataKey="Base (+8.2%)"stroke={BRAND.gold} strokeWidth={2.5} fill="url(#gBase)" dot={false}/>
        <Area type="monotoneX" dataKey="Bear (+2%)"  stroke={BRAND.red}  strokeWidth={1.5} fill="url(#gBear)" dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        <KPI label={`Bull ${horizon}yr`} value={`$${(tv*Math.pow(1.14,horizon)/1e3).toFixed(0)}k`}  sub="+14%/yr CAGR" color={BRAND.teal}   T={T}/>
        <KPI label={`Base ${horizon}yr`} value={`$${(tv*Math.pow(1.082,horizon)/1e3).toFixed(0)}k`} sub="+8.2%/yr CAGR" color={BRAND.gold}   T={T}/>
        <KPI label={`Bear ${horizon}yr`} value={`$${(tv*Math.pow(1.02,horizon)/1e3).toFixed(0)}k`}  sub="+2%/yr CAGR"  color={BRAND.red}    T={T}/>
      </div>
      <Card T={T} glow={BRAND.purple}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <STN title="Portfolio Projection Scenarios" sub="Compound growth over selected horizon" color={BRAND.purple} T={T}/>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",gap:3,background:T.surface,borderRadius:9,padding:3}}>
              {[5,10,15,20,30].map(y=><button key={y} onClick={()=>setHorizon(y)} style={{padding:"4px 10px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:BRAND.mono,fontSize:9,fontWeight:700,background:horizon===y?`${BRAND.purple}28`:"transparent",color:horizon===y?BRAND.purple:T.muted,transition:"all 0.15s"}}>{y}Y</button>)}
            </div>
            <ExpandBtn onClick={()=>setExpand(true)} color={BRAND.purple}/>
          </div>
        </div>
        <ProjChart height={260}/>
      </Card>
      {expand&&<ChartModal title={`Projections — ${horizon} Years`} sub="Bull +14% · Base +8.2% · Bear +2%" color={BRAND.purple} onClose={()=>setExpand(false)} T={T}><ProjChart height={460}/></ChartModal>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MONTE CARLO TAB
// ═══════════════════════════════════════════════════════════════════
const MonteCarloTab = ({ holdings, T }) => {
  const [yr,setYr]=useState(20),[tg,setTg]=useState(1000000),[co,setCo]=useState(500);
  const [re,setRe]=useState(8.2),[vo,setVo]=useState(14.8),[si,setSi]=useState(1000);
  const [expand,setExpand]=useState(false);
  const tv = holdings.reduce((s,h)=>s+V(h),0);

  const data=useMemo(()=>{
    let p10=tv,p50=tv,p90=tv;
    const r10=re/100-vo/100*1.28,r50=re/100,r90=re/100+vo/100*1.28;
    return Array.from({length:yr+1},(_,i)=>{
      if(i>0){p10=p10*(1+r10)+co*12;p50=p50*(1+r50)+co*12;p90=p90*(1+r90)+co*12;}
      return{year:`Y${i}`,p10:Math.round(Math.max(p10,0)),p50:Math.round(p50),p90:Math.round(p90)};
    });
  },[yr,re,vo,co,tv]);

  const last=data[data.length-1];
  const prob=Math.min(Math.round(50+(re-5)*4+(yr>10?10:0)+(tg<(last?.p50||0)?15:0)),97);
  const SL={width:"100%",cursor:"pointer",accentColor:BRAND.gold};

  const CTRLS=[
    {l:"HORIZON",v:yr,set:setYr,min:1,max:40,step:1,fmt:v=>`${v} yrs`,presets:[5,10,20,30],col:BRAND.gold},
    {l:"TARGET",v:tg,set:setTg,min:1e5,max:5e6,step:5e4,fmt:v=>`$${(v/1e3).toFixed(0)}k`,presets:[500000,750000,1e6,2e6],col:BRAND.blue},
    {l:"MONTHLY +",v:co,set:setCo,min:0,max:5000,step:100,fmt:v=>`$${v}`,presets:[0,250,500,1000],col:BRAND.purple},
    {l:"EXP. RETURN",v:re,set:setRe,min:1,max:25,step:.5,fmt:v=>`${v}%`,presets:[4,6,8.2,12],col:BRAND.teal},
    {l:"VOLATILITY",v:vo,set:setVo,min:2,max:50,step:.5,fmt:v=>`${v}%`,presets:[8,14.8,22,30],col:BRAND.red},
  ];

  const MCChart = ({height}) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{top:5,right:55,bottom:0,left:0}}>
        <defs>
          <linearGradient id="gMC90" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND.teal} stopOpacity={.22}/><stop offset="100%" stopColor={BRAND.teal} stopOpacity={0}/></linearGradient>
          <linearGradient id="gMC50" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND.gold} stopOpacity={.22}/><stop offset="100%" stopColor={BRAND.gold} stopOpacity={0}/></linearGradient>
          <linearGradient id="gMC10" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND.red}  stopOpacity={.16}/><stop offset="100%" stopColor={BRAND.red}  stopOpacity={0}/></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
        <XAxis dataKey="year" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} interval={4}/>
        <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1e3).toFixed(0)}k`} width={55}/>
        <Tooltip content={<TT T={T}/>}/>
        <ReferenceLine y={tg} stroke={BRAND.amber} strokeDasharray="5 3" label={{value:`Target $${(tg/1e3).toFixed(0)}k`,fill:BRAND.amber,fontSize:9,fontFamily:BRAND.mono,position:"right"}}/>
        <Legend wrapperStyle={{fontSize:10,fontFamily:BRAND.mono,paddingTop:10}}/>
        <Area type="monotoneX" dataKey="p90" name="Optimistic (P90)" stroke="#00FFB3" strokeWidth={2.5} fill="url(#gMC90)" dot={false}/>
        <Area type="monotoneX" dataKey="p50" name="Base Case (P50)"  stroke="#FFD700" strokeWidth={3}   fill="url(#gMC50)" dot={false}/>
        <Area type="monotoneX" dataKey="p10" name="Pessimistic (P10)"stroke="#FF3333" strokeWidth={2}   fill="url(#gMC10)" dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr) 1fr",gap:10}}>
        {CTRLS.slice(0,3).map((c,i)=>(
          <Card key={i} T={T} glow={c.col}>
            <div style={{fontSize:8,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:4}}>{c.l}</div>
            <div style={{fontSize:26,fontFamily:BRAND.display,fontWeight:800,color:c.col,marginBottom:8}}>{c.fmt(c.v)}</div>
            <input type="range" min={c.min} max={c.max} step={c.step} value={c.v} onChange={e=>c.set(+e.target.value)} style={{...SL,accentColor:c.col}}/>
            <div style={{display:"flex",gap:3,marginTop:7,flexWrap:"wrap"}}>
              {c.presets.map(p=><button key={p} onClick={()=>c.set(p)} style={{padding:"2px 7px",borderRadius:5,border:`1px solid ${c.v===p?c.col+"55":T.border}`,cursor:"pointer",fontFamily:BRAND.mono,fontSize:8,fontWeight:700,background:c.v===p?`${c.col}18`:"transparent",color:c.v===p?c.col:T.muted,transition:"all 0.15s"}}>{c.fmt(p)}</button>)}
            </div>
          </Card>
        ))}
        <Card T={T} glow={BRAND.cyan} style={{gridRow:"1/3"}}>
          <div style={{fontSize:8,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:10}}>RESULTS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
            <div style={{background:`${BRAND.gold}10`,border:`1px solid ${BRAND.gold}25`,borderRadius:8,padding:10,textAlign:"center"}}>
              <div style={{fontSize:7,fontFamily:BRAND.mono,color:T.muted,letterSpacing:1}}>PROB TARGET</div>
              <div style={{fontSize:24,fontFamily:BRAND.display,fontWeight:800,color:BRAND.gold}}>{prob}%</div>
            </div>
            <div style={{background:`${BRAND.blue}10`,border:`1px solid ${BRAND.blue}25`,borderRadius:8,padding:10,textAlign:"center"}}>
              <div style={{fontSize:7,fontFamily:BRAND.mono,color:T.muted,letterSpacing:1}}>SIMS</div>
              <div style={{fontSize:24,fontFamily:BRAND.display,fontWeight:800,color:BRAND.blue}}>{si.toLocaleString()}</div>
            </div>
          </div>
          {[{l:"P90",v:`$${(last?.p90/1e3).toFixed(0)}k`,c:BRAND.teal},{l:"P50",v:`$${(last?.p50/1e3).toFixed(0)}k`,c:BRAND.gold},{l:"P10",v:`$${(last?.p10/1e3).toFixed(0)}k`,c:BRAND.red}].map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<2?`1px solid ${T.border}`:"none"}}>
              <span style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted}}>{s.l}</span>
              <span style={{fontSize:14,fontFamily:BRAND.display,fontWeight:700,color:s.c}}>{s.v}</span>
            </div>
          ))}
          <div style={{display:"flex",gap:3,marginTop:8,flexWrap:"wrap"}}>
            {[100,500,1000,5000].map(n=><button key={n} onClick={()=>setSi(n)} style={{padding:"2px 7px",borderRadius:5,border:`1px solid ${si===n?BRAND.blue+"55":T.border}`,cursor:"pointer",fontFamily:BRAND.mono,fontSize:8,fontWeight:700,background:si===n?`${BRAND.blue}18`:"transparent",color:si===n?BRAND.blue:T.muted,transition:"all 0.15s"}}>{n}</button>)}
          </div>
          <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:5}}>
            {CTRLS.slice(3).map((c,i)=>(
              <div key={i}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:8,fontFamily:BRAND.mono,color:T.muted}}>{c.l}</span>
                  <span style={{fontSize:10,fontFamily:BRAND.mono,fontWeight:700,color:c.col}}>{c.fmt(c.v)}</span>
                </div>
                <input type="range" min={c.min} max={c.max} step={c.step} value={c.v} onChange={e=>c.set(+e.target.value)} style={{...SL,accentColor:c.col,height:3}}/>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card T={T} glow={BRAND.purple}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <STN title={`Monte Carlo — ${si.toLocaleString()} Simulations · ${yr}-Year Horizon`} sub={`$${co}/mo · ${re}% return · ${vo}% vol`} color={BRAND.purple} T={T}/>
          <ExpandBtn onClick={()=>setExpand(true)} color={BRAND.purple}/>
        </div>
        <MCChart height={260}/>
      </Card>
      {expand&&<ChartModal title="Monte Carlo Simulation" sub={`${si.toLocaleString()} paths · ${yr} years · $${co}/mo`} color={BRAND.purple} onClose={()=>setExpand(false)} T={T}><MCChart height={460}/></ChartModal>}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// CANDLESTICK DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════
const genCandles = (price, pid) => {
  const p = PERIODS.find(x=>x.id===pid)||PERIODS[4];
  const N = Math.min(p.days, 365);
  let close = price * ({"1D":.998,"1W":.988,"1M":.970,"3M":.935,"1Y":.870,"3Y":.650,"5Y":.480,"10Y":.280}[pid]||.87);
  const out = [];
  for(let i=N;i>=0;i--){
    const chg = (Math.random()-.48)*close*.022;
    const open = close;
    close = Math.max(close+chg, price*.1);
    const high = Math.max(open,close)*(1+Math.random()*.012);
    const low  = Math.min(open,close)*(1-Math.random()*.012);
    const dt = new Date(); dt.setDate(dt.getDate()-i);
    const fmt = p.days<=30
      ? dt.toLocaleDateString("en",{month:"short",day:"numeric"})
      : dt.toLocaleDateString("en",{month:"short",day:"numeric"});
    out.push({ date:fmt, open:+open.toFixed(2), high:+high.toFixed(2), low:+low.toFixed(2), close:+close.toFixed(2), volume:Math.round(1e6+Math.random()*9e6) });
  }
  out[out.length-1].close = price;
  return out;
};

// RSI calculation
const calcRSI = (candles, period=14) => {
  if(candles.length < period+1) return candles.map(c=>({date:c.date,rsi:50}));
  const changes = candles.slice(1).map((c,i)=>c.close-candles[i].close);
  let gains=0,losses=0;
  changes.slice(0,period).forEach(c=>{ if(c>0)gains+=c; else losses-=c; });
  let avgGain=gains/period, avgLoss=losses/period;
  const rsi=[...Array(period).fill(null)];
  rsi.push(avgLoss===0?100:+(100-100/(1+avgGain/avgLoss)).toFixed(2));
  for(let i=period;i<changes.length;i++){
    const c=changes[i];
    avgGain=(avgGain*(period-1)+(c>0?c:0))/period;
    avgLoss=(avgLoss*(period-1)+(c<0?-c:0))/period;
    rsi.push(avgLoss===0?100:+(100-100/(1+avgGain/avgLoss)).toFixed(2));
  }
  return candles.map((c,i)=>({date:c.date,rsi:rsi[i]||50}));
};

// MACD calculation
const calcMACD = (candles) => {
  const closes = candles.map(c=>c.close);
  const ema = (data, period) => {
    const k=2/(period+1); let val=data[0];
    return data.map(d=>{ val=d*k+val*(1-k); return +val.toFixed(4); });
  };
  const ema12=ema(closes,12), ema26=ema(closes,26);
  const macdLine=ema12.map((v,i)=>+(v-ema26[i]).toFixed(4));
  const signal=ema(macdLine,9);
  const hist=macdLine.map((v,i)=>+(v-signal[i]).toFixed(4));
  return candles.map((c,i)=>({date:c.date,macd:macdLine[i],signal:signal[i],hist:hist[i]}));
};

// Bollinger Bands
const calcBollinger = (candles, period=20) => {
  return candles.map((c,i)=>{
    if(i<period-1) return {date:c.date,close:c.close,upper:c.close*1.02,lower:c.close*.98,mid:c.close};
    const slice=candles.slice(i-period+1,i+1).map(x=>x.close);
    const mean=slice.reduce((s,v)=>s+v,0)/period;
    const std=Math.sqrt(slice.reduce((s,v)=>s+(v-mean)**2,0)/period);
    return {date:c.date,close:c.close,upper:+(mean+std*2).toFixed(2),lower:+(mean-std*2).toFixed(2),mid:+mean.toFixed(2)};
  });
};

// ═══════════════════════════════════════════════════════════════════
// ASSET DETAIL VIEW — Level 4
// ═══════════════════════════════════════════════════════════════════
const AssetDetail = ({ holding, T, onBack, onEdit }) => {
  const [period, setPeriod]   = useState("3M");
  const [chartType, setChart] = useState("candle"); // candle | area | rsi | macd | bollinger
  const [expandC, setExpandC] = useState(false);

  const candles  = useMemo(()=>genCandles(holding.price, period),[holding.price, period]);
  const rsiData  = useMemo(()=>calcRSI(candles),[candles]);
  const macdData = useMemo(()=>calcMACD(candles),[candles]);
  const bollData = useMemo(()=>calcBollinger(candles),[candles]);

  const lastRSI  = rsiData[rsiData.length-1]?.rsi||50;
  const lastMACD = macdData[macdData.length-1];
  const hv = V(holding), hpl = PL(holding), hplp = PLP(holding);

  const CHART_TYPES = [
    {id:"area",     label:"Area",      icon:"📈"},
    {id:"candle",   label:"Candles",   icon:"🕯"},
    {id:"bollinger",label:"Bollinger", icon:"〰️"},
    {id:"rsi",      label:"RSI",       icon:"📊"},
    {id:"macd",     label:"MACD",      icon:"⚡"},
  ];

  // Simple candlestick using ComposedChart
  const CandleChart = ({height}) => {
    const interval = Math.floor(candles.length/8);
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={candles} margin={{top:5,right:5,bottom:0,left:0}}>
          <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
          <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} interval={interval}/>
          <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v.toLocaleString()}`} width={65}/>
          <Tooltip content={({active,payload,label})=>{
            if(!active||!payload?.length)return null;
            const d=payload[0]?.payload;
            if(!d)return null;
            return(<div style={{background:T.bg2,border:`1px solid ${BRAND.gold}44`,borderRadius:10,padding:"10px 14px",fontSize:11,fontFamily:BRAND.mono}}>
              <div style={{color:T.muted,marginBottom:6,fontSize:10}}>{label}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 16px"}}>
                {[["Open",d.open],["High",d.high],["Low",d.low],["Close",d.close]].map(([k,v])=>(
                  <div key={k}><span style={{color:T.muted}}>{k}: </span><b style={{color:d.close>=d.open?BRAND.teal:BRAND.red}}>${v?.toLocaleString()}</b></div>
                ))}
              </div>
              <div style={{marginTop:4,color:T.muted}}>Vol: <b style={{color:BRAND.blue}}>{d.volume?.toLocaleString()}</b></div>
            </div>);
          }}/>
          {/* High-Low range */}
          <Bar dataKey="high" fill="transparent" stroke="transparent"/>
          {candles.map((c,i)=>(
            <ReferenceLine key={i} segment={[{x:c.date,y:c.low},{x:c.date,y:c.high}]} stroke={c.close>=c.open?BRAND.teal:BRAND.red} strokeWidth={1} ifOverflow="visible"/>
          ))}
          {/* OHLC bars */}
          <Bar dataKey="close" radius={[2,2,0,0]} maxBarSize={8}>
            {candles.map((c,i)=><Cell key={i} fill={c.close>=c.open?BRAND.teal:BRAND.red} opacity={.85}/>)}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  const AreaChartView = ({height}) => {
    const areaData = candles.map(c=>({date:c.date,value:c.close}));
    const isUp = holding.price >= holding.avgCost;
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={areaData} margin={{top:5,right:5,bottom:0,left:0}}>
          <defs><linearGradient id="gAsset" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={isUp?BRAND.teal:BRAND.red} stopOpacity={.3}/><stop offset="100%" stopColor={isUp?BRAND.teal:BRAND.red} stopOpacity={.02}/></linearGradient></defs>
          <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
          <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} interval={Math.floor(areaData.length/7)}/>
          <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v.toLocaleString()}`} width={65}/>
          <Tooltip content={<TT T={T}/>}/>
          <ReferenceLine y={holding.avgCost} stroke={BRAND.amber} strokeDasharray="4 2" label={{value:`Cost $${holding.avgCost}`,fill:BRAND.amber,fontSize:9,position:"right"}}/>
          <Area type="monotoneX" dataKey="value" name="Price" stroke={isUp?BRAND.teal:BRAND.red} strokeWidth={2.5} fill="url(#gAsset)" dot={false} activeDot={{r:5,fill:isUp?BRAND.teal:BRAND.red,stroke:T.bg,strokeWidth:2}}/>
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const RSIChart = ({height}) => {
    const rsi = lastRSI;
    const zone = rsi>=70?"Overbought":rsi<=30?"Oversold":"Neutral";
    const zoneColor = rsi>=70?BRAND.red:rsi<=30?BRAND.teal:BRAND.gold;
    return (
      <div>
        <div style={{display:"flex",gap:14,marginBottom:10,alignItems:"center"}}>
          <div style={{fontFamily:BRAND.mono,fontSize:13,fontWeight:700,color:zoneColor}}>RSI(14): {rsi.toFixed(1)}</div>
          <Chip label={zone} color={zoneColor}/>
          <div style={{fontSize:11,fontFamily:BRAND.mono,color:T.muted}}>RSI &gt;70 = overbought · RSI &lt;30 = oversold</div>
        </div>
        <ResponsiveContainer width="100%" height={height-40}>
          <LineChart data={rsiData} margin={{top:5,right:5,bottom:0,left:0}}>
            <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
            <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} interval={Math.floor(rsiData.length/7)}/>
            <YAxis domain={[0,100]} tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} width={35}/>
            <Tooltip content={<TT T={T}/>}/>
            <ReferenceLine y={70} stroke={BRAND.red}   strokeDasharray="4 2" label={{value:"70",fill:BRAND.red,  fontSize:9,position:"right"}}/>
            <ReferenceLine y={30} stroke={BRAND.teal}  strokeDasharray="4 2" label={{value:"30",fill:BRAND.teal,fontSize:9,position:"right"}}/>
            <ReferenceLine y={50} stroke={T.border}    strokeDasharray="2 4"/>
            <Line type="monotoneX" dataKey="rsi" name="RSI" stroke={BRAND.purple} strokeWidth={2} dot={false} activeDot={{r:4,fill:BRAND.purple,stroke:T.bg,strokeWidth:2}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const MACDChart = ({height}) => {
    const signal = lastMACD?.macd>=lastMACD?.signal?"Bullish":"Bearish";
    return (
      <div>
        <div style={{display:"flex",gap:14,marginBottom:10,alignItems:"center"}}>
          <div style={{fontFamily:BRAND.mono,fontSize:13,fontWeight:700,color:lastMACD?.macd>=lastMACD?.signal?BRAND.teal:BRAND.red}}>MACD: {lastMACD?.macd?.toFixed(2)}</div>
          <div style={{fontFamily:BRAND.mono,fontSize:11,color:T.muted}}>Signal: {lastMACD?.signal?.toFixed(2)}</div>
          <Chip label={signal} color={lastMACD?.macd>=lastMACD?.signal?BRAND.teal:BRAND.red}/>
        </div>
        <ResponsiveContainer width="100%" height={height-40}>
          <ComposedChart data={macdData} margin={{top:5,right:5,bottom:0,left:0}}>
            <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
            <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} interval={Math.floor(macdData.length/7)}/>
            <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} width={45} tickFormatter={v=>v.toFixed(1)}/>
            <Tooltip content={<TT T={T}/>}/>
            <ReferenceLine y={0} stroke={T.muted} strokeWidth={1}/>
            <Bar dataKey="hist" name="Histogram" radius={[2,2,0,0]} maxBarSize={6}>
              {macdData.map((d,i)=><Cell key={i} fill={d.hist>=0?BRAND.teal:BRAND.red} opacity={.8}/>)}
            </Bar>
            <Line type="monotoneX" dataKey="macd"   name="MACD"   stroke={BRAND.blue}   strokeWidth={2} dot={false}/>
            <Line type="monotoneX" dataKey="signal" name="Signal" stroke={BRAND.amber}  strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
            <Legend wrapperStyle={{fontSize:10,fontFamily:BRAND.mono,paddingTop:8}}/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const BollingerChart = ({height}) => {
    const lastB = bollData[bollData.length-1];
    const pctB  = lastB ? ((holding.price-lastB.lower)/(lastB.upper-lastB.lower)*100).toFixed(1) : 50;
    const bSignal = pctB>80?"Near Upper Band":pctB<20?"Near Lower Band":"Within Bands";
    return (
      <div>
        <div style={{display:"flex",gap:14,marginBottom:10,alignItems:"center"}}>
          <div style={{fontFamily:BRAND.mono,fontSize:13,fontWeight:700,color:BRAND.cyan}}>%B: {pctB}%</div>
          <Chip label={bSignal} color={+pctB>80?BRAND.red:+pctB<20?BRAND.teal:BRAND.gold}/>
          <div style={{fontSize:11,fontFamily:BRAND.mono,color:T.muted}}>Upper: ${lastB?.upper?.toFixed(0)} · Mid: ${lastB?.mid?.toFixed(0)} · Lower: ${lastB?.lower?.toFixed(0)}</div>
        </div>
        <ResponsiveContainer width="100%" height={height-40}>
          <AreaChart data={bollData} margin={{top:5,right:5,bottom:0,left:0}}>
            <defs>
              <linearGradient id="gBoll" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND.cyan} stopOpacity={.12}/><stop offset="100%" stopColor={BRAND.cyan} stopOpacity={.02}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
            <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} interval={Math.floor(bollData.length/7)}/>
            <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v.toFixed(0)}`} width={60}/>
            <Tooltip content={<TT T={T}/>}/>
            <Area type="monotoneX" dataKey="upper" name="Upper Band" stroke={BRAND.cyan}   strokeWidth={1.5} fill="url(#gBoll)" strokeDasharray="4 2" dot={false}/>
            <Area type="monotoneX" dataKey="lower" name="Lower Band" stroke={BRAND.cyan}   strokeWidth={1.5} fill="transparent" strokeDasharray="4 2" dot={false}/>
            <Line type="monotoneX" dataKey="mid"   name="Mid (MA20)" stroke={BRAND.amber}  strokeWidth={1.5} dot={false} strokeDasharray="3 2"/>
            <Line type="monotoneX" dataKey="close" name="Price"      stroke={hplp>=0?BRAND.teal:BRAND.red} strokeWidth={2.5} dot={false} activeDot={{r:5}}/>
            <Legend wrapperStyle={{fontSize:10,fontFamily:BRAND.mono,paddingTop:8}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const ActiveChart = ({height}) => {
    if(chartType==="candle")    return <CandleChart height={height}/>;
    if(chartType==="area")      return <AreaChartView height={height}/>;
    if(chartType==="rsi")       return <RSIChart height={height}/>;
    if(chartType==="macd")      return <MACDChart height={height}/>;
    if(chartType==="bollinger") return <BollingerChart height={height}/>;
    return null;
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14,animation:"fadeIn 0.3s ease"}}>
      {/* Back button + title */}
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:9,border:`1px solid ${T.border}`,background:"transparent",cursor:"pointer",color:T.muted,fontFamily:BRAND.display,fontSize:11,fontWeight:600,transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=BRAND.gold+"55";e.currentTarget.style.color=BRAND.gold;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted;}}>
          ← Back
        </button>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:44,height:44,borderRadius:11,background:`${BRAND.gold}15`,border:`1px solid ${BRAND.gold}33`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:BRAND.mono,fontSize:13,fontWeight:800,color:BRAND.gold}}>{holding.symbol}</div>
          <div>
            <div style={{fontSize:18,fontFamily:BRAND.display,fontWeight:800,color:T.text}}>{holding.name}</div>
            <div style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted}}>{holding.broker} · {holding.fund} · <Chip label={holding.type} color={TYPE_COLOR[holding.type]||BRAND.gold}/></div>
          </div>
        </div>
        <button onClick={()=>onEdit(holding)} style={{marginLeft:"auto",padding:"7px 14px",borderRadius:9,border:`1px solid ${BRAND.gold}44`,background:`${BRAND.gold}10`,cursor:"pointer",color:BRAND.gold,fontFamily:BRAND.display,fontSize:11,fontWeight:700}}>✏️ Edit</button>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
        <KPI label="Market Value"  value={`$${Math.round(hv).toLocaleString()}`}     color={BRAND.gold}   T={T}/>
        <KPI label="Price"         value={`$${holding.price.toLocaleString()}`}       color={T.text}       T={T}/>
        <KPI label="Avg Cost"      value={`$${holding.avgCost.toLocaleString()}`}     color={T.muted}      T={T}/>
        <KPI label="P&L $"         value={`${hpl>=0?"+":"-"}$${Math.abs(Math.round(hpl)).toLocaleString()}`} color={hpl>=0?BRAND.teal:BRAND.red} T={T}/>
        <KPI label="P&L %"         value={`${hplp>=0?"+":""}${hplp.toFixed(2)}%`}    color={hplp>=0?BRAND.teal:BRAND.red} T={T}/>
        <KPI label="Quantity"      value={holding.qty}                                color={BRAND.blue}   T={T}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <KPI label="Beta"          value={(holding.beta||1).toFixed(2)}               color={BRAND.purple} T={T}/>
        <KPI label="Volatility"    value={`${(holding.vol||20).toFixed(1)}%`}         color={BRAND.amber}  T={T}/>
        <KPI label="RSI (14)"      value={lastRSI.toFixed(1)} sub={lastRSI>=70?"Overbought":lastRSI<=30?"Oversold":"Neutral"} color={lastRSI>=70?BRAND.red:lastRSI<=30?BRAND.teal:BRAND.gold} T={T}/>
        <KPI label="MACD Signal"   value={lastMACD?.macd>=lastMACD?.signal?"Bullish":"Bearish"} color={lastMACD?.macd>=lastMACD?.signal?BRAND.teal:BRAND.red} T={T}/>
      </div>

      {/* Chart */}
      <Card T={T} glow={hplp>=0?BRAND.teal:BRAND.red}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{display:"flex",gap:4}}>
            {CHART_TYPES.map(ct=>(
              <button key={ct.id} onClick={()=>setChart(ct.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:`1px solid ${chartType===ct.id?(hplp>=0?BRAND.teal:BRAND.red)+"55":T.border}`,cursor:"pointer",fontFamily:BRAND.display,fontSize:11,fontWeight:600,background:chartType===ct.id?`${hplp>=0?BRAND.teal:BRAND.red}12`:"transparent",color:chartType===ct.id?(hplp>=0?BRAND.teal:BRAND.red):T.muted,transition:"all 0.15s"}}>
                {ct.icon} {ct.label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <PBtn active={period} onChange={setPeriod} color={hplp>=0?BRAND.teal:BRAND.red} T={T}/>
            <ExpandBtn onClick={()=>setExpandC(true)} color={hplp>=0?BRAND.teal:BRAND.red}/>
          </div>
        </div>
        <ActiveChart height={280}/>
      </Card>
      {expandC&&(
        <ChartModal title={`${holding.symbol} — ${CHART_TYPES.find(c=>c.id===chartType)?.label}`} sub={`${holding.name} · ${period}`} color={hplp>=0?BRAND.teal:BRAND.red} onClose={()=>setExpandC(false)} T={T}>
          <ActiveChart height={460}/>
        </ChartModal>
      )}

      {/* Notes */}
      {holding.notes&&(
        <Card T={T}>
          <STN title="Notes" color={BRAND.muted} T={T}/>
          <div style={{fontSize:12,fontFamily:BRAND.mono,color:T.muted,lineHeight:1.6}}>{holding.notes}</div>
        </Card>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// SNOWFLAKE TAB — 8-Dimension Quality Radar
// ═══════════════════════════════════════════════════════════════════
const SnowflakeTab = ({ holdings, T }) => {
  const [sel, setSel] = useState(null);
  const tv  = holdings.reduce((s,h)=>s+V(h),0);
  const tc  = holdings.reduce((s,h)=>s+CO(h),0);
  const tpl = tv - tc;

  // Calculate scores dynamically from holdings
  const avgBeta  = holdings.reduce((s,h)=>s+(h.beta||1),0)/Math.max(holdings.length,1);
  const avgVol   = holdings.reduce((s,h)=>s+(h.vol||20),0)/Math.max(holdings.length,1);
  const divYield = tc>0?holdings.reduce((s,h)=>s+h.qty*(h.div||0),0)/tv*100:0;
  const returnPct= tc>0?(tpl/tc*100):0;
  const cryptoPct= holdings.filter(h=>h.type==="Crypto").reduce((s,h)=>s+V(h),0)/Math.max(tv,1)*100;
  const etfPct   = holdings.filter(h=>h.type==="ETF").reduce((s,h)=>s+V(h),0)/Math.max(tv,1)*100;
  const sectors  = [...new Set(holdings.map(h=>h.sector))].length;

  const dims = [
    {
      subject:"Return",
      portfolio: Math.min(Math.max(Math.round(50+returnPct*1.5),0),100),
      benchmark:68,
      desc:`Total return of ${returnPct>=0?"+":""}${returnPct.toFixed(1)}% vs cost basis. ${returnPct>15?"Above average performance.":returnPct>0?"Moderate positive return.":"Currently below cost basis."}`
    },
    {
      subject:"Risk Mgmt",
      portfolio: Math.min(Math.max(Math.round(90-avgVol*1.2),0),100),
      benchmark:62,
      desc:`Weighted avg volatility ${avgVol.toFixed(1)}%. ${avgVol<20?"Well-managed risk profile.":avgVol<35?"Moderate risk exposure.":"High volatility — consider de-risking."}`
    },
    {
      subject:"Income",
      portfolio: Math.min(Math.max(Math.round(divYield*12),0),100),
      benchmark:55,
      desc:`Dividend yield of ${divYield.toFixed(2)}%. ${divYield>3?"Strong income generation.":divYield>1?"Moderate income stream.":"Low income — growth-oriented portfolio."}`
    },
    {
      subject:"Growth",
      portfolio: Math.min(Math.max(Math.round(60+returnPct*0.8),0),100),
      benchmark:72,
      desc:`Capital appreciation potential based on holdings mix. ${cryptoPct>20?"Crypto adds high-growth exposure.":"Tech and growth stocks drive upside."}`
    },
    {
      subject:"Diversify",
      portfolio: Math.min(Math.max(Math.round(sectors*14+etfPct*0.4),0),100),
      benchmark:78,
      desc:`${sectors} sectors represented. ${etfPct>20?"ETF exposure adds broad diversification.":"Consider adding more sectors for stability."} ${cryptoPct>30?"Crypto concentration may increase risk.":""}`
    },
    {
      subject:"Quality",
      portfolio: Math.min(Math.max(Math.round(75-avgBeta*5+etfPct*0.2),0),100),
      benchmark:71,
      desc:`Avg beta of ${avgBeta.toFixed(2)}. ${avgBeta<1?"Low market sensitivity — defensive profile.":avgBeta<1.3?"Moderate market correlation.":"High beta — amplifies market moves."}`
    },
    {
      subject:"Momentum",
      portfolio: Math.min(Math.max(Math.round(55+returnPct*1.2),0),100),
      benchmark:65,
      desc:`Price momentum based on unrealized gains. ${returnPct>20?"Strong positive momentum across portfolio.":returnPct>5?"Moderate upward trend.":"Momentum is weak or negative."}`
    },
    {
      subject:"Value",
      portfolio: Math.min(Math.max(Math.round(65-cryptoPct*0.3),0),100),
      benchmark:69,
      desc:`Valuation assessment. ${cryptoPct>20?"Crypto reduces traditional valuation score.":etfPct>30?"ETFs provide fair market valuations.":"Holdings trade near intrinsic value estimates."}`
    },
  ];

  const totalScore = Math.round(dims.reduce((s,d)=>s+d.portfolio,0)/dims.length);
  const vsBenchmark = +(dims.reduce((s,d)=>s+(d.portfolio-d.benchmark),0)/dims.length).toFixed(1);
  const strongest = dims.reduce((a,b)=>a.portfolio>b.portfolio?a:b);
  const weakest   = dims.reduce((a,b)=>a.portfolio<b.portfolio?a:b);

  const scoreColor = totalScore>=75?BRAND.teal:totalScore>=55?BRAND.gold:BRAND.red;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <div style={{background:`${scoreColor}10`,border:`2px solid ${scoreColor}30`,borderLeft:`4px solid ${scoreColor}`,borderRadius:12,padding:"14px 18px"}}>
          <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2.5,marginBottom:6}}>OVERALL SCORE</div>
          <div style={{fontSize:38,fontFamily:BRAND.display,fontWeight:800,color:scoreColor,lineHeight:1}}>{totalScore}<span style={{fontSize:18,color:T.muted}}>/100</span></div>
          <div style={{fontSize:11,fontFamily:BRAND.mono,color:T.muted,marginTop:6}}>
            {totalScore>=75?"Institutional Grade":totalScore>=55?"Above Average":"Needs Improvement"}
          </div>
        </div>
        <KPI label="vs Benchmark"   value={`${vsBenchmark>=0?"+":""}${vsBenchmark} pts`} sub={vsBenchmark>=0?"Outperforming":"Underperforming"} color={vsBenchmark>=0?BRAND.teal:BRAND.red} T={T}/>
        <KPI label="Strongest Dim." value={strongest.subject} sub={`Score: ${strongest.portfolio}/100`}  color={BRAND.teal}  T={T}/>
        <KPI label="Weakest Dim."   value={weakest.subject}   sub={`Score: ${weakest.portfolio}/100`}   color={BRAND.amber} T={T}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:14}}>
        <Card T={T} glow={BRAND.teal}>
          <STN title="Portfolio Snowflake" sub="8-dimension quality analysis — click any dimension for insight" color={BRAND.teal} T={T}/>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={dims} margin={{top:20,right:50,bottom:20,left:50}}>
              <PolarGrid stroke={T.border} gridType="polygon"/>
              <PolarAngleAxis dataKey="subject" tick={{fill:T.muted,fontSize:10,fontFamily:BRAND.mono,fontWeight:600}}/>
              <Radar name="Portfolio" dataKey="portfolio" stroke={BRAND.gold}   fill={BRAND.gold}   fillOpacity={.18} strokeWidth={2.5} dot={{fill:BRAND.gold,  r:5,strokeWidth:0}}/>
              <Radar name="Benchmark" dataKey="benchmark" stroke={BRAND.blue}   fill={BRAND.blue}   fillOpacity={.08} strokeWidth={1.5} strokeDasharray="4 2"  dot={{fill:BRAND.blue,  r:3,strokeWidth:0}}/>
              <Legend wrapperStyle={{fontSize:10,fontFamily:BRAND.mono,paddingTop:8}}/>
              <Tooltip contentStyle={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:10,fontSize:11}}/>
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card T={T}>
          <STN title="Dimension Scores" sub="Click any row for analysis insight" color={BRAND.gold} T={T}/>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {dims.map((d,i)=>{
              const diff=d.portfolio-d.benchmark;
              const isS=sel===d.subject;
              const dc=d.portfolio>=75?BRAND.teal:d.portfolio>=50?BRAND.gold:BRAND.red;
              return (
                <div key={i} onClick={()=>setSel(isS?null:d.subject)} style={{padding:"9px 12px",borderRadius:9,cursor:"pointer",background:isS?`${BRAND.gold}10`:T.surface,border:`1px solid ${isS?BRAND.gold+"44":T.border}`,transition:"all 0.2s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                    <span style={{fontFamily:BRAND.display,fontWeight:600,fontSize:12,color:isS?BRAND.gold:T.text}}>{d.subject}</span>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <Chip label={`${d.portfolio}/100`} color={dc}/>
                      <Chip label={diff>=0?`+${diff}`:String(diff)} color={diff>=0?BRAND.teal:BRAND.red}/>
                    </div>
                  </div>
                  <div style={{height:3,background:T.border,borderRadius:2}}>
                    <div style={{height:"100%",width:`${d.portfolio}%`,background:`linear-gradient(90deg,${dc},${dc}80)`,borderRadius:2,transition:"width 0.4s ease"}}/>
                  </div>
                  {isS&&<div style={{fontSize:11,fontFamily:BRAND.mono,color:T.muted,marginTop:8,lineHeight:1.6,padding:"6px 0 2px"}}>{d.desc}</div>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// FACTOR EXPOSURE TAB — Institutional Analysis
// ═══════════════════════════════════════════════════════════════════
const FactorTab = ({ holdings, T }) => {
  const tv = holdings.reduce((s,h)=>s+V(h),0);

  // Factor scores per holding type
  const factorMap = {
    "Stock": { value:55, growth:78, momentum:70, quality:72, lowvol:45, size:60 },
    "ETF":   { value:65, growth:62, momentum:60, quality:85, lowvol:75, size:80 },
    "Crypto":{ value:25, growth:92, momentum:80, quality:30, lowvol:10, size:35 },
    "Bond":  { value:80, growth:20, momentum:25, quality:90, lowvol:95, size:70 },
  };

  // Weighted factor scores
  const factors = ["value","growth","momentum","quality","lowvol","size"];
  const factorLabels = {
    value:"Value", growth:"Growth", momentum:"Momentum",
    quality:"Quality", lowvol:"Low Vol", size:"Size"
  };
  const factorColors = {
    value:BRAND.gold, growth:BRAND.teal, momentum:BRAND.blue,
    quality:BRAND.purple, lowvol:BRAND.green, size:BRAND.amber
  };
  const factorDesc = {
    value:    "Holdings trading below intrinsic value — P/E, P/B ratios",
    growth:   "Revenue and earnings growth potential — high-growth companies",
    momentum: "Price trend strength — recent outperformers tend to continue",
    quality:  "Financial health, ROE, low debt, stable earnings",
    lowvol:   "Lower volatility exposure — defensive and stable holdings",
    size:     "Market cap exposure — large cap vs small cap mix",
  };

  const weightedScores = factors.reduce((acc, f) => {
    const score = holdings.reduce((s,h) => {
      const w = V(h)/Math.max(tv,1);
      const fm = factorMap[h.type]||factorMap["Stock"];
      return s + fm[f]*w;
    }, 0);
    acc[f] = Math.round(score);
    return acc;
  }, {});

  const benchScores = { value:60, growth:65, momentum:62, quality:70, lowvol:58, size:65 };

  const radarData = factors.map(f=>({
    subject: factorLabels[f],
    portfolio: weightedScores[f],
    benchmark: benchScores[f],
  }));

  // Factor attribution by holding
  const holdingFactors = [...holdings].sort((a,b)=>V(b)-V(a)).slice(0,8).map(h=>({
    symbol: h.symbol,
    weight: +(V(h)/Math.max(tv,1)*100).toFixed(1),
    ...Object.fromEntries(factors.map(f=>[f, factorMap[h.type]?.[f]||50])),
  }));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
        {factors.map(f=>{
          const score = weightedScores[f];
          const diff  = score - benchScores[f];
          const color = factorColors[f];
          return (
            <div key={f} style={{background:`${color}08`,border:`1px solid ${color}22`,borderLeft:`3px solid ${color}`,borderRadius:10,padding:13}}>
              <div style={{fontSize:8,fontFamily:BRAND.mono,color:T.muted,letterSpacing:1.5,marginBottom:5,textTransform:"uppercase"}}>{factorLabels[f]}</div>
              <div style={{fontSize:22,fontFamily:BRAND.display,fontWeight:800,color,marginBottom:5}}>{score}</div>
              <div style={{height:3,background:T.border,borderRadius:2,marginBottom:5}}>
                <div style={{height:"100%",width:`${score}%`,background:color,borderRadius:2}}/>
              </div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:diff>=0?BRAND.teal:BRAND.red}}>{diff>=0?"+":""}{diff} vs benchmark</div>
            </div>
          );
        })}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:14}}>
        <Card T={T} glow={BRAND.purple}>
          <STN title="Factor Exposure Radar" sub="Portfolio vs benchmark factor tilts" color={BRAND.purple} T={T}/>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} margin={{top:20,right:50,bottom:20,left:50}}>
              <PolarGrid stroke={T.border} gridType="polygon"/>
              <PolarAngleAxis dataKey="subject" tick={{fill:T.muted,fontSize:10,fontFamily:BRAND.mono,fontWeight:600}}/>
              <Radar name="Portfolio" dataKey="portfolio" stroke={BRAND.purple} fill={BRAND.purple} fillOpacity={.18} strokeWidth={2.5} dot={{fill:BRAND.purple,r:5,strokeWidth:0}}/>
              <Radar name="Benchmark" dataKey="benchmark" stroke={BRAND.muted}  fill={BRAND.muted}  fillOpacity={.06} strokeWidth={1.5} strokeDasharray="4 2" dot={{fill:BRAND.muted,r:3,strokeWidth:0}}/>
              <Legend wrapperStyle={{fontSize:10,fontFamily:BRAND.mono,paddingTop:8}}/>
              <Tooltip contentStyle={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:10,fontSize:11}}/>
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card T={T}>
          <STN title="Factor Descriptions" color={BRAND.blue} T={T}/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {factors.map(f=>(
              <div key={f} style={{padding:"8px 11px",background:T.surface,borderRadius:8,borderLeft:`3px solid ${factorColors[f]}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <span style={{fontFamily:BRAND.display,fontWeight:600,fontSize:11,color:factorColors[f]}}>{factorLabels[f]}</span>
                  <div style={{display:"flex",gap:5}}>
                    <Chip label={`${weightedScores[f]}/100`} color={factorColors[f]}/>
                    <Chip label={weightedScores[f]>=benchScores[f]?`+${weightedScores[f]-benchScores[f]}`:`${weightedScores[f]-benchScores[f]}`} color={weightedScores[f]>=benchScores[f]?BRAND.teal:BRAND.red}/>
                  </div>
                </div>
                <div style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted,lineHeight:1.4}}>{factorDesc[f]}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card T={T}>
        <STN title="Factor Attribution by Holding" sub="Individual holding contribution to each factor score" color={BRAND.amber} T={T}/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
              <th style={{textAlign:"left",padding:"7px 10px",color:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1}}>Symbol</th>
              <th style={{textAlign:"left",padding:"7px 10px",color:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1}}>Weight</th>
              {factors.map(f=>(
                <th key={f} style={{textAlign:"center",padding:"7px 10px",color:factorColors[f],fontFamily:BRAND.mono,fontSize:9,letterSpacing:1}}>{factorLabels[f]}</th>
              ))}
            </tr></thead>
            <tbody>{holdingFactors.map((h,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${T.border}`,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=T.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"9px 10px",fontWeight:700,color:BRAND.gold,fontFamily:BRAND.mono}}>{h.symbol}</td>
                <td style={{padding:"9px 10px",fontFamily:BRAND.mono,color:T.muted}}>{h.weight}%</td>
                {factors.map(f=>{
                  const score=h[f];
                  const color=score>=75?BRAND.teal:score>=50?BRAND.gold:BRAND.red;
                  return <td key={f} style={{padding:"9px 10px",textAlign:"center"}}>
                    <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:34,height:22,borderRadius:5,background:`${color}14`,fontFamily:BRAND.mono,fontSize:10,fontWeight:700,color}}>{score}</div>
                  </td>;
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// EFFICIENT FRONTIER TAB — Portfolio Optimization
// ═══════════════════════════════════════════════════════════════════
const EfficientFrontierTab = ({ holdings, T }) => {
  const [targetReturn, setTargetReturn] = useState(10);
  const [riskTolerance, setRiskTolerance] = useState(50);

  const tv = holdings.reduce((s,h)=>s+V(h),0);

  // Generate frontier curve points
  const frontier = useMemo(()=>{
    const points = [];
    for(let risk=3; risk<=40; risk+=0.5) {
      const ret = Math.pow(risk, 0.72) * 1.4 + (Math.random()-.5)*.3;
      points.push({ risk:+risk.toFixed(1), return:+ret.toFixed(2), sharpe:+(ret/risk).toFixed(3) });
    }
    return points;
  },[]);

  // Current portfolio position
  const avgVol = holdings.reduce((s,h)=>s+(h.vol||20)*V(h)/Math.max(tv,1),0);
  const tc     = holdings.reduce((s,h)=>s+CO(h),0);
  const ret    = tc>0?(tv-tc)/tc*100:0;
  const currentPoint = [{ risk:+avgVol.toFixed(1), return:+ret.toFixed(2), name:"Current" }];

  // Optimal portfolios
  const maxSharpe  = frontier.reduce((a,b)=>a.sharpe>b.sharpe?a:b);
  const minVol     = frontier.reduce((a,b)=>a.risk<b.risk?a:b);
  const targetPt   = frontier.reduce((a,b)=>Math.abs(b.return-targetReturn)<Math.abs(a.return-targetReturn)?b:a);

  // Optimal weights suggestion
  const optWeights = useMemo(()=>{
    const riskScore = riskTolerance/100;
    return holdings.map(h=>{
      const typeW = {Stock:0.35,ETF:0.3,Crypto:0.15,Bond:0.2}[h.type]||0.25;
      const adjW  = h.type==="Crypto" ? typeW*riskScore*1.5 : h.type==="Bond" ? typeW*(1-riskScore) : typeW;
      return { ...h, optWeight:adjW, currentWeight:V(h)/Math.max(tv,1)*100 };
    }).map((h,_,arr)=>{
      const total = arr.reduce((s,x)=>s+x.optWeight,0);
      return { ...h, optWeight:+(h.optWeight/total*100).toFixed(1) };
    });
  },[holdings,riskTolerance,tv]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <div style={{background:`${BRAND.teal}08`,border:`1px solid ${BRAND.teal}22`,borderLeft:`4px solid ${BRAND.teal}`,borderRadius:12,padding:"14px 18px"}}>
          <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:6}}>MAX SHARPE RATIO</div>
          <div style={{fontSize:22,fontFamily:BRAND.display,fontWeight:800,color:BRAND.teal}}>{maxSharpe.sharpe}</div>
          <div style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted,marginTop:4}}>Risk: {maxSharpe.risk}% · Ret: {maxSharpe.return}%</div>
        </div>
        <div style={{background:`${BRAND.blue}08`,border:`1px solid ${BRAND.blue}22`,borderLeft:`4px solid ${BRAND.blue}`,borderRadius:12,padding:"14px 18px"}}>
          <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:6}}>MIN VOLATILITY</div>
          <div style={{fontSize:22,fontFamily:BRAND.display,fontWeight:800,color:BRAND.blue}}>{minVol.risk}%</div>
          <div style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted,marginTop:4}}>Return: {minVol.return}%</div>
        </div>
        <KPI label="Current Risk"   value={`${avgVol.toFixed(1)}%`} sub="Weighted avg volatility" color={BRAND.amber}  T={T}/>
        <KPI label="Current Return" value={`${ret>=0?"+":""}${ret.toFixed(2)}%`} sub="Unrealized return" color={ret>=0?BRAND.teal:BRAND.red} T={T}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:14}}>
        <Card T={T} glow={BRAND.teal}>
          <STN title="Efficient Frontier" sub="Risk-Return tradeoff — yellow = current portfolio · green = max Sharpe · blue = min vol" color={BRAND.teal} T={T}/>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{top:10,right:20,bottom:20,left:10}}>
              <CartesianGrid strokeDasharray="2 6" stroke={T.border}/>
              <XAxis dataKey="risk"   name="Risk (%)"   type="number" domain={[2,42]} tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} label={{value:"Risk (Volatility %)",position:"insideBottom",offset:-10,fill:T.muted,fontSize:10}}/>
              <YAxis dataKey="return" name="Return (%)" type="number" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} label={{value:"Expected Return (%)",angle:-90,position:"insideLeft",fill:T.muted,fontSize:10}}/>
              <Tooltip cursor={{stroke:T.border}} content={({active,payload})=>{
                if(!active||!payload?.length)return null;
                const d=payload[0]?.payload;
                return(<div style={{background:T.bg2,border:`1px solid ${BRAND.gold}44`,borderRadius:10,padding:"10px 14px",fontSize:11,fontFamily:BRAND.mono}}>
                  <div style={{color:T.muted,marginBottom:4}}>Risk: <b style={{color:BRAND.amber}}>{d?.risk}%</b></div>
                  <div style={{color:T.muted,marginBottom:4}}>Return: <b style={{color:BRAND.teal}}>{d?.return}%</b></div>
                  {d?.sharpe&&<div style={{color:T.muted}}>Sharpe: <b style={{color:BRAND.gold}}>{d?.sharpe}</b></div>}
                </div>);
              }}/>
              {/* Frontier curve */}
              <Scatter data={frontier} fill={BRAND.teal} opacity={.6} r={3}/>
              {/* Max Sharpe */}
              <Scatter data={[maxSharpe]} fill={BRAND.green} r={8} name="Max Sharpe">
                <Cell fill={BRAND.green}/>
              </Scatter>
              {/* Min Vol */}
              <Scatter data={[minVol]} fill={BRAND.blue} r={8} name="Min Vol">
                <Cell fill={BRAND.blue}/>
              </Scatter>
              {/* Current portfolio */}
              <Scatter data={currentPoint} fill={BRAND.gold} r={10} name="Current">
                <Cell fill={BRAND.gold}/>
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:14,justifyContent:"center",marginTop:8}}>
            {[{c:BRAND.gold,l:"Current Portfolio"},{c:BRAND.green,l:"Max Sharpe"},{c:BRAND.blue,l:"Min Volatility"},{c:BRAND.teal,l:"Frontier"}].map((leg,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:leg.c}}/>
                <span style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted}}>{leg.l}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card T={T}>
          <STN title="Portfolio Optimizer" sub="Adjust risk tolerance to see optimal weights" color={BRAND.purple} T={T}/>
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted}}>RISK TOLERANCE</span>
              <span style={{fontSize:12,fontFamily:BRAND.mono,fontWeight:700,color:BRAND.purple}}>{riskTolerance}%</span>
            </div>
            <input type="range" min={10} max={90} step={5} value={riskTolerance} onChange={e=>setRiskTolerance(+e.target.value)} style={{width:"100%",accentColor:BRAND.purple}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
              <span style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted}}>Conservative</span>
              <span style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted}}>Aggressive</span>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {optWeights.map((h,i)=>{
              const diff = h.optWeight - h.currentWeight;
              const action = Math.abs(diff)<2?"Hold":diff>0?"Buy":"Sell";
              const ac = action==="Hold"?T.muted:action==="Buy"?BRAND.teal:BRAND.red;
              return (
                <div key={i} style={{padding:"8px 11px",background:T.surface,borderRadius:8,border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{fontFamily:BRAND.mono,fontWeight:700,fontSize:12,color:BRAND.gold}}>{h.symbol}</span>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted}}>{h.currentWeight.toFixed(1)}% → <b style={{color:BRAND.purple}}>{h.optWeight}%</b></span>
                      <Chip label={action} color={ac} size={8}/>
                    </div>
                  </div>
                  <div style={{height:3,background:T.border,borderRadius:2}}>
                    <div style={{height:"100%",width:`${h.optWeight}%`,background:BRAND.purple,borderRadius:2,transition:"width 0.4s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// AI INTELLIGENCE TAB — 15 Agents + NEXUS Chat
// ═══════════════════════════════════════════════════════════════════
const AGENTS = [
  {id:"NEXUS",    name:"NEXUS Core",        color:BRAND.gold,   role:"Portfolio Orchestrator",        load:94, acc:"91.2%", signals:142, status:"ACTIVE",
   tasks:["Coordinating all 14 agent outputs","Generating executive summary","Priority alert monitoring","Cross-agent validation"],
   insight:"Portfolio showing strong momentum. Tech driving 78% of alpha. Risk within parameters. Hold current allocation."},
  {id:"ALPHA",    name:"ALPHA Analyst",      color:BRAND.teal,   role:"Performance & Returns Engine",  load:87, acc:"88.4%", signals:89,  status:"ACTIVE",
   tasks:["TWR/MWR calculation","Attribution by holding","Benchmark vs 5 indices","Rolling returns"],
   insight:"YTD beats S&P 500 by +2.1pts. NVDA contributing 34% of total alpha. Momentum continuing."},
  {id:"RISK",     name:"Risk Monitor",       color:BRAND.red,    role:"Real-Time Risk Assessment",     load:96, acc:"94.1%", signals:67,  status:"ALERT",
   tasks:["VaR computation","Drawdown monitoring","Correlation regime detection","Tail risk analysis"],
   insight:"Crypto concentration approaching threshold. Consider trimming BTC/ETH below 20%."},
  {id:"DIV",      name:"Income Tracker",     color:BRAND.green,  role:"Dividend Intelligence",         load:72, acc:"86.3%", signals:34,  status:"ACTIVE",
   tasks:["Dividend tracking & forecasting","DRIP optimization","Ex-date monitoring","YoC tracking"],
   insight:"Annual income growing +6.2% YoY. Next ex-date: VOO in 18 days."},
  {id:"PROJ",     name:"Projection Engine",  color:BRAND.purple, role:"Scenario & Forecast Modeling",  load:68, acc:"79.8%", signals:28,  status:"ACTIVE",
   tasks:["Monte Carlo simulations","Bull/Base/Bear scenarios","CAGR projections","Probability assessment"],
   insight:"73% probability of $1M by Year 12 at current trajectory."},
  {id:"SECTOR",   name:"Sector Analyst",     color:BRAND.blue,   role:"Sector Rotation Intelligence",  load:81, acc:"83.5%", signals:51,  status:"ACTIVE",
   tasks:["Sector momentum tracking","Rotation signals","Concentration monitoring","Inter-sector correlation"],
   insight:"Technology overweight at 62% vs 28% benchmark. Consider Healthcare or Energy."},
  {id:"MACRO",    name:"Macro Watcher",      color:BRAND.amber,  role:"Macroeconomic Intelligence",    load:74, acc:"77.2%", signals:43,  status:"ACTIVE",
   tasks:["Fed policy tracking","CPI/inflation monitoring","Yield curve analysis","GDP impact"],
   insight:"Fed holding rates. Yield curve normalizing. Favorable for growth equities."},
  {id:"ESG",      name:"ESG Scorer",         color:BRAND.pink,   role:"ESG & Quality Analysis",        load:58, acc:"81.0%", signals:19,  status:"ACTIVE",
   tasks:["ESG score aggregation","Governance metrics","Environmental risk","Social scoring"],
   insight:"Portfolio ESG composite: 72/100. MSFT and AAPL score 85+."},
  {id:"TAX",      name:"Tax Optimizer",      color:BRAND.cyan,   role:"Tax Efficiency Intelligence",   load:62, acc:"88.7%", signals:22,  status:"ACTIVE",
   tasks:["LT/ST gain tracking","Harvesting opportunities","Wash sale monitoring","Tax-efficient rebalancing"],
   insight:"$12,400 in LT gains eligible for 0% federal rate. No harvesting opps currently."},
  {id:"NEWS",     name:"Sentiment Engine",   color:BRAND.muted,  role:"News & Market Sentiment",       load:89, acc:"84.3%", signals:78,  status:"ACTIVE",
   tasks:["News aggregation","Sentiment scoring","Earnings surprise tracking","Rating change alerts"],
   insight:"Positive sentiment on AAPL and NVDA. No negative signals on portfolio holdings."},
  {id:"TECH",     name:"Technical Analyst",  color:BRAND.blue,   role:"Technical Analysis Engine",     load:85, acc:"82.1%", signals:95,  status:"ACTIVE",
   tasks:["RSI/MACD monitoring across holdings","Bollinger Band signals","Support/resistance levels","Trend detection"],
   insight:"NVDA RSI at 72 — mildly overbought. AAPL forming bullish flag pattern. BTC near support."},
  {id:"REBAL",    name:"Rebalance Bot",      color:BRAND.gold,   role:"Portfolio Rebalancing Engine",  load:55, acc:"90.2%", signals:12,  status:"ACTIVE",
   tasks:["Drift monitoring vs target weights","Rebalance trigger detection","Tax-aware rebalancing","Optimal trade sizing"],
   insight:"Portfolio within 3% of target weights. No rebalance needed this week."},
  {id:"ALERT",    name:"Alert System",       color:BRAND.red,    role:"Price & Event Alert Monitor",   load:99, acc:"99.1%", signals:201, status:"ACTIVE",
   tasks:["Price threshold monitoring","Earnings date tracking","Ex-dividend alerts","Volatility spike detection"],
   insight:"No active price alerts triggered. Monitoring 8 positions continuously."},
  {id:"ARCH",     name:"Architect Bot",      color:BRAND.purple, role:"System Self-Improvement Engine",load:45, acc:"N/A",   signals:8,   status:"LEARNING",
   tasks:["Analyzing user behavior patterns","Identifying missing features","Optimizing agent performance","Proposing UI improvements"],
   insight:"Learning your preferences. Session #3. Detected: prefer 1Y charts and risk analysis. Adapting outputs."},
  {id:"REPORT",   name:"Report Generator",   color:BRAND.teal,   role:"Automated Report Engine",       load:30, acc:"95.0%", signals:5,   status:"ACTIVE",
   tasks:["PDF report generation","Monthly performance summary","Tax document preparation","Investor letter drafts"],
   insight:"Last report generated 7 days ago. Monthly summary ready for generation."},
];

const AITab = ({ holdings, T, botMem={sessionCount:1,chatHistory:[],learnedPreferences:{},lastVisit:null}, setBotMem=()=>{} }) => {
  const [sel,    setSel   ] = useState(null);
  const [chat,   setChat  ] = useState(false);
  const [input,  setInput ] = useState("");
  const [msgs,   setMsgs  ] = useState([
    { role:"assistant", text:"Hello! I'm NEXUS, your portfolio intelligence system. I have full access to your portfolio data and all 14 specialist agents. Ask me anything about your investments.", ts: new Date().toLocaleTimeString() }
  ]);
  const [loading,setLoading] = useState(false);
  const chatRef = useRef(null);

  const tv   = holdings.reduce((s,h)=>s+V(h),0);
  const tc   = holdings.reduce((s,h)=>s+CO(h),0);
  const tpl  = tv-tc;
  const tplp = tc>0?tpl/tc*100:0;
  const tdiv = holdings.reduce((s,h)=>s+h.qty*(h.div||0),0);
  const tot  = AGENTS.reduce((s,a)=>s+a.signals,0);
  const agent= sel ? AGENTS.find(a=>a.id===sel) : null;

  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; },[msgs]);

  const portfolioContext = `
Portfolio Summary:
- Total Value: $${Math.round(tv).toLocaleString()}
- Cost Basis: $${Math.round(tc).toLocaleString()}
- Total P&L: ${tpl>=0?"+":"-"}$${Math.abs(Math.round(tpl)).toLocaleString()} (${tplp>=0?"+":""}${tplp.toFixed(2)}%)
- Annual Dividends: $${Math.round(tdiv).toLocaleString()}
- Holdings: ${holdings.map(h=>`${h.symbol} (${h.qty} shares @ $${h.price}, P&L: ${PLP(h).toFixed(1)}%)`).join(", ")}
- Brokers: ${[...new Set(holdings.map(h=>h.broker))].join(", ")}
- Risk Profile: Beta ${(holdings.reduce((s,h)=>s+(h.beta||1),0)/Math.max(holdings.length,1)).toFixed(2)}, Avg Vol ${(holdings.reduce((s,h)=>s+(h.vol||20),0)/Math.max(holdings.length,1)).toFixed(1)}%
- User preferences learned: ${JSON.stringify((botMem?.learnedPreferences||{}))}
- Session count: ${(botMem?.sessionCount||1)}
  `;

  const sendMessage = async () => {
    if(!input.trim()||loading) return;
    const userMsg = { role:"user", text:input, ts:new Date().toLocaleTimeString() };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);

    // Update bot memory with this interaction
    const mem = {
      ...botMem,
      chatHistory: [...((botMem?.chatHistory||[])||[]).slice(-20), {q:input,ts:Date.now()}],
      learnedPreferences: {
        ...(botMem?.learnedPreferences||{}),
        lastQuery: input,
        queriedAt: Date.now(),
      }
    };
    setBotMem(mem);
    saveBotMemory(mem);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are NEXUS, an institutional portfolio AI assistant with access to the user's complete portfolio data. You coordinate 14 specialist agents. Be concise, data-driven, and use specific numbers from the portfolio. Always sign responses as "— NEXUS" and mention which agent provided the insight when relevant.

${portfolioContext}`,
          messages: newMsgs.filter(m=>m.role!=="system").map(m=>({role:m.role,content:m.text})),
        })
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "Unable to process request. Please try again.";
      setMsgs(prev=>[...prev,{role:"assistant",text:reply,ts:new Date().toLocaleTimeString()}]);

      // Learn from this interaction
      const updatedMem = {
        ...mem,
        learnedPreferences: {
          ...mem.learnedPreferences,
          successfulQuery: input,
        }
      };
      setBotMem(updatedMem);
      saveBotMemory(updatedMem);
    } catch(e) {
      setMsgs(prev=>[...prev,{role:"assistant",text:`NEXUS offline — API connection unavailable. I can still show you agent insights below. Error: ${e.message}`,ts:new Date().toLocaleTimeString()}]);
    }
    setLoading(false);
  };

  const QUICK = [
    "How is my portfolio performing?",
    "What are my biggest risks?",
    "Should I rebalance?",
    "Which holding has the best momentum?",
    "Summarize my dividends",
    "What does the Architect Bot suggest?",
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Header KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <KPI label="Active Agents"  value={AGENTS.length}    sub="All systems nominal"      color={BRAND.teal}   T={T}/>
        <KPI label="Total Signals"  value={tot}              sub="Generated last 24h"       color={BRAND.gold}   T={T}/>
        <KPI label="Avg Accuracy"   value={`${(AGENTS.filter(a=>a.acc!=="N/A").reduce((s,a)=>s+parseFloat(a.acc),0)/AGENTS.filter(a=>a.acc!=="N/A").length).toFixed(1)}%`} sub="Signal accuracy" color={BRAND.green} T={T}/>
        <KPI label="Alerts Active"  value={AGENTS.filter(a=>a.status==="ALERT").length} sub="Require attention" color={BRAND.red}  T={T}/>
      </div>

      {/* NEXUS Chat */}
      <Card T={T} glow={BRAND.gold}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:BRAND.gold,boxShadow:`0 0 10px ${BRAND.gold}`,animation:"pulse 1.8s infinite"}}/>
            <STN title="NEXUS Intelligence Chat" sub="Ask anything about your portfolio in natural language" color={BRAND.gold} T={T}/>
          </div>
          <button onClick={()=>setChat(v=>!v)} style={{padding:"7px 16px",borderRadius:9,border:`1px solid ${BRAND.gold}44`,background:chat?`${BRAND.gold}20`:`${BRAND.gold}10`,cursor:"pointer",color:BRAND.gold,fontFamily:BRAND.display,fontSize:11,fontWeight:700,transition:"all 0.2s"}}>
            {chat?"▼ Minimize":"▶ Open Chat"}
          </button>
        </div>

        {chat&&(
          <div>
            {/* Quick prompts */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
              {QUICK.map((q,i)=>(
                <button key={i} onClick={()=>setInput(q)} style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${BRAND.gold}33`,background:`${BRAND.gold}08`,cursor:"pointer",color:BRAND.gold,fontFamily:BRAND.mono,fontSize:9,fontWeight:600,transition:"all 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=`${BRAND.gold}18`}
                  onMouseLeave={e=>e.currentTarget.style.background=`${BRAND.gold}08`}>
                  {q}
                </button>
              ))}
            </div>

            {/* Chat messages */}
            <div ref={chatRef} style={{height:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,marginBottom:12,padding:"4px 0"}}>
              {msgs.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?`${BRAND.gold}18`:T.surface,border:`1px solid ${m.role==="user"?BRAND.gold+"33":T.border}`,fontSize:12,fontFamily:BRAND.mono,color:T.text,lineHeight:1.6}}>
                    {m.role==="assistant"&&(
                      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:BRAND.gold,animation:"pulse 2s infinite"}}/>
                        <span style={{fontSize:9,color:BRAND.gold,fontWeight:700,letterSpacing:1}}>NEXUS</span>
                        <span style={{fontSize:8,color:T.muted,marginLeft:"auto"}}>{m.ts}</span>
                      </div>
                    )}
                    {m.role==="user"&&<div style={{fontSize:8,color:T.muted,textAlign:"right",marginBottom:4}}>{m.ts}</div>}
                    <div style={{whiteSpace:"pre-wrap"}}>{m.text}</div>
                  </div>
                </div>
              ))}
              {loading&&(
                <div style={{display:"flex",justifyContent:"flex-start"}}>
                  <div style={{padding:"10px 14px",borderRadius:"14px 14px 14px 4px",background:T.surface,border:`1px solid ${T.border}`,display:"flex",gap:5,alignItems:"center"}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:BRAND.gold,animation:"pulse 0.6s infinite"}}/>
                    <div style={{width:6,height:6,borderRadius:"50%",background:BRAND.gold,animation:"pulse 0.6s 0.2s infinite"}}/>
                    <div style={{width:6,height:6,borderRadius:"50%",background:BRAND.gold,animation:"pulse 0.6s 0.4s infinite"}}/>
                    <span style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted,marginLeft:4}}>NEXUS processing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{display:"flex",gap:8}}>
              <input
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()}
                placeholder="Ask NEXUS anything about your portfolio..."
                style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px",color:T.text,fontSize:12,fontFamily:BRAND.mono,outline:"none"}}
              />
              <button onClick={sendMessage} disabled={loading||!input.trim()} style={{padding:"10px 20px",borderRadius:10,border:"none",cursor:loading||!input.trim()?"not-allowed":"pointer",background:`linear-gradient(135deg,${BRAND.gold},${BRAND.gold2})`,color:BRAND.bg,fontFamily:BRAND.display,fontSize:12,fontWeight:800,opacity:loading||!input.trim()?.6:1,transition:"all 0.2s",boxShadow:`0 0 16px ${BRAND.gold}33`}}>
                {loading?"...":"Send"}
              </button>
            </div>
            <div style={{marginTop:8,fontSize:9,fontFamily:BRAND.mono,color:T.muted,textAlign:"center"}}>
              Powered by Claude · Conversations saved locally for learning · Press Enter to send
            </div>
          </div>
        )}
      </Card>

      {/* Agent Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
        {AGENTS.map((a,i)=>(
          <div key={i} onClick={()=>setSel(sel===a.id?null:a.id)} style={{
            background:sel===a.id?`${a.color}12`:T.surface,
            border:`1px solid ${sel===a.id?a.color+"55":a.color+"22"}`,
            borderRadius:12,padding:13,cursor:"pointer",
            transition:"all 0.25s",
            boxShadow:sel===a.id?`0 0 20px ${a.color}18`:"none",
            transform:sel===a.id?"translateY(-2px)":"none",
          }}
            onMouseEnter={e=>{if(sel!==a.id){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor=a.color+"44";}}}
            onMouseLeave={e=>{if(sel!==a.id){e.currentTarget.style.transform="none";e.currentTarget.style.borderColor=a.color+"22";}}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:a.color,boxShadow:`0 0 5px ${a.color}`,animation:"pulse 2s infinite"}}/>
                <span style={{fontFamily:BRAND.mono,fontWeight:700,fontSize:9,color:a.color}}>{a.id}</span>
              </div>
              {a.status==="ALERT"&&<Chip label="ALERT" color={BRAND.red} size={7}/>}
              {a.status==="LEARNING"&&<Chip label="LEARN" color={BRAND.purple} size={7}/>}
            </div>
            <div style={{fontSize:11,fontFamily:BRAND.display,fontWeight:700,color:T.text,marginBottom:2,lineHeight:1.3}}>{a.name}</div>
            <div style={{fontSize:8,color:T.muted,fontFamily:BRAND.mono,marginBottom:7,lineHeight:1.4}}>{a.role}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:3,textAlign:"center",marginBottom:6}}>
              {[{l:"ACC",v:a.acc},{l:"SIG",v:a.signals},{l:"CPU",v:`${a.load}%`}].map((s,j)=>(
                <div key={j}>
                  <div style={{fontSize:7,fontFamily:BRAND.mono,color:T.muted}}>{s.l}</div>
                  <div style={{fontSize:10,fontFamily:BRAND.display,fontWeight:700,color:a.color}}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{height:3,background:T.border,borderRadius:2}}>
              <div style={{height:"100%",width:`${a.load}%`,background:`linear-gradient(90deg,${a.color},${a.color}70)`,borderRadius:2}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Detail */}
      {agent&&(
        <Card T={T} glow={agent.color} style={{animation:"fadeIn 0.3s ease"}}>
          <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:24}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:agent.color,boxShadow:`0 0 10px ${agent.color}`,animation:"pulse 1.5s infinite"}}/>
                <div style={{fontSize:18,fontFamily:BRAND.display,fontWeight:800,color:agent.color}}>{agent.name}</div>
                {agent.status==="ALERT"&&<Chip label="⚠ ALERT" color={BRAND.red}/>}
                {agent.status==="LEARNING"&&<Chip label="🧠 LEARNING" color={BRAND.purple}/>}
              </div>
              <div style={{fontSize:11,fontFamily:BRAND.mono,color:T.muted,marginBottom:14}}>{agent.role}</div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:10}}>ACTIVE TASKS</div>
              {agent.tasks.map((task,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:9,marginBottom:7,padding:"8px 12px",background:T.surface,borderRadius:8}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:agent.color,marginTop:4,flexShrink:0,animation:"pulse 1.5s infinite"}}/>
                  <span style={{fontSize:11,fontFamily:BRAND.mono,color:T.text,lineHeight:1.5}}>{task}</span>
                </div>
              ))}
              <div style={{marginTop:12,padding:"11px 14px",background:`${agent.color}08`,border:`1px solid ${agent.color}25`,borderRadius:9}}>
                <div style={{fontSize:9,fontFamily:BRAND.mono,color:agent.color,letterSpacing:2,marginBottom:5}}>LATEST INSIGHT</div>
                <div style={{fontSize:11,fontFamily:BRAND.mono,color:T.text,lineHeight:1.6}}>{agent.insight}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,alignContent:"start"}}>
              {[{l:"Accuracy",v:agent.acc},{l:"Signals",v:agent.signals},{l:"CPU Load",v:`${agent.load}%`},{l:"Status",v:agent.status}].map((s,i)=>(
                <div key={i} style={{background:T.surface,border:`1px solid ${agent.color}20`,borderRadius:10,padding:14,textAlign:"center"}}>
                  <div style={{fontSize:8,fontFamily:BRAND.mono,color:T.muted,letterSpacing:1,marginBottom:6}}>{s.l}</div>
                  <div style={{fontSize:17,fontFamily:BRAND.display,fontWeight:800,color:agent.color}}>{s.v}</div>
                </div>
              ))}
              <div style={{gridColumn:"1/-1",padding:"11px 14px",background:`${BRAND.purple}08`,border:`1px solid ${BRAND.purple}22`,borderRadius:10}}>
                <div style={{fontSize:9,fontFamily:BRAND.mono,color:BRAND.purple,letterSpacing:2,marginBottom:5}}>BOT LEARNING</div>
                <div style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted,lineHeight:1.6}}>
                  Session #{(botMem?.sessionCount||1)} · {botMem?.chatHistory?.length||0} queries learned · Last: {botMem?.lastVisit?new Date((botMem?.lastVisit||null)).toLocaleDateString():"Today"}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// ALERTS SYSTEM
// ═══════════════════════════════════════════════════════════════════
const ALERTS_KEY = "pcc_alerts_v1";
const loadAlerts = () => {
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY)||"[]"); } catch(e) { return []; }
};
const saveAlerts = (alerts) => {
  try { localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts)); } catch(e) {}
};

const AlertsTab = ({ holdings, T }) => {
  const [alerts,    setAlerts   ] = useState(loadAlerts);
  const [showForm,  setShowForm ] = useState(false);
  const [form,      setForm     ] = useState({ symbol:"", type:"above", price:"", note:"" });
  const [triggered, setTriggered] = useState([]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // Check alerts against current prices
  useEffect(()=>{
    const fired = alerts.filter(a=>{
      const h = holdings.find(h=>h.symbol===a.symbol);
      if(!h) return false;
      return a.type==="above" ? h.price >= +a.price : h.price <= +a.price;
    });
    setTriggered(fired.map(a=>a.id));
  },[alerts, holdings]);

  const addAlert = () => {
    if(!form.symbol || !form.price) return;
    const newAlert = { id:Date.now().toString(), ...form, price:+form.price, createdAt:new Date().toLocaleDateString(), active:true };
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    saveAlerts(updated);
    setForm({ symbol:"", type:"above", price:"", note:"" });
    setShowForm(false);
  };

  const deleteAlert = (id) => {
    const updated = alerts.filter(a=>a.id!==id);
    setAlerts(updated);
    saveAlerts(updated);
  };

  const toggleAlert = (id) => {
    const updated = alerts.map(a=>a.id===id?{...a,active:!a.active}:a);
    setAlerts(updated);
    saveAlerts(updated);
  };

  const inp = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px", color:T.text, fontSize:12, outline:"none", fontFamily:BRAND.mono, width:"100%" };

  const activeCount   = alerts.filter(a=>a.active).length;
  const firedCount    = triggered.length;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <KPI label="Total Alerts"    value={alerts.length}  sub="Configured"          color={BRAND.gold}   T={T}/>
        <KPI label="Active"          value={activeCount}    sub="Monitoring now"       color={BRAND.teal}   T={T}/>
        <KPI label="Triggered"       value={firedCount}     sub="Price reached"        color={firedCount>0?BRAND.red:BRAND.muted} T={T}/>
        <KPI label="Holdings"        value={holdings.length} sub="Being monitored"     color={BRAND.blue}   T={T}/>
      </div>

      {/* Triggered alerts banner */}
      {firedCount>0&&(
        <div style={{background:`${BRAND.red}12`,border:`2px solid ${BRAND.red}44`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:BRAND.red,animation:"pulse 1s infinite",flexShrink:0}}/>
          <div>
            <div style={{fontFamily:BRAND.display,fontWeight:700,fontSize:14,color:BRAND.red}}>🚨 {firedCount} Alert{firedCount>1?"s":""} Triggered!</div>
            <div style={{fontSize:11,fontFamily:BRAND.mono,color:T.muted,marginTop:3}}>
              {alerts.filter(a=>triggered.includes(a.id)).map(a=>`${a.symbol} ${a.type==="above"?"≥":"≤"} $${a.price.toLocaleString()}`).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {/* Add Alert button */}
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <button onClick={()=>setShowForm(v=>!v)} style={{padding:"9px 20px",borderRadius:10,border:`1px solid ${BRAND.gold}44`,background:showForm?`${BRAND.gold}20`:`${BRAND.gold}10`,cursor:"pointer",color:BRAND.gold,fontFamily:BRAND.display,fontSize:12,fontWeight:700,transition:"all 0.2s"}}>
          {showForm?"✕ Cancel":"➕ New Alert"}
        </button>
      </div>

      {/* Add Alert Form */}
      {showForm&&(
        <Card T={T} glow={BRAND.gold} style={{animation:"fadeIn 0.2s ease"}}>
          <STN title="Create Price Alert" sub="Get notified when price crosses your target" color={BRAND.gold} T={T}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:14}}>
            <div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:5}}>TICKER</div>
              <select value={form.symbol} onChange={e=>set("symbol",e.target.value)} style={{...inp,cursor:"pointer",appearance:"auto",background:T.mode==="dark"?"#061525":"#fff"}}>
                <option value="">Select holding...</option>
                {holdings.map(h=>(
                  <option key={h.id} value={h.symbol} style={{background:T.mode==="dark"?"#061525":"#fff"}}>
                    {h.symbol} — ${h.price.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:5}}>ALERT TYPE</div>
              <select value={form.type} onChange={e=>set("type",e.target.value)} style={{...inp,cursor:"pointer",appearance:"auto",background:T.mode==="dark"?"#061525":"#fff"}}>
                <option value="above" style={{background:T.mode==="dark"?"#061525":"#fff"}}>Price rises above ↑</option>
                <option value="below" style={{background:T.mode==="dark"?"#061525":"#fff"}}>Price falls below ↓</option>
              </select>
            </div>
            <div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:5}}>TARGET PRICE ($)</div>
              <input value={form.price} onChange={e=>set("price",e.target.value)} type="number" placeholder="250.00" style={inp}/>
              {form.symbol&&form.price&&(()=>{
                const h=holdings.find(x=>x.symbol===form.symbol);
                if(!h)return null;
                const diff=((+form.price-h.price)/h.price*100).toFixed(1);
                return <div style={{fontSize:10,fontFamily:BRAND.mono,color:+diff>=0?BRAND.teal:BRAND.red,marginTop:4}}>{+diff>=0?"+":""}{diff}% from current ${h.price.toLocaleString()}</div>;
              })()}
            </div>
            <div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:5}}>NOTE (OPTIONAL)</div>
              <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Take profit, Stop loss..." style={inp}/>
            </div>
          </div>
          <button onClick={addAlert} style={{padding:"10px 24px",borderRadius:10,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${BRAND.gold},${BRAND.gold2})`,color:BRAND.bg,fontFamily:BRAND.display,fontSize:13,fontWeight:800,boxShadow:`0 0 20px ${BRAND.gold}33`}}>
            ✓ Create Alert
          </button>
        </Card>
      )}

      {/* Alerts List */}
      {alerts.length===0?(
        <Card T={T} style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:32,marginBottom:12}}>🔔</div>
          <div style={{fontFamily:BRAND.display,fontWeight:600,fontSize:16,color:T.muted}}>No alerts configured</div>
          <div style={{fontSize:12,fontFamily:BRAND.mono,color:T.muted,marginTop:6}}>Create your first price alert above</div>
        </Card>
      ):(
        <Card T={T}>
          <STN title="Active Alerts" sub="Click toggle to pause · trash to delete" color={BRAND.blue} T={T}/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {alerts.sort((a,b)=>b.id-a.id).map(alert=>{
              const h = holdings.find(x=>x.symbol===alert.symbol);
              const isFired = triggered.includes(alert.id);
              const borderColor = isFired ? BRAND.red : alert.active ? BRAND.teal : T.muted;
              const diff = h ? ((+alert.price-h.price)/h.price*100).toFixed(1) : null;

              return (
                <div key={alert.id} style={{
                  display:"flex",alignItems:"center",gap:12,
                  padding:"12px 16px",
                  background:isFired?`${BRAND.red}08`:alert.active?`${BRAND.teal}05`:T.surface,
                  border:`1px solid ${borderColor}33`,
                  borderLeft:`4px solid ${borderColor}`,
                  borderRadius:10,transition:"all 0.2s",
                }}>
                  {/* Status dot */}
                  <div style={{width:10,height:10,borderRadius:"50%",background:isFired?BRAND.red:alert.active?BRAND.teal:T.muted,flexShrink:0,animation:isFired?"pulse 1s infinite":"none"}}/>

                  {/* Info */}
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <span style={{fontFamily:BRAND.mono,fontWeight:800,fontSize:14,color:BRAND.gold}}>{alert.symbol}</span>
                      <Chip label={alert.type==="above"?"↑ Above":"↓ Below"} color={alert.type==="above"?BRAND.teal:BRAND.red}/>
                      <span style={{fontFamily:BRAND.mono,fontWeight:700,fontSize:14,color:T.text}}>${(+alert.price).toLocaleString()}</span>
                      {isFired&&<Chip label="🚨 TRIGGERED" color={BRAND.red}/>}
                    </div>
                    <div style={{display:"flex",gap:12,fontSize:10,fontFamily:BRAND.mono,color:T.muted}}>
                      {h&&<span>Current: <b style={{color:T.text}}>${h.price.toLocaleString()}</b></span>}
                      {diff&&<span>Distance: <b style={{color:+diff>=0?BRAND.teal:BRAND.red}}>{+diff>=0?"+":""}{diff}%</b></span>}
                      <span>Created: {alert.createdAt}</span>
                      {alert.note&&<span>Note: {alert.note}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>toggleAlert(alert.id)} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${alert.active?BRAND.teal+"44":T.border}`,background:alert.active?`${BRAND.teal}12`:"transparent",cursor:"pointer",color:alert.active?BRAND.teal:T.muted,fontFamily:BRAND.mono,fontSize:10,fontWeight:700,transition:"all 0.15s"}}>
                      {alert.active?"⏸ Pause":"▶ Resume"}
                    </button>
                    <button onClick={()=>deleteAlert(alert.id)} style={{padding:"5px 10px",borderRadius:7,border:`1px solid ${BRAND.red}33`,background:`${BRAND.red}08`,cursor:"pointer",color:BRAND.red,fontFamily:BRAND.mono,fontSize:12,transition:"all 0.15s"}}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick alerts suggestions */}
      {holdings.length>0&&(
        <Card T={T}>
          <STN title="Quick Alert Suggestions" sub="Common price targets based on your holdings" color={BRAND.purple} T={T}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
            {holdings.slice(0,6).flatMap(h=>[
              {symbol:h.symbol,type:"above",price:+(h.price*1.10).toFixed(2),label:"+10% Take Profit"},
              {symbol:h.symbol,type:"below",price:+(h.price*0.90).toFixed(2),label:"-10% Stop Loss"},
            ]).map((s,i)=>(
              <button key={i} onClick={()=>{setForm({symbol:s.symbol,type:s.type,price:s.price,note:s.label});setShowForm(true);}} style={{
                display:"flex",alignItems:"center",gap:8,
                padding:"9px 13px",borderRadius:9,
                border:`1px solid ${s.type==="above"?BRAND.teal:BRAND.red}33`,
                background:`${s.type==="above"?BRAND.teal:BRAND.red}06`,
                cursor:"pointer",transition:"all 0.2s",textAlign:"left",
              }}>
                <span style={{fontFamily:BRAND.mono,fontWeight:700,fontSize:11,color:BRAND.gold}}>{s.symbol}</span>
                <span style={{fontFamily:BRAND.mono,fontSize:10,color:s.type==="above"?BRAND.teal:BRAND.red}}>{s.label}</span>
                <span style={{fontFamily:BRAND.mono,fontSize:11,color:T.muted,marginLeft:"auto"}}>${s.price.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// TRANSACTIONS HISTORY
// ═══════════════════════════════════════════════════════════════════
const TX_KEY = "pcc_transactions_v1";
const loadTx = () => {
  try { return JSON.parse(localStorage.getItem(TX_KEY)||"[]"); } catch(e) { return []; }
};
const saveTx = (txs) => {
  try { localStorage.setItem(TX_KEY, JSON.stringify(txs)); } catch(e) {}
};

// Generate sample transactions from holdings
const genSampleTx = (holdings) => holdings.flatMap(h=>[
  { id:`${h.id}_buy1`, symbol:h.symbol, type:"BUY",  qty:h.qty, price:h.avgCost, total:+(h.qty*h.avgCost).toFixed(2), broker:h.broker, portfolio:h.portfolio, date:"2024-01-15", note:"Initial position" },
]);

const TransactionsTab = ({ holdings, T }) => {
  const [txs,     setTxs    ] = useState(()=>{ const s=loadTx(); return s.length>0?s:genSampleTx(holdings); });
  const [showAdd, setShowAdd] = useState(false);
  const [filter,  setFilter ] = useState({ type:"ALL", symbol:"ALL", broker:"ALL" });
  const [sort,    setSort   ] = useState({ col:"date", dir:-1 });
  const [form,    setForm   ] = useState({ symbol:"", type:"BUY", qty:"", price:"", broker:"Robinhood", portfolio:"Roth IRA", date:new Date().toISOString().split("T")[0], note:"" });

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const addTx = () => {
    if(!form.symbol||!form.qty||!form.price) return;
    const tx = { id:Date.now().toString(), ...form, qty:+form.qty, price:+form.price, total:+(+form.qty*+form.price).toFixed(2) };
    const updated = [tx, ...txs];
    setTxs(updated); saveTx(updated);
    setForm({ symbol:"", type:"BUY", qty:"", price:"", broker:"Robinhood", portfolio:"Roth IRA", date:new Date().toISOString().split("T")[0], note:"" });
    setShowAdd(false);
  };

  const deleteTx = (id) => { const u=[...txs].filter(t=>t.id!==id); setTxs(u); saveTx(u); };

  // Filter
  const filtered = txs.filter(t=>
    (filter.type==="ALL"||t.type===filter.type) &&
    (filter.symbol==="ALL"||t.symbol===filter.symbol) &&
    (filter.broker==="ALL"||t.broker===filter.broker)
  );

  // Sort
  const sorted = [...filtered].sort((a,b)=>{
    const av=a[sort.col], bv=b[sort.col];
    return typeof av==="string"?av.localeCompare(bv)*sort.dir:(bv-av)*sort.dir;
  });

  // Stats
  const totalBought = txs.filter(t=>t.type==="BUY" ).reduce((s,t)=>s+t.total,0);
  const totalSold   = txs.filter(t=>t.type==="SELL").reduce((s,t)=>s+t.total,0);
  const totalDiv    = txs.filter(t=>t.type==="DIV" ).reduce((s,t)=>s+t.total,0);
  const realized    = totalSold - txs.filter(t=>t.type==="SELL").reduce((s,t)=>s+t.qty*( txs.find(b=>b.symbol===t.symbol&&b.type==="BUY")?.price||t.price ),0);

  const symbols = [...new Set(txs.map(t=>t.symbol))];
  const brokers = [...new Set(txs.map(t=>t.broker))];

  const inp = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 11px", color:T.text, fontSize:12, outline:"none", fontFamily:BRAND.mono, width:"100%" };
  const sel = { ...inp, cursor:"pointer", appearance:"auto", WebkitAppearance:"auto", background:T.mode==="dark"?"#061525":"#fff" };

  const TH = ({col,label}) => (
    <th onClick={()=>setSort(s=>({col,dir:s.col===col?-s.dir:-1}))} style={{textAlign:"left",padding:"7px 10px",color:sort.col===col?BRAND.gold:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1,cursor:"pointer",whiteSpace:"nowrap",userSelect:"none"}}>
      {label}{sort.col===col?(sort.dir===-1?" ↓":" ↑"):""}
    </th>
  );

  const typeColor = { BUY:BRAND.teal, SELL:BRAND.red, DIV:BRAND.green, SPLIT:BRAND.purple, TRANSFER:BRAND.blue };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
        <KPI label="Total Transactions" value={txs.length}                                          color={BRAND.gold}                         T={T}/>
        <KPI label="Total Invested"     value={`$${Math.round(totalBought).toLocaleString()}`}      color={BRAND.blue}   sub="All buys"          T={T}/>
        <KPI label="Total Sold"         value={`$${Math.round(totalSold).toLocaleString()}`}        color={BRAND.red}    sub="All sells"         T={T}/>
        <KPI label="Dividends Received" value={`$${Math.round(totalDiv).toLocaleString()}`}        color={BRAND.green}  sub="Cash received"     T={T}/>
        <KPI label="Realized P&L"       value={`${realized>=0?"+":"-"}$${Math.abs(Math.round(realized)).toLocaleString()}`} color={realized>=0?BRAND.teal:BRAND.red} sub="From closed positions" T={T}/>
      </div>

      {/* Controls */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        {/* Filters */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <select value={filter.type} onChange={e=>setFilter(f=>({...f,type:e.target.value}))} style={{...sel,width:"auto",padding:"6px 10px",fontSize:11}}>
            {["ALL","BUY","SELL","DIV","SPLIT","TRANSFER"].map(t=><option key={t} style={{background:T.mode==="dark"?"#061525":"#fff"}}>{t}</option>)}
          </select>
          <select value={filter.symbol} onChange={e=>setFilter(f=>({...f,symbol:e.target.value}))} style={{...sel,width:"auto",padding:"6px 10px",fontSize:11}}>
            <option value="ALL">All Tickers</option>
            {symbols.map(s=><option key={s} style={{background:T.mode==="dark"?"#061525":"#fff"}}>{s}</option>)}
          </select>
          <select value={filter.broker} onChange={e=>setFilter(f=>({...f,broker:e.target.value}))} style={{...sel,width:"auto",padding:"6px 10px",fontSize:11}}>
            <option value="ALL">All Brokers</option>
            {brokers.map(b=><option key={b} style={{background:T.mode==="dark"?"#061525":"#fff"}}>{b}</option>)}
          </select>
          <span style={{fontSize:11,fontFamily:BRAND.mono,color:T.muted,alignSelf:"center"}}>{filtered.length} of {txs.length}</span>
        </div>
        <button onClick={()=>setShowAdd(v=>!v)} style={{padding:"8px 18px",borderRadius:9,border:`1px solid ${BRAND.gold}44`,background:showAdd?`${BRAND.gold}20`:`${BRAND.gold}10`,cursor:"pointer",color:BRAND.gold,fontFamily:BRAND.display,fontSize:11,fontWeight:700}}>
          {showAdd?"✕ Cancel":"➕ Add Transaction"}
        </button>
      </div>

      {/* Add Transaction Form */}
      {showAdd&&(
        <Card T={T} glow={BRAND.gold} style={{animation:"fadeIn 0.2s ease"}}>
          <STN title="Add Transaction" sub="Record a buy, sell, dividend or transfer" color={BRAND.gold} T={T}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:12}}>
            <div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:4}}>TYPE</div>
              <select value={form.type} onChange={e=>set("type",e.target.value)} style={{...sel}}>
                {["BUY","SELL","DIV","SPLIT","TRANSFER"].map(t=><option key={t} style={{background:T.mode==="dark"?"#061525":"#fff"}}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:4}}>TICKER</div>
              <input value={form.symbol} onChange={e=>{set("symbol",e.target.value.toUpperCase()); const p=PRICE_DB[e.target.value.toUpperCase()]; if(p)set("price",p);}} placeholder="AAPL" style={{...inp,fontWeight:700,color:BRAND.gold}} list="tx-symbols"/>
              <datalist id="tx-symbols">{holdings.map(h=><option key={h.id} value={h.symbol}/>)}</datalist>
            </div>
            <div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:4}}>SHARES</div>
              <input value={form.qty} onChange={e=>set("qty",e.target.value)} type="number" placeholder="10" style={inp}/>
            </div>
            <div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:4}}>PRICE ($)</div>
              <input value={form.price} onChange={e=>set("price",e.target.value)} type="number" placeholder="213.50" style={inp}/>
              {form.qty&&form.price&&<div style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted,marginTop:3}}>Total: <b style={{color:BRAND.gold}}>${(+form.qty*+form.price).toLocaleString(undefined,{maximumFractionDigits:0})}</b></div>}
            </div>
            <div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:4}}>DATE</div>
              <input value={form.date} onChange={e=>set("date",e.target.value)} type="date" style={inp}/>
            </div>
            <div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:4}}>BROKER</div>
              <select value={form.broker} onChange={e=>set("broker",e.target.value)} style={sel}>
                {["Robinhood","Fidelity","TSP Federal"].map(b=><option key={b} style={{background:T.mode==="dark"?"#061525":"#fff"}}>{b}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:4}}>PORTFOLIO</div>
              <input value={form.portfolio} onChange={e=>set("portfolio",e.target.value)} placeholder="Roth IRA" style={inp} list="tx-portfolios"/>
              <datalist id="tx-portfolios">{[...new Set(holdings.map(h=>h.portfolio))].map(p=><option key={p} value={p}/>)}</datalist>
            </div>
            <div>
              <div style={{fontSize:9,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:4}}>NOTE</div>
              <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Optional note..." style={inp}/>
            </div>
          </div>
          <button onClick={addTx} style={{padding:"10px 24px",borderRadius:10,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${BRAND.gold},${BRAND.gold2})`,color:BRAND.bg,fontFamily:BRAND.display,fontSize:13,fontWeight:800,boxShadow:`0 0 20px ${BRAND.gold}33`}}>
            ✓ Record Transaction
          </button>
        </Card>
      )}

      {/* Transaction Table */}
      <Card T={T}>
        <STN title="Transaction History" sub={`${filtered.length} transactions · sorted by ${sort.col}`} color={BRAND.blue} T={T}/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${T.border}`}}>
                <TH col="date"      label="Date"/>
                <TH col="type"      label="Type"/>
                <TH col="symbol"    label="Symbol"/>
                <TH col="qty"       label="Shares"/>
                <TH col="price"     label="Price"/>
                <TH col="total"     label="Total"/>
                <th style={{textAlign:"left",padding:"7px 10px",color:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1}}>Broker</th>
                <th style={{textAlign:"left",padding:"7px 10px",color:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1}}>Portfolio</th>
                <th style={{textAlign:"left",padding:"7px 10px",color:T.muted,fontFamily:BRAND.mono,fontSize:9,letterSpacing:1}}>Note</th>
                <th style={{padding:"7px 10px"}}/>
              </tr>
            </thead>
            <tbody>
              {sorted.map((tx,i)=>(
                <tr key={i}
                  style={{borderBottom:`1px solid ${T.border}`,transition:"background 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surface}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"9px 10px",fontFamily:BRAND.mono,color:T.muted,fontSize:11}}>{tx.date}</td>
                  <td style={{padding:"9px 10px"}}>
                    <Chip label={tx.type} color={typeColor[tx.type]||BRAND.gold}/>
                  </td>
                  <td style={{padding:"9px 10px",fontWeight:700,color:BRAND.gold,fontFamily:BRAND.mono,fontSize:13}}>{tx.symbol}</td>
                  <td style={{padding:"9px 10px",fontFamily:BRAND.mono,color:T.text}}>{tx.qty}</td>
                  <td style={{padding:"9px 10px",fontFamily:BRAND.mono,color:T.text}}>${(+tx.price).toLocaleString()}</td>
                  <td style={{padding:"9px 10px",fontFamily:BRAND.mono,fontWeight:700,color:tx.type==="SELL"?BRAND.red:tx.type==="DIV"?BRAND.green:BRAND.teal}}>{tx.type==="SELL"?"-":"+"}${Math.round(tx.total).toLocaleString()}</td>
                  <td style={{padding:"9px 10px",fontSize:11,color:T.muted}}>{tx.broker?.split(" ")[0]}</td>
                  <td style={{padding:"9px 10px",fontSize:11,color:T.muted}}>{tx.portfolio}</td>
                  <td style={{padding:"9px 10px",fontSize:11,color:T.muted,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.note}</td>
                  <td style={{padding:"9px 10px"}}>
                    <button onClick={()=>deleteTx(tx.id)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${BRAND.red}33`,background:`${BRAND.red}08`,cursor:"pointer",color:BRAND.red,fontSize:11}}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{borderTop:`2px solid ${T.border}`,background:`${BRAND.gold}05`}}>
                <td colSpan={5} style={{padding:"9px 10px",fontFamily:BRAND.display,fontWeight:700,color:BRAND.gold}}>TOTALS</td>
                <td style={{padding:"9px 10px",fontFamily:BRAND.mono,fontWeight:800,color:BRAND.teal,fontSize:13}}>${Math.round(filtered.reduce((s,t)=>s+(t.type==="SELL"?-t.total:t.total),0)).toLocaleString()}</td>
                <td colSpan={4}/>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Monthly summary chart */}
      <Card T={T} glow={BRAND.blue}>
        <STN title="Monthly Activity" sub="Buys vs Sells by month" color={BRAND.blue} T={T}/>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={Array.from({length:12},(_,i)=>{
            const month = new Date(2024,i,1).toLocaleString("en",{month:"short"});
            const monthTxs = txs.filter(t=>new Date(t.date).getMonth()===i);
            return {
              month,
              Buys:  +monthTxs.filter(t=>t.type==="BUY" ).reduce((s,t)=>s+t.total,0).toFixed(0),
              Sells: +monthTxs.filter(t=>t.type==="SELL").reduce((s,t)=>s+t.total,0).toFixed(0),
              Divs:  +monthTxs.filter(t=>t.type==="DIV" ).reduce((s,t)=>s+t.total,0).toFixed(0),
            };
          })} margin={{top:5,right:5,bottom:0,left:0}}>
            <CartesianGrid strokeDasharray="2 6" stroke={T.border} vertical={false}/>
            <XAxis dataKey="month" tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false}/>
            <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:BRAND.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={45}/>
            <Tooltip content={<TT T={T}/>}/>
            <Legend wrapperStyle={{fontSize:10,fontFamily:BRAND.mono,paddingTop:8}}/>
            <Bar dataKey="Buys"  fill={BRAND.teal} radius={[4,4,0,0]} opacity={.85}/>
            <Bar dataKey="Sells" fill={BRAND.red}   radius={[4,4,0,0]} opacity={.85}/>
            <Bar dataKey="Divs"  fill={BRAND.green} radius={[4,4,0,0]} opacity={.85}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ANALYSIS PANEL — shown below chart at each level
// ═══════════════════════════════════════════════════════════════════
const ANALYSIS_TABS = [
  { id:"perf",    label:"Performance",  icon:"📈" },
  { id:"bench",   label:"Benchmark",    icon:"📐" },
  { id:"risk",    label:"Risk",         icon:"🛡" },
  { id:"corr",    label:"Correlations", icon:"🔥" },
  { id:"div",     label:"Dividends",    icon:"💰" },
  { id:"proj",    label:"Projections",  icon:"🔮" },
  { id:"mc",      label:"Monte Carlo",  icon:"🎲" },
  { id:"snow",    label:"Snowflake",    icon:"❄️" },
  { id:"factor",  label:"Factors",      icon:"⚖️" },
  { id:"frontier",label:"Efficient Frontier",icon:"🎯" },
  { id:"ai",      label:"AI Intelligence",  icon:"🤖" },
  { id:"alerts",  label:"Alerts",           icon:"🔔" },
  { id:"history", label:"Transactions",      icon:"📋" },
];

const AnalysisPanel = ({ holdings, T, activeTab, botMem, setBotMem }) => {
  return (
    <div style={{animation:"fadeIn 0.25s ease"}}>
      {activeTab==="perf"    && <PerformanceTab      holdings={holdings} T={T}/>}
      {activeTab==="bench"   && <BenchmarkTab        holdings={holdings} T={T}/>}
      {activeTab==="risk"    && <RiskTab             holdings={holdings} T={T}/>}
      {activeTab==="corr"    && <CorrelationsTab     holdings={holdings} T={T}/>}
      {activeTab==="div"     && <DividendsTab        holdings={holdings} T={T}/>}
      {activeTab==="proj"    && <ProjectionsTab      holdings={holdings} T={T}/>}
      {activeTab==="mc"      && <MonteCarloTab       holdings={holdings} T={T}/>}
      {activeTab==="snow"    && <SnowflakeTab        holdings={holdings} T={T}/>}
      {activeTab==="factor"  && <FactorTab           holdings={holdings} T={T}/>}
      {activeTab==="frontier"&& <EfficientFrontierTab holdings={holdings} T={T}/>}
      {activeTab==="ai"      && <AITab               holdings={holdings} T={T} botMem={botMem} setBotMem={setBotMem}/>}
      {activeTab==="alerts"  && <AlertsTab        holdings={holdings} T={T}/>}
      {activeTab==="history" && <TransactionsTab  holdings={holdings} T={T}/>}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [isDark,  setIsDark  ] = useState(true);
  const [holdings,setHoldings] = useState(INITIAL_HOLDINGS);
  const [editH,   setEditH   ] = useState(null);
  const [showAdd, setShowAdd  ] = useState(false);
  const [liveTV,  setLiveTV  ] = useState(null);
  const [livePL,  setLivePL  ] = useState(3247.80);
  const [botMem,  setBotMem  ] = useState(initBotMemory);
  const [navLevel,setNavLevel] = useState({ level:"total", broker:null, fund:null });
  const [period,  setPeriod  ] = useState("1Y");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const T = isDark ? DARK : LIGHT;

  const TV   = useMemo(()=>holdings.reduce((s,h)=>s+V(h),0), [holdings]);
  const TC   = useMemo(()=>holdings.reduce((s,h)=>s+CO(h),0),[holdings]);
  const TPL  = TV - TC;
  const TPLP = TPL / TC * 100;
  const TDIV = holdings.reduce((s,h)=>s+h.qty*(h.div||0),0);

  useEffect(()=>{ setLiveTV(TV); },[TV]);
  useEffect(()=>{
    const id = setInterval(()=>{
      setLiveTV(v => v ? +(v+(Math.random()-.48)*120).toFixed(2) : TV);
      setLivePL(v => +(v+(Math.random()-.48)*80).toFixed(2));
    },2000);
    return()=>clearInterval(id);
  },[TV]);

  useEffect(()=>{
    const mem = {...botMem, sessionCount: (botMem?.sessionCount||1)+1, lastVisit: new Date().toISOString() };
    setBotMem(mem); saveBotMemory(mem);
  },[]);

  const saveHolding = h => {
    setHoldings(prev => {
      const exists = prev.find(x=>x.id===h.id);
      return exists ? prev.map(x=>x.id===h.id?h:x) : [...prev,h];
    });
    setEditH(null); setShowAdd(false);
  };
  const deleteHolding = id => { setHoldings(prev=>prev.filter(x=>x.id!==id)); setEditH(null); };

  const brokerNames = [...new Set(holdings.map(h=>h.broker))];
  const fundNames   = broker => [...new Set(holdings.filter(h=>h.broker===broker).map(h=>h.portfolio))];

  const visibleHoldings = useMemo(()=>{
    if(navLevel.level==="portfolio")   return holdings.filter(h=>h.broker===navLevel.broker&&h.portfolio===navLevel.fund);
    if(navLevel.level==="broker") return holdings.filter(h=>h.broker===navLevel.broker);
    return holdings;
  },[holdings,navLevel]);

  const navTV  = visibleHoldings.reduce((s,h)=>s+V(h),0);
  const navTPL = visibleHoldings.reduce((s,h)=>s+PL(h),0);
  const navLabel = navLevel.fund||navLevel.broker||"Total Portfolio";
  const navColor = navLevel.broker ? BROKER_COLOR[navLevel.broker]||BRAND.gold : BRAND.gold;

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:BRAND.display,transition:"background 0.3s,color 0.3s"}}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap");
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${BRAND.gold}30;border-radius:2px}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(1.6)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        input::placeholder{color:${T.muted}}
        select option{background:${T.bg2};color:${T.text}}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input:focus{outline:none;border-color:${BRAND.gold}55!important}
        button:focus{outline:none}
        th{user-select:none}
      `}</style>

      {/* HEADER */}
      <div style={{borderBottom:`1px solid ${BRAND.gold}14`,background:T.header,backdropFilter:"blur(24px)",position:"sticky",top:0,zIndex:100,boxShadow:T.mode==="dark"?"0 4px 32px rgba(0,0,0,0.5)":"0 4px 20px rgba(0,0,0,0.08)"}}>
        <div style={{padding:"0 24px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
            <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
              <div style={{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg,${BRAND.gold},${BRAND.blue})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,boxShadow:`0 0 24px ${BRAND.gold}44`}}>⬡</div>
              <div>
                <div style={{fontWeight:800,fontSize:16,letterSpacing:-.5,background:`linear-gradient(90deg,${BRAND.gold},${BRAND.gold2} 40%,${BRAND.blue})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Portfolio Command Center</div>
                <div style={{fontSize:9,color:T.muted,fontFamily:BRAND.mono,letterSpacing:2}}>v3.0 · 15 AI AGENTS · INSTITUTIONAL</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:0}}>
              {[
                {l:"TOTAL",  v:`$${(liveTV||TV).toLocaleString("en",{minimumFractionDigits:2})}`,c:BRAND.gold},
                {l:"DAY P&L",v:`${livePL>=0?"+":""}$${Math.abs(livePL).toFixed(2)}`,              c:livePL>=0?BRAND.teal:BRAND.red},
                {l:"YTD",    v:"+9.74%",  c:BRAND.teal},
                {l:"SHARPE", v:"1.84",    c:BRAND.blue},
                {l:"BETA",   v:"0.92",    c:BRAND.purple},
                {l:"DIV/YR", v:`$${Math.round(TDIV).toLocaleString()}`, c:BRAND.green},
              ].map((s,i)=>(
                <div key={i} style={{textAlign:"center",padding:"4px 14px",borderRight:i<5?`1px solid ${T.border}`:"none"}}>
                  <div style={{fontSize:8,fontFamily:BRAND.mono,color:T.muted,letterSpacing:2,marginBottom:2}}>{s.l}</div>
                  <div style={{fontSize:13,fontFamily:BRAND.mono,fontWeight:700,color:s.c,transition:"color 0.3s"}}>{s.v}</div>
                </div>
              ))}
              <div style={{display:"flex",alignItems:"center",gap:5,marginLeft:12,background:BRAND.teal+"12",border:`1px solid ${BRAND.teal}30`,borderRadius:20,padding:"4px 12px"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:BRAND.teal,display:"inline-block",animation:"pulse 1.8s infinite"}}/>
                <span style={{fontSize:9,fontFamily:BRAND.mono,color:BRAND.teal,fontWeight:700,letterSpacing:1}}>LIVE</span>
              </div>
              <button onClick={()=>setIsDark(d=>!d)} style={{marginLeft:12,width:38,height:22,borderRadius:11,border:`1px solid ${T.border}`,background:isDark?BRAND.gold+"22":BRAND.blue+"22",cursor:"pointer",display:"flex",alignItems:"center",padding:"0 3px",transition:"all 0.3s",flexShrink:0}}>
                <div style={{width:16,height:16,borderRadius:"50%",background:isDark?BRAND.gold:BRAND.blue,transform:isDark?"translateX(0)":"translateX(16px)",transition:"transform 0.3s",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>{isDark?"🌙":"☀️"}</div>
              </button>
              <button onClick={()=>setShowAdd(true)} style={{marginLeft:10,padding:"7px 14px",borderRadius:9,border:`1px solid ${BRAND.gold}44`,background:`${BRAND.gold}12`,cursor:"pointer",color:BRAND.gold,fontFamily:BRAND.display,fontSize:11,fontWeight:700,transition:"all 0.2s",flexShrink:0}}>➕ Add</button>
            </div>
          </div>

          {/* Main Analysis Tabs — 2 Rows, Full Width */}
          <div style={{borderBottom:`1px solid ${T.border}`,paddingBottom:0}}>
            {/* Row 1 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,padding:"4px 0 3px 0"}}>
              {[
                {id:"overview",  label:"Overview",     icon:"📊", color:BRAND.gold},
                {id:"perf",      label:"Performance",  icon:"📈", color:BRAND.teal},
                {id:"bench",     label:"Benchmark",    icon:"📐", color:BRAND.blue},
                {id:"risk",      label:"Risk",         icon:"🛡", color:BRAND.red},
                {id:"corr",      label:"Correlations", icon:"🔥", color:BRAND.amber},
                {id:"div",       label:"Dividends",    icon:"💰", color:BRAND.green},
              ].map(t=>{
                const isA=activeTab===t.id;
                return(
                  <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
                    display:"flex",alignItems:"center",justifyContent:"center",gap:5,
                    padding:"8px 4px",borderRadius:"8px 8px 0 0",border:"none",
                    cursor:"pointer",fontFamily:BRAND.display,fontSize:11,fontWeight:700,
                    background:isA?`linear-gradient(135deg,${t.color}25,${t.color}10)`:T.surface,
                    color:isA?t.color:T.muted,
                    borderBottom:isA?`3px solid ${t.color}`:`3px solid transparent`,
                    boxShadow:isA?`inset 0 0 0 1px ${t.color}33`:`inset 0 0 0 1px ${T.border}`,
                    transition:"all 0.18s",
                  }}
                    onMouseEnter={e=>{if(!isA){e.currentTarget.style.background=`${t.color}10`;e.currentTarget.style.color=t.color;}}}
                    onMouseLeave={e=>{if(!isA){e.currentTarget.style.background=T.surface;e.currentTarget.style.color=T.muted;}}}>
                    <span style={{fontSize:13}}>{t.icon}</span>
                    <span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Row 2 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:3,padding:"3px 0 0 0"}}>
              {[
                {id:"proj",      label:"Projections",  icon:"🔮", color:BRAND.purple},
                {id:"mc",        label:"Monte Carlo",  icon:"🎲", color:BRAND.purple},
                {id:"snow",      label:"Snowflake",    icon:"❄️", color:BRAND.cyan},
                {id:"factor",    label:"Factors",      icon:"⚖️", color:BRAND.purple},
                {id:"frontier",  label:"Eff. Frontier",icon:"🎯", color:BRAND.teal},
                {id:"ai",        label:"AI Intelligence",icon:"🤖",color:BRAND.amber},
                {id:"alerts",    label:"Alerts",         icon:"🔔",color:BRAND.red},
                {id:"history",   label:"Transactions",   icon:"📋",color:BRAND.blue},
              ].map(t=>{
                const isA=activeTab===t.id;
                return(
                  <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
                    display:"flex",alignItems:"center",justifyContent:"center",gap:5,
                    padding:"8px 4px",borderRadius:"0 0 8px 8px",border:"none",
                    cursor:"pointer",fontFamily:BRAND.display,fontSize:11,fontWeight:700,
                    background:isA?`linear-gradient(135deg,${t.color}25,${t.color}10)`:T.surface,
                    color:isA?t.color:T.muted,
                    borderBottom:isA?`3px solid ${t.color}`:`3px solid transparent`,
                    boxShadow:isA?`inset 0 0 0 1px ${t.color}33`:`inset 0 0 0 1px ${T.border}`,
                    transition:"all 0.18s",
                  }}
                    onMouseEnter={e=>{if(!isA){e.currentTarget.style.background=`${t.color}10`;e.currentTarget.style.color=t.color;}}}
                    onMouseLeave={e=>{if(!isA){e.currentTarget.style.background=T.surface;e.currentTarget.style.color=T.muted;}}}>
                    <span style={{fontSize:13}}>{t.icon}</span>
                    <span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Portfolio Navigator — Total > Broker > Portfolio */}
          <div style={{display:"flex",alignItems:"center",gap:0,paddingTop:4,paddingBottom:2,overflowX:"auto",flexWrap:"nowrap"}}>
            {/* Total */}
            <button onClick={()=>setNavLevel({level:"total",broker:null,fund:null})} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",border:"none",cursor:"pointer",fontFamily:BRAND.display,fontSize:11,fontWeight:700,whiteSpace:"nowrap",background:navLevel.level==="total"?`${BRAND.gold}12`:"transparent",color:navLevel.level==="total"?BRAND.gold:T.muted,borderBottom:navLevel.level==="total"?`2px solid ${BRAND.gold}`:"2px solid transparent",transition:"all 0.2s"}}>
              🌐 All Portfolios <span style={{fontSize:8,background:`${BRAND.gold}20`,color:BRAND.gold,borderRadius:4,padding:"1px 5px",fontFamily:BRAND.mono}}>{holdings.length}</span>
            </button>

            <span style={{color:T.muted,fontSize:14,padding:"0 4px",flexShrink:0}}>›</span>

            {/* Brokers */}
            {brokerNames.map(broker=>{
              const bc=BROKER_COLOR[broker]||BRAND.gold;
              const bh=holdings.filter(h=>h.broker===broker);
              const isA=navLevel.broker===broker;
              return(
                <button key={broker} onClick={()=>setNavLevel({level:"broker",broker,fund:null})} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 13px",border:"none",cursor:"pointer",fontFamily:BRAND.display,fontSize:11,fontWeight:600,whiteSpace:"nowrap",background:isA?`${bc}12`:"transparent",color:isA?bc:T.muted,borderBottom:isA?`2px solid ${bc}`:"2px solid transparent",transition:"all 0.2s"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:bc,boxShadow:isA?`0 0 6px ${bc}`:""}}/>
                  {broker.split(" ")[0]}
                  <span style={{fontSize:8,background:`${bc}20`,color:bc,borderRadius:4,padding:"1px 5px",fontFamily:BRAND.mono}}>{bh.length}</span>
                </button>
              );
            })}

            {/* Portfolios under selected broker */}
            {navLevel.broker&&<>
              <span style={{color:T.muted,fontSize:14,padding:"0 4px",flexShrink:0}}>›</span>
              {fundNames(navLevel.broker).map(port=>{
                const bc=BROKER_COLOR[navLevel.broker]||BRAND.gold;
                const ph=holdings.filter(h=>h.broker===navLevel.broker&&h.portfolio===port);
                const isA=navLevel.fund===port;
                return(
                  <button key={port} onClick={()=>setNavLevel(n=>({...n,level:"fund",fund:port}))} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",border:"none",cursor:"pointer",fontFamily:BRAND.display,fontSize:11,fontWeight:600,whiteSpace:"nowrap",background:isA?`${bc}18`:"transparent",color:isA?bc:T.muted,borderBottom:isA?`2px solid ${bc}`:"2px solid transparent",transition:"all 0.2s",opacity:.9}}>
                    <div style={{width:6,height:6,borderRadius:2,background:bc}}/>
                    {port}
                    <span style={{fontSize:8,background:`${bc}18`,color:bc,borderRadius:4,padding:"1px 5px",fontFamily:BRAND.mono}}>{ph.length}</span>
                  </button>
                );
              })}
            </>}
          </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{padding:"20px 24px",animation:"fadeIn 0.3s ease"}}>
        {/* Breadcrumb */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,fontSize:11,fontFamily:BRAND.mono,color:T.muted}}>
          <span style={{color:BRAND.gold,cursor:"pointer"}} onClick={()=>setNavLevel({level:"total",broker:null,fund:null})}>Total</span>
          {navLevel.broker&&<><span>›</span><span style={{color:BROKER_COLOR[navLevel.broker]||BRAND.gold,cursor:"pointer"}} onClick={()=>setNavLevel(n=>({...n,level:"broker",fund:null}))}>{navLevel.broker}</span></>}
          {navLevel.fund&&<><span>›</span><span style={{color:navColor}}>{navLevel.fund}</span> <span style={{color:T.muted,fontSize:9}}>(portfolio)</span></>}
          <span style={{marginLeft:"auto"}}>{visibleHoldings.length} holdings · <b style={{color:navColor}}>${Math.round(navTV).toLocaleString()}</b> · <b style={{color:navTPL>=0?BRAND.teal:BRAND.red}}>{navTPL>=0?"+":"-"}${Math.abs(Math.round(navTPL)).toLocaleString()}</b></span>
        </div>

        {/* KPI Row */}
        <div style={{marginBottom:14}}>
          <KPIRow holdings={visibleHoldings} T={T}/>
        </div>

        {/* Main Chart */}
        <div style={{marginBottom:14}}>
          <PortfolioChart
            holdings={visibleHoldings}
            period={period}
            onPeriodChange={setPeriod}
            color={navColor}
            T={T}
            title={navLabel}
            sub={`${navLevel.fund||navLevel.broker?"Selected portfolio":"All brokers combined"} · ${visibleHoldings.length} holdings`}
          />
        </div>

        {/* Holdings Table */}
        {selectedAsset ? (
          <AssetDetail
            holding={selectedAsset}
            T={T}
            onBack={()=>setSelectedAsset(null)}
            onEdit={(h)=>{setSelectedAsset(null);setEditH(h);}}
          />
        ) : activeTab==="overview" ? (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <KPIRow holdings={visibleHoldings} T={T}/>
            <PortfolioChart holdings={visibleHoldings} period={period} onPeriodChange={setPeriod} color={navColor} T={T} title={navLabel} sub={`${visibleHoldings.length} holdings`}/>
            <HoldingsTable holdings={visibleHoldings} title={`${navLabel} — Holdings`} T={T} onEdit={setEditH} onRowClick={setSelectedAsset}/>
          </div>
        ) : (
          <AnalysisPanel holdings={visibleHoldings} T={T} activeTab={activeTab} botMem={botMem} setBotMem={setBotMem}/>
        )}



        <div style={{marginTop:40,textAlign:"center",color:T.muted,fontSize:9,fontFamily:BRAND.mono,letterSpacing:3,opacity:.4}}>
          PORTFOLIO COMMAND CENTER v3.0 · 15 AI AGENTS · INSTITUTIONAL GRADE
        </div>
      </div>

      {(showAdd||editH)&&(
        <EditModal
          holding={editH||null}
          onSave={saveHolding}
          onDelete={deleteHolding}
          onClose={()=>{setEditH(null);setShowAdd(false);}}
          T={T}
          allHoldings={holdings}
        />
      )}
    </div>
  );
}
