import { useEffect, useMemo, useState } from 'react';
import { Archive, Copy, FileText, RefreshCw, Search, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import './PricingEstimatesWorkspace.css';

const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0);
const frequencyLabel = { daily: 'Daily', three: '3× / week', weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' };

export function PricingEstimatesWorkspace({ open, onClose, onNewEstimate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');

  async function load() {
    if (!supabase) return;
    setLoading(true);
    setMessage('');
    const { data, error } = await supabase
      .from('pricing_estimates')
      .select('*, customers(name), facilities(name)')
      .order('updated_at', { ascending: false });
    setLoading(false);
    if (error) return setMessage(error.message);
    setRows(data || []);
  }

  useEffect(() => { if (open) load(); }, [open]);

  const filtered = useMemo(() => rows.filter((row) => {
    if (status === 'active' && row.status === 'archived') return false;
    if (status !== 'all' && status !== 'active' && row.status !== status) return false;
    const haystack = [row.prospect_name, row.customers?.name, row.facilities?.name, row.facility_type, row.notes].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(search.toLowerCase());
  }), [rows, search, status]);

  async function archive(row) {
    const next = row.status === 'archived' ? 'draft' : 'archived';
    const { error } = await supabase.from('pricing_estimates').update({ status: next, updated_at: new Date().toISOString() }).eq('id', row.id);
    if (error) return setMessage(error.message);
    setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: next } : item));
  }

  async function duplicate(row) {
    const { id, quote_id, created_at, updated_at, customers, facilities, ...copy } = row;
    const { data, error } = await supabase.from('pricing_estimates').insert({
      ...copy,
      prospect_name: `${row.prospect_name || row.facilities?.name || row.customers?.name || 'Estimate'} — Copy`,
      status: 'draft',
      quote_id: null,
    }).select('*, customers(name), facilities(name)').single();
    if (error) return setMessage(error.message);
    setRows((current) => [data, ...current]);
    setMessage('Estimate duplicated.');
  }

  async function createQuote(row) {
    if (row.quote_id) return setMessage('This estimate is already linked to a quote.');
    const quoteNumber = `Q-${Date.now().toString().slice(-6)}`;
    const name = row.facilities?.name || row.customers?.name || row.prospect_name || row.facility_type;
    const notes = [
      `Generated from Pricing Intelligence estimate ${row.id}.`,
      `${frequencyLabel[row.service_frequency] || row.service_frequency} service at ${money(row.recommended_price)} per visit (${money(row.estimated_monthly_revenue)} estimated monthly).`,
      `${Number(row.estimated_hours).toFixed(1)} estimated labor hours, ${row.suggested_crew} cleaner${row.suggested_crew === 1 ? '' : 's'}, ${row.confidence_score}% confidence.`,
      row.notes,
    ].filter(Boolean).join('\n');
    const { data: quote, error } = await supabase.from('quotes').insert({
      company_id: row.company_id,
      customer_id: row.customer_id,
      facility_id: row.facility_id,
      quote_number: quoteNumber,
      title: `Recurring cleaning — ${name}`,
      amount: Number(row.estimated_monthly_revenue),
      recurring_amount: Number(row.estimated_monthly_revenue),
      frequency: row.service_frequency,
      status: 'draft',
      notes,
    }).select().single();
    if (error) return setMessage(error.message);
    await supabase.from('pricing_estimates').update({ quote_id: quote.id, status: 'quoted', updated_at: new Date().toISOString() }).eq('id', row.id);
    setRows((current) => current.map((item) => item.id === row.id ? { ...item, quote_id: quote.id, status: 'quoted' } : item));
    setMessage(`Quote ${quoteNumber} created.`);
  }

  if (!open) return null;

  return <div className="pewBackdrop"><section className="pewShell">
    <header>
      <div><span>Pricing Intelligence</span><h2>Saved estimates</h2><p>Review pricing, duplicate scenarios and turn approved estimates into quotes.</p></div>
      <button type="button" className="pewIconButton" onClick={onClose}><X size={20} /></button>
    </header>
    <div className="pewToolbar">
      <label><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, facility or estimate" /></label>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="active">Active</option><option value="draft">Draft</option><option value="quoted">Quoted</option><option value="archived">Archived</option><option value="all">All</option>
      </select>
      <button type="button" className="pewSecondary" onClick={load}><RefreshCw size={16} /> Refresh</button>
      <button type="button" className="pewPrimary" onClick={onNewEstimate}>New estimate</button>
    </div>
    {message && <div className="pewMessage">{message}</div>}
    <div className="pewList">
      {loading ? <div className="pewEmpty">Loading estimates…</div> : filtered.length === 0 ? <div className="pewEmpty">No estimates match this view.</div> : filtered.map((row) => <article key={row.id} className="pewCard">
        <div className="pewCardMain">
          <div className="pewTitleRow"><h3>{row.facilities?.name || row.customers?.name || row.prospect_name || 'Untitled estimate'}</h3><span className={`pewStatus ${row.status}`}>{row.status}</span></div>
          <p>{row.facility_type} · {frequencyLabel[row.service_frequency] || row.service_frequency} · {Number(row.approximate_sqft || 0).toLocaleString()} sq ft</p>
          <div className="pewMetrics"><div><span>Recommended</span><strong>{money(row.recommended_price)} / visit</strong></div><div><span>Monthly</span><strong>{money(row.estimated_monthly_revenue)}</strong></div><div><span>Labor</span><strong>{Number(row.estimated_hours).toFixed(1)} hr</strong></div><div><span>Margin</span><strong>{Math.round(Number(row.estimated_margin))}%</strong></div></div>
        </div>
        <div className="pewActions">
          <button type="button" onClick={() => duplicate(row)}><Copy size={15} /> Duplicate</button>
          <button type="button" disabled={Boolean(row.quote_id)} onClick={() => createQuote(row)}><FileText size={15} /> {row.quote_id ? 'Quote created' : 'Create quote'}</button>
          <button type="button" onClick={() => archive(row)}><Archive size={15} /> {row.status === 'archived' ? 'Restore' : 'Archive'}</button>
        </div>
      </article>)}
    </div>
  </section></div>;
}
