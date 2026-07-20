import { useMemo, useState } from 'react';
import { Archive, Building2, ChevronLeft, CircleUserRound, FileText, Inbox, Mail, MapPin, MessageSquareText, Paperclip, Plus, Search, Send, Settings2, Sparkles, UsersRound, Wrench } from 'lucide-react';
import './CommunicationsCenter.css';

function buildThreads(data) {
  const customers=data.customers||[];
  const facilities=data.facilities||[];
  const issues=data.issues||[];
  const requests=data.requests||[];
  const orders=data.workOrders||[];
  const threads=[];

  customers.forEach((customer,index)=>{
    const customerFacilities=facilities.filter(f=>f.customer_id===customer.id);
    const openIssue=issues.find(i=>i.customer_id===customer.id&&i.status!=='closed');
    const request=requests.find(r=>r.customer_id===customer.id);
    const order=orders.find(w=>w.customer_id===customer.id&&w.status!=='archived');
    const facility=customerFacilities[0];
    threads.push({
      id:`customer-${customer.id}`,
      customer,
      facility,
      subject:openIssue?.title||request?.title||order?.title||'Service communication',
      preview:openIssue?`Open issue: ${openIssue.status}`:request?`Customer request: ${request.status}`:order?`Work order scheduled for ${order.scheduled_date||'upcoming service'}`:'Customer account ready for communication.',
      time:index===0?'Now':`${index+1}d`,
      unread:index<2,
      category:openIssue?'issues':'customers',
      linked:{issue:openIssue,request,order},
      messages:[
        {id:1,side:'in',author:customer.name,body:openIssue?.description||request?.description||'Please keep us updated about the next service visit.',time:'9:14 AM'},
        {id:2,side:'out',author:'FacilityOS Team',body:'Thank you. We have linked this conversation to the customer account and will follow up here.',time:'9:26 AM'}
      ]
    });
  });
  return threads;
}

export function CommunicationsCenter({data}) {
  const threads=useMemo(()=>buildThreads(data),[data]);
  const [selectedId,setSelectedId]=useState(threads[0]?.id||null);
  const [filter,setFilter]=useState('inbox');
  const [query,setQuery]=useState('');
  const [draft,setDraft]=useState('');
  const [mobileView,setMobileView]=useState('list');
  const [notice,setNotice]=useState('');
  const selected=threads.find(t=>t.id===selectedId)||threads[0];
  const visible=threads.filter(thread=>{
    const matches=!query||`${thread.customer?.name||''} ${thread.subject} ${thread.preview}`.toLowerCase().includes(query.toLowerCase());
    const filtered=filter==='inbox'||filter==='unread'&&thread.unread||filter==='customers'&&thread.category==='customers'||filter==='issues'&&thread.category==='issues';
    return matches&&filtered;
  });

  function openThread(thread){setSelectedId(thread.id);setMobileView('conversation');setNotice('')}
  function sendReply(){if(!draft.trim())return;setDraft('');setNotice('Reply saved locally. Email delivery will activate after a provider is connected.')}

  return <div className="page communicationsPage">
    <div className="pageHeader communicationsHeader"><div><p className="eyebrow">Customer experience</p><h1>Communications Center</h1><p>Manage customer conversations with operational context in one workspace.</p></div><button className="btn primary" type="button" onClick={()=>setNotice('Compose is ready. External delivery activates after Gmail or Microsoft 365 is connected.')}><Plus size={17}/> Compose</button></div>
    <div className="communicationsStatus"><span><Mail size={16}/> Email provider not connected</span><button type="button"><Settings2 size={15}/> Integration settings</button></div>

    <section className={`communicationsShell mobile-${mobileView}`}>
      <aside className="communicationFolders">
        <div className="folderTitle"><strong>Shared inbox</strong><span>{threads.filter(t=>t.unread).length} unread</span></div>
        {[['inbox','Inbox',Inbox],['unread','Unread',Mail],['customers','Customers',UsersRound],['issues','Issues',Wrench],['archive','Archived',Archive]].map(([key,label,Icon])=><button key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}><Icon size={17}/><span>{label}</span>{key==='unread'&&<b>{threads.filter(t=>t.unread).length}</b>}</button>)}
        <div className="aiCommunicationBox"><Sparkles size={18}/><strong>AI communication assistant</strong><span>Thread summaries and reply drafting will activate in a later phase.</span></div>
      </aside>

      <div className="threadColumn">
        <div className="threadSearch"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search conversations..."/></div>
        <div className="threadList">{visible.map(thread=><button key={thread.id} className={selected?.id===thread.id?'threadItem active':'threadItem'} onClick={()=>openThread(thread)}><div className="threadAvatar">{thread.customer?.name?.slice(0,1)||'C'}</div><div className="threadCopy"><div><strong>{thread.customer?.name||'Customer'}</strong><time>{thread.time}</time></div><b>{thread.subject}</b><span>{thread.preview}</span></div>{thread.unread&&<i/>}</button>)}{!visible.length&&<div className="communicationEmpty"><MessageSquareText size={28}/><strong>No conversations</strong><span>Customer-linked threads will appear here.</span></div>}</div>
      </div>

      <main className="conversationColumn">{selected?<>
        <header className="conversationHeader"><button className="mobileBack" onClick={()=>setMobileView('list')}><ChevronLeft size={20}/></button><div className="threadAvatar large">{selected.customer?.name?.slice(0,1)||'C'}</div><div><strong>{selected.customer?.name}</strong><span>{selected.subject}</span></div><button className="icon" type="button"><Archive size={18}/></button></header>
        <div className="messageTimeline">{selected.messages.map(message=><article key={message.id} className={`messageBubble ${message.side}`}><div><strong>{message.author}</strong><time>{message.time}</time></div><p>{message.body}</p></article>)}</div>
        <div className="replyComposer"><textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Write a reply..."/><div><button type="button" className="composerIcon"><Paperclip size={18}/></button><span>Linked to {selected.customer?.name}</span><button type="button" className="btn primary" onClick={sendReply}><Send size={16}/> Send</button></div>{notice&&<small>{notice}</small>}</div>
      </>:<div className="communicationEmpty centered"><Mail size={34}/><strong>Select a conversation</strong><span>Choose a customer thread to open its history.</span></div>}</main>

      <aside className="contextColumn">{selected&&<>
        <div className="contextHeader"><div className="threadAvatar large">{selected.customer?.name?.slice(0,1)||'C'}</div><h2>{selected.customer?.name}</h2><span>{selected.customer?.customer_type||'Customer account'}</span></div>
        <section><h3><CircleUserRound size={17}/> Contact</h3><p>{selected.customer?.email||'No primary email'}</p><p>{selected.customer?.phone||'No phone number'}</p></section>
        <section><h3><Building2 size={17}/> Facility</h3><strong>{selected.facility?.name||'No linked facility'}</strong><p><MapPin size={14}/>{selected.facility?.address||selected.customer?.address||'No address'}</p></section>
        <section><h3><FileText size={17}/> Linked records</h3><div className="contextLinks">{selected.linked.order&&<button><FileText size={15}/> {selected.linked.order.title}</button>}{selected.linked.issue&&<button><Wrench size={15}/> {selected.linked.issue.title}</button>}{selected.linked.request&&<button><MessageSquareText size={15}/> {selected.linked.request.title}</button>}{!selected.linked.order&&!selected.linked.issue&&!selected.linked.request&&<span>No linked operational records.</span>}</div></section>
      </>}</aside>
    </section>
  </div>;
}
