import { supabase } from './supabase';

export async function getMyProfile(userId) {
  if (!supabase || !userId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data || null;
}

export async function saveMyProfile(user, fields) {
  return supabase.from('profiles').upsert({
    id: user.id,
    full_name: fields.full_name || user.email,
    role: fields.role || 'owner',
    phone: fields.phone || null,
    company_id: fields.company_id || null,
    customer_id: fields.customer_id || null
  });
}

export async function createCompany(user, name) {
  const { data, error } = await supabase
    .from('companies')
    .insert({ name, brand_color:'#111111' })
    .select()
    .single();

  if (error) return { error };

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id:user.id,
      company_id:data.id,
      full_name:user.email,
      role:'owner'
    });

  return { data, error:profileError };
}

export async function loadWorkspace(profile) {
  if (!profile?.company_id) return {
    customers:[], contacts:[], facilities:[], people:[], plans:[], visits:[],
    tasks:[], proof:[], issues:[], requests:[], supplies:[], inventory:[], invites:[],
    workOrders:[], workOrderAreas:[], supplyUsage:[], timeEntries:[],
    quotes:[], invoices:[], payments:[], expenses:[], payroll:[]
  };

  const companyId = profile.company_id;

  const [
    customers, contacts, facilities, people, plans, visits, tasks, proof, issues,
    requests, supplies, inventory, invites, workOrders, workOrderAreas, supplyUsage, timeEntries,
    quotes, invoices, payments, expenses, payroll
  ] = await Promise.all([
    supabase.from('customers').select('*').eq('company_id',companyId).neq('status','archived').order('name'),
    supabase.from('customer_contacts').select('*').eq('company_id',companyId).neq('status','archived').order('full_name'),
    supabase.from('facilities').select('*').eq('company_id',companyId).neq('status','archived').order('name'),
    supabase.from('profiles').select('*').eq('company_id',companyId).order('full_name'),
    supabase.from('service_plans').select('*').eq('company_id',companyId).neq('status','archived').order('created_at',{ascending:false}),
    supabase.from('service_visits').select('*').eq('company_id',companyId).neq('status','archived').order('scheduled_date',{ascending:true}),
    supabase.from('mission_tasks').select('*').eq('company_id',companyId).order('sort_order'),
    supabase.from('visit_proof').select('*').eq('company_id',companyId).order('created_at',{ascending:false}),
    supabase.from('facility_issues').select('*').eq('company_id',companyId).order('created_at',{ascending:false}),
    supabase.from('customer_requests').select('*').eq('company_id',companyId).order('created_at',{ascending:false}),
    supabase.from('supply_items').select('*').eq('company_id',companyId).neq('status','archived').order('name'),
    supabase.from('facility_supply_inventory').select('*').eq('company_id',companyId).order('updated_at',{ascending:false}),
    supabase.from('portal_invites').select('*').eq('company_id',companyId).order('created_at',{ascending:false}),
    supabase.from('work_orders').select('*').eq('company_id',companyId).neq('status','archived').order('scheduled_date',{ascending:true}),
    supabase.from('work_order_areas').select('*').eq('company_id',companyId).order('sort_order'),
    supabase.from('work_order_supply_usage').select('*').eq('company_id',companyId).order('created_at',{ascending:false}),
    supabase.from('work_order_time_entries').select('*').eq('company_id',companyId).order('started_at',{ascending:false}),
    supabase.from('quotes').select('*').eq('company_id',companyId).order('created_at',{ascending:false}),
    supabase.from('invoices').select('*').eq('company_id',companyId).order('created_at',{ascending:false}),
    supabase.from('payments').select('*').eq('company_id',companyId).order('payment_date',{ascending:false}),
    supabase.from('expenses').select('*').eq('company_id',companyId).order('expense_date',{ascending:false}),
    supabase.from('payroll_entries').select('*').eq('company_id',companyId).order('period_end',{ascending:false})
  ]);

  return {
    customers:customers.data||[], contacts:contacts.data||[], facilities:facilities.data||[],
    people:people.data||[], plans:plans.data||[], visits:visits.data||[],
    tasks:tasks.data||[], proof:proof.data||[], issues:issues.data||[],
    requests:requests.data||[], supplies:supplies.data||[], inventory:inventory.data||[],
    invites:invites.data||[], workOrders:workOrders.data||[], workOrderAreas:workOrderAreas.data||[],
    supplyUsage:supplyUsage.data||[], timeEntries:timeEntries.data||[],
    quotes:quotes.data||[], invoices:invoices.data||[], payments:payments.data||[],
    expenses:expenses.data||[], payroll:payroll.data||[]
  };
}

