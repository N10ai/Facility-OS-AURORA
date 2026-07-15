import fs from 'node:fs';

const appPath='src/app/App.jsx';
const cssPath='src/styles/app.css';
let app=fs.readFileSync(appPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');

if(!app.includes("./components/CustomerReportGallery")){
  const marker="import { CustomerInventory } from './components/CustomerInventory';";
  if(!app.includes(marker)) throw new Error('Customer inventory import not found');
  app=app.replace(marker,`${marker}\nimport { CustomerReportGallery } from './components/CustomerReportGallery';`);
}

const oldRoute="if(page==='customer-proof') content=<InspectionReports profile={profile} data={data}/>;";
const newRoute="if(page==='customer-proof') content=<CustomerReportGallery profile={profile} data={data}/>;";
if(app.includes(oldRoute)) app=app.replace(oldRoute,newRoute);
else if(!app.includes(newRoute)) throw new Error('Customer report route not found');

const styles=`

/* Aurora v3.9 interactive customer reports */
.customerReportsV39{display:grid;gap:18px}.customerReportStack{display:grid;gap:18px}.customerReportCard{background:#fff;border:1px solid var(--line);border-radius:26px;padding:22px;box-shadow:0 16px 38px rgba(15,23,42,.06)}.customerReportCard>header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.customerReportCard h2{margin:4px 0 8px}.customerReportCard p{margin:0;color:var(--muted)}.customerReportScore{min-width:88px;height:88px;border-radius:50%;display:grid;place-items:center;background:#eff6ff;color:#1d4ed8;border:8px solid #dbeafe}.customerReportScore strong{font-size:25px}.customerReportScore span{font-size:11px}.customerReportFacts{display:flex;gap:18px;flex-wrap:wrap;margin:20px 0;color:var(--muted)}.customerReportFacts span{display:flex;align-items:center;gap:7px}.customerAreaScores{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.customerAreaScore{display:flex;justify-content:space-between;gap:10px;border-radius:14px;background:#f8fafc;padding:12px}.customerAreaScore.passed{background:#ecfdf5}.customerAreaScore.failed{background:#fef2f2}.customerReportPhotos{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:16px}.customerReportPhotos button{position:relative;border:0;padding:0;overflow:hidden;border-radius:16px;aspect-ratio:1;background:#e2e8f0}.customerReportPhotos img{width:100%;height:100%;object-fit:cover}.customerReportPhotos span{position:absolute;left:8px;bottom:8px;background:rgba(15,23,42,.72);color:#fff;padding:4px 8px;border-radius:999px;font-size:10px;text-transform:capitalize}.customerReportEmpty{text-align:center;padding:42px}.customerReportEmpty h2{margin:10px 0 5px}.customerReportEmpty p{margin:0;color:var(--muted)}
@media(max-width:950px){.customerAreaScores,.customerReportPhotos{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.customerReportCard{padding:16px}.customerReportCard>header{flex-direction:column}.customerReportScore{width:72px;height:72px;min-width:72px}.customerAreaScores,.customerReportPhotos{grid-template-columns:repeat(2,1fr)}}
`;
if(!css.includes('Aurora v3.9 interactive customer reports')) css+=styles;

fs.writeFileSync(appPath,app);
fs.writeFileSync(cssPath,css);
console.log('Applied Aurora v3.9 interactive customer reports.');
