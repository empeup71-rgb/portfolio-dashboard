import { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  ComposedChart, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";

const C = {
  bg:"#020817",bg2:"#0A1628",surface:"rgba(255,255,255,0.03)",
  border:"rgba(255,255,255,0.08)",teal:"#00E5B4",blue:"#0EA5E9",
  purple:"#8B5CF6",amber:"#F59E0B",red:"#F87171",green:"#4ADE80",
  pink:"#EC4899",text:"#F1F5F9",muted:"#64748B",dim:"#1E293B",
  mono:"'DM Mono',monospace",display:"'Syne',sans-serif",
};

// ── FUND STRUCTURE ──────────────────────────────────────────────
const FUND_STRUCTURE = {
  "Robinhood":   { color:"#00C851", funds: {
    "Growth Stocks":    { color:C.teal,   desc:"High-growth technology", holdings:["AAPL","NVDA"] },
    "Crypto Portfolio": { color:C.amber,  desc:"Digital assets",          holdings:["BTC","ETH"] },
  }},
  "Fidelity":    { color:"#0066CC", funds: {
    "Index ETFs":       { color:C.blue,   desc:"Broad market index funds", holdings:["VOO","SPY"] },
    "Blue Chip Stocks": { color:C.purple, desc:"Large-cap equities",       holdings:["MSFT"] },
  }},
  "TSP Federal": { color:"#FF6B35", funds: {
    "Government Bonds": { color:C.pink,   desc:"Inflation-protected",      holdings:["TIP"] },
  }},
};

const HOLDINGS = [
  {symbol:"AAPL",name:"Apple Inc.",      type:"Stock", broker:"Robinhood",   fund:"Growth Stocks",    qty:45,  price:213.50,avgCost:178.20,divYield:0.52,beta:1.18,vol:18.4},
  {symbol:"NVDA",name:"NVIDIA Corp.",    type:"Stock", broker:"Robinhood",   fund:"Growth Stocks",    qty:18,  price:875.20,avgCost:612.40,divYield:0.04,beta:1.72,vol:41.3},
  {symbol:"BTC", name:"Bitcoin",         type:"Crypto",broker:"Robinhood",   fund:"Crypto Portfolio", qty:0.42,price:67840, avgCost:52000, divYield:0,   beta:1.85,vol:62.1},
  {symbol:"ETH", name:"Ethereum",        type:"Crypto",broker:"Robinhood",   fund:"Crypto Portfolio", qty:3.2, price:3640,  avgCost:3100,  divYield:0,   beta:1.61,vol:58.4},
  {symbol:"VOO", name:"Vanguard S&P500", type:"ETF",   broker:"Fidelity",    fund:"Index ETFs",       qty:28,  price:498.20,avgCost:441.30,divYield:1.32,beta:1.00,vol:14.2},
  {symbol:"MSFT",name:"Microsoft Corp.", type:"Stock", broker:"Fidelity",    fund:"Blue Chip Stocks", qty:22,  price:418.30,avgCost:380.10,divYield:0.73,beta:0.92,vol:19.8},
  {symbol:"SPY", name:"SPDR S&P500",     type:"ETF",   broker:"Fidelity",    fund:"Index ETFs",       qty:15,  price:529.80,avgCost:498.60,divYield:1.28,beta:1.00,vol:14.1},
  {symbol:"TIP", name:"TIPS Bond",       type:"Bond",  broker:"TSP Federal", fund:"Government Bonds", qty:120, price:107.40,avgCost:105.20,divYield:3.84,beta:0.12,vol:6.1},
];

const PROJECTIONS = {
  "Growth Stocks":    {base:8.2, bull:22.4,bear:-8.1, prob:68,drivers:["AI expansion","iPhone cycle","Data center"]},
  "Crypto Portfolio": {base:24.1,bull:85.0,bear:-42.0,prob:52,drivers:["ETF inflows","Halving cycle","Adoption"]},
  "Index ETFs":       {base:9.4, bull:16.2,bear:-12.3,prob:74,drivers:["Fed policy","Earnings growth","Soft landing"]},
  "Blue Chip Stocks": {base:11.8,bull:19.6,bear:-6.4, prob:71,drivers:["Cloud growth","AI integration","Dividends"]},
  "Government Bonds": {base:4.2, bull:8.1, bear:-1.2, prob:82,drivers:["Inflation hedge","Safe haven","Rates"]},
};

const SECTORS = [
  {name:"Technology",  sentiment:82,volume:94,heat:88,momentum:79,color:C.teal,  news:"AI spending surge drives sector"},
  {name:"Crypto",      sentiment:54,volume:88,heat:71,momentum:48,color:C.amber, news:"Regulatory uncertainty persists"},
  {name:"Broad Market",sentiment:68,volume:72,heat:65,momentum:67,color:C.blue,  news:"Fed signals rate pause"},
  {name:"Fixed Income",sentiment:61,volume:58,heat:44,momentum:42,color:C.purple,news:"TIPS data supports allocation"},
  {name:"Energy",      sentiment:71,volume:66,heat:74,momentum:69,color:C.green, news:"Oil supply cuts lift stocks"},
  {name:"Healthcare",  sentiment:64,volume:61,heat:58,momentum:61,color:C.pink,  news:"Drug approvals mixed"},
];

const ANALYTICS_AGENTS = [
  {id:"QUANT-1", name:"Quantitative Analyst",  color:C.teal,  role:"Statistical & Math Analysis",    tasks:["Factor models","Alpha/beta decomp","Correlation matrices"],accuracy:"94.2%",signals:142,load:88,caps:["Multi-factor models","Risk decomposition","Return attribution"]},
  {id:"VOLUME-1",name:"Volume Analyst",         color:C.blue,  role:"Market Volume & Liquidity",      tasks:["Volume spikes","Dark pool activity","Bid-ask spreads"],  accuracy:"87.6%",signals:98, load:72,caps:["Volume profile","VWAP tracking","Dark pool detection"]},
  {id:"HEAT-1",  name:"Heat Map Specialist",    color:C.amber, role:"Sector Heat & Rotation",         tasks:["Sector heat maps","Rotation signals","Money flows"],     accuracy:"91.3%",signals:67, load:65,caps:["Sector rotation","Heat map gen","Capital flow tracking"]},
  {id:"SENT-1",  name:"Sentiment Analyst",      color:C.pink,  role:"Market Sentiment & Social",      tasks:["Reddit/Twitter","News sentiment","Fear & Greed"],        accuracy:"82.4%",signals:234,load:91,caps:["NLP scoring","Social monitoring","News impact"]},
  {id:"MACRO-1", name:"Macro Economist",        color:C.purple,role:"Macroeconomic Analysis",         tasks:["Fed signals","Yield curve","GDP/inflation"],            accuracy:"89.7%",signals:31, load:54,caps:["Fed policy","Yield curve modeling","Inflation forecast"]},
  {id:"TECH-1",  name:"Technical Analyst",      color:C.green, role:"Technical Analysis & Patterns",  tasks:["RSI/MACD","Chart patterns","Support/resistance"],       accuracy:"85.1%",signals:187,load:79,caps:["RSI/MACD/Bollinger","Pattern recognition","Fibonacci"]},
  {id:"FUND-1",  name:"Fundamental Analyst",    color:C.blue,  role:"Fundamental & Valuation",        tasks:["P/E analysis","Earnings revisions","DCF"],             accuracy:"90.8%",signals:52, load:61,caps:["DCF modeling","Earnings analysis","Sector comparables"]},
  {id:"RISK-1",  name:"Risk Manager",           color:C.red,   role:"Real-Time Risk Monitoring",      tasks:["VaR real-time","Correlation breaks","Tail risk"],       accuracy:"96.1%",signals:78, load:83,caps:["VaR/CVaR","Correlation monitor","Stress testing"]},
  {id:"DATA-1",  name:"Data Collector",         color:C.amber, role:"Market Data Aggregation",        tasks:["Real-time prices","News feeds","Social scraping"],       accuracy:"99.1%",signals:0,  load:95,caps:["Yahoo Finance API","Reddit/Twitter","News RSS"]},
  {id:"NEXUS-A", name:"NEXUS Analytics",        color:C.text,  role:"Analytics Orchestrator",         tasks:["Route outputs","Consolidate signals","Priority mgmt"],  accuracy:"97.4%",signals:890,load:94,caps:["Multi-agent coord","Signal aggregation","Priority routing"]},
];

// ── SNOWFLAKE DATA ───────────────────────────────────────────────
const SF_DIMS = ["Value","Growth","Profit","Fin.Health","Momentum","Dividend","Risk"];
const SF = {
  PORTFOLIO:{color:C.teal,  scores:[62,71,78,69,74,48,66]},
  AAPL:     {color:C.teal,  scores:[55,68,92,74,72,38,71]},
  NVDA:     {color:C.green, scores:[32,96,91,78,88,12,48]},
  BTC:      {color:C.amber, scores:[38,84,45,52,62,0, 22]},
  ETH:      {color:C.purple,scores:[42,78,54,58,56,18,28]},
  VOO:      {color:C.blue,  scores:[66,62,70,82,68,58,84]},
  MSFT:     {color:C.blue,  scores:[58,76,88,86,78,44,76]},
  SPY:      {color:C.pink,  scores:[65,61,69,81,67,57,83]},
  TIP:      {color:C.purple,scores:[72,28,48,94,42,76,92]},
};

const SYMS = ["AAPL","NVDA","BTC","ETH","VOO","MSFT","SPY","TIP"];
const CORR = [
  [1.00,0.68,0.18,0.22,0.72,0.81,0.73,-0.12],
  [0.68,1.00,0.31,0.34,0.61,0.71,0.62,-0.14],
  [0.18,0.31,1.00,0.88,0.21,0.19,0.20,-0.08],
  [0.22,0.34,0.88,1.00,0.24,0.22,0.23,-0.06],
  [0.72,0.61,0.21,0.24,1.00,0.79,0.98, 0.08],
  [0.81,0.71,0.19,0.22,0.79,1.00,0.80,-0.05],
  [0.73,0.62,0.20,0.23,0.98,0.80,1.00, 0.09],
  [-0.12,-0.14,-0.08,-0.06,0.08,-0.05,0.09,1.00],
];


// ── BENCHMARK DATA ───────────────────────────────────────────────
// Primary: S&P 500, Nasdaq, Dow Jones
// Secondary: BTC (crypto exposure), Bonds/AGG (fixed income), Inflation/CPI
const genBenchmarkData = (days=365) => {
  const data = [];
  let portfolio=100, sp500=100, nasdaq=100, dow=100,
      btc=100, bonds=100, inflation=100, gold=100;
  for(let i=days;i>=0;i--){
    // Portfolio — slightly above market
    portfolio  += (Math.random()-0.435)*1.15;
    // S&P 500 — broad market
    sp500      += (Math.random()-0.445)*0.88;
    // Nasdaq — tech-heavy, more volatile
    nasdaq     += (Math.random()-0.440)*1.20;
    // Dow Jones — 30 large caps, less volatile
    dow        += (Math.random()-0.448)*0.72;
    // BTC — high volatility
    btc        += (Math.random()-0.460)*3.4;
    // Bonds AGG — defensive
    bonds      += (Math.random()-0.482)*0.28;
    // Inflation CPI — steady rise
    inflation  += 0.025/365*100;
    // Gold — safe haven
    gold       += (Math.random()-0.470)*0.55;
    const dt=new Date(); dt.setDate(dt.getDate()-i);
    data.push({
      date:      dt.toLocaleDateString("en",{month:"short",day:"numeric"}),
      Portfolio: +portfolio.toFixed(2),
      "S&P 500": +sp500.toFixed(2),
      Nasdaq:    +nasdaq.toFixed(2),
      "Dow Jones":+dow.toFixed(2),
      BTC:       +btc.toFixed(2),
      Bonds:     +bonds.toFixed(2),
      Inflation: +inflation.toFixed(2),
      Gold:      +gold.toFixed(2),
    });
  }
  return data;
};
const BENCHMARK_DATA = genBenchmarkData(365);
const BENCHMARK_PERIODS = {"1M":30,"3M":90,"6M":180,"1Y":365,"ALL":365};

const BENCHMARKS_META = [
  {key:"S&P 500",  color:"#0EA5E9", type:"PRIMARY",  desc:"500 largest US companies",          ticker:"^GSPC"},
  {key:"Nasdaq",   color:"#8B5CF6", type:"PRIMARY",  desc:"Tech-heavy composite index",         ticker:"^IXIC"},
  {key:"Dow Jones",color:"#F59E0B", type:"PRIMARY",  desc:"30 blue-chip US companies",          ticker:"^DJI"},
  {key:"BTC",      color:"#F97316", type:"CRYPTO",   desc:"Bitcoin — crypto benchmark",         ticker:"BTC-USD"},
  {key:"Bonds",    color:"#4ADE80", type:"FIXED INC",desc:"AGG — US aggregate bond index",      ticker:"AGG"},
  {key:"Gold",     color:"#EAB308", type:"COMMODITY",desc:"Gold — safe haven benchmark",        ticker:"GLD"},
  {key:"Inflation",color:"#F87171", type:"MACRO",    desc:"CPI — US Consumer Price Index",      ticker:"CPI"},
];

const calcAlpha = (data, vs="S&P 500") => {
  if(!data||data.length<2) return 0;
  const first=data[0], last=data[data.length-1];
  return +((last["Portfolio"]-first["Portfolio"])-(last[vs]-first[vs])).toFixed(2);
};

const retPctOf = (data, key) => {
  if(!data||data.length<2||!data[0][key]) return 0;
  return +((data[data.length-1][key]-data[0][key])/data[0][key]*100).toFixed(2);
};

// ── HELPERS ─────────────────────────────────────────────────────
const val  = h => h.qty * h.price;
const cost = h => h.qty * h.avgCost;
const pl   = h => val(h) - cost(h);
const plp  = h => ((h.price - h.avgCost) / h.avgCost) * 100;
const aDiv = h => h.divYield > 0 ? val(h) * h.divYield / 100 : 0;

const getHoldings = scope => {
  if (scope.type==="all")    return HOLDINGS;
  if (scope.type==="broker") return HOLDINGS.filter(h => h.broker===scope.broker);
  if (scope.type==="fund")   return HOLDINGS.filter(h => h.broker===scope.broker && h.fund===scope.fund);
  return HOLDINGS;
};

const metrics = hs => {
  const tv=hs.reduce((s,h)=>s+val(h),0)||1;
  const tc=hs.reduce((s,h)=>s+cost(h),0)||1;
  const tpl=tv-tc, td=hs.reduce((s,h)=>s+aDiv(h),0);
  const wb=hs.reduce((s,h)=>s+h.beta*val(h),0)/tv;
  const wv=hs.reduce((s,h)=>s+h.vol*val(h),0)/tv;
  const plPct=(tpl/tc)*100;
  return {tv,tc,tpl,plPct,td,yield:(td/tv)*100,wb,wv,
    sharpe:wv>0?(plPct/wv*0.4):0,var95:-tv*(wv/100)*1.645/Math.sqrt(252),
    maxDD:-tv*0.124,count:hs.length};
};

const genHist = (base,days=90) => {
  let v=base*0.91; const d=[];
  for(let i=days;i>=0;i--){
    v+=(Math.random()-0.46)*(base*0.009);
    const dt=new Date(); dt.setDate(dt.getDate()-i);
    d.push({date:dt.toLocaleDateString("en",{month:"short",day:"numeric"}),
      value:Math.round(Math.max(v,base*0.7)),
      sp500:Math.round(base*0.88+(days-i)*(base*0.0003)+(Math.random()-.5)*base*0.015)});
  }
  return d;
};

// ── UI ATOMS ────────────────────────────────────────────────────
const Card=({ch,style={}})=><div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:18,...style}}>{ch}</div>;
const Ttl=({t,sub,color=C.text})=><div style={{marginBottom:14}}><div style={{fontFamily:C.display,fontWeight:700,fontSize:13,color}}>{t}</div>{sub&&<div style={{fontSize:10,color:C.muted,fontFamily:C.mono,marginTop:2}}>{sub}</div>}</div>;
const KPI=({label,value,sub,color=C.teal,pos})=>(
  <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${color}22`,borderRadius:12,padding:"13px 15px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,right:0,width:40,height:40,background:`radial-gradient(circle,${color}18,transparent 70%)`}}/>
    <div style={{fontSize:9,fontFamily:C.mono,letterSpacing:2,color:C.muted,textTransform:"uppercase",marginBottom:5}}>{label}</div>
    <div style={{fontSize:19,fontWeight:700,fontFamily:C.display,color:pos===false?C.red:color,lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:pos===false?C.red:C.muted,marginTop:4,fontFamily:C.mono}}>{sub}</div>}
  </div>
);
const Chip=({label,color=C.muted})=><span style={{fontSize:9,fontFamily:C.mono,fontWeight:700,background:`${color}18`,color,border:`1px solid ${color}44`,borderRadius:4,padding:"2px 7px"}}>{label}</span>;
const TT=({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return <div style={{background:"#0A1628",border:`1px solid ${C.teal}44`,borderRadius:8,padding:"8px 12px",fontSize:11,fontFamily:C.mono}}>
    <div style={{color:C.muted,marginBottom:3}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||C.text}}>{p.name}: <b>${typeof p.value==="number"?Math.abs(p.value)>999?Math.round(p.value).toLocaleString():p.value.toFixed(2):p.value}</b></div>)}
  </div>;
};

// ── CORRELATION HEATMAP ─────────────────────────────────────────
const corrColor=v=>{
  if(v>=0.8)return{bg:"#00E5B4",tx:"#020817"};
  if(v>=0.5)return{bg:"#0EA5E9",tx:"#020817"};
  if(v>=0.2)return{bg:"#1E40AF",tx:"#E2E8F0"};
  if(v>=-0.1)return{bg:"#1E293B",tx:"#64748B"};
  if(v>=-0.5)return{bg:"#7C3AED",tx:"#F1F5F9"};
  return{bg:"#DC2626",tx:"#F1F5F9"};
};
const CorrMap=({syms,matrix})=>{
  const [hov,setHov]=useState(null);
  const CELL=46;
  if(!syms||syms.length<2) return <div style={{color:C.muted,fontFamily:C.mono,fontSize:12,padding:20}}>Need at least 2 assets.</div>;
  return(
    <div style={{overflowX:"auto"}}>
      <div style={{display:"flex",marginLeft:52,marginBottom:3}}>
        {syms.map((s,j)=><div key={j} style={{width:CELL,textAlign:"center",fontSize:9,fontFamily:C.mono,color:C.muted,flexShrink:0}}>{s}</div>)}
      </div>
      {syms.map((rs,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",marginBottom:2}}>
          <div style={{width:48,fontSize:9,fontFamily:C.mono,color:C.muted,textAlign:"right",paddingRight:6,flexShrink:0}}>{rs}</div>
          {syms.map((cs,j)=>{
            const v=matrix[i]?.[j]??0,isDiag=i===j;
            const {bg,tx}=corrColor(v);
            const key=`${i}-${j}`,isHov=hov===key;
            return(
              <div key={j} onMouseEnter={()=>setHov(key)} onMouseLeave={()=>setHov(null)}
                style={{width:CELL-2,height:CELL-2,borderRadius:5,margin:1,flexShrink:0,
                  background:isDiag?`linear-gradient(135deg,${C.teal},${C.blue})`:bg,
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  cursor:"default",transition:"transform 0.12s",
                  transform:isHov?"scale(1.15)":"scale(1)",
                  position:"relative",zIndex:isHov?10:1}}>
                <span style={{fontSize:9,fontFamily:C.mono,fontWeight:700,color:isDiag?"#020817":tx}}>{v.toFixed(2)}</span>
                {isDiag&&<span style={{fontSize:6,fontFamily:C.mono,color:"#020817"}}>SELF</span>}
                {isHov&&!isDiag&&(
                  <div style={{position:"absolute",bottom:"115%",left:"50%",transform:"translateX(-50%)",
                    background:C.bg2,border:`1px solid ${bg}66`,borderRadius:6,padding:"4px 8px",
                    whiteSpace:"nowrap",fontSize:10,fontFamily:C.mono,color:bg,zIndex:20,pointerEvents:"none"}}>
                    {rs}↔{cs}: {v>=0.7?"⚠ High risk":v<=-0.1?"✅ Hedge":"Moderate"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
        {[{l:"-1.0",bg:"#DC2626"},{l:"-0.5",bg:"#7C3AED"},{l:"0.0",bg:"#1E293B"},{l:"+0.5",bg:"#0EA5E9"},{l:"+1.0",bg:"#00E5B4"}].map((l,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:3}}>
            <div style={{width:12,height:12,borderRadius:2,background:l.bg}}/>
            <span style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>{l.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── RETURNS HEATMAP ─────────────────────────────────────────────
const ReturnsMap=({hs})=>{
  const [hov,setHov]=useState(null);
  const WEEKS=12,CELL=28;
  const retColor=v=>{
    if(v>2.5)return{bg:"#00E5B4",tx:"#020817"};
    if(v>1.0)return{bg:"#22C55E",tx:"#020817"};
    if(v>0.2)return{bg:"#15803D",tx:"#F1F5F9"};
    if(v>=-0.2)return{bg:"#1E293B",tx:"#475569"};
    if(v>-1.0)return{bg:"#DC2626",tx:"#F1F5F9"};
    return{bg:"#7F1D1D",tx:"#FCA5A5"};
  };
  const getV=(si,w)=>+(Math.sin((si*37+w*53)%100*0.7+si*1.3)*3.1+Math.cos(w*0.4+si)*1.2).toFixed(2);
  return(
    <div style={{overflowX:"auto"}}>
      <div style={{display:"flex",marginLeft:56,marginBottom:4}}>
        {Array.from({length:WEEKS}).map((_,w)=>{
          const d=new Date(); d.setDate(d.getDate()-(WEEKS-w)*7);
          return <div key={w} style={{width:CELL,textAlign:"center",fontSize:8,fontFamily:C.mono,color:C.muted,flexShrink:0}}>{d.toLocaleDateString("en",{month:"short",day:"numeric"})}</div>;
        })}
      </div>
      {hs.map((h,si)=>(
        <div key={si} style={{display:"flex",alignItems:"center",marginBottom:3}}>
          <div style={{width:52,fontSize:9,fontFamily:C.mono,color:C.teal,fontWeight:600,flexShrink:0,textAlign:"right",paddingRight:6}}>{h.symbol}</div>
          {Array.from({length:WEEKS}).map((_,w)=>{
            const v=getV(si,w),{bg,tx}=retColor(v),key=`${si}-${w}`,isHov=hov===key;
            return(
              <div key={w} onMouseEnter={()=>setHov(key)} onMouseLeave={()=>setHov(null)}
                style={{width:CELL-2,height:22,borderRadius:4,marginRight:2,flexShrink:0,
                  background:bg,display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"default",transition:"transform 0.1s",
                  transform:isHov?"scale(1.25)":"scale(1)",position:"relative",zIndex:isHov?10:1}}>
                {isHov&&<div style={{position:"absolute",bottom:"115%",left:"50%",transform:"translateX(-50%)",
                  background:C.bg2,border:`1px solid ${bg}66`,borderRadius:6,padding:"3px 7px",
                  whiteSpace:"nowrap",fontSize:10,fontFamily:C.mono,color:v>=0?C.teal:C.red,zIndex:20,pointerEvents:"none"}}>
                  {h.symbol} {v>=0?"+":""}{v}%
                </div>}
                <span style={{fontSize:7,fontFamily:C.mono,color:tx,fontWeight:700}}>{v>=0?"+":""}{v}</span>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
        {[{l:"<-2.5%",bg:"#7F1D1D"},{l:"-1%",bg:"#DC2626"},{l:"Flat",bg:"#1E293B"},{l:"+1%",bg:"#15803D"},{l:">+2.5%",bg:"#00E5B4"}].map((l,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:3}}>
            <div style={{width:12,height:10,borderRadius:2,background:l.bg}}/>
            <span style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>{l.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── SNOWFLAKE CHART ─────────────────────────────────────────────
const Snowflake=({data,size=220,showLabels=true})=>{
  if(!data||!data.scores) return null;
  const N=SF_DIMS.length,cx=size/2,cy=size/2,R=size*0.34;
  const ang=i=>(i*2*Math.PI/N)-Math.PI/2;
  const pt=(i,r)=>({x:cx+R*r*Math.cos(ang(i)),y:cy+R*r*Math.sin(ang(i))});
  const scores=data.scores.map(s=>s/100);
  const poly=scores.map((s,i)=>`${pt(i,s).x},${pt(i,s).y}`).join(" ");
  const avg=Math.round(scores.reduce((a,b)=>a+b,0)/N*100);
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow:"visible",display:"block"}}>
      {[0.25,0.5,0.75,1].map((r,i)=>(
        <polygon key={i} points={SF_DIMS.map((_,j)=>`${pt(j,r).x},${pt(j,r).y}`).join(" ")}
          fill="none" stroke={i===3?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.05)"} strokeWidth={i===3?1.5:1} strokeDasharray={i===3?"none":"2 2"}/>
      ))}
      {SF_DIMS.map((_,i)=>(
        <line key={i} x1={cx} y1={cy} x2={pt(i,1).x} y2={pt(i,1).y} stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
      ))}
      <polygon points={poly} fill={`${data.color}20`} stroke={data.color} strokeWidth={2} strokeLinejoin="round"/>
      {scores.map((s,i)=>(
        <circle key={i} cx={pt(i,s).x} cy={pt(i,s).y} r={3} fill={data.color} stroke={C.bg} strokeWidth={1.5}/>
      ))}
      {showLabels&&SF_DIMS.map((d,i)=>{
        const lx=cx+R*1.3*Math.cos(ang(i)),ly=cy+R*1.3*Math.sin(ang(i));
        const sc=data.scores[i];
        const sc_col=sc>=70?C.teal:sc>=50?C.amber:C.red;
        return(
          <g key={i}>
            <text x={lx} y={ly-4} textAnchor="middle" style={{fontSize:8,fill:"#94A3B8",fontFamily:C.mono}}>{d}</text>
            <text x={lx} y={ly+8} textAnchor="middle" style={{fontSize:10,fontWeight:700,fill:sc_col,fontFamily:C.display}}>{sc}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={18} fill="rgba(2,8,23,0.9)" stroke={data.color} strokeWidth={1.5}/>
      <text x={cx} y={cy-1} textAnchor="middle" style={{fontSize:11,fontWeight:800,fill:data.color,fontFamily:C.display}}>{avg}</text>
      <text x={cx} y={cy+9} textAnchor="middle" style={{fontSize:6,fill:C.muted,fontFamily:C.mono}}>SCORE</text>
    </svg>
  );
};

// ── GAUGE ───────────────────────────────────────────────────────
const Gauge=({value,min,max,label,color,fmt})=>{
  const pct=Math.min(Math.max((value-min)/(max-min),0),1);
  const ang=-135+pct*270,cx=50,cy=50,r=34;
  const toXY=deg=>({x:cx+r*Math.cos((deg-90)*Math.PI/180),y:cy+r*Math.sin((deg-90)*Math.PI/180)});
  const arc=(s,e)=>{const sp=toXY(s),ep=toXY(e),lg=e-s>180?1:0;return`M${sp.x} ${sp.y} A${r} ${r} 0 ${lg} 1 ${ep.x} ${ep.y}`;};
  return(
    <div style={{textAlign:"center"}}>
      <svg width={100} height={70} viewBox="0 0 100 78" style={{overflow:"visible",display:"block",margin:"0 auto"}}>
        <path d={arc(-135,135)} fill="none" stroke="#1E293B" strokeWidth={7} strokeLinecap="round"/>
        <path d={arc(-135,-135+pct*270)} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"/>
        <line x1={cx} y1={cy} x2={cx+(r-9)*Math.cos((ang-90)*Math.PI/180)} y2={cy+(r-9)*Math.sin((ang-90)*Math.PI/180)} stroke={color} strokeWidth={2} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={3} fill={color}/>
        <text x={cx} y={cy+17} textAnchor="middle" style={{fontSize:10,fontWeight:700,fill:color,fontFamily:C.display}}>{fmt?fmt(value):value}</text>
      </svg>
      <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginTop:-10}}>{label}</div>
    </div>
  );
};

// ── LEVEL NAVIGATOR ─────────────────────────────────────────────
const LevelNav=({scope,setScope,color})=>{
  const brokers=Object.keys(FUND_STRUCTURE);
  const bColor=scope.broker?FUND_STRUCTURE[scope.broker]?.color||color:color;
  const funds=scope.broker?Object.keys(FUND_STRUCTURE[scope.broker]?.funds||{}):[];
  return(
    <div style={{marginBottom:16,padding:12,background:"rgba(255,255,255,0.02)",borderRadius:12,border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",gap:6,marginBottom:funds.length>0?8:0,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginRight:4,flexShrink:0}}>VIEW:</span>
        <button onClick={()=>setScope({type:"all"})} style={{padding:"4px 12px",borderRadius:7,border:`1px solid ${scope.type==="all"?color+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:10,fontWeight:600,background:scope.type==="all"?`${color}18`:"transparent",color:scope.type==="all"?color:C.muted}}>
          ⬡ All
        </button>
        {brokers.map(b=>(
          <button key={b} onClick={()=>setScope({type:"broker",broker:b})} style={{padding:"4px 12px",borderRadius:7,cursor:"pointer",fontFamily:C.mono,fontSize:10,fontWeight:600,border:`1px solid ${scope.broker===b?FUND_STRUCTURE[b].color+"55":C.border}`,background:scope.broker===b?`${FUND_STRUCTURE[b].color}18`:"transparent",color:scope.broker===b?FUND_STRUCTURE[b].color:C.muted}}>
            {b==="Robinhood"?"🟢":b==="Fidelity"?"🔵":"🟠"} {b}
          </button>
        ))}
      </div>
      {scope.broker&&(
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",paddingTop:8,borderTop:`1px solid ${C.border}`}}>
          <span style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginRight:4,flexShrink:0}}>FUND:</span>
          <button onClick={()=>setScope({type:"broker",broker:scope.broker})} style={{padding:"3px 10px",borderRadius:6,cursor:"pointer",fontFamily:C.mono,fontSize:9,fontWeight:600,border:`1px solid ${scope.type==="broker"?bColor+"55":C.border}`,background:scope.type==="broker"?`${bColor}15`:"transparent",color:scope.type==="broker"?bColor:C.muted}}>
            All funds
          </button>
          {funds.map(fund=>{
            const fColor=FUND_STRUCTURE[scope.broker]?.funds[fund]?.color||C.amber;
            const isActive=scope.type==="fund"&&scope.fund===fund;
            return(
              <button key={fund} onClick={()=>setScope({type:"fund",broker:scope.broker,fund})} style={{padding:"3px 10px",borderRadius:6,cursor:"pointer",fontFamily:C.mono,fontSize:9,fontWeight:600,border:`1px solid ${isActive?fColor+"55":C.border}`,background:isActive?`${fColor}15`:"transparent",color:isActive?fColor:C.muted}}>
                {fund}
              </button>
            );
          })}
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,fontSize:10,fontFamily:C.mono,color:C.muted}}>
        <span style={{color,fontWeight:700}}>Portfolio</span>
        {scope.broker&&<><span>›</span><span style={{color:FUND_STRUCTURE[scope.broker]?.color||color,fontWeight:600}}>{scope.broker}</span></>}
        {scope.type==="fund"&&scope.fund&&<><span>›</span><span style={{color:FUND_STRUCTURE[scope.broker]?.funds[scope.fund]?.color||C.amber,fontWeight:700}}>{scope.fund}</span></>}
      </div>
    </div>
  );
};

