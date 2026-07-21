import { supabase } from './supabase';

function money(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
}

export async function createQuoteWithLines(companyId, form, lines = []) {
  const selectedLines = lines
    .filter(line => line.description?.trim())
    .map((line, index) => ({
      company_id: companyId,
      description: line.description.trim(),
      quantity: money(line.quantity || 1),
      unit: line.unit || 'service',
      unit_price: money(line.unit_price),
      is_optional: Boolean(line.is_optional),
      is_selected: line.is_optional ? Boolean(line.is_selected) : true,
      sort_order: index + 1,
    }));

  const subtotal = selectedLines
    .filter(line => !line.is_optional || line.is_selected)
    .reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
  const discountAmount = money(form.discount_amount);
  const taxAmount = money(form.tax_amount);
  const totalAmount = money(Math.max(0, subtotal - discountAmount + taxAmount));
  const recurringAmount = money(form.recurring_amount || totalAmount);

  const quoteResult = await supabase.from('quotes').insert({
    company_id: companyId,
    customer_id: form.customer_id || null,
    facility_id: form.facility_id || null,
    contact_id: form.contact_id || null,
    quote_number: form.quote_number,
    title: form.title,
    status: form.status || 'draft',
    valid_until: form.valid_until || null,
    service_start_date: form.service_start_date || null,
    frequency: form.frequency || null,
    notes: form.notes || null,
    subtotal: money(subtotal),
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    amount: totalAmount,
    recurring_amount: recurringAmount,
  }).select().single();

  if (quoteResult.error || !selectedLines.length) return quoteResult;

  const lineResult = await supabase.from('quote_line_items').insert(
    selectedLines.map(line => ({ ...line, quote_id: quoteResult.data.id }))
  ).select();

  if (lineResult.error) {
    await supabase.from('quotes').delete().eq('id', quoteResult.data.id);
    return { error: lineResult.error };
  }

  await supabase.rpc('recalculate_quote_totals', { target_quote_id: quoteResult.data.id });
  return { data: { ...quoteResult.data, line_items: lineResult.data }, error: null };
}

export async function duplicateQuote(companyId, quoteId, quoteNumber) {
  const quoteResult = await supabase.from('quotes').select('*').eq('id', quoteId).single();
  if (quoteResult.error) return quoteResult;

  const linesResult = await supabase.from('quote_line_items').select('*').eq('quote_id', quoteId).order('sort_order');
  if (linesResult.error) return linesResult;

  const source = quoteResult.data;
  return createQuoteWithLines(companyId, {
    ...source,
    quote_number: quoteNumber,
    title: `${source.title} — Copy`,
    status: 'draft',
    accepted_at: null,
    rejected_at: null,
    converted_invoice_id: null,
  }, linesResult.data);
}

export async function setQuoteStatus(quoteId, status) {
  const updates = { status, updated_at: new Date().toISOString() };
  if (status === 'accepted') updates.accepted_at = new Date().toISOString();
  if (status === 'rejected') updates.rejected_at = new Date().toISOString();
  return supabase.from('quotes').update(updates).eq('id', quoteId).select().single();
}

export async function convertQuoteToInvoice(companyId, quoteId, invoiceNumber, dueDate) {
  const quoteResult = await supabase.from('quotes').select('*').eq('id', quoteId).single();
  if (quoteResult.error) return quoteResult;

  const quote = quoteResult.data;
  if (!['accepted', 'sent'].includes(quote.status)) {
    return { error: { message: 'Only sent or accepted quotes can be converted to an invoice.' } };
  }

  const linesResult = await supabase.from('quote_line_items')
    .select('*')
    .eq('quote_id', quoteId)
    .or('is_optional.eq.false,is_selected.eq.true')
    .order('sort_order');
  if (linesResult.error) return linesResult;

  const invoiceResult = await supabase.from('invoices').insert({
    company_id: companyId,
    customer_id: quote.customer_id,
    facility_id: quote.facility_id,
    quote_id: quote.id,
    invoice_number: invoiceNumber,
    issued_date: new Date().toISOString().slice(0, 10),
    due_date: dueDate || null,
    status: 'draft',
    subtotal: money(quote.subtotal),
    discount_amount: money(quote.discount_amount),
    tax_amount: money(quote.tax_amount),
    total_amount: money(quote.total_amount || quote.amount),
    amount: money(quote.total_amount || quote.amount),
    amount_paid: 0,
    balance_due: money(quote.total_amount || quote.amount),
    notes: quote.notes || null,
  }).select().single();

  if (invoiceResult.error) return invoiceResult;

  if (linesResult.data.length) {
    const invoiceLines = linesResult.data.map((line, index) => ({
      company_id: companyId,
      invoice_id: invoiceResult.data.id,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unit_price: line.unit_price,
      sort_order: index + 1,
    }));
    const lineInsert = await supabase.from('invoice_line_items').insert(invoiceLines);
    if (lineInsert.error) return { data: invoiceResult.data, error: lineInsert.error };
  }

  await supabase.from('quotes').update({
    status: quote.status === 'accepted' ? 'accepted' : 'converted',
    converted_invoice_id: invoiceResult.data.id,
    updated_at: new Date().toISOString(),
  }).eq('id', quote.id);

  return { data: invoiceResult.data, error: null };
}

export async function recordInvoicePayment(companyId, form) {
  const amount = money(form.amount);
  if (amount <= 0) return { error: { message: 'Payment amount must be greater than zero.' } };

  const result = await supabase.from('payments').insert({
    company_id: companyId,
    invoice_id: form.invoice_id || null,
    customer_id: form.customer_id || null,
    amount,
    payment_date: form.payment_date || new Date().toISOString().slice(0, 10),
    method: form.method || null,
    reference_number: form.reference_number || null,
    notes: form.notes || null,
    payment_type: form.payment_type || 'payment',
    status: 'received',
  }).select().single();

  if (result.error || !form.invoice_id) return result;
  const balanceResult = await supabase.rpc('recalculate_invoice_balance', { target_invoice_id: form.invoice_id });
  return balanceResult.error ? { data: result.data, error: balanceResult.error } : result;
}

export async function createLinkedExpense(companyId, form) {
  return supabase.from('expenses').insert({
    company_id: companyId,
    customer_id: form.customer_id || null,
    facility_id: form.facility_id || null,
    work_order_id: form.work_order_id || null,
    employee_profile_id: form.employee_profile_id || null,
    category: form.category || 'supplies',
    vendor: form.vendor || null,
    amount: money(form.amount),
    expense_date: form.expense_date || new Date().toISOString().slice(0, 10),
    payment_method: form.payment_method || null,
    receipt_url: form.receipt_url || null,
    notes: form.notes || null,
    status: 'recorded',
  }).select().single();
}

export async function markPayrollPaid(payrollEntryId, paymentMethod, reference) {
  return supabase.from('payroll_entries').update({
    status: 'paid',
    payment_method: paymentMethod || null,
    payment_reference: reference || null,
    paid_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', payrollEntryId).select().single();
}