export async function createCustomer(companyId, form) {
  return supabase.from('customers').insert({
    company_id:companyId,
    name:form.name,
    customer_type:form.customer_type||'commercial',
    status:'active',
    email:form.email||null,
    phone:form.phone||null,
    address:form.address||null,
    monthly_value:Number(form.monthly_value||0),
    health_score:100,
    readiness_score:35
  }).select().single();
}

export async function createFacility(companyId, form) {
  return supabase.from('facilities').insert({
    company_id:companyId,
    customer_id:form.customer_id,
    name:form.name,
    facility_type:form.facility_type||'office',
    address:form.address||null,
    access_notes:form.access_notes||null,
    restroom_count:Number(form.restroom_count||0),
    floor_type:form.floor_type||null,
    estimated_minutes:Number(form.estimated_minutes||60),
    status:'active',
    health_score:100,
    readiness_score:50
  }).select().single();
}

export async function createPerson(companyId, form) {
  if (!form.user_id) {
    return { error:{ message:'Create the login in Supabase Authentication first, then paste the User ID here.' } };
  }

  return supabase.from('profiles').upsert({
    id:form.user_id,
    company_id:companyId,
    customer_id:form.role==='customer' ? form.customer_id : null,
    full_name:form.full_name,
    role:form.role,
    phone:form.phone||null,
    status:'active'
  }).select().single();
}

export async function createServicePlan(companyId, form) {
  return supabase.from('service_plans').insert({
    company_id:companyId,
    customer_id:form.customer_id,
    facility_id:form.facility_id,
    name:form.name,
    frequency:form.frequency,
    weekdays:form.weekdays||[],
    start_date:form.start_date,
    default_time:form.default_time||'18:00',
    assigned_to_profile_id:form.assigned_to_profile_id||null,
    estimated_minutes:Number(form.estimated_minutes||90),
    visit_price:Number(form.visit_price||0),
    status:'active'
  }).select().single();
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate()+days);
  return next;
}

function isoDate(date) {
  return date.toISOString().slice(0,10);
}

function matchesFrequency(date, plan, start) {
  const day = date.getDay();
  const weekdays = (plan.weekdays||[]).map(Number);
  const diffDays = Math.floor((date-start)/(1000*60*60*24));

  if (plan.frequency==='weekly') return weekdays.includes(day);
  if (plan.frequency==='biweekly') return weekdays.includes(day) && Math.floor(diffDays/7)%2===0;
  if (plan.frequency==='monthly') return date.getDate()===start.getDate();
  if (plan.frequency==='quarterly') {
    const monthDiff=(date.getFullYear()-start.getFullYear())*12+date.getMonth()-start.getMonth();
    return monthDiff>=0 && monthDiff%3===0 && date.getDate()===start.getDate();
  }
  return false;
}