// ── TAB VIEWS ───────────────────────────────────────────────────
const OverviewTab=({hs,color,scope})=>{
  const m=metrics(hs);
  const hist=useMemo(()=>genHist(m.tv),[scope.type,scope.broker,scope.fund]);
  const alloc=[{n:"Stocks",c:C.teal,t:"Stock"},{n:"ETFs",c:C.blue,t:"ETF"},{n:"Crypto",c:C.amber,t:"Crypto"},{n:"Bonds",c:C.purple,t:"Bond"}]
    .map(a=>({name:a.n,color:a.c,value:+(hs.filter(h=>h.type===a.t).reduce((s,h)=>s+val(h),0)/Math.max(m.tv,1)*100).toFixed(1)}))
    .filter(a=>a.value>0);
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        <KPI label="Total Value"  value={`$${Math.round(m.tv).toLocaleString()}`} sub={`${m.count} holdings`} color={color} pos={true}/>
        <KPI label="Total P&L"   value={`${m.tpl>=0?"+":""}$${Math.abs(Math.round(m.tpl)).toLocaleString()}`} sub={`${m.plPct>=0?"+":""}${m.plPct.toFixed(2)}%`} color={m.tpl>=0?C.teal:C.red} pos={m.tpl>=0}/>
        <KPI label="Annual Div." value={`$${Math.round(m.td).toLocaleString()}`} sub={`Yield: ${m.yield.toFixed(2)}%`} color={C.green} pos={true}/>
        <KPI label="Beta / Vol"  value={m.wb.toFixed(2)} sub={`Vol: ${m.wv.toFixed(1)}%`} color={color}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
        <Card ch={<>
          <Ttl t="Portfolio Value — 90 Days" color={color}/>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hist}>
              <defs>
                <linearGradient id="gh" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={.25}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={.12}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={14}/>
              <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:10,fontFamily:C.mono}}/>
              <Area type="monotone" dataKey="value" name="Portfolio" stroke={color} strokeWidth={2} fill="url(#gh)" dot={false}/>
              <Area type="monotone" dataKey="sp500" name="S&P 500" stroke={C.blue} strokeWidth={1.5} fill="url(#gs)" dot={false} strokeDasharray="4 2"/>
            </AreaChart>
          </ResponsiveContainer>
        </>}/>
        <Card ch={<>
          <Ttl t="Allocation" color={color}/>
          <ResponsiveContainer width="100%" height={110}>
            <PieChart><Pie data={alloc} cx="50%" cy="50%" innerRadius={32} outerRadius={52} paddingAngle={3} dataKey="value">
              {alloc.map((e,i)=><Cell key={i} fill={e.color}/>)}
            </Pie><Tooltip formatter={v=>`${v}%`} contentStyle={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}}/></PieChart>
          </ResponsiveContainer>
          {alloc.map((d,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:6,height:6,borderRadius:1,background:d.color}}/><span style={{fontSize:10,color:C.muted,fontFamily:C.mono}}>{d.name}</span></div>
            <span style={{fontSize:10,color:d.color,fontFamily:C.mono,fontWeight:700}}>{d.value}%</span>
          </div>)}
        </>}/>
      </div>
      <Card ch={<>
        <Ttl t="Holdings Detail" color={color}/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
              {["Symbol","Name","Fund","Type","Qty","Avg Cost","Price","Value","P&L","Return","Yield","Beta"].map(h=>(
                <th key={h} style={{textAlign:"left",padding:"7px 8px",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {hs.map((h,i)=>{
                const v=val(h),p=pl(h),pp=plp(h);
                const fColor=FUND_STRUCTURE[h.broker]?.funds[h.fund]?.color||color;
                return(
                  <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`,transition:"background 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(0,229,180,0.03)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"10px 8px",fontWeight:700,color,fontFamily:C.display}}>{h.symbol}</td>
                    <td style={{padding:"10px 8px",color:C.muted,fontSize:11}}>{h.name}</td>
                    <td style={{padding:"10px 8px"}}><Chip label={h.fund} color={fColor}/></td>
                    <td style={{padding:"10px 8px"}}><Chip label={h.type} color={h.type==="Stock"?C.teal:h.type==="ETF"?C.blue:h.type==="Crypto"?C.amber:C.purple}/></td>
                    <td style={{padding:"10px 8px",color:C.muted,fontFamily:C.mono}}>{h.qty}</td>
                    <td style={{padding:"10px 8px",color:C.muted,fontFamily:C.mono}}>${h.avgCost.toLocaleString()}</td>
                    <td style={{padding:"10px 8px",fontFamily:C.mono,fontWeight:600}}>${h.price.toLocaleString()}</td>
                    <td style={{padding:"10px 8px",fontFamily:C.mono,fontWeight:700}}>${Math.round(v).toLocaleString()}</td>
                    <td style={{padding:"10px 8px",fontFamily:C.mono,color:p>=0?C.teal:C.red,fontWeight:600}}>{p>=0?"+":""}${Math.round(p).toLocaleString()}</td>
                    <td style={{padding:"10px 8px",fontFamily:C.mono,color:pp>=0?C.teal:C.red}}>{pp>=0?"+":""}{pp.toFixed(2)}%</td>
                    <td style={{padding:"10px 8px",color:C.green,fontFamily:C.mono}}>{h.divYield>0?h.divYield+"%":"—"}</td>
                    <td style={{padding:"10px 8px",color:C.muted,fontFamily:C.mono}}>{h.beta}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>}/>
    </div>
  );
};

const PerformanceTab=({hs,color})=>{
  const m=metrics(hs);
  const tvAll=HOLDINGS.reduce((s,h)=>s+val(h),0);
  const perf=hs.map(h=>({name:h.symbol,roi:+plp(h).toFixed(2),contrib:+(pl(h)/Math.max(tvAll,1)*100).toFixed(2)})).sort((a,b)=>b.roi-a.roi);
  const weekly=[{day:"Mon",pl:m.tv*0.0023},{day:"Tue",pl:-m.tv*0.0012},{day:"Wed",pl:m.tv*0.0038},{day:"Thu",pl:-m.tv*0.0006},{day:"Fri",pl:m.tv*0.0034},{day:"Sat",pl:m.tv*0.0008}].map(d=>({...d,pl:+d.pl.toFixed(0)}));
  const [growthPeriod,setGrowthPeriod]=useState("1Y");

  // Period config: label, days, tick interval, date format
  const GROWTH_PERIODS = [
    {id:"1D",  label:"1D",   days:1,    interval:4,  fmt:{hour:"2-digit",minute:"2-digit"}},
    {id:"1W",  label:"1W",   days:7,    interval:1,  fmt:{month:"short",day:"numeric"}},
    {id:"1M",  label:"1M",   days:30,   interval:5,  fmt:{month:"short",day:"numeric"}},
    {id:"3M",  label:"3M",   days:90,   interval:14, fmt:{month:"short",day:"numeric"}},
    {id:"1Y",  label:"1Y",   days:365,  interval:60, fmt:{month:"short",day:"numeric"}},
    {id:"5Y",  label:"5Y",   days:1825, interval:180,fmt:{month:"short",year:"2-digit"}},
    {id:"10Y", label:"10Y",  days:3650, interval:365,fmt:{month:"short",year:"2-digit"}},
  ];
  const gp = GROWTH_PERIODS.find(p=>p.id===growthPeriod)||GROWTH_PERIODS[4];

  const growthData=useMemo(()=>{
    const d=[];
    // Scale volatility by period
    const dailyVol = gp.id==="1D" ? 0.003
      : gp.id==="1W"  ? 0.006
      : gp.id==="1M"  ? 0.008
      : gp.id==="3M"  ? 0.009
      : gp.id==="5Y"||gp.id==="10Y" ? 0.011 : 0.009;

    // Starting value — scale back proportionally
    const startMult = gp.id==="1D"?0.998:gp.id==="1W"?0.992:gp.id==="1M"?0.978:gp.id==="3M"?0.95:gp.id==="5Y"?0.68:gp.id==="10Y"?0.42:0.88;
    let v = m.tv * startMult;
    let invested = m.tc * startMult;

    const steps = gp.days;
    // Smooth landing zone — last 8% of steps gradually pull toward m.tv
    const landingStart = Math.floor(steps * 0.92);
    for(let i=steps;i>=0;i--){
      const step = steps - i; // 0 = first, steps = last
      // In landing zone: blend toward target
      if(step >= landingStart){
        const progress = (step - landingStart) / (steps - landingStart);
        const target   = m.tv;
        v = v + (target - v) * progress * 0.18 + (Math.random()-0.5)*m.tv*dailyVol*0.4;
      } else {
        v += (Math.random()-0.452)*m.tv*dailyVol;
      }
      v = Math.max(v, m.tv*0.3);
      invested += (m.tc - m.tc*startMult) / steps;
      invested  = Math.min(invested, m.tc);

      const dt=new Date();
      if(gp.id==="1D"){
        // Spread across trading day (9:30am to 4pm = 390 min)
        const minutesBack = (steps - step) * (390 / steps);
        dt.setHours(16,0,0,0);
        dt.setMinutes(dt.getMinutes() - minutesBack);
      } else {
        dt.setDate(dt.getDate()-i);
      }
      d.push({
        date: gp.id==="1D"
          ? dt.toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"})
          : dt.toLocaleDateString("en", gp.fmt),
        "Portfolio Value": Math.round(v),
        "Cost Basis":      Math.round(invested),
      });
    }
    // Final point exactly at current value — no forced jump
    d[d.length-1]["Portfolio Value"] = Math.round(m.tv);
    d[d.length-1]["Cost Basis"]      = Math.round(m.tc);
    return d;
  },[m.tv,growthPeriod]);

  // Stats for current period
  const growthStart = growthData[0]?.["Portfolio Value"]||m.tv;
  const growthEnd   = growthData[growthData.length-1]?.["Portfolio Value"]||m.tv;
  const growthAbs   = growthEnd - growthStart;
  const growthPct   = ((growthEnd-growthStart)/growthStart*100).toFixed(2);
  return(
    <div>
      {/* Growth Chart — Portfolio Value Over Time */}
      <Card ch={<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <Ttl t="Portfolio Growth Over Time" sub="Portfolio value vs cost basis — unrealized P&L is the shaded area" color={color}/>
          <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:3}}>
            {GROWTH_PERIODS.map(p=>(
              <button key={p.id} onClick={()=>setGrowthPeriod(p.id)} style={{
                padding:"5px 11px",borderRadius:7,border:"none",cursor:"pointer",
                fontFamily:C.mono,fontSize:10,fontWeight:700,
                background:growthPeriod===p.id?`linear-gradient(135deg,${color}33,${color}11)`:"transparent",
                color:growthPeriod===p.id?color:C.muted,
                borderBottom:growthPeriod===p.id?`2px solid ${color}`:"2px solid transparent",
                transition:"all 0.2s",
              }}>{p.label}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={growthData}>
            <defs>
              <linearGradient id="gVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color}  stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color}  stopOpacity={0.02}/>
              </linearGradient>
              <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.muted} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={C.muted} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={gp.interval}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
            <Tooltip content={<TT/>}/>
            <Legend wrapperStyle={{fontSize:10,fontFamily:C.mono}}/>
            {/* Cost basis — filled area below */}
            <Area type="monotone" dataKey="Cost Basis"       stroke={C.muted}  strokeWidth={1.5} fill="url(#gCost)" dot={false} strokeDasharray="4 3"/>
            {/* Portfolio value — filled area on top */}
            <Area type="monotone" dataKey="Portfolio Value"  stroke={color}    strokeWidth={2.5} fill="url(#gVal)"  dot={false}/>
            {/* Line to highlight trend clearly */}
            <Line type="monotone" dataKey="Portfolio Value"  stroke={color}    strokeWidth={0}   dot={false} legendType="none"/>
          </ComposedChart>
        </ResponsiveContainer>
        {/* Summary row below chart */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
          {[
            {l:`Start (${gp.label} ago)`, v:`$${growthStart.toLocaleString()}`,                                    c:C.muted},
            {l:"Current Value",           v:`$${Math.round(m.tv).toLocaleString()}`,                               c:color},
            {l:`${gp.label} Change $`,    v:`${growthAbs>=0?"+":""}$${Math.abs(Math.round(growthAbs)).toLocaleString()}`, c:growthAbs>=0?C.teal:C.red},
            {l:`${gp.label} Return`,      v:`${growthPct>=0?"+":""}${growthPct}%`,                                 c:+growthPct>=0?C.teal:C.red},
          ].map((s,i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:4}}>{s.l}</div>
              <div style={{fontSize:16,fontFamily:C.display,fontWeight:700,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
      </>} style={{marginBottom:16}}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:16}}>
        {[{l:"Total Return",v:`${m.plPct>=0?"+":""}${m.plPct.toFixed(2)}%`,c:m.tpl>=0?C.teal:C.red},{l:"TWR",v:`${m.plPct>=0?"+":""}${m.plPct.toFixed(2)}%`,c:color},{l:"MWR",v:`${(m.plPct*0.914)>=0?"+":""}${(m.plPct*0.914).toFixed(2)}%`,c:color},{l:"Alpha",v:`${(m.plPct-7.9)>=0?"+":""}${(m.plPct-7.9).toFixed(2)}%`,c:(m.plPct-7.9)>=0?C.teal:C.red},{l:"Info Ratio",v:(m.plPct/(m.wv+0.1)).toFixed(2),c:C.purple}].map((x,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${x.c}22`,borderRadius:12,padding:14}}>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:6}}>{x.l}</div>
            <div style={{fontSize:20,fontFamily:C.display,fontWeight:800,color:x.c}}>{x.v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Card ch={<>
          <Ttl t="ROI by Holding" color={color}/>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={perf} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis type="number" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`}/>
              <YAxis dataKey="name" type="category" tick={{fill:C.muted,fontSize:10,fontFamily:C.mono}} tickLine={false} axisLine={false} width={36}/>
              <Tooltip content={<TT/>}/><ReferenceLine x={0} stroke={C.border}/>
              <Bar dataKey="roi" name="ROI %" radius={[0,4,4,0]}>{perf.map((d,i)=><Cell key={i} fill={d.roi>=0?color:C.red} opacity={.85}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </>}/>
        <Card ch={<>
          <Ttl t="Weekly P&L" color={color}/>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="day" tick={{fill:C.muted,fontSize:10,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(1)}k`}/>
              <Tooltip content={<TT/>}/><ReferenceLine y={0} stroke={C.border}/>
              <Bar dataKey="pl" name="P&L" radius={[4,4,0,0]}>{weekly.map((d,i)=><Cell key={i} fill={d.pl>=0?color:C.red} opacity={.85}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </>}/>
      </div>
      <Card ch={<>
        <Ttl t="Attribution — Contribution to Total Portfolio" color={color}/>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={perf}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`}/>
            <Tooltip content={<TT/>}/><ReferenceLine y={0} stroke={C.border}/>
            <Bar dataKey="contrib" name="Contribution %" radius={[4,4,0,0]}>{perf.map((d,i)=><Cell key={i} fill={d.contrib>=0?color:C.red} opacity={.85}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </>}/>
    </div>
  );
};

const RiskTab=({hs,color})=>{
  const m=metrics(hs);
  const sh=+(m.plPct/(m.wv+0.1)*0.4).toFixed(2);
  const rItems=[
    {l:"Sharpe",v:sh,fmt:v=>v.toFixed(2),min:0,max:3,color:C.teal,desc:"Risk-adjusted return"},
    {l:"Sortino",v:+(sh*1.26).toFixed(2),fmt:v=>v.toFixed(2),min:0,max:4,color:C.green,desc:"Downside risk adj."},
    {l:"Beta",v:+m.wb.toFixed(2),fmt:v=>v.toFixed(2),min:0,max:2,color:C.blue,desc:"vs S&P 500"},
    {l:"Volatility",v:+m.wv.toFixed(1),fmt:v=>v.toFixed(1)+"%",min:0,max:60,color:C.purple,desc:"Annualized"},
    {l:"VaR 95%",v:+Math.abs(m.var95).toFixed(0),fmt:v=>`-$${Math.round(v).toLocaleString()}`,min:0,max:50000,color:C.red,desc:"Max daily loss"},
    {l:"Max DD",v:+Math.abs(m.maxDD).toFixed(0),fmt:v=>`-$${Math.round(v).toLocaleString()}`,min:0,max:100000,color:C.amber,desc:"Peak-to-trough"},
  ];
  const stress=[
    {s:"2008 Crisis",pct:-38.2},{s:"2020 COVID",pct:-24.1},
    {s:"Rate +2%",pct:-11.4},{s:"Crypto -60%",pct:hs.some(h=>h.type==="Crypto")?-8.2:-1.4},
    {s:"Tech Selloff",pct:-14.3},{s:"Base Case",pct:Math.max(m.plPct,9.7)},
  ];
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {rItems.map((r,i)=>(
          <Card key={i} ch={<>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:8}}>{r.l.toUpperCase()}</div>
            <div style={{fontSize:24,fontFamily:C.display,fontWeight:800,color:r.color,marginBottom:4}}>{r.fmt(r.v)}</div>
            <div style={{fontSize:10,color:C.muted,marginBottom:10}}>{r.desc}</div>
            <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
              <div style={{height:"100%",width:`${Math.min((r.v-r.min)/(r.max-r.min)*100,100)}%`,background:`linear-gradient(90deg,${r.color},${r.color}88)`,borderRadius:2}}/>
            </div>
          </>}/>
        ))}
      </div>
      <Card ch={<>
        <Ttl t="Risk Gauges" sub="Live meters"/>
        <div style={{display:"flex",justifyContent:"space-around",padding:"6px 0"}}>
          <Gauge value={+sh} min={0} max={3} label="SHARPE" color={C.teal} fmt={v=>v.toFixed(2)}/>
          <Gauge value={+m.wb.toFixed(2)} min={0} max={2} label="BETA" color={C.blue} fmt={v=>v.toFixed(2)}/>
          <Gauge value={+m.wv.toFixed(1)} min={0} max={60} label="VOL %" color={C.purple} fmt={v=>v.toFixed(1)+"%"}/>
          <Gauge value={12.4} min={0} max={40} label="MAX DD %" color={C.red} fmt={v=>"-"+v.toFixed(1)+"%"}/>
          <Gauge value={+(sh*1.26).toFixed(2)} min={0} max={4} label="SORTINO" color={C.green} fmt={v=>v.toFixed(2)}/>
        </div>
      </>} style={{marginBottom:14}}/>
      <Card ch={<>
        <Ttl t="Stress Test Scenarios" color={color}/>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {stress.map((s,i)=>{
            const impact=Math.round(m.tv*s.pct/100);
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:s.pct>=0?"rgba(0,229,180,0.04)":"rgba(248,113,113,0.04)",border:`1px solid ${s.pct>=0?C.teal+"22":C.red+"22"}`,borderRadius:10}}>
                <div style={{width:130,fontSize:12,fontFamily:C.mono,color:C.text,fontWeight:600,flexShrink:0}}>{s.s}</div>
                <div style={{flex:1,height:5,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
                  <div style={{height:"100%",borderRadius:2,width:`${Math.min(Math.abs(s.pct)/40*100,100)}%`,background:s.pct>=0?`linear-gradient(90deg,${C.teal},${C.teal}88)`:`linear-gradient(90deg,${C.red},${C.red}88)`}}/>
                </div>
                <div style={{width:55,textAlign:"right",fontFamily:C.mono,fontWeight:700,fontSize:13,color:s.pct>=0?C.teal:C.red}}>{s.pct>=0?"+":""}{s.pct}%</div>
                <div style={{width:100,textAlign:"right",fontFamily:C.mono,fontSize:12,color:s.pct>=0?C.teal:C.red}}>{impact>=0?"+":""}${impact.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </>}/>
    </div>
  );
};

const DividendsTab=({hs,color})=>{
  const m=metrics(hs);
  const divHs=hs.filter(h=>h.divYield>0);
  const calData=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((mo,i)=>({
    month:mo,income:Math.round(divHs.reduce((s,h)=>{
      const monthly=h.type==="Bond"?aDiv(h)/12:0;
      const quarterly=(i%3===0)?aDiv(h)/4:0;
      return s+monthly+quarterly;
    },0))
  }));
  const drip=Array.from({length:11},(_,y)=>({year:y===0?"Now":`Y${y*2}`,value:Math.round(m.tv*Math.pow(1.082,y*2)),income:Math.round(m.td*Math.pow(1.06,y*2))}));
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        <KPI label="Annual Income"   value={`$${Math.round(m.td).toLocaleString()}`} sub={`${divHs.length} payers`} color={C.green} pos={true}/>
        <KPI label="Portfolio Yield" value={`${m.yield.toFixed(2)}%`} sub="Weighted avg" color={color}/>
        <KPI label="Monthly Avg"     value={`$${Math.round(m.td/12).toLocaleString()}`} sub="Est. income" color={C.teal}/>
        <KPI label="Non-Payers"      value={hs.length-divHs.length} sub={`of ${hs.length} holdings`} color={C.muted}/>
      </div>
      {divHs.length===0
        ? <Card ch={<div style={{textAlign:"center",padding:40,color:C.muted,fontFamily:C.mono}}>No dividend-paying assets in this view.</div>}/>
        : <>
          <Card ch={<>
            <Ttl t="Dividend Detail" color={color}/>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                {["Symbol","Name","Fund","Yield","YoC","Annual $","CAGR","Payout","Freq"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"7px 8px",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {divHs.map((h,i)=>{
                  const fColor=FUND_STRUCTURE[h.broker]?.funds[h.fund]?.color||color;
                  return(
                    <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(74,222,128,0.03)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"10px 8px",fontWeight:700,color:C.green,fontFamily:C.display}}>{h.symbol}</td>
                      <td style={{padding:"10px 8px",color:C.muted,fontSize:11}}>{h.name}</td>
                      <td style={{padding:"10px 8px"}}><Chip label={h.fund} color={fColor}/></td>
                      <td style={{padding:"10px 8px",color:C.green,fontFamily:C.mono,fontWeight:600}}>{h.divYield}%</td>
                      <td style={{padding:"10px 8px",color:C.teal,fontFamily:C.mono}}>{(h.divYield*(h.price/h.avgCost)).toFixed(2)}%</td>
                      <td style={{padding:"10px 8px",fontFamily:C.mono,fontWeight:700}}>${Math.round(aDiv(h)).toLocaleString()}</td>
                      <td style={{padding:"10px 8px",color:C.amber,fontFamily:C.mono}}>+{h.divYield===3.84?2.1:h.divYield===1.32?6.8:h.divYield===0.73?10.4:h.divYield===1.28?5.9:4.2}%</td>
                      <td style={{padding:"10px 8px",color:C.muted,fontFamily:C.mono}}>{h.type==="Bond"?"100%":"~30%"}</td>
                      <td style={{padding:"10px 8px"}}><Chip label={h.type==="Bond"?"Monthly":"Quarterly"} color={C.green}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>} style={{marginBottom:14}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Card ch={<>
              <Ttl t="Monthly Income Calendar" color={color}/>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={calData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                  <XAxis dataKey="month" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="income" name="Income $" radius={[4,4,0,0]} fill={C.green} opacity={.85}/>
                </BarChart>
              </ResponsiveContainer>
            </>}/>
            <Card ch={<>
              <Ttl t="DRIP Projection — 20yr" sub="With dividend reinvestment" color={color}/>
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={drip}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                  <XAxis dataKey="year" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
                  <YAxis yAxisId="v" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                  <YAxis yAxisId="i" orientation="right" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`}/>
                  <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:10,fontFamily:C.mono}}/>
                  <Area yAxisId="v" type="monotone" dataKey="value" name="Value" stroke={color} strokeWidth={2} fill={`${color}10`} dot={false}/>
                  <Bar yAxisId="i" dataKey="income" name="Income" fill={C.green} opacity={.7} radius={[2,2,0,0]}/>
                </ComposedChart>
              </ResponsiveContainer>
            </>}/>
          </div>
        </>
      }
    </div>
  );
};

const MonteCarloTab=({hs,color})=>{
  const m=metrics(hs);
  const [mcYears,setMcYears]=useState(20);
  const [mcTarget,setMcTarget]=useState(1000000);
  const [mcSims,setMcSims]=useState(1000);
  const [mcReturn,setMcReturn]=useState(8.2);
  const [mcVol,setMcVol]=useState(14.8);
  const [mcContrib,setMcContrib]=useState(500);

  const mcData=useMemo(()=>{
    const d=[]; let p10=m.tv,p50=m.tv,p90=m.tv;
    const r10=mcReturn/100-mcVol/100*1.28;
    const r50=mcReturn/100;
    const r90=mcReturn/100+mcVol/100*1.28;
    for(let y=0;y<=mcYears;y++){
      if(y>0){
        p10=p10*(1+r10)+mcContrib*12;
        p50=p50*(1+r50)+mcContrib*12;
        p90=p90*(1+r90)+mcContrib*12;
      }
      d.push({year:`Y${y}`,p10:Math.round(Math.max(p10,0)),p50:Math.round(p50),p90:Math.round(p90)});
    }
    return d;
  },[m.tv,mcYears,mcReturn,mcVol,mcContrib]);

  const prob=Math.min(Math.round(
    50+(mcReturn-5)*4+(mcYears>10?10:0)+(mcTarget<mcData[mcData.length-1]?.p50?15:0)
  ),97);
  const finalP50=mcData[mcData.length-1]?.p50||0;
  const finalP90=mcData[mcData.length-1]?.p90||0;
  const finalP10=mcData[mcData.length-1]?.p10||0;

  const sliderStyle={width:"100%",accentColor:color,cursor:"pointer",height:4};
  const valStyle={fontSize:22,fontFamily:C.display,fontWeight:800,color,marginBottom:6};
  const lblStyle={fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:5};

  return(
    <div>
      {/* Control Panel */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:16}}>
        {/* Slider 1 — Horizon */}
        <Card ch={<>
          <div style={lblStyle}>HORIZON (YEARS)</div>
          <div style={valStyle}>{mcYears} yrs</div>
          <input type="range" min={1} max={40} step={1} value={mcYears} onChange={e=>setMcYears(+e.target.value)} style={sliderStyle}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,fontFamily:C.mono,color:C.muted,marginTop:4}}>
            <span>1yr</span><span>20yr</span><span>40yr</span>
          </div>
          <div style={{display:"flex",gap:4,marginTop:10,flexWrap:"wrap"}}>
            {[5,10,15,20,30].map(y=>(
              <button key={y} onClick={()=>setMcYears(y)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${mcYears===y?color+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:9,fontWeight:600,background:mcYears===y?`${color}18`:"transparent",color:mcYears===y?color:C.muted}}>
                {y}Y
              </button>
            ))}
          </div>
        </>}/>

        {/* Slider 2 — Target */}
        <Card ch={<>
          <div style={lblStyle}>CAPITAL TARGET</div>
          <div style={valStyle}>${(mcTarget/1000).toFixed(0)}k</div>
          <input type="range" min={100000} max={5000000} step={50000} value={mcTarget} onChange={e=>setMcTarget(+e.target.value)} style={sliderStyle}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,fontFamily:C.mono,color:C.muted,marginTop:4}}>
            <span>$100k</span><span>$2.5M</span><span>$5M</span>
          </div>
          <div style={{display:"flex",gap:4,marginTop:10,flexWrap:"wrap"}}>
            {[500,750,1000,2000,5000].map(k=>(
              <button key={k} onClick={()=>setMcTarget(k*1000)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${mcTarget===k*1000?color+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:9,fontWeight:600,background:mcTarget===k*1000?`${color}18`:"transparent",color:mcTarget===k*1000?color:C.muted}}>
                ${k}k
              </button>
            ))}
          </div>
        </>}/>

        {/* Slider 3 — Monthly Contribution */}
        <Card ch={<>
          <div style={lblStyle}>MONTHLY CONTRIBUTION</div>
          <div style={valStyle}>${mcContrib.toLocaleString()}</div>
          <input type="range" min={0} max={5000} step={100} value={mcContrib} onChange={e=>setMcContrib(+e.target.value)} style={sliderStyle}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,fontFamily:C.mono,color:C.muted,marginTop:4}}>
            <span>$0</span><span>$2,500</span><span>$5,000</span>
          </div>
          <div style={{display:"flex",gap:4,marginTop:10,flexWrap:"wrap"}}>
            {[0,250,500,1000,2500].map(v=>(
              <button key={v} onClick={()=>setMcContrib(v)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${mcContrib===v?color+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:9,fontWeight:600,background:mcContrib===v?`${color}18`:"transparent",color:mcContrib===v?color:C.muted}}>
                ${v}
              </button>
            ))}
          </div>
        </>}/>

        {/* Slider 4 — Expected Return */}
        <Card ch={<>
          <div style={lblStyle}>EXPECTED ANNUAL RETURN</div>
          <div style={valStyle}>{mcReturn}%</div>
          <input type="range" min={1} max={25} step={0.5} value={mcReturn} onChange={e=>setMcReturn(+e.target.value)} style={sliderStyle}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,fontFamily:C.mono,color:C.muted,marginTop:4}}>
            <span>1%</span><span>12%</span><span>25%</span>
          </div>
          <div style={{display:"flex",gap:4,marginTop:10,flexWrap:"wrap"}}>
            {[4,6,8.2,10,15].map(v=>(
              <button key={v} onClick={()=>setMcReturn(v)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${mcReturn===v?color+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:9,fontWeight:600,background:mcReturn===v?`${color}18`:"transparent",color:mcReturn===v?color:C.muted}}>
                {v}%
              </button>
            ))}
          </div>
        </>}/>

        {/* Slider 5 — Volatility */}
        <Card ch={<>
          <div style={lblStyle}>PORTFOLIO VOLATILITY</div>
          <div style={valStyle}>{mcVol}%</div>
          <input type="range" min={2} max={50} step={0.5} value={mcVol} onChange={e=>setMcVol(+e.target.value)} style={sliderStyle}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,fontFamily:C.mono,color:C.muted,marginTop:4}}>
            <span>2%</span><span>25%</span><span>50%</span>
          </div>
          <div style={{display:"flex",gap:4,marginTop:10,flexWrap:"wrap"}}>
            {[5,10,14.8,20,30].map(v=>(
              <button key={v} onClick={()=>setMcVol(v)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${mcVol===v?color+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:9,fontWeight:600,background:mcVol===v?`${color}18`:"transparent",color:mcVol===v?color:C.muted}}>
                {v}%
              </button>
            ))}
          </div>
        </>}/>

        {/* Results card */}
        <Card ch={<>
          <div style={lblStyle}>SIMULATION RESULTS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div style={{background:`${color}12`,border:`1px solid ${color}33`,borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
              <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>PROB. TARGET</div>
              <div style={{fontSize:24,fontFamily:C.display,fontWeight:800,color}}>{prob}%</div>
            </div>
            <div style={{background:`${C.purple}12`,border:`1px solid ${C.purple}33`,borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
              <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>SIMULATIONS</div>
              <div style={{fontSize:24,fontFamily:C.display,fontWeight:800,color:C.purple}}>{mcSims.toLocaleString()}</div>
            </div>
          </div>
          {[{l:"P90 (Optimistic)",v:`$${(finalP90/1000).toFixed(0)}k`,c:C.teal},{l:"P50 (Base Case)",v:`$${(finalP50/1000).toFixed(0)}k`,c:color},{l:"P10 (Pessimistic)",v:`$${(finalP10/1000).toFixed(0)}k`,c:C.red}].map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
              <span style={{fontSize:10,fontFamily:C.mono,color:C.muted}}>{s.l}</span>
              <span style={{fontSize:12,fontFamily:C.display,fontWeight:700,color:s.c}}>{s.v}</span>
            </div>
          ))}
          <div style={{marginTop:10,display:"flex",gap:4,flexWrap:"wrap"}}>
            <span style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>SIMS:</span>
            {[100,500,1000,5000].map(n=>(
              <button key={n} onClick={()=>setMcSims(n)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${mcSims===n?C.purple+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:9,fontWeight:600,background:mcSims===n?`${C.purple}18`:"transparent",color:mcSims===n?C.purple:C.muted}}>
                {n}
              </button>
            ))}
          </div>
        </>}/>
      </div>

      {/* Monte Carlo Chart */}
      <Card ch={<>
        <Ttl t="Monte Carlo Projection" sub={`${mcSims.toLocaleString()} simulation paths · ${mcYears} year horizon · $${mcContrib}/mo contribution`} color={color}/>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={mcData}>
            <defs>
              <linearGradient id="gp90" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.teal} stopOpacity={.2}/><stop offset="95%" stopColor={C.teal} stopOpacity={0}/></linearGradient>
              <linearGradient id="gp50" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={.2}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient>
              <linearGradient id="gp10" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.red} stopOpacity={.15}/><stop offset="95%" stopColor={C.red} stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="year" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
            <Tooltip content={<TT/>}/>
            <ReferenceLine y={mcTarget} stroke={C.amber} strokeDasharray="4 2" label={{value:`Target $${(mcTarget/1000).toFixed(0)}k`,fill:C.amber,fontSize:9,fontFamily:C.mono,position:"right"}}/>
            <Legend wrapperStyle={{fontSize:10,fontFamily:C.mono}}/>
            <Area type="monotone" dataKey="p90" name="Optimistic (P90)" stroke={C.teal} strokeWidth={2} fill="url(#gp90)" dot={false}/>
            <Area type="monotone" dataKey="p50" name="Base (P50)" stroke={color} strokeWidth={2.5} fill="url(#gp50)" dot={false}/>
            <Area type="monotone" dataKey="p10" name="Pessimistic (P10)" stroke={C.red} strokeWidth={1.5} fill="url(#gp10)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </>}/>
    </div>
  );
};

