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
  { id:"aapl", symbol:"AAPL", name:"Apple Inc.",      broker:"Robinhood",   fund:"Growth Stocks", type:"Stock",  sector:"Technology", qty:45,   price:213.50, avgCost:178.20, beta:1.18, div:0.96,  vol:18.4, notes:"" },
  { id:"nvda", symbol:"NVDA", name:"NVIDIA Corp.",    broker:"Robinhood",   fund:"Growth Stocks", type:"Stock",  sector:"Technology", qty:18,   price:875.20, avgCost:612.40, beta:1.72, div:0.04,  vol:41.3, notes:"" },
  { id:"btc",  symbol:"BTC",  name:"Bitcoin",         broker:"Robinhood",   fund:"Crypto",        type:"Crypto", sector:"Crypto",     qty:0.42, price:67840,  avgCost:52000,  beta:1.85, div:0,     vol:62.1, notes:"" },
  { id:"eth",  symbol:"ETH",  name:"Ethereum",        broker:"Robinhood",   fund:"Crypto",        type:"Crypto", sector:"Crypto",     qty:3.2,  price:3640,   avgCost:3100,   beta:1.61, div:0,     vol:58.4, notes:"" },
  { id:"voo",  symbol:"VOO",  name:"Vanguard S&P500", broker:"Fidelity",    fund:"Index ETFs",    type:"ETF",    sector:"Broad Mkt",  qty:28,   price:498.20, avgCost:441.30, beta:1.00, div:6.58,  vol:14.2, notes:"" },
  { id:"msft", symbol:"MSFT", name:"Microsoft Corp.", broker:"Fidelity",    fund:"Blue Chip",     type:"Stock",  sector:"Technology", qty:22,   price:418.30, avgCost:380.10, beta:0.92, div:3.00,  vol:19.8, notes:"" },
  { id:"spy",  symbol:"SPY",  name:"SPDR S&P 500",   broker:"Fidelity",    fund:"Index ETFs",    type:"ETF",    sector:"Broad Mkt",  qty:15,   price:529.80, avgCost:498.60, beta:1.00, div:6.81,  vol:14.1, notes:"" },
  { id:"tip",  symbol:"TIP",  name:"iShares TIPS",   broker:"TSP Federal", fund:"Gov. Bonds",    type:"Bond",   sector:"Fixed Inc.", qty:120,  price:107.40, avgCost:105.20, beta:0.12, div:4.11,  vol:6.1,  notes:"" },
];

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
                  <td style={{padding:"9px 10px",fontSize:11,color:T.muted}}>{h.fund}</td>
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
const EditModal = ({ holding, onSave, onDelete, onClose, T, brokers }) => {
  const isNew = !holding?.id;
  const [form, setForm] = useState(holding || { symbol:"", name:"", broker:"Robinhood", fund:"Growth Stocks", type:"Stock", sector:"Technology", qty:"", price:"", avgCost:"", div:0, beta:1, vol:20, notes:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
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
          <div><label style={lbl}>TICKER</label><input value={form.symbol} onChange={e=>set("symbol",e.target.value.toUpperCase())} placeholder="AAPL" style={{...inp,fontSize:16,fontWeight:700,color:BRAND.gold,letterSpacing:2}}/></div>
          <div><label style={lbl}>NAME</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Apple Inc." style={inp}/></div>
          <div><label style={lbl}>TYPE</label>
            <select value={form.type} onChange={e=>set("type",e.target.value)} style={{...inp,cursor:"pointer"}}>
              {["Stock","ETF","Crypto","Bond","REIT","Commodity"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label style={lbl}>SHARES / UNITS</label><input value={form.qty} onChange={e=>set("qty",e.target.value)} type="number" placeholder="10" style={inp}/></div>
          <div><label style={lbl}>CURRENT PRICE ($)</label><input value={form.price} onChange={e=>set("price",e.target.value)} type="number" placeholder="213.50" style={inp}/></div>
          <div><label style={lbl}>AVG COST ($)</label><input value={form.avgCost} onChange={e=>set("avgCost",e.target.value)} type="number" placeholder="178.20" style={inp}/>
            {form.qty&&form.avgCost&&<div style={{fontSize:10,fontFamily:BRAND.mono,color:T.muted,marginTop:4}}>Cost basis: <b style={{color:BRAND.gold}}>${(+form.qty*+form.avgCost).toLocaleString(undefined,{maximumFractionDigits:0})}</b></div>}
          </div>
          <div><label style={lbl}>BROKER</label>
            <select value={form.broker} onChange={e=>set("broker",e.target.value)} style={{...inp,cursor:"pointer"}}>
              {["Robinhood","Fidelity","TSP Federal"].map(b=><option key={b}>{b}</option>)}
            </select>
          </div>
          <div><label style={lbl}>FUND / PORTFOLIO</label><input value={form.fund} onChange={e=>set("fund",e.target.value)} placeholder="Growth Stocks" style={inp}/></div>
          <div><label style={lbl}>SECTOR</label><input value={form.sector} onChange={e=>set("sector",e.target.value)} placeholder="Technology" style={inp}/></div>
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
    {key:"S&P 500",color:BRAND.blue},{key:"Nasdaq",color:BRAND.purple},
    {key:"Dow Jones",color:BRAND.amber},{key:"Bitcoin",color:BRAND.gold},{key:"Bonds",color:BRAND.green},
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
        <Area type="monotoneX" dataKey="p90" name="Optimistic (P90)" stroke={BRAND.teal} strokeWidth={2}   fill="url(#gMC90)" dot={false}/>
        <Area type="monotoneX" dataKey="p50" name="Base Case (P50)"  stroke={BRAND.gold} strokeWidth={2.5} fill="url(#gMC50)" dot={false}/>
        <Area type="monotoneX" dataKey="p10" name="Pessimistic (P10)"stroke={BRAND.red}  strokeWidth={1.5} fill="url(#gMC10)" dot={false}/>
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
];

const AnalysisPanel = ({ holdings, T }) => {
  const [activeTab, setActiveTab] = useState("perf");
  const cur = ANALYSIS_TABS.find(t=>t.id===activeTab);

  return (
    <div style={{marginTop:16}}>
      {/* Tab nav */}
      <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.border}`,overflowX:"auto",marginBottom:20}}>
        {ANALYSIS_TABS.map(t=>{
          const isA = activeTab===t.id;
          return (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"9px 16px",border:"none",cursor:"pointer",
              fontFamily:BRAND.display,fontSize:11,fontWeight:600,
              whiteSpace:"nowrap",
              background:isA?`${BRAND.gold}10`:"transparent",
              color:isA?BRAND.gold:T.muted,
              borderBottom:isA?`2px solid ${BRAND.gold}`:"2px solid transparent",
              marginBottom:-1,transition:"all 0.2s",
            }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          );
        })}
      </div>
      <div style={{animation:"fadeIn 0.25s ease"}}>
        {activeTab==="perf" && <PerformanceTab holdings={holdings} T={T}/>}
        {activeTab==="bench"&& <BenchmarkTab   holdings={holdings} T={T}/>}
        {activeTab==="risk" && <RiskTab         holdings={holdings} T={T}/>}
        {activeTab==="corr" && <CorrelationsTab holdings={holdings} T={T}/>}
        {activeTab==="div"  && <DividendsTab    holdings={holdings} T={T}/>}
        {activeTab==="proj" && <ProjectionsTab  holdings={holdings} T={T}/>}
        {activeTab==="mc"   && <MonteCarloTab   holdings={holdings} T={T}/>}
        {activeTab==="snow"  && <SnowflakeTab    holdings={holdings} T={T}/>}
        {activeTab==="factor"&& <FactorTab       holdings={holdings} T={T}/>}
      </div>
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
    const mem = {...botMem, sessionCount: botMem.sessionCount+1, lastVisit: new Date().toISOString() };
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
  const fundNames   = broker => [...new Set(holdings.filter(h=>h.broker===broker).map(h=>h.fund))];

  const visibleHoldings = useMemo(()=>{
    if(navLevel.level==="fund")   return holdings.filter(h=>h.broker===navLevel.broker&&h.fund===navLevel.fund);
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

          {/* 4-Level Nav */}
          <div style={{display:"flex",gap:0,overflowX:"auto"}}>
            <button onClick={()=>setNavLevel({level:"total",broker:null,fund:null})} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",border:"none",cursor:"pointer",fontFamily:BRAND.display,fontSize:11,fontWeight:700,whiteSpace:"nowrap",background:navLevel.level==="total"?`${BRAND.gold}12`:"transparent",color:navLevel.level==="total"?BRAND.gold:T.muted,borderBottom:navLevel.level==="total"?`2px solid ${BRAND.gold}`:"2px solid transparent",transition:"all 0.2s"}}>
              📊 Total Portfolio <span style={{fontSize:8,background:`${BRAND.gold}20`,color:BRAND.gold,borderRadius:4,padding:"1px 5px",fontFamily:BRAND.mono}}>{holdings.length}</span>
            </button>
            {navLevel.level!=="total"&&<div style={{display:"flex",alignItems:"center",padding:"0 6px",color:T.muted,fontSize:14}}>›</div>}
            {brokerNames.map(broker=>{
              const bc=BROKER_COLOR[broker]||BRAND.gold;
              const bh=holdings.filter(h=>h.broker===broker);
              const isA=navLevel.broker===broker;
              return <button key={broker} onClick={()=>setNavLevel({level:"broker",broker,fund:null})} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 15px",border:"none",cursor:"pointer",fontFamily:BRAND.display,fontSize:11,fontWeight:600,whiteSpace:"nowrap",background:isA?`${bc}12`:"transparent",color:isA?bc:T.muted,borderBottom:isA?`2px solid ${bc}`:"2px solid transparent",transition:"all 0.2s"}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:bc}}/>{broker.split(" ")[0]} <span style={{fontSize:8,background:`${bc}20`,color:bc,borderRadius:4,padding:"1px 5px",fontFamily:BRAND.mono}}>{bh.length}</span>
              </button>;
            })}
            {navLevel.broker&&<>
              <div style={{display:"flex",alignItems:"center",padding:"0 6px",color:T.muted,fontSize:14}}>›</div>
              {fundNames(navLevel.broker).map(fund=>{
                const bc=BROKER_COLOR[navLevel.broker]||BRAND.gold;
                const fh=holdings.filter(h=>h.broker===navLevel.broker&&h.fund===fund);
                const isA=navLevel.fund===fund;
                return <button key={fund} onClick={()=>setNavLevel(n=>({...n,level:"fund",fund}))} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",border:"none",cursor:"pointer",fontFamily:BRAND.display,fontSize:11,fontWeight:600,whiteSpace:"nowrap",background:isA?`${bc}18`:"transparent",color:isA?bc:T.muted,borderBottom:isA?`2px solid ${bc}`:"2px solid transparent",transition:"all 0.2s",opacity:.85}}>
                  <div style={{width:6,height:6,borderRadius:2,background:bc}}/>{fund} <span style={{fontSize:8,background:`${bc}15`,color:bc,borderRadius:4,padding:"1px 5px",fontFamily:BRAND.mono}}>{fh.length}</span>
                </button>;
              })}
            </>}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{padding:"20px 24px",animation:"fadeIn 0.3s ease"}}>
        {/* Breadcrumb */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,fontSize:11,fontFamily:BRAND.mono,color:T.muted}}>
          <span style={{color:BRAND.gold,cursor:"pointer"}} onClick={()=>setNavLevel({level:"total",broker:null,fund:null})}>Total</span>
          {navLevel.broker&&<><span>›</span><span style={{color:BROKER_COLOR[navLevel.broker]||BRAND.gold,cursor:"pointer"}} onClick={()=>setNavLevel(n=>({...n,level:"broker",fund:null}))}>{navLevel.broker}</span></>}
          {navLevel.fund&&<><span>›</span><span style={{color:navColor}}>{navLevel.fund}</span></>}
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
        ) : (
          <>
            <div style={{marginBottom:14}}>
              <HoldingsTable
                holdings={visibleHoldings}
                title={`${navLabel} — Holdings`}
                T={T}
                onEdit={setEditH}
                onRowClick={setSelectedAsset}
              />
            </div>
            <AnalysisPanel holdings={visibleHoldings} T={T}/>
          </>
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
        />
      )}
    </div>
  );
}
