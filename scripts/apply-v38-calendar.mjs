import fs from 'node:fs';
const appPath='src/app/App.jsx';
const cssPath='src/styles/app.css';
let app=fs.readFileSync(appPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');

if(!app.includes("./components/OperationsCalendar")){
  const marker="import { configured, supabase } from '../services/supabase';";
  if(!app.includes(marker))throw new Error('Missing Supabase import marker');
  app=app.replace(marker,marker+"\nimport { OperationsCalendar } from './components/OperationsCalendar';");
}
app=app.replace("else if(page==='calendar') content=<CalendarPage data={data} companyId={profile.company_id} reload={reload}/>;","else if(page==='calendar') content=<OperationsCalendar data={data} companyId={profile.company_id} reload={reload}/>;");

if(!css.includes('Aurora v3.8 operations calendar'))css+=`

/* Aurora v3.8 operations calendar */
.calendarToolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px}.calendarMonthNav,.calendarFilters{display:flex;align-items:center;gap:9px}.calendarMonthNav button{border:1px solid var(--line);background:#fff;border-radius:10px;padding:8px;display:grid;place-items:center}.calendarMonthNav .todayButton{padding:8px 12px}.calendarFilters select{min-width:150px}.calendarGrid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border:1px solid var(--line);border-radius:24px;overflow:hidden;background:#fff}.calendarWeekday{padding:11px;background:#f8fafc;border-bottom:1px solid var(--line);font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:700}.calendarDay{min-height:145px;padding:8px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:#fff}.calendarDay:nth-child(7n){border-right:0}.calendarDay.outside{background:#f8fafc}.calendarDayNumber{display:flex;align-items:center;gap:5px;border:0;background:transparent;color:var(--ink);font-weight:700;padding:4px}.calendarDayNumber svg{opacity:0}.calendarDay:hover .calendarDayNumber svg{opacity:1}.calendarEvents{display:flex;flex-direction:column;gap:5px}.calendarEvent{border:0;border-left:3px solid #2563eb;border-radius:8px;background:#eff6ff;padding:7px;text-align:left;color:#1e3a8a}.calendarEvent strong,.calendarEvent span{display:block}.calendarEvent strong{font-size:11px}.calendarEvent span{font-size:9px;margin-top:3px;opacity:.76}.calendarEvent.in_progress{background:#ecfdf5;border-color:#16a34a;color:#166534}.calendarEvent.awaiting_verification{background:#fff7ed;border-color:#f59e0b;color:#9a3412}.calendarEvent.verified{background:#f0fdf4;border-color:#22c55e;color:#166534}.calendarEvent.returned{background:#fef2f2;border-color:#ef4444;color:#991b1b}.calendarMore{padding-left:6px;color:var(--muted)}.calendarEditor{max-height:88vh;overflow:auto}.formSection{border:1px solid var(--line);border-radius:17px;padding:15px;margin:12px 0}.formSection h3{margin:0 0 12px;font-size:13px}.stickyFormActions{position:sticky;bottom:-1px;display:flex;justify-content:flex-end;gap:9px;background:#fff;padding:13px 0 2px;border-top:1px solid var(--line)}
@media(max-width:900px){.calendarToolbar{align-items:flex-start;flex-direction:column}.calendarFilters{width:100%;overflow:auto}.calendarGrid{min-width:850px}.operationsCalendarPage{overflow-x:auto}}
@media(max-width:640px){.calendarFilters select{min-width:135px}.calendarDay{min-height:120px}.calendarEditor .form2{grid-template-columns:1fr}}
`;
fs.writeFileSync(appPath,app);fs.writeFileSync(cssPath,css);console.log('Applied Aurora v3.8 calendar integration.');