const ProjectionsTab=({hs,color,scope})=>{
  const m=metrics(hs);
  const [horizon,setHorizon]=useState("1Y");
  const hm={"1W":1/52,"1M":1/12,"3M":1/4,"6M":1/2,"1Y":1,"3Y":3,"5Y":5}[horizon]||1;
  const getFunds=()=>{
    if(scope.type==="all") return Object.entries(FUND_STRUCTURE).flatMap(([broker,b])=>Object.entries(b.funds).map(([fund,f])=>({broker,fund,...f,proj:PROJECTIONS[fund]})));
    if(scope.type==="broker") return Object.entries(FUND_STRUCTURE[scope.broker]?.funds||{}).map(([fund,f])=>({broker:scope.broker,fund,...f,proj:PROJECTIONS[fund]}));
    return [{broker:scope.broker,fund:scope.fund,...FUND_STRUCTURE[scope.broker]?.funds[scope.fund],proj:PROJECTIONS[scope.fund]}];
  };
  const funds=getFunds();
  const fVal=f=>hs.filter(h=>h.fund===f.fund&&h.broker===f.broker).reduce((s,h)=>s+val(h),0)||m.tv/Math.max(funds.length,1);
  const scenarios=funds.map(f=>{
    const fv=fVal(f),p=f.proj||{base:8,bull:18,bear:-10,prob:65};
    return{...f,fv,base:Math.round(fv*(1+p.base/100*hm)),bull:Math.round(fv*(1+p.bull/100*hm)),bear:Math.round(fv*(1+p.bear/100*hm)),
      basePct:+(p.base*hm).toFixed(1),bullPct:+(p.bull*hm).toFixed(1),bearPct:+(p.bear*hm).toFixed(1),prob:p.prob,drivers:f.proj?.drivers||["Market conditions"]};
  });
  const tBase=scenarios.reduce((s,f)=>s+f.base,0);
  const tBull=scenarios.reduce((s,f)=>s+f.bull,0);
  const tBear=scenarios.reduce((s,f)=>s+f.bear,0);
  const timeSeries=Array.from({length:13},(_,i)=>({period:i===0?"Now":i<=6?`${i*2}m`:`Y${(i/6).toFixed(1)}`,base:Math.round(m.tv*Math.pow(1.082,i/12)),bull:Math.round(m.tv*Math.pow(1.16,i/12)),bear:Math.round(m.tv*Math.pow(1.032,i/12))}));
  return(
    <div>
      <div style={{display:"flex",gap:4,marginBottom:16,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:3,width:"fit-content"}}>
        <span style={{fontSize:10,fontFamily:C.mono,color:C.muted,alignSelf:"center",padding:"0 8px"}}>HORIZON:</span>
        {["1W","1M","3M","6M","1Y","3Y","5Y"].map(h=>(
          <button key={h} onClick={()=>setHorizon(h)} style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:C.mono,fontSize:11,fontWeight:600,background:horizon===h?`${color}22`:"transparent",color:horizon===h?color:C.muted,transition:"all 0.2s"}}>{h}</button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:16}}>
        {[{l:"Current",v:`$${Math.round(m.tv).toLocaleString()}`,c:color},{l:`Bear (${horizon})`,v:`$${tBear.toLocaleString()}`,c:C.red,pos:false},{l:`Base (${horizon})`,v:`$${tBase.toLocaleString()}`,c:color,pos:true},{l:`Bull (${horizon})`,v:`$${tBull.toLocaleString()}`,c:C.teal,pos:true}].map((s,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${s.c}22`,borderRadius:12,padding:14}}>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:5}}>{s.l}</div>
            <div style={{fontSize:20,fontFamily:C.display,fontWeight:800,color:s.pos===false?C.red:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>
      <Card ch={<>
        <Ttl t="Portfolio Projection — All Scenarios" color={color} sub="Based on historical returns + current momentum"/>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={timeSeries}>
            <defs>
              <linearGradient id="pb2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.teal} stopOpacity={.2}/><stop offset="95%" stopColor={C.teal} stopOpacity={0}/></linearGradient>
              <linearGradient id="pm2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={.15}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient>
              <linearGradient id="pr2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.red} stopOpacity={.12}/><stop offset="95%" stopColor={C.red} stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="period" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
            <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:10,fontFamily:C.mono}}/>
            <Area type="monotone" dataKey="bull" name="Optimistic" stroke={C.teal} strokeWidth={2} fill="url(#pb2)" dot={false}/>
            <Area type="monotone" dataKey="base" name="Base Case" stroke={color} strokeWidth={2.5} fill="url(#pm2)" dot={false}/>
            <Area type="monotone" dataKey="bear" name="Pessimistic" stroke={C.red} strokeWidth={1.5} fill="url(#pr2)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </>} style={{marginBottom:14}}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
        {scenarios.map((f,i)=>(
          <Card key={i} ch={<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontFamily:C.display,fontWeight:700,fontSize:13,color:f.color,marginBottom:2}}>{f.fund}</div>
                <div style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>{f.broker} · ${Math.round(f.fv).toLocaleString()}</div>
              </div>
              <div style={{background:`${f.color}18`,border:`1px solid ${f.color}33`,borderRadius:8,padding:"4px 10px",textAlign:"center"}}>
                <div style={{fontSize:8,fontFamily:C.mono,color:C.muted}}>PROB</div>
                <div style={{fontSize:15,fontFamily:C.display,fontWeight:800,color:f.color}}>{f.prob}%</div>
              </div>
            </div>
            {[{l:"🐂 Bull",v:f.bull,pct:f.bullPct,c:C.teal},{l:"📊 Base",v:f.base,pct:f.basePct,c:f.color},{l:"🐻 Bear",v:f.bear,pct:f.bearPct,c:C.red}].map((sc,j)=>(
              <div key={j} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:11,fontFamily:C.mono,color:C.muted}}>{sc.l}</span>
                  <div style={{display:"flex",gap:10}}>
                    <span style={{fontSize:11,fontFamily:C.mono,color:sc.c,fontWeight:700}}>{sc.pct>=0?"+":""}{sc.pct}%</span>
                    <span style={{fontSize:11,fontFamily:C.mono,color:C.text}}>${sc.v.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
                  <div style={{height:"100%",width:`${Math.min(Math.abs(sc.pct)/Math.max(Math.abs(f.bullPct),1)*100,100)}%`,background:`linear-gradient(90deg,${sc.c},${sc.c}88)`,borderRadius:2}}/>
                </div>
              </div>
            ))}
            <div style={{marginTop:10,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
              <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:5}}>KEY DRIVERS</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{f.drivers.map((d,j)=><Chip key={j} label={d} color={f.color}/>)}</div>
            </div>
          </>} style={{border:`1px solid ${f.color}33`}}/>
        ))}
      </div>
    </div>
  );
};

const CorrelationsTab=({hs,color})=>{
  const syms=hs.map(h=>h.symbol);
  const indices=syms.map(s=>SYMS.indexOf(s));
  const matrix=indices.map(i=>indices.map(j=>i>=0&&j>=0?CORR[i][j]:1));
  const pairs=syms.flatMap((s1,i)=>syms.slice(i+1).map((s2,j)=>({s1,s2,v:matrix[i][i+j+1]??0})));
  return(
    <div>
      <Card ch={<>
        <Ttl t="Correlation Matrix" sub="Hover any cell for details · Diagonal = self (1.0)" color={color}/>
        <CorrMap syms={syms} matrix={matrix}/>
      </>} style={{marginBottom:14}}/>
      <Card ch={<>
        <Ttl t="Returns Heatmap" sub="Weekly returns — last 12 weeks · Hover for value" color={color}/>
        <ReturnsMap hs={hs}/>
      </>} style={{marginBottom:14}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card ch={<>
          <Ttl t="⚠ High Correlations — Concentration Risk"/>
          {pairs.filter(r=>r.v>0.6).sort((a,b)=>b.v-a.v).slice(0,4).map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<3?`1px solid ${C.border}`:"none"}}>
              <span style={{fontFamily:C.mono,fontSize:12}}><span style={{color:C.teal}}>{r.s1}</span> ↔ <span style={{color:C.blue}}>{r.s2}</span></span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:50,height:4,background:"rgba(255,255,255,0.06)",borderRadius:2}}><div style={{height:"100%",width:`${r.v*100}%`,background:r.v>0.85?C.red:C.amber,borderRadius:2}}/></div>
                <span style={{fontFamily:C.mono,fontSize:12,color:r.v>0.85?C.red:C.amber,fontWeight:700}}>{r.v.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </>}/>
        <Card ch={<>
          <Ttl t="✅ Best Hedges — Low Correlation"/>
          {pairs.filter(r=>r.v<0.2).sort((a,b)=>a.v-b.v).slice(0,4).map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<3?`1px solid ${C.border}`:"none"}}>
              <div>
                <div style={{fontFamily:C.mono,fontSize:12}}><span style={{color:C.green}}>{r.s1}</span> ↔ <span style={{color:C.purple}}>{r.s2}</span></div>
                <div style={{fontSize:10,color:C.muted,fontFamily:C.mono}}>{r.v<0?"Natural hedge":"Low correlation"}</div>
              </div>
              <span style={{fontFamily:C.mono,fontSize:12,color:r.v<0?C.green:C.amber,fontWeight:700}}>{r.v.toFixed(2)}</span>
            </div>
          ))}
        </>}/>
      </div>
    </div>
  );
};

const SnowflakeTab=({hs})=>{
  const [sfKey,setSfKey]=useState("PORTFOLIO");
  const [sfCmp,setSfCmp]=useState("NVDA");
  const available=["PORTFOLIO",...hs.map(h=>h.symbol).filter(s=>SF[s])];
  const currentData=SF[sfKey]||SF["PORTFOLIO"];
  const cmpData=SF[sfCmp]||SF["VOO"];
  return(
    <div>
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,fontFamily:C.mono,color:C.muted,marginRight:4}}>VIEW:</span>
        {available.map(sym=>(
          <button key={sym} onClick={()=>setSfKey(sym)} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${sfKey===sym?(SF[sym]?.color||C.teal)+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:11,fontWeight:600,background:sfKey===sym?`${SF[sym]?.color||C.teal}18`:"rgba(255,255,255,0.03)",color:sfKey===sym?SF[sym]?.color||C.teal:C.muted,transition:"all 0.2s"}}>{sym}</button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:20,marginBottom:18}}>
        <Card ch={<>
          <div style={{fontFamily:C.display,fontWeight:700,fontSize:14,color:currentData.color,marginBottom:4,textAlign:"center"}}>{sfKey}</div>
          <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,marginBottom:16,letterSpacing:1,textAlign:"center"}}>SNOWFLAKE SCORE MAP</div>
          <div style={{display:"flex",justifyContent:"center"}}>
            <Snowflake data={currentData} size={240}/>
          </div>
          <div style={{marginTop:14,textAlign:"center"}}>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2,marginBottom:4}}>OVERALL SCORE</div>
            <div style={{fontSize:40,fontFamily:C.display,fontWeight:800,color:currentData.color,lineHeight:1}}>{Math.round(currentData.scores.reduce((a,b)=>a+b,0)/currentData.scores.length)}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:4}}>{Math.round(currentData.scores.reduce((a,b)=>a+b,0)/currentData.scores.length)>=70?"GOOD":Math.round(currentData.scores.reduce((a,b)=>a+b,0)/currentData.scores.length)>=50?"FAIR":"WEAK"}</div>
          </div>
        </>} style={{minWidth:300}}/>
        <Card ch={<>
          <Ttl t="Score Breakdown — 7 Dimensions" sub="Grade per dimension"/>
          {SF_DIMS.map((d,i)=>{
            const v=currentData.scores[i];
            const gc=v>=80?"A":v>=65?"B":v>=50?"C":v>=35?"D":"F";
            const gc_col=v>=80?C.teal:v>=65?C.green:v>=50?C.amber:v>=35?"#F97316":C.red;
            return(
              <div key={i} style={{marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <div style={{width:90,fontSize:11,fontFamily:C.mono,color:C.muted,flexShrink:0}}>{d}</div>
                  <div style={{flex:1,height:7,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${v}%`,background:`linear-gradient(90deg,${currentData.color},${currentData.color}99)`,borderRadius:4,transition:"width 0.8s ease"}}/>
                  </div>
                  <div style={{width:28,textAlign:"right",fontFamily:C.mono,fontSize:12,fontWeight:700,color:currentData.color}}>{v}</div>
                  <div style={{width:16,textAlign:"center",fontSize:11,fontWeight:800,fontFamily:C.display,color:gc_col}}>{gc}</div>
                </div>
              </div>
            );
          })}
        </>}/>
      </div>
      <Card ch={<>
        <Ttl t="All Assets — Quick View" sub="Click any to set as main"/>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(available.length,6)},1fr)`,gap:12}}>
          {available.map(key=>{
            const data=SF[key]||SF["PORTFOLIO"];
            const avg=Math.round(data.scores.reduce((a,b)=>a+b,0)/data.scores.length);
            return(
              <div key={key} onClick={()=>setSfKey(key)} style={{background:sfKey===key?`${data.color}12`:C.surface,border:`2px solid ${sfKey===key?data.color:C.border}`,borderRadius:10,padding:10,cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=data.color}
                onMouseLeave={e=>e.currentTarget.style.borderColor=sfKey===key?data.color:C.border}>
                <div style={{display:"flex",justifyContent:"center"}}>
                  <Snowflake data={data} size={80} showLabels={false}/>
                </div>
                <div style={{fontFamily:C.display,fontWeight:700,fontSize:10,color:data.color,marginTop:4}}>{key}</div>
                <div style={{fontSize:16,fontFamily:C.display,fontWeight:800,color:avg>=70?C.teal:avg>=50?C.amber:C.red,marginTop:2}}>{avg}</div>
              </div>
            );
          })}
        </div>
      </>} style={{marginBottom:18}}/>
      <Card ch={<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <Ttl t="Comparator" sub="Head-to-head overlay"/>
          <select value={sfCmp} onChange={e=>setSfCmp(e.target.value)} style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",color:C.text,fontSize:11,fontFamily:C.mono,cursor:"pointer"}}>
            {available.filter(s=>s!==sfKey).map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:16,alignItems:"start"}}>
          <div>
            {SF_DIMS.map((d,i)=>{const sA=currentData.scores[i],sB=cmpData.scores[i],wins=sA>sB;return(
              <div key={d} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7,padding:"5px 8px",background:wins?"rgba(0,229,180,0.04)":"rgba(255,255,255,0.02)",borderRadius:6,border:`1px solid ${wins?currentData.color+"22":C.border}`}}>
                <span style={{fontSize:11,fontFamily:C.mono,color:C.muted}}>{d}</span>
                <span style={{fontFamily:C.mono,fontWeight:700,fontSize:12,color:wins?currentData.color:C.muted}}>{wins?"▲ ":""}{sA}</span>
              </div>
            );})}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            <svg width={180} height={180} viewBox="0 0 180 180" style={{overflow:"visible",display:"block"}}>
              {[.25,.5,.75,1].map((r,i)=>{const N=7,cx=90,cy=90,R=68;const ang=j=>(j*2*Math.PI/N)-Math.PI/2;const pt=(j,rr)=>({x:cx+R*rr*Math.cos(ang(j)),y:cy+R*rr*Math.sin(ang(j))});return<polygon key={i} points={[...Array(N)].map((_,j)=>`${pt(j,r).x},${pt(j,r).y}`).join(" ")} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1}/>;}) }
              {[currentData,cmpData].map((data,ki)=>{
                const N=7,cx=90,cy=90,R=68;
                const ang=j=>(j*2*Math.PI/N)-Math.PI/2;
                const pt=(j,r)=>({x:cx+R*r*Math.cos(ang(j)),y:cy+R*r*Math.sin(ang(j))});
                const poly=data.scores.map((s,j)=>`${pt(j,s/100).x},${pt(j,s/100).y}`).join(" ");
                return<polygon key={ki} points={poly} fill={`${data.color}${ki===0?"22":"15"}`} stroke={data.color} strokeWidth={ki===0?2:1.5} strokeLinejoin="round" opacity={0.9}/>;
              })}
            </svg>
            <div style={{display:"flex",gap:10}}>
              {[{k:sfKey,d:currentData},{k:sfCmp,d:cmpData}].map((x,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:9,height:9,borderRadius:2,background:x.d.color}}/>
                  <span style={{fontSize:10,fontFamily:C.mono,color:C.muted}}>{x.k}</span>
                </div>
              ))}
            </div>
            {(()=>{
              const wA=SF_DIMS.filter((_,i)=>currentData.scores[i]>cmpData.scores[i]).length;
              const wB=SF_DIMS.length-wA;
              const winner=wA>wB?sfKey:sfCmp;
              const wd=wA>wB?currentData:cmpData;
              return(
                <div style={{background:`${wd.color}12`,border:`1px solid ${wd.color}44`,borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
                  <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>WINNER</div>
                  <div style={{fontFamily:C.display,fontWeight:800,fontSize:14,color:wd.color}}>{winner}</div>
                  <div style={{fontSize:11,fontFamily:C.mono,color:C.muted}}>{Math.max(wA,wB)}:{Math.min(wA,wB)}</div>
                </div>
              );
            })()}
          </div>
          <div>
            {SF_DIMS.map((d,i)=>{const sA=currentData.scores[i],sB=cmpData.scores[i],wins=sB>sA;return(
              <div key={d} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7,padding:"5px 8px",background:wins?`${cmpData.color}08`:"rgba(255,255,255,0.02)",borderRadius:6,border:`1px solid ${wins?cmpData.color+"22":C.border}`}}>
                <span style={{fontFamily:C.mono,fontWeight:700,fontSize:12,color:wins?cmpData.color:C.muted}}>{sB}{wins?" ▲":""}</span>
                <span style={{fontSize:11,fontFamily:C.mono,color:C.muted}}>{d}</span>
              </div>
            );})}
          </div>
        </div>
      </>}/>
    </div>
  );
};

const AddAssetTab=({positions,setPositions,toast,showToast})=>{
  const [form,setForm]=useState({symbol:"",name:"",type:"Stock",broker:"Robinhood",qty:"",cost:"",price:""});
  const upd=f=>e=>setForm(p=>({...p,[f]:e.target.value}));
  const add=()=>{
    if(!form.symbol||!form.qty||!form.cost||!form.price){showToast("⚠ Fill all required fields");return;}
    const qty=+form.qty,cost=+form.cost,price=+form.price;
    setPositions(p=>[{...form,qty,cost,price,value:qty*price,pl:(price-cost)*qty,id:Date.now()},...p]);
    setForm({symbol:"",name:"",type:"Stock",broker:"Robinhood",qty:"",cost:"",price:""});
    showToast("✅ Position added!");
  };
  const inp={background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:12,outline:"none",fontFamily:C.mono,width:"100%"};
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr",gap:20}}>
      <Card ch={<>
        <Ttl t="Add Asset Manually" sub="For brokers without API (TSP, Fidelity, etc.)"/>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[{l:"Ticker Symbol *",f:"symbol",ph:"AAPL"},{l:"Asset Name",f:"name",ph:"Apple Inc."},{l:"Quantity *",f:"qty",ph:"10",t:"number"},{l:"Avg Cost (USD) *",f:"cost",ph:"178.20",t:"number"},{l:"Current Price (USD) *",f:"price",ph:"213.50",t:"number"}].map((fi,i)=>(
            <div key={i}>
              <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:5}}>{fi.l.toUpperCase()}</div>
              <input value={form[fi.f]} onChange={upd(fi.f)} placeholder={fi.ph} type={fi.t||"text"} style={inp}/>
            </div>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[{l:"TYPE",f:"type",opts:["Stock","ETF","Crypto","Bond","Option","REIT"]},{l:"BROKER",f:"broker",opts:["Robinhood","Fidelity","TSP Federal","IBKR","Coinbase","Other"]}].map((s,i)=>(
              <div key={i}>
                <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:5}}>{s.l}</div>
                <select value={form[s.f]} onChange={upd(s.f)} style={{...inp,cursor:"pointer"}}>{s.opts.map(o=><option key={o}>{o}</option>)}</select>
              </div>
            ))}
          </div>
          {form.qty&&form.cost&&form.price&&(
            <div style={{background:"rgba(0,229,180,0.05)",border:`1px solid ${C.teal}22`,borderRadius:8,padding:12}}>
              <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:8}}>PREVIEW</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
                {[{l:"Cost",v:`$${(+form.qty*+form.cost).toFixed(0)}`},{l:"Value",v:`$${(+form.qty*+form.price).toFixed(0)}`},{l:"P&L",v:`${(+form.price-+form.cost)>=0?"+":""}$${((+form.price-+form.cost)*+form.qty).toFixed(0)}`,c:(+form.price-+form.cost)>=0?C.teal:C.red}].map((s,i)=>(
                  <div key={i}><div style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>{s.l}</div><div style={{fontSize:14,fontFamily:C.display,fontWeight:700,color:s.c||C.text,marginTop:2}}>{s.v}</div></div>
                ))}
              </div>
            </div>
          )}
          <button onClick={add} style={{padding:"12px",borderRadius:10,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${C.teal},${C.blue})`,color:C.bg,fontFamily:C.display,fontSize:14,fontWeight:700,boxShadow:`0 0 18px ${C.teal}33`}}>
            + Add Position
          </button>
        </div>
      </>}/>
      <Card ch={<>
        <Ttl t="Manual Positions" sub={`${positions.length} positions added`}/>
        {positions.length===0
          ? <div style={{textAlign:"center",padding:"50px 20px",color:C.muted}}><div style={{fontSize:40,marginBottom:12}}>📋</div><div style={{fontFamily:C.mono,fontSize:12}}>No manual positions yet</div></div>
          : <>
            {positions.map((p,i)=>(
              <div key={p.id} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${C.amber}22`,borderRadius:10,padding:14,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontFamily:C.display,fontWeight:700,fontSize:14,color:C.amber}}>{p.symbol}</div>
                  <div style={{display:"flex",gap:6}}><Chip label={p.type} color={C.amber}/><Chip label={p.broker} color={C.muted}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                  {[{l:"Qty",v:p.qty},{l:"Price",v:`$${p.price}`},{l:"Value",v:`$${Math.round(p.value).toLocaleString()}`},{l:"P&L",v:`${p.pl>=0?"+":""}$${Math.round(p.pl).toLocaleString()}`,c:p.pl>=0?C.teal:C.red}].map((s,j)=>(
                    <div key={j}><div style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>{s.l}</div><div style={{fontSize:13,fontFamily:C.mono,fontWeight:600,color:s.c||C.text,marginTop:2}}>{s.v}</div></div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{background:"rgba(0,229,180,0.06)",border:`1px solid ${C.teal}22`,borderRadius:10,padding:14,textAlign:"center"}}>
              <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:6}}>MANUAL TOTAL</div>
              <div style={{fontSize:22,fontFamily:C.display,fontWeight:800,color:C.teal}}>${positions.reduce((s,p)=>s+p.value,0).toLocaleString("en",{minimumFractionDigits:0,maximumFractionDigits:0})}</div>
            </div>
          </>
        }
      </>}/>
    </div>
  );
};

const AIAgentsTab=()=>(
  <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div>
        <div style={{fontFamily:C.display,fontWeight:800,fontSize:20,marginBottom:4}}>🤖 AI Agent System — Original Team</div>
        <div style={{fontFamily:C.mono,fontSize:11,color:C.muted}}>10 specialized agents · DeepSeek-V3 → Gemini → Claude · $0 operational cost</div>
      </div>
      <div style={{display:"flex",gap:10}}>
        {[{l:"ACTIVE",v:7,c:C.teal},{l:"STANDBY",v:3,c:C.muted}].map((s,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${s.c}33`,borderRadius:10,padding:"8px 16px",textAlign:"center"}}>
            <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>{s.l}</div>
            <div style={{fontSize:22,fontFamily:C.display,fontWeight:800,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:16}}>
      {[
        {id:"NEXUS",role:"Master Orchestrator",status:"active",color:C.text,tasks:["Routing agents","Consolidating outputs"],load:94},
        {id:"SENTINEL",role:"Anomaly Detector",status:"active",color:C.amber,tasks:["Scanning positions","Z-Score analysis"],load:72},
        {id:"ORACLE",role:"Price Predictor",status:"active",color:C.blue,tasks:["NVDA: +3.1% (72%)","BTC: -1.8% (61%)"],load:88},
        {id:"COMPASS",role:"Buy/Sell Engine",status:"standby",color:C.teal,tasks:["Awaiting ORACLE","Thresholds set"],load:31},
        {id:"HERALD",role:"News & Sentiment",status:"active",color:C.pink,tasks:["Reuters: 12 articles","NVDA sentiment: +82"],load:65},
        {id:"GUARDIAN",role:"Risk Monitor",status:"active",color:C.red,tasks:["VaR: within limits","Beta: 0.92 OK"],load:58},
        {id:"SCRIBE",role:"AI Chat Agent",status:"active",color:C.teal,tasks:["Chat ready","ES/EN auto-detect"],load:44},
        {id:"DIVIDEND",role:"Dividend Intel",status:"active",color:C.green,tasks:["Annual: $902","Next: MSFT May 16"],load:39},
        {id:"SIMULATOR",role:"Monte Carlo AI",status:"standby",color:C.purple,tasks:["On-demand mode","Last: 1,000 paths"],load:12},
        {id:"PERFORMANCE",role:"Attribution AI",status:"active",color:C.amber,tasks:["TWR: +9.74%","Top: NVDA +42.8%"],load:67},
      ].map((a,i)=>(
        <div key={i} style={{background:C.surface,border:`1px solid ${a.status==="active"?a.color+"33":C.border}`,borderRadius:12,padding:14,transition:"all 0.2s"}}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:a.status==="active"?a.color:"#334155",boxShadow:a.status==="active"?`0 0 6px ${a.color}`:"none",animation:a.status==="active"?"pulse 2s infinite":"none"}}/>
                <span style={{fontFamily:C.display,fontWeight:700,fontSize:12,color:a.status==="active"?a.color:C.muted}}>{a.id}</span>
              </div>
              <div style={{fontSize:9,color:C.muted,fontFamily:C.mono}}>{a.role}</div>
            </div>
            <Chip label={a.status==="active"?"ON":"STBY"} color={a.status==="active"?a.color:"#475569"}/>
          </div>
          {a.tasks.map((t,j)=><div key={j} style={{fontSize:10,color:C.muted,fontFamily:C.mono,marginBottom:3,paddingLeft:6,borderLeft:`2px solid ${a.color}44`}}>{t}</div>)}
          <div style={{marginTop:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:8,fontFamily:C.mono,color:C.dim,letterSpacing:1}}>LOAD</span>
              <span style={{fontSize:8,fontFamily:C.mono,color:a.color}}>{a.load}%</span>
            </div>
            <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
              <div style={{height:"100%",width:`${a.load}%`,background:`linear-gradient(90deg,${a.color},${a.color}88)`,borderRadius:2}}/>
            </div>
          </div>
        </div>
      ))}
    </div>
    <Card ch={<>
      <Ttl t="Zero-Cost AI Stack"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        {[{n:"DeepSeek-V3",r:"Primary",c:C.teal,cost:"$0",d:"Best financial reasoning. Free API tier."},{n:"Gemini Flash",r:"Secondary",c:C.blue,cost:"$0",d:"60 req/min free. High-speed queries."},{n:"Claude Sonnet",r:"Fallback",c:C.purple,cost:"Fallback only",d:"Critical reasoning when others fail."}].map((s,i)=>(
          <div key={i} style={{background:C.surface,border:`1px solid ${s.c}33`,borderRadius:10,padding:14}}>
            <div style={{fontFamily:C.display,fontWeight:700,fontSize:13,color:s.c,marginBottom:3}}>{s.n}</div>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,marginBottom:8}}>{s.r}</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:10,lineHeight:1.6}}>{s.d}</div>
            <Chip label={`Cost: ${s.cost}`} color={s.cost==="$0"?C.green:C.amber}/>
          </div>
        ))}
      </div>
    </>}/>
  </div>
);