export async function generateVisits(companyId, plan, months=12) {
  const start = new Date(`${plan.start_date}T12:00:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth()+months);

  const rows=[];
  for(let d=new Date(start); d<=end; d=addDays(d,1)) {
    if(matchesFrequency(d, plan, start)) {
      rows.push({
        company_id:companyId,
        customer_id:plan.customer_id,
        facility_id:plan.facility_id,
        service_plan_id:plan.id,
        title:plan.name,
        scheduled_date:isoDate(d),
        scheduled_time:plan.default_time,
        assigned_to_profile_id:plan.assigned_to_profile_id,
        status:'scheduled',
        verification_status:'not_started',
        estimated_minutes:plan.estimated_minutes
      });
    }
  }

  if(!rows.length) return { error:{ message:'No dates matched this service plan.' } };

  const { data, error } = await supabase.from('service_visits').insert(rows).select();
  if(error) return { error };

  const taskTemplates = [
    ['Check in and review access notes',1,false],
    ['Upload before photos',2,true],
    ['Empty trash and replace liners',3,false],
    ['Clean and disinfect high-touch surfaces',4,false],
    ['Clean restrooms',5,false],
    ['Vacuum and mop floors',6,false],
    ['Report facility issues',7,false],
    ['Upload after photos',8,true],
    ['Complete final quality inspection',9,false]
  ];

  const taskRows=[];
  for(const visit of data) {
    for(const [title,sort_order,requires_proof] of taskTemplates) {
      taskRows.push({
        company_id:companyId,
        service_visit_id:visit.id,
        title, sort_order, requires_proof, status:'pending'
      });
    }
  }
  await supabase.from('mission_tasks').insert(taskRows);

  return { data, error:null };
}

export async function updateVisit(id, updates) {
  return supabase.from('service_visits').update(updates).eq('id',id).select().single();
}

export async function toggleTask(task) {
  const done = task.status !== 'completed';
  return supabase.from('mission_tasks').update({
    status:done?'completed':'pending',
    completed_at:done?new Date().toISOString():null
  }).eq('id',task.id);
}

export async function uploadProof(companyId, visitId, userId, file, proofType) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const path = `${companyId}/${visitId}/${Date.now()}-${safe}`;

  const { error:uploadError } = await supabase.storage
    .from('proof-photos')
    .upload(path,file,{ upsert:false });

  if(uploadError) return { error:uploadError };

  const { data:publicData } = supabase.storage.from('proof-photos').getPublicUrl(path);

  return supabase.from('visit_proof').insert({
    company_id:companyId,
    service_visit_id:visitId,
    uploaded_by_profile_id:userId,
    proof_type:proofType,
    file_url:publicData.publicUrl,
    status:'uploaded'
  }).select().single();
}

export async function createIssue(companyId, form, profileId) {
  return supabase.from('facility_issues').insert({
    company_id:companyId,
    customer_id:form.customer_id,
    facility_id:form.facility_id,
    service_visit_id:form.service_visit_id||null,
    reported_by_profile_id:profileId,
    title:form.title,
    description:form.description||null,
    priority:form.priority||'medium',
    status:'open'
  }).select().single();
}

export async function createCustomerRequest(companyId, profile, form) {
  return supabase.from('customer_requests').insert({
    company_id:companyId,
    customer_id:profile.customer_id,
    requested_by_profile_id:profile.id,
    facility_id:form.facility_id||null,
    request_type:form.request_type||'additional_service',
    title:form.title,
    description:form.description||null,
    status:'new'
  }).select().single();
}

export async function seedMIP(companyId) {
  const existing = await supabase.from('customers').select('id').eq('company_id',companyId).eq('name','MIP Cargo Express').maybeSingle();
  if(existing.data) return { error:{ message:'MIP starter profile already exists.' } };

  const { data:customer, error:customerError } = await supabase.from('customers').insert({
    company_id:companyId,
    name:'MIP Cargo Express',
    customer_type:'logistics',
    status:'active',
    monthly_value:280,
    health_score:100,
    readiness_score:80
  }).select().single();
  if(customerError) return { error:customerError };

  const { data:facility, error:facilityError } = await supabase.from('facilities').insert({
    company_id:companyId,
    customer_id:customer.id,
    name:'MIP Cargo Express — Office',
    facility_type:'office',
    address:'Miami, Florida',
    access_notes:'Warehouse-adjacent office. Prioritize visible floors, restroom presentation, entry, conference room, and kitchen.',
    restroom_count:3,
    floor_type:'LVP / faux wood hard floor',
    estimated_minutes:150,
    status:'active',
    health_score:100,
    readiness_score:85
  }).select().single();
  if(facilityError) return { error:facilityError };

  const { data:plan, error:planError } = await supabase.from('service_plans').insert({
    company_id:companyId,
    customer_id:customer.id,
    facility_id:facility.id,
    name:'MIP Weekly Office Cleaning',
    frequency:'weekly',
    weekdays:[6],
    start_date:new Date().toISOString().slice(0,10),
    default_time:'09:00',
    estimated_minutes:150,
    visit_price:70,
    status:'active'
  }).select().single();
  if(planError) return { error:planError };

  return { data:{customer,facility,plan}, error:null };
}


export async function createPortalInvite(companyId, payload) {
  const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  return supabase.from('portal_invites').insert({
    company_id: companyId,
    customer_id: payload.role === 'customer' ? payload.customer_id || null : null,
    email: payload.email.trim().toLowerCase(),
    full_name: payload.full_name.trim(),
    role: payload.role,
    phone: payload.phone || null,
    token,
    expires_at: expires.toISOString(),
    status: 'pending'
  }).select().single();
}

export async function revokePortalInvite(id) {
  return supabase.from('portal_invites')
    .update({ status: 'revoked' })
    .eq('id', id)
    .select()
    .single();
}

export async function getPortalInvitePreview(token) {
  return supabase.rpc('get_portal_invite_preview', { invite_token: token });
}

export async function claimPortalInvite(token) {
  return supabase.rpc('claim_portal_invite', { invite_token: token });
}

export async function updateRecord(table, id, updates) {
  return supabase.from(table).update(updates).eq('id', id).select().single();
}

export async function archiveRecord(table, id) {
  return supabase.from(table).update({ status: 'archived' }).eq('id', id).select().single();
}

export async function deleteRecord(table, id) {
  return supabase.from(table).delete().eq('id', id);
}

export async function createBusinessRecord(table, companyId, payload) {
  return supabase.from(table).insert({ company_id: companyId, ...payload }).select().single();
}

export async function listBusinessRecords(table, companyId) {
  let query = supabase.from(table).select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  return query;
}

export async function createSupplyItem(companyId, form) {
  return supabase.from('supply_items').insert({
    company_id:companyId, name:form.name, category:form.category||'general',
    unit:form.unit||'each', default_reorder_level:Number(form.default_reorder_level||0),
    unit_cost:Number(form.unit_cost||0), status:'active'
  }).select().single();
}

export async function upsertFacilityInventory(companyId, form) {
  return supabase.from('facility_supply_inventory').upsert({
    company_id:companyId, facility_id:form.facility_id, supply_item_id:form.supply_item_id,
    quantity_on_hand:Number(form.quantity_on_hand||0), reorder_level:Number(form.reorder_level||0),
    target_level:Number(form.target_level||0), storage_location:form.storage_location||null,
    notes:form.notes||null, updated_at:new Date().toISOString()
  }, { onConflict:'facility_id,supply_item_id' }).select().single();
}

export async function adjustFacilityInventory(id, quantity) {
  return supabase.from('facility_supply_inventory').update({
    quantity_on_hand:Number(quantity), updated_at:new Date().toISOString()
  }).eq('id',id).select().single();
}


export async function createCustomerContact(companyId, form) {
  return supabase.from('customer_contacts').insert({
    company_id: companyId,
    customer_id: form.customer_id,
    full_name: form.full_name,
    title: form.title || null,
    email: form.email || null,
    phone: form.phone || null,
    receives_reports: !!form.receives_reports,
    receives_invoices: !!form.receives_invoices,
    receives_quotes: !!form.receives_quotes,
    status: 'active'
  }).select().single();
}

export async function updateCustomerContact(id, form) {
  return supabase.from('customer_contacts').update({
    customer_id: form.customer_id,
    full_name: form.full_name,
    title: form.title || null,
    email: form.email || null,
    phone: form.phone || null,
    receives_reports: !!form.receives_reports,
    receives_invoices: !!form.receives_invoices,
    receives_quotes: !!form.receives_quotes
  }).eq('id', id).select().single();
}

export async function archiveCustomerContact(id) {
  return supabase.from('customer_contacts').update({ status: 'archived' }).eq('id', id);
}


export async function checkInfrastructure() {
  const checks = [];
  const tables = [
    'profiles','customers','customer_contacts','facilities','service_plans','service_visits',
    'mission_tasks','visit_proof','facility_issues','customer_requests','supply_items','facility_supply_inventory'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    checks.push({ key: `table:${table}`, label: table, type: 'Database table', ok: !error, message: error?.message || 'Ready' });
  }

  const storage = await supabase.storage.from('proof-photos').list('', { limit: 1 });
  checks.push({ key:'storage:proof-photos', label:'proof-photos', type:'Storage bucket', ok:!storage.error, message:storage.error?.message||'Ready' });
  const inviteCheck = await supabase.from('portal_invites').select('id').limit(1);
  checks.push({
    key:'table:portal_invites',
    label:'portal_invites',
    type:'Invitation onboarding',
    ok:!inviteCheck.error,
    message:inviteCheck.error?.message || 'Ready — no Edge Function required'
  });

  return checks;
}


export async function createWorkOrder(companyId, form) {
  const { data, error } = await supabase.from('work_orders').insert({
    company_id: companyId,
    customer_id: form.customer_id,
    facility_id: form.facility_id,
    assigned_to_profile_id: form.assigned_to_profile_id || null,
    title: form.title || 'Cleaning Work Order',
    scheduled_date: form.scheduled_date,
    scheduled_time: form.scheduled_time || null,
    estimated_minutes: Number(form.estimated_minutes || 90),
    priority: form.priority || 'normal',
    instructions: form.instructions || null,
    status: 'scheduled'
  }).select().single();

  if (error) return { error };

  const areaNames = (form.area_names || '').split(',').map(v => v.trim()).filter(Boolean);
  if (areaNames.length) {
    const areaResult = await supabase.from('work_order_areas').insert(
      areaNames.map((name, index) => ({
        company_id: companyId,
        work_order_id: data.id,
        name,
        sort_order: index + 1,
        status: 'pending'
      }))
    );
    if (areaResult.error) return { data, error: areaResult.error };
  }

  return { data, error: null };
}

export async function updateWorkOrder(id, updates) {
  return supabase.from('work_orders').update(updates).eq('id', id).select().single();
}

export async function verifyWorkOrder(id, profileId, summary, qualityScore=100) {
  const now = new Date().toISOString();
  return supabase.from('work_orders').update({
    status:'verified',
    verified_at:now,
    verified_by_profile_id:profileId,
    customer_summary:summary||'Service completed and verified by management.',
    quality_score:Number(qualityScore||100),
    manager_note:null,
    updated_at:now
  }).eq('id',id).select().single();
}

export async function returnWorkOrder(id, note) {
  const now = new Date().toISOString();
  return supabase.from('work_orders').update({
    status:'returned',
    returned_at:now,
    manager_note:note||'Manager requested corrections.',
    updated_at:now
  }).eq('id',id).select().single();
}

export async function archiveWorkOrder(id) {
  return supabase.from('work_orders').update({ status: 'archived' }).eq('id', id);
}

export async function updateWorkOrderArea(id, updates) {
  return supabase.from('work_order_areas').update(updates).eq('id', id).select().single();
}

export async function startWorkOrder(workOrderId, companyId, profileId) {
  const now = new Date().toISOString();
  const result = await supabase.from('work_orders').update({
    status: 'in_progress',
    accepted_at: now,
    started_at: now
  }).eq('id', workOrderId).select().single();

  if (result.error) return result;

  await supabase.from('work_order_time_entries').insert({
    company_id: companyId,
    work_order_id: workOrderId,
    profile_id: profileId,
    entry_type: 'work',
    started_at: now
  });

  return result;
}

export async function finishWorkOrder(workOrderId) {
  const now = new Date().toISOString();

  await supabase.from('work_order_time_entries')
    .update({ ended_at: now })
    .eq('work_order_id', workOrderId)
    .is('ended_at', null);

  return supabase.from('work_orders').update({
    status: 'awaiting_verification',
    completed_at: now
  }).eq('id', workOrderId).select().single();
}

export async function recordSupplyUsage(companyId, workOrderId, facilityId, supplyItemId, quantity, profileId) {
  const amount = Number(quantity || 0);
  if (!amount || !supplyItemId) return { error: { message: 'Supply and quantity are required.' } };

  const usage = await supabase.from('work_order_supply_usage').insert({
    company_id: companyId,
    work_order_id: workOrderId,
    facility_id: facilityId,
    supply_item_id: supplyItemId,
    quantity_used: amount,
    recorded_by_profile_id: profileId
  }).select().single();

  if (usage.error) return usage;

  const current = await supabase.from('facility_supply_inventory')
    .select('id, quantity')
    .eq('facility_id', facilityId)
    .eq('supply_item_id', supplyItemId)
    .maybeSingle();

  if (current.data) {
    await supabase.from('facility_supply_inventory')
      .update({ quantity: Math.max(0, Number(current.data.quantity || 0) - amount) })
      .eq('id', current.data.id);
  }

  return usage;
}


export async function createQuote(companyId, form) {
  return supabase.from('quotes').insert({
    company_id: companyId,
    customer_id: form.customer_id || null,
    facility_id: form.facility_id || null,
    quote_number: form.quote_number,
    title: form.title,
    amount: Number(form.amount || 0),
    status: form.status || 'draft',
    valid_until: form.valid_until || null,
    notes: form.notes || null
  }).select().single();
}

export async function createInvoice(companyId, form) {
  return supabase.from('invoices').insert({
    company_id: companyId,
    customer_id: form.customer_id || null,
    facility_id: form.facility_id || null,
    invoice_number: form.invoice_number,
    amount: Number(form.amount || 0),
    due_date: form.due_date || null,
    status: form.status || 'draft',
    notes: form.notes || null
  }).select().single();
}

export async function createPayment(companyId, form) {
  return supabase.from('payments').insert({
    company_id: companyId,
    invoice_id: form.invoice_id || null,
    customer_id: form.customer_id || null,
    amount: Number(form.amount || 0),
    payment_date: form.payment_date || new Date().toISOString().slice(0,10),
    method: form.method || null,
    status: 'received'
  }).select().single();
}

export async function createExpense(companyId, form) {
  return supabase.from('expenses').insert({
    company_id: companyId,
    category: form.category || 'supplies',
    vendor: form.vendor || null,
    amount: Number(form.amount || 0),
    expense_date: form.expense_date || new Date().toISOString().slice(0,10),
    notes: form.notes || null,
    status: 'recorded'
  }).select().single();
}

export async function createPayrollEntry(companyId, form) {
  const hours = Number(form.hours || 0);
  const hourlyRate = Number(form.hourly_rate || 0);
  return supabase.from('payroll_entries').insert({
    company_id: companyId,
    employee_profile_id: form.employee_profile_id || null,
    period_start: form.period_start || null,
    period_end: form.period_end || null,
    hours,
    hourly_rate: hourlyRate,
    gross_pay: hours * hourlyRate,
    status: form.status || 'draft'
  }).select().single();
}
