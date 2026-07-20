import { useMemo, useState } from 'react';
import {
  Bell, CheckCircle2, ChevronRight, Clock3, FileText, Mail, MessageSquareText,
  Phone, Plus, Receipt, Search, Send, Sparkles, UserRound, Wrench
} from 'lucide-react';
import './CommunicationHub.css';

const templates = [
  {
    id: 'service-complete',
    label: 'Service completed',
    subject: 'Your cleaning service is complete',
    body: 'Hello,\n\nYour scheduled cleaning service has been completed. Your service report and verification photos are available in the FacilityOS customer portal.\n\nThank you.'
  },
  {
    id: 'invoice-ready',
    label: 'Invoice ready',
    subject: 'Your FacilityOS invoice is ready',
    body: 'Hello,\n\nYour latest invoice is ready for review. Please sign in to your customer portal to view the invoice and payment details.\n\nThank you.'
  },
  {
    id: 'visit-reminder',
    label: 'Visit reminder',
    subject: 'Upcoming cleaning service reminder',
    body: 'Hello,\n\nThis is a reminder of your upcoming cleaning service. Please reply with any access notes or special instructions for our team.\n\nThank you.'
  },
  {
    id: 'issue-followup',
    label: 'Issue follow-up',
    subject: 'Follow-up on your facility request',
    body: 'Hello,\n\nWe are following up regarding your recent facility request. Our team is reviewing it and will keep you updated through FacilityOS.\n\nThank you.'
  }
];