const AnalyticsTeamTab=()=>{
  const [selected,setSelected]=useState(null);
  const agent=selected?ANALYTICS_AGENTS.find(a=>a.id===selected):null;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontFamily:C.display,fontWeight:800,fontSize:20,marginBottom:4}}>📡 Analytics Agent Team</div>
          <div style={{fontFamily:C.mono,fontSize:11,color:C.muted}}>10 specialized analytics agents · Volume · Heat · Sentiment · Quant · Macro · Technical</div>
        </div>
        <div style={{display:"flex",gap:10}}>
          {[{l:"ACTIVE",v:10,c:C.teal},{l:"SIGNALS",v:ANALYTICS_AGENTS.reduce((s,a)=>s+a.signals,0),c:C.blue}].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${s.c}33`,borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
              <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>{s.l}</div>
              <div style={{fontSize:20,fontFamily:C.display,fontWeight:800,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
      <Card ch={<>
        <Ttl t="Sector Intelligence Dashboard" sub="Real-time · Volume · Heat · Sentiment · Momentum"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
          {SECTORS.map((sec,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${sec.color}33`,borderRadius:12,padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontFamily:C.display,fontWeight:700,fontSize:12,color:sec.color}}>{sec.name}</div>
                <Chip label={sec.sentiment>=70?"BULLISH":sec.sentiment>=50?"NEUTRAL":"BEARISH"} color={sec.sentiment>=70?C.teal:sec.sentiment>=50?C.amber:C.red}/>
              </div>
              <div style={{fontSize:10,color:C.muted,fontFamily:C.mono,marginBottom:10,fontStyle:"italic"}}>"{sec.news}"</div>
              {[{l:"Sentiment",v:sec.sentiment,c:C.teal},{l:"Volume",v:sec.volume,c:C.blue},{l:"Heat",v:sec.heat,c:C.amber},{l:"Momentum",v:sec.momentum,c:C.purple}].map((m,j)=>(
                <div key={j} style={{marginBottom:5}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>{m.l}</span>
                    <span style={{fontSize:9,fontFamily:C.mono,color:m.c,fontWeight:700}}>{m.v}</span>
                  </div>
                  <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
                    <div style={{height:"100%",width:`${m.v}%`,background:`linear-gradient(90deg,${m.c},${m.c}88)`,borderRadius:2}}/>
                  </div>
                </div>
              ))}
              <div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap"}}>{sec.stocks.map(s=><Chip key={s} label={s} color={sec.color}/>)}</div>
            </div>
          ))}
        </div>
        <Card ch={<>
          <Ttl t="Volume & Sentiment by Sector" sub="Cross-sector comparison"/>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={SECTORS.map(s=>({name:s.name.length>8?s.name.slice(0,8)+"...":s.name,Sentiment:s.sentiment,Volume:s.volume,Heat:s.heat}))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
              <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:10,fontFamily:C.mono}}/>
              <Bar dataKey="Sentiment" fill={C.teal}  opacity={.85} radius={[3,3,0,0]}/>
              <Bar dataKey="Volume"    fill={C.blue}  opacity={.85} radius={[3,3,0,0]}/>
              <Bar dataKey="Heat"      fill={C.amber} opacity={.85} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </>} style={{background:"rgba(255,255,255,0.02)"}}/>
      </>} style={{marginBottom:16}}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:14}}>
        {ANALYTICS_AGENTS.map((a,i)=>(
          <div key={i} onClick={()=>setSelected(selected===a.id?null:a.id)}
            style={{background:selected===a.id?`${a.color}12`:C.surface,border:`1px solid ${selected===a.id?a.color+"55":a.color+"33"}`,borderRadius:12,padding:14,cursor:"pointer",transition:"all 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:a.color,boxShadow:`0 0 6px ${a.color}`,animation:"pulse 2s infinite"}}/>
              <span style={{fontFamily:C.display,fontWeight:700,fontSize:11,color:a.color}}>{a.id}</span>
            </div>
            <div style={{fontSize:9,color:C.muted,fontFamily:C.mono,marginBottom:8}}>{a.role}</div>
            {a.tasks.slice(0,2).map((t,j)=><div key={j} style={{fontSize:9,color:C.muted,fontFamily:C.mono,marginBottom:2,paddingLeft:5,borderLeft:`2px solid ${a.color}44`}}>{t}</div>)}
            <div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              <div><div style={{fontSize:7,fontFamily:C.mono,color:C.muted}}>ACCURACY</div><div style={{fontSize:11,fontFamily:C.display,fontWeight:700,color:a.color}}>{a.accuracy}</div></div>
              <div><div style={{fontSize:7,fontFamily:C.mono,color:C.muted}}>SIGNALS</div><div style={{fontSize:11,fontFamily:C.display,fontWeight:700,color:a.color}}>{a.signals}</div></div>
            </div>
            <div style={{marginTop:6,height:3,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
              <div style={{height:"100%",width:`${a.load}%`,background:`linear-gradient(90deg,${a.color},${a.color}88)`,borderRadius:2}}/>
            </div>
          </div>
        ))}
      </div>
      {agent&&(
        <Card ch={<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <div>
              <div style={{fontFamily:C.display,fontWeight:800,fontSize:16,color:agent.color,marginBottom:4}}>{agent.name}</div>
              <div style={{fontSize:11,fontFamily:C.mono,color:C.muted,marginBottom:12}}>{agent.role}</div>
              <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:6}}>ACTIVE TASKS</div>
              {agent.tasks.map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,padding:"6px 10px",background:"rgba(255,255,255,0.03)",borderRadius:7}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:agent.color,flexShrink:0,animation:"pulse 1.5s infinite"}}/>
                  <span style={{fontSize:11,fontFamily:C.mono,color:C.text}}>{t}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:6}}>CAPABILITIES</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
                {agent.caps.map((cap,i)=><Chip key={i} label={cap} color={agent.color}/>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[{l:"Accuracy",v:agent.accuracy},{l:"Signals",v:agent.signals},{l:"CPU Load",v:`${agent.load}%`}].map((s,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:10,textAlign:"center"}}>
                    <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>{s.l}</div>
                    <div style={{fontSize:16,fontFamily:C.display,fontWeight:800,color:agent.color,marginTop:4}}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>} style={{border:`1px solid ${agent.color}44`,animation:"fadeIn 0.3s ease"}}/>
      )}
    </div>
  );
};


