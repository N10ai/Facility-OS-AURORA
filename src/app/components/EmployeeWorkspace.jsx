import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, KeyRound, MapPin, Navigation, PackageOpen, ShieldCheck } from 'lucide-react';
import {
  finishWorkOrder,
  recordSupplyUsage,
  startWorkOrder,
  updateWorkOrderArea,
} from '../../services/api';
import './EmployeeWorkspace.css';

function ActionButton({ children, secondary = false, ...props }) {
  return <button className={secondary ? 'ewButton secondary' : 'ewButton'} {...props}>{children}</button>;
}

function EmptyState({ title, text }) {
  return <div className="ewEmpty"><strong>{title}</strong><span>{text}</span></div>;
}

function MissionCard({ order, data, onOpen }) {
  const facility = data.facilities.find(item => item.id === order.facility_id);
  const areas = data.workOrderAreas.filter(item => item.work_order_id === order.id);
  const completed = areas.filter(item => item.status === 'completed').length;
  const progress = areas.length ? Math.round((completed / areas.length) * 100) : 0;

  return <button className="ewMissionCard" onClick={() => onOpen(order)}>
    <div className="ewMissionTop">
      <div>
        <span>{order.scheduled_time || 'Any time'}</span>
        <strong>{order.title}</strong>
      </div>
      <em className={`status ${order.status}`}>{String(order.status || 'scheduled').replaceAll('_', ' ')}</em>
    </div>
    <p>{facility?.name || 'Facility'} · {order.estimated_minutes || 90} min</p>
    <div className="ewProgress"><div style={{ width: `${progress}%` }} /></div>
    <small>{completed}/{areas.length} areas complete</small>
  </button>;
}

