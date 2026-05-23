import { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, Cell, PieChart, Pie
} from "recharts";

const C = {
  bg:"#020D18",bg2:"#061525",bg3:"#0A1E34",bg4:"#0D2540",
  surface:"rgba(255,255,255,0.025)",border:"rgba(255,255,255,0.06)",
  gold:"#C9A84C",gold2:"#F0C060",teal:"#00C896",blue:"#1E90FF",
  purple:"#7B68EE",red:"#FF4C4C",green:"#00E676",amber:"#FFB300",
  pink:"#FF6B9D",cyan:"#00D4FF",
  text:"#E2EAF4",muted:"#3D5066",dim:"#162436",
  mono:"'JetBrains Mono','Fira Code',monospace",
  display:"'Inter','Segoe UI',sans-serif",
};
const BC={"Robinhood":C.teal,"Fidelity":C.blue,"TSP Federal":C.gold};
const TC={"Stock":C.blue,"ETF":C.purple,"Crypto":C.amber,"Bond":C.green};

const HOLDINGS=[
  {symbol:"AAPL",name:"Apple Inc.",     broker:"Robinhood",  fund:"Growth Stocks",sector:"Technology", type:"Stock",qty:45,  price:213.50,avgCost:178.20,beta:1.18,div:0.96,vol:18.4},
  {symbol:"NVDA",name:"NVIDIA Corp.",   broker:"Robinhood",  fund:"Growth Stocks",sector:"Technology", type:"Stock",qty:18,  price:875.20,avgCost:612.40,beta:1.72,div:0.04,vol:41.3},
  {symbol:"BTC", name:"Bitcoin",        broker:"Robinhood",  fund:"Crypto",       sector:"Crypto",     type:"Crypto",qty:0.42,price:67840, avgCost:52000, beta:1.85,div:0,   vol:62.1},
  {symbol:"ETH", name:"Ethereum",       broker:"Robinhood",  fund:"Crypto",       sector:"Crypto",     type:"Crypto",qty:3.2, price:3640,  avgCost:3100,  beta:1.61,div:0,   vol:58.4},
  {symbol:"VOO", name:"Vanguard S&P500",broker:"Fidelity",   fund:"Index ETFs",   sector:"Broad Mkt",  type:"ETF",  qty:28,  price:498.20,avgCost:441.30,beta:1.00,div:6.58,vol:14.2},
  {symbol:"MSFT",name:"Microsoft Corp.",broker:"Fidelity",   fund:"Blue Chip",    sector:"Technology", type:"Stock",qty:22,  price:418.30,avgCost:380.10,beta:0.92,div:3.00,vol:19.8},
  {symbol:"SPY", name:"SPDR S&P 500",  broker:"Fidelity",   fund:"Index ETFs",   sector:"Broad Mkt",  type:"ETF",  qty:15,  price:529.80,avgCost:498.60,beta:1.00,div:6.81,vol:14.1},
  {symbol:"TIP", name:"iShares TIPS",  broker:"TSP Federal",fund:"Gov. Bonds",   sector:"Fixed Inc.", type:"Bond", qty:120, price:107.40,avgCost:105.20,beta:0.12,div:4.11,vol:6.1},
];
const V=h=>h.qty*h.price, CO=h=>h.qty*h.avgCost, PL=h=>V(h)-CO(h), PLP=h=>(h.price-h.avgCost)/h.avgCost*100;
const TV=HOLDINGS.reduce((s,h)=>s+V(h),0);
const TC2=HOLDINGS.reduce((s,h)=>s+CO(h),0);
const TPL=TV-TC2, TPLP=TPL/TC2*100;
const TDIV=HOLDINGS.reduce((s,h)=>s+h.qty*h.div,0);

const PERIODS=[
  {id:"1D",days:1},{id:"1W",days:7},{id:"1M",days:30},{id:"3M",days:90},
  {id:"1Y",days:365},{id:"3Y",days:1095},{id:"5Y",days:1825},{id:"10Y",days:3650},
];
const genS=(base,pid,vol=0.011)=>{
  const p=PERIODS.find(x=>x.id===pid)||PERIODS[4];
  const vs={"1D":.3,"1W":.6,"1M":.8,"3M":.9,"1Y":1,"3Y":1.2,"5Y":1.3,"10Y":1.4}[pid]||1;
  const sm={"1D":.998,"1W":.988,"1M":.970,"3M":.935,"1Y":.870,"3Y":.650,"5Y":.480,"10Y":.280}[pid]||.87;
  let v=base*sm; const N=p.days,land=Math.floor(N*.88),out=[];
  for(let i=N;i>=0;i--){
    const step=N-i;
    if(step>=land){const pr=(step-land)/(N-land);v=v+(base-v)*pr*.18+(Math.random()-.5)*base*vol*vs*.25;}
    else{v+=(Math.random()-.452)*base*vol*vs;}
    v=Math.max(v,base*.15);
    const dt=new Date();dt.setDate(dt.getDate()-i);
    const fmt=p.days<=365?dt.toLocaleDateString("en",{month:"short",day:"numeric"}):dt.toLocaleDateString("en",{month:"short",year:"2-digit"});
    out.push({date:fmt,value:Math.round(v)});
  }
  out[out.length-1].value=Math.round(base);
  return out;
};

const Card=({children,style={},glow})=>(
  <div style={{background:"linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))",border:`1px solid ${glow?glow+"33":C.border}`,borderRadius:16,padding:20,backdropFilter:"blur(12px)",boxShadow:glow?`0 0 24px ${glow}14,inset 0 1px 0 rgba(255,255,255,0.06)`:"0 4px 32px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.04)",transition:"all 0.25s",...style}}>{children}</div>
);
const KPI=({label,value,sub,color=C.gold})=>(
  <div style={{background:`linear-gradient(135deg,${color}08,transparent)`,border:`1px solid ${color}22`,borderLeft:`3px solid ${color}`,borderRadius:12,padding:"15px 18px"}}>
    <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2.5,marginBottom:7,textTransform:"uppercase"}}>{label}</div>
    <div style={{fontSize:22,fontWeight:800,fontFamily:C.display,color,lineHeight:1.1}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:C.muted,fontFamily:C.mono,marginTop:5}}>{sub}</div>}
  </div>
);
const Chip=({label,color=C.muted,size=9})=>(
  <span style={{fontSize:size,fontFamily:C.mono,fontWeight:700,background:`${color}14`,color,border:`1px solid ${color}30`,borderRadius:6,padding:"2px 9px",letterSpacing:.5}}>{label}</span>
);
const PBtn=({active,onChange,color=C.gold,periods=PERIODS})=>(
  <div style={{display:"flex",gap:2,background:"rgba(0,0,0,0.4)",borderRadius:11,padding:3,border:`1px solid ${C.border}`}}>
    {periods.map(p=>{const isA=active===p.id;return(
      <button key={p.id} onClick={()=>onChange(p.id)} style={{padding:"5px 10px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:C.mono,fontSize:10,fontWeight:700,background:isA?`${color}28`:"transparent",color:isA?color:C.muted,borderBottom:isA?`2px solid ${color}`:"2px solid transparent",transition:"all 0.15s"}}>{p.id}</button>
    );})}
  </div>
);
const TT=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:`linear-gradient(135deg,${C.bg2},${C.bg3})`,border:`1px solid ${C.gold}44`,borderRadius:12,padding:"12px 16px",fontSize:11,fontFamily:C.mono,boxShadow:"0 12px 40px rgba(0,0,0,0.6)"}}>
    <div style={{color:C.muted,marginBottom:8,fontWeight:600,fontSize:10,letterSpacing:1}}>{label}</div>
    {payload.map((p,i)=>(
      <div key={i} style={{display:"flex",justifyContent:"space-between",gap:20,marginBottom:i<payload.length-1?4:0}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:8,height:8,borderRadius:2,background:p.color||p.stroke||C.gold}}/>
          <span style={{color:C.muted}}>{p.name}</span>
        </div>
        <b style={{color:p.color||p.stroke||C.text}}>{typeof p.value==="number"?p.value>1000?`$${Math.round(p.value).toLocaleString()}`:p.value.toFixed(2):p.value}</b>
      </div>
    ))}
  </div>);
};
const STN=({title,sub,color=C.gold})=>(
  <div style={{marginBottom:16}}>
    <div style={{fontFamily:C.display,fontWeight:700,fontSize:15,color,letterSpacing:-.3}}>{title}</div>
    {sub&&<div style={{fontSize:10,color:C.muted,fontFamily:C.mono,marginTop:3}}>{sub}</div>}
  </div>
);
const SubTabNav=({subs,activeSub,setActiveSub,color})=>{
  if(!subs?.length)return null;
  return(<div style={{display:"flex",gap:0,marginBottom:22,borderBottom:`1px solid ${C.border}`}}>
    {subs.map(s=>{const isA=activeSub===s.id;return(
      <button key={s.id} onClick={()=>setActiveSub(s.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"11px 22px",border:"none",cursor:"pointer",fontFamily:C.display,fontSize:12,fontWeight:600,background:isA?`${color}10`:"transparent",color:isA?color:C.muted,borderBottom:isA?`2px solid ${color}`:"2px solid transparent",marginBottom:-1,transition:"all 0.2s",borderRadius:"10px 10px 0 0"}}>
        <span style={{fontSize:15}}>{s.icon}</span><span>{s.label}</span>
      </button>
    );})}
  </div>);
};

// ═══════════════════════════════════════════════════════════
// CHART EXPAND SYSTEM
// ═══════════════════════════════════════════════════════════
const ChartModal=({title,sub,color,children,onClose})=>{
  useEffect(()=>{
    const onKey=e=>{ if(e.key==="Escape") onClose(); };
    document.addEventListener("keydown",onKey);
    return()=>document.removeEventListener("keydown",onKey);
  },[onClose]);
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:999,background:"rgba(1,8,16,0.92)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeIn 0.2s ease"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:1200,background:`linear-gradient(145deg,${C.bg2},${C.bg3})`,border:`1px solid ${color}44`,borderRadius:20,padding:28,boxShadow:`0 0 80px ${color}22, 0 32px 80px rgba(0,0,0,0.8)`,maxHeight:"90vh",overflow:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
          <div>
            <div style={{fontSize:20,fontFamily:C.display,fontWeight:800,color,letterSpacing:-.5}}>{title}</div>
            {sub&&<div style={{fontSize:11,fontFamily:C.mono,color:C.muted,marginTop:4}}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:9,border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.05)",cursor:"pointer",color:C.muted,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";e.currentTarget.style.color=C.text;}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.color=C.muted;}}>
            ✕
          </button>
        </div>
        <div style={{height:480}}>{children}</div>
        <div style={{marginTop:14,fontSize:9,fontFamily:C.mono,color:C.muted,textAlign:"center",letterSpacing:2}}>ESC OR CLICK OUTSIDE TO CLOSE</div>
      </div>
    </div>
  );
};

