import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, MapPin, Search } from 'lucide-react';
import './EmployeeScheduleWorkspace.css';

const statusLabel = value => String(value || 'scheduled').replaceAll('_', ' ');
const dateLabel = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}) : 'Unscheduled';

export function EmployeeScheduleWorkspace({ profile, data, mode='schedule' }) {
  const [query,setQuery]=useState('');
  const today=new Date().toISOString().slice(0,10);
  const mine=useMemo(()=>data.workOrders
    .filter(order=>order.assigned_to_profile_id===profile.id&&order.status!=='archived')
    .sort((a,b)=>`${a.scheduled_date||''} ${a.scheduled_time||''}`.localeCompare(`${b.scheduled_date||''} ${b.scheduled_time||''}`)),[data.workOrders,profile.id]);
  const rows=mine.filter(order=>mode==='history'
    ? order.status==='verified'||order.scheduled_date<today
    : order.scheduled_date>=today&&order.status!=='verified');
  const visible=rows.filter(order=>{
    const facility=data.facilities.find(item=>item.id===order.facility_id);
    return `${order.title||''} ${facility?.name||''} ${order.status||''}`.toLowerCase().includes(query.toLowerCase());
  });
  const completed=mine.filter(order=>order.status==='verified').length;
  const upcoming=mine.filter(order=>order.scheduled_date>=today&&order.status!=='verified').length;
  const minutes=rows.reduce((sum,order)=>sum+Number(order.estimated_minutes||0),0);

  return <div className="page employeeScheduleWorkspace">
    <div className="pageHeader"><div><p className="eyebrow">Employee workspace</p><h1>{mode==='history'?'Service history':'My schedule'}</h1><p>{mode==='history'?'Review completed and past assignments.':'See every upcoming assignment in chronological order.'}</p></div></div>
    <div className="stats">
      <div className="stat"><CalendarDays size={19}/><strong>{upcoming}</strong><span>Upcoming</span><small>Assigned visits</small></div>
      <div className="stat pastelGreen"><CheckCircle2 size={19}/><strong>{completed}</strong><span>Verified</span><small>Completed missions</small></div>
      <div className="stat"><Clock size={19}/><strong>{Math.round(minutes/60*10)/10}h</strong><span>{mode==='history'?'Recorded':'Scheduled'}</span><small>Estimated workload</small></div>
    </div>
    <label className="employeeScheduleSearch"><Search size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search assignments or facilities..."/></label>
    <section className="employeeTimeline">
      {visible.map(order=>{
        const facility=data.facilities.find(item=>item.id===order.facility_id);
        const areas=data.workOrderAreas.filter(item=>item.work_order_id===order.id);
        const done=areas.filter(item=>item.status==='completed').length;
        return <article className="employeeTimelineCard" key={order.id}>
          <div className="employeeTimelineDate"><strong>{dateLabel(order.scheduled_date)}</strong><span>{order.scheduled_time||'Any time'}</span></div>
          <div className="employeeTimelineBody"><div><h2>{order.title||'Cleaning service'}</h2><p><MapPin size={15}/>{facility?.name||'Facility'}</p></div><em className={`status ${order.status}`}>{statusLabel(order.status)}</em></div>
          <div className="employeeTimelineMeta"><span><Clock size={15}/>{order.estimated_minutes||90} min</span><span><CheckCircle2 size={15}/>{done}/{areas.length} areas</span>{order.quality_score!=null&&<span>Quality {order.quality_score}%</span>}</div>
          {order.manager_note&&<p className="employeeTimelineNote">Manager note: {order.manager_note}</p>}
        </article>;
      })}
      {!visible.length&&<div className="ewEmpty"><strong>{mode==='history'?'No service history':'No upcoming assignments'}</strong><span>{query?'Try a different search.':'Assignments will appear here automatically.'}</span></div>}
    </section>
  </div>;
}
