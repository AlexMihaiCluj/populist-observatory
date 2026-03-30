import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabase";
import { Search, ChevronRight, Award, TrendingUp, Users, FileText, Send, Star, Filter, Globe, BookOpen, Shield, ArrowLeft, CheckCircle, AlertTriangle, BarChart3, Menu, X, Loader2, ExternalLink, Calendar, Tag, MapPin, Lock, ThumbsUp, ThumbsDown } from "lucide-react";

const ADMIN_PASSWORD = "PG-Admin-2026!Observatory";
const CATEGORIES = ["EU Governance","Migration","Climate Policy","EU Budget","Public Health","Security & Defence","Economy & Trade","Rule of Law","Digital Policy","Social Policy"];
const VERDICTS = ["False","Mostly False","Misleading","Exaggerated","Mixed","Mostly True","True"];
const COUNTRIES = ["Romania","Hungary","France","Italy","Poland","Germany","Spain","Netherlands","Austria","Czech Republic","Slovakia","Bulgaria","Greece","Belgium","Sweden","Denmark","Finland","Portugal","Ireland","Croatia","Other EU","Non-EU"];
const VERDICT_COLORS = {"False":"bg-red-600","Mostly False":"bg-orange-500","Misleading":"bg-amber-500","Exaggerated":"bg-yellow-500","Mixed":"bg-gray-500","Mostly True":"bg-emerald-500","True":"bg-green-600"};
const BADGE_DEFS = {"Top Contributor":{min:200,color:"bg-emerald-100 text-emerald-800"},"Fact-Checker Pro":{min:150,color:"bg-amber-100 text-amber-800"},"EU Expert":{min:100,color:"bg-blue-100 text-blue-800"},"Rising Star":{min:50,color:"bg-rose-100 text-rose-800"},"Newcomer":{min:0,color:"bg-gray-100 text-gray-600"}};

function getBadges(p){return Object.entries(BADGE_DEFS).filter(([,d])=>p>=d.min).map(([n])=>n);}
function getBadgeColor(b){return BADGE_DEFS[b]?.color||"bg-gray-100 text-gray-600";}

function useAnalyses(){
  const [analyses,setAnalyses]=useState([]);
  const [loading,setLoading]=useState(true);
  const [stats,setStats]=useState({total:0,contributors:0,countries:0,visitors:0});
  const fetch_=useCallback(async()=>{
    setLoading(true);
    const [{data,error},{count}]=await Promise.all([
      supabase.from("analyses").select("*").eq("status","approved").order("created_at",{ascending:false}),
      supabase.from("visits").select("*",{count:"exact",head:true})
    ]);
    if(!error&&data){setAnalyses(data);setStats({total:data.length,contributors:new Set(data.map(a=>a.author_email)).size,countries:new Set(data.map(a=>a.country)).size,visitors:count||0});}
    setLoading(false);
  },[]);
  useEffect(()=>{
    fetch_();
    supabase.from("visits").insert([{}]);
  },[fetch_]);
  return {analyses,loading,stats,refresh:fetch_};
}

function useLeaderboard(analyses){
  return useMemo(()=>{
    const m={};
    analyses.forEach(a=>{if(!m[a.author_email])m[a.author_email]={name:a.author_name,email:a.author_email,points:0,analyses:0};m[a.author_email].points+=(a.points||0);m[a.author_email].analyses+=1;});
    return Object.values(m).sort((a,b)=>b.points-a.points).map((u,i)=>({...u,rank:i+1,badges:getBadges(u.points)}));
  },[analyses]);
}

