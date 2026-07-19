import { useMemo, useState } from 'react';
import { Camera, CheckCircle2, ClipboardCheck, ImagePlus, ShieldCheck } from 'lucide-react';
import { completeInspection, createInspection, updateInspectionItem, uploadInspectionPhoto } from '../../services/api';
import './EmployeeInspectionPanel.css';

export function EmployeeInspectionPanel({ current, data, profile, reload, onSubmitted }) {
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const inspections=(data.inspections||[]).filter(row=>row.work_order_id===current.id).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
  const inspection=inspections[0]||null;
  const areas=inspection?(data.inspectionAreas||[]).filter(row=>row.inspection_id===inspection.id):[];
  const items=inspection?(data.inspectionItems||[]).filter(row=>areas.some(area=>area.id===row.inspection_area_id)):[];
  const photos=inspection?(data.inspectionPhotos||[]).filter(row=>row.inspection_id===inspection.id):[];
  const workAreas=(data.workOrderAreas||[]).filter(row=>row.work_order_id===current.id);

  const passed=items.filter(item=>item.status==='passed').length;
  const requiredPhotos=areas.length;
  const photographedAreas=new Set(photos.map(photo=>photo.inspection_area_id)).size;
  const ready=items.length>0&&passed===items.length&&requiredPhotos>0&&photographedAreas===requiredPhotos;
  const locked=['submitted','approved'].includes(inspection?.status);
  const progress=items.length?Math.round(passed/items.length*100):0;

  async function begin(){
    setBusy(true);setMessage('');
    const result=await createInspection(profile.company_id,{
      customer_id:current.customer_id,
      facility_id:current.facility_id,
      work_order_id:current.id,
      title:`Final inspection — ${current.title}`,
      area_names:workAreas.map(area=>area.name).join(',')||'Final service area'
    },profile.id);
    setBusy(false);
    if(result.error)return setMessage(result.error.message);
    await reload();
  }

  async function toggle(item){
    if(locked)return;
    const next=item.status==='passed'?'pending':'passed';
    const result=await updateInspectionItem(item.id,{status:next,score:next==='passed'?100:null,completed_at:next==='passed'?new Date().toISOString():null});
    if(result.error)return setMessage(result.error.message);
    await reload();
  }

  async function upload(area,file){
    if(!file||locked)return;
    setBusy(true);setMessage('');
    const result=await uploadInspectionPhoto(profile.company_id,inspection.id,area.id,profile.id,file,'final');
    setBusy(false);
    if(result.error)return setMessage(result.error.message);
    await reload();
  }

  async function submit(){
    if(!ready)return setMessage('Pass every inspection item and upload at least one photo for every area.');
    setBusy(true);setMessage('');
    const result=await completeInspection(inspection.id,progress,'Employee final inspection completed. All assigned areas passed and photo evidence was submitted.');
    setBusy(false);
    if(result.error)return setMessage(result.error.message);
    setMessage('Inspection submitted. The job is ready to send to the administrator.');
    await reload();
    onSubmitted?.();
  }

  if(!inspection)return <section className="panel employeeInspectionPanel">
    <div className="panelTitle"><div><p className="eyebrow">Required before completion</p><h2>Final inspection</h2></div><ClipboardCheck size={23}/></div>
    <p>Inspect every assigned area and provide photo evidence before submitting this job.</p>
    <button className="ewButton" disabled={busy} onClick={begin}><ShieldCheck size={18}/> Start final inspection</button>
    {message&&<div className="notice">{message}</div>}
  </section>;

  return <section className="panel employeeInspectionPanel">
    <div className="panelTitle"><div><p className="eyebrow">Required before completion</p><h2>Final inspection</h2></div><span className={`status ${inspection.status}`}>{String(inspection.status||'in_progress').replaceAll('_',' ')}</span></div>
    <div className="inspectionProgress"><div><strong>{progress}%</strong><span>{passed}/{items.length} checks passed</span></div><div><strong>{photographedAreas}/{requiredPhotos}</strong><span>areas photographed</span></div></div>
    <div className="inspectionAreaStack">
      {areas.map(area=>{
        const areaItems=items.filter(item=>item.inspection_area_id===area.id);
        const areaPhotos=photos.filter(photo=>photo.inspection_area_id===area.id);
        return <div className="employeeInspectionArea" key={area.id}>
          <div className="employeeInspectionAreaHead"><div><strong>{area.area_name}</strong><span>{areaItems.filter(item=>item.status==='passed').length}/{areaItems.length} passed</span></div><label className={locked?'photoUpload disabled':'photoUpload'}><ImagePlus size={17}/>{areaPhotos.length?'Add photo':'Upload photo'}<input type="file" accept="image/*" capture="environment" disabled={locked||busy} onChange={event=>upload(area,event.target.files?.[0])}/></label></div>
          <div className="employeeInspectionChecks">{areaItems.map(item=><button key={item.id} disabled={locked} className={item.status==='passed'?'passed':''} onClick={()=>toggle(item)}><span>{item.status==='passed'?<CheckCircle2 size={20}/>:null}</span><div><strong>{item.title}</strong><small>{item.status==='passed'?'Passed':'Tap after checking'}</small></div></button>)}</div>
          {areaPhotos.length>0&&<div className="employeeInspectionPhotos">{areaPhotos.map(photo=><img key={photo.id} src={photo.file_url} alt={`${area.area_name} inspection evidence`}/>)}</div>}
        </div>;
      })}
    </div>
    {!locked&&<button className="ewButton" disabled={!ready||busy} onClick={submit}><Camera size={18}/> Submit final inspection</button>}
    {inspection.status==='submitted'&&<div className="inspectionSubmitted"><CheckCircle2 size={21}/><div><strong>Inspection submitted</strong><span>You can now submit the completed job to the administrator.</span></div></div>}
    {inspection.status==='returned'&&<div className="notice">The administrator returned this inspection. Correct the requested items and submit it again.</div>}
    {message&&<div className="notice">{message}</div>}
  </section>;
}
