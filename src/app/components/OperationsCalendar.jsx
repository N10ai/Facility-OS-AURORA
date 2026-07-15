import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { createWorkOrder, updateWorkOrder } from '../../services/api';

const iso=d=>d.toISOString().slice(0,10);
const startOfMonth=d=>new Date(d.getFullYear(),d.getMonth(),1);
const endOfMonth=d=>new Date(d.getFullYear(),d.getMonth()+1,0);
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const blank=date=>({customer_id:'',facility_id:'',assigned_to_profile_id:'',title:'Routine Cleaning',scheduled_date:date||iso(new Date()),scheduled_time:'18:00',estimated_minutes:90,priority:'normal',instructions:'',area_names:'Reception, Restrooms, Kitchen, Offices'});

export function OperationsCalendar({data,companyId,reload}){
  const [cursor,setCursor]=useState(startOfMonth(new Date()));
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(blank());
  const [message,setMessage]=useState('');
  const [employeeFilter,setEmployeeFilter]=useState('all');
  const [facilityFilter,setFacilityFilter]=useState('all');
  const [statusFilter,setStatusFilter]=useState('all');

  const days=useMemo(()=>{
    const first=startOfMonth(cursor),last=endOfMonth(cursor);
    const gridStart=addDays(first,-first.getDay());
    const gridEnd=addDays(last,6-last.getDay());
    const result=[];for(let d=gridStart;d<=gridEnd;d=addDays(d,1))result.push(new Date(d));
    return result;
  },[cursor]);

  const visible=(data.workOrders||[]).filter(order=>
    order.status!=='archived'&&
    (employeeFilter==='all'||order.assigned_to_profile_id===employeeFilter)&&
    (facilityFilter==='all'||order.facility_id===facilityFilter)&&
    (statusFilter==='all'||order.status===statusFilter)
  );

  const facilities=(data.facilities||[]).filter(f=>!form.customer_id||f.customer_id===form.customer_id);
  const employees=(data.people||[]).filter(p=>['owner','manager','employee'].includes(p.role));

  function createOn(date){setEditing(null);setForm(blank(date));setMessage('');setOpen(true)}
  function edit(order){setEditing(order);setForm({...blank(order.scheduled_date),...order,area_names:''});setMessage('');setOpen(true)}
  async function save(){
    if(!form.customer_id||!form.facility_id||!form.scheduled_date)return setMessage('Customer, facility, and date are required.');
    const result=editing?await updateWorkOrder(editing.id,form):await createWorkOrder(companyId,form);
    if(result.error)return setMessage(result.error.message);
    setOpen(false);setEditing(null);await reload();
  }
  async function drop(event,date){
    event.preventDefault();
    const id=event.dataTransfer.getData('text/work-order-id');if(!id)return;
    const result=await updateWorkOrder(id,{scheduled_date:date});
    if(result.error)return setMessage(result.error.message);
    setMessage(`Work order moved to ${date}.`);await reload();
  }

  return <div className="page operationsCalendarPage">
    <div className="pageHeader"><div><p className="eyebrow">Operations planning</p><h1>Calendar</h1><p>Create, edit, filter, and reschedule work orders from one planning surface.</p></div><button className="btn primary" onClick={()=>createOn(iso(new Date()))}><Plus size={16}/> New work order</button></div>
    {message&&<div className="notice">{message}</div>}
    <section className="calendarToolbar panel">
      <div className="calendarMonthNav"><button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1))}><ChevronLeft size={18}/></button><strong>{cursor.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</strong><button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1))}><ChevronRight size={18}/></button><button className="todayButton" onClick={()=>setCursor(startOfMonth(new Date()))}>Today</button></div>
      <div className="calendarFilters">
        <select value={employeeFilter} onChange={e=>setEmployeeFilter(e.target.value)}><option value="all">All employees</option>{employees.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select>
        <select value={facilityFilter} onChange={e=>setFacilityFilter(e.target.value)}><option value="all">All facilities</option>{(data.facilities||[]).map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All statuses</option>{['scheduled','in_progress','awaiting_verification','verified','returned'].map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select>
      </div>
    </section>
    <section className="calendarGrid">
      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=><div className="calendarWeekday" key={day}>{day}</div>)}
      {days.map(day=>{const date=iso(day);const orders=visible.filter(o=>o.scheduled_date===date).sort((a,b)=>(a.scheduled_time||'').localeCompare(b.scheduled_time||''));const outside=day.getMonth()!==cursor.getMonth();return <div className={outside?'calendarDay outside':'calendarDay'} key={date} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,date)}>
        <button className="calendarDayNumber" onClick={()=>createOn(date)}><span>{day.getDate()}</span><Plus size={13}/></button>
        <div className="calendarEvents">{orders.slice(0,5).map(order=>{const facility=(data.facilities||[]).find(f=>f.id===order.facility_id);const employee=employees.find(p=>p.id===order.assigned_to_profile_id);return <button draggable onDragStart={e=>e.dataTransfer.setData('text/work-order-id',order.id)} className={`calendarEvent ${order.status}`} key={order.id} onClick={()=>edit(order)}><strong>{order.scheduled_time||'Any'} · {facility?.name||order.title}</strong><span>{employee?.full_name||'Unassigned'} · {order.status.replaceAll('_',' ')}</span></button>})}{orders.length>5&&<small className="calendarMore">+{orders.length-5} more</small>}</div>
      </div>})}
    </section>
    {open&&<div className="modalBackdrop"><section className="modal calendarEditor"><button className="icon close" onClick={()=>setOpen(false)}><X size={18}/></button><p className="eyebrow">{editing?'Edit work order':'Create work order'}</p><h2>{editing?'Update schedule and assignment':'Schedule a cleaning mission'}</h2><div className="formSection"><h3>Customer & location</h3><div className="form2"><label>Customer<select value={form.customer_id||''} onChange={e=>setForm({...form,customer_id:e.target.value,facility_id:''})}><option value="">Select...</option>{(data.customers||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Facility<select value={form.facility_id||''} onChange={e=>setForm({...form,facility_id:e.target.value})}><option value="">Select...</option>{facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label></div></div><div className="formSection"><h3>Schedule</h3><label>Title<input value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})}/></label><div className="form2"><label>Date<input type="date" value={form.scheduled_date||''} onChange={e=>setForm({...form,scheduled_date:e.target.value})}/></label><label>Time<input type="time" value={form.scheduled_time||''} onChange={e=>setForm({...form,scheduled_time:e.target.value})}/></label></div><div className="form2"><label>Employee<select value={form.assigned_to_profile_id||''} onChange={e=>setForm({...form,assigned_to_profile_id:e.target.value})}><option value="">Unassigned</option>{employees.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label><label>Estimated minutes<input type="number" value={form.estimated_minutes||90} onChange={e=>setForm({...form,estimated_minutes:e.target.value})}/></label></div></div>{!editing&&<div className="formSection"><h3>Work scope</h3><label>Areas<input value={form.area_names||''} onChange={e=>setForm({...form,area_names:e.target.value})}/></label></div>}<div className="formSection"><h3>Instructions</h3><label>Employee notes<textarea value={form.instructions||''} onChange={e=>setForm({...form,instructions:e.target.value})}/></label></div>{message&&<div className="notice">{message}</div>}<div className="stickyFormActions"><button className="btn secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="btn primary" onClick={save}>{editing?'Save changes':'Create work order'}</button></div></section></div>}
  </div>;
}
