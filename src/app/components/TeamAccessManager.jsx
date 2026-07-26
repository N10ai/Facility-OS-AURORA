import { useMemo, useState } from 'react';
import { Check, Copy, Link2, Plus, RefreshCw, Shield, UserCog, UserMinus, X } from 'lucide-react';
import { supabase } from '../../services/supabase';

const blankInvite={full_name:'',email:'',phone:'',role:'employee',customer_id:''};
const roles=['employee','manager','supervisor','admin','customer','contractor'];

export function TeamAccessManager({profile,data,reload}){
  const [inviteOpen,setInviteOpen]=useState(false);
  const [invite,setInvite]=useState(blankInvite);
  const [inviteLink,setInviteLink]=useState('');
  const [editing,setEditing]=useState(null);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const people=useMemo(()=>[...data.people].sort((a,b)=>(a.full_name||'').localeCompare(b.full_name||'')),[data.people]);
  const pending=data.invites.filter(i=>i.status==='pending');

  async function createInvite(){
    if(!invite.full_name.trim()||!invite.email.trim())return setMessage('Name and email are required.');
    if(invite.role==='customer'&&!invite.customer_id)return setMessage('Choose the customer account this user can access.');
    setBusy(true);setMessage('');
    const token=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
    const expires=new Date();expires.setDate(expires.getDate()+7);
    const {data:row,error}=await supabase.from('portal_invites').insert({company_id:profile.company_id,customer_id:invite.role==='customer'?invite.customer_id:null,email:invite.email.trim().toLowerCase(),full_name:invite.full_name.trim(),role:invite.role,phone:invite.phone||null,token,expires_at:expires.toISOString(),status:'pending'}).select().single();
    setBusy(false);if(error)return setMessage(error.message);
    const link=`${window.location.origin}${window.location.pathname}?invite=${row.token}`;
    setInviteLink(link);await reload();
  }

  async function copy(text){await navigator.clipboard.writeText(text);setMessage('Invitation link copied.');}
  async function revoke(row){if(!confirm(`Revoke invitation for ${row.email}?`))return;const{error}=await supabase.from('portal_invites').update({status:'revoked'}).eq('id',row.id);if(error)return setMessage(error.message);await reload();}
  async function saveUser(){
    if(!editing)return;
    if(editing.role==='customer'&&!editing.customer_id)return setMessage('Choose a customer account for customer access.');
    setBusy(true);setMessage('');
    const {error}=await supabase.rpc('manage_company_user',{p_profile_id:editing.id,p_role:editing.role,p_status:editing.status,p_customer_id:editing.role==='customer'?editing.customer_id:null});
    setBusy(false);if(error)return setMessage(error.message);
    setEditing(null);setMessage('User access updated.');await reload();
  }
  async function deactivate(person){
    if(!confirm(`Remove app access for ${person.full_name||'this user'}? Scheduled jobs assigned to this person will become unassigned.`))return;
    setBusy(true);const{error}=await supabase.rpc('manage_company_user',{p_profile_id:person.id,p_role:person.role,p_status:'inactive',p_customer_id:person.role==='customer'?person.customer_id:null});setBusy(false);
    if(error)return setMessage(error.message);setMessage('User access removed.');await reload();
  }

  return <div className="page">
    <div className="pageHeader"><div><p className="eyebrow">Owner control</p><h1>Users, roles & access</h1><p>Invite employees and customers, change roles, connect customer portals, deactivate access, and restore users from one place.</p></div><button className="btn primary" onClick={()=>{setInvite(blankInvite);setInviteLink('');setMessage('');setInviteOpen(true)}}><Plus size={17}/> Invite user</button></div>
    {message&&<div className="notice">{message}</div>}
    <section className="panel"><div className="panelTitle"><div><h2>Active and inactive users</h2><p>Role changes take effect the next time the user opens or refreshes FacilityOS.</p></div><Shield size={20}/></div>
      <div className="accessTable">{people.map(person=>{const customer=data.customers.find(c=>c.id===person.customer_id);return <div className="personRow" key={person.id}><div className="avatar">{person.full_name?.slice(0,1)||'U'}</div><div className="grow"><strong>{person.full_name||person.id}</strong><span>{person.role}{customer?` · ${customer.name}`:''} · {person.status||'active'}</span></div><div className="rowActions"><button onClick={()=>setEditing({...person,status:person.status||'active'})}><UserCog size={16}/> Manage</button>{person.id!==profile.id&&person.status!=='inactive'&&<button className="dangerText" onClick={()=>deactivate(person)}><UserMinus size={16}/> Remove access</button>}</div></div>})}</div>
    </section>
    <section className="panel"><div className="panelTitle"><div><h2>Pending invitations</h2><p>Invitation links expire after seven days.</p></div><Link2 size={20}/></div>{pending.map(row=>{const link=`${window.location.origin}${window.location.pathname}?invite=${row.token}`;return <div className="personRow" key={row.id}><div className="avatar">{row.full_name?.slice(0,1)||'I'}</div><div className="grow"><strong>{row.full_name}</strong><span>{row.email} · {row.role} · expires {new Date(row.expires_at).toLocaleDateString()}</span></div><div className="rowActions"><button onClick={()=>copy(link)}><Copy size={16}/> Copy</button><button className="dangerText" onClick={()=>revoke(row)}><X size={16}/> Revoke</button></div></div>})}{!pending.length&&<p>No pending invitations.</p>}</section>

    {inviteOpen&&<div className="modalBackdrop"><section className="modal"><button className="icon close" onClick={()=>setInviteOpen(false)}><X size={18}/></button><h2>Invite user</h2><div className="form"><label>Full name<input value={invite.full_name} onChange={e=>setInvite({...invite,full_name:e.target.value})}/></label><div className="form2"><label>Email<input type="email" value={invite.email} onChange={e=>setInvite({...invite,email:e.target.value})}/></label><label>Phone<input value={invite.phone} onChange={e=>setInvite({...invite,phone:e.target.value})}/></label></div><label>Role<select value={invite.role} onChange={e=>setInvite({...invite,role:e.target.value,customer_id:''})}>{roles.map(role=><option key={role} value={role}>{role}</option>)}</select></label>{invite.role==='customer'&&<label>Customer account<select value={invite.customer_id} onChange={e=>setInvite({...invite,customer_id:e.target.value})}><option value="">Select...</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}{!inviteLink?<button className="btn primary" disabled={busy} onClick={createInvite}>{busy?<RefreshCw size={16}/>:<Plus size={16}/>} Create invitation</button>:<div className="inviteResult"><strong>Invitation ready</strong><input readOnly value={inviteLink}/><button className="btn primary" onClick={()=>copy(inviteLink)}><Copy size={16}/> Copy invitation link</button></div>}</div></section></div>}

    {editing&&<div className="modalBackdrop"><section className="modal"><button className="icon close" onClick={()=>setEditing(null)}><X size={18}/></button><h2>Manage {editing.full_name}</h2><div className="form"><label>Role<select value={editing.role} onChange={e=>setEditing({...editing,role:e.target.value,customer_id:e.target.value==='customer'?editing.customer_id:null})}>{roles.concat(editing.role==='owner'?['owner']:[]).map(role=><option key={role} value={role}>{role}</option>)}</select></label>{editing.role==='customer'&&<label>Customer account<select value={editing.customer_id||''} onChange={e=>setEditing({...editing,customer_id:e.target.value})}><option value="">Select...</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}<label>Access status<select value={editing.status||'active'} onChange={e=>setEditing({...editing,status:e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label><p className="customerMuted">Inactive users cannot use the app. Their authentication account remains preserved so access can be restored later.</p><button className="btn primary" disabled={busy} onClick={saveUser}><Check size={16}/> Save access</button></div></section></div>}
  </div>;
}