function formatDate(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function buildTimeline(data) {
  return [
    ...(data.requests || []).map(item => ({
      id: `request-${item.id}`, type: 'request', icon: Wrench, customerId: item.customer_id,
      title: item.title || 'Customer request', detail: item.description || `Request status: ${item.status}`,
      date: item.created_at, status: item.status
    })),
    ...(data.issues || []).map(item => ({
      id: `issue-${item.id}`, type: 'issue', icon: MessageSquareText, customerId: item.customer_id,
      title: item.title || 'Facility issue', detail: item.description || `Issue status: ${item.status}`,
      date: item.created_at, status: item.status
    })),
    ...(data.quotes || []).map(item => ({
      id: `quote-${item.id}`, type: 'quote', icon: FileText, customerId: item.customer_id,
      title: item.quote_number || item.title || 'Quote', detail: `Quote · ${item.status || 'draft'} · $${Number(item.amount || 0).toLocaleString()}`,
      date: item.created_at, status: item.status
    })),
    ...(data.invoices || []).map(item => ({
      id: `invoice-${item.id}`, type: 'invoice', icon: Receipt, customerId: item.customer_id,
      title: item.invoice_number || 'Invoice', detail: `Invoice · ${item.status || 'draft'} · $${Number(item.amount || 0).toLocaleString()}`,
      date: item.created_at, status: item.status
    })),
    ...(data.workOrders || []).map(item => ({
      id: `work-${item.id}`, type: 'work', icon: CheckCircle2, customerId: item.customer_id,
      title: item.title || 'Work order', detail: `Work order · ${item.status || 'scheduled'}`,
      date: item.updated_at || item.created_at || item.scheduled_date, status: item.status
    }))
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

export function CommunicationHub({ data, initialCustomerId = null }) {
  const customers = data.customers || [];
  const [query, setQuery] = useState('');
  const [customerId, setCustomerId] = useState(initialCustomerId || '');
  const [templateId, setTemplateId] = useState(templates[0].id);
  const selectedTemplate = templates.find(template => template.id === templateId) || templates[0];
  const [subject, setSubject] = useState(selectedTemplate.subject);
  const [body, setBody] = useState(selectedTemplate.body);
  const [composeOpen, setComposeOpen] = useState(false);

  const timeline = useMemo(() => buildTimeline(data), [data]);
  const filtered = timeline.filter(item => {
    const customer = customers.find(entry => entry.id === item.customerId);
    const text = `${item.title} ${item.detail} ${customer?.name || ''}`.toLowerCase();
    return (!customerId || item.customerId === customerId) && text.includes(query.toLowerCase());
  });
  const selectedCustomer = customers.find(entry => entry.id === customerId);
  const pending = timeline.filter(item => !['completed', 'verified', 'paid', 'closed', 'accepted'].includes(item.status)).length;

  function useTemplate(id) {
    const template = templates.find(entry => entry.id === id) || templates[0];
    setTemplateId(id);
    setSubject(template.subject);
    setBody(template.body);
  }

  function openEmail() {
    const recipient = selectedCustomer?.email || '';
    const href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  return <div className="page communicationHub">
    <section className="communicationHero">
      <div>
        <p className="eyebrow">Aurora communication center</p>
        <h1>Every customer conversation in one place.</h1>
        <p>Review service activity, prepare professional messages, and open Gmail or the phone’s email app with the customer and message already filled in.</p>
      </div>
      <button className="communicationCompose" onClick={() => setComposeOpen(true)}><Plus size={18}/> New message</button>
    </section>

    <div className="communicationStats">
      <article><span><MessageSquareText size={18}/> Activity</span><strong>{timeline.length}</strong><small>Connected customer events</small></article>
      <article><span><Clock3 size={18}/> Needs attention</span><strong>{pending}</strong><small>Open operational records</small></article>
      <article><span><UserRound size={18}/> Customers</span><strong>{customers.length}</strong><small>Available recipients</small></article>
    </div>

    <div className="communicationLayout">
      <section className="communicationFeed">
        <div className="communicationToolbar">
          <div><p className="eyebrow">Unified timeline</p><h2>Customer activity</h2></div>
          <div className="communicationFilters">
            <label className="communicationSearch"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search activity"/></label>
            <select value={customerId} onChange={event => setCustomerId(event.target.value)}>
              <option value="">All customers</option>
              {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </div>
        </div>
        <div className="communicationRows">
          {filtered.slice(0, 30).map(item => {
            const Icon = item.icon;
            const customer = customers.find(entry => entry.id === item.customerId);
            return <button key={item.id} className="communicationRow" onClick={() => { setCustomerId(item.customerId || ''); setComposeOpen(true); }}>
              <div className={`communicationEventIcon ${item.type}`}><Icon size={18}/></div>
              <div className="communicationRowMain"><strong>{item.title}</strong><span>{customer?.name || 'Internal'} · {item.detail}</span><small>{formatDate(item.date)}</small></div>
              <ChevronRight size={17}/>
            </button>;
          })}
          {!filtered.length && <div className="communicationEmpty"><Sparkles size={24}/><strong>No activity found</strong><span>New customer activity will appear here automatically.</span></div>}
        </div>
      </section>

      <aside className="communicationQuickPanel">
        <div><p className="eyebrow">Fast actions</p><h2>Mobile management</h2></div>
        <button onClick={() => setComposeOpen(true)}><span className="quickIcon"><Mail size={18}/></span><span><strong>Email customer</strong><small>Open a prepared message</small></span><ChevronRight size={17}/></button>
        {selectedCustomer?.phone && <a href={`tel:${selectedCustomer.phone}`}><span className="quickIcon"><Phone size={18}/></span><span><strong>Call {selectedCustomer.name}</strong><small>{selectedCustomer.phone}</small></span><ChevronRight size={17}/></a>}
        <div className="communicationTemplateList">
          <span>Templates</span>
          {templates.map(template => <button key={template.id} onClick={() => { useTemplate(template.id); setComposeOpen(true); }}><span>{template.label}</span><Send size={15}/></button>)}
        </div>
      </aside>
    </div>

    {composeOpen && <div className="communicationComposerBackdrop" onClick={() => setComposeOpen(false)}>
      <section className="communicationComposer" onClick={event => event.stopPropagation()}>
        <div className="composerHandle"/>
        <div className="composerHeader"><div><p className="eyebrow">Compose</p><h2>Prepare customer email</h2></div><button onClick={() => setComposeOpen(false)}>Done</button></div>
        <label>Customer<select value={customerId} onChange={event => setCustomerId(event.target.value)}><option value="">Choose customer</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        <label>Template<select value={templateId} onChange={event => useTemplate(event.target.value)}>{templates.map(template => <option key={template.id} value={template.id}>{template.label}</option>)}</select></label>
        <label>Subject<input value={subject} onChange={event => setSubject(event.target.value)}/></label>
        <label>Message<textarea value={body} onChange={event => setBody(event.target.value)}/></label>
        <button className="sendWithGmail" disabled={!selectedCustomer?.email} onClick={openEmail}><Mail size={18}/> Open in Gmail / Mail</button>
        {!selectedCustomer?.email && <div className="composerNotice"><Bell size={16}/> Select a customer with an email address.</div>}
      </section>
    </div>}
  </div>;
}
