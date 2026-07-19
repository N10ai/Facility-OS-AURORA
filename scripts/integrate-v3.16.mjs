import fs from 'node:fs';
import './integrate-v3.15.mjs';

const appPath='src/app/App.jsx';
const employeePath='src/app/components/EmployeeWorkspace.jsx';
const apiPath='src/services/api.js';
const packagePath='package.json';
let app=fs.readFileSync(appPath,'utf8');
let employee=fs.readFileSync(employeePath,'utf8');
let api=fs.readFileSync(apiPath,'utf8');
const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'));

if(!employee.includes("./EmployeeInspectionPanel")){
  employee=employee.replace("import './EmployeeWorkspace.css';","import './EmployeeWorkspace.css';\nimport { EmployeeInspectionPanel } from './EmployeeInspectionPanel';");
}
employee=employee.replace(
"    const { error } = await finishWorkOrder(current.id);",
"    const inspection=(data.inspections||[]).filter(row=>row.work_order_id===current.id).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''))[0];\n    if(!inspection||inspection.status!=='submitted') return setMessage('Complete and submit the final inspection before submitting this job.');\n    const { error } = await finishWorkOrder(current.id);"
);
if(!employee.includes('<EmployeeInspectionPanel current={current}')){
  employee=employee.replace(
"      <ActionButton onClick={() => finish(current)}><CheckCircle2 size={18}/> Submit mission</ActionButton>",
"      <EmployeeInspectionPanel current={current} data={data} profile={profile} reload={reload}/>\n      <ActionButton onClick={() => finish(current)}><CheckCircle2 size={18}/> Submit completed job</ActionButton>"
  );
}

api=api.replace(
"export async function completeInspection(id,overallScore,summary){return supabase.from('inspections').update({status:'completed',overall_score:Number(overallScore||0),summary:summary||null,inspected_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id).select().single()}",
"export async function completeInspection(id,overallScore,summary){return supabase.from('inspections').update({status:'submitted',overall_score:Number(overallScore||0),summary:summary||null,submitted_at:new Date().toISOString(),inspected_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id).select().single()}"
);
api=api.replace(
"export async function verifyWorkOrder(id, profileId, summary, qualityScore=100) {\n  const now = new Date().toISOString();\n  return supabase.from('work_orders').update({",
"export async function verifyWorkOrder(id, profileId, summary, qualityScore=100) {\n  const now = new Date().toISOString();\n  const inspectionResult=await supabase.from('inspections').select('id,status').eq('work_order_id',id).eq('status','submitted').order('created_at',{ascending:false}).limit(1).maybeSingle();\n  if(inspectionResult.error)return{error:inspectionResult.error};\n  if(!inspectionResult.data)return{error:{message:'A submitted employee inspection is required before approval.'}};\n  await supabase.from('inspections').update({status:'approved',approved_at:now,approved_by_profile_id:profileId,updated_at:now}).eq('id',inspectionResult.data.id);\n  return supabase.from('work_orders').update({"
);
api=api.replace(
"export async function returnWorkOrder(id, note) {\n  const now = new Date().toISOString();\n  return supabase.from('work_orders').update({",
"export async function returnWorkOrder(id, note) {\n  const now = new Date().toISOString();\n  const inspectionResult=await supabase.from('inspections').select('id').eq('work_order_id',id).order('created_at',{ascending:false}).limit(1).maybeSingle();\n  if(inspectionResult.data)await supabase.from('inspections').update({status:'returned',review_note:note||'Administrator requested corrections.',updated_at:now}).eq('id',inspectionResult.data.id);\n  return supabase.from('work_orders').update({"
);
api=api.replace(
"export async function finishWorkOrder(workOrderId) {\n  const now = new Date().toISOString();",
"export async function finishWorkOrder(workOrderId) {\n  const now = new Date().toISOString();\n  const inspectionResult=await supabase.from('inspections').select('id,status').eq('work_order_id',workOrderId).eq('status','submitted').order('created_at',{ascending:false}).limit(1).maybeSingle();\n  if(inspectionResult.error)return{error:inspectionResult.error};\n  if(!inspectionResult.data)return{error:{message:'Submit the final inspection before completing this job.'}};"
);

app=app.replace(
"    const relatedInspections=data.inspections.filter(i=>i.work_order_id===current.id);",
"    const relatedInspections=data.inspections.filter(i=>i.work_order_id===current.id);\n    const relatedInspection=[...relatedInspections].sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''))[0];\n    const relatedInspectionAreas=relatedInspection?data.inspectionAreas.filter(a=>a.inspection_id===relatedInspection.id):[];\n    const relatedInspectionItems=relatedInspection?data.inspectionItems.filter(item=>relatedInspectionAreas.some(a=>a.id===item.inspection_area_id)):[];"
);
app=app.replace(
"      {managerPhotos.length>0&&<section className=\"panel managerPhotoReview\">",
"      {relatedInspection&&<section className=\"panel\"><div className=\"panelTitle\"><div><p className=\"eyebrow\">Employee submission</p><h2>Final inspection review</h2></div><span className={`status ${relatedInspection.status}`}>{String(relatedInspection.status||'in_progress').replaceAll('_',' ')}</span></div><div className=\"reportFacts\"><span><b>{relatedInspection.overall_score||0}</b> inspection score</span><span><b>{relatedInspectionItems.filter(item=>item.status==='passed').length}/{relatedInspectionItems.length}</b> checks passed</span><span><b>{managerPhotos.length}</b> evidence photos</span></div><p>{relatedInspection.summary||'Employee inspection submitted for review.'}</p></section>}\n      {managerPhotos.length>0&&<section className=\"panel managerPhotoReview\">"
);
app=app.replace('Manager verification</p><h2>Approve customer report</h2>','Inspection review</p><h2>Approve or return employee inspection</h2>');
app=app.replace('Verify and release report','Approve inspection and finish job');
app=app.replace("setMessage('Work order verified. The customer report is now visible.');","setMessage('Inspection approved. The job is complete and the customer report is visible.');");
app=app.replace("setMessage('Work order returned to the employee with your note.');","setMessage('Inspection returned to the employee with your correction note.');");

pkg.name='facilityos-v3-16-employee-inspection-approval';
pkg.version='3.16.0';
pkg.scripts.prebuild='node scripts/integrate-v3.16.mjs';
fs.writeFileSync(appPath,app);
fs.writeFileSync(employeePath,employee);
fs.writeFileSync(apiPath,api);
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
console.log('Applied Aurora v3.16 employee inspection approval workflow.');
