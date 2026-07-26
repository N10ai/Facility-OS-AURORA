import fs from 'node:fs';

const appFile='src/app/App.jsx';
const apiFile='src/services/api.js';
let app=fs.readFileSync(appFile,'utf8');
let api=fs.readFileSync(apiFile,'utf8');

if(!api.includes('export async function adminCreateUser')){
  api += `\nexport async function adminCreateUser(payload){\n  return supabase.rpc('admin_create_user',payload);\n}\n\nexport async function adminUpdateUser(userId,payload){\n  return supabase.rpc('admin_update_user',{p_user_id:userId,...payload});\n}\n\nexport async function adminSetUserStatus(userId,status){\n  return supabase.rpc('admin_set_user_status',{p_user_id:userId,p_status:status});\n}\n`;
}

app=app.replace(
  'completeInspection, createInspection, updateInspectionArea, updateInspectionItem, uploadInspectionPhoto',
  'completeInspection, createInspection, updateInspectionArea, updateInspectionItem, uploadInspectionPhoto, adminCreateUser, adminUpdateUser, adminSetUserStatus'
);

app=app.replace("items:[['employees','Employees',CircleUserRound],['contractors','Contractors',Wrench]]","items:[['employees','Users & Access',CircleUserRound],['contractors','Contractors',Wrench]]");

const start=app.indexOf('function EmployeesPage(');
const end=app.indexOf('\n\nfunction WorkOrdersPage',start);
if(start!==-1&&end!==-1){
  const replacement=`function EmployeesPage({data,companyId,reload}) {
  const blank={full_name:'',email:'',phone:'',temporary_password:'',role:'employee',customer_id:'',status:'active'};
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(blank);
  const [message,setMessage]=useState('');
  const [filter,setFilter]=useState('active');
  const roles=['owner','admin','manager','supervisor','employee','contractor','customer'];
  const visible=data.people.filter(p=>filter==='all'||(p.status||'active')===filter);

  function openCreate(){setEditing(null);setForm(blank);setMessage('');setOpen(true)}
  function openEdit(user){setEditing(user);setForm({full_name:user.full_name||'',email:user.email||'',phone:user.phone||'',temporary_password:'',role:user.role||'employee',customer_id:user.customer_id||'',status:user.status||'active'});setMessage('');setOpen(true)}

  async function save(){
    if(!form.full_name||!form.email)return setMessage('Full name and email are required.');
    if(!editing&&!form.temporary_password)return setMessage('Add a temporary password.');
    const payload={p_company_id:companyId,p_full_name:form.full_name,p_email:form.email,p_phone:form.phone||null,p_role:form.role,p_customer_id:form.role==='customer'?(form.customer_id||null):null,p_temporary_password:form.temporary_password||null};
    const result=editing?await adminUpdateUser(editing.id,payload):await adminCreateUser(payload);
    if(result.error)return setMessage(result.error.message);
    setOpen(false);await reload();
  }

  async function setStatus(user,status){
    if(user.role==='owner'&&status!=='active')return setMessage('The owner account cannot be disabled.');
    const {error}=await adminSetUserStatus(user.id,status);
    if(error)return setMessage(error.message);
    await reload();
  }

  return <div className="page">
    <div className="pageHeader"><div><p className="eyebrow">Owner control</p><h1>Users & Access</h1><p>Create users directly, set roles, change access, and keep history without invitation links.</p></div><Button onClick={openCreate}><Plus size={16}/> New user</Button></div>
    {message&&<div className="notice">{message}</div>}
    <section className="workOrderToolbar"><div className="segmented compact">{['active','inactive','all'].map(s=><button key={s} className={filter===s?'active':''} onClick={()=>setFilter(s)}>{s}</button>)}</div></section>
    <section className="panel">
      <div className="panelTitle"><h2>{filter==='all'?'All users':filter==='active'?'Active users':'Inactive users'}</h2><span>{visible.length}</span></div>
      {visible.map(user=><div className="personRow" key={user.id}>
        <div className="avatar">{user.full_name?.slice(0,1)||'U'}</div>
        <div className="grow"><strong>{user.full_name||user.email}</strong><span>{user.email||'No email'} · {user.role} · {user.phone||'No phone'}</span></div>
        <div className={\`status \${user.status||'active'}\`}>{user.status||'active'}</div>
        <div className="rowActions"><button onClick={()=>openEdit(user)}>Edit</button>{(user.status||'active')==='active'?<button className="dangerText" onClick={()=>setStatus(user,'inactive')}>Remove access</button>:<button onClick={()=>setStatus(user,'active')}>Restore</button>}</div>
      </div>)}
      {!visible.length&&<Empty title="No users" text="Create the first user from this workspace."/>}
    </section>
    <Modal open={open} title={editing?'Edit user':'Create user'} onClose={()=>setOpen(false)}><div className="form">
      <label>Full name<input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label>
      <div className="form2"><label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label></div>
      <div className="form2"><label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value,customer_id:e.target.value==='customer'?form.customer_id:''})}>{roles.map(role=><option key={role} value={role}>{role}</option>)}</select></label><label>Status<select value={form.status} disabled={!editing} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">active</option><option value="inactive">inactive</option></select></label></div>
      {form.role==='customer'&&<label>Customer account<select value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value})}><option value="">Select...</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
      <label>{editing?'New temporary password (optional)':'Temporary password'}<input type="password" value={form.temporary_password} onChange={e=>setForm({...form,temporary_password:e.target.value})}/><small>{editing?'Leave blank to keep the current password.':'The user can log in immediately with this password.'}</small></label>
      {message&&<div className="notice">{message}</div>}<Button onClick={save}>{editing?'Save changes':'Create user'}</Button>
    </div></Modal>
  </div>;
}`;
  app=app.slice(0,start)+replacement+app.slice(end);
}

fs.writeFileSync(appFile,app);
fs.writeFileSync(apiFile,api);
