import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, MapPin, ShieldCheck } from 'lucide-react';

function formatDate(value) {
  if (!value) return 'Date not set';
  return new Intl.DateTimeFormat('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' }).format(new Date(`${value}T12:00:00`));
}

function formatTime(value) {
  if (!value) return 'Time to be confirmed';
  const [hours, minutes] = value.split(':').map(Number);
  return new Intl.DateTimeFormat('en-US', { hour:'numeric', minute:'2-digit' }).format(new Date(2026,0,1,hours,minutes));
}

function statusLabel(status) {
  return String(status || 'scheduled').replaceAll('_',' ');
}

export function CustomerSchedule({ profile, data }) {
  const [view,setView]=useState('upcoming');
  const today=new Date().toISOString().slice(0,10);
  const facilities=(data.facilities||[]).filter(f=>f.customer_id===profile.customer_id);
  const facilityIds=new Set(facilities.map(f=>f.id));

  const visits=useMemo(()=>{
    const workOrders=(data.workOrders||[])
      .filter(row=>row.customer_id===profile.customer_id || facilityIds.has(row.facility_id))
      .map(row=>({
        id:`work-${row.id}`,
        source:'work_order',
        title:row.title||'Cleaning Service',
        scheduled_date:row.scheduled_date,
        scheduled_time:row.scheduled_time,
        facility_id:row.facility_id,
        status:row.status,
        quality_score:row.quality_score,
        summary:row.customer_summary
      }));
    const legacy=(data.visits||[])
      .filter(row=>row.customer_id===profile.customer_id || facilityIds.has(row.facility_id))
      .map(row=>({
        id:`visit-${row.id}`,
        source:'service_visit',
        title:row.title||'Cleaning Service',
        scheduled_date:row.scheduled_date,
        scheduled_time:row.scheduled_time,
        facility_id:row.facility_id,
        status:row.status,
        quality_score:null,
        summary:null
      }));
    const seen=new Set();
    return [...workOrders,...legacy]
      .filter(row=>{
        const key=`${row.facility_id}-${row.scheduled_date}-${row.scheduled_time||''}-${row.title}`;
        if(seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a,b)=>`${a.scheduled_date||''}${a.scheduled_time||''}`.localeCompare(`${b.scheduled_date||''}${b.scheduled_time||''}`));
  },[data,profile.customer_id]);

  const upcoming=visits.filter(v=>(v.scheduled_date||'')>=today && !['verified','completed','archived'].includes(v.status));
  const history=visits.filter(v=>(v.scheduled_date||'')<today || ['verified','completed'].includes(v.status)).sort((a,b)=>(b.scheduled_date||'').localeCompare(a.scheduled_date||''));
  const rows=view==='upcoming'?upcoming:history;
  const facility=id=>facilities.find(f=>f.id===id);
  const next=upcoming[0];

  return <div className="page">
    <section className="pageHeader">
      <div><p className="eyebrow">Customer portal</p><h1>Service schedule</h1><p>See upcoming cleanings and review completed service visits.</p></div>
    </section>

    <section className="statsGrid">
      <div className="stat"><CalendarDays size={20}/><strong>{upcoming.length}</strong><span>Upcoming visits</span><small>{next?`Next: ${formatDate(next.scheduled_date)}`:'Nothing currently scheduled'}</small></div>
      <div className="stat"><MapPin size={20}/><strong>{facilities.length}</strong><span>Facilities</span><small>Locations connected to your account</small></div>
      <div className="stat"><CheckCircle2 size={20}/><strong>{history.filter(v=>['verified','completed'].includes(v.status)).length}</strong><span>Completed services</span><small>Visible service history</small></div>
    </section>

    <section className="panel">
      <div className="panelHeader">
        <div><h2>{view==='upcoming'?'Upcoming service':'Service history'}</h2><p>{view==='upcoming'?'Your scheduled and active visits.':'Completed and past service visits.'}</p></div>
        <div className="segmented"><button className={view==='upcoming'?'active':''} onClick={()=>setView('upcoming')}>Upcoming</button><button className={view==='history'?'active':''} onClick={()=>setView('history')}>History</button></div>
      </div>

      <div className="stackList">
        {!rows.length && <div className="emptyState"><CalendarDays size={28}/><h3>No visits here yet</h3><p>{view==='upcoming'?'Your next scheduled service will appear here.':'Completed services will appear here after verification.'}</p></div>}
        {rows.map(row=>{
          const location=facility(row.facility_id);
          return <article className="listCard" key={row.id}>
            <div className="listIcon"><CalendarDays size={20}/></div>
            <div className="listBody">
              <div className="listTitle"><strong>{row.title}</strong><span className={`status ${row.status||'scheduled'}`}>{statusLabel(row.status)}</span></div>
              <div className="listMeta"><span><CalendarDays size={15}/>{formatDate(row.scheduled_date)}</span><span><Clock size={15}/>{formatTime(row.scheduled_time)}</span>{location&&<span><MapPin size={15}/>{location.name}</span>}</div>
              {row.summary&&<p>{row.summary}</p>}
            </div>
            {row.quality_score!=null&&<div className="scoreBadge"><ShieldCheck size={16}/><strong>{row.quality_score}%</strong><span>Quality</span></div>}
          </article>;
        })}
      </div>
    </section>
  </div>;
}