const ExpandBtn=({onClick,color=C.gold})=>(
  <button onClick={onClick} title="Expand chart" style={{width:28,height:28,borderRadius:7,border:`1px solid ${color}33`,background:`${color}10`,cursor:"pointer",color,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s",marginLeft:8}}
    onMouseEnter={e=>{e.currentTarget.style.background=`${color}25`;e.currentTarget.style.borderColor=`${color}66`;}}
    onMouseLeave={e=>{e.currentTarget.style.background=`${color}10`;e.currentTarget.style.borderColor=`${color}33`;}}>
    ⤢
  </button>
);


const OverviewTab=()=>{
  const [period,setPeriod]=useState("1Y");
  const [expandOv,setExpandOv]=useState(false);
  const cd=useMemo(()=>genS(TV,period),[period]);
  const sv=cd[0]?.value||TV,ret=+((TV-sv)/sv*100).toFixed(2),abs=TV-sv;
  const sectors=["Technology","Crypto","Broad Mkt","Fixed Inc."].map((s,i)=>({
    name:s,value:+(HOLDINGS.filter(h=>h.sector===s).reduce((t,h)=>t+V(h),0)/TV*100).toFixed(1),
    color:[C.blue,C.gold,C.teal,C.green][i]
  })).filter(s=>s.value>0);
  const brokers=Object.entries(BC).map(([name,color])=>{
    const bh=HOLDINGS.filter(h=>h.broker===name);
    const bv=bh.reduce((s,h)=>s+V(h),0),bc=bh.reduce((s,h)=>s+CO(h),0);
    return{name,color,value:Math.round(bv),pl:bv-bc,pct:+(bv/TV*100).toFixed(1)};
  });
  return(<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"grid",gridTemplateColumns:"2.2fr 1fr 1fr 1fr 1fr",gap:14}}>
      <div style={{background:`linear-gradient(135deg,${C.gold}12,${C.blue}06,transparent)`,border:`1px solid ${C.gold}30`,borderLeft:`4px solid ${C.gold}`,borderRadius:16,padding:"20px 24px"}}>
        <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:3,marginBottom:10}}>TOTAL PORTFOLIO VALUE</div>
        <div style={{fontSize:42,fontFamily:C.display,fontWeight:800,background:`linear-gradient(90deg,${C.gold},${C.gold2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1,marginBottom:8}}>${Math.round(TV).toLocaleString()}</div>
        <div style={{display:"flex",gap:16}}>
          <span style={{fontFamily:C.mono,fontSize:13,color:C.teal,fontWeight:700}}>+${Math.round(TPL).toLocaleString()} P&L</span>
          <span style={{fontFamily:C.mono,fontSize:13,color:C.teal}}>+{TPLP.toFixed(2)}%</span>
        </div>
      </div>
      <KPI label="Day P&L"     value="+$3,247"   sub="+0.62% today"    color={C.teal}/>
      <KPI label="Sharpe"      value="1.84"       sub="Sortino: 2.31"   color={C.blue}/>
      <KPI label="Annual Div." value={`$${Math.round(TDIV).toLocaleString()}`} sub={`Yield: ${(TDIV/TV*100).toFixed(2)}%`} color={C.green}/>
      <KPI label="Beta"        value="0.92"       sub="Low mkt risk"    color={C.purple}/>
    </div>
    <Card glow={C.gold}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <STN title="Portfolio Growth" sub="Total portfolio value over time" color={C.gold}/>
          <div style={{display:"flex",gap:16,marginTop:-10}}>
            <span style={{fontSize:13,fontFamily:C.mono,color:ret>=0?C.teal:C.red,fontWeight:700}}>{ret>=0?"+":""}{ret}% ({period})</span>
            <span style={{fontSize:13,fontFamily:C.mono,color:ret>=0?C.teal:C.red}}>{abs>=0?"+":"-"}${Math.abs(Math.round(abs)).toLocaleString()}</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center"}}>
          <PBtn active={period} onChange={setPeriod} color={C.gold}/>
          <ExpandBtn onClick={()=>setExpandOv(true)} color={C.gold}/>
        </div>
      </div>
      {expandOv&&<ChartModal title="Portfolio Growth" sub={`${period}: ${ret>=0?"+":""}${ret}% · $${Math.abs(Math.round(abs)).toLocaleString()}`} color={C.gold} onClose={()=>setExpandOv(false)}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cd} margin={{top:10,right:10,bottom:10,left:10}}>
            <defs><linearGradient id="gGM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={.35}/><stop offset="100%" stopColor={C.gold} stopOpacity={.02}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={Math.floor(cd.length/10)}/>
            <YAxis tick={{fill:C.muted,fontSize:10,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={55}/>
            <Tooltip content={<TT/>}/>
            <Area type="monotoneX" dataKey="value" name="Portfolio" stroke={C.gold} strokeWidth={3} fill="url(#gGM)" dot={false} activeDot={{r:7,fill:C.gold,stroke:C.bg,strokeWidth:2}}/>
          </AreaChart>
        </ResponsiveContainer>
      </ChartModal>}
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={cd} margin={{top:5,right:5,bottom:0,left:0}}>
          <defs><linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={.35}/><stop offset="100%" stopColor={C.gold} stopOpacity={.02}/></linearGradient></defs>
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.025)" vertical={false}/>
          <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={Math.floor(cd.length/7)}/>
          <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={50}/>
          <Tooltip content={<TT/>}/>
          <Area type="monotoneX" dataKey="value" name="Portfolio" stroke={C.gold} strokeWidth={2.5} fill="url(#gG)" dot={false} activeDot={{r:6,fill:C.gold,stroke:C.bg,strokeWidth:2}}/>
        </AreaChart>
      </ResponsiveContainer>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1.4fr",gap:14}}>
      <Card>
        <STN title="By Broker" color={C.teal}/>
        {brokers.map((b,i)=>(
          <div key={i} style={{padding:"13px 15px",marginBottom:i<brokers.length-1?8:0,background:`${b.color}07`,border:`1px solid ${b.color}20`,borderLeft:`3px solid ${b.color}`,borderRadius:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:b.color,boxShadow:`0 0 8px ${b.color}`}}/>
                <span style={{fontFamily:C.display,fontWeight:600,fontSize:13,color:b.color}}>{b.name}</span>
              </div>
              <Chip label={`${b.pct}%`} color={b.color}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontFamily:C.mono,fontSize:14,color:C.text,fontWeight:700}}>${b.value.toLocaleString()}</span>
              <span style={{fontFamily:C.mono,fontSize:12,color:b.pl>=0?C.teal:C.red,fontWeight:600}}>{b.pl>=0?"+":"-"}${Math.abs(Math.round(b.pl)).toLocaleString()}</span>
            </div>
            <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,marginTop:9}}><div style={{height:"100%",width:`${b.pct}%`,background:`linear-gradient(90deg,${b.color},${b.color}80)`,borderRadius:2}}/></div>
          </div>
        ))}
      </Card>
      <Card>
        <STN title="Sector Allocation" color={C.purple}/>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={sectors} cx="50%" cy="50%" innerRadius={48} outerRadius={82} paddingAngle={3} dataKey="value" label={({name,value})=>`${name.split(" ")[0]} ${value}%`} labelLine={false} fontSize={10}>
              {sectors.map((s,i)=><Cell key={i} fill={s.color} opacity={.9}/>)}
            </Pie>
            <Tooltip formatter={v=>`${v}%`} contentStyle={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:10,fontSize:11}}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginTop:6}}>
          {sectors.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:s.color}}/>
              <span style={{fontSize:10,fontFamily:C.mono,color:C.muted}}>{s.name.split(" ")[0]}: <b style={{color:s.color}}>{s.value}%</b></span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <STN title="All Holdings" sub="Sorted by value — with mini-sparklines" color={C.blue}/>
        <div style={{overflowY:"auto",maxHeight:250}}>
          {[...HOLDINGS].sort((a,b)=>V(b)-V(a)).map((h,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 2px",borderBottom:i<HOLDINGS.length-1?`1px solid rgba(255,255,255,0.04)`:"none",transition:"background 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:9,background:`${C.gold}12`,border:`1px solid ${C.gold}25`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:C.mono,fontSize:9,fontWeight:700,color:C.gold,flexShrink:0}}>{h.symbol.slice(0,4)}</div>
                <div>
                  <div style={{fontFamily:C.display,fontWeight:600,fontSize:12,color:C.text}}>{h.symbol}</div>
                  <div style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>{h.fund}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:50,height:22,display:"flex",alignItems:"flex-end",gap:1}}>
                  {Array.from({length:7},(_,j)=><div key={j} style={{flex:1,height:`${(30+Math.random()*70)}%`,background:PLP(h)>=0?C.teal:C.red,opacity:.5+j*.07,borderRadius:1}}/>)}
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:C.mono,fontWeight:700,fontSize:13,color:C.text}}>${Math.round(V(h)).toLocaleString()}</div>
                  <div style={{fontSize:10,fontFamily:C.mono,color:PLP(h)>=0?C.teal:C.red,fontWeight:600}}>{PLP(h)>=0?"+":""}{PLP(h).toFixed(2)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>);
};

const PerformanceTab=()=>{
  const [period,setPeriod]=useState("1Y");
  const [expandPf,setExpandPf]=useState(false);
  const cd=useMemo(()=>genS(TV,period),[period]);
  const sv=cd[0]?.value||TV,ret=+((TV-sv)/sv*100).toFixed(2),abs=TV-sv;
  const hp=[...HOLDINGS].map(h=>({name:h.symbol,ret:+PLP(h).toFixed(2),pl:Math.round(PL(h)),contrib:+(PL(h)/TPL*100).toFixed(1)})).sort((a,b)=>b.ret-a.ret);
  const wd=["Mon","Tue","Wed","Thu","Fri"].map(d=>({day:d,pl:Math.round((Math.random()-.44)*TV*.008)}));
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      <KPI label={`${period} Return`}  value={`${ret>=0?"+":""}${ret}%`}     color={ret>=0?C.teal:C.red}/>
      <KPI label={`${period} P&L`}     value={`${abs>=0?"+":"-"}$${Math.abs(Math.round(abs)).toLocaleString()}`} color={abs>=0?C.teal:C.red}/>
      <KPI label="Total Return (TWR)"  value={`+${TPLP.toFixed(2)}%`}        color={C.gold}/>
      <KPI label="MWR"                 value={`+${(TPLP*.91).toFixed(2)}%`}  color={C.blue}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
      <Card glow={C.teal}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <STN title="Portfolio Value Over Time" sub="Period selector below" color={C.teal}/>
          <div style={{display:"flex",alignItems:"center"}}>
            <PBtn active={period} onChange={setPeriod} color={C.teal}/>
            <ExpandBtn onClick={()=>setExpandPf(true)} color={C.teal}/>
          </div>
        </div>
        {expandPf&&<ChartModal title="Portfolio Value Over Time" sub={`${period}: ${ret>=0?"+":""}${ret}%`} color={C.teal} onClose={()=>setExpandPf(false)}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cd} margin={{top:10,right:10,bottom:10,left:10}}>
              <defs><linearGradient id="gTM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity={.3}/><stop offset="100%" stopColor={C.teal} stopOpacity={.02}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={Math.floor(cd.length/10)}/>
              <YAxis tick={{fill:C.muted,fontSize:10,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={55}/>
              <Tooltip content={<TT/>}/>
              <Area type="monotoneX" dataKey="value" name="Portfolio" stroke={C.teal} strokeWidth={3} fill="url(#gTM)" dot={false} activeDot={{r:7,fill:C.teal,stroke:C.bg,strokeWidth:2}}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartModal>}
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={cd} margin={{top:5,right:5,bottom:0,left:0}}>
            <defs><linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity={.3}/><stop offset="100%" stopColor={C.teal} stopOpacity={.02}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.025)" vertical={false}/>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={Math.floor(cd.length/7)}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={50}/>
            <Tooltip content={<TT/>}/>
            <Area type="monotoneX" dataKey="value" name="Portfolio" stroke={C.teal} strokeWidth={2.5} fill="url(#gT)" dot={false} activeDot={{r:6,fill:C.teal,stroke:C.bg,strokeWidth:2}}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <STN title="Weekly P&L" color={C.amber}/>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={wd} margin={{top:5,right:5,bottom:0,left:0}}>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.025)" vertical={false}/>
            <XAxis dataKey="day" tick={{fill:C.muted,fontSize:10,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(1)}k`} width={50}/>
            <Tooltip content={<TT/>}/>
            <ReferenceLine y={0} stroke={C.dim} strokeWidth={1}/>
            <Bar dataKey="pl" name="P&L $" radius={[6,6,0,0]}>{wd.map((d,i)=><Cell key={i} fill={d.pl>=0?C.teal:C.red} opacity={.85}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card>
      <STN title="Performance Attribution" sub="Return % and P&L contribution by holding" color={C.purple}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={hp} layout="vertical" margin={{top:0,right:15,bottom:0,left:0}}>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.025)" horizontal={false}/>
            <XAxis type="number" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`}/>
            <YAxis dataKey="name" type="category" tick={{fill:C.muted,fontSize:10,fontFamily:C.mono}} tickLine={false} axisLine={false} width={45}/>
            <Tooltip content={<TT/>}/>
            <ReferenceLine x={0} stroke={C.dim}/>
            <Bar dataKey="ret" name="Return %" radius={[0,6,6,0]}>{hp.map((d,i)=><Cell key={i} fill={d.ret>=0?C.teal:C.red} opacity={.85}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{overflowY:"auto",maxHeight:220}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
              {["Symbol","Return","P&L","Contrib"].map(h=><th key={h} style={{textAlign:"left",padding:"6px 8px",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1}}>{h}</th>)}
            </tr></thead>
            <tbody>{hp.map((h,i)=>(
              <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.03)`}}>
                <td style={{padding:"8px 8px",fontWeight:700,color:C.gold,fontFamily:C.mono}}>{h.name}</td>
                <td style={{padding:"8px 8px",fontFamily:C.mono,color:h.ret>=0?C.teal:C.red,fontWeight:600}}>{h.ret>=0?"+":""}{h.ret}%</td>
                <td style={{padding:"8px 8px",fontFamily:C.mono,color:h.pl>=0?C.teal:C.red}}>{h.pl>=0?"+":"-"}${Math.abs(h.pl).toLocaleString()}</td>
                <td style={{padding:"8px 8px",fontFamily:C.mono,color:C.muted}}>{h.contrib}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </Card>
  </div>);
};