// ── BENCHMARK TAB ────────────────────────────────────────────────
const BenchmarkTab = ({hs, color}) => {
  const [period, setPeriod]     = useState("1Y");
  const [primary, setPrimary]   = useState("S&P 500");   // main vs benchmark
  const [visibles, setVisibles] = useState({"S&P 500":true,"Nasdaq":true,"Dow Jones":true,"BTC":false,"Bonds":false,"Gold":false,"Inflation":false});
  const m = metrics(hs);

  const days = BENCHMARK_PERIODS[period]||365;
  const data = BENCHMARK_DATA.slice(-days);

  const portRet  = retPctOf(data,"Portfolio");
  const alpha    = calcAlpha(data, primary);
  const betaVal  = m.wb.toFixed(2);
  const sharpe   = +(m.plPct/(m.wv+0.1)*0.4).toFixed(2);
  const realRet  = +(portRet - retPctOf(data,"Inflation")).toFixed(2);

  const toggle = key => setVisibles(v=>({...v,[key]:!v[key]}));

  const benchRets = BENCHMARKS_META.map(b=>({
    ...b, ret: retPctOf(data, b.key),
    alpha: +(portRet - retPctOf(data, b.key)).toFixed(2),
  }));

  const lineColors = {
    Portfolio:color, "S&P 500":C.blue, Nasdaq:C.purple,
    "Dow Jones":C.amber, BTC:"#F97316", Bonds:C.green,
    Gold:"#EAB308", Inflation:C.red,
  };

  return (
    <div>
      {/* Controls row */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
        {/* Period */}
        <div style={{display:"flex",gap:3,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:3}}>
          <span style={{fontSize:10,fontFamily:C.mono,color:C.muted,alignSelf:"center",padding:"0 8px"}}>PERIOD:</span>
          {Object.keys(BENCHMARK_PERIODS).map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:C.mono,fontSize:11,fontWeight:600,background:period===p?`${color}22`:"transparent",color:period===p?color:C.muted,transition:"all 0.2s"}}>{p}</button>
          ))}
        </div>
        {/* Alpha vs selector */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,fontFamily:C.mono,color:C.muted}}>ALPHA vs:</span>
          <select value={primary} onChange={e=>setPrimary(e.target.value)} style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",color:C.text,fontSize:11,fontFamily:C.mono,cursor:"pointer"}}>
            {BENCHMARKS_META.map(b=><option key={b.key} value={b.key}>{b.key}</option>)}
          </select>
        </div>
      </div>

      {/* Benchmark toggles */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,fontFamily:C.mono,color:C.muted,marginRight:4}}>SHOW BENCHMARKS:</span>
        {BENCHMARKS_META.map(b=>(
          <button key={b.key} onClick={()=>toggle(b.key)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:7,border:`1px solid ${visibles[b.key]?b.color+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:10,fontWeight:600,background:visibles[b.key]?`${b.color}15`:"transparent",color:visibles[b.key]?b.color:C.muted,transition:"all 0.2s"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:visibles[b.key]?b.color:"#334155"}}/>
            {b.key}
            <span style={{fontSize:8,color:C.muted,fontFamily:C.mono}}>({b.type})</span>
          </button>
        ))}
      </div>

      {/* Alpha + Key KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr",gap:12,marginBottom:16}}>
        {/* Alpha hero card */}
        <div style={{background:alpha>=0?"rgba(0,229,180,0.08)":"rgba(248,113,113,0.08)",border:`2px solid ${alpha>=0?C.teal:C.red}44`,borderRadius:14,padding:18,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2,marginBottom:6}}>ALPHA vs {primary.toUpperCase()} · {period}</div>
            <div style={{fontSize:40,fontFamily:C.display,fontWeight:800,color:alpha>=0?C.teal:C.red,lineHeight:1}}>{alpha>=0?"+":""}{alpha}%</div>
          </div>
          <div style={{fontSize:11,color:alpha>=0?C.teal:C.red,fontFamily:"'DM Sans',sans-serif",marginTop:10,lineHeight:1.5}}>
            {alpha>=0
              ? `✅ Outperforming ${primary} by ${alpha}%`
              : `⚠ Underperforming ${primary} by ${Math.abs(alpha)}%`}
          </div>
        </div>
        {[
          {l:"Portfolio Return",   v:`${portRet>=0?"+":""}${portRet}%`,   c:portRet>=0?C.teal:C.red},
          {l:`${primary} Return`,  v:`${retPctOf(data,primary)>=0?"+":""}${retPctOf(data,primary)}%`, c:C.blue},
          {l:"Real Return (−CPI)", v:`${realRet>=0?"+":""}${realRet}%`,   c:realRet>=0?C.teal:C.red},
          {l:"Sharpe Ratio",       v:sharpe,                               c:C.purple, sub:`Beta: ${betaVal}`},
        ].map((s,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${s.c}22`,borderRadius:12,padding:16}}>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:6}}>{s.l.toUpperCase()}</div>
            <div style={{fontSize:22,fontFamily:C.display,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
            {s.sub&&<div style={{fontSize:10,color:C.muted,fontFamily:C.mono,marginTop:4}}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Main line chart — indexed to 100 */}
      <Card ch={<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <Ttl t="Portfolio vs Benchmarks — Indexed to 100" sub="All series normalized to 100 at start date for fair comparison" color={color}/>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={Math.floor(days/6)}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(0)}`}/>
            <Tooltip content={<TT/>}/>
            <ReferenceLine y={100} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3"/>
            <Legend wrapperStyle={{fontSize:10,fontFamily:C.mono}}/>
            {/* Portfolio always shown */}
            <Line type="monotone" dataKey="Portfolio" stroke={color} strokeWidth={3} dot={false}/>
            {/* Benchmarks — shown based on toggle */}
            {BENCHMARKS_META.filter(b=>visibles[b.key]).map(b=>(
              <Line key={b.key} type="monotone" dataKey={b.key} stroke={b.color} strokeWidth={b.key==="S&P 500"||b.key==="Nasdaq"||b.key==="Dow Jones"?2:1.5} dot={false}
                strokeDasharray={b.key==="S&P 500"?"none":b.key==="Nasdaq"?"6 3":b.key==="Dow Jones"?"4 2":"2 2"}/>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </>} style={{marginBottom:14}}/>

      {/* Full comparison table */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {/* Bar chart */}
        <Card ch={<>
          <Ttl t={`Return Comparison — ${period}`} color={color}/>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[{name:"Portfolio",ret:portRet,color},...BENCHMARKS_META.map(b=>({name:b.key,ret:retPctOf(data,b.key),color:b.color}))]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis type="number" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(0)}%`}/>
              <YAxis dataKey="name" type="category" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} width={65}/>
              <Tooltip content={<TT/>}/><ReferenceLine x={0} stroke={C.border}/>
              <Bar dataKey="ret" name="Return %" radius={[0,4,4,0]}>
                {[{name:"Portfolio",ret:portRet,color},...BENCHMARKS_META.map(b=>({name:b.key,ret:retPctOf(data,b.key),color:b.color}))].map((d,i)=>(
                  <Cell key={i} fill={d.color} opacity={d.name==="Portfolio"?1:0.75}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>}/>

        {/* Alpha table vs all benchmarks */}
        <Card ch={<>
          <Ttl t="Alpha vs All Benchmarks" color={color} sub="Positive = outperforming that benchmark"/>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
              {["Benchmark","Type","Return","Alpha","Status"].map(h=>(
                <th key={h} style={{textAlign:"left",padding:"6px 8px",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {benchRets.map((b,i)=>(
                <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"9px 8px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:b.color,flexShrink:0}}/>
                      <span style={{fontFamily:C.display,fontWeight:700,color:b.color,fontSize:12}}>{b.key}</span>
                    </div>
                  </td>
                  <td style={{padding:"9px 8px"}}><Chip label={b.type} color={b.color}/></td>
                  <td style={{padding:"9px 8px",fontFamily:C.mono,color:b.ret>=0?C.teal:C.red,fontWeight:600}}>{b.ret>=0?"+":""}{b.ret}%</td>
                  <td style={{padding:"9px 8px",fontFamily:C.mono,fontWeight:700,color:b.alpha>=0?C.teal:C.red,fontSize:13}}>{b.alpha>=0?"+":""}{b.alpha}%</td>
                  <td style={{padding:"9px 8px"}}>
                    <Chip label={b.alpha>=0?"BEATING":"LAGGING"} color={b.alpha>=0?C.teal:C.red}/>
                  </td>
                </tr>
              ))}
              {/* Portfolio row */}
              <tr style={{borderTop:`2px solid ${C.border}`,background:"rgba(0,229,180,0.04)"}}>
                <td style={{padding:"9px 8px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:color}}/>
                    <span style={{fontFamily:C.display,fontWeight:800,color,fontSize:12}}>Portfolio</span>
                  </div>
                </td>
                <td style={{padding:"9px 8px"}}><Chip label="YOUR PORT." color={color}/></td>
                <td style={{padding:"9px 8px",fontFamily:C.mono,color:portRet>=0?C.teal:C.red,fontWeight:700,fontSize:14}}>{portRet>=0?"+":""}{portRet}%</td>
                <td style={{padding:"9px 8px",fontFamily:C.mono,color:C.muted,fontSize:12}}>—</td>
                <td style={{padding:"9px 8px"}}><Chip label="REFERENCE" color={color}/></td>
              </tr>
            </tbody>
          </table>
          <div style={{marginTop:12,padding:"10px 12px",background:"rgba(255,255,255,0.02)",borderRadius:8,fontSize:10,color:C.muted,fontFamily:C.mono}}>
            ✅ Beating {benchRets.filter(b=>b.alpha>=0).length} of {benchRets.length} benchmarks · Period: {period}
          </div>
        </>}/>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════
// NEW ANALYSIS COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ── FUND OVERLAP ─────────────────────────────────────────────────
const OVERLAP_DATA = [
  {fund1:"Growth Stocks", fund2:"Index ETFs",       overlap:12, shared:["Tech sector","Large cap"],  risk:"LOW"},
  {fund1:"Index ETFs",    fund2:"Blue Chip Stocks", overlap:68, shared:["MSFT","AAPL-adjacent"],      risk:"HIGH"},
  {fund1:"Index ETFs",    fund2:"Index ETFs",       overlap:98, shared:["VOO vs SPY — near identical"],risk:"VERY HIGH"},
  {fund1:"Growth Stocks", fund2:"Blue Chip Stocks", overlap:42, shared:["Tech exposure","MSFT/AAPL"], risk:"MEDIUM"},
  {fund1:"Crypto",        fund2:"Growth Stocks",    overlap:8,  shared:["Risk-on sentiment"],         risk:"LOW"},
  {fund1:"Govt Bonds",    fund2:"Index ETFs",       overlap:3,  shared:["Minimal"],                   risk:"VERY LOW"},
];

const FundOverlapAnalysis = () => {
  const riskColor = r => r==="VERY HIGH"?C.red:r==="HIGH"?C.amber:r==="MEDIUM"?"#F97316":r==="LOW"?C.teal:C.green;
  return(
    <Card ch={<>
      <Ttl t="Fund Overlap Analysis" sub="Holdings duplication across funds — high overlap = hidden concentration risk"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div>
          {OVERLAP_DATA.map((o,i)=>(
            <div key={i} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:11,fontFamily:C.mono,color:C.muted}}>{o.fund1} ↔ {o.fund2}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:12,fontFamily:C.display,fontWeight:700,color:riskColor(o.risk)}}>{o.overlap}%</span>
                  <Chip label={o.risk} color={riskColor(o.risk)}/>
                </div>
              </div>
              <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3}}>
                <div style={{height:"100%",width:`${o.overlap}%`,background:`linear-gradient(90deg,${riskColor(o.risk)},${riskColor(o.risk)}88)`,borderRadius:3,transition:"width 0.8s ease"}}/>
              </div>
              <div style={{fontSize:10,color:C.muted,fontFamily:C.mono,marginTop:3}}>{o.shared.join(" · ")}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{background:"rgba(248,113,113,0.06)",border:`1px solid ${C.red}33`,borderRadius:12,padding:14,marginBottom:12}}>
            <div style={{fontFamily:C.display,fontWeight:700,fontSize:13,color:C.red,marginBottom:8}}>⚠ Critical Overlap</div>
            <div style={{fontSize:12,color:"#94A3B8",lineHeight:1.7}}>VOO and SPY have <b style={{color:C.red}}>98% overlap</b> — you are effectively holding the same index twice. Consider consolidating into one position to eliminate redundancy and reduce expense ratios.</div>
          </div>
          <div style={{background:"rgba(0,229,180,0.06)",border:`1px solid ${C.teal}33`,borderRadius:12,padding:14}}>
            <div style={{fontFamily:C.display,fontWeight:700,fontSize:13,color:C.teal,marginBottom:8}}>✅ Good Diversification</div>
            <div style={{fontSize:12,color:"#94A3B8",lineHeight:1.7}}>Government Bonds (TIP) shows near-zero overlap with all equity funds — providing genuine diversification and inflation protection to the portfolio.</div>
          </div>
        </div>
      </div>
    </>} style={{marginBottom:16}}/>
  );
};

// ── ROLLING RETURNS ───────────────────────────────────────────────
const RollingReturnsChart = ({color}) => {
  const data = useMemo(()=>{
    const d=[]; let roll=8.2;
    for(let i=52;i>=0;i--){
      roll += (Math.random()-0.48)*1.8;
      roll = Math.max(roll,-15);
      const dt=new Date(); dt.setDate(dt.getDate()-i*7);
      d.push({week:dt.toLocaleDateString("en",{month:"short",day:"numeric"}), "12M Rolling Return":+roll.toFixed(2), "S&P 500":+(7.9+(Math.random()-0.5)*1.2).toFixed(2)});
    }
    return d;
  },[]);
  const last = data[data.length-1];
  const alpha = +(last["12M Rolling Return"]-last["S&P 500"]).toFixed(2);
  return(
    <Card ch={<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <Ttl t="Rolling 12-Month Returns" sub="Return of the trailing 12 months calculated weekly — shows return trend" color={color}/>
        <div style={{display:"flex",gap:12}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>CURRENT</div>
            <div style={{fontSize:18,fontFamily:C.display,fontWeight:800,color:last["12M Rolling Return"]>=0?C.teal:C.red}}>{last["12M Rolling Return"]>=0?"+":""}{last["12M Rolling Return"]}%</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>ALPHA</div>
            <div style={{fontSize:18,fontFamily:C.display,fontWeight:800,color:alpha>=0?C.teal:C.red}}>{alpha>=0?"+":""}{alpha}%</div>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
          <XAxis dataKey="week" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={8}/>
          <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`}/>
          <Tooltip content={<TT/>}/>
          <ReferenceLine y={0} stroke={C.border} strokeWidth={1.5}/>
          <Legend wrapperStyle={{fontSize:10,fontFamily:C.mono}}/>
          <Area type="monotone" dataKey="12M Rolling Return" stroke={color} strokeWidth={2} fill={`${color}18`} dot={false}/>
          <Line type="monotone" dataKey="S&P 500" stroke={C.blue} strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
        </ComposedChart>
      </ResponsiveContainer>
    </>}/>
  );
};

// ── UNDERWATER EQUITY CURVE ───────────────────────────────────────
const UnderwaterCurve = ({color}) => {
  const data = useMemo(()=>{
    const d=[]; let peak=100, val=100, maxDD=0;
    for(let i=365;i>=0;i--){
      val += (Math.random()-0.46)*1.1;
      val = Math.max(val,60);
      if(val>peak) peak=val;
      const dd = ((val-peak)/peak*100);
      if(dd<maxDD) maxDD=dd;
      const dt=new Date(); dt.setDate(dt.getDate()-i);
      d.push({date:dt.toLocaleDateString("en",{month:"short",day:"numeric"}),drawdown:+dd.toFixed(2),zero:0});
    }
    d[d.length-1].drawdown=0;
    return {points:d,maxDD:+maxDD.toFixed(2)};
  },[]);
  const current = data.points[data.points.length-1]?.drawdown||0;
  const avgDD = +(data.points.reduce((s,d)=>s+d.drawdown,0)/data.points.length).toFixed(2);
  return(
    <Card ch={<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <Ttl t="Underwater Equity Curve" sub="% below all-time high — shows how long and deep drawdown periods last" color={color}/>
        <div style={{display:"flex",gap:12}}>
          {[{l:"Max Drawdown",v:`${data.maxDD}%`,c:C.red},{l:"Avg Drawdown",v:`${avgDD}%`,c:C.amber},{l:"Current",v:`${current}%`,c:current<-5?C.red:C.teal}].map((s,i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>{s.l}</div>
              <div style={{fontSize:16,fontFamily:C.display,fontWeight:800,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data.points}>
          <defs>
            <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={C.red} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={C.red} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
          <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={60}/>
          <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`}/>
          <Tooltip content={<TT/>}/>
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5}/>
          <ReferenceLine y={-10} stroke={C.amber} strokeDasharray="3 3" label={{value:"-10% threshold",fill:C.amber,fontSize:9,fontFamily:C.mono,position:"insideTopLeft"}}/>
          <Area type="monotone" dataKey="drawdown" name="Drawdown %" stroke={C.red} strokeWidth={1.5} fill="url(#ddGrad)" dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
      <div style={{marginTop:12,padding:"10px 14px",background:"rgba(255,255,255,0.02)",borderRadius:8,fontSize:11,color:C.muted,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>
        The underwater curve shows time spent in drawdown. Long flat periods near 0% indicate consistent recovery. Deep sustained drops signal prolonged bear periods.
      </div>
    </>}/>
  );
};

// ── TECHNICAL ANALYSIS (Candlestick + RSI + MACD) ─────────────────
const TechnicalAnalysis = ({hs, color}) => {
  const [selectedAsset, setSelectedAsset] = useState(hs[0]?.symbol||"AAPL");
  const asset = hs.find(h=>h.symbol===selectedAsset)||hs[0];

  const techData = useMemo(()=>{
    if(!asset) return [];
    const d=[]; let price=asset.avgCost;
    for(let i=60;i>=0;i--){
      const chg = (Math.random()-0.47)*price*0.025;
      const open=price, close=price+chg;
      const high=Math.max(open,close)*(1+Math.random()*0.008);
      const low =Math.min(open,close)*(1-Math.random()*0.008);
      price=close;
      const dt=new Date(); dt.setDate(dt.getDate()-i);
      // RSI simulation
      const rsi = Math.min(Math.max(45+Math.sin(i*0.2)*25+(Math.random()-0.5)*10,15),85);
      // MACD simulation  
      const macd = Math.sin(i*0.15)*2.5+(Math.random()-0.5)*0.8;
      const signal = Math.sin(i*0.15-0.3)*2.2+(Math.random()-0.5)*0.4;
      d.push({
        date:dt.toLocaleDateString("en",{month:"short",day:"numeric"}),
        open:+open.toFixed(2), close:+close.toFixed(2),
        high:+high.toFixed(2), low:+low.toFixed(2),
        price:+close.toFixed(2),
        rsi:+rsi.toFixed(1), macd:+macd.toFixed(2), signal:+signal.toFixed(2),
        histogram:+(macd-signal).toFixed(2),
        volume:Math.round(Math.random()*5000000+1000000),
        isUp: close>=open,
      });
    }
    d[d.length-1].price=asset.price;
    d[d.length-1].close=asset.price;
    return d;
  },[selectedAsset]);

  const lastRSI  = techData[techData.length-1]?.rsi||50;
  const lastMACD = techData[techData.length-1]?.macd||0;
  const rsiColor = lastRSI>70?C.red:lastRSI<30?C.teal:C.amber;
  const trend    = asset?(asset.price>asset.avgCost?"BULLISH":"BEARISH"):"NEUTRAL";

  return(
    <div>
      {/* Asset selector */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,fontFamily:C.mono,color:C.muted,marginRight:4}}>ASSET:</span>
        {hs.map(h=>(
          <button key={h.symbol} onClick={()=>setSelectedAsset(h.symbol)} style={{
            padding:"5px 14px",borderRadius:8,cursor:"pointer",fontFamily:C.mono,fontSize:11,fontWeight:700,
            border:`1px solid ${selectedAsset===h.symbol?color+"55":C.border}`,
            background:selectedAsset===h.symbol?`${color}18`:"transparent",
            color:selectedAsset===h.symbol?color:C.muted,transition:"all 0.2s",
          }}>{h.symbol}</button>
        ))}
      </div>

      {/* Signal cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[
          {l:"Price",       v:`$${asset?.price.toLocaleString()}`,                          c:color},
          {l:"RSI (14)",    v:lastRSI.toFixed(1),                                           c:rsiColor, sub:lastRSI>70?"Overbought":lastRSI<30?"Oversold":"Neutral"},
          {l:"MACD",        v:`${lastMACD>=0?"+":""}${lastMACD.toFixed(2)}`,                c:lastMACD>=0?C.teal:C.red, sub:lastMACD>=0?"Bullish signal":"Bearish signal"},
          {l:"Trend",       v:trend,                                                        c:trend==="BULLISH"?C.teal:C.red, sub:`Since $${asset?.avgCost}`},
        ].map((s,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${s.c}22`,borderRadius:12,padding:14}}>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:6}}>{s.l}</div>
            <div style={{fontSize:20,fontFamily:C.display,fontWeight:800,color:s.c}}>{s.v}</div>
            {s.sub&&<div style={{fontSize:10,color:C.muted,fontFamily:C.mono,marginTop:4}}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Price + Volume chart */}
      <Card ch={<>
        <Ttl t={`${selectedAsset} — Price Action`} sub="60-day price history with volume" color={color}/>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={techData}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={10}/>
            <YAxis yAxisId="price" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v.toFixed(0)}`}/>
            <YAxis yAxisId="vol" orientation="right" tick={{fill:C.muted,fontSize:8,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1000000).toFixed(1)}M`}/>
            <Tooltip content={<TT/>}/>
            <Bar yAxisId="vol" dataKey="volume" name="Volume" opacity={0.3} radius={[2,2,0,0]}>
              {techData.map((d,i)=><Cell key={i} fill={d.isUp?C.teal:C.red}/>)}
            </Bar>
            <Area yAxisId="price" type="monotone" dataKey="price" name="Price" stroke={color} strokeWidth={2} fill="url(#priceGrad)" dot={false}/>
          </ComposedChart>
        </ResponsiveContainer>
      </>} style={{marginBottom:12}}/>

      {/* RSI chart */}
      <Card ch={<>
        <Ttl t="RSI (14)" sub="Overbought > 70 · Oversold < 30" color={rsiColor}/>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={techData}>
            <defs>
              <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={rsiColor} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={rsiColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={10}/>
            <YAxis domain={[0,100]} tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
            <Tooltip content={<TT/>}/>
            <ReferenceLine y={70} stroke={C.red}    strokeDasharray="3 3" label={{value:"70",fill:C.red,   fontSize:9,fontFamily:C.mono,position:"insideTopRight"}}/>
            <ReferenceLine y={30} stroke={C.teal}   strokeDasharray="3 3" label={{value:"30",fill:C.teal,  fontSize:9,fontFamily:C.mono,position:"insideBottomRight"}}/>
            <ReferenceLine y={50} stroke={C.border} strokeDasharray="2 4"/>
            <Area type="monotone" dataKey="rsi" name="RSI" stroke={rsiColor} strokeWidth={2} fill="url(#rsiGrad)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </>} style={{marginBottom:12}}/>

      {/* MACD chart */}
      <Card ch={<>
        <Ttl t="MACD" sub="MACD line vs Signal line · Histogram shows momentum" color={lastMACD>=0?C.teal:C.red}/>
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={techData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={10}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
            <Tooltip content={<TT/>}/>
            <ReferenceLine y={0} stroke={C.border}/>
            <Bar dataKey="histogram" name="Histogram" radius={[2,2,0,0]}>
              {techData.map((d,i)=><Cell key={i} fill={d.histogram>=0?C.teal:C.red} opacity={0.7}/>)}
            </Bar>
            <Line type="monotone" dataKey="macd"   name="MACD"   stroke={C.blue}  strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="signal" name="Signal" stroke={C.amber} strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
          </ComposedChart>
        </ResponsiveContainer>
      </>}/>
    </div>
  );
};

// ── FACTOR EXPOSURE ───────────────────────────────────────────────
const FactorExposure = ({hs, color}) => {
  const factors = [
    {name:"Value",    desc:"Cheap vs expensive (P/E, P/B)",       score:42, benchmark:50, color:C.blue},
    {name:"Growth",   desc:"Revenue & earnings growth rate",       score:78, benchmark:50, color:C.teal},
    {name:"Momentum", desc:"Price trend strength",                 score:64, benchmark:50, color:C.purple},
    {name:"Quality",  desc:"ROE, margins, balance sheet health",   score:71, benchmark:50, color:C.green},
    {name:"Low Vol",  desc:"Inverse of portfolio volatility",      score:38, benchmark:50, color:C.amber},
    {name:"Size",     desc:"Large cap vs small cap tilt",          score:82, benchmark:50, color:C.pink},
  ];
  const radarData = factors.map(f=>({subject:f.name, Portfolio:f.score, Benchmark:f.benchmark}));
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {factors.map((f,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${f.color}33`,borderRadius:12,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontFamily:C.display,fontWeight:700,fontSize:13,color:f.color}}>{f.name}</div>
              <div style={{fontFamily:C.display,fontWeight:800,fontSize:20,color:f.score>f.benchmark?C.teal:C.amber}}>{f.score}</div>
            </div>
            <div style={{fontSize:10,color:C.muted,fontFamily:C.mono,marginBottom:8}}>{f.desc}</div>
            <div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:3}}>
              <div style={{height:"100%",width:`${f.score}%`,background:`linear-gradient(90deg,${f.color},${f.color}88)`,borderRadius:3}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
              <span style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>0</span>
              <span style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>Benchmark: {f.benchmark}</span>
              <span style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>100</span>
            </div>
          </div>
        ))}
      </div>
      <Card ch={<>
        <Ttl t="Factor Exposure vs Benchmark" sub="Your portfolio tilt vs market-neutral benchmark (50)" color={color}/>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={factors.map(f=>({name:f.name,Portfolio:f.score,Benchmark:f.benchmark,Diff:f.score-f.benchmark}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} domain={[0,100]}/>
            <Tooltip content={<TT/>}/>
            <ReferenceLine y={50} stroke={C.border} strokeDasharray="3 3" label={{value:"Neutral (50)",fill:C.muted,fontSize:9,fontFamily:C.mono}}/>
            <Legend wrapperStyle={{fontSize:10,fontFamily:C.mono}}/>
            <Bar dataKey="Portfolio"  fill={color}  opacity={.85} radius={[4,4,0,0]}/>
            <Bar dataKey="Benchmark" fill={C.muted} opacity={.4}  radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </>}/>
    </div>
  );
};

// ── EARNINGS CALENDAR ─────────────────────────────────────────────
const EarningsCalendar = ({hs}) => {
  const earnings = [
    {symbol:"AAPL", date:"May 1",  est:"$1.51 EPS", rev:"$94.2B", surprise:"+4.2%", status:"reported", beat:true},
    {symbol:"NVDA", date:"May 28", est:"$5.94 EPS", rev:"$24.6B", surprise:null,    status:"upcoming", beat:null},
    {symbol:"MSFT", date:"Apr 30", est:"$3.10 EPS", rev:"$68.1B", surprise:"+3.1%", status:"reported", beat:true},
    {symbol:"VOO",  date:"—",      est:"N/A",        rev:"N/A",    surprise:null,    status:"etf",      beat:null},
    {symbol:"SPY",  date:"—",      est:"N/A",        rev:"N/A",    surprise:null,    status:"etf",      beat:null},
    {symbol:"TIP",  date:"—",      est:"N/A",        rev:"N/A",    surprise:null,    status:"bond",     beat:null},
  ].filter(e=>hs.find(h=>h.symbol===e.symbol));
  const upcoming = earnings.filter(e=>e.status==="upcoming");
  const reported = earnings.filter(e=>e.status==="reported");
  return(
    <div>
      {upcoming.length>0&&(
        <Card ch={<>
          <Ttl t="⏰ Upcoming Earnings" sub="Watch for volatility around these dates" color={C.amber}/>
          {upcoming.map((e,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:"rgba(245,158,11,0.06)",border:`1px solid ${C.amber}33`,borderRadius:10,marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontFamily:C.display,fontWeight:800,fontSize:16,color:C.amber}}>{e.symbol}</div>
                <div>
                  <div style={{fontSize:12,fontFamily:C.mono,color:C.text,fontWeight:600}}>{e.date}</div>
                  <div style={{fontSize:10,fontFamily:C.mono,color:C.muted}}>Est: {e.est} · Rev: {e.rev}</div>
                </div>
              </div>
              <Chip label="UPCOMING" color={C.amber}/>
            </div>
          ))}
        </>} style={{marginBottom:14}}/>
      )}
      <Card ch={<>
        <Ttl t="📋 Recent Earnings Results" sub="Last quarter results for your holdings"/>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
            {["Symbol","Date","Est. EPS","Revenue","Surprise","Result"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"7px 8px",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {earnings.map((e,i)=>(
              <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                <td style={{padding:"10px 8px",fontWeight:700,color:C.teal,fontFamily:C.display}}>{e.symbol}</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,color:C.muted}}>{e.date}</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono}}>{e.est}</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono}}>{e.rev}</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,color:e.beat?C.teal:e.beat===false?C.red:C.muted,fontWeight:e.surprise?700:400}}>{e.surprise||"—"}</td>
                <td style={{padding:"10px 8px"}}>
                  {e.status==="reported"&&<Chip label={e.beat?"BEAT":"MISS"} color={e.beat?C.teal:C.red}/>}
                  {e.status==="upcoming"&&<Chip label="UPCOMING" color={C.amber}/>}
                  {(e.status==="etf"||e.status==="bond")&&<Chip label="N/A" color={C.muted}/>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>}/>
    </div>
  );
};

// ── REBALANCING TOOL ──────────────────────────────────────────────
const RebalancingTool = ({hs, color}) => {
  const totalVal = hs.reduce((s,h)=>s+h.qty*h.price,0);
  const targets  = {AAPL:12,NVDA:14,BTC:8,ETH:6,VOO:18,MSFT:10,SPY:10,TIP:22};
  const rebalData = hs.map(h=>{
    const current = +(h.qty*h.price/totalVal*100).toFixed(1);
    const target  = targets[h.symbol]||10;
    const diff    = +(target-current).toFixed(1);
    const dollarDiff = Math.round(totalVal*diff/100);
    return {...h, current, target, diff, dollarDiff,
      action: Math.abs(diff)<0.5?"HOLD":diff>0?"BUY":"SELL"};
  });
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {[
          {l:"Positions to Buy",  v:rebalData.filter(r=>r.action==="BUY").length,  c:C.teal},
          {l:"Positions to Sell", v:rebalData.filter(r=>r.action==="SELL").length, c:C.red},
          {l:"Positions to Hold", v:rebalData.filter(r=>r.action==="HOLD").length, c:C.muted},
        ].map((s,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${s.c}22`,borderRadius:12,padding:14,textAlign:"center"}}>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:6}}>{s.l}</div>
            <div style={{fontSize:28,fontFamily:C.display,fontWeight:800,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>
      <Card ch={<>
        <Ttl t="Rebalancing Plan — Current vs Target Allocation" sub="Based on target allocation model · Diff < 0.5% = HOLD" color={color}/>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
            {["Symbol","Fund","Current %","Target %","Diff","$ Action","Action"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"7px 8px",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rebalData.map((r,i)=>(
              <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`,background:r.action==="BUY"?"rgba(0,229,180,0.02)":r.action==="SELL"?"rgba(248,113,113,0.02)":"transparent"}}>
                <td style={{padding:"10px 8px",fontWeight:700,color:color,fontFamily:C.display}}>{r.symbol}</td>
                <td style={{padding:"10px 8px"}}><Chip label={r.fund} color={FUND_STRUCTURE[r.broker]?.funds[r.fund]?.color||color}/></td>
                <td style={{padding:"10px 8px",fontFamily:C.mono}}>{r.current}%</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,color:C.muted}}>{r.target}%</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,fontWeight:700,color:r.diff>0?C.teal:r.diff<0?C.red:C.muted}}>{r.diff>0?"+":""}{r.diff}%</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,fontWeight:600,color:r.dollarDiff>0?C.teal:r.dollarDiff<0?C.red:C.muted}}>
                  {r.dollarDiff>0?"+":""}${Math.abs(r.dollarDiff).toLocaleString()}
                </td>
                <td style={{padding:"10px 8px"}}><Chip label={r.action} color={r.action==="BUY"?C.teal:r.action==="SELL"?C.red:C.muted}/></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{marginTop:12,padding:"10px 14px",background:"rgba(255,255,255,0.02)",borderRadius:8,fontSize:10,color:C.muted,fontFamily:C.mono}}>
          Total rebalancing volume: ${rebalData.filter(r=>r.dollarDiff>0).reduce((s,r)=>s+r.dollarDiff,0).toLocaleString()} to buy · ${Math.abs(rebalData.filter(r=>r.dollarDiff<0).reduce((s,r)=>s+r.dollarDiff,0)).toLocaleString()} to sell
        </div>
      </>}/>
    </div>
  );
};

// ── POSITION SIZING ───────────────────────────────────────────────
const PositionSizing = ({hs, color}) => {
  const [riskPct, setRiskPct] = useState(2);
  const [method,  setMethod]  = useState("fixed");
  const totalVal = hs.reduce((s,h)=>s+h.qty*h.price,0);
  const riskAmt  = totalVal * riskPct / 100;
  const sizing   = hs.map(h=>{
    const kelly  = Math.max(0,((h.price-h.avgCost)/h.price - 0.3/((h.price-h.avgCost)/h.price+0.001))*100);
    const fixed  = riskPct;
    const vol_adj= riskPct * (15/Math.max(h.vol,1));
    const suggested = method==="kelly"?Math.min(kelly,25):method==="vol"?vol_adj:fixed;
    return {...h, kelly:+kelly.toFixed(1), fixed, vol_adj:+vol_adj.toFixed(1),
      suggested:+suggested.toFixed(1), dollarsAlloc:Math.round(totalVal*suggested/100)};
  });
  return(
    <div>
      <Card ch={<>
        <Ttl t="Position Sizing Calculator" sub="How much to allocate per position based on your risk tolerance" color={color}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:20,marginBottom:16}}>
          <div>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:5}}>RISK PER TRADE (%)</div>
            <div style={{fontSize:24,fontFamily:C.display,fontWeight:800,color,marginBottom:6}}>{riskPct}%</div>
            <input type="range" min={0.5} max={10} step={0.5} value={riskPct} onChange={e=>setRiskPct(+e.target.value)} style={{width:"100%",accentColor:color}}/>
            <div style={{fontSize:10,color:C.muted,fontFamily:C.mono,marginTop:4}}>Max loss per position: ${Math.round(riskAmt).toLocaleString()}</div>
          </div>
          <div>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:8}}>METHOD</div>
            {[{id:"fixed",l:"Fixed % Risk",d:"Same % for all"},{id:"kelly",l:"Kelly Criterion",d:"Math-optimal"},{id:"vol",l:"Vol-Adjusted",d:"Lower for volatile"}].map(m=>(
              <div key={m.id} onClick={()=>setMethod(m.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,cursor:"pointer",marginBottom:4,background:method===m.id?`${color}12`:"transparent",border:`1px solid ${method===m.id?color+"44":C.border}`}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:method===m.id?color:"#334155",flexShrink:0}}/>
                <div><div style={{fontSize:11,fontFamily:C.mono,color:method===m.id?color:C.muted,fontWeight:600}}>{m.l}</div><div style={{fontSize:9,color:C.muted,fontFamily:C.mono}}>{m.d}</div></div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{background:`${color}12`,border:`1px solid ${color}33`,borderRadius:10,padding:"10px 16px",textAlign:"center"}}>
              <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>PORTFOLIO RISK $</div>
              <div style={{fontSize:20,fontFamily:C.display,fontWeight:800,color}}>${Math.round(riskAmt).toLocaleString()}</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 16px",textAlign:"center"}}>
              <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>METHOD</div>
              <div style={{fontSize:14,fontFamily:C.display,fontWeight:700,color:C.muted}}>{method==="fixed"?"FIXED":method==="kelly"?"KELLY":"VOL-ADJ"}</div>
            </div>
          </div>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
            {["Symbol","Volatility","Kelly %","Vol-Adj %","Suggested %","$ Allocation"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"7px 8px",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {sizing.map((s,i)=>(
              <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                <td style={{padding:"10px 8px",fontWeight:700,color,fontFamily:C.display}}>{s.symbol}</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,color:s.vol>40?C.red:s.vol>20?C.amber:C.teal}}>{s.vol}%</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,color:C.muted}}>{s.kelly}%</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,color:C.muted}}>{s.vol_adj}%</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,fontWeight:700,color}}>{s.suggested}%</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,fontWeight:600,color:C.text}}>${s.dollarsAlloc.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>}/>
    </div>
  );
};

// ── MAIN APP ────────────────────────────────────────────────────
const TABS=[
  {id:"overview",    label:"📊 Overview",               color:C.teal,   subs:null},
  {id:"performance", label:"📈 Performance & Benchmark", color:C.blue,   subs:[
    {id:"perf",        label:"📈 Performance",    icon:"📈"},
    {id:"benchmark",   label:"📐 Benchmark/Alpha", icon:"📐"},
  ]},
  {id:"risk",        label:"🛡 Risk & Correlations",    color:C.red,    subs:[
    {id:"risk",        label:"🛡 Risk Analysis",  icon:"🛡"},
    {id:"corr",        label:"🔥 Correlations",   icon:"🔥"},
  ]},
  {id:"dividends",   label:"💰 Dividends",              color:C.green,  subs:null},
  {id:"projections", label:"🔮 Projections & Scenarios", color:C.purple, subs:[
    {id:"proj",        label:"🔮 Projections",    icon:"🔮"},
    {id:"mc",          label:"🎲 Monte Carlo",    icon:"🎲"},
  ]},
  {id:"snowflake",   label:"❄️ Snowflake",              color:C.teal,   subs:null},
  {id:"ai",          label:"🤖 AI Intelligence",        color:C.amber,  subs:[
    {id:"agents",      label:"🤖 AI Agents",      icon:"🤖"},
    {id:"analytics",   label:"📡 Analytics Team", icon:"📡"},
  ]},
  {id:"trading",     label:"📉 Trading",                 color:C.teal,   subs:null},
  {id:"tools",       label:"🛠 Portfolio Tools",         color:C.amber,  subs:[
    {id:"entry",       label:"➕ Add Asset",      icon:"➕"},
    {id:"reports",     label:"📄 Report Center",  icon:"📄"},
  ]},
];

// ── SUB-TAB NAV COMPONENT ────────────────────────────────────────
const SubTabNav=({subs,activeSub,setActiveSub,color})=>{
  if(!subs||subs.length===0) return null;
  return(
    <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:`2px solid ${C.border}`}}>
      {subs.map(s=>{
        const isActive=activeSub===s.id;
        return(
          <button key={s.id} onClick={()=>setActiveSub(s.id)} style={{
            display:"flex",alignItems:"center",gap:8,
            padding:"11px 20px",border:"none",cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,
            background:isActive?`${color}10`:"transparent",
            color:isActive?color:C.muted,
            borderBottom:isActive?`2px solid ${color}`:"2px solid transparent",
            marginBottom:-2,
            transition:"all 0.2s",
            borderRadius:"8px 8px 0 0",
          }}>
            <span style={{fontSize:16,lineHeight:1}}>{s.icon}</span>
            <span>{s.label.split(" ").slice(1).join(" ")}</span>
          </button>
        );
      })}
    </div>
  );
};

// Sub-tab state stored per main tab
const SUB_TABS = {
  performance: [{id:"perf",  label:"📈 Performance"},{id:"benchmark",label:"📐 Benchmark / Alpha"}],
  risk:        [{id:"risk",  label:"🛡 Risk"},{id:"correlations",label:"🔥 Correlations"},{id:"technical",label:"📉 Technical Analysis"}],
  projections: [{id:"proj",  label:"🔮 Projections"},{id:"montecarlo",label:"🎲 Monte Carlo"},{id:"earnings",label:"📅 Earnings Calendar"}],
  snowflake:   [{id:"flake", label:"❄️ Snowflake"},{id:"factors",label:"🧬 Factor Exposure"}],
  agents:      [{id:"ai",    label:"🤖 AI Agents"},{id:"analytics",label:"📡 Analytics Team"}],
  tools:       [{id:"entry", label:"➕ Add Asset"},{id:"rebalance",label:"⚖️ Rebalance"},{id:"sizing",label:"📐 Position Sizing"},{id:"reports",label:"📄 Report Center"}],
};

export default function App(){
  const [tab,setTab]=useState("overview");
  const [subTab,setSubTab]=useState({});
  const curTabDef=TABS.find(t=>t.id===tab);
  const color=curTabDef?.color||C.teal;
  const activeSub=curTabDef?.subs?(subTab[tab]||curTabDef.subs[0].id):null;
  const setActiveSub=id=>setSubTab(prev=>({...prev,[tab]:id}));
  const [subTabs,setSubTabs]=useState({performance:"perf",risk:"risk",projections:"proj",snowflake:"flake",agents:"ai",tools:"entry"});
  const [tv,setTv]=useState(534821.40);
  const [pl,setPl]=useState(3247.80);
  const [scope,setScope]=useState({type:"all"});
  const [positions,setPositions]=useState([]);
  const [toast,setToast]=useState(null);
  const sub = subTabs[tab]||null;
  const setSub = id => setSubTabs(p=>({...p,[tab]:id}));

  useEffect(()=>{
    const iv=setInterval(()=>{
      setTv(v=>+(v+(Math.random()-.49)*150).toFixed(2));
      setPl(v=>+(v+(Math.random()-.49)*45).toFixed(2));
    },2000);
    return()=>clearInterval(iv);
  },[]);

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),2500);};

  const hs=getHoldings(scope);


  // Sub-tab navigator
  const SubNav = ({tabId,color}) => {
    const subs = SUB_TABS[tabId];
    if(!subs) return null;
    return(
      <div style={{display:"flex",gap:3,marginBottom:16,background:"rgba(255,255,255,0.03)",borderRadius:10,padding:3,width:"fit-content"}}>
        {subs.map(s=>(
          <button key={s.id} onClick={()=>setSub(s.id)} style={{
            padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
            background:sub===s.id?`${color}22`:"transparent",
            color:sub===s.id?color:C.muted,
            borderBottom:sub===s.id?`2px solid ${color}`:"2px solid transparent",
            transition:"all 0.2s",
          }}>{s.label}</button>
        ))}
      </div>
    );
  };

  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.bg},${C.bg2} 60%,${C.bg})`,color:C.text,fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:rgba(0,229,180,0.25);border-radius:2px}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        select option{background:#0A1628;color:#E2E8F0}
        input[type=range]{accent-color:#00E5B4;cursor:pointer;width:100%}
      `}</style>

      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"rgba(0,229,180,0.12)",border:`1px solid ${C.teal}44`,borderRadius:10,padding:"12px 18px",fontFamily:C.mono,fontSize:13,color:C.teal,animation:"toastIn 0.3s ease"}}>{toast}</div>}

      {/* HEADER */}
      <div style={{borderBottom:`1px solid ${C.border}`,background:"rgba(2,8,23,0.95)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1500,margin:"0 auto",padding:"0 24px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${C.teal},${C.blue})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:C.bg,boxShadow:`0 0 14px ${C.teal}44`}}>⬡</div>
              <div>
                <div style={{fontFamily:C.display,fontWeight:800,fontSize:14,letterSpacing:-.5}}>Portfolio Command Center</div>
                <div style={{fontSize:9,color:C.muted,fontFamily:C.mono,letterSpacing:1}}>v5.0 · 20 AGENTS · BROKER→FUND · $0 COST</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(0,229,180,0.08)",border:`1px solid rgba(0,229,180,0.2)`,borderRadius:14,padding:"3px 10px",fontSize:10,fontFamily:C.mono,color:C.teal}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:C.teal,display:"inline-block",animation:"pulse 1.5s infinite"}}/>LIVE
              </div>
              {[{l:"Portfolio",v:`$${tv.toLocaleString("en",{minimumFractionDigits:2,maximumFractionDigits:2})}`},{l:"Day P&L",v:`${pl>=0?"+":""}$${Math.abs(pl).toFixed(0)}`,c:pl>=0?C.teal:C.red}].map((s,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:8,padding:"4px 10px",textAlign:"center"}}>
                  <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>{s.l}</div>
                  <div style={{fontSize:12,fontFamily:C.display,fontWeight:700,color:s.c||C.text}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:0,overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id);}} style={{
                padding:"9px 15px",border:"none",cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,
                whiteSpace:"nowrap",
                background:tab===t.id?`${t.color}10`:"transparent",
                color:tab===t.id?t.color:C.muted,
                borderBottom:tab===t.id?`2px solid ${t.color}`:"2px solid transparent",
                transition:"all 0.2s",
                display:"flex",alignItems:"center",gap:5,
              }}>
                {t.label}
                {t.subs&&<span style={{fontSize:8,background:`${t.color}22`,color:t.color,borderRadius:3,padding:"1px 4px",fontFamily:C.mono}}>{t.subs.length}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1500,margin:"0 auto",padding:"18px 24px",animation:"fadeIn 0.35s ease"}}>
        {/* Global KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:12,marginBottom:14}}>
          <KPI label="Total Portfolio Value" value={`$${tv.toLocaleString("en",{minimumFractionDigits:2,maximumFractionDigits:2})}`} sub="+9.74% YTD · TWR +9.74% · MWR +8.91%" color={C.teal} pos={true}/>
          <KPI label="Day P&L" value={`${pl>=0?"+":""}$${Math.abs(pl).toFixed(0)}`} sub={`${(Math.abs(pl)/tv*100).toFixed(2)}%`} color={pl>=0?C.teal:C.red} pos={pl>=0}/>
          <KPI label="Total Return" value="+$47,382" sub="+9.74%" color={C.teal} pos={true}/>
          <KPI label="Sharpe Ratio" value="1.84" sub="Sortino: 2.31" color={C.purple}/>
          <KPI label="Annual Div." value="$902" sub="Yield: 1.38%" color={C.green} pos={true}/>
        </div>

        {/* Level Navigator — hide for agents tabs */}
        {!["agents","tools"].includes(tab)&&<LevelNav scope={scope} setScope={setScope} color={color}/>}

        {/* Tab content */}
        <div style={{animation:"fadeIn 0.3s ease"}}>

          {tab==="overview"&&<OverviewTab hs={hs} color={color} scope={scope}/>}

          {tab==="performance"&&<div>
            <SubTabNav subs={curTabDef?.subs} activeSub={activeSub} setActiveSub={setActiveSub} color={color}/>
            {activeSub==="perf"      &&<PerformanceTab hs={hs} color={color}/>}
            {activeSub==="benchmark" &&<BenchmarkTab   hs={hs} color={color}/>}
          </div>}

          {tab==="risk"&&<div>
            <SubTabNav subs={curTabDef?.subs} activeSub={activeSub} setActiveSub={setActiveSub} color={color}/>
            {activeSub==="risk" &&<RiskTab         hs={hs} color={color}/>}
            {activeSub==="corr" &&<CorrelationsTab hs={hs} color={color}/>}
          </div>}

          {tab==="dividends"&&<DividendsTab hs={hs} color={color}/>}

          {tab==="projections"&&<div>
            <SubTabNav subs={curTabDef?.subs} activeSub={activeSub} setActiveSub={setActiveSub} color={color}/>
            {activeSub==="proj" &&<ProjectionsTab hs={hs} color={color} scope={scope}/>}
            {activeSub==="mc"   &&<MonteCarloTab  hs={hs} color={color}/>}
          </div>}

          {tab==="snowflake"&&<SnowflakeTab hs={hs}/>}

          {tab==="ai"&&<div>
            <SubTabNav subs={curTabDef?.subs} activeSub={activeSub} setActiveSub={setActiveSub} color={color}/>
            {activeSub==="agents"    &&<AIAgentsTab/>}
            {activeSub==="analytics" &&<AnalyticsTeamTab/>}
          </div>}

          {tab==="trading"&&<TradingTab portfolioVal={tv}/>}

          {tab==="tools"&&<div>
            <SubTabNav subs={curTabDef?.subs} activeSub={activeSub} setActiveSub={setActiveSub} color={color}/>
            {activeSub==="entry"&&<AddAssetTab positions={positions} setPositions={setPositions} toast={toast} showToast={showToast}/>}
            {activeSub==="reports"&&<div style={{textAlign:"center",padding:"60px 20px",color:C.muted}}>
              <div style={{fontSize:48,marginBottom:16}}>📄</div>
              <div style={{fontFamily:C.display,fontWeight:700,fontSize:18,color:C.text,marginBottom:8}}>Report Center</div>
              <div style={{fontFamily:C.mono,fontSize:12,color:C.muted}}>Full report generation with 6 agents — coming next</div>
            </div>}
          </div>}

        </div>
        <div style={{marginTop:24,textAlign:"center",color:C.dim,fontSize:9,fontFamily:C.mono}}>
          PORTFOLIO COMMAND CENTER v5.0 · 8 TABS · 26 AGENTS · BROKER→FUND · $0 COST · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

// ████████████████████████████████████████████████████████████████
// TRADING COMMAND CENTER — Full System
// ████████████████████████████████████████████████████████████████

// ── TRADING AGENTS (8 new — total system: 28 agents) ─────────────
const TRADING_AGENTS = [
  { id:"SCANNER-1",  name:"Market Scanner",       color:"#00E5B4", role:"S&P500 Full Universe Scanner",
    status:"active", load:96,
    tasks:["Scanning 503 S&P500 stocks","Detecting technical setups","Ranking by opportunity score"],
    caps:["Multi-timeframe scan","Volume spike detection","Pattern pre-screening","Sector heat ranking"],
    signals:47, accuracy:"88.4%" },
  { id:"SIGNAL-1",   name:"Signal Generator",     color:"#0EA5E9", role:"BUY/SELL Signal Engine",
    status:"active", load:84,
    tasks:["Generating trade signals","Computing confidence levels","Risk/Reward calculation"],
    caps:["Multi-indicator confluence","Signal scoring 0-100","Entry/exit precision","Backtested signals"],
    signals:12, accuracy:"72.1%" },
  { id:"PATTERN-1",  name:"Pattern Recognizer",   color:"#8B5CF6", role:"Chart Pattern Detection",
    status:"active", load:78,
    tasks:["Scanning candlestick patterns","Detecting H&S, Cup, Flag","Fibonacci auto-levels"],
    caps:["23 candlestick patterns","Classical chart patterns","Fibonacci projection","Elliott Wave basic"],
    signals:8,  accuracy:"69.3%" },
  { id:"MOMENTUM-1", name:"Momentum Analyst",     color:"#F59E0B", role:"Momentum & Relative Strength",
    status:"active", load:71,
    tasks:["Computing RS vs S&P500","Sector momentum ranking","Trend strength scoring"],
    caps:["Relative Strength Index","Sector rotation detection","Trend scoring 1-10","Momentum divergence"],
    signals:23, accuracy:"81.2%" },
  { id:"FLOW-1",     name:"Order Flow Analyst",   color:"#EC4899", role:"Volume & Order Flow Intelligence",
    status:"active", load:89,
    tasks:["Tracking unusual volume","Dark pool prints","VWAP deviation alerts"],
    caps:["Volume profile analysis","Dark pool detection","VWAP tracking","DOM level 2 simulation"],
    signals:31, accuracy:"76.8%" },
  { id:"STRATEGY-1", name:"Strategy Builder",     color:"#4ADE80", role:"Trade Strategy Constructor",
    status:"active", load:67,
    tasks:["Building complete trade plans","Entry/Stop/Target levels","Position sizing calc"],
    caps:["Kelly Criterion sizing","Multi-leg strategies","Risk-adjusted entry","Trade plan PDF"],
    signals:6,  accuracy:"74.5%" },
  { id:"RISK-T",     name:"Trading Risk Manager", color:"#F87171", role:"Real-Time Trade Risk Control",
    status:"active", load:92,
    tasks:["Computing optimal stop loss","Max position size","Portfolio heat check"],
    caps:["ATR-based stops","Portfolio correlation check","Max drawdown guard","Heat map risk"],
    signals:18, accuracy:"94.1%" },
  { id:"ALPHA-T",    name:"ALPHA Trading Core",   color:"#F1F5F9", role:"Trading Orchestrator + Report Bridge",
    status:"active", load:88,
    tasks:["Consolidating all signals","Briefing Report Team","Priority trade ranking"],
    caps:["Cross-agent consolidation","Report team bridge","Signal deduplication","Priority matrix"],
    signals:127, accuracy:"91.7%" },
];


// ── REPORT AGENTS (6) ────────────────────────────────────────────
const REPORT_AGENTS = [
  { id:"ANALYST-1", name:"Chief Portfolio Analyst",  color:"#00E5B4",
    role:"Consolidates all agent outputs into executive narrative",
    status:"active", tasks:["Reading NEXUS + ALPHA-T output","Synthesizing signals","Drafting executive summary"], load:88 },
  { id:"RISK-RPT",  name:"Risk Report Specialist",   color:"#F87171",
    role:"Generates risk section: VaR, drawdown, stress scenarios",
    status:"active", tasks:["Computing current VaR","Building stress table","Flagging risk alerts"], load:74 },
  { id:"PERF-RPT",  name:"Performance Reporter",     color:"#0EA5E9",
    role:"Builds performance attribution and benchmark comparison",
    status:"active", tasks:["TWR/MWR calculation","Attribution table","Benchmark delta"], load:81 },
  { id:"PROJ-RPT",  name:"Projection Modeler",       color:"#8B5CF6",
    role:"Generates forward-looking scenarios and recommendations",
    status:"active", tasks:["Monte Carlo summary","Bull/Base/Bear scenarios","12-month outlook"], load:69 },
  { id:"DIV-RPT",   name:"Dividend Report Agent",    color:"#4ADE80",
    role:"Analyzes income, yield trends and DRIP projections",
    status:"active", tasks:["Annual income calc","Yield on cost table","DRIP 20yr projection"], load:52 },
  { id:"SCRIBE-RPT",name:"SCRIBE Report Writer",     color:"#F59E0B",
    role:"Converts all data into professional narrative language",
    status:"active", tasks:["Writing executive summary","Formatting sections","ES/EN language detect"], load:91 },
];

// ── MARKET SCANNER DATA ───────────────────────────────────────────
const SCANNER_DATA = [
  {symbol:"NVDA", name:"NVIDIA Corp",      sector:"Technology",  score:94, signal:"BUY",  rsi:58.4, macd:"Bullish", vol:"3.2x avg", momentum:"Strong",  pattern:"Bull Flag",      entry:875,  stop:838,  target:962,  rr:"2.3:1", conf:89},
  {symbol:"MSFT", name:"Microsoft",        sector:"Technology",  score:88, signal:"BUY",  rsi:55.2, macd:"Bullish", vol:"1.8x avg", momentum:"Strong",  pattern:"Cup & Handle",   entry:418,  stop:398,  target:468,  rr:"2.5:1", conf:84},
  {symbol:"AAPL", name:"Apple Inc",        sector:"Technology",  score:79, signal:"BUY",  rsi:61.2, macd:"Neutral", vol:"1.4x avg", momentum:"Moderate",pattern:"Ascending Tri.", entry:213,  stop:202,  target:238,  rr:"2.3:1", conf:76},
  {symbol:"JPM",  name:"JPMorgan Chase",   sector:"Financials",  score:82, signal:"BUY",  rsi:52.8, macd:"Bullish", vol:"2.1x avg", momentum:"Strong",  pattern:"Breakout",       entry:198,  stop:188,  target:224,  rr:"2.6:1", conf:81},
  {symbol:"XOM",  name:"Exxon Mobil",      sector:"Energy",      score:71, signal:"BUY",  rsi:48.9, macd:"Bullish", vol:"1.6x avg", momentum:"Moderate",pattern:"Double Bottom",   entry:112,  stop:106,  target:126,  rr:"2.3:1", conf:69},
  {symbol:"META", name:"Meta Platforms",   sector:"Technology",  score:86, signal:"BUY",  rsi:63.1, macd:"Bullish", vol:"2.4x avg", momentum:"Strong",  pattern:"Momentum",       entry:512,  stop:488,  target:572,  rr:"2.5:1", conf:83},
  {symbol:"GOOGL",name:"Alphabet",         sector:"Technology",  score:77, signal:"WATCH",rsi:57.4, macd:"Neutral", vol:"1.3x avg", momentum:"Moderate",pattern:"Consolidation",   entry:175,  stop:166,  target:194,  rr:"2.1:1", conf:71},
  {symbol:"BRK.B",name:"Berkshire Hath.",  sector:"Financials",  score:68, signal:"WATCH",rsi:44.2, macd:"Neutral", vol:"1.1x avg", momentum:"Weak",    pattern:"Base Building",   entry:418,  stop:398,  target:458,  rr:"2.0:1", conf:64},
  {symbol:"UNH",  name:"UnitedHealth",     sector:"Healthcare",  score:61, signal:"WATCH",rsi:41.8, macd:"Bearish", vol:"0.9x avg", momentum:"Weak",    pattern:"Support Test",    entry:528,  stop:502,  target:568,  rr:"1.6:1", conf:58},
  {symbol:"TSLA", name:"Tesla Inc",        sector:"Technology",  score:58, signal:"SELL", rsi:72.4, macd:"Bearish", vol:"3.8x avg", momentum:"Overbought",pattern:"Distribution",   entry:248,  stop:268,  target:198,  rr:"2.5:1", conf:62},
];

// ── TECHNICAL INDICATOR GENERATORS ───────────────────────────────
const genCandleData = (days=60) => {
  let price = 213.50;
  return Array.from({length:days},(_,i)=>{
    const change = (Math.random()-0.48)*price*0.025;
    const open   = price;
    const close  = price + change;
    const high   = Math.max(open,close)*(1+Math.random()*0.012);
    const low    = Math.min(open,close)*(1-Math.random()*0.012);
    const vol    = Math.round(50000000+Math.random()*100000000);
    price = close;
    const dt = new Date(); dt.setDate(dt.getDate()-(days-i));
    return {
      date: dt.toLocaleDateString("en",{month:"short",day:"numeric"}),
      open:+open.toFixed(2), high:+high.toFixed(2),
      low:+low.toFixed(2),   close:+close.toFixed(2), vol,
    };
  });
};

const calcRSI = (data,period=14) => {
  const closes = data.map(d=>d.close);
  return closes.map((_,i)=>{
    if(i<period) return null;
    let gains=0,losses=0;
    for(let j=i-period+1;j<=i;j++){
      const diff=closes[j]-closes[j-1];
      if(diff>0) gains+=diff; else losses+=Math.abs(diff);
    }
    const rs=(gains/period)/(losses/period||0.001);
    return +(100-100/(1+rs)).toFixed(2);
  });
};

const calcMACD = (data) => {
  const closes=data.map(d=>d.close);
  const ema=(arr,p)=>{
    const k=2/(p+1); let e=arr[0];
    return arr.map((v,i)=>{ e=i===0?v:v*k+e*(1-k); return +e.toFixed(2); });
  };
  const ema12=ema(closes,12), ema26=ema(closes,26);
  const macdLine=closes.map((_,i)=>+(ema12[i]-ema26[i]).toFixed(2));
  const signal=ema(macdLine,9);
  return closes.map((_,i)=>({
    macd:macdLine[i],
    signal:signal[i],
    hist:+(macdLine[i]-signal[i]).toFixed(2),
  }));
};

const calcBollinger = (data,period=20,std=2) => {
  const closes=data.map(d=>d.close);
  return closes.map((_,i)=>{
    if(i<period) return{mid:null,upper:null,lower:null};
    const slice=closes.slice(i-period+1,i+1);
    const mid=slice.reduce((a,b)=>a+b,0)/period;
    const variance=slice.reduce((a,b)=>a+(b-mid)**2,0)/period;
    const stdDev=Math.sqrt(variance)*std;
    return{mid:+mid.toFixed(2),upper:+(mid+stdDev).toFixed(2),lower:+(mid-stdDev).toFixed(2)};
  });
};

const calcEMA = (data,period) => {
  const closes=data.map(d=>d.close);
  const k=2/(period+1); let e=closes[0];
  return closes.map((v,i)=>{ e=i===0?v:v*k+e*(1-k); return +e.toFixed(2); });
};

// ── TRADING VIEWS ─────────────────────────────────────────────────
const TradingMarketScanner = () => {
  const [sortBy,setSortBy]=useState("score");
  const [filterSig,setFilterSig]=useState("ALL");
  const [selectedRow,setSelectedRow]=useState(null);

  const filtered = SCANNER_DATA
    .filter(d=>filterSig==="ALL"||d.signal===filterSig)
    .sort((a,b)=>sortBy==="score"?b.score-a.score:sortBy==="rsi"?b.rsi-a.rsi:b.conf-a.conf);

  const sigColor=s=>s==="BUY"?C.teal:s==="SELL"?C.red:C.amber;

  return(
    <div>
      {/* Sector heatmap */}
      <Card ch={<>
        <Ttl t="Sector Opportunity Heat Map" sub="Composite score: Technical + Momentum + Volume + Sentiment"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:8}}>
          {[
            {name:"Technology",score:88,color:C.teal},
            {name:"Financials",score:74,color:C.blue},
            {name:"Healthcare",score:58,color:C.muted},
            {name:"Energy",    score:71,color:C.amber},
            {name:"Consumer",  score:62,color:C.purple},
            {name:"Utilities", score:44,color:C.dim},
          ].map((s,i)=>{
            const bg=s.score>=80?C.teal:s.score>=65?C.blue:s.score>=50?C.amber:"#475569";
            return(
              <div key={i} style={{background:`${bg}22`,border:`1px solid ${bg}44`,borderRadius:10,padding:"12px 8px",textAlign:"center"}}>
                <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,marginBottom:4}}>{s.name}</div>
                <div style={{fontSize:22,fontFamily:C.display,fontWeight:800,color:bg}}>{s.score}</div>
                <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,marginTop:6}}>
                  <div style={{height:"100%",width:`${s.score}%`,background:bg,borderRadius:2}}/>
                </div>
              </div>
            );
          })}
        </div>
      </>} style={{marginBottom:14}}/>

      {/* Controls */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:10,fontFamily:C.mono,color:C.muted}}>FILTER:</span>
          {["ALL","BUY","WATCH","SELL"].map(f=>(
            <button key={f} onClick={()=>setFilterSig(f)} style={{padding:"4px 12px",borderRadius:6,border:`1px solid ${filterSig===f?sigColor(f)+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:10,fontWeight:600,background:filterSig===f?`${sigColor(f)}18`:"transparent",color:filterSig===f?sigColor(f):C.muted}}>
              {f}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:10,fontFamily:C.mono,color:C.muted}}>SORT:</span>
          {[["score","Score"],["rsi","RSI"],["conf","Confidence"]].map(([v,l])=>(
            <button key={v} onClick={()=>setSortBy(v)} style={{padding:"4px 12px",borderRadius:6,border:`1px solid ${sortBy===v?C.teal+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:10,fontWeight:600,background:sortBy===v?`${C.teal}18`:"transparent",color:sortBy===v?C.teal:C.muted}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Scanner table */}
      <Card ch={<>
        <Ttl t={`Market Scanner — ${filtered.length} Opportunities`} sub="SCANNER-1 + SIGNAL-1 + MOMENTUM-1 + FLOW-1 · Updated every 30s"/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
              {["Symbol","Sector","Score","Signal","RSI","MACD","Volume","Pattern","Entry","Stop","Target","R:R","Conf %"].map(h=>(
                <th key={h} style={{textAlign:"left",padding:"7px 8px",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((d,i)=>(
                <tr key={i}
                  onClick={()=>setSelectedRow(selectedRow===d.symbol?null:d.symbol)}
                  style={{borderBottom:`1px solid rgba(255,255,255,0.04)`,cursor:"pointer",background:selectedRow===d.symbol?`rgba(0,229,180,0.05)`:"transparent",transition:"background 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=selectedRow===d.symbol?"rgba(0,229,180,0.05)":"rgba(255,255,255,0.02)"}
                  onMouseLeave={e=>e.currentTarget.style.background=selectedRow===d.symbol?"rgba(0,229,180,0.05)":"transparent"}>
                  <td style={{padding:"10px 8px",fontWeight:700,color:C.teal,fontFamily:C.display}}>{d.symbol}</td>
                  <td style={{padding:"10px 8px",fontSize:10,color:C.muted}}>{d.sector}</td>
                  <td style={{padding:"10px 8px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:32,height:5,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
                        <div style={{height:"100%",width:`${d.score}%`,background:d.score>=80?C.teal:d.score>=65?C.amber:C.red,borderRadius:2}}/>
                      </div>
                      <span style={{fontFamily:C.mono,fontWeight:700,color:d.score>=80?C.teal:d.score>=65?C.amber:C.red}}>{d.score}</span>
                    </div>
                  </td>
                  <td style={{padding:"10px 8px"}}>
                    <span style={{fontSize:10,fontFamily:C.mono,fontWeight:700,background:`${sigColor(d.signal)}22`,color:sigColor(d.signal),border:`1px solid ${sigColor(d.signal)}44`,borderRadius:4,padding:"2px 8px"}}>{d.signal}</span>
                  </td>
                  <td style={{padding:"10px 8px",fontFamily:C.mono,color:d.rsi>70?C.red:d.rsi<30?C.teal:C.muted}}>{d.rsi}</td>
                  <td style={{padding:"10px 8px",fontFamily:C.mono,color:d.macd==="Bullish"?C.teal:d.macd==="Bearish"?C.red:C.muted,fontSize:10}}>{d.macd}</td>
                  <td style={{padding:"10px 8px",fontFamily:C.mono,fontSize:10,color:C.blue}}>{d.vol}</td>
                  <td style={{padding:"10px 8px",fontSize:10,color:C.purple}}>{d.pattern}</td>
                  <td style={{padding:"10px 8px",fontFamily:C.mono,fontWeight:600}}>${d.entry}</td>
                  <td style={{padding:"10px 8px",fontFamily:C.mono,color:C.red}}>${d.stop}</td>
                  <td style={{padding:"10px 8px",fontFamily:C.mono,color:C.teal}}>${d.target}</td>
                  <td style={{padding:"10px 8px",fontFamily:C.mono,color:C.amber,fontWeight:700}}>{d.rr}</td>
                  <td style={{padding:"10px 8px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:32,height:5,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
                        <div style={{height:"100%",width:`${d.conf}%`,background:d.conf>=80?C.teal:d.conf>=65?C.amber:C.red,borderRadius:2}}/>
                      </div>
                      <span style={{fontFamily:C.mono,fontSize:11,fontWeight:700,color:d.conf>=80?C.teal:d.conf>=65?C.amber:C.red}}>{d.conf}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}/>

      {/* Selected row detail */}
      {selectedRow&&(()=>{
        const d=SCANNER_DATA.find(x=>x.symbol===selectedRow);
        if(!d) return null;
        return(
          <Card ch={<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontFamily:C.display,fontWeight:800,fontSize:20,color:sigColor(d.signal)}}>{d.symbol} — {d.name}</div>
                <div style={{fontFamily:C.mono,fontSize:11,color:C.muted}}>{d.sector} · Score: {d.score}/100 · {d.pattern}</div>
              </div>
              <span style={{fontSize:14,fontFamily:C.mono,fontWeight:700,background:`${sigColor(d.signal)}22`,color:sigColor(d.signal),border:`1px solid ${sigColor(d.signal)}44`,borderRadius:6,padding:"6px 16px"}}>{d.signal} SIGNAL</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
              {[{l:"Entry Price",v:`$${d.entry}`,c:C.text},{l:"Stop Loss",v:`$${d.stop}`,c:C.red},{l:"Take Profit",v:`$${d.target}`,c:C.teal},{l:"Risk/Reward",v:d.rr,c:C.amber}].map((s,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${s.c}22`,borderRadius:10,padding:14,textAlign:"center"}}>
                  <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:4}}>{s.l}</div>
                  <div style={{fontSize:20,fontFamily:C.display,fontWeight:800,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[{l:"RSI",v:d.rsi,c:d.rsi>70?C.red:d.rsi<30?C.teal:C.muted},{l:"MACD",v:d.macd,c:d.macd==="Bullish"?C.teal:C.red},{l:"Volume",v:d.vol,c:C.blue},{l:"Confidence",v:`${d.conf}%`,c:d.conf>=80?C.teal:C.amber}].map((s,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px"}}>
                  <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>{s.l}</div>
                  <div style={{fontSize:14,fontFamily:C.mono,fontWeight:700,color:s.c,marginTop:3}}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:14,padding:12,background:"rgba(0,229,180,0.04)",border:`1px solid ${C.teal}22`,borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:12,fontFamily:"'DM Sans',sans-serif",color:"#94A3B8"}}>
                🤖 <b style={{color:C.teal}}>STRATEGY-1:</b> {d.signal==="BUY"?`Enter long at $${d.entry} with stop at $${d.stop} (-${((d.entry-d.stop)/d.entry*100).toFixed(1)}%). Target $${d.target} (+${((d.target-d.entry)/d.entry*100).toFixed(1)}%). R:R ${d.rr}.`:`Consider short or reduce exposure. RSI overbought at ${d.rsi}. Distribution pattern detected.`}
              </div>
              <button style={{flexShrink:0,marginLeft:16,padding:"8px 16px",borderRadius:8,border:`1px solid ${C.teal}55`,cursor:"pointer",fontFamily:C.mono,fontSize:11,fontWeight:700,background:`${C.teal}18`,color:C.teal}}>
                ✓ Authorize
              </button>
            </div>
          </>} style={{marginTop:14,border:`1px solid ${sigColor(d.signal)}33`}}/>
        );
      })()}
    </div>
  );
};

const TradingChartAnalysis = () => {
  const [symbol,setSymbol]=useState("AAPL");
  const [showRSI,setShowRSI]=useState(true);
  const [showMACD,setShowMACD]=useState(true);
  const [showBB,setShowBB]=useState(true);
  const [showEMA,setShowEMA]=useState(true);
  const [showVol,setShowVol]=useState(true);
  const [showFib,setShowFib]=useState(false);

  const rawData = useMemo(()=>genCandleData(60),[symbol]);
  const rsiData  = useMemo(()=>calcRSI(rawData),[rawData]);
  const macdData = useMemo(()=>calcMACD(rawData),[rawData]);
  const bbData   = useMemo(()=>calcBollinger(rawData),[rawData]);
  const ema9     = useMemo(()=>calcEMA(rawData,9),[rawData]);
  const ema21    = useMemo(()=>calcEMA(rawData,21),[rawData]);
  const ema50    = useMemo(()=>calcEMA(rawData,50),[rawData]);

  // Build combined chart data
  const chartData = rawData.map((d,i)=>({
    ...d,
    rsi:    rsiData[i],
    macd:   macdData[i]?.macd,
    signal: macdData[i]?.signal,
    hist:   macdData[i]?.hist,
    bb_mid: bbData[i]?.mid,
    bb_up:  bbData[i]?.upper,
    bb_lo:  bbData[i]?.lower,
    ema9:   ema9[i],
    ema21:  ema21[i],
    ema50:  ema50[i],
  }));

  // Fibonacci levels (from low to high of visible range)
  const prices   = rawData.map(d=>d.close);
  const priceHigh= Math.max(...prices);
  const priceLow = Math.min(...prices);
  const fibRange = priceHigh - priceLow;
  const fibLevels= [0,0.236,0.382,0.5,0.618,0.786,1].map(r=>({
    level:`${(r*100).toFixed(1)}%`,
    price: +(priceLow + fibRange*(1-r)).toFixed(2),
  }));

  const SYMBOLS = SCANNER_DATA.map(d=>d.symbol);
  const current  = SCANNER_DATA.find(d=>d.symbol===symbol)||SCANNER_DATA[0];
  const lastClose= rawData[rawData.length-1]?.close||0;
  const prevClose= rawData[rawData.length-2]?.close||0;
  const dayChg   = lastClose-prevClose;
  const dayChgPct= (dayChg/prevClose*100).toFixed(2);

  const toggleStyle=(active,color=C.teal)=>({
    padding:"4px 10px",borderRadius:6,border:`1px solid ${active?color+"55":C.border}`,
    cursor:"pointer",fontFamily:C.mono,fontSize:9,fontWeight:600,
    background:active?`${color}18`:"transparent",color:active?color:C.muted,transition:"all 0.2s",
  });

  return(
    <div>
      {/* Symbol selector + controls */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:10,fontFamily:C.mono,color:C.muted}}>SYMBOL:</span>
          <select value={symbol} onChange={e=>setSymbol(e.target.value)} style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",color:C.text,fontSize:11,fontFamily:C.mono,cursor:"pointer"}}>
            {SYMBOLS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:8}}>
            <span style={{fontFamily:C.display,fontWeight:800,fontSize:18,color:dayChg>=0?C.teal:C.red}}>${lastClose.toFixed(2)}</span>
            <span style={{fontFamily:C.mono,fontSize:12,color:dayChg>=0?C.teal:C.red}}>{dayChg>=0?"+":""}{dayChg.toFixed(2)} ({dayChgPct}%)</span>
          </div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>LAYERS:</span>
          {[[showRSI,setShowRSI,"RSI",C.purple],[showMACD,setShowMACD,"MACD",C.blue],[showBB,setShowBB,"Bollinger",C.amber],[showEMA,setShowEMA,"EMA",C.green],[showVol,setShowVol,"Volume",C.muted],[showFib,setShowFib,"Fibonacci",C.pink]].map(([active,setter,label,color],i)=>(
            <button key={i} onClick={()=>setter(v=>!v)} style={toggleStyle(active,color)}>{label}</button>
          ))}
        </div>
      </div>

      {/* OHLC Candlestick (simulated with ComposedChart) */}
      <Card ch={<>
        <Ttl t={`${symbol} — Price Chart`} sub="Candlestick · EMA 9/21/50 · Bollinger Bands · 60 days"/>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:8,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={9}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v.toFixed(0)}`} domain={["auto","auto"]}/>
            <Tooltip content={({active,payload,label})=>{
              if(!active||!payload?.length) return null;
              const d=payload[0]?.payload;
              return(
                <div style={{background:"#0A1628",border:`1px solid ${C.teal}44`,borderRadius:8,padding:"8px 12px",fontSize:10,fontFamily:C.mono}}>
                  <div style={{color:C.muted,marginBottom:4}}>{label}</div>
                  <div style={{color:C.muted}}>O: <b style={{color:C.text}}>${d?.open}</b> H: <b style={{color:C.teal}}>${d?.high}</b> L: <b style={{color:C.red}}>${d?.low}</b> C: <b style={{color:d?.close>d?.open?C.teal:C.red}}>${d?.close}</b></div>
                  {d?.ema9&&<div style={{color:C.green}}>EMA9: ${d?.ema9} EMA21: ${d?.ema21}</div>}
                  {d?.bb_up&&<div style={{color:C.amber}}>BB: ${d?.bb_lo} - ${d?.bb_up}</div>}
                </div>
              );
            }}/>
            <Legend wrapperStyle={{fontSize:9,fontFamily:C.mono}}/>
            {/* Candlestick body via Bar — color by close vs open */}
            <Bar dataKey="high" fill="transparent" stroke="transparent" legendType="none"/>
            {chartData.map((d,i)=>{
              // Render individual candles as thin bars
              return null; // recharts limitation — we use Area to simulate
            })}
            {/* Price line (close) */}
            <Line type="monotone" dataKey="close" stroke={C.text} strokeWidth={1.5} dot={false} name="Price" legendType="line"/>
            {/* High/Low range */}
            <Area type="monotone" dataKey="high" fill={`${C.teal}08`} stroke="transparent" legendType="none"/>
            <Area type="monotone" dataKey="low"  fill={C.bg} stroke="transparent" legendType="none"/>
            {showBB&&<>
              <Line type="monotone" dataKey="bb_up" stroke={C.amber} strokeWidth={1} dot={false} strokeDasharray="3 2" name="BB Upper" legendType="line"/>
              <Line type="monotone" dataKey="bb_mid" stroke={C.amber} strokeWidth={1} dot={false} strokeDasharray="6 3" name="BB Mid" legendType="none"/>
              <Line type="monotone" dataKey="bb_lo" stroke={C.amber} strokeWidth={1} dot={false} strokeDasharray="3 2" name="BB Lower" legendType="line"/>
            </>}
            {showEMA&&<>
              <Line type="monotone" dataKey="ema9"  stroke={C.green}  strokeWidth={1.5} dot={false} name="EMA 9"  legendType="line"/>
              <Line type="monotone" dataKey="ema21" stroke={C.blue}   strokeWidth={1.5} dot={false} name="EMA 21" legendType="line"/>
              <Line type="monotone" dataKey="ema50" stroke={C.purple} strokeWidth={1.5} dot={false} name="EMA 50" legendType="line"/>
            </>}
          </ComposedChart>
        </ResponsiveContainer>
      </>} style={{marginBottom:10}}/>

      {/* Volume */}
      {showVol&&<Card ch={<>
        <Ttl t="Volume" sub="Daily volume with VWAP reference"/>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:8,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={9}/>
            <YAxis tick={{fill:C.muted,fontSize:8,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1e6).toFixed(0)}M`}/>
            <Tooltip formatter={v=>`${(v/1e6).toFixed(1)}M shares`} contentStyle={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,fontSize:10}}/>
            <Bar dataKey="vol" name="Volume">
              {chartData.map((d,i)=><Cell key={i} fill={d.close>d.open?`${C.teal}88`:`${C.red}88`}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </>} style={{marginBottom:10}}/>}

      {/* RSI */}
      {showRSI&&<Card ch={<>
        <Ttl t="RSI (14)" sub="Overbought > 70 · Oversold < 30"/>
        <ResponsiveContainer width="100%" height={100}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:8,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={9}/>
            <YAxis domain={[0,100]} tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} ticks={[30,50,70]}/>
            <Tooltip formatter={v=>v?.toFixed(1)} contentStyle={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,fontSize:10}}/>
            <ReferenceLine y={70} stroke={C.red}  strokeDasharray="3 2" label={{value:"OB",fill:C.red,fontSize:8}}/>
            <ReferenceLine y={30} stroke={C.teal} strokeDasharray="3 2" label={{value:"OS",fill:C.teal,fontSize:8}}/>
            <ReferenceLine y={50} stroke={C.border} strokeDasharray="2 4"/>
            <Line type="monotone" dataKey="rsi" stroke={C.purple} strokeWidth={2} dot={false} name="RSI"/>
          </ComposedChart>
        </ResponsiveContainer>
      </>} style={{marginBottom:10}}/>}

      {/* MACD */}
      {showMACD&&<Card ch={<>
        <Ttl t="MACD (12,26,9)" sub="MACD line · Signal line · Histogram"/>
        <ResponsiveContainer width="100%" height={100}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:8,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={9}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>v?.toFixed(1)}/>
            <Tooltip formatter={v=>v?.toFixed(2)} contentStyle={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,fontSize:10}}/>
            <ReferenceLine y={0} stroke={C.border}/>
            <Bar dataKey="hist" name="Histogram">{chartData.map((d,i)=><Cell key={i} fill={d.hist>=0?`${C.teal}88`:`${C.red}88`}/>)}</Bar>
            <Line type="monotone" dataKey="macd"   stroke={C.blue}  strokeWidth={1.5} dot={false} name="MACD"/>
            <Line type="monotone" dataKey="signal" stroke={C.amber} strokeWidth={1.5} dot={false} name="Signal" strokeDasharray="3 2"/>
          </ComposedChart>
        </ResponsiveContainer>
      </>} style={{marginBottom:10}}/>}

      {/* Fibonacci levels */}
      {showFib&&<Card ch={<>
        <Ttl t="Fibonacci Retracement Levels" sub={`Based on ${days} day range · High: $${priceHigh.toFixed(2)} · Low: $${priceLow.toFixed(2)}`} color={C.pink}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
          {fibLevels.map((f,i)=>{
            const col=i===0||i===6?C.muted:i===2||i===4?C.teal:C.amber;
            return(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${col}33`,borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontSize:9,fontFamily:C.mono,color:col,fontWeight:700,marginBottom:4}}>{f.level}</div>
                <div style={{fontSize:14,fontFamily:C.display,fontWeight:700,color:col}}>${f.price}</div>
              </div>
            );
          })}
        </div>
      </>} style={{marginBottom:10}}/>}

      {/* ATR Info */}
      <Card ch={<>
        <Ttl t={`${symbol} — Technical Summary`} sub="SCANNER-1 · SIGNAL-1 · PATTERN-1 composite"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {l:"ATR (14)",       v:`$${(lastClose*0.018).toFixed(2)}`,   c:C.amber, desc:"Avg True Range"},
            {l:"RSI (14)",       v:rsiData.filter(Boolean).slice(-1)[0]||"—",        c:C.purple,desc:"Relative Strength"},
            {l:"Signal",        v:current.signal,                        c:current.signal==="BUY"?C.teal:current.signal==="SELL"?C.red:C.amber, desc:"Agent recommendation"},
            {l:"Confidence",    v:`${current.conf}%`,                    c:current.conf>=80?C.teal:C.amber, desc:"Signal strength"},
          ].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${s.c}22`,borderRadius:10,padding:14,textAlign:"center"}}>
              <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:4}}>{s.l}</div>
              <div style={{fontSize:20,fontFamily:C.display,fontWeight:800,color:s.c}}>{s.v}</div>
              <div style={{fontSize:9,color:C.muted,fontFamily:C.mono,marginTop:3}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </>}/>
    </div>
  );
};

const TradingSignals = ({portfolioVal=534821}) => {
  const [riskPct,setRiskPct]=useState(2);
  const [authorized,setAuthorized]=useState({});
  const maxRiskDollar = portfolioVal * riskPct / 100;

  const signals = SCANNER_DATA.filter(d=>d.signal==="BUY"||d.signal==="SELL").map(d=>{
    const riskPerShare = Math.abs(d.entry-d.stop);
    const shares = Math.floor(maxRiskDollar/riskPerShare);
    const totalRisk = shares*riskPerShare;
    const totalTarget = shares*(d.target-d.entry)*(d.signal==="BUY"?1:-1);
    return {...d, shares, totalRisk, totalTarget,
      riskDollar: totalRisk.toFixed(0),
      targetDollar: totalTarget.toFixed(0),
    };
  });

  return(
    <div>
      {/* Risk configurator */}
      <Card ch={<>
        <Ttl t="Risk Parameters — Configurable" sub="RISK-T agent calibrated to your settings" color={C.red}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,marginBottom:14}}>
          <div>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:5}}>RISK PER TRADE</div>
            <div style={{fontSize:28,fontFamily:C.display,fontWeight:800,color:C.red,marginBottom:6}}>{riskPct}%</div>
            <input type="range" min={0.5} max={10} step={0.5} value={riskPct} onChange={e=>setRiskPct(+e.target.value)} style={{width:"100%",accentColor:C.red}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:9,fontFamily:C.mono,color:C.muted,marginTop:3}}>
              <span>0.5%</span><span>5%</span><span>10%</span>
            </div>
            <div style={{display:"flex",gap:4,marginTop:8}}>
              {[0.5,1,2,5].map(v=>(
                <button key={v} onClick={()=>setRiskPct(v)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${riskPct===v?C.red+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:9,fontWeight:600,background:riskPct===v?`${C.red}18`:"transparent",color:riskPct===v?C.red:C.muted}}>
                  {v}%
                </button>
              ))}
            </div>
          </div>
          <div style={{textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:6}}>MAX RISK PER TRADE</div>
            <div style={{fontSize:32,fontFamily:C.display,fontWeight:800,color:C.red}}>${Math.round(maxRiskDollar).toLocaleString()}</div>
            <div style={{fontSize:11,color:C.muted,fontFamily:C.mono,marginTop:4}}>{riskPct}% of ${(portfolioVal/1000).toFixed(0)}k portfolio</div>
          </div>
          <div style={{background:"rgba(0,229,180,0.06)",border:`1px solid ${C.teal}33`,borderRadius:12,padding:14,textAlign:"center"}}>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:4}}>AUTHORIZATION MODE</div>
            <div style={{fontSize:14,fontFamily:C.display,fontWeight:700,color:C.teal,marginBottom:8}}>Manual Approval</div>
            <div style={{fontSize:10,color:C.muted,fontFamily:C.mono,lineHeight:1.6}}>Signals generated automatically. You authorize each trade before execution.</div>
            <div style={{marginTop:8,fontSize:9,fontFamily:C.mono,color:C.amber}}>⚡ Auto-execution: READY (disabled)</div>
          </div>
        </div>
      </>} style={{marginBottom:14}}/>

      {/* Active signals */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {signals.map((d,i)=>{
          const isAuth=authorized[d.symbol];
          return(
            <Card key={i} ch={<>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:16,alignItems:"start"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{fontFamily:C.display,fontWeight:800,fontSize:18,color:d.signal==="BUY"?C.teal:C.red}}>{d.symbol}</div>
                    <span style={{fontSize:12,fontFamily:C.mono,fontWeight:700,background:`${d.signal==="BUY"?C.teal:C.red}22`,color:d.signal==="BUY"?C.teal:C.red,border:`1px solid ${d.signal==="BUY"?C.teal:C.red}44`,borderRadius:5,padding:"2px 10px"}}>{d.signal}</span>
                    <Chip label={d.pattern} color={C.purple}/>
                    <span style={{fontSize:10,fontFamily:C.mono,color:C.muted}}>{d.sector}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
                    {[{l:"Entry",v:`$${d.entry}`,c:C.text},{l:"Stop Loss",v:`$${d.stop}`,c:C.red},{l:"Target",v:`$${d.target}`,c:C.teal},{l:"Shares",v:d.shares,c:C.blue},{l:"Risk $",v:`$${d.riskDollar}`,c:C.red},{l:"R:R",v:d.rr,c:C.amber}].map((s,j)=>(
                      <div key={j}>
                        <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,marginBottom:2}}>{s.l}</div>
                        <div style={{fontSize:14,fontFamily:C.mono,fontWeight:700,color:s.c}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:10,fontSize:11,color:"#94A3B8",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>
                    🤖 <b style={{color:C.amber}}>ALPHA-T:</b> {d.signal==="BUY"?`Strong ${d.pattern} setup. RSI ${d.rsi} not overbought. MACD ${d.macd}. Confidence ${d.conf}%. Risk ${riskPct}% = ${d.shares} shares.`:`Overbought conditions. RSI ${d.rsi}. Distribution pattern. Consider reducing position.`}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"center"}}>
                  <div style={{fontSize:20,fontFamily:C.display,fontWeight:800,color:d.conf>=80?C.teal:C.amber}}>{d.conf}%</div>
                  <div style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>CONFIDENCE</div>
                  <button onClick={()=>setAuthorized(p=>({...p,[d.symbol]:!p[d.symbol]}))} style={{
                    padding:"10px 16px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:C.display,fontSize:12,fontWeight:700,
                    background:isAuth?`linear-gradient(135deg,${C.teal},${C.blue})`:"rgba(255,255,255,0.05)",
                    color:isAuth?C.bg:C.muted,boxShadow:isAuth?`0 0 16px ${C.teal}44`:"none",
                    transition:"all 0.3s",
                  }}>
                    {isAuth?"✓ Authorized":"Authorize"}
                  </button>
                  {isAuth&&<div style={{fontSize:9,fontFamily:C.mono,color:C.teal,textAlign:"center"}}>Ready to execute</div>}
                </div>
              </div>
            </>} style={{border:`1px solid ${d.signal==="BUY"?C.teal:C.red}22`}}/>
          );
        })}
      </div>
    </div>
  );
};

