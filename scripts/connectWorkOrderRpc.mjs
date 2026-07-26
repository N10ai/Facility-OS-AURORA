import fs from 'node:fs';

const file = 'src/services/api.js';
let text = fs.readFileSync(file, 'utf8');

const replacement = `export async function createWorkOrder(companyId, form) {
  const areaNames = (form.area_names || '').split(',').map(value => value.trim()).filter(Boolean);
  const { data, error } = await supabase.rpc('create_work_order_atomic', {
    p_customer_id: form.customer_id || null,
    p_facility_id: form.facility_id || null,
    p_assigned_to_profile_id: form.assigned_to_profile_id || null,
    p_title: form.title || 'Cleaning Work Order',
    p_scheduled_date: form.scheduled_date,
    p_scheduled_time: form.scheduled_time || null,
    p_estimated_minutes: Number(form.estimated_minutes || 90),
    p_priority: form.priority || 'normal',
    p_instructions: form.instructions || null,
    p_area_names: areaNames
  });

  return { data, error };
}`;

const pattern = /export async function createWorkOrder\(companyId, form\) \{[\s\S]*?\n\}\n\nexport async function updateWorkOrder/;
if (!pattern.test(text)) {
  throw new Error('createWorkOrder function marker not found.');
}

text = text.replace(pattern, `${replacement}\n\nexport async function updateWorkOrder`);
fs.writeFileSync(file, text);