const BenchmarkTab=()=>{
  const [period,setPeriod]=useState("1Y");
  const [expandBm,setExpandBm]=useState(false);
  const [vs,setVs]=useState("S&P 500");
  const [vis,setVis]=useState({"S&P 500":true,"Nasdaq":false,"Dow Jones":false,"Bitcoin":false,"Bonds":false});
  const BENCHES=[{key:"S&P 500",color:C.blue},{key:"Nasdaq",color:C.purple},{key:"Dow Jones",color:C.amber},{key:"Bitcoin",color:C.gold},{key:"Bonds",color:C.green}];
  const days=PERIODS.find(p=>p.id===period)?.days||365;
  const cd=useMemo(()=>{
    let port=100,sp=100,nq=100,dj=100,btc=100,bonds=100;
    return Array.from({length:days+1},(_,i)=>{
      if(i>0){port+=(Math.random()-.452)*1.15;sp+=(Math.random()-.448)*.88;nq+=(Math.random()-.445)*1.20;dj+=(Math.random()-.449)*.72;btc+=(Math.random()-.462)*3.4;bonds+=(Math.random()-.480)*.28;}
      const dt=new Date();dt.setDate(dt.getDate()-(days-i));
      const fmt=days<=365?dt.toLocaleDateString("en",{month:"short",day:"numeric"}):dt.toLocaleDateString("en",{month:"short",year:"2-digit"});
      return{date:fmt,"Portfolio":+port.toFixed(2),"S&P 500":+sp.toFixed(2),"Nasdaq":+nq.toFixed(2),"Dow Jones":+dj.toFixed(2),"Bitcoin":+btc.toFixed(2),"Bonds":+bonds.toFixed(2)};
    });
  },[period]);
  const last=cd[cd.length-1]||{},first=cd[0]||{};
  const pr=(last["Portfolio"]||100)-(first["Portfolio"]||100);
  const vr=(last[vs]||100)-(first[vs]||100);
  const alpha=+(pr-vr).toFixed(2);
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:12}}>
      <div style={{background:alpha>=0?"rgba(0,230,118,0.07)":"rgba(255,76,76,0.07)",border:`2px solid ${alpha>=0?C.green:C.red}30`,borderLeft:`4px solid ${alpha>=0?C.green:C.red}`,borderRadius:16,padding:"18px 22px"}}>
        <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2.5,marginBottom:8}}>ALPHA vs {vs.toUpperCase()} · {period}</div>
        <div style={{fontSize:44,fontFamily:C.display,fontWeight:800,color:alpha>=0?C.green:C.red,lineHeight:1}}>{alpha>=0?"+":""}{alpha}%</div>
        <div style={{fontSize:13,color:alpha>=0?C.green:C.red,marginTop:10,fontFamily:C.mono}}>{alpha>=0?`✅ Outperforming by ${alpha}%`:`⚠️ Underperforming by ${Math.abs(alpha)}%`}</div>
      </div>
      <KPI label="Portfolio Return" value={`${pr>=0?"+":""}${pr.toFixed(2)}%`} color={C.teal}/>
      <KPI label={`${vs} Return`}  value={`${vr>=0?"+":""}${vr.toFixed(2)}%`} color={C.blue}/>
      <KPI label="Sharpe Ratio"    value="1.84" sub="Beta: 0.92" color={C.purple}/>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {BENCHES.map(b=>(
          <button key={b.key} onClick={()=>setVis(v=>({...v,[b.key]:!v[b.key]}))} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:8,border:`1px solid ${vis[b.key]?b.color+"55":C.border}`,cursor:"pointer",background:vis[b.key]?`${b.color}12`:"transparent",color:vis[b.key]?b.color:C.muted,fontFamily:C.mono,fontSize:9,fontWeight:700,transition:"all 0.2s"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:vis[b.key]?b.color:C.dim}}/>{b.key}
          </button>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:10,fontFamily:C.mono,color:C.muted}}>Alpha vs:</span>
        <select value={vs} onChange={e=>setVs(e.target.value)} style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:9,padding:"6px 12px",color:C.text,fontSize:11,fontFamily:C.mono,cursor:"pointer"}}>
          {BENCHES.map(b=><option key={b.key} value={b.key}>{b.key}</option>)}
        </select>
        <PBtn active={period} onChange={setPeriod} color={C.blue}/>
      </div>
    </div>
    <Card glow={C.blue}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <STN title="Portfolio vs Benchmarks — Indexed to 100" sub="All series normalized at start date" color={C.blue}/>
        <ExpandBtn onClick={()=>setExpandBm(true)} color={C.blue}/>
      </div>
      {expandBm&&<ChartModal title="Portfolio vs Benchmarks" sub="Indexed to 100 — all periods normalized" color={C.blue} onClose={()=>setExpandBm(false)}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cd} margin={{top:10,right:10,bottom:10,left:10}}>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={Math.floor(days/8)}/>
            <YAxis tick={{fill:C.muted,fontSize:10,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(0)}`} width={45}/>
            <Tooltip content={<TT/>}/>
            <ReferenceLine y={100} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 2"/>
            <Legend wrapperStyle={{fontSize:11,fontFamily:C.mono,paddingTop:12}}/>
            <Line type="monotoneX" dataKey="Portfolio" stroke={C.gold} strokeWidth={3} dot={false} activeDot={{r:7,fill:C.gold,stroke:C.bg,strokeWidth:2}}/>
            {BENCHES.filter(b=>vis[b.key]).map(b=><Line key={b.key} type="monotoneX" dataKey={b.key} stroke={b.color} strokeWidth={2} dot={false} strokeDasharray="4 2" opacity={.8}/>)}
          </LineChart>
        </ResponsiveContainer>
      </ChartModal>}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={cd} margin={{top:5,right:5,bottom:0,left:0}}>
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.025)" vertical={false}/>
          <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={Math.floor(days/6)}/>
          <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(0)}`} width={45}/>
          <Tooltip content={<TT/>}/>
          <ReferenceLine y={100} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 2"/>
          <Legend wrapperStyle={{fontSize:10,fontFamily:C.mono,paddingTop:12}}/>
          <Line type="monotoneX" dataKey="Portfolio" stroke={C.gold} strokeWidth={3} dot={false} activeDot={{r:6,fill:C.gold,stroke:C.bg,strokeWidth:2}}/>
          {BENCHES.filter(b=>vis[b.key]).map(b=><Line key={b.key} type="monotoneX" dataKey={b.key} stroke={b.color} strokeWidth={1.5} dot={false} strokeDasharray="4 2" opacity={.8}/>)}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  </div>);
};

const RiskTab=()=>{
  const [period,setPeriod]=useState("1Y");
  const [expandRk,setExpandRk]=useState(false);
  const uwd=useMemo(()=>{
    const days=PERIODS.find(p=>p.id===period)?.days||365;
    let peak=TV*.87,v=TV*.87;
    return Array.from({length:days+1},(_,i)=>{
      if(i>0){v+=(Math.random()-.452)*v*.012;v=Math.max(v,TV*.4);if(v>peak)peak=v;}
      const dt=new Date();dt.setDate(dt.getDate()-(days-i));
      return{date:dt.toLocaleDateString("en",{month:"short",day:"numeric"}),drawdown:+((v-peak)/peak*100).toFixed(2)};
    });
  },[period]);
  const maxDD=Math.min(...uwd.map(d=>d.drawdown));
  const metrics=[
    {l:"Sharpe",  v:"1.84",           c:C.teal,  bar:84,desc:"Risk-adj return"},
    {l:"Sortino", v:"2.31",           c:C.blue,  bar:77,desc:"Downside risk-adj"},
    {l:"Beta",    v:"0.92",           c:C.gold,  bar:46,desc:"Mkt sensitivity"},
    {l:"VaR 95%", v:"-1.8%",          c:C.red,   bar:18,desc:"Daily at-risk"},
    {l:"Max DD",  v:`${maxDD.toFixed(1)}%`,c:C.red,bar:Math.min(Math.abs(maxDD),50),desc:"Peak to trough"},
    {l:"Ann. Vol",v:"14.8%",          c:C.amber, bar:30,desc:"Historical std dev"},
  ];
  const stress=[
    {s:"2008 Financial Crisis",i:-38.2,p:8},{s:"2020 COVID Crash",i:-22.1,p:15},
    {s:"2022 Rate Hike Cycle",i:-18.6,p:25},{s:"Tech Selloff -30%",i:-14.3,p:20},
    {s:"Crypto Winter -70%",i:-9.2,p:30},{s:"Soft Landing",i:+12.4,p:45},
  ];
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
      {metrics.map((m,i)=>(
        <div key={i} style={{background:`${m.c}07`,border:`1px solid ${m.c}22`,borderLeft:`3px solid ${m.c}`,borderRadius:12,padding:15}}>
          <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1.5,marginBottom:6}}>{m.l}</div>
          <div style={{fontSize:20,fontFamily:C.display,fontWeight:800,color:m.c,marginBottom:7}}>{m.v}</div>
          <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,marginBottom:5}}><div style={{height:"100%",width:`${m.bar}%`,background:`linear-gradient(90deg,${m.c},${m.c}80)`,borderRadius:2}}/></div>
          <div style={{fontSize:9,color:C.muted,fontFamily:C.mono}}>{m.desc}</div>
        </div>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:14}}>
      <Card glow={C.red}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><STN title="Underwater Equity Curve" sub="% below all-time high · Red = drawdown period" color={C.red}/><PBtn active={period} onChange={setPeriod} color={C.red}/></div>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={uwd} margin={{top:5,right:5,bottom:0,left:0}}>
            <defs><linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red} stopOpacity={.45}/><stop offset="100%" stopColor={C.red} stopOpacity={.04}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.025)" vertical={false}/>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={Math.floor(uwd.length/6)}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`} width={45}/>
            <Tooltip content={<TT/>}/>
            <ReferenceLine y={0} stroke={C.teal} strokeWidth={1.5} strokeDasharray="4 2"/>
            <Area type="monotoneX" dataKey="drawdown" name="Drawdown %" stroke={C.red} strokeWidth={2} fill="url(#gR)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <STN title="Stress Test Scenarios" sub="Estimated portfolio impact" color={C.amber}/>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {stress.map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:`${s.i>=0?C.green:C.red}06`,border:`1px solid ${s.i>=0?C.green:C.red}20`,borderRadius:9}}>
              <div>
                <div style={{fontSize:11,fontFamily:C.display,fontWeight:600,color:C.text}}>{s.s}</div>
                <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,marginTop:2}}>Probability: {s.p}%</div>
              </div>
              <div style={{fontFamily:C.mono,fontWeight:800,fontSize:14,color:s.i>=0?C.green:C.red}}>{s.i>=0?"+":""}{s.i}%</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>);
};

const CorrelationsTab=()=>{
  const syms=HOLDINGS.map(h=>h.symbol);
  const cm=useMemo(()=>syms.map((s1,i)=>syms.map((s2,j)=>{
    if(i===j)return 1;
    if((s1==="VOO"||s1==="SPY")&&(s2==="VOO"||s2==="SPY"))return 0.98;
    if((s1==="BTC"||s1==="ETH")&&(s2==="BTC"||s2==="ETH"))return 0.88;
    if(HOLDINGS[i].sector===HOLDINGS[j].sector)return +(0.4+Math.random()*.4).toFixed(2);
    return +(Math.random()*.5-.15).toFixed(2);
  })),[]);
  const gb=v=>v>=.8?`rgba(255,76,76,${.15+v*.55})`:v>=.5?`rgba(255,179,0,${.15+v*.35})`:v>0?`rgba(0,200,150,${.1+v*.25})`:`rgba(30,144,255,${.1+Math.abs(v)*.25})`;
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
      <KPI label="Avg Correlation"   value="0.42" sub="Moderate diversification"   color={C.amber}/>
      <KPI label="High Corr. Pairs"  value="1"    sub="VOO/SPY pair at 0.98"        color={C.red}/>
      <KPI label="Diversification"   value="Good" sub="Mix of uncorrelated assets"  color={C.teal}/>
    </div>
    <Card>
      <STN title="Correlation Heatmap" sub="1.0 = perfect · 0 = none · Negative = inverse movement" color={C.blue}/>
      <div style={{overflowX:"auto"}}>
        <div style={{display:"flex",marginLeft:56,marginBottom:4}}>
          {syms.map((s,i)=><div key={i} style={{width:56,textAlign:"center",fontSize:9,fontFamily:C.mono,color:C.muted,flexShrink:0,fontWeight:600}}>{s}</div>)}
        </div>
        {syms.map((s1,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",marginBottom:3}}>
            <div style={{width:54,fontSize:9,fontFamily:C.mono,color:C.muted,textAlign:"right",paddingRight:6,flexShrink:0,fontWeight:600}}>{s1}</div>
            {syms.map((s2,j)=>{
              const v=cm[i][j],isDiag=i===j;
              return(<div key={j} style={{width:54,height:40,borderRadius:7,marginRight:2,flexShrink:0,background:isDiag?`linear-gradient(135deg,${C.gold},${C.blue})`:gb(v),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:C.mono,fontWeight:700,color:isDiag||v>=.5?"#020D18":C.text,transition:"transform 0.1s",cursor:"default"}}
                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
                onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                {isDiag?"1.00":v.toFixed(2)}
              </div>);
            })}
          </div>
        ))}
        <div style={{display:"flex",gap:6,marginTop:12,marginLeft:56,flexWrap:"wrap"}}>
          {[{l:"Negative",c:C.blue},{l:"Low (0-0.5)",c:C.teal},{l:"Medium (0.5-0.8)",c:C.amber},{l:"High (0.8+)",c:C.red}].map((leg,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:14,height:10,borderRadius:3,background:leg.c,opacity:.7}}/>
              <span style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>{leg.l}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  </div>);
};

