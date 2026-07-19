import { useMemo, useState } from 'react';
import { AlertTriangle, Building2, CheckCircle2, ClipboardCheck, Download, DollarSign, ShieldCheck, UsersRound } from 'lucide-react';
import './ReportsWorkspace.css';

const money = value => `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const iso = date => date.toISOString().slice(0, 10);
const daysAgo = count => { const date = new Date(); date.setDate(date.getDate() - count); return iso(date); };
const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;

function Metric({ icon: Icon, label, value, note, tone = '' }) {
  return <article className={`rwMetric ${tone}`}><span><Icon size={19}/></span><strong>{value}</strong><b>{label}</b><small>{note}</small></article>;
}

function BarRow({ label, value, max, detail }) {
  const width = max ? Math.max(3, Math.round((value / max) * 100)) : 0;
  return <div className="rwBarRow"><div><strong>{label}</strong><span>{detail}</span></div><div className="rwBarTrack"><i style={{ width: `${width}%` }}/></div><b>{value}</b></div>;
}

export function ReportsWorkspace({ data }) {
  const [range, setRange] = useState('30');
  const [facilityId, setFacilityId] = useState('all');
  const startDate = range === 'all' ? '' : daysAgo(Number(range));
  const inRange = value => !startDate || String(value || '') >= startDate;

  const report = useMemo(() => {
    const workOrders = (data.workOrders || []).filter(order => order.status !== 'archived' && inRange(order.scheduled_date) && (facilityId === 'all' || order.facility_id === facilityId));
    const inspections = (data.inspections || []).filter(item => inRange((item.inspected_at || item.created_at || '').slice(0, 10)) && (facilityId === 'all' || item.facility_id === facilityId));
    const invoices = (data.invoices || []).filter(item => inRange((item.issue_date || item.created_at || '').slice(0, 10)));
    const payments = (data.payments || []).filter(item => inRange((item.payment_date || item.created_at || '').slice(0, 10)));
    const expenses = (data.expenses || []).filter(item => inRange((item.expense_date || item.created_at || '').slice(0, 10)));
    const payroll = (data.payroll || []).filter(item => inRange((item.pay_date || item.created_at || '').slice(0, 10)));
    const issues = (data.issues || []).filter(item => inRange((item.created_at || '').slice(0, 10)) && (facilityId === 'all' || item.facility_id === facilityId));
    const verified = workOrders.filter(order => order.status === 'verified');
    const completed = workOrders.filter(order => ['verified', 'awaiting_verification'].includes(order.status));
    const completion = workOrders.length ? Math.round((completed.length / workOrders.length) * 100) : 0;
    const avgQuality = inspections.length ? Math.round(inspections.reduce((sum, item) => sum + Number(item.overall_score || 0), 0) / inspections.length) : 0;
    const invoiced = invoices.reduce((sum, item) => sum + Number(item.amount || item.total || 0), 0);
    const collected = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const cost = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) + payroll.reduce((sum, item) => sum + Number(item.amount || item.gross_pay || 0), 0);

    const facilities = (data.facilities || []).map(facility => {
      const orders = workOrders.filter(order => order.facility_id === facility.id);
      const done = orders.filter(order => ['verified', 'awaiting_verification'].includes(order.status)).length;
      const scores = inspections.filter(item => item.facility_id === facility.id).map(item => Number(item.overall_score || 0));
      return { id: facility.id, name: facility.name, orders: orders.length, completion: orders.length ? Math.round(done / orders.length * 100) : 0, quality: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0 };
    }).filter(item => item.orders || item.quality).sort((a, b) => b.orders - a.orders);

    const employees = (data.people || []).filter(person => ['employee', 'manager', 'owner'].includes(person.role)).map(person => {
      const orders = workOrders.filter(order => order.assigned_to_profile_id === person.id);
      const done = orders.filter(order => ['verified', 'awaiting_verification'].includes(order.status)).length;
      return { id: person.id, name: person.full_name || 'Team member', orders: orders.length, completed: done, completion: orders.length ? Math.round(done / orders.length * 100) : 0 };
    }).filter(item => item.orders).sort((a, b) => b.completed - a.completed);

    return { workOrders, inspections, invoices, payments, expenses, payroll, issues, verified, completion, avgQuality, invoiced, collected, cost, facilities, employees };
  }, [data, range, facilityId]);

  function exportCsv() {
    const rows = [['Service date', 'Facility', 'Work order', 'Employee', 'Status', 'Quality score']];
    report.workOrders.forEach(order => {
      const facility = (data.facilities || []).find(item => item.id === order.facility_id);
      const employee = (data.people || []).find(item => item.id === order.assigned_to_profile_id);
      rows.push([order.scheduled_date, facility?.name || '', order.title || '', employee?.full_name || '', order.status || '', order.quality_score || '']);
    });
    const blob = new Blob([rows.map(row => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facilityos-report-${iso(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const maxFacilityOrders = Math.max(1, ...report.facilities.map(item => item.orders));
  const maxEmployeeOrders = Math.max(1, ...report.employees.map(item => item.completed));
  const outstanding = Math.max(0, report.invoiced - report.collected);
  const margin = report.collected - report.cost;

  return <div className="page rwPage">
    <div className="pageHeader rwHeader"><div><p className="eyebrow">Business intelligence</p><h1>Reports</h1><p>Live operational, quality, team, and financial performance from FacilityOS data.</p></div><button className="btn primary" onClick={exportCsv}><Download size={17}/> Export CSV</button></div>

    <section className="panel rwFilters">
      <label>Period<select value={range} onChange={event => setRange(event.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option><option value="all">All time</option></select></label>
      <label>Facility<select value={facilityId} onChange={event => setFacilityId(event.target.value)}><option value="all">All facilities</option>{(data.facilities || []).map(facility => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></label>
      <span>{report.workOrders.length} work orders in view</span>
    </section>

    <div className="rwMetricGrid">
      <Metric icon={ClipboardCheck} label="Completion" value={`${report.completion}%`} note={`${report.verified.length} verified services`} tone="blue"/>
      <Metric icon={ShieldCheck} label="Quality" value={`${report.avgQuality || 0}`} note={`${report.inspections.length} inspections`} tone="green"/>
      <Metric icon={AlertTriangle} label="Open issues" value={report.issues.filter(item => item.status !== 'closed').length} note={`${report.issues.length} reported in period`} tone="amber"/>
      <Metric icon={DollarSign} label="Collected" value={money(report.collected)} note={`${money(outstanding)} outstanding`} tone="violet"/>
    </div>

    <div className="rwTwoColumn">
      <section className="panel"><div className="panelTitle"><div><p className="eyebrow">Operations</p><h2>Facility performance</h2></div><Building2 size={20}/></div><div className="rwBars">{report.facilities.slice(0, 8).map(item => <BarRow key={item.id} label={item.name} value={item.orders} max={maxFacilityOrders} detail={`${item.completion}% complete · ${item.quality || '—'} quality`}/>)}{!report.facilities.length && <div className="rwEmpty">No facility activity in this period.</div>}</div></section>
      <section className="panel"><div className="panelTitle"><div><p className="eyebrow">Team</p><h2>Employee output</h2></div><UsersRound size={20}/></div><div className="rwBars">{report.employees.slice(0, 8).map(item => <BarRow key={item.id} label={item.name} value={item.completed} max={maxEmployeeOrders} detail={`${item.completion}% completion · ${item.orders} assigned`}/>)}{!report.employees.length && <div className="rwEmpty">No assigned employee activity in this period.</div>}</div></section>
    </div>

    <div className="rwFinanceGrid">
      <article><span>Invoiced</span><strong>{money(report.invoiced)}</strong></article><article><span>Collected</span><strong>{money(report.collected)}</strong></article><article><span>Expenses + payroll</span><strong>{money(report.cost)}</strong></article><article className={margin < 0 ? 'negative' : ''}><span>Operating margin</span><strong>{money(margin)}</strong></article>
    </div>

    <section className="panel rwRecent"><div className="panelTitle"><div><p className="eyebrow">Proof of service</p><h2>Recent verified services</h2></div><CheckCircle2 size={20}/></div><div className="rwTable"><div className="rwTableHead"><span>Date</span><span>Facility</span><span>Employee</span><span>Status</span><span>Score</span></div>{report.verified.slice().sort((a, b) => String(b.scheduled_date).localeCompare(String(a.scheduled_date))).slice(0, 12).map(order => { const facility = (data.facilities || []).find(item => item.id === order.facility_id); const employee = (data.people || []).find(item => item.id === order.assigned_to_profile_id); return <div className="rwTableRow" key={order.id}><span>{order.scheduled_date || '—'}</span><strong>{facility?.name || order.title}</strong><span>{employee?.full_name || 'Unassigned'}</span><span className={`status ${order.status}`}>{String(order.status).replaceAll('_', ' ')}</span><b>{order.quality_score || '—'}</b></div>; })}{!report.verified.length && <div className="rwEmpty">Verified services will appear here.</div>}</div></section>
  </div>;
}
