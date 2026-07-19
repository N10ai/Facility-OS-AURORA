import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

execFileSync(process.execPath, ['scripts/integrate-v3.16.mjs'], { stdio: 'inherit' });

const employeePath = 'src/components/employee/EmployeeWorkspace.jsx';
let employee = readFileSync(employeePath, 'utf8');
const oldEmployee = `{areas.map(area => <button className={area.status === 'completed' ? 'ewArea completed' : 'ewArea'} key={area.id} onClick={() => toggleArea(area)}>
            <span className="ewCheck">{area.status === 'completed' ? <CheckCircle2 size={22}/> : ''}</span>
            <div><strong>{area.name}</strong><small>{area.status === 'completed' ? 'Completed' : 'Tap when complete'}</small></div>
          </button>)}`;
const newEmployee = `{areas.map(area => <div className="ewAreaGuide" key={area.id}>
            <button className={area.status === 'completed' ? 'ewArea completed' : 'ewArea'} onClick={() => toggleArea(area)}>
              <span className="ewCheck">{area.status === 'completed' ? <CheckCircle2 size={22}/> : ''}</span>
              <div><strong>{area.name}</strong><small>{area.status === 'completed' ? 'Completed' : 'Tap when complete'}</small></div>
            </button>
            {(area.sop_title || area.instructions || area.required_tools?.length || area.required_supplies?.length || area.safety_notes) && <details className="ewSopCard" open>
              <summary>{area.sop_title || 'Area SOP and instructions'}</summary>
              {area.estimated_minutes ? <p><b>Expected time:</b> {area.estimated_minutes} minutes</p> : null}
              {area.instructions ? <div><b>Cleaning sequence</b><p className="ewInstructions">{area.instructions}</p></div> : null}
              {area.required_tools?.length ? <div><b>Tools</b><div className="ewTags">{area.required_tools.map(tool => <span key={tool}>{tool}</span>)}</div></div> : null}
              {area.required_supplies?.length ? <div><b>Cleaning supplies</b><div className="ewTags">{area.required_supplies.map(item => <span key={item}>{item}</span>)}</div></div> : null}
              {area.safety_notes ? <div className="ewSafety"><b>Safety / special notes</b><p>{area.safety_notes}</p></div> : null}
            </details>}
          </div>)}`;
if (!employee.includes(oldEmployee)) throw new Error('Employee area marker not found');
employee = employee.replace(oldEmployee, newEmployee);
writeFileSync(employeePath, employee);

const cssPath = 'src/components/employee/EmployeeWorkspace.css';
let css = readFileSync(cssPath, 'utf8');
css += `\n.ewAreaGuide{border:1px solid var(--line,#e5e7eb);border-radius:18px;overflow:hidden;background:#fff}.ewAreaGuide .ewArea{border:0;border-radius:0;width:100%}.ewSopCard{padding:0 18px 16px;background:#f8fafc}.ewSopCard summary{cursor:pointer;padding:14px 0;font-weight:800}.ewSopCard p{white-space:pre-line;line-height:1.55;margin:7px 0 13px}.ewTags{display:flex;flex-wrap:wrap;gap:7px;margin:8px 0 14px}.ewTags span{background:#fff;border:1px solid #dbe3ee;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700}.ewSafety{background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:11px 13px;margin-top:8px}.ewSafety p{margin-bottom:0}.ewAreaList{gap:12px}\n`;
writeFileSync(cssPath, css);

const appPath = 'src/App.jsx';
let app = readFileSync(appPath, 'utf8');
const oldAdmin = `{areas.map(area=><div className="areaAdminRow" key={area.id}><div><strong>{area.name}</strong><span>{area.completed_at?new Date(area.completed_at).toLocaleString():area.status}</span></div><div className={\`status \${area.status}\`}>{area.status}</div></div>)}`;
const newAdmin = `{areas.map(area=><div className="areaAdminGuidance" key={area.id}>
          <div className="areaAdminRow"><div><strong>{area.name}</strong><span>{area.completed_at?new Date(area.completed_at).toLocaleString():area.status}</span></div><div className={\`status \${area.status}\`}>{area.status}</div></div>
          <details><summary>Area SOP, tools and supplies</summary><div className="form">
            <label>SOP title<input defaultValue={area.sop_title||''} onBlur={e=>updateWorkOrderArea(area.id,{sop_title:e.target.value||null}).then(reload)}/></label>
            <label>Step-by-step instructions<textarea defaultValue={area.instructions||''} onBlur={e=>updateWorkOrderArea(area.id,{instructions:e.target.value||null}).then(reload)}/></label>
            <div className="form2"><label>Required tools<input defaultValue={(area.required_tools||[]).join(', ')} onBlur={e=>updateWorkOrderArea(area.id,{required_tools:e.target.value.split(',').map(v=>v.trim()).filter(Boolean)}).then(reload)}/></label><label>Cleaning supplies<input defaultValue={(area.required_supplies||[]).join(', ')} onBlur={e=>updateWorkOrderArea(area.id,{required_supplies:e.target.value.split(',').map(v=>v.trim()).filter(Boolean)}).then(reload)}/></label></div>
            <div className="form2"><label>Expected minutes<input type="number" min="0" defaultValue={area.estimated_minutes||''} onBlur={e=>updateWorkOrderArea(area.id,{estimated_minutes:e.target.value?Number(e.target.value):null}).then(reload)}/></label><label>Safety / special notes<textarea defaultValue={area.safety_notes||''} onBlur={e=>updateWorkOrderArea(area.id,{safety_notes:e.target.value||null}).then(reload)}/></label></div>
          </div></details>
        </div>)}`;
if (!app.includes(oldAdmin)) throw new Error('Admin area marker not found');
app = app.replace(oldAdmin, newAdmin);
writeFileSync(appPath, app);

const appCssPath = 'src/App.css';
let appCss = readFileSync(appCssPath, 'utf8');
appCss += `\n.areaAdminGuidance{border-bottom:1px solid var(--line,#e5e7eb);padding-bottom:10px}.areaAdminGuidance details{padding:0 4px 12px}.areaAdminGuidance summary{cursor:pointer;font-size:13px;font-weight:800;color:#2563eb;padding:8px 0}.areaAdminGuidance .form{padding:12px;background:#f8fafc;border-radius:14px}.areaAdminGuidance textarea{min-height:88px}\n`;
writeFileSync(appCssPath, appCss);

console.log('FacilityOS v3.17 area SOP integration complete.');