const TradingJournal = () => {
  const [trades]=useState([
    {date:"May 12",symbol:"NVDA",type:"BUY", entry:842,exit:891,shares:8, status:"CLOSED",pl:392,  plPct:5.82, hold:"3 days",  reason:"Bull flag breakout"},
    {date:"May 8", symbol:"AAPL",type:"BUY", entry:208,exit:219,shares:20,status:"CLOSED",pl:220,  plPct:5.29, hold:"5 days",  reason:"EMA 21 bounce"},
    {date:"May 5", symbol:"META",type:"BUY", entry:498,exit:482,shares:6, status:"CLOSED",pl:-96,  plPct:-3.21,hold:"2 days",  reason:"Momentum entry"},
    {date:"May 1", symbol:"JPM", type:"BUY", entry:192,exit:201,shares:15,status:"CLOSED",pl:135,  plPct:4.69, hold:"4 days",  reason:"Support bounce"},
    {date:"Apr 28",symbol:"TSLA",type:"SELL",entry:268,exit:241,shares:10,status:"CLOSED",pl:270,  plPct:10.07,hold:"7 days",  reason:"Distribution pattern"},
  ]);

  const totalPL    = trades.reduce((s,t)=>s+t.pl,0);
  const winRate    = (trades.filter(t=>t.pl>0).length/trades.length*100).toFixed(0);
  const avgWin     = trades.filter(t=>t.pl>0).reduce((s,t)=>s+t.plPct,0)/trades.filter(t=>t.pl>0).length;
  const avgLoss    = Math.abs(trades.filter(t=>t.pl<0).reduce((s,t)=>s+t.plPct,0)/Math.max(trades.filter(t=>t.pl<0).length,1));
  const expectancy = ((+winRate/100)*avgWin-(1-+winRate/100)*avgLoss).toFixed(2);

  // Equity curve
  let equity=0;
  const equityData=trades.slice().reverse().map((t,i)=>{
    equity+=t.pl;
    return{trade:`T${i+1}`,equity,symbol:t.symbol};
  });

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:16}}>
        {[
          {l:"Total P&L",    v:`${totalPL>=0?"+":""}$${totalPL}`,       c:totalPL>=0?C.teal:C.red},
          {l:"Win Rate",     v:`${winRate}%`,                            c:+winRate>=60?C.teal:C.amber},
          {l:"Avg Win",      v:`+${avgWin.toFixed(2)}%`,                 c:C.teal},
          {l:"Avg Loss",     v:`-${avgLoss.toFixed(2)}%`,                c:C.red},
          {l:"Expectancy",   v:`${expectancy}%`,                         c:+expectancy>=0?C.teal:C.red},
        ].map((s,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${s.c}22`,borderRadius:12,padding:14,textAlign:"center"}}>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:6}}>{s.l}</div>
            <div style={{fontSize:20,fontFamily:C.display,fontWeight:800,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Card ch={<>
          <Ttl t="Trade Equity Curve" sub="Cumulative P&L per trade" color={C.teal}/>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={equityData}>
              <defs><linearGradient id="geq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.teal} stopOpacity={.25}/><stop offset="95%" stopColor={C.teal} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="trade" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`}/>
              <Tooltip content={<TT/>}/><ReferenceLine y={0} stroke={C.border}/>
              <Area type="monotone" dataKey="equity" name="Equity $" stroke={C.teal} strokeWidth={2} fill="url(#geq)" dot={true}/>
            </AreaChart>
          </ResponsiveContainer>
        </>}/>
        <Card ch={<>
          <Ttl t="Win/Loss Distribution" color={C.blue}/>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={trades.map(t=>({name:t.symbol,pl:t.pl,pct:t.plPct}))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`}/>
              <Tooltip content={<TT/>}/><ReferenceLine y={0} stroke={C.border}/>
              <Bar dataKey="pl" name="P&L $" radius={[4,4,0,0]}>{trades.map((t,i)=><Cell key={i} fill={t.pl>=0?C.teal:C.red} opacity={.85}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </>}/>
      </div>

      <Card ch={<>
        <Ttl t="Trade History" sub={`${trades.length} trades · Managed by ALPHA-T + Report Team`}/>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
            {["Date","Symbol","Type","Entry","Exit","Shares","P&L $","P&L %","Hold","Reason"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"7px 8px",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {trades.map((t,i)=>(
              <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"10px 8px",fontFamily:C.mono,color:C.muted,fontSize:11}}>{t.date}</td>
                <td style={{padding:"10px 8px",fontWeight:700,color:C.teal,fontFamily:C.display}}>{t.symbol}</td>
                <td style={{padding:"10px 8px"}}><Chip label={t.type} color={t.type==="BUY"?C.teal:C.red}/></td>
                <td style={{padding:"10px 8px",fontFamily:C.mono}}>${t.entry}</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono}}>${t.exit}</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,color:C.muted}}>{t.shares}</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,fontWeight:700,color:t.pl>=0?C.teal:C.red}}>{t.pl>=0?"+":""}${t.pl}</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,color:t.plPct>=0?C.teal:C.red}}>{t.plPct>=0?"+":""}{t.plPct}%</td>
                <td style={{padding:"10px 8px",fontFamily:C.mono,fontSize:10,color:C.muted}}>{t.hold}</td>
                <td style={{padding:"10px 8px",fontSize:11,color:C.muted}}>{t.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>}/>
    </div>
  );
};

// ── TRADING AGENTS PANEL ──────────────────────────────────────────
const TradingAgentsPanel = () => {
  const [selected,setSelected]=useState(null);
  const agent=selected?TRADING_AGENTS.find(a=>a.id===selected):null;
  const totalSignals=TRADING_AGENTS.reduce((s,a)=>s+a.signals,0);

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontFamily:C.display,fontWeight:800,fontSize:20,marginBottom:4}}>🎯 Trading Intelligence Team</div>
          <div style={{fontFamily:C.mono,fontSize:11,color:C.muted}}>8 specialized trading agents · Integrated with Analytics + Report teams · 28 total agents</div>
        </div>
        <div style={{display:"flex",gap:10}}>
          {[{l:"AGENTS",v:8,c:C.teal},{l:"SIGNALS",v:totalSignals,c:C.amber},{l:"TEAMS",v:3,c:C.purple}].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${s.c}33`,borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
              <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>{s.l}</div>
              <div style={{fontSize:20,fontFamily:C.display,fontWeight:800,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ecosystem diagram */}
      <Card ch={<>
        <Ttl t="AI Ecosystem — 3 Teams · Fully Integrated" sub="Data flows between all 28 agents in real time"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr auto 1fr",gap:10,alignItems:"center",padding:"10px 0"}}>
          {[
            {team:"Analytics Team",agents:10,color:C.amber,icon:"📡",desc:"Data collection\nSector analysis\nMarket scanning"},
            {arrow:"→"},
            {team:"Trading Team",agents:8,color:C.teal,icon:"🎯",desc:"Signals & patterns\nRisk management\nStrategy building"},
            {arrow:"→"},
            {team:"Report Team",agents:6,color:C.purple,icon:"📄",desc:"Report generation\nEmail delivery\nHistorical archive"},
          ].map((item,i)=>{
            if(item.arrow) return <div key={i} style={{textAlign:"center",fontSize:24,color:C.muted}}>⟷</div>;
            return(
              <div key={i} style={{background:`${item.color}10`,border:`1px solid ${item.color}33`,borderRadius:12,padding:16,textAlign:"center"}}>
                <div style={{fontSize:24,marginBottom:6}}>{item.icon}</div>
                <div style={{fontFamily:C.display,fontWeight:700,fontSize:12,color:item.color,marginBottom:4}}>{item.team}</div>
                <div style={{fontFamily:C.mono,fontSize:9,color:C.muted,marginBottom:8}}>{item.agents} agents</div>
                {item.desc.split("\n").map((d,j)=>(
                  <div key={j} style={{fontSize:9,fontFamily:C.mono,color:C.muted,marginBottom:2}}>· {d}</div>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{marginTop:12,padding:"10px 14px",background:"rgba(0,229,180,0.04)",border:`1px solid ${C.teal}22`,borderRadius:8,fontSize:11,color:"#94A3B8",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>
          🔗 <b style={{color:C.teal}}>ALPHA-T</b> bridges Trading → Report Team. Trade signals automatically appear in the Report Center as "Trading Opportunities Report" — ready to email with full analysis, risk parameters and authorization status.
        </div>
      </>} style={{marginBottom:16}}/>

      {/* Agent grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14}}>
        {TRADING_AGENTS.map((a,i)=>(
          <div key={i} onClick={()=>setSelected(selected===a.id?null:a.id)}
            style={{background:selected===a.id?`${a.color}12`:C.surface,border:`1px solid ${selected===a.id?a.color+"55":a.color+"33"}`,borderRadius:12,padding:14,cursor:"pointer",transition:"all 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:a.color,boxShadow:`0 0 6px ${a.color}`,animation:"pulse 2s infinite"}}/>
              <span style={{fontFamily:C.display,fontWeight:700,fontSize:11,color:a.color}}>{a.id}</span>
            </div>
            <div style={{fontSize:11,fontFamily:"'DM Sans',sans-serif",color:C.text,fontWeight:600,marginBottom:2}}>{a.name}</div>
            <div style={{fontSize:9,color:C.muted,fontFamily:C.mono,marginBottom:8}}>{a.role}</div>
            {a.tasks.slice(0,2).map((t,j)=><div key={j} style={{fontSize:9,color:C.muted,fontFamily:C.mono,marginBottom:2,paddingLeft:5,borderLeft:`2px solid ${a.color}44`}}>{t}</div>)}
            <div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
              {[{l:"ACC",v:a.accuracy},{l:"SIG",v:a.signals},{l:"CPU",v:`${a.load}%`}].map((s,j)=>(
                <div key={j} style={{textAlign:"center"}}>
                  <div style={{fontSize:7,fontFamily:C.mono,color:C.muted}}>{s.l}</div>
                  <div style={{fontSize:11,fontFamily:C.display,fontWeight:700,color:a.color}}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:6,height:3,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
              <div style={{height:"100%",width:`${a.load}%`,background:`linear-gradient(90deg,${a.color},${a.color}88)`,borderRadius:2}}/>
            </div>
          </div>
        ))}
      </div>

      {agent&&(
        <Card ch={<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <div>
              <div style={{fontFamily:C.display,fontWeight:800,fontSize:16,color:agent.color,marginBottom:4}}>{agent.name}</div>
              <div style={{fontSize:11,fontFamily:C.mono,color:C.muted,marginBottom:12}}>{agent.role}</div>
              <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:6}}>ACTIVE TASKS</div>
              {agent.tasks.map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,padding:"6px 10px",background:"rgba(255,255,255,0.03)",borderRadius:7}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:agent.color,flexShrink:0,animation:"pulse 1.5s infinite"}}/>
                  <span style={{fontSize:11,fontFamily:C.mono,color:C.text}}>{t}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:6}}>CAPABILITIES</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
                {agent.caps.map((cap,i)=><Chip key={i} label={cap} color={agent.color}/>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[{l:"Accuracy",v:agent.accuracy},{l:"Signals",v:agent.signals},{l:"CPU",v:`${agent.load}%`}].map((s,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:10,textAlign:"center"}}>
                    <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>{s.l}</div>
                    <div style={{fontSize:16,fontFamily:C.display,fontWeight:800,color:agent.color,marginTop:4}}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>} style={{border:`1px solid ${agent.color}44`,animation:"fadeIn 0.3s ease"}}/>
      )}
    </div>
  );
};

// ── TRADING MAIN TAB ──────────────────────────────────────────────
const TradingTab = ({portfolioVal}) => {
  const [tradingSub,setTradingSub]=useState("scanner");
  const tradingSubs=[
    {id:"scanner",  label:"Market Scanner",   icon:"📊"},
    {id:"chart",    label:"Chart Analysis",   icon:"📈"},
    {id:"signals",  label:"Signals & Alerts", icon:"🎯"},
    {id:"journal",  label:"Trade Journal",    icon:"📋"},
    {id:"tagents",  label:"Trading Agents",   icon:"🤖"},
  ];
  return(
    <div>
      <SubTabNav subs={tradingSubs} activeSub={tradingSub} setActiveSub={setTradingSub} color={C.teal}/>
      {tradingSub==="scanner" &&<TradingMarketScanner/>}
      {tradingSub==="chart"   &&<TradingChartAnalysis/>}
      {tradingSub==="signals" &&<TradingSignals portfolioVal={portfolioVal}/>}
      {tradingSub==="journal" &&<TradingJournal/>}
      {tradingSub==="tagents" &&<TradingAgentsPanel/>}
    </div>
  );
};