import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, MapPin, UserRound, Wrench, XCircle } from 'lucide-react';
import { createWorkOrder, updateRecord } from '../../services/api';
import './AdminRequestsWorkspace.css';

function dateLabel(value) {
  if (!value) return 'Not scheduled';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

export function AdminRequestsWorkspace({ data, companyId, profile, reload, onOpenWorkOrders }) {
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('active');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState({ scheduled_date:'', scheduled_time:'', assigned_to_profile_id:'', estimated_minutes:90, area_names:'', admin_note:'' });

  const requests = useMemo(() => data.requests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['new','reviewing','approved'].includes(request.status);
    return request.status === filter;
  }), [data.requests, filter]);

  const selected = data.requests.find(request => request.id === selectedId) || null;
  const customer = selected ? data.customers.find(item => item.id === selected.customer_id) : null;
  const facility = selected ? data.facilities.find(item => item.id === selected.facility_id) : null;
  const requestor = selected ? data.people.find(item => item.id === selected.requested_by_profile_id) : null;
  const linkedOrder = selected?.work_order_id ? data.workOrders.find(item => item.id === selected.work_order_id) : null;
  const employees = data.people.filter(person => ['employee','manager','owner','admin'].includes(person.role) && person.status !== 'archived');

  function openRequest(request) {
    setSelectedId(request.id);
    setMessage('');
    setSchedule({
      scheduled_date: request.scheduled_date || '',
      scheduled_time: '',
      assigned_to_profile_id: '',
      estimated_minutes: facility?.estimated_minutes || 90,
      area_names: '',
      admin_note: request.admin_note || ''
    });
  }

  async function setStatus(status) {
    if (!selected) return;
    setSaving(true); setMessage('');
    const { error } = await updateRecord('customer_requests', selected.id, {
      status,
      admin_note: schedule.admin_note || null,
      handled_by_profile_id: profile.id,
      handled_at: new Date().toISOString()
    });
    setSaving(false);
    if (error) return setMessage(error.message);
    setMessage(status === 'declined' ? 'Request declined and customer status updated.' : 'Request status updated.');
    await reload();
  }

  async function createOrder() {
    if (!selected) return;
    if (!selected.facility_id) return setMessage('This request needs a facility before it can become a work order.');
    if (!schedule.scheduled_date) return setMessage('Choose a service date.');
    setSaving(true); setMessage('');
    const { data:order, error } = await createWorkOrder(companyId, {
      customer_id: selected.customer_id,
      facility_id: selected.facility_id,
      assigned_to_profile_id: schedule.assigned_to_profile_id,
      title: selected.title || 'Customer requested service',
      scheduled_date: schedule.scheduled_date,
      scheduled_time: schedule.scheduled_time,
      estimated_minutes: schedule.estimated_minutes,
      priority: selected.request_type === 'issue' ? 'high' : 'normal',
      instructions: [selected.description, schedule.admin_note].filter(Boolean).join('\n\n'),
      area_names: schedule.area_names
    });
    if (error) { setSaving(false); return setMessage(error.message); }
    const update = await updateRecord('customer_requests', selected.id, {
      status:'scheduled',
      work_order_id:order.id,
      scheduled_date:schedule.scheduled_date,
      admin_note:schedule.admin_note || null,
      handled_by_profile_id:profile.id,
      handled_at:new Date().toISOString()
    });
    setSaving(false);
    if (update.error) return setMessage(update.error.message);
    setMessage('Work order created and request marked as scheduled.');
    await reload();
  }

  if (selected) return <div className="page arwPage">
    <button className="back" onClick={() => setSelectedId(null)}>← Requests</button>
    <section className="arwHero">
      <div><p className="eyebrow">Customer request</p><h1>{selected.title}</h1><p>{customer?.name || 'Customer'} · {facility?.name || 'No facility selected'}</p></div>
      <div className={`status ${selected.status}`}>{selected.status}</div>
    </section>

    <div className="arwFacts">
      <div><MapPin size={18}/><span>Facility</span><strong>{facility?.name || 'Not selected'}</strong></div>
      <div><UserRound size={18}/><span>Requested by</span><strong>{requestor?.full_name || 'Customer user'}</strong></div>
      <div><Clock3 size={18}/><span>Submitted</span><strong>{dateLabel(selected.created_at?.slice(0,10))}</strong></div>
      <div><Wrench size={18}/><span>Type</span><strong>{String(selected.request_type || 'service').replaceAll('_',' ')}</strong></div>
    </div>

    <section className="panel arwDescription"><div className="panelTitle"><h2>Request details</h2></div><p>{selected.description || 'No additional description provided.'}</p></section>

    {linkedOrder ? <section className="panel arwLinked">
      <div><ClipboardCheck size={22}/><div><p className="eyebrow">Linked work order</p><h2>{linkedOrder.title}</h2><span>{dateLabel(linkedOrder.scheduled_date)} · {linkedOrder.scheduled_time || 'Any time'}</span></div></div>
      <button className="btn secondary" onClick={onOpenWorkOrders}>Open work orders <ChevronRight size={16}/></button>
    </section> : <section className="panel arwScheduler">
      <div className="panelTitle"><div><p className="eyebrow">Operational action</p><h2>Schedule as work order</h2></div><CalendarDays size={22}/></div>
      <div className="form2"><label>Date<input type="date" value={schedule.scheduled_date} onChange={event => setSchedule({...schedule, scheduled_date:event.target.value})}/></label><label>Time<input type="time" value={schedule.scheduled_time} onChange={event => setSchedule({...schedule, scheduled_time:event.target.value})}/></label></div>
      <div className="form2"><label>Assign employee<select value={schedule.assigned_to_profile_id} onChange={event => setSchedule({...schedule, assigned_to_profile_id:event.target.value})}><option value="">Unassigned</option>{employees.map(person => <option key={person.id} value={person.id}>{person.full_name}</option>)}</select></label><label>Estimated minutes<input type="number" min="15" step="15" value={schedule.estimated_minutes} onChange={event => setSchedule({...schedule, estimated_minutes:event.target.value})}/></label></div>
      <label>Areas, separated by commas<input value={schedule.area_names} onChange={event => setSchedule({...schedule, area_names:event.target.value})} placeholder="Reception, Restrooms, Kitchen"/></label>
      <label>Manager note<textarea value={schedule.admin_note} onChange={event => setSchedule({...schedule, admin_note:event.target.value})} placeholder="Visible to the customer as the request is handled."/></label>
      <div className="buttonRow"><button className="btn secondary" disabled={saving} onClick={() => setStatus('reviewing')}>Mark reviewing</button><button className="btn primary" disabled={saving} onClick={createOrder}><ClipboardCheck size={17}/> Create work order</button></div>
    </section>}

    {!linkedOrder && <section className="arwDecision"><button disabled={saving} onClick={() => setStatus('declined')}><XCircle size={18}/> Decline request</button><button disabled={saving} onClick={() => setStatus('approved')}><CheckCircle2 size={18}/> Approve without scheduling</button></section>}
    {message && <div className="notice">{message}</div>}
  </div>;

  const counts = {
    new:data.requests.filter(item => item.status === 'new').length,
    reviewing:data.requests.filter(item => item.status === 'reviewing').length,
    scheduled:data.requests.filter(item => item.status === 'scheduled').length
  };

  return <div className="page arwPage">
    <div className="pageHeader"><div><p className="eyebrow">Customer operations</p><h1>Service requests</h1><p>Review customer needs and convert approved requests into scheduled work.</p></div></div>
    <div className="arwSummary"><article><strong>{counts.new}</strong><span>New</span></article><article><strong>{counts.reviewing}</strong><span>Reviewing</span></article><article><strong>{counts.scheduled}</strong><span>Scheduled</span></article></div>
    <div className="segmented compact arwFilters">{['active','new','reviewing','scheduled','declined','all'].map(value => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div>
    <section className="panel arwList">{requests.map(request => {
      const itemCustomer = data.customers.find(item => item.id === request.customer_id);
      const itemFacility = data.facilities.find(item => item.id === request.facility_id);
      return <button className="arwRow" key={request.id} onClick={() => openRequest(request)}><div className="arwIcon"><Wrench size={19}/></div><div><strong>{request.title}</strong><span>{itemCustomer?.name || 'Customer'} · {itemFacility?.name || 'No facility'} · {String(request.request_type || '').replaceAll('_',' ')}</span></div><div className={`status ${request.status}`}>{request.status}</div><ChevronRight size={18}/></button>;
    })}{!requests.length && <div className="arwEmpty"><Wrench size={28}/><strong>No matching requests</strong><span>Customer submissions will appear here.</span></div>}</section>
  </div>;
}