const DividendsTab=()=>{
  const [expandDi,setExpandDi]=useState(false);
  const [expandDr,setExpandDr]=useState(false);
  const dh=HOLDINGS.filter(h=>h.div>0).map(h=>({...h,annual:h.qty*h.div,yield:(h.div/h.price*100),yoc:(h.div/h.avgCost*100)}));
  const tot=dh.reduce((s,h)=>s+h.annual,0);
  const mo=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m=>({month:m,income:+(tot/12*(.8+Math.random()*.4)).toFixed(0)}));
  const drip=Array.from({length:21},(_,i)=>({year:`Y${i}`,value:Math.round(TV*Math.pow(1.082,i)),income:Math.round(tot*Math.pow(1.06,i))}));
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      <KPI label="Annual Income"   value={`$${Math.round(tot).toLocaleString()}`}       sub="All dividends combined"  color={C.green}/>
      <KPI label="Monthly Avg"     value={`$${Math.round(tot/12).toLocaleString()}`}    sub="Est. monthly income"     color={C.teal}/>
      <KPI label="Portfolio Yield" value={`${(tot/TV*100).toFixed(2)}%`}                sub="Yield on market value"   color={C.blue}/>
      <KPI label="Yield on Cost"   value={`${(tot/TC2*100).toFixed(2)}%`}               sub="Yield on cost basis"     color={C.gold}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Card glow={C.green}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <STN title="Monthly Income Calendar" sub="Estimated dividend income by month" color={C.green}/>
          <ExpandBtn onClick={()=>setExpandDi(true)} color={C.green}/>
        </div>
        {expandDi&&<ChartModal title="Monthly Dividend Income" sub={`Annual total: $${Math.round(tot).toLocaleString()}`} color={C.green} onClose={()=>setExpandDi(false)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mo} margin={{top:10,right:10,bottom:10,left:10}}>
              <defs><linearGradient id="gGrM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={.9}/><stop offset="100%" stopColor={C.teal} stopOpacity={.7}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="month" tick={{fill:C.muted,fontSize:11,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:11,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`} width={50}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="income" name="Income $" fill="url(#gGrM)" radius={[8,8,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartModal>}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={mo} margin={{top:5,right:5,bottom:0,left:0}}>
            <defs><linearGradient id="gGr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={.9}/><stop offset="100%" stopColor={C.teal} stopOpacity={.7}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.025)" vertical={false}/>
            <XAxis dataKey="month" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`} width={45}/>
            <Tooltip content={<TT/>}/>
            <Bar dataKey="income" name="Income $" fill="url(#gGr)" radius={[6,6,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card glow={C.teal}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <STN title="DRIP Projection — 20 Years" sub="Portfolio growth with dividend reinvestment" color={C.teal}/>
          <ExpandBtn onClick={()=>setExpandDr(true)} color={C.teal}/>
        </div>
        {expandDr&&<ChartModal title="DRIP 20-Year Projection" sub="Dividend reinvestment compounding effect" color={C.teal} onClose={()=>setExpandDr(false)}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={drip} margin={{top:10,right:10,bottom:10,left:10}}>
              <defs><linearGradient id="gDrM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity={.3}/><stop offset="100%" stopColor={C.teal} stopOpacity={.02}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="year" tick={{fill:C.muted,fontSize:11,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={2}/>
              <YAxis tick={{fill:C.muted,fontSize:11,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={55}/>
              <Tooltip content={<TT/>}/>
              <Area type="monotoneX" dataKey="value" name="Portfolio Value" stroke={C.teal} strokeWidth={3} fill="url(#gDrM)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartModal>}
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={drip} margin={{top:5,right:5,bottom:0,left:0}}>
            <defs><linearGradient id="gDr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity={.3}/><stop offset="100%" stopColor={C.teal} stopOpacity={.02}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.025)" vertical={false}/>
            <XAxis dataKey="year" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={4}/>
            <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={50}/>
            <Tooltip content={<TT/>}/>
            <Area type="monotoneX" dataKey="value" name="Portfolio Value" stroke={C.teal} strokeWidth={2.5} fill="url(#gDr)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card>
      <STN title="Dividend Holdings Detail" color={C.gold}/>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
          {["Symbol","Name","Shares","Price","Div/Share","Annual $","Yield","YoC"].map(h=><th key={h} style={{textAlign:"left",padding:"7px 10px",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1}}>{h}</th>)}
        </tr></thead>
        <tbody>{dh.sort((a,b)=>b.annual-a.annual).map((h,i)=>(
          <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.03)`,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.025)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <td style={{padding:"10px 10px",fontWeight:700,color:C.gold,fontFamily:C.mono}}>{h.symbol}</td>
            <td style={{padding:"10px 10px",color:C.muted,fontSize:11}}>{h.name}</td>
            <td style={{padding:"10px 10px",fontFamily:C.mono,color:C.muted}}>{h.qty}</td>
            <td style={{padding:"10px 10px",fontFamily:C.mono}}>${h.price.toLocaleString()}</td>
            <td style={{padding:"10px 10px",fontFamily:C.mono,color:C.green,fontWeight:600}}>${h.div.toFixed(2)}</td>
            <td style={{padding:"10px 10px",fontFamily:C.mono,fontWeight:700,color:C.teal}}>${h.annual.toFixed(0)}</td>
            <td style={{padding:"10px 10px",fontFamily:C.mono,color:C.blue}}>{h.yield.toFixed(2)}%</td>
            <td style={{padding:"10px 10px",fontFamily:C.mono,color:C.purple}}>{h.yoc.toFixed(2)}%</td>
          </tr>
        ))}
        <tr style={{borderTop:`2px solid ${C.gold}30`,background:`${C.gold}05`}}>
          <td colSpan={5} style={{padding:"10px 10px",fontFamily:C.display,fontWeight:700,color:C.gold}}>TOTAL</td>
          <td style={{padding:"10px 10px",fontFamily:C.mono,fontWeight:800,color:C.teal,fontSize:14}}>${Math.round(tot).toLocaleString()}</td>
          <td style={{padding:"10px 10px",fontFamily:C.mono,color:C.blue}}>{(tot/TV*100).toFixed(2)}%</td>
          <td style={{padding:"10px 10px",fontFamily:C.mono,color:C.purple}}>{(tot/TC2*100).toFixed(2)}%</td>
        </tr></tbody>
      </table>
    </Card>
  </div>);
};

const MonteCarloTab=()=>{
  const [expandMC,setExpandMC]=useState(false);
  const [yr,setYr]=useState(20),[tg,setTg]=useState(1000000),[co,setCo]=useState(500);
  const [re,setRe]=useState(8.2),[vo,setVo]=useState(14.8),[si,setSi]=useState(1000);
  const data=useMemo(()=>{
    let p10=TV,p50=TV,p90=TV;
    const r10=re/100-vo/100*1.28,r50=re/100,r90=re/100+vo/100*1.28;
    return Array.from({length:yr+1},(_,i)=>{
      if(i>0){p10=p10*(1+r10)+co*12;p50=p50*(1+r50)+co*12;p90=p90*(1+r90)+co*12;}
      return{year:`Y${i}`,p10:Math.round(Math.max(p10,0)),p50:Math.round(p50),p90:Math.round(p90)};
    });
  },[yr,re,vo,co]);
  const last=data[data.length-1];
  const prob=Math.min(Math.round(50+(re-5)*4+(yr>10?10:0)+(tg<(last?.p50||0)?15:0)),97);
  const SL={width:"100%",cursor:"pointer",height:4};
  const CTRLS=[
    {l:"HORIZON (YEARS)",v:yr,set:setYr,min:1,max:40,step:1,fmt:v=>`${v} yrs`,presets:[5,10,20,30],col:C.gold},
    {l:"CAPITAL TARGET",v:tg,set:setTg,min:1e5,max:5e6,step:5e4,fmt:v=>`$${(v/1e3).toFixed(0)}k`,presets:[500000,750000,1e6,2e6],col:C.blue},
    {l:"MONTHLY CONTRIBUTION",v:co,set:setCo,min:0,max:5000,step:100,fmt:v=>`$${v}`,presets:[0,250,500,1000],col:C.purple},
    {l:"EXPECTED RETURN (%)",v:re,set:setRe,min:1,max:25,step:.5,fmt:v=>`${v}%`,presets:[4,6,8.2,12],col:C.teal},
    {l:"VOLATILITY (%)",v:vo,set:setVo,min:2,max:50,step:.5,fmt:v=>`${v}%`,presets:[8,14.8,22,30],col:C.red},
  ];
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
      {CTRLS.slice(0,3).map((c,i)=>(
        <Card key={i} glow={c.col}>
          <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2.5,marginBottom:6}}>{c.l}</div>
          <div style={{fontSize:28,fontFamily:C.display,fontWeight:800,color:c.col,marginBottom:10}}>{c.fmt(c.v)}</div>
          <input type="range" min={c.min} max={c.max} step={c.step} value={c.v} onChange={e=>c.set(+e.target.value)} style={{...SL,accentColor:c.col}}/>
          <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
            {c.presets.map(p=><button key={p} onClick={()=>c.set(p)} style={{padding:"3px 9px",borderRadius:6,border:`1px solid ${c.v===p?c.col+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:9,fontWeight:700,background:c.v===p?`${c.col}18`:"transparent",color:c.v===p?c.col:C.muted,transition:"all 0.15s"}}>{c.fmt(p)}</button>)}
          </div>
        </Card>
      ))}
      {CTRLS.slice(3).map((c,i)=>(
        <Card key={i} glow={c.col}>
          <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2.5,marginBottom:6}}>{c.l}</div>
          <div style={{fontSize:28,fontFamily:C.display,fontWeight:800,color:c.col,marginBottom:10}}>{c.fmt(c.v)}</div>
          <input type="range" min={c.min} max={c.max} step={c.step} value={c.v} onChange={e=>c.set(+e.target.value)} style={{...SL,accentColor:c.col}}/>
          <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
            {c.presets.map(p=><button key={p} onClick={()=>c.set(p)} style={{padding:"3px 9px",borderRadius:6,border:`1px solid ${c.v===p?c.col+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:9,fontWeight:700,background:c.v===p?`${c.col}18`:"transparent",color:c.v===p?c.col:C.muted,transition:"all 0.15s"}}>{c.fmt(p)}</button>)}
          </div>
        </Card>
      ))}
      <Card glow={C.cyan}>
        <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2.5,marginBottom:12}}>SIMULATION RESULTS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <div style={{background:`${C.gold}10`,border:`1px solid ${C.gold}30`,borderRadius:10,padding:12,textAlign:"center"}}>
            <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>PROB TARGET</div>
            <div style={{fontSize:26,fontFamily:C.display,fontWeight:800,color:C.gold}}>{prob}%</div>
          </div>
          <div style={{background:`${C.blue}10`,border:`1px solid ${C.blue}30`,borderRadius:10,padding:12,textAlign:"center"}}>
            <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1}}>SIMULATIONS</div>
            <div style={{fontSize:26,fontFamily:C.display,fontWeight:800,color:C.blue}}>{si.toLocaleString()}</div>
          </div>
        </div>
        {[{l:"P90 Optimistic",v:`$${(last?.p90/1e3).toFixed(0)}k`,c:C.teal},{l:"P50 Base",v:`$${(last?.p50/1e3).toFixed(0)}k`,c:C.gold},{l:"P10 Pessimistic",v:`$${(last?.p10/1e3).toFixed(0)}k`,c:C.red}].map((s,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
            <span style={{fontSize:10,fontFamily:C.mono,color:C.muted}}>{s.l}</span>
            <span style={{fontSize:14,fontFamily:C.display,fontWeight:700,color:s.c}}>{s.v}</span>
          </div>
        ))}
        <div style={{display:"flex",gap:4,marginTop:10,flexWrap:"wrap"}}>
          <span style={{fontSize:9,fontFamily:C.mono,color:C.muted}}>SIMS:</span>
          {[100,500,1000,5000].map(n=><button key={n} onClick={()=>setSi(n)} style={{padding:"3px 9px",borderRadius:6,border:`1px solid ${si===n?C.blue+"55":C.border}`,cursor:"pointer",fontFamily:C.mono,fontSize:9,fontWeight:700,background:si===n?`${C.blue}18`:"transparent",color:si===n?C.blue:C.muted,transition:"all 0.15s"}}>{n}</button>)}
        </div>
      </Card>
    </div>
    <Card glow={C.purple}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <STN title={`Monte Carlo — ${si.toLocaleString()} Simulations · ${yr}-Year Horizon`} sub={`$${co}/mo · ${re}% return · ${vo}% vol`} color={C.purple}/>
        <ExpandBtn onClick={()=>setExpandMC(true)} color={C.purple}/>
      </div>
      {expandMC&&<ChartModal title={`Monte Carlo — ${si.toLocaleString()} Simulations`} sub={`${yr}-year horizon · $${co}/mo · ${re}% return · ${vo}% volatility`} color={C.purple} onClose={()=>setExpandMC(false)}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{top:10,right:60,bottom:10,left:10}}>
            <defs>
              <linearGradient id="gp9M" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity={.22}/><stop offset="100%" stopColor={C.teal} stopOpacity={0}/></linearGradient>
              <linearGradient id="gp5M" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={.22}/><stop offset="100%" stopColor={C.gold} stopOpacity={0}/></linearGradient>
              <linearGradient id="gp1M" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red}  stopOpacity={.16}/><stop offset="100%" stopColor={C.red}  stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="year" tick={{fill:C.muted,fontSize:11,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={4}/>
            <YAxis tick={{fill:C.muted,fontSize:11,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1e3).toFixed(0)}k`} width={60}/>
            <Tooltip content={<TT/>}/>
            <ReferenceLine y={tg} stroke={C.amber} strokeDasharray="5 3" label={{value:`Target $${(tg/1e3).toFixed(0)}k`,fill:C.amber,fontSize:10,fontFamily:C.mono,position:"right"}}/>
            <Legend wrapperStyle={{fontSize:11,fontFamily:C.mono,paddingTop:12}}/>
            <Area type="monotoneX" dataKey="p90" name="Optimistic (P90)" stroke={C.teal} strokeWidth={2.5} fill="url(#gp9M)" dot={false}/>
            <Area type="monotoneX" dataKey="p50" name="Base Case (P50)"  stroke={C.gold} strokeWidth={3}   fill="url(#gp5M)" dot={false}/>
            <Area type="monotoneX" dataKey="p10" name="Pessimistic (P10)"stroke={C.red}  strokeWidth={2}   fill="url(#gp1M)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </ChartModal>}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{top:5,right:50,bottom:0,left:0}}>
          <defs>
            <linearGradient id="gp9" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity={.22}/><stop offset="100%" stopColor={C.teal} stopOpacity={0}/></linearGradient>
            <linearGradient id="gp5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={.22}/><stop offset="100%" stopColor={C.gold} stopOpacity={0}/></linearGradient>
            <linearGradient id="gp1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red}  stopOpacity={.16}/><stop offset="100%" stopColor={C.red}  stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.025)" vertical={false}/>
          <XAxis dataKey="year" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={4}/>
          <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1e3).toFixed(0)}k`} width={55}/>
          <Tooltip content={<TT/>}/>
          <ReferenceLine y={tg} stroke={C.amber} strokeDasharray="5 3" label={{value:`Target $${(tg/1e3).toFixed(0)}k`,fill:C.amber,fontSize:9,fontFamily:C.mono,position:"right"}}/>
          <Legend wrapperStyle={{fontSize:10,fontFamily:C.mono,paddingTop:12}}/>
          <Area type="monotoneX" dataKey="p90" name="Optimistic (P90)" stroke={C.teal} strokeWidth={2}   fill="url(#gp9)" dot={false}/>
          <Area type="monotoneX" dataKey="p50" name="Base Case (P50)"  stroke={C.gold} strokeWidth={2.5} fill="url(#gp5)" dot={false}/>
          <Area type="monotoneX" dataKey="p10" name="Pessimistic (P10)"stroke={C.red}  strokeWidth={1.5} fill="url(#gp1)" dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  </div>);
};