export function EmployeeWorkspace({ profile, data, reload }) {
  const [selected, setSelected] = useState(null);
  const [supplyId, setSupplyId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const mine = useMemo(
    () => data.workOrders.filter(order => order.assigned_to_profile_id === profile.id && order.status !== 'archived'),
    [data.workOrders, profile.id],
  );
  const todayMine = mine.filter(order => order.scheduled_date === today && order.status !== 'verified');
  const upcomingMine = mine
    .filter(order => order.scheduled_date > today && order.status !== 'verified')
    .sort((a, b) => `${a.scheduled_date || ''} ${a.scheduled_time || ''}`.localeCompare(`${b.scheduled_date || ''} ${b.scheduled_time || ''}`));
  const historyMine = mine
    .filter(order => order.status === 'verified' || order.scheduled_date < today)
    .sort((a, b) => (b.scheduled_date || '').localeCompare(a.scheduled_date || ''));
  const activeCount = mine.filter(order => ['in_progress', 'returned'].includes(order.status)).length;
  const awaitingCount = mine.filter(order => order.status === 'awaiting_verification').length;

  async function start(order) {
    const { error } = await startWorkOrder(order.id, profile.company_id, profile.id);
    if (error) return setMessage(error.message);
    await reload();
    setSelected({ ...order, status: 'in_progress' });
  }

  async function toggleArea(area) {
    const next = area.status === 'completed' ? 'pending' : 'completed';
    const { error } = await updateWorkOrderArea(area.id, {
      status: next,
      started_at: area.started_at || new Date().toISOString(),
      completed_at: next === 'completed' ? new Date().toISOString() : null,
    });
    if (error) return setMessage(error.message);
    await reload();
  }

  async function useSupply(current) {
    if (!supplyId) return setMessage('Select a supply item.');
    const { error } = await recordSupplyUsage(
      profile.company_id,
      current.id,
      current.facility_id,
      supplyId,
      Number(quantity || 1),
      profile.id,
    );
    if (error) return setMessage(error.message);
    setMessage('Supply usage recorded.');
    setSupplyId('');
    setQuantity(1);
    await reload();
  }

  async function finish(current) {
    const areas = data.workOrderAreas.filter(item => item.work_order_id === current.id);
    if (areas.length && areas.some(item => item.status !== 'completed')) {
      return setMessage('Complete every area before submitting.');
    }
    const { error } = await finishWorkOrder(current.id);
    if (error) return setMessage(error.message);
    setMessage('Mission submitted for verification.');
    await reload();
    setSelected({ ...current, status: 'awaiting_verification' });
  }

  if (selected) {
    const current = data.workOrders.find(order => order.id === selected.id) || selected;
    const areas = data.workOrderAreas.filter(item => item.work_order_id === current.id);
    const facility = data.facilities.find(item => item.id === current.facility_id);
    const inventory = data.inventory.filter(item => item.facility_id === current.facility_id);
    const completed = areas.filter(item => item.status === 'completed').length;
    const readyToSubmit = areas.length === 0 || completed === areas.length;
    const mapsUrl = facility?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.address)}` : '';

    return <div className="page ewMissionPage">
      <button className="back" onClick={() => setSelected(null)}><ArrowLeft size={18}/> My work</button>
      <section className="ewMissionHero">
        <div><p className="eyebrow">Today's mission</p><h1>{current.title}</h1><p>{facility?.name || 'Facility'} · {current.scheduled_time || 'Any time'}</p></div>
        <div className={`status ${current.status}`}>{String(current.status).replaceAll('_', ' ')}</div>
      </section>

      <section className="ewSiteBriefing">
        <div className="ewBriefingTitle"><div className="ewBriefingIcon"><MapPin size={20}/></div><div><p className="eyebrow">Before you enter</p><h2>Site briefing</h2></div></div>
        <div className="ewBriefingGrid">
          <div><MapPin size={18}/><span><small>Address</small><strong>{facility?.address || 'No address added'}</strong></span></div>
          <div><KeyRound size={18}/><span><small>Access instructions</small><strong>{facility?.access_notes || current.instructions || 'No special access notes'}</strong></span></div>
        </div>
        {mapsUrl && <a className="ewDirections" href={mapsUrl} target="_blank" rel="noreferrer"><Navigation size={17}/> Open directions</a>}
      </section>

      <section className="ewInfoStrip"><Clock size={19}/><div><strong>{current.estimated_minutes || 90} minutes planned</strong><span>{current.instructions || 'Follow each assigned area and complete the final readiness check.'}</span></div></section>
      {['scheduled', 'returned'].includes(current.status) && <ActionButton onClick={() => start(current)}>{current.status === 'returned' ? 'Resume corrections' : 'Start mission'}</ActionButton>}
      {current.manager_note && <div className="ewCorrection"><strong>Manager correction</strong><p>{current.manager_note}</p></div>}

      <section className="panel ewAreaPanel">
        <div className="panelTitle"><div><p className="eyebrow">Area workflow</p><h2>Cleaning areas</h2></div><span>{completed}/{areas.length}</span></div>
        <div className="ewAreaList">
          {areas.map(area => <button className={area.status === 'completed' ? 'ewArea completed' : 'ewArea'} key={area.id} onClick={() => toggleArea(area)}>
            <span className="ewCheck">{area.status === 'completed' ? <CheckCircle2 size={22}/> : ''}</span>
            <div><strong>{area.name}</strong><small>{area.status === 'completed' ? 'Completed' : 'Tap when complete'}</small></div>
          </button>)}
          {!areas.length && <EmptyState title="No areas assigned" text="Ask a manager to add facility areas to this work order."/>}
        </div>
      </section>

      <section className="panel ewSupplyPanel">
        <div className="panelTitle"><div><p className="eyebrow">Usage</p><h2>Supplies used</h2></div><PackageOpen size={20}/></div>
        <div className="ewSupplyForm">
          <label>Supply<select value={supplyId} onChange={event => setSupplyId(event.target.value)}><option value="">Select...</option>{inventory.map(item => { const supply = data.supplies.find(row => row.id === item.supply_item_id); return <option key={item.id} value={item.supply_item_id}>{supply?.name || 'Supply'} — {item.quantity_on_hand ?? item.quantity ?? 0}</option>; })}</select></label>
          <label>Quantity<input type="number" min="1" value={quantity} onChange={event => setQuantity(event.target.value)}/></label>
          <ActionButton secondary onClick={() => useSupply(current)}>Record usage</ActionButton>
        </div>
      </section>

      <section className={readyToSubmit ? 'ewReadiness ready' : 'ewReadiness'}>
        <ShieldCheck size={22}/>
        <div><strong>{readyToSubmit ? 'Mission ready to submit' : 'Final check incomplete'}</strong><span>{readyToSubmit ? 'All assigned areas are marked complete.' : `${areas.length - completed} area${areas.length - completed === 1 ? '' : 's'} still need completion.`}</span></div>
      </section>
      <ActionButton disabled={!readyToSubmit || current.status === 'awaiting_verification' || current.status === 'verified'} onClick={() => finish(current)}><CheckCircle2 size={18}/> {current.status === 'awaiting_verification' ? 'Awaiting manager verification' : 'Submit mission'}</ActionButton>
      {message && <div className="notice">{message}</div>}
    </div>;
  }

  return <div className="page ewWorkspace">
    <div className="pageHeader">
      <div><p className="eyebrow">Employee workspace</p><h1>Good day, {profile.full_name?.split(' ')[0] || 'team member'}.</h1><p>Everything needed for today's cleaning route is in one place.</p></div>
      <div className="ewTodayBadge"><strong>{todayMine.length}</strong><span>today</span></div>
    </div>

    <div className="ewShiftSummary">
      <div><Clock size={19}/><span><strong>{activeCount}</strong><small>Active now</small></span></div>
      <div><ShieldCheck size={19}/><span><strong>{awaitingCount}</strong><small>Awaiting review</small></span></div>
      <div><CheckCircle2 size={19}/><span><strong>{historyMine.length}</strong><small>Completed</small></span></div>
    </div>

    <section className="ewTodaySection">
      <div className="panelTitle"><div><p className="eyebrow">Today</p><h2>Active missions</h2></div><span>{today}</span></div>
      <div className="ewMissionGrid">{todayMine.map(order => <MissionCard key={order.id} order={order} data={data} onOpen={setSelected}/>)}{!todayMine.length && <EmptyState title="No missions today" text="New assignments will appear here automatically."/>}</div>
    </section>

    <div className="ewWorkspaceGrid">
      <section className="panel"><div className="panelTitle"><div><p className="eyebrow">Next</p><h2>Upcoming</h2></div><span>{upcomingMine.length}</span></div><div className="ewCompactList">{upcomingMine.slice(0, 8).map(order => <MissionCard key={order.id} order={order} data={data} onOpen={setSelected}/>)}{!upcomingMine.length && <EmptyState title="Nothing upcoming" text="Your schedule is clear after today."/>}</div></section>
      <section className="panel"><div className="panelTitle"><div><p className="eyebrow">Completed</p><h2>History</h2></div><span>{historyMine.length}</span></div><div className="ewHistory">{historyMine.slice(0, 12).map(order => { const facility = data.facilities.find(item => item.id === order.facility_id); return <button key={order.id} onClick={() => setSelected(order)}><CheckCircle2 size={18}/><div><strong>{order.title}</strong><span>{facility?.name || 'Facility'} · {order.scheduled_date}</span></div><em className={`status ${order.status}`}>{String(order.status).replaceAll('_', ' ')}</em></button>; })}{!historyMine.length && <EmptyState title="No history yet" text="Verified missions will appear here."/>}</div></section>
    </div>
  </div>;
}
