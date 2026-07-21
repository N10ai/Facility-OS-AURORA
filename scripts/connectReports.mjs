import fs from 'node:fs';

const file = 'src/app/App.jsx';
let text = fs.readFileSync(file, 'utf8');

const reportsImport = "import { ReportsWorkspace } from './components/ReportsWorkspace';";
if (!text.includes(reportsImport)) {
  text = text.replace(
    "import { EmployeeWorkspace } from './components/EmployeeWorkspace';",
    "import { EmployeeWorkspace } from './components/EmployeeWorkspace';\n" + reportsImport
  );
}

const communicationsImport = "import { CommunicationsCenter } from './components/CommunicationsCenter';";
if (!text.includes(communicationsImport)) {
  text = text.replace(reportsImport, reportsImport + "\n" + communicationsImport);
}

const customer360Import = "import { Customer360 } from './components/Customer360';";
if (!text.includes(customer360Import)) {
  text = text.replace(communicationsImport, communicationsImport + "\n" + customer360Import);
}

text = text.replace(
  "else if(page==='reports') content=<ModulePlaceholder title=\"Reports\" description=\"Operations, proof-of-service, customer, financial, and employee performance reports.\"/>;",
  "else if(page==='reports') content=<ReportsWorkspace data={data}/>;"
);

text = text.replace(
  "{ label:'CRM', icon:UsersRound, items:[['customers','Customers',UsersRound],['contacts','Contacts',CircleUserRound],['quotes','Quotes',FileText],['facilities','Facilities',Building2]] },",
  "{ label:'CRM', icon:UsersRound, items:[['customers','Customers',UsersRound],['contacts','Contacts',CircleUserRound],['communications','Communications',Mail],['quotes','Quotes',FileText],['facilities','Facilities',Building2]] },"
);

if (!text.includes("else if(page==='communications') content=<CommunicationsCenter data={data}/>;")) {
  text = text.replace(
    "else if(page==='contacts') content=<ContactsPage data={data} companyId={profile.company_id} reload={reload}/>;",
    "else if(page==='contacts') content=<ContactsPage data={data} companyId={profile.company_id} reload={reload}/>;\n    else if(page==='communications') content=<CommunicationsCenter data={data}/>;"
  );
}

if (!text.includes('<Customer360 customer={customer}')) {
  const selectedWorkspace = /  if\(selected\)\{[\s\S]*?\n  \}\n\n  return <div className="page">/;
  const customer360Workspace = `  if(selected){
    const customer=data.customers.find(c=>c.id===selected.id)||selected;
    return <>
      <Customer360
        customer={customer}
        data={data}
        onBack={()=>setSelected(null)}
        onEdit={editCustomer}
        onNavigate={setPage}
        onArchive={archive}
      />
      <Modal open={open} title={editing?'Edit customer':'New customer'} onClose={()=>setOpen(false)}><div className="form">
        <label>Name<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <div className="form2"><label>Type<select value={form.customer_type||'commercial'} onChange={e=>setForm({...form,customer_type:e.target.value})}><option>commercial</option><option>logistics</option><option>medical</option><option>retail</option></select></label><label>Monthly value<input type="number" value={form.monthly_value||''} onChange={e=>setForm({...form,monthly_value:e.target.value})}/></label></div>
        <div className="form2"><label>Email<input value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Phone<input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></label></div>
        <label>Address<input value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></label>
        {message&&<div className="notice">{message}</div>}<Button onClick={save}>Save changes</Button>
      </div></Modal>
    </>;
  }

  return <div className="page">`;
  if (!selectedWorkspace.test(text)) throw new Error('Customer workspace integration marker not found.');
  text = text.replace(selectedWorkspace, customer360Workspace);
}

fs.writeFileSync(file, text);
