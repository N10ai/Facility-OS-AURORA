import { useEffect, useState } from 'react';
import { CalendarDays, Check, Circle, MessageSquarePlus, PhoneCall, Mail, UsersRound } from 'lucide-react';
import { supabase } from '../services/supabase';

const activityTypes = [
  ['note','Note',MessageSquarePlus],
  ['call','Call',PhoneCall],
  ['email','Email',Mail],
  ['meeting','Meeting',UsersRound]
];

function formatDate(value){
  if(!value) return '';
  return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value));
}

export function LeadEngagement({ lead, profile, onMessage }){
  const [activities,setActivities]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [activityType,setActivityType]=useState('note');
  const [activityBody,setActivityBody]=useState('');
  const [taskTitle,setTaskTitle]=useState('');
  const [taskDue,setTaskDue]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{ if(lead?.id) load(); },[lead?.id]);

  async function load(){
    const [activityResult,taskResult]=await Promise.all([
      supabase.from('lead_activities').select('*').eq('lead_id',lead.id).order('created_at',{ascending:false}),
      supabase.from('lead_tasks').select('*').eq('lead_id',lead.id).order('status').order('due_date',{ascending:true,nullsFirst:false})
    ]);
    if(activityResult.error) onMessage?.(activityResult.error.message);
    if(taskResult.error) onMessage?.(taskResult.error.message);
    setActivities(activityResult.data||[]);
    setTasks(taskResult.data||[]);
  }

  async function addActivity(){
    if(!activityBody.trim()) return;
    setBusy(true);
    const {error}=await supabase.from('lead_activities').insert({
      company_id:profile.company_id,
      lead_id:lead.id,
      created_by:profile.id,
      activity_type:activityType,
      body:activityBody.trim()
    });
    setBusy(false);
    if(error) return onMessage?.(error.message);
    setActivityBody('');
    await load();
  }

  async function addTask(){
    if(!taskTitle.trim()) return;
    setBusy(true);
    const {error}=await supabase.from('lead_tasks').insert({
      company_id:profile.company_id,
      lead_id:lead.id,
      assigned_to:profile.id,
      created_by:profile.id,
      title:taskTitle.trim(),
      due_date:taskDue||null
    });
    setBusy(false);
    if(error) return onMessage?.(error.message);
    setTaskTitle('');
    setTaskDue('');
    await load();
  }

  async function toggleTask(task){
    const completed=task.status!=='completed';
    const {error}=await supabase.from('lead_tasks').update({
      status:completed?'completed':'open',
      completed_at:completed?new Date().toISOString():null
    }).eq('id',task.id);
    if(error) return onMessage?.(error.message);
    await load();
  }

  return <div className="leadEngagementGrid">
    <section className="leadPanel">
      <div className="leadPanelHeading"><div><h3>Follow-up tasks</h3><span>Keep every next action visible.</span></div><CalendarDays size={19}/></div>
      <div className="leadTaskComposer">
        <input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="Add a follow-up task"/>
        <input type="date" value={taskDue} onChange={e=>setTaskDue(e.target.value)}/>
        <button className="leadPrimary" disabled={busy} onClick={addTask}>Add</button>
      </div>
      <div className="leadTaskList">
        {!tasks.length&&<p className="leadMuted">No follow-up tasks yet.</p>}
        {tasks.map(task=><button key={task.id} className={task.status==='completed'?'completed':''} onClick={()=>toggleTask(task)}>
          {task.status==='completed'?<Check size={17}/>:<Circle size={17}/>}<span><strong>{task.title}</strong><small>{task.due_date?`Due ${task.due_date}`:'No due date'}</small></span>
        </button>)}
      </div>
    </section>

    <section className="leadPanel">
      <div className="leadPanelHeading"><div><h3>Activity timeline</h3><span>Log calls, emails, meetings, and notes.</span></div><MessageSquarePlus size={19}/></div>
      <div className="leadActivityComposer">
        <select value={activityType} onChange={e=>setActivityType(e.target.value)}>{activityTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        <textarea rows="3" value={activityBody} onChange={e=>setActivityBody(e.target.value)} placeholder="What happened?"/>
        <button className="leadPrimary" disabled={busy} onClick={addActivity}>Log activity</button>
      </div>
      <div className="leadTimeline">
        {!activities.length&&<p className="leadMuted">No activity has been logged yet.</p>}
        {activities.map(item=>{
          const match=activityTypes.find(([value])=>value===item.activity_type);
          const Icon=match?.[2]||MessageSquarePlus;
          return <article key={item.id}><div><Icon size={16}/></div><span><strong>{match?.[1]||'Activity'}</strong><p>{item.body}</p><small>{formatDate(item.created_at)}</small></span></article>;
        })}
      </div>
    </section>
  </div>;
}