const ProjectionsTab=()=>{
  const [expandPr,setExpandPr]=useState(false);
  const [horizon,setHorizon]=useState(10);
  const pd=useMemo(()=>Array.from({length:horizon+1},(_,i)=>({year:`Y${i}`,"Bull (+14%)":Math.round(TV*Math.pow(1.14,i)),"Base (+8.2%)":Math.round(TV*Math.pow(1.082,i)),"Bear (+2%)":Math.round(TV*Math.pow(1.02,i))})),[horizon]);
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
      <KPI label={`Bull ${horizon}yr`} value={`$${(TV*Math.pow(1.14,horizon)/1e3).toFixed(0)}k`}  sub="+14%/yr" color={C.teal}/>
      <KPI label={`Base ${horizon}yr`} value={`$${(TV*Math.pow(1.082,horizon)/1e3).toFixed(0)}k`} sub="+8.2%/yr" color={C.gold}/>
      <KPI label={`Bear ${horizon}yr`} value={`$${(TV*Math.pow(1.02,horizon)/1e3).toFixed(0)}k`}  sub="+2%/yr"   color={C.red}/>
    </div>
    <Card glow={C.purple}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <STN title="Portfolio Projection Scenarios" sub="Bull / Base / Bear compound growth" color={C.purple}/>
          <ExpandBtn onClick={()=>setExpandPr(true)} color={C.purple}/>
        </div>
        {expandPr&&<ChartModal title={`Portfolio Projections — ${horizon} Years`} sub="Bull +14% · Base +8.2% · Bear +2% — annualized compound growth" color={C.purple} onClose={()=>setExpandPr(false)}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pd} margin={{top:10,right:10,bottom:10,left:10}}>
              <defs>
                <linearGradient id="gBuM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity={.25}/><stop offset="100%" stopColor={C.teal} stopOpacity={0}/></linearGradient>
                <linearGradient id="gBaM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={.22}/><stop offset="100%" stopColor={C.gold} stopOpacity={0}/></linearGradient>
                <linearGradient id="gBeM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red}  stopOpacity={.16}/><stop offset="100%" stopColor={C.red}  stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="year" tick={{fill:C.muted,fontSize:11,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={Math.max(1,Math.floor(horizon/8))}/>
              <YAxis tick={{fill:C.muted,fontSize:11,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1e3).toFixed(0)}k`} width={60}/>
              <Tooltip content={<TT/>}/>
              <Legend wrapperStyle={{fontSize:11,fontFamily:C.mono,paddingTop:12}}/>
              <Area type="monotoneX" dataKey="Bull (+14%)" stroke={C.teal} strokeWidth={2.5} fill="url(#gBuM)" dot={false}/>
              <Area type="monotoneX" dataKey="Base (+8.2%)"stroke={C.gold} strokeWidth={3}   fill="url(#gBaM)" dot={false}/>
              <Area type="monotoneX" dataKey="Bear (+2%)"  stroke={C.red}  strokeWidth={2}   fill="url(#gBeM)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartModal>}
        <div style={{display:"flex",gap:3,background:"rgba(0,0,0,0.4)",borderRadius:11,padding:3}}>
          {[5,10,15,20,30].map(y=><button key={y} onClick={()=>setHorizon(y)} style={{padding:"5px 11px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:C.mono,fontSize:10,fontWeight:700,background:horizon===y?`${C.purple}30`:"transparent",color:horizon===y?C.purple:C.muted,transition:"all 0.15s"}}>{y}Y</button>)}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={pd} margin={{top:5,right:5,bottom:0,left:0}}>
          <defs>
            <linearGradient id="gBu" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity={.25}/><stop offset="100%" stopColor={C.teal} stopOpacity={0}/></linearGradient>
            <linearGradient id="gBa" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={.22}/><stop offset="100%" stopColor={C.gold} stopOpacity={0}/></linearGradient>
            <linearGradient id="gBe" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red}  stopOpacity={.16}/><stop offset="100%" stopColor={C.red}  stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.025)" vertical={false}/>
          <XAxis dataKey="year" tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={Math.max(1,Math.floor(horizon/6))}/>
          <YAxis tick={{fill:C.muted,fontSize:9,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1e3).toFixed(0)}k`} width={55}/>
          <Tooltip content={<TT/>}/>
          <Legend wrapperStyle={{fontSize:10,fontFamily:C.mono,paddingTop:12}}/>
          <Area type="monotoneX" dataKey="Bull (+14%)" stroke={C.teal} strokeWidth={2}   fill="url(#gBu)" dot={false}/>
          <Area type="monotoneX" dataKey="Base (+8.2%)"stroke={C.gold} strokeWidth={2.5} fill="url(#gBa)" dot={false}/>
          <Area type="monotoneX" dataKey="Bear (+2%)"  stroke={C.red}  strokeWidth={1.5} fill="url(#gBe)" dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  </div>);
};

const SnowflakeTab=()=>{
  const [sel,setSel]=useState(null);
  const dims=[
    {subject:"Return",    portfolio:82,benchmark:68},
    {subject:"Risk Mgmt", portfolio:75,benchmark:62},
    {subject:"Income",    portfolio:45,benchmark:55},
    {subject:"Growth",    portfolio:88,benchmark:72},
    {subject:"Diversify", portfolio:62,benchmark:78},
    {subject:"Quality",   portfolio:79,benchmark:71},
    {subject:"Momentum",  portfolio:71,benchmark:65},
    {subject:"Value",     portfolio:55,benchmark:69},
  ];
  const desc={
    "Return":    "Total return vs benchmark — above average, driven by tech & crypto alpha.",
    "Risk Mgmt": "Volatility management — slightly elevated due to crypto concentration.",
    "Income":    "Dividend income — below average, portfolio skews growth-heavy.",
    "Growth":    "Capital appreciation — strong NVDA/AAPL/MSFT multi-year performance.",
    "Diversify": "Asset diversification — could improve with Healthcare or Energy exposure.",
    "Quality":   "Portfolio quality — blue chips and ETFs anchor overall stability.",
    "Momentum":  "Price momentum — tech sector momentum remains positive.",
    "Value":     "Valuation metrics — growth holdings trade at premium multiples.",
  };
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      <KPI label="Overall Score"   value="72/100"  sub="Above average"    color={C.gold}/>
      <KPI label="vs Benchmark"    value="+4.2pts" sub="Outperforming"     color={C.teal}/>
      <KPI label="Strongest Dim."  value="Growth"  sub="Score: 88/100"    color={C.blue}/>
      <KPI label="Weakest Dim."    value="Income"  sub="Score: 45/100"    color={C.amber}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:14}}>
      <Card glow={C.teal}>
        <STN title="Portfolio Snowflake" sub="8-dimension quality radar — click a dimension for detail" color={C.teal}/>
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={dims} margin={{top:20,right:40,bottom:20,left:40}}>
            <PolarGrid stroke="rgba(255,255,255,0.07)" gridType="polygon"/>
            <PolarAngleAxis dataKey="subject" tick={{fill:C.muted,fontSize:10,fontFamily:C.mono,fontWeight:600}}/>
            <Radar name="Portfolio" dataKey="portfolio" stroke={C.gold}   fill={C.gold}   fillOpacity={.18} strokeWidth={2}   dot={{fill:C.gold,  r:4,strokeWidth:0}}/>
            <Radar name="Benchmark" dataKey="benchmark" stroke={C.blue}   fill={C.blue}   fillOpacity={.10} strokeWidth={1.5} strokeDasharray="4 2" dot={{fill:C.blue,r:3,strokeWidth:0}}/>
            <Legend wrapperStyle={{fontSize:10,fontFamily:C.mono}}/>
            <Tooltip contentStyle={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:10,fontSize:11}}/>
          </RadarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <STN title="Dimension Scores" sub="Click any row for insight" color={C.gold}/>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {dims.map((d,i)=>{
            const diff=d.portfolio-d.benchmark,isS=sel===d.subject;
            return(<div key={i} onClick={()=>setSel(isS?null:d.subject)} style={{padding:"10px 13px",borderRadius:10,cursor:"pointer",background:isS?`${C.gold}10`:C.surface,border:`1px solid ${isS?C.gold+"44":C.border}`,transition:"all 0.2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontFamily:C.display,fontWeight:600,fontSize:12,color:isS?C.gold:C.text}}>{d.subject}</span>
                <div style={{display:"flex",gap:7,alignItems:"center"}}>
                  <Chip label={`${d.portfolio}/100`} color={d.portfolio>=75?C.teal:d.portfolio>=50?C.amber:C.red}/>
                  <Chip label={diff>=0?`+${diff}`:diff} color={diff>=0?C.teal:C.red}/>
                </div>
              </div>
              <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:2}}>
                <div style={{height:"100%",width:`${d.portfolio}%`,background:`linear-gradient(90deg,${d.portfolio>=75?C.teal:d.portfolio>=50?C.amber:C.red},${d.portfolio>=75?C.teal:d.portfolio>=50?C.amber:C.red}80)`,borderRadius:2,transition:"width 0.4s ease"}}/>
              </div>
              {isS&&<div style={{fontSize:11,fontFamily:C.mono,color:C.muted,marginTop:9,lineHeight:1.6,padding:"8px 0 2px"}}>{desc[d.subject]}</div>}
            </div>);
          })}
        </div>
      </Card>
    </div>
  </div>);
};

