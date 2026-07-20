import { BarChart3, CheckCircle2, Clock, DollarSign, Download, ShieldCheck, UsersRound } from 'lucide-react';
import './ReportsWorkspace.css';

function Metric({ icon: Icon, label, value, note }) {
  return <article className="reportMetric"><Icon size={20}/><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

export function ReportsWorkspace({ data }) {
  const orders=(data.workOrders||[]).filter(row=>row.status!=='archived');
  const completed=orders.filter(row=>['verified','completed'].includes(row.status));
  const awaiting=orders.filter(row=>row.status==='awaiting_verification');
  const openIssues=(data.issues||[]).filter(row=>row.status!=='closed');
  const revenue=(data.payments||[]).reduce((sum,row)=>sum+Number(row.amount||0),0);
  const payroll=(data.payroll||[]).reduce((sum,row)=>sum+Number(row.gross_pay||0),0);
  const rate=orders.length?Math.round(completed.length/orders.length*100):0;
  const customers=(data.customers||[]).map(customer=>{
    const rows=orders.filter(order=>order.customer_id===customer.id);
    const done=rows.filter(order=>['verified','completed'].includes(order.status)).length;
    return {...customer,orders:rows.length,done,rate:rows.length?Math.round(done/rows.length*100):0};
  }).sort((a,b)=>b.orders-a.orders).slice(0,8);

  return <div className="page reportsWorkspace">
    <div className="pageHeader reportsHeader"><div><p className="eyebrow">Business intelligence</p><h1>Reports</h1><p>Operations, quality, customer, and financial performance.</p></div><button className="btn secondary" type="button" onClick={()=>window.print()}><Download size={17}/> Export</button></div>
    <section className="reportMetrics">
      <Metric icon={CheckCircle2} label="Completion rate" value={`${rate}%`} note={`${completed.length} of ${orders.length} work orders`}/>
      <Metric icon={ShieldCheck} label="Quality review" value={awaiting.length} note="Awaiting verification"/>
      <Metric icon={UsersRound} label="Active customers" value={(data.customers||[]).length} note={`${(data.facilities||[]).length} facilities`}/>
      <Metric icon={DollarSign} label="Net recorded" value={`$${Math.max(0,revenue-payroll).toLocaleString()}`} note={`$${revenue.toLocaleString()} received`}/>
    </section>
    <div className="reportsMainGrid">
      <section className="panel reportPanel"><div className="panelTitle"><h2>Work-order status</h2><BarChart3 size={20}/></div>{[['Completed',completed.length],['In progress',orders.filter(o=>o.status==='in_progress').length],['Scheduled',orders.filter(o=>o.status==='scheduled').length],['Review',awaiting.length]].map(([label,value])=><div className="statusBarRow" key={label}><div><span>{label}</span><strong>{value}</strong></div><div className="statusBarTrack"><i style={{width:`${orders.length?Math.max(4,Math.round(value/orders.length*100)):0}%`}}/></div></div>)}</section>
      <section className="panel reportPanel"><div className="panelTitle"><h2>Operational exceptions</h2><Clock size={20}/></div><div className="reportExceptionGrid"><div><strong>{awaiting.length}</strong><span>Awaiting review</span></div><div><strong>{openIssues.length}</strong><span>Open issues</span></div><div><strong>{(data.people||[]).filter(p=>p.role==='employee').length}</strong><span>Employees</span></div><div><strong>${payroll.toLocaleString()}</strong><span>Payroll</span></div></div></section>
    </div>
    <section className="panel reportPanel"><div className="panelTitle"><h2>Customer performance</h2></div><div className="responsiveReportTable"><div className="reportTableHead"><span>Customer</span><span>Orders</span><span>Completed</span><span>Rate</span></div>{customers.map(customer=><div className="reportTableRow" key={customer.id}><strong data-label="Customer">{customer.name}</strong><span data-label="Orders">{customer.orders}</span><span data-label="Completed">{customer.done}</span><span data-label="Rate">{customer.rate}%</span></div>)}{!customers.length&&<div className="reportEmpty">Customer performance will appear after work orders are created.</div>}</div></section>
  </div>;
}
