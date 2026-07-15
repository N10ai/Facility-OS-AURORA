import fs from 'node:fs';

const appPath='src/app/App.jsx';
const cssPath='src/styles/app.css';
let app=fs.readFileSync(appPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');

function replaceOnce(from,to,label){
  if(!app.includes(from)) throw new Error(`Missing marker: ${label}`);
  app=app.replace(from,to);
}

if(!app.includes("./components/PhotoLightbox")){
  replaceOnce(
    "import { SettingsHub } from './components/SettingsHub';",
    "import { SettingsHub } from './components/SettingsHub';\nimport { PhotoLightbox } from './components/PhotoLightbox';\nimport { CustomerInventory } from './components/CustomerInventory';",
    'component imports'
  );
}

if(!app.includes("['customer-inventory','Inventory'")){
  replaceOnce(
    "const customerNav = [['customer-home','Overview',Home],['customer-schedule','Schedule',CalendarDays],['customer-proof','Service Reports',FileText],['customer-requests','Requests',Wrench]];",
    "const customerNav = [['customer-home','Overview',Home],['customer-schedule','Schedule',CalendarDays],['customer-proof','Service Reports',FileText],['customer-inventory','Inventory',PackageOpen],['customer-requests','Requests',Wrench]];",
    'customer navigation'
  );
}

if(!app.includes("page==='customer-inventory'")){
  replaceOnce(
    "    if(page==='customer-proof') content=<InspectionReports profile={profile} data={data}/>;\n    else if(page==='customer-requests') content=<CustomerRequests profile={profile} data={data} reload={reload}/>;",
    "    if(page==='customer-proof') content=<InspectionReports profile={profile} data={data}/>;\n    else if(page==='customer-inventory') content=<CustomerInventory profile={profile} data={data}/>;\n    else if(page==='customer-requests') content=<CustomerRequests profile={profile} data={data} reload={reload}/>;",
    'customer inventory route'
  );
}

if(!app.includes('const [photoIndex,setPhotoIndex]')){
  replaceOnce(
    "  const [issue,setIssue]=useState({title:'',description:'',priority:'medium'});",
    "  const [issue,setIssue]=useState({title:'',description:'',priority:'medium'});\n  const [photoIndex,setPhotoIndex]=useState(null);",
    'employee photo viewer state'
  );
  replaceOnce(
    "    </div>\n    <section className=\"panel\"><div className=\"panelTitle\"><h2>Checklist</h2>",
    "    </div>\n    {proof.length>0&&<section className=\"panel missionPhotoPanel\"><div className=\"panelTitle\"><div><p className=\"eyebrow\">Proof</p><h2>Service photos</h2></div><span>{proof.length}</span></div><div className=\"missionPhotoGrid\">{proof.map((photo,index)=><button key={photo.id||index} onClick={()=>setPhotoIndex(index)}><img src={photo.public_url||photo.url||photo.file_url||photo.storage_url} alt={photo.proof_type||'Service proof'}/><span>{photo.proof_type||'photo'}</span></button>)}</div></section>}\n    {photoIndex!==null&&<PhotoLightbox photos={proof} initialIndex={photoIndex} onClose={()=>setPhotoIndex(null)}/>}\n    <section className=\"panel\"><div className=\"panelTitle\"><h2>Checklist</h2>",
    'employee photo gallery'
  );
}

const styles=`

/* Aurora v3.9 role workflows */
.photoLightbox{position:fixed;inset:0;z-index:2000;background:rgba(2,6,23,.96);display:grid;grid-template-rows:auto 1fr auto;color:#fff}.photoLightbox header,.photoLightbox footer{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:rgba(15,23,42,.72);backdrop-filter:blur(14px)}.photoLightbox header strong,.photoLightbox header span{display:block}.photoLightbox header span,.photoLightbox footer{font-size:12px;color:#cbd5e1}.photoLightboxActions{display:flex;gap:8px}.photoLightboxActions button,.photoLightboxActions a,.photoLightboxNav{border:0;background:rgba(255,255,255,.11);color:#fff;border-radius:12px;width:42px;height:42px;display:grid;place-items:center}.photoLightboxStage{display:grid;place-items:center;overflow:auto;padding:24px}.photoLightboxStage img{max-width:92vw;max-height:76vh;object-fit:contain;transition:transform .18s ease;transform-origin:center}.photoLightboxNav{position:absolute;top:50%;transform:translateY(-50%);z-index:2}.photoLightboxNav.previous{left:18px}.photoLightboxNav.next{right:18px}.missionPhotoPanel{margin-top:16px}.missionPhotoGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.missionPhotoGrid button{position:relative;border:0;padding:0;border-radius:16px;overflow:hidden;background:#e2e8f0;aspect-ratio:1}.missionPhotoGrid img{width:100%;height:100%;object-fit:cover}.missionPhotoGrid span{position:absolute;left:8px;bottom:8px;background:rgba(15,23,42,.72);color:#fff;border-radius:999px;padding:4px 8px;font-size:10px;text-transform:capitalize}.customerInventoryToolbar{display:flex;gap:12px;align-items:center}.customerInventoryToolbar label{display:flex;align-items:center;gap:8px;flex:1}.customerInventoryToolbar select,.customerInventoryToolbar input{width:100%;border:0;background:transparent;outline:0}.customerInventorySearch{border-left:1px solid var(--line);padding-left:14px}.customerInventoryGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.customerInventoryCard{border:1px solid var(--line);background:#fff;border-radius:22px;padding:18px;box-shadow:0 10px 28px rgba(15,23,42,.05)}.customerInventoryCardHead{display:flex;align-items:center;justify-content:space-between}.inventoryObjectIcon{width:42px;height:42px;border-radius:14px;background:#eff6ff;color:#2563eb;display:grid;place-items:center}.customerStockStatus{border-radius:999px;padding:5px 9px;font-size:10px;font-weight:800;text-transform:uppercase}.customerStockStatus.in-stock{background:#dcfce7;color:#166534}.customerStockStatus.low{background:#fef3c7;color:#92400e}.customerStockStatus.out{background:#fee2e2;color:#991b1b}.customerInventoryCard h2{margin:16px 0 5px}.customerInventoryCard p{margin:0;color:var(--muted)}.customerInventoryQuantity{display:flex;align-items:baseline;gap:7px;margin:18px 0}.customerInventoryQuantity strong{font-size:32px}.customerInventoryQuantity span{color:var(--muted)}.customerInventoryMeta{display:flex;justify-content:space-between;color:var(--muted);font-size:12px;border-top:1px solid var(--line);padding-top:12px}.customerInventoryEmpty{grid-column:1/-1;text-align:center;padding:42px}.customerInventoryEmpty strong,.customerInventoryEmpty span{display:block}.customerInventoryEmpty span{color:var(--muted);margin-top:6px}
@media(max-width:900px){.customerInventoryGrid{grid-template-columns:repeat(2,1fr)}.missionPhotoGrid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:640px){.customerInventoryGrid{grid-template-columns:1fr}.customerInventoryToolbar{align-items:stretch;flex-direction:column}.customerInventorySearch{border-left:0;border-top:1px solid var(--line);padding-left:0;padding-top:12px}.missionPhotoGrid{grid-template-columns:repeat(2,1fr)}.photoLightboxNav{width:36px;height:36px}.photoLightboxNav.previous{left:8px}.photoLightboxNav.next{right:8px}}
`;
if(!css.includes('Aurora v3.9 role workflows')) css+=styles;

fs.writeFileSync(appPath,app);
fs.writeFileSync(cssPath,css);
console.log('Applied Aurora v3.9 role workflow foundation.');