const AITab=()=>{
  const [sel,setSel]=useState(null);
  const AGENTS=[
    {id:"NEXUS", name:"NEXUS Core",       color:C.gold,  role:"Portfolio Orchestrator",       load:94,acc:"91.2%",signals:142,status:"ACTIVE",
     tasks:["Coordinating all 9 agent outputs","Generating executive summary","Priority alert monitoring","Cross-agent data validation"],
     insight:"Portfolio showing strong momentum. Tech driving 78% of alpha. Risk metrics within parameters. Hold current allocation."},
    {id:"ALPHA", name:"ALPHA Analyst",    color:C.teal,  role:"Performance & Returns Engine", load:87,acc:"88.4%",signals:89,status:"ACTIVE",
     tasks:["TWR/MWR calculation","Attribution by holding","Benchmark vs 5 indices","Rolling returns"],
     insight:"YTD +9.74% beats S&P 500 by +2.1pts. NVDA contributing 34% of total alpha. Momentum continuing."},
    {id:"RISK",  name:"Risk Monitor",     color:C.red,   role:"Real-Time Risk Assessment",    load:96,acc:"94.1%",signals:67,status:"ALERT",
     tasks:["VaR computation","Drawdown monitoring","Correlation regime detection","Tail risk"],
     insight:"Crypto concentration at 28.7% — approaching threshold. Consider trimming BTC/ETH below 20%."},
    {id:"DIV",   name:"Income Tracker",   color:C.green, role:"Dividend Intelligence",        load:72,acc:"86.3%",signals:34,status:"ACTIVE",
     tasks:["Dividend tracking & forecasting","DRIP optimization","Ex-date monitoring","YoC tracking"],
     insight:"Annual income $902 growing +6.2% YoY. Next ex-date: VOO in 18 days."},
    {id:"PROJ",  name:"Projection Engine",color:C.purple,role:"Scenario & Forecast Modeling", load:68,acc:"79.8%",signals:28,status:"ACTIVE",
     tasks:["Monte Carlo simulations","Bull/Base/Bear scenarios","CAGR projections","Probability assessment"],
     insight:"73% probability of $1M by Year 12. Base median $1.24M at 15yr with $500/mo contributions."},
    {id:"SEC",   name:"Sector Analyst",   color:C.blue,  role:"Sector Rotation Intelligence",  load:81,acc:"83.5%",signals:51,status:"ACTIVE",
     tasks:["Sector momentum tracking","Rotation signals","Concentration monitoring","Inter-sector correlation"],
     insight:"Technology overweight at 62% vs 28% benchmark. Consider Healthcare or Energy for diversification."},
    {id:"MACRO", name:"Macro Watcher",    color:C.amber, role:"Macroeconomic Intelligence",   load:74,acc:"77.2%",signals:43,status:"ACTIVE",
     tasks:["Fed policy tracking","CPI/inflation monitoring","Yield curve analysis","GDP impact assessment"],
     insight:"Fed holding rates. Yield curve normalizing. Favorable for growth equities. TIP providing inflation hedge."},
    {id:"ESG",   name:"ESG Scorer",       color:C.pink,  role:"ESG & Quality Analysis",       load:58,acc:"81.0%",signals:19,status:"ACTIVE",
     tasks:["ESG score aggregation","Governance metrics","Environmental risk","Social scoring"],
     insight:"Portfolio ESG composite: 72/100. MSFT and AAPL score 85+. Crypto reduces overall score."},
    {id:"TAX",   name:"Tax Optimizer",    color:C.cyan,  role:"Tax Efficiency Intelligence",  load:62,acc:"88.7%",signals:22,status:"ACTIVE",
     tasks:["LT/ST gain tracking","Harvesting opportunities","Wash sale monitoring","Tax-efficient rebalancing"],
     insight:"$12,400 in LT gains eligible for 0% federal rate. All positions held >1 year. No harvesting opps currently."},
    {id:"NEWS",  name:"Sentiment Engine", color:C.muted, role:"News & Sentiment Intelligence",load:89,acc:"84.3%",signals:78,status:"ACTIVE",
     tasks:["News aggregation","Sentiment scoring","Earnings surprise tracking","Rating change alerts"],
     insight:"Positive sentiment: AAPL (iPhone cycle), NVDA (AI demand). No negative signals on holdings."},
  ];
  const tot=AGENTS.reduce((s,a)=>s+a.signals,0);
  const agent=sel?AGENTS.find(a=>a.id===sel):null;
  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      <KPI label="Active Agents"  value={AGENTS.length}    sub="All systems nominal"      color={C.teal}/>
      <KPI label="Total Signals"  value={tot}              sub="Generated last 24h"       color={C.gold}/>
      <KPI label="Avg Accuracy"   value={`${(AGENTS.reduce((s,a)=>s+parseFloat(a.acc),0)/AGENTS.length).toFixed(1)}%`} sub="Signal accuracy" color={C.green}/>
      <KPI label="Alerts Active"  value={AGENTS.filter(a=>a.status==="ALERT").length} sub="Require attention" color={C.red}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
      {AGENTS.map((a,i)=>(
        <div key={i} onClick={()=>setSel(sel===a.id?null:a.id)} style={{background:sel===a.id?`${a.color}12`:C.surface,border:`1px solid ${sel===a.id?a.color+"55":a.color+"22"}`,borderRadius:14,padding:14,cursor:"pointer",transition:"all 0.25s",boxShadow:sel===a.id?`0 0 24px ${a.color}20`:"none",transform:sel===a.id?"translateY(-2px)":"none"}}
          onMouseEnter={e=>{if(sel!==a.id){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor=a.color+"44";}}}
          onMouseLeave={e=>{if(sel!==a.id){e.currentTarget.style.transform="none";e.currentTarget.style.borderColor=a.color+"22";}}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:a.color,boxShadow:`0 0 6px ${a.color}`,animation:"pulse 2s infinite"}}/>
              <span style={{fontFamily:C.mono,fontWeight:700,fontSize:9,color:a.color}}>{a.id}</span>
            </div>
            {a.status==="ALERT"&&<Chip label="ALERT" color={C.red} size={8}/>}
          </div>
          <div style={{fontSize:11,fontFamily:C.display,fontWeight:700,color:C.text,marginBottom:2,lineHeight:1.3}}>{a.name}</div>
          <div style={{fontSize:8,color:C.muted,fontFamily:C.mono,marginBottom:8,lineHeight:1.5}}>{a.role}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:3,textAlign:"center",marginBottom:7}}>
            {[{l:"ACC",v:a.acc},{l:"SIG",v:a.signals},{l:"CPU",v:`${a.load}%`}].map((s,j)=>(
              <div key={j}><div style={{fontSize:7,fontFamily:C.mono,color:C.muted}}>{s.l}</div><div style={{fontSize:10,fontFamily:C.display,fontWeight:700,color:a.color}}>{s.v}</div></div>
            ))}
          </div>
          <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:2}}><div style={{height:"100%",width:`${a.load}%`,background:`linear-gradient(90deg,${a.color},${a.color}70)`,borderRadius:2}}/></div>
        </div>
      ))}
    </div>
    {agent&&(
      <Card glow={agent.color} style={{animation:"fadeIn 0.3s ease"}}>
        <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:24}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:agent.color,boxShadow:`0 0 10px ${agent.color}`,animation:"pulse 1.5s infinite"}}/>
              <div style={{fontFamily:C.display,fontWeight:800,fontSize:18,color:agent.color}}>{agent.name}</div>
              {agent.status==="ALERT"&&<Chip label="⚠ ALERT" color={C.red}/>}
            </div>
            <div style={{fontSize:11,fontFamily:C.mono,color:C.muted,marginBottom:14}}>{agent.role}</div>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2,marginBottom:10}}>ACTIVE TASKS</div>
            {agent.tasks.map((t,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:9,marginBottom:7,padding:"9px 13px",background:"rgba(255,255,255,0.025)",borderRadius:9}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:agent.color,marginTop:4,flexShrink:0,animation:"pulse 1.5s infinite"}}/>
                <span style={{fontSize:11,fontFamily:C.mono,color:C.text,lineHeight:1.5}}>{t}</span>
              </div>
            ))}
            <div style={{marginTop:14,padding:"12px 15px",background:`${agent.color}08`,border:`1px solid ${agent.color}25`,borderRadius:10}}>
              <div style={{fontSize:9,fontFamily:C.mono,color:agent.color,letterSpacing:2,marginBottom:6}}>LATEST INSIGHT</div>
              <div style={{fontSize:11,fontFamily:C.mono,color:C.text,lineHeight:1.6}}>{agent.insight}</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,alignContent:"start"}}>
            {[{l:"Accuracy",v:agent.acc},{l:"Signals",v:agent.signals},{l:"CPU Load",v:`${agent.load}%`},{l:"Status",v:agent.status}].map((s,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.025)",border:`1px solid ${agent.color}20`,borderRadius:10,padding:14,textAlign:"center"}}>
                <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:1,marginBottom:6}}>{s.l}</div>
                <div style={{fontSize:18,fontFamily:C.display,fontWeight:800,color:agent.color}}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )}
  </div>);
};