function EUFlag({size="md"}){
  const s=size==="sm"?"w-16":size==="lg"?"w-24":"w-20";
  return(<img src="/eu_cofunded_logo_2.jpg" alt="Co-funded by the European Union" className={`${s} object-contain`}/>);
}
function VerdictBadge({verdict}){return(<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${VERDICT_COLORS[verdict]||"bg-gray-500"}`}>{verdict}</span>);}
function Spinner(){return<div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-blue-600 animate-spin"/></div>;}
function EmptyState({icon:Icon,title,subtitle}){return(<div className="text-center py-16 text-gray-400"><Icon className="w-12 h-12 mx-auto mb-3 opacity-50"/><p className="text-lg font-medium">{title}</p>{subtitle&&<p className="text-sm mt-1">{subtitle}</p>}</div>);}
function StatCard({icon:Icon,value,label,color}){return(<div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:shadow-md transition-shadow"><div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}><Icon className="w-5 h-5 text-white"/></div><div><div className="text-2xl font-bold text-gray-900">{value}</div><div className="text-sm text-gray-500 mt-0.5">{label}</div></div></div>);}

function AnalysisCard({analysis:a,onClick}){
  return(<div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group" onClick={onClick}>
    <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{a.country}</span><span className="text-xs text-gray-400">·</span><span className="text-xs text-gray-400">{a.category}</span></div><VerdictBadge verdict={a.verdict}/></div>
    <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors leading-snug line-clamp-2">{a.title}</h3>
    <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{a.summary}</p>
    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"><span className="text-xs font-bold text-blue-800">{(a.author_name||"?")[0]}</span></div><span className="text-sm text-gray-600">{a.author_name}</span></div>
      <div className="flex items-center gap-3"><span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span><div className="flex items-center gap-1 text-amber-500"><Star className="w-3.5 h-3.5 fill-current"/><span className="text-xs font-semibold">{a.points||0}</span></div></div>
    </div>
  </div>);
}

function AdminPage(){
  const [authed,setAuthed]=useState(false);
  const [pw,setPw]=useState("");
  const [pwErr,setPwErr]=useState(false);
  const [pending,setPending]=useState([]);
  const [loading,setLoading]=useState(false);
  const [pts,setPts]=useState({});
  const [msg,setMsg]=useState({});

  const login=()=>{if(pw===ADMIN_PASSWORD){setAuthed(true);fetchPending();}else{setPwErr(true);}};

  const fetchPending=async()=>{
    setLoading(true);
    const {data,error}=await supabase.from("analyses").select("*").eq("status","pending").order("created_at",{ascending:false});
    if(!error&&data)setPending(data);
    setLoading(false);
  };

  const decide=async(id,status)=>{
    const points=parseInt(pts[id]||30);
    if(status==="approved"&&(isNaN(points)||points<20||points>60)){setMsg({...msg,[id]:"Points must be between 20 and 60."});return;}
    const update=status==="approved"?{status,points}:{status:"rejected"};
    const {error}=await supabase.from("analyses").update(update).eq("id",id);
    if(error){setMsg({...msg,[id]:"Error: "+error.message});}
    else{setPending(p=>p.filter(a=>a.id!==id));setMsg({...msg,[id]:status==="approved"?"✅ Approved":"❌ Rejected"});}
  };

  if(!authed)return(
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm shadow-lg">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-900 rounded-xl mb-6 mx-auto"><Lock className="w-6 h-6 text-white"/></div>
        <h1 className="text-xl font-bold text-gray-900 text-center mb-1">Admin Panel</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Populist Discourse Observatory</p>
        <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setPwErr(false);}} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Enter admin password" className={`w-full px-3 py-2 text-sm border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${pwErr?"border-red-400":"border-gray-200"}`}/>
        {pwErr&&<p className="text-xs text-red-600 mb-3">Incorrect password.</p>}
        <button onClick={login} className="w-full bg-blue-900 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-800">Sign In</button>
      </div>
    </div>
  );

  return(
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1><p className="text-sm text-gray-500 mt-1">Review and approve student submissions</p></div>
        <button onClick={fetchPending} className="text-sm text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"><Loader2 className="w-4 h-4"/>Refresh</button>
      </div>
      {loading?<Spinner/>:pending.length===0?(
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center"><CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3"/><h3 className="font-semibold text-emerald-900">No pending submissions</h3><p className="text-sm text-emerald-700 mt-1">All analyses have been reviewed.</p></div>
      ):(
        <div className="space-y-6">
          {pending.map(a=>(
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{a.country}</span><span className="text-xs text-gray-400">·</span><span className="text-xs text-gray-400">{a.category}</span><VerdictBadge verdict={a.verdict}/></div>
                  <h3 className="text-base font-semibold text-gray-900">{a.title}</h3>
                </div>
                <div className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4 text-sm">
                <div><span className="font-medium text-gray-500">Author:</span> {a.author_name} — <span className="text-gray-400">{a.author_email}</span></div>
                {a.party&&<div><span className="font-medium text-gray-500">Party:</span> {a.party}</div>}
                {a.source&&<div className="sm:col-span-2"><span className="font-medium text-gray-500">Source:</span> {a.source}</div>}
              </div>
              <div className="mb-4"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Summary</p><p className="text-sm text-gray-700">{a.summary}</p></div>
              {a.full_analysis&&<div className="mb-4"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Analysis</p><p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{a.full_analysis}</p></div>}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Points (20–60):</label>
                  <input type="number" min="20" max="60" value={pts[a.id]||30} onChange={e=>setPts({...pts,[a.id]:e.target.value})} className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <button onClick={()=>decide(a.id,"approved")} className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-emerald-700"><ThumbsUp className="w-4 h-4"/>Approve</button>
                <button onClick={()=>decide(a.id,"rejected")} className="flex items-center gap-1.5 bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-600"><ThumbsDown className="w-4 h-4"/>Reject</button>
                {msg[a.id]&&<span className="text-sm font-medium text-gray-600">{msg[a.id]}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Header({page,setPage}){
  const [mo,setMo]=useState(false);
  const nav=[{key:"home",label:"Home"},{key:"browse",label:"Browse"},{key:"submit",label:"Submit"},{key:"leaderboard",label:"Leaderboard"},{key:"about",label:"About"}];
  return(<header className="bg-white border-b border-gray-200 sticky top-0 z-50"><div className="max-w-7xl mx-auto px-4 sm:px-6"><div className="flex items-center justify-between h-16">
    <div className="flex items-center gap-3 cursor-pointer" onClick={()=>setPage("home")}><div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0"><Globe className="w-5 h-5 text-yellow-400"/></div><div className="hidden sm:block"><div className="text-sm font-bold text-blue-900 tracking-tight leading-none">POPULIST DISCOURSE</div><div className="text-[10px] text-gray-500 tracking-widest uppercase">Observatory</div></div></div>
    <nav className="hidden md:flex items-center gap-1">{nav.map(n=>(<button key={n.key} onClick={()=>setPage(n.key)} className={`px-3 py-2 text-sm rounded-md transition-colors ${page===n.key?"bg-blue-50 text-blue-900 font-semibold":"text-gray-600 hover:text-blue-900 hover:bg-gray-50"}`}>{n.label}</button>))}</nav>
    <div className="hidden md:flex items-center gap-3"><EUFlag/><div className="text-xs text-gray-500 leading-tight"><div className="font-semibold text-gray-700">Co-funded by the</div><div>European Union</div></div></div>
    <button className="md:hidden p-2" onClick={()=>setMo(!mo)}>{mo?<X className="w-5 h-5"/>:<Menu className="w-5 h-5"/>}</button>
  </div>
  {mo&&<div className="md:hidden pb-4 border-t border-gray-100 pt-2">{nav.map(n=>(<button key={n.key} onClick={()=>{setPage(n.key);setMo(false);}} className={`block w-full text-left px-3 py-2 text-sm rounded-md ${page===n.key?"bg-blue-50 text-blue-900 font-semibold":"text-gray-600"}`}>{n.label}</button>))}<div className="mt-3 px-3 flex items-center gap-2"><EUFlag size="sm"/><span className="text-xs text-gray-500">Co-funded by the European Union</span></div></div>}
  </div></header>);
}

function Footer({setPage}){
  return(<footer className="bg-gray-900 text-gray-400 mt-16"><div className="max-w-7xl mx-auto px-4 sm:px-6 py-10"><div className="grid sm:grid-cols-3 gap-8 mb-8">
    <div><div className="flex items-center gap-2 mb-3"><Globe className="w-5 h-5 text-yellow-400"/><span className="text-sm font-bold text-white">Populist Discourse Observatory</span></div><p className="text-xs leading-relaxed">A student-driven research platform within the POPULIST-GAMEMODE Jean Monnet Module at Babeș-Bolyai University, Cluj-Napoca.</p></div>
    <div><h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4><div className="space-y-1.5 text-xs">{[["browse","Browse Analyses"],["submit","Submit a Report"],["leaderboard","Leaderboard"],["about","About"]].map(([k,l])=>(<button key={k} onClick={()=>setPage(k)} className="block hover:text-white transition-colors">{l}</button>))}<a href="https://populistgamemode.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">Project Website <ExternalLink className="w-3 h-3"/></a></div></div>
    <div><h4 className="text-sm font-semibold text-white mb-3">Contact</h4><div className="space-y-1.5 text-xs"><p>Babeș-Bolyai University</p><p>Faculty of History and Philosophy</p><p>Dept. of International Studies</p><p>Cluj-Napoca, Romania</p></div></div>
  </div><div className="border-t border-gray-800 pt-6"><p className="text-xs text-center leading-relaxed">Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or the European Education and Culture Executive Agency (EACEA). Neither the European Union nor EACEA can be held responsible for them.<br/><span className="text-gray-600">Grant No. 101238497 · ERASMUS-JMO-2025-HEI-TCH-RSCH</span></p>
  <p className="text-center mt-4"><button onClick={()=>setPage("admin")} className="text-gray-800 text-xs hover:text-gray-600">·</button></p>
  </div></div></footer>);
}

function HomePage({setPage,setSelectedId,analyses,stats,loading}){
  return(<div>
    <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 overflow-hidden"><div className="absolute inset-0 opacity-10"><div className="absolute top-10 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl"/><div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl"/></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24"><div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-yellow-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"><Globe className="w-3.5 h-3.5"/>JEAN MONNET MODULE · POPULIST-GAMEMODE</div>
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-5 leading-tight tracking-tight">Populist Discourse<br/>Observatory</h1>
        <p className="text-lg text-blue-200 mb-8 leading-relaxed max-w-2xl">A student-driven research platform tracking and fact-checking populist narratives about the European Union across member states.</p>
        <div className="flex flex-wrap gap-3"><button onClick={()=>setPage("browse")} className="inline-flex items-center gap-2 bg-white text-blue-900 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors">Browse Analyses <ChevronRight className="w-4 h-4"/></button><button onClick={()=>setPage("submit")} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-white/20 transition-colors">Submit Analysis <Send className="w-4 h-4"/></button></div>
      </div></div>
    </section>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard icon={FileText} value={stats.total} label="Claims Analysed" color="bg-blue-600"/>
      <StatCard icon={Users} value={stats.contributors} label="Contributors" color="bg-emerald-600"/>
      <StatCard icon={MapPin} value={stats.countries} label="Countries" color="bg-purple-600"/>
      <StatCard icon={TrendingUp} value={stats.visitors} label="Visitors" color="bg-amber-600"/>
    </div></section>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div className="flex items-center justify-between mb-6"><div><h2 className="text-2xl font-bold text-gray-900">Recent Analyses</h2><p className="text-sm text-gray-500 mt-1">Latest student fact-checking contributions</p></div><button onClick={()=>setPage("browse")} className="text-sm font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1">View all <ChevronRight className="w-4 h-4"/></button></div>
      {loading?<Spinner/>:analyses.length===0?(<div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center"><BookOpen className="w-10 h-10 text-blue-400 mx-auto mb-3"/><h3 className="font-semibold text-blue-900 mb-1">The Observatory is ready for contributions</h3><p className="text-sm text-blue-700 mb-4">Be among the first students to submit a fact-checking analysis.</p><button onClick={()=>setPage("submit")} className="bg-blue-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800">Submit Your First Analysis</button></div>):(<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{analyses.slice(0,6).map(a=>(<AnalysisCard key={a.id} analysis={a} onClick={()=>{setSelectedId(a.id);setPage("detail");}}/>))}</div>)}
    </section>
    <section className="bg-gray-50 border-y border-gray-200"><div className="max-w-7xl mx-auto px-4 sm:px-6 py-14"><h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">How It Works</h2><p className="text-sm text-gray-500 text-center mb-10">From populist claim to evidence-based analysis</p><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[{icon:Search,title:"Identify",desc:"Find populist claims about the EU in media, social networks, or political speeches across member states."},{icon:BookOpen,title:"Research",desc:"Verify claims against official EU data, academic sources, and institutional records."},{icon:FileText,title:"Analyse",desc:"Write a structured fact-checking report with evidence, context, and a verdict assessment."},{icon:Award,title:"Earn Points",desc:"Receive points and badges for quality contributions. Compete on the leaderboard."}].map((step,i)=>(<div key={i} className="bg-white rounded-xl p-6 border border-gray-200 text-center relative"><div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center">{i+1}</div><step.icon className="w-8 h-8 text-blue-700 mx-auto mb-3 mt-1"/><h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3><p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p></div>))}
    </div></div></section>
  </div>);
}

function BrowsePage({setPage,setSelectedId,analyses,loading}){
  const [search,setSearch]=useState("");const [cat,setCat]=useState("All");const [ver,setVer]=useState("All");const [co,setCo]=useState("All");
  const filtered=useMemo(()=>analyses.filter(a=>{if(search){const q=search.toLowerCase();if(!a.title.toLowerCase().includes(q)&&!(a.summary||"").toLowerCase().includes(q))return false;}if(cat!=="All"&&a.category!==cat)return false;if(ver!=="All"&&a.verdict!==ver)return false;if(co!=="All"&&a.country!==co)return false;return true;}),[analyses,search,cat,ver,co]);
  return(<div className="max-w-7xl mx-auto px-4 sm:px-6 py-8"><div className="mb-8"><h1 className="text-2xl font-bold text-gray-900">Browse Analyses</h1><p className="text-sm text-gray-500 mt-1">Search and filter student fact-checking reports</p></div>
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6"><div className="flex items-center gap-2 mb-3"><Filter className="w-4 h-4 text-gray-400"/><span className="text-sm font-semibold text-gray-700">Filters</span></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input type="text" placeholder="Search claims..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div>
        <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"><option value="All">All Categories</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
        <select value={ver} onChange={e=>setVer(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"><option value="All">All Verdicts</option>{VERDICTS.map(v=><option key={v} value={v}>{v}</option>)}</select>
        <select value={co} onChange={e=>setCo(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"><option value="All">All Countries</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
      </div></div>
    {loading?<Spinner/>:(<><div className="text-sm text-gray-500 mb-4">{filtered.length} {filtered.length===1?"analysis":"analyses"} found</div>{filtered.length>0?(<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map(a=>(<AnalysisCard key={a.id} analysis={a} onClick={()=>{setSelectedId(a.id);setPage("detail");}}/>))}</div>):(<EmptyState icon={Search} title="No analyses match your filters" subtitle="Try adjusting your search criteria"/>)}</>)}
  </div>);
}

function DetailPage({analysisId,analyses,setPage}){
  const a=analyses.find(x=>x.id===analysisId);
  if(!a)return(<div className="max-w-3xl mx-auto px-4 sm:px-6 py-8"><button onClick={()=>setPage("browse")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 mb-6"><ArrowLeft className="w-4 h-4"/>Back</button><EmptyState icon={FileText} title="Analysis not found"/></div>);
  return(<div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
    <button onClick={()=>setPage("browse")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 mb-6"><ArrowLeft className="w-4 h-4"/>Back to analyses</button>
    <article className="bg-white rounded-xl border border-gray-200 overflow-hidden"><div className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2 mb-4"><span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full flex items-center gap-1"><MapPin className="w-3 h-3"/>{a.country}</span><span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full flex items-center gap-1"><Tag className="w-3 h-3"/>{a.category}</span>{a.party&&<span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{a.party}</span>}</div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 leading-snug">{a.title}</h1>
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><span className="text-sm font-bold text-blue-800">{(a.author_name||"?")[0]}</span></div><div><div className="text-sm font-medium text-gray-900">{a.author_name}</div><div className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3"/>{new Date(a.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</div></div></div><div className="ml-auto flex items-center gap-1.5 text-amber-500"><Star className="w-4 h-4 fill-current"/><span className="text-sm font-bold">{a.points||0} points</span></div></div>
      {a.source&&<div className="mb-6"><div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Source</div><p className="text-sm text-gray-700 bg-gray-50 px-4 py-2.5 rounded-lg">{a.source}</p></div>}
      <div className="mb-6"><div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Verdict</div><VerdictBadge verdict={a.verdict}/></div>
      <div className="mb-6"><div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Summary</div><p className="text-base text-gray-700 leading-relaxed">{a.summary}</p></div>
      {a.full_analysis&&<div><div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Analysis</div><div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{a.full_analysis}</div></div>}
    </div></article>
  </div>);
}

function SubmitPage(){
  const [ok,setOk]=useState(false);const [busy,setBusy]=useState(false);const [err,setErr]=useState(null);
  const [f,sF]=useState({claim_text:"",source:"",country:"",category:"",party:"",verdict:"",summary:"",full_analysis:"",author_name:"",author_email:""});
  const set=k=>e=>sF(p=>({...p,[k]:e.target.value}));
  const go=async()=>{setErr(null);if(!f.claim_text||!f.country||!f.category||!f.verdict||!f.summary||!f.author_name||!f.author_email){setErr("Please fill in all required fields.");return;}if(!f.author_email.includes("@")){setErr("Please provide a valid email.");return;}
    setBusy(true);
    const{error}=await supabase.from("analyses").insert([{title:"Claim: '"+f.claim_text+"'",claim_text:f.claim_text,source:f.source,country:f.country,category:f.category,party:f.party||null,verdict:f.verdict,summary:f.summary,full_analysis:f.full_analysis||null,author_name:f.author_name,author_email:f.author_email.toLowerCase().trim(),status:"pending",points:0}]);
    setBusy(false);if(error){setErr("Something went wrong. Please try again.");console.error(error);}else{setOk(true);};
  };
  if(ok)return(<div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600"/></div><h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Submitted!</h2><p className="text-gray-500 mb-2">Your report has been submitted for review by module instructors.</p><p className="text-sm text-gray-400 mb-6">You will be contacted at <strong>{f.author_email}</strong> once it is approved and published.</p><button onClick={()=>{setOk(false);sF({claim_text:"",source:"",country:"",category:"",party:"",verdict:"",summary:"",full_analysis:"",author_name:"",author_email:""});}} className="text-sm font-semibold text-blue-700 hover:text-blue-900">Submit another</button></div>);
  return(<div className="max-w-2xl mx-auto px-4 sm:px-6 py-8"><div className="mb-8"><h1 className="text-2xl font-bold text-gray-900">Submit Analysis</h1><p className="text-sm text-gray-500 mt-1">Contribute a fact-checking report on a populist claim about the EU</p></div>
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"><div className="flex items-start gap-3"><Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"/><div className="text-sm text-blue-800"><p className="font-semibold mb-1">Submission Guidelines</p><p className="text-blue-700 leading-relaxed">All submissions are reviewed by module instructors before publication. Each approved analysis earns 20–60 points depending on quality and depth.</p></div></div></div>
    {err&&<div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0"/><p className="text-sm text-red-700">{err}</p></div>}
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name *</label><input type="text" value={f.author_name} onChange={set("author_name")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Maria Popescu"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1.5">University Email *</label><input type="email" value={f.author_email} onChange={set("author_email")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="name@stud.ubbcluj.ro"/></div></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Populist Claim *</label><input type="text" value={f.claim_text} onChange={set("claim_text")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="The exact claim or a faithful paraphrase"/></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Source</label><input type="text" value={f.source} onChange={set("source")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="URL, speaker, platform, date"/></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Political Party / Actor</label><input type="text" value={f.party} onChange={set("party")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. AUR, Fidesz, RN"/></div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Country *</label><select value={f.country} onChange={set("country")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"><option value="">Select...</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label><select value={f.category} onChange={set("category")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"><option value="">Select...</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Verdict *</label><select value={f.verdict} onChange={set("verdict")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"><option value="">Select...</option>{VERDICTS.map(v=><option key={v} value={v}>{v}</option>)}</select></div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Summary *</label><textarea rows={3} value={f.summary} onChange={set("summary")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Concise summary of findings (2-4 sentences)"/></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Full Analysis</label><textarea rows={8} value={f.full_analysis} onChange={set("full_analysis")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Detailed evidence-based analysis with references to EU data, academic sources..."/><p className="text-xs text-gray-400 mt-1.5">Recommended: 200+ words with at least 2 verifiable sources.</p></div>
      <button onClick={go} disabled={busy} className="w-full bg-blue-900 text-white py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">{busy?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}{busy?"Submitting...":"Submit for Review"}</button>
    </div></div>);
}

function LeaderboardPage({leaderboard,loading}){
  return(<div className="max-w-4xl mx-auto px-4 sm:px-6 py-8"><div className="mb-8"><h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1><p className="text-sm text-gray-500 mt-1">Top contributors ranked by total points</p></div>
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6"><h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-700"/>Scoring System</h3><div className="grid sm:grid-cols-3 gap-4 text-sm"><div className="bg-gray-50 rounded-lg p-3"><div className="font-semibold text-gray-700 mb-1">Basic</div><div className="text-gray-500">20–30 pts</div></div><div className="bg-gray-50 rounded-lg p-3"><div className="font-semibold text-gray-700 mb-1">In-depth</div><div className="text-gray-500">40–50 pts</div></div><div className="bg-gray-50 rounded-lg p-3"><div className="font-semibold text-gray-700 mb-1">Featured</div><div className="text-gray-500">60 pts</div></div></div></div>
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6"><h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500"/>Badges</h3><div className="flex flex-wrap gap-2">{Object.entries(BADGE_DEFS).map(([n,d])=>(<span key={n} className={`text-xs px-2.5 py-1 rounded-full font-medium ${d.color}`}>{n} ({d.min}+ pts)</span>))}</div></div>
    {loading?<Spinner/>:leaderboard.length===0?<EmptyState icon={Award} title="No contributors yet" subtitle="Submit an analysis to appear here"/>:(
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-16">Rank</th><th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Contributor</th><th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-24">Analyses</th><th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-24">Points</th><th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Badges</th></tr></thead>
        <tbody>{leaderboard.map((u,i)=>(<tr key={u.email} className={`border-b border-gray-100 last:border-0 ${i<3?"bg-amber-50/30":""}`}><td className="px-5 py-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i===0?"bg-yellow-400 text-yellow-900":i===1?"bg-gray-300 text-gray-700":i===2?"bg-amber-600 text-white":"bg-gray-100 text-gray-500"}`}>{u.rank}</div></td><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center"><span className="text-sm font-bold text-blue-800">{u.name[0]}</span></div><span className="font-medium text-gray-900">{u.name}</span></div></td><td className="px-5 py-4 text-center text-sm text-gray-600">{u.analyses}</td><td className="px-5 py-4 text-center"><span className="font-bold text-amber-600">{u.points}</span></td><td className="px-5 py-4 hidden sm:table-cell"><div className="flex flex-wrap gap-1">{u.badges.map(b=>(<span key={b} className={`text-xs px-2 py-0.5 rounded-full font-medium ${getBadgeColor(b)}`}>{b}</span>))}</div></td></tr>))}</tbody></table></div></div>
    )}</div>);
}

