import fs from 'node:fs';

const appPath='src/app/App.jsx';
const cssPath='src/styles/app.css';
let app=fs.readFileSync(appPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');

function replaceOnce(from,to,label){
  if(!app.includes(from)) throw new Error(`Missing App marker: ${label}`);
  app=app.replace(from,to);
}

if(!app.includes("./components/GlobalSearch")){
  replaceOnce(
    "import { configured, supabase } from '../services/supabase';",
    "import { configured, supabase } from '../services/supabase';\nimport { GlobalSearch } from './components/GlobalSearch';\nimport { SettingsHub } from './components/SettingsHub';",
    'component imports'
  );
}

replaceOnce(
  "function Shell({profile,portal,setPortal,page,setPage,children}) {\n  const [mobileSheet,setMobileSheet]=useState(null);",
  "function Shell({profile,portal,setPortal,page,setPage,data,children}) {\n  const [mobileSheet,setMobileSheet]=useState(null);\n  const [searchOpen,setSearchOpen]=useState(false);",
  'Shell signature'
);

replaceOnce(
  "  function selectPage(key){setPage(key);setMobileSheet(null)}",
  "  useEffect(()=>{\n    function shortcut(event){\n      if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setSearchOpen(true)}\n      if(event.key==='Escape')setSearchOpen(false);\n    }\n    window.addEventListener('keydown',shortcut);\n    return()=>window.removeEventListener('keydown',shortcut);\n  },[]);\n\n  function selectPage(key){setPage(key);setMobileSheet(null)}",
  'Shell shortcut'
);

replaceOnce(
  '<header className="top"><div><span>FacilityOS</span><strong>{nav.find(x=>x[0]===page)?.[1]||\'Workspace\'}</strong></div><button className="search"><Search size={18}/><span>Search anything...</span></button><button className="icon"><Bell size={18}/></button><button className="avatarButton">{profile.full_name?.slice(0,1)||\'U\'}</button></header>',
  '<header className="top"><div><span>FacilityOS</span><strong>{nav.find(x=>x[0]===page)?.[1]||\'Workspace\'}</strong></div><button className="search" onClick={()=>setSearchOpen(true)}><Search size={18}/><span>Search anything...</span><kbd>⌘K</kbd></button><button className="icon"><Bell size={18}/></button><button className="avatarButton">{profile.full_name?.slice(0,1)||\'U\'}</button></header>',
  'top search button'
);

replaceOnce(
  "    {mobileSheet && <div className=\"mobileSheetBackdrop\"",
  "    <GlobalSearch open={searchOpen} onClose={()=>setSearchOpen(false)} data={data} onNavigate={(targetPage)=>{setPortal('admin');setPage(targetPage)}}/>\n    {mobileSheet && <div className=\"mobileSheetBackdrop\"",
  'GlobalSearch render'
);

const modernSettings=`function ModernSettingsPage(){
  const [checks,setChecks]=useState([]);
  const [checking,setChecking]=useState(false);
  const [message,setMessage]=useState('');
  async function runHealthCheck(){
    setChecking(true);setMessage('');
    try{setChecks(await checkInfrastructure())}
    catch(error){setMessage(error.message)}
    finally{setChecking(false)}
  }
  function openSection(section){
    const labels={company:'Company',branding:'Branding',users:'Users & roles',notifications:'Notifications',documents:'Documents',billing:'Billing',integrations:'Integrations',security:'Security',health:'System health'};
    setMessage(`${labels[section]||'This section'} is organized and ready for its detailed controls in the next increment.`);
  }
  return <><SettingsHub healthChecks={checks} checking={checking} onRunHealthCheck={runHealthCheck} onOpenSection={openSection}/>{message&&<div className="settingsToast notice">{message}</div>}</>;
}

`;
if(!app.includes('function ModernSettingsPage')){
  replaceOnce('function EmployeeHome({profile,data,reload}) {',modernSettings+'function EmployeeHome({profile,data,reload}) {','ModernSettingsPage insertion');
}

replaceOnce(
  "    else content=<SettingsPage companyId={profile.company_id} reload={reload}/>;",
  "    else content=<ModernSettingsPage/>;",
  'settings route'
);

replaceOnce(
  "  return <Shell profile={profile} portal={portal} setPortal={setPortal} page={page} setPage={setPage}>{content}</Shell>;",
  "  return <Shell profile={profile} portal={portal} setPortal={setPortal} page={page} setPage={setPage} data={data}>{content}</Shell>;",
  'Shell data prop'
);

const styles=`

/* Aurora v3.8 global search and settings */
.top .search kbd{margin-left:auto;border:1px solid var(--line);background:#fff;border-radius:7px;padding:2px 6px;font-size:10px;color:var(--muted)}
.globalSearchBackdrop{position:fixed;inset:0;z-index:1000;background:rgba(15,23,42,.48);backdrop-filter:blur(7px);display:flex;align-items:flex-start;justify-content:center;padding:9vh 18px}
.globalSearchPanel{width:min(720px,100%);background:#fff;border:1px solid rgba(148,163,184,.35);border-radius:25px;box-shadow:0 35px 90px rgba(15,23,42,.28);overflow:hidden}
.globalSearchInput{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:18px 20px;border-bottom:1px solid var(--line)}
.globalSearchInput input{border:0;outline:0;font-size:17px;background:transparent;width:100%}.globalSearchInput button{border:0;background:#f1f5f9;border-radius:10px;padding:7px;display:grid;place-items:center}
.globalSearchResults{max-height:440px;overflow:auto;padding:9px}.globalSearchResult{width:100%;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;border:0;background:transparent;border-radius:14px;padding:11px;text-align:left;color:var(--ink)}
.globalSearchResult.active{background:#eff6ff}.globalSearchIcon{width:38px;height:38px;border-radius:12px;background:#f1f5f9;color:#2563eb;display:grid;place-items:center}.globalSearchText strong,.globalSearchText small{display:block}.globalSearchText small{color:var(--muted);margin-top:3px}.globalSearchResult kbd{color:var(--muted)}
.globalSearchEmpty{padding:42px 22px;text-align:center}.globalSearchEmpty strong,.globalSearchEmpty span{display:block}.globalSearchEmpty span{color:var(--muted);margin-top:7px}.globalSearchPanel footer{display:flex;gap:18px;padding:11px 18px;border-top:1px solid var(--line);background:#f8fafc;color:var(--muted);font-size:11px}
.settingsSectionGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.settingsSectionCard{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:13px;text-align:left;border:1px solid var(--line);background:#fff;border-radius:21px;padding:17px;color:var(--ink);box-shadow:0 9px 24px rgba(15,23,42,.04)}
.settingsSectionCard:hover{border-color:#bfdbfe;transform:translateY(-1px)}.settingsSectionIcon{width:43px;height:43px;border-radius:14px;background:#eff6ff;color:#1d4ed8;display:grid;place-items:center}.settingsSectionCard strong,.settingsSectionCard small{display:block}.settingsSectionCard small{color:var(--muted);line-height:1.35;margin-top:4px}
.settingsHealthSummary{margin-top:4px}.settingsHealthGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.settingsHealthItem{display:flex;align-items:flex-start;gap:10px;padding:13px;border-radius:15px;background:#f8fafc}.settingsHealthItem>span{width:10px;height:10px;border-radius:50%;margin-top:4px}.settingsHealthItem.ok>span{background:#16a34a}.settingsHealthItem.bad>span{background:#dc2626}.settingsHealthItem strong,.settingsHealthItem small{display:block}.settingsHealthItem small{color:var(--muted);margin-top:3px}.settingsHealthEmpty{grid-column:1/-1;color:var(--muted);padding:20px;text-align:center}.settingsToast{position:fixed;right:24px;bottom:24px;z-index:50;max-width:430px}
@media(max-width:1000px){.settingsSectionGrid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:700px){.settingsSectionGrid,.settingsHealthGrid{grid-template-columns:1fr}.globalSearchBackdrop{padding-top:4vh}.top .search kbd{display:none}}
`;
if(!css.includes('Aurora v3.8 global search and settings')) css+=styles;

fs.writeFileSync(appPath,app);
fs.writeFileSync(cssPath,css);
console.log('Applied Aurora v3.8 shell integrations.');
// workflow trigger: 2026-07-15
