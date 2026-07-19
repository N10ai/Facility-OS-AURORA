import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Clock3, FileText, Receipt, WalletCards } from 'lucide-react';
import './CustomerFinance.css';

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

function dateLabel(value) {
  if (!value) return 'Not set';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function EmptyFinance({ title, text }) {
  return <div className="cfEmpty"><FileText size={26}/><strong>{title}</strong><span>{text}</span></div>;
}

export function CustomerFinance({ profile, data }) {
  const [tab, setTab] = useState('invoices');
  const [expanded, setExpanded] = useState(null);
  const invoices = useMemo(() => data.invoices.filter(item => item.customer_id === profile.customer_id), [data.invoices, profile.customer_id]);
  const quotes = useMemo(() => data.quotes.filter(item => item.customer_id === profile.customer_id), [data.quotes, profile.customer_id]);
  const payments = useMemo(() => data.payments.filter(item => item.customer_id === profile.customer_id), [data.payments, profile.customer_id]);
  const openInvoices = invoices.filter(item => !['paid', 'void', 'cancelled'].includes(item.status));
  const outstanding = openInvoices.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const paid = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const pendingQuotes = quotes.filter(item => ['sent', 'draft', 'pending'].includes(item.status));
  const rows = tab === 'invoices' ? invoices : tab === 'quotes' ? quotes : payments;

  return <div className="page cfPage">
    <div className="pageHeader">
      <div><p className="eyebrow">Customer portal</p><h1>Billing & documents</h1><p>Review service quotes, invoices, payment history, and items that need attention.</p></div>
    </div>

    <section className="cfHero">
      <div><span>Current balance</span><strong>{money(outstanding)}</strong><small>{openInvoices.length} open invoice{openInvoices.length === 1 ? '' : 's'}</small></div>
      <div className="cfHeroFacts">
        <span><CheckCircle2 size={17}/><b>{money(paid)}</b> recorded payments</span>
        <span><Clock3 size={17}/><b>{pendingQuotes.length}</b> quote{pendingQuotes.length === 1 ? '' : 's'} awaiting action</span>
      </div>
    </section>

    <div className="cfStats">
      <article><Receipt size={19}/><div><strong>{invoices.length}</strong><span>Total invoices</span></div></article>
      <article><FileText size={19}/><div><strong>{quotes.length}</strong><span>Quotes</span></div></article>
      <article><WalletCards size={19}/><div><strong>{payments.length}</strong><span>Payments</span></div></article>
    </div>

    <section className="panel cfPanel">
      <div className="cfTabs">
        <button className={tab === 'invoices' ? 'active' : ''} onClick={() => setTab('invoices')}>Invoices</button>
        <button className={tab === 'quotes' ? 'active' : ''} onClick={() => setTab('quotes')}>Quotes</button>
        <button className={tab === 'payments' ? 'active' : ''} onClick={() => setTab('payments')}>Payments</button>
      </div>

      <div className="cfRows">
        {rows.map(item => {
          const isPayment = tab === 'payments';
          const number = isPayment ? `Payment ${item.payment_date || ''}` : tab === 'quotes' ? item.quote_number || 'Quote' : item.invoice_number || 'Invoice';
          const subtitle = isPayment ? `${dateLabel(item.payment_date)} · ${item.method || 'Payment'}` : tab === 'quotes' ? `Valid until ${dateLabel(item.valid_until)}` : `Due ${dateLabel(item.due_date)}`;
          return <article className="cfRow" key={item.id}>
            <button className="cfRowMain" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
              <div className={`cfDocIcon ${isPayment ? 'payment' : ''}`}>{isPayment ? <WalletCards size={19}/> : tab === 'quotes' ? <FileText size={19}/> : <Receipt size={19}/>}</div>
              <div><strong>{number}</strong><span>{subtitle}</span></div>
              <b>{money(item.amount)}</b>
              <em className={`status ${item.status || 'completed'}`}>{String(item.status || 'completed').replaceAll('_', ' ')}</em>
              <ChevronDown className={expanded === item.id ? 'open' : ''} size={18}/>
            </button>
            {expanded === item.id && <div className="cfDetails">
              <div><span>Description</span><strong>{item.title || item.notes || (isPayment ? 'Payment received' : 'Cleaning services')}</strong></div>
              {!isPayment && <div><span>Document amount</span><strong>{money(item.amount)}</strong></div>}
              <p>{item.notes || (isPayment ? 'This payment has been recorded on your account.' : 'Contact your service manager with any questions about this document.')}</p>
            </div>}
          </article>;
        })}
        {!rows.length && <EmptyFinance title={`No ${tab} yet`} text={`Your ${tab} will appear here when they are created.`}/>} 
      </div>
    </section>
  </div>;
}