function AboutPage(){
  return(<div className="max-w-4xl mx-auto px-4 sm:px-6 py-8"><div className="mb-10"><h1 className="text-2xl font-bold text-gray-900 mb-2">About the Observatory</h1><p className="text-gray-500">Part of the POPULIST-GAMEMODE Jean Monnet Module at Babeș-Bolyai University</p></div>
    <div className="space-y-5 text-base text-gray-700 leading-relaxed mb-12"><p>The Populist Discourse Observatory is an interactive research platform developed within the Jean Monnet Module <strong>POPULIST-GAMEMODE</strong> (Grant No. 101238497). It serves as a hub where students can track, analyse, and fact-check populist narratives related to the European Union across multiple member states.</p><p>The platform combines rigorous academic methodology with innovative pedagogical tools — including gamification elements, collaborative research, and structured fact-checking protocols — to promote media literacy, critical thinking, and evidence-based engagement with EU affairs.</p><p>All analyses undergo faculty review to ensure academic standards and factual accuracy.</p></div>
    <div className="mb-12"><h2 className="text-xl font-bold text-gray-900 mb-6">Project Team</h2><div className="grid sm:grid-cols-3 gap-4">{[{name:"Ioan-Mihai Alexandrescu",role:"Project Coordinator",title:"Associate Professor",exp:"EU governance, leadership, political science"},{name:"Mihnea-Simion Stoica",role:"Researcher & Trainer",title:"Associate Professor",exp:"Political ideologies, populist narratives, political communication"},{name:"Paul Popa",role:"Researcher & Trainer",title:"Senior Lecturer",exp:"Critical thinking, EU law, political philosophy"}].map((p,i)=>(<div key={i} className="bg-white rounded-xl border border-gray-200 p-5"><div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center mb-3"><span className="text-lg font-bold text-white">{p.name.split(" ").pop()[0]}</span></div><h3 className="font-semibold text-gray-900">{p.name}</h3><div className="text-sm text-blue-700 font-medium">{p.role}</div><div className="text-xs text-gray-500 mt-0.5">{p.title}, Babeș-Bolyai University</div><p className="text-xs text-gray-400 mt-2">{p.exp}</p></div>))}</div></div>
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-12"><h2 className="text-xl font-bold text-gray-900 mb-4">Project Details</h2><div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">{[["Full Title","Populism, Citizens, and Leadership in EU Decision-Making"],["Acronym","POPULIST-GAMEMODE"],["Grant Number","101238497"],["Programme","Erasmus+ Jean Monnet Actions"],["Call","ERASMUS-JMO-2025-HEI-TCH-RSCH"],["Duration","36 months"],["Institution","Babeș-Bolyai University, Cluj-Napoca"],["Department","International Studies and Contemporary History"]].map(([l,v])=>(<div key={l} className="flex"><span className="font-medium text-gray-500 w-32 flex-shrink-0">{l}</span><span className="text-gray-900">{v}</span></div>))}</div></div>
    <div className="mb-12"><a href="https://populistgamemode.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">Visit the full POPULIST-GAMEMODE project website <ExternalLink className="w-4 h-4"/></a></div>
    <div className="bg-blue-900 rounded-xl p-6 text-white"><div className="flex items-start gap-4"><EUFlag size="lg"/><div><p className="text-sm font-semibold mb-2">Co-funded by the European Union</p><p className="text-xs text-blue-200 leading-relaxed">Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or the European Education and Culture Executive Agency (EACEA). Neither the European Union nor EACEA can be held responsible for them.</p></div></div></div>
  </div>);
}

export default function App(){
  const [page,setPage]=useState("home");const [selectedId,setSelectedId]=useState(null);
  const {analyses,loading,stats}=useAnalyses();const leaderboard=useLeaderboard(analyses);
  useEffect(()=>{window.scrollTo({top:0,behavior:"smooth"});},[page]);
  const P=()=>{switch(page){case"home":return<HomePage setPage={setPage} setSelectedId={setSelectedId} analyses={analyses} stats={stats} loading={loading}/>;case"browse":return<BrowsePage setPage={setPage} setSelectedId={setSelectedId} analyses={analyses} loading={loading}/>;case"detail":return<DetailPage analysisId={selectedId} analyses={analyses} setPage={setPage}/>;case"submit":return<SubmitPage/>;case"leaderboard":return<LeaderboardPage leaderboard={leaderboard} loading={loading}/>;case"about":return<AboutPage/>;case"admin":return<AdminPage/>;default:return<HomePage setPage={setPage} setSelectedId={setSelectedId} analyses={analyses} stats={stats} loading={loading}/>;}}; 
  if(page==="admin")return<AdminPage/>;
  return(<div className="min-h-screen bg-gray-50 flex flex-col"><Header page={page} setPage={setPage}/><main className="flex-1"><P/></main><Footer setPage={setPage}/></div>);
}