const PortfolioManagerTab=()=>{
  const [view,setView]=useState("all");
  const [expandPM,setExpandPM]=useState(false);
  const [ab,setAb]=useState(null);
  const [af,setAf]=useState(null);
  const [period,setPeriod]=useState("1Y");
  const [showAdd,setShowAdd]=useState(false);
  const [ticker,setTicker]=useState("");
  const [shares2,setShares2]=useState("");
  const [cost2,setCost2]=useState("");
  const [sb,setSb]=useState("");
  const [sf,setSf]=useState("");

  const BROKERS=[
    {id:"robinhood",name:"Robinhood",  color:C.teal,funds:[
      {id:"growth",name:"Growth Stocks",color:C.blue,  hlds:["AAPL","NVDA"]},
      {id:"crypto",name:"Crypto",       color:C.gold,  hlds:["BTC","ETH"]},
    ]},
    {id:"fidelity", name:"Fidelity",   color:C.blue,funds:[
      {id:"index", name:"Index ETFs",  color:C.purple,hlds:["VOO","SPY"]},
      {id:"blue",  name:"Blue Chip",   color:C.teal,  hlds:["MSFT"]},
    ]},
    {id:"tsp",      name:"TSP Federal",color:C.gold,funds:[
      {id:"bonds", name:"Gov. Bonds",  color:C.green, hlds:["TIP"]},
    ]},
  ];

  const PM=Object.fromEntries(HOLDINGS.map(h=>[h.symbol,h]));
  const gfh=f=>f.hlds.map(s=>PM[s]).filter(Boolean);
  const gfv=f=>gfh(f).reduce((s,h)=>s+V(h),0);
  const gfpl=f=>gfh(f).reduce((s,h)=>s+PL(h),0);
  const gbv=b=>b.funds.reduce((s,f)=>s+gfv(f),0);
  const gbpl=b=>b.funds.reduce((s,f)=>s+gfpl(f),0);

  const cd=useMemo(()=>genS(TV,period),[period]);
  const sv=cd[0]?.value||TV;
  const ret=+((TV-sv)/sv*100).toFixed(2);
  const cb=BROKERS.find(b=>b.id===ab);
  const cf=cb?.funds.find(f=>f.id===af);
  const bcd=useMemo(()=>cb?genS(gbv(cb),period):[]  ,[ab,period]);
  const fcd=useMemo(()=>cf?genS(gfv(cf),period):[]  ,[af,period]);

  const inp={background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 13px",color:C.text,fontSize:12,outline:"none",fontFamily:C.mono,width:"100%",transition:"border 0.2s"};

  const NB=({onClick,active,color,children})=>(
    <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:7,padding:"10px 18px",border:"none",cursor:"pointer",fontFamily:C.display,fontSize:12,fontWeight:600,background:active?`${color}10`:"transparent",color:active?color:C.muted,borderBottom:active?`2px solid ${color}`:"2px solid transparent",marginBottom:-1,transition:"all 0.2s",borderRadius:"10px 10px 0 0",whiteSpace:"nowrap"}}>
      {children}
    </button>
  );

  return(<div>
    {/* Nav */}
    <div style={{display:"flex",gap:0,marginBottom:22,borderBottom:`1px solid ${C.border}`,overflowX:"auto"}}>
      <NB onClick={()=>{setView("all");setAb(null);setAf(null);}} active={view==="all"} color={C.gold}>📊 All Portfolios</NB>
      {BROKERS.map(b=>(
        <NB key={b.id} onClick={()=>{setView("broker");setAb(b.id);setAf(null);}} active={view==="broker"&&ab===b.id} color={b.color}>
          <div style={{width:7,height:7,borderRadius:"50%",background:b.color}}/>{b.name}
          <span style={{fontSize:8,fontFamily:C.mono,background:`${b.color}22`,color:b.color,borderRadius:4,padding:"1px 6px"}}>{b.funds.length}</span>
        </NB>
      ))}
      <NB onClick={()=>setShowAdd(v=>!v)} active={showAdd} color={C.gold}>➕ Add Position</NB>
    </div>

    {/* Add Position Form */}
    {showAdd&&(
      <Card glow={C.gold} style={{marginBottom:18,animation:"fadeIn 0.3s ease"}}>
        <STN title="Add New Position" sub="Assign to broker and fund — price auto-loads if symbol exists" color={C.gold}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
          <div>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2,marginBottom:5}}>TICKER</div>
            <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} placeholder="AAPL, BTC..." style={{...inp,fontSize:16,fontWeight:700,color:C.gold,letterSpacing:2}}/>
            {ticker&&PM[ticker]&&<div style={{fontSize:10,fontFamily:C.mono,color:C.teal,marginTop:5,padding:"5px 8px",background:`${C.teal}08`,borderRadius:6}}>✅ {PM[ticker].name} · <b>${PM[ticker].price.toLocaleString()}</b></div>}
          </div>
          <div>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2,marginBottom:5}}>SHARES</div>
            <input value={shares2} onChange={e=>setShares2(e.target.value)} placeholder="10, 0.5..." type="number" style={inp}/>
            {shares2&&cost2&&<div style={{fontSize:10,fontFamily:C.mono,color:C.muted,marginTop:4}}>Total: <b style={{color:C.gold}}>${(+shares2*+cost2).toLocaleString(undefined,{maximumFractionDigits:0})}</b></div>}
          </div>
          <div>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2,marginBottom:5}}>AVG COST ($)</div>
            <input value={cost2} onChange={e=>setCost2(e.target.value)} placeholder="178.20" type="number" style={inp}/>
          </div>
          <div>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2,marginBottom:5}}>BROKER</div>
            <select value={sb} onChange={e=>{setSb(e.target.value);setSf("");}} style={{...inp,cursor:"pointer"}}>
              <option value="">Select broker...</option>
              {BROKERS.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2,marginBottom:5}}>FUND</div>
            <select value={sf} onChange={e=>setSf(e.target.value)} style={{...inp,cursor:"pointer"}} disabled={!sb}>
              <option value="">Select fund...</option>
              {BROKERS.find(b=>b.id===sb)?.funds.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:14}}>
          <button style={{padding:"11px 28px",borderRadius:11,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${C.gold},${C.gold2})`,color:C.bg,fontFamily:C.display,fontSize:13,fontWeight:800,boxShadow:`0 0 24px ${C.gold}44`,letterSpacing:.5}}>✓ Add Position</button>
          <button onClick={()=>setShowAdd(false)} style={{padding:"11px 20px",borderRadius:11,border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.muted,fontFamily:C.display,fontSize:13,fontWeight:600}}>Cancel</button>
        </div>
      </Card>
    )}

    {/* ALL VIEW */}
    {view==="all"&&(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          <KPI label="Total Value" value={`$${Math.round(TV).toLocaleString()}`}             color={C.gold}/>
          <KPI label="Total P&L"   value={`+$${Math.round(TPL).toLocaleString()}`}           color={C.teal}/>
          <KPI label={`${period} Ret`} value={`${ret>=0?"+":""}${ret}%`}                     color={ret>=0?C.teal:C.red}/>
          <KPI label="Brokers"     value={BROKERS.length} sub={`${BROKERS.reduce((s,b)=>s+b.funds.length,0)} funds total`} color={C.blue}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
          <Card glow={C.gold}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
              <STN title="Portfolio Growth" sub={`${period}: ${ret>=0?"+":""}${ret}%`} color={C.gold}/>
              <div style={{display:"flex",alignItems:"center"}}><PBtn active={period} onChange={setPeriod} color={C.gold}/><ExpandBtn onClick={()=>setExpandPM(true)} color={C.gold}/></div></div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={cd} margin={{top:5,right:5,bottom:0,left:0}}>
                <defs><linearGradient id="gAllPM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={.3}/><stop offset="100%" stopColor={C.gold} stopOpacity={.02}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.025)" vertical={false}/>
                <XAxis dataKey="date" tick={{fill:C.muted,fontSize:8,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={Math.floor(cd.length/6)}/>
                <YAxis tick={{fill:C.muted,fontSize:8,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1e3).toFixed(0)}k`} width={50}/>
                <Tooltip content={<TT/>}/>
                <Area type="monotoneX" dataKey="value" name="Portfolio" stroke={C.gold} strokeWidth={2.5} fill="url(#gAllPM)" dot={false} activeDot={{r:5,fill:C.gold,stroke:C.bg,strokeWidth:2}}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <STN title="Broker Overview" color={C.teal}/>
            {BROKERS.map((b,i)=>{const bv=gbv(b),bpl=gbpl(b);return(
              <div key={i} onClick={()=>{setView("broker");setAb(b.id);}} style={{padding:"12px 14px",marginBottom:i<BROKERS.length-1?8:0,background:`${b.color}07`,border:`1px solid ${b.color}20`,borderLeft:`3px solid ${b.color}`,borderRadius:10,cursor:"pointer",transition:"all 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.background=`${b.color}13`}
                onMouseLeave={e=>e.currentTarget.style.background=`${b.color}07`}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:b.color,boxShadow:`0 0 6px ${b.color}`}}/>
                    <span style={{fontFamily:C.display,fontWeight:600,fontSize:13,color:b.color}}>{b.name}</span>
                  </div>
                  <span style={{fontFamily:C.mono,fontSize:11,color:C.muted}}>→</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                  <span style={{fontFamily:C.mono,fontWeight:700,color:C.text}}>${Math.round(bv).toLocaleString()}</span>
                  <span style={{fontFamily:C.mono,color:bpl>=0?C.teal:C.red,fontSize:12,fontWeight:600}}>{bpl>=0?"+":"-"}${Math.abs(Math.round(bpl)).toLocaleString()}</span>
                </div>
              </div>
            );})}
          </Card>
        </div>
        <Card>
          <STN title="Complete Holdings" sub="All positions across all brokers and funds" color={C.purple}/>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
              {["Symbol","Name","Broker","Fund","Type","Qty","Price","Value","P&L $","P&L %"].map(h=><th key={h} style={{textAlign:"left",padding:"7px 10px",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1,whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>{[...HOLDINGS].sort((a,b)=>V(b)-V(a)).map((h,i)=>(
              <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.03)`,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.025)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"10px 10px",fontWeight:700,color:C.gold,fontFamily:C.mono}}>{h.symbol}</td>
                <td style={{padding:"10px 10px",color:C.muted,fontSize:11}}>{h.name}</td>
                <td style={{padding:"10px 10px"}}><Chip label={h.broker.split(" ")[0]} color={BC[h.broker]||C.muted}/></td>
                <td style={{padding:"10px 10px",fontSize:11,color:C.muted}}>{h.fund}</td>
                <td style={{padding:"10px 10px"}}><Chip label={h.type} color={TC[h.type]||C.muted}/></td>
                <td style={{padding:"10px 10px",fontFamily:C.mono,color:C.muted}}>{h.qty}</td>
                <td style={{padding:"10px 10px",fontFamily:C.mono,fontWeight:600}}>${h.price.toLocaleString()}</td>
                <td style={{padding:"10px 10px",fontFamily:C.mono,fontWeight:700}}>${Math.round(V(h)).toLocaleString()}</td>
                <td style={{padding:"10px 10px",fontFamily:C.mono,color:PL(h)>=0?C.teal:C.red,fontWeight:600}}>{PL(h)>=0?"+":"-"}${Math.abs(Math.round(PL(h))).toLocaleString()}</td>
                <td style={{padding:"10px 10px",fontFamily:C.mono,color:PLP(h)>=0?C.teal:C.red,fontWeight:700}}>{PLP(h)>=0?"+":""}{PLP(h).toFixed(2)}%</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      </div>
    )}

    {/* BROKER VIEW */}
    {view==="broker"&&cb&&(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:`linear-gradient(135deg,${cb.color}10,transparent)`,border:`1px solid ${cb.color}30`,borderLeft:`4px solid ${cb.color}`,borderRadius:16,padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2.5,marginBottom:4}}>BROKER ANALYSIS</div>
            <div style={{fontSize:22,fontFamily:C.display,fontWeight:800,color:cb.color}}>{cb.name}</div>
            <div style={{fontSize:10,fontFamily:C.mono,color:C.muted,marginTop:3}}>{cb.funds.length} funds · {cb.funds.reduce((s,f)=>s+f.hlds.length,0)} holdings</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:28,fontFamily:C.mono,fontWeight:800,color:cb.color}}>${Math.round(gbv(cb)).toLocaleString()}</div>
            <div style={{fontSize:13,fontFamily:C.mono,color:gbpl(cb)>=0?C.teal:C.red,marginTop:3,fontWeight:600}}>{gbpl(cb)>=0?"+":"-"}${Math.abs(Math.round(gbpl(cb))).toLocaleString()} P&L</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
          <Card glow={cb.color}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><STN title={`${cb.name} — Growth`} color={cb.color}/><PBtn active={period} onChange={setPeriod} color={cb.color}/></div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={bcd} margin={{top:5,right:5,bottom:0,left:0}}>
                <defs><linearGradient id="gBrk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={cb.color} stopOpacity={.28}/><stop offset="100%" stopColor={cb.color} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.025)" vertical={false}/>
                <XAxis dataKey="date" tick={{fill:C.muted,fontSize:8,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={Math.floor(bcd.length/6)}/>
                <YAxis tick={{fill:C.muted,fontSize:8,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1e3).toFixed(0)}k`} width={50}/>
                <Tooltip content={<TT/>}/>
                <Area type="monotoneX" dataKey="value" name="Value" stroke={cb.color} strokeWidth={2.5} fill="url(#gBrk)" dot={false} activeDot={{r:5,fill:cb.color,stroke:C.bg,strokeWidth:2}}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <STN title="Funds" color={cb.color}/>
            {cb.funds.map((f,i)=>{const fv=gfv(f),fpl=gfpl(f);return(
              <div key={i} onClick={()=>{setView("fund");setAf(f.id);}} style={{padding:"12px 14px",marginBottom:i<cb.funds.length-1?8:0,background:`${f.color}07`,border:`1px solid ${f.color}20`,borderLeft:`3px solid ${f.color}`,borderRadius:10,cursor:"pointer",transition:"all 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.background=`${f.color}13`}
                onMouseLeave={e=>e.currentTarget.style.background=`${f.color}07`}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                  <div style={{width:7,height:7,borderRadius:2,background:f.color}}/>
                  <span style={{fontFamily:C.display,fontWeight:600,fontSize:12,color:f.color}}>{f.name}</span>
                  <span style={{fontFamily:C.mono,fontSize:9,color:C.muted,marginLeft:"auto"}}>{f.hlds.length} →</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontFamily:C.mono,fontWeight:700,color:C.text}}>${Math.round(fv).toLocaleString()}</span>
                  <span style={{fontFamily:C.mono,color:fpl>=0?C.teal:C.red,fontSize:12,fontWeight:600}}>{fpl>=0?"+":"-"}${Math.abs(Math.round(fpl)).toLocaleString()}</span>
                </div>
              </div>
            );})}
          </Card>
        </div>
      </div>
    )}

    {/* FUND VIEW */}
    {view==="fund"&&cb&&cf&&(()=>{
      const fh=gfh(cf),fv=gfv(cf),fpl=gfpl(cf),fplp=fpl/fv*100;
      return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:`linear-gradient(135deg,${cf.color}10,transparent)`,border:`1px solid ${cf.color}30`,borderLeft:`4px solid ${cf.color}`,borderRadius:16,padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:9,fontFamily:C.mono,color:C.muted,letterSpacing:2.5,marginBottom:4}}>{cb.name} · FUND</div>
            <div style={{fontSize:22,fontFamily:C.display,fontWeight:800,color:cf.color}}>{cf.name}</div>
            <div style={{fontSize:10,fontFamily:C.mono,color:C.muted,marginTop:3}}>{fh.length} holdings</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:28,fontFamily:C.mono,fontWeight:800,color:cf.color}}>${Math.round(fv).toLocaleString()}</div>
            <div style={{fontSize:13,fontFamily:C.mono,color:fpl>=0?C.teal:C.red,marginTop:3,fontWeight:600}}>{fpl>=0?"+":"-"}${Math.abs(Math.round(fpl)).toLocaleString()} · {fplp>=0?"+":""}{fplp.toFixed(2)}%</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          <KPI label="Fund Value" value={`$${Math.round(fv).toLocaleString()}`}                                  color={cf.color}/>
          <KPI label="Total P&L"  value={`${fpl>=0?"+":"-"}$${Math.abs(Math.round(fpl)).toLocaleString()}`}    color={fpl>=0?C.teal:C.red}/>
          <KPI label="Return"     value={`${fplp>=0?"+":""}${fplp.toFixed(2)}%`}                                 color={fplp>=0?C.teal:C.red}/>
          <KPI label="Holdings"   value={fh.length}                                                               color={cf.color}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
          <Card glow={cf.color}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><STN title={`${cf.name} — Growth`} color={cf.color}/><PBtn active={period} onChange={setPeriod} color={cf.color}/></div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={fcd} margin={{top:5,right:5,bottom:0,left:0}}>
                <defs><linearGradient id="gFnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={cf.color} stopOpacity={.3}/><stop offset="100%" stopColor={cf.color} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.025)" vertical={false}/>
                <XAxis dataKey="date" tick={{fill:C.muted,fontSize:8,fontFamily:C.mono}} tickLine={false} axisLine={false} interval={Math.floor(fcd.length/6)}/>
                <YAxis tick={{fill:C.muted,fontSize:8,fontFamily:C.mono}} tickLine={false} axisLine={false} tickFormatter={v=>`$${(v/1e3).toFixed(0)}k`} width={50}/>
                <Tooltip content={<TT/>}/>
                <Area type="monotoneX" dataKey="value" name="Fund Value" stroke={cf.color} strokeWidth={2.5} fill="url(#gFnd)" dot={false} activeDot={{r:5,fill:cf.color,stroke:C.bg,strokeWidth:2}}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <STN title="Allocation" color={cf.color}/>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={fh.map(h=>({name:h.symbol,value:+(V(h)/fv*100).toFixed(1)}))} cx="50%" cy="50%" innerRadius={42} outerRadius={78} paddingAngle={3} dataKey="value" label={({name,value})=>`${name} ${value}%`} labelLine={false} fontSize={10}>
                  {fh.map((_,i)=><Cell key={i} fill={[C.teal,C.gold,C.blue,C.purple,C.red][i%5]}/>)}
                </Pie>
                <Tooltip formatter={v=>`${v}%`} contentStyle={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:10,fontSize:11}}/>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <Card>
          <STN title="Fund Holdings Detail" color={cf.color}/>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
              {["Symbol","Name","Qty","Price","Value","P&L $","P&L %","Weight"].map(h=><th key={h} style={{textAlign:"left",padding:"7px 10px",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1}}>{h}</th>)}
            </tr></thead>
            <tbody>{fh.map((h,i)=>(
              <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.03)`,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.025)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"10px 10px",fontWeight:700,color:cf.color,fontFamily:C.mono}}>{h.symbol}</td>
                <td style={{padding:"10px 10px",color:C.muted,fontSize:11}}>{h.name}</td>
                <td style={{padding:"10px 10px",fontFamily:C.mono,color:C.muted}}>{h.qty}</td>
                <td style={{padding:"10px 10px",fontFamily:C.mono,fontWeight:600}}>${h.price.toLocaleString()}</td>
                <td style={{padding:"10px 10px",fontFamily:C.mono,fontWeight:700}}>${Math.round(V(h)).toLocaleString()}</td>
                <td style={{padding:"10px 10px",fontFamily:C.mono,color:PL(h)>=0?C.teal:C.red,fontWeight:600}}>{PL(h)>=0?"+":"-"}${Math.abs(Math.round(PL(h))).toLocaleString()}</td>
                <td style={{padding:"10px 10px",fontFamily:C.mono,color:PLP(h)>=0?C.teal:C.red,fontWeight:700}}>{PLP(h)>=0?"+":""}{PLP(h).toFixed(2)}%</td>
                <td style={{padding:"10px 10px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:44,height:4,background:"rgba(255,255,255,0.05)",borderRadius:2}}><div style={{height:"100%",width:`${V(h)/fv*100}%`,background:cf.color,borderRadius:2}}/></div>
                    <span style={{fontFamily:C.mono,fontSize:10,color:C.muted}}>{(V(h)/fv*100).toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      </div>);
    })()}
  </div>);
};

const TABS=[
  {id:"overview",    label:"📊 Overview",            color:C.gold,   subs:null},
  {id:"performance", label:"📈 Performance",         color:C.teal,   subs:[
    {id:"perf",      label:"Performance",  icon:"📈"},
    {id:"benchmark", label:"Benchmark",    icon:"📐"},
  ]},
  {id:"risk",        label:"🛡 Risk",                color:C.red,    subs:[
    {id:"risk",      label:"Risk Analysis",icon:"🛡"},
    {id:"corr",      label:"Correlations", icon:"🔥"},
  ]},
  {id:"dividends",   label:"💰 Dividends",           color:C.green,  subs:null},
  {id:"projections", label:"🔮 Projections",         color:C.purple, subs:[
    {id:"proj",      label:"Projections",  icon:"🔮"},
    {id:"mc",        label:"Monte Carlo",  icon:"🎲"},
  ]},
  {id:"snowflake",   label:"❄️ Snowflake",           color:C.cyan,   subs:null},
  {id:"ai",          label:"🤖 AI Intelligence",     color:C.amber,  subs:null},
  {id:"portfolio",   label:"💼 Portfolio Manager",   color:C.blue,   subs:null},
];

export default function App(){
  const [tab,setTab]=useState("overview");
  const [sub,setSub]=useState({});
  const [liveTV,setLiveTV]=useState(TV);
  const [livePL,setLivePL]=useState(3247.80);

  useEffect(()=>{
    const id=setInterval(()=>{
      setLiveTV(v=>+(v+(Math.random()-.48)*120).toFixed(2));
      setLivePL(v=>+(v+(Math.random()-.48)*80).toFixed(2));
    },2000);
    return()=>clearInterval(id);
  },[]);

  const cur=TABS.find(t=>t.id===tab);
  const col=cur?.color||C.gold;
  const activeSub=cur?.subs?(sub[tab]||cur.subs[0].id):null;
  const setAS=id=>setSub(p=>({...p,[tab]:id}));

  return(
    <div style={{minHeight:"100vh",background:`radial-gradient(ellipse 120% 80% at 50% -10%,${C.bg3} 0%,${C.bg} 60%)`,color:C.text,fontFamily:C.display}}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap");
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.25);border-radius:2px}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(1.6)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        input::placeholder{color:#3D5066}
        select option{background:#061525;color:#E2EAF4}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input:focus{outline:none;border-color:rgba(201,168,76,0.45)!important}
        button:focus{outline:none}
        th{user-select:none}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{borderBottom:`1px solid rgba(201,168,76,0.12)`,background:"rgba(2,13,24,0.97)",backdropFilter:"blur(24px)",position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 32px rgba(0,0,0,0.4)"}}>
        <div style={{maxWidth:"100%",margin:"0 auto",padding:"0 32px"}}>

          {/* Top bar */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:58}}>
            {/* Logo */}
            <div style={{display:"flex",alignItems:"center",gap:13}}>
              <div style={{width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${C.gold},${C.blue})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,boxShadow:`0 0 28px ${C.gold}44,0 0 0 1px ${C.gold}22`}}>⬡</div>
              <div>
                <div style={{fontWeight:800,fontSize:17,letterSpacing:-.6,background:`linear-gradient(90deg,${C.gold},${C.gold2} 40%,${C.blue})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Portfolio Command Center</div>
                <div style={{fontSize:9,color:C.muted,fontFamily:C.mono,letterSpacing:2.5}}>v2.0 · 10 AI AGENTS · BLOOMBERG PRO</div>
              </div>
            </div>

            {/* Live stats */}
            <div style={{display:"flex",gap:0,alignItems:"center"}}>
              {[
                {l:"PORTFOLIO",  v:`$${liveTV.toLocaleString("en",{minimumFractionDigits:2})}`,c:C.gold},
                {l:"DAY P&L",    v:`${livePL>=0?"+":""}$${Math.abs(livePL).toFixed(2)}`,       c:livePL>=0?C.teal:C.red},
                {l:"YTD RETURN", v:"+9.74%",  c:C.teal},
                {l:"SHARPE",     v:"1.84",    c:C.blue},
                {l:"BETA",       v:"0.92",    c:C.purple},
              ].map((s,i)=>(
                <div key={i} style={{textAlign:"center",padding:"6px 18px",borderRight:i<4?`1px solid rgba(255,255,255,0.05)`:"none"}}>
                  <div style={{fontSize:8,fontFamily:C.mono,color:C.muted,letterSpacing:2,marginBottom:3}}>{s.l}</div>
                  <div style={{fontSize:14,fontFamily:C.mono,fontWeight:700,color:s.c,transition:"color 0.3s"}}>{s.v}</div>
                </div>
              ))}
              <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:14,background:"rgba(0,200,150,0.07)",border:`1px solid rgba(0,200,150,0.18)`,borderRadius:24,padding:"5px 14px"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:C.teal,display:"inline-block",animation:"pulse 1.8s infinite"}}/>
                <span style={{fontSize:9,fontFamily:C.mono,color:C.teal,fontWeight:700,letterSpacing:1.5}}>LIVE</span>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{display:"flex",gap:0,overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"10px 17px",border:"none",cursor:"pointer",fontFamily:"Inter",fontSize:12,fontWeight:600,whiteSpace:"nowrap",background:tab===t.id?`${t.color}10`:"transparent",color:tab===t.id?t.color:C.muted,borderBottom:tab===t.id?`2px solid ${t.color}`:"2px solid transparent",transition:"all 0.2s"}}>
                {t.label}
                {t.subs&&<span style={{fontSize:8,background:`${t.color}20`,color:t.color,borderRadius:5,padding:"1px 6px",fontFamily:"JetBrains Mono"}}>{t.subs.length}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{maxWidth:"100%",margin:"0 auto",padding:"24px 32px",animation:"fadeIn 0.35s ease"}}>
        {tab==="overview"   &&<OverviewTab/>}
        {tab==="performance"&&<div><SubTabNav subs={cur?.subs} activeSub={activeSub} setActiveSub={setAS} color={col}/>{activeSub==="perf"&&<PerformanceTab/>}{activeSub==="benchmark"&&<BenchmarkTab/>}</div>}
        {tab==="risk"       &&<div><SubTabNav subs={cur?.subs} activeSub={activeSub} setActiveSub={setAS} color={col}/>{activeSub==="risk"&&<RiskTab/>}{activeSub==="corr"&&<CorrelationsTab/>}</div>}
        {tab==="dividends"  &&<DividendsTab/>}
        {tab==="projections"&&<div><SubTabNav subs={cur?.subs} activeSub={activeSub} setActiveSub={setAS} color={col}/>{activeSub==="proj"&&<ProjectionsTab/>}{activeSub==="mc"&&<MonteCarloTab/>}</div>}
        {tab==="snowflake"  &&<SnowflakeTab/>}
        {tab==="ai"         &&<AITab/>}
        {tab==="portfolio"  &&<PortfolioManagerTab/>}

        <div style={{marginTop:48,textAlign:"center",color:"rgba(255,255,255,0.04)",fontSize:9,fontFamily:"JetBrains Mono",letterSpacing:3}}>
          PORTFOLIO COMMAND CENTER v2.0 · BLOOMBERG PROFESSIONAL · 10 AI AGENTS
        </div>
      </div>
    </div>
  );
}
