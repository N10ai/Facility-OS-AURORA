import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

execFileSync(process.execPath, ['scripts/integrate-v3.17.mjs'], { stdio: 'inherit' });

const appPath = 'src/app/App.jsx';
let app = readFileSync(appPath, 'utf8');

app = app.replace(
  "  const [mobileSheet,setMobileSheet]=useState(null);\n  const [searchOpen,setSearchOpen]=useState(false);",
  "  const [mobileSheet,setMobileSheet]=useState(null);\n  const [mobileRoleSheet,setMobileRoleSheet]=useState(false);\n  const [searchOpen,setSearchOpen]=useState(false);"
);

app = app.replace(
  "  function selectPage(key){setPage(key);setMobileSheet(null)}",
  "  function switchPortal(nextPortal){\n    setPortal(nextPortal);\n    setPage(nextPortal==='admin'?'overview':nextPortal==='employee'?'employee-home':'customer-home');\n    setMobileRoleSheet(false);\n    setMobileSheet(null);\n  }\n  function selectPage(key){setPage(key);setMobileSheet(null)}"
);

app = app.replace(
  "<div className=\"portalSwitch\">{['admin','employee','customer'].map(p=><button key={p} className={portal===p?'active':''} onClick={()=>{setPortal(p);setPage(p==='admin'?'overview':p==='employee'?'employee-home':'customer-home')}}>{p}</button>)}</div>",
  "<div className=\"portalSwitch\">{['admin','employee','customer'].map(p=><button key={p} className={portal===p?'active':''} onClick={()=>switchPortal(p)}>{p}</button>)}</div>"
);

app = app.replace(
  "<header className=\"top\"><div><span>FacilityOS</span><strong>{nav.find(x=>x[0]===page)?.[1]||'Workspace'}</strong></div><button className=\"search\" onClick={()=>setSearchOpen(true)}><Search size={18}/><span>Search anything...</span><kbd>⌘K</kbd></button><button className=\"icon\"><Bell size={18}/></button><button className=\"avatarButton\">{profile.full_name?.slice(0,1)||'U'}</button></header>",
  "<header className=\"top\"><div><span>FacilityOS</span><strong>{nav.find(x=>x[0]===page)?.[1]||'Workspace'}</strong></div><button className=\"search\" onClick={()=>setSearchOpen(true)}><Search size={18}/><span>Search anything...</span><kbd>⌘K</kbd></button><button className=\"icon\"><Bell size={18}/></button><button className=\"avatarButton\" aria-label=\"Switch preview view\" onClick={()=>setMobileRoleSheet(true)}>{profile.full_name?.slice(0,1)||'U'}</button></header>\n      <div className=\"mobilePreviewBanner\"><span>Previewing</span><strong>{portal} view</strong><button onClick={()=>setMobileRoleSheet(true)}>Switch</button></div>"
);

app = app.replace(
  "    <GlobalSearch open={searchOpen} onClose={()=>setSearchOpen(false)} data={data} onNavigate={(targetPage)=>{setPortal('admin');setPage(targetPage)}}/>",
  "    <GlobalSearch open={searchOpen} onClose={()=>setSearchOpen(false)} data={data} onNavigate={(targetPage)=>{setPortal('admin');setPage(targetPage)}}/>\n    {mobileRoleSheet && <div className=\"mobileSheetBackdrop roleSheetBackdrop\" onClick={()=>setMobileRoleSheet(false)}><section className=\"mobileSheet roleSheet\" onClick={e=>e.stopPropagation()}><div className=\"sheetHandle\"/><div className=\"roleSheetHeading\"><div><p className=\"eyebrow\">Mobile preview</p><h3>Switch user view</h3></div><button className=\"icon\" onClick={()=>setMobileRoleSheet(false)}><X size={18}/></button></div><p className=\"roleSheetNote\">This changes only the interface you are previewing. Your signed-in Supabase account and permissions stay unchanged.</p><div className=\"roleChoices\">{[['admin','Admin','Manage the company, team, customers and operations',ShieldCheck],['employee','Employee','See assigned jobs, schedules and cleaning steps',ClipboardCheck],['customer','Customer','See service schedules, reports, inventory and requests',Building2]].map(([key,label,description,Icon])=><button key={key} className={portal===key?'active':''} onClick={()=>switchPortal(key)}><span className=\"roleChoiceIcon\"><Icon size={21}/></span><span><strong>{label}</strong><small>{description}</small></span>{portal===key?<CheckCircle2 size={20}/>:<ChevronRight size={19}/>}</button>)}</div></section></div>}"
);

if (!app.includes('mobileRoleSheet') || !app.includes('mobilePreviewBanner')) {
  throw new Error('Mobile view switcher integration failed');
}
writeFileSync(appPath, app);

const cssPath = 'src/app/App.css';
let css = readFileSync(cssPath, 'utf8');
css += `
.mobilePreviewBanner{display:none}.roleSheetHeading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.roleSheetHeading h3{margin:2px 0 0}.roleSheetNote{margin:10px 0 16px;color:var(--muted,#64748b);font-size:13px;line-height:1.5}.roleChoices{display:grid;gap:10px}.roleChoices>button{width:100%;display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:12px;text-align:left;border:1px solid var(--line,#e2e8f0);background:#fff;border-radius:16px;padding:13px}.roleChoices>button.active{border-color:#2563eb;background:#eff6ff}.roleChoiceIcon{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:#f1f5f9;color:#334155}.roleChoices>button.active .roleChoiceIcon{background:#dbeafe;color:#1d4ed8}.roleChoices strong,.roleChoices small{display:block}.roleChoices small{margin-top:3px;color:var(--muted,#64748b);font-size:12px;line-height:1.35}
@media(max-width:760px){.mobilePreviewBanner{display:flex;align-items:center;gap:6px;position:sticky;top:64px;z-index:12;margin:0 12px 8px;padding:8px 10px;border:1px solid #bfdbfe;border-radius:12px;background:rgba(239,246,255,.96);backdrop-filter:blur(14px);box-shadow:0 5px 18px rgba(15,23,42,.08);font-size:12px;color:#475569}.mobilePreviewBanner strong{text-transform:capitalize;color:#1d4ed8}.mobilePreviewBanner button{margin-left:auto;border:0;background:transparent;color:#2563eb;font-weight:800;padding:4px 6px}.roleSheet{padding-bottom:max(24px,env(safe-area-inset-bottom))}.top .avatarButton{cursor:pointer}}
`;
writeFileSync(cssPath, css);

console.log('FacilityOS v3.18 mobile user-view preview switcher complete.');
