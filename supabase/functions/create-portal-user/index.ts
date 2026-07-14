import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !caller) throw new Error('Unauthorized')

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: callerProfile, error: profileError } = await admin
      .from('profiles')
      .select('company_id, role')
      .eq('id', caller.id)
      .single()

    if (profileError || !callerProfile || !['owner', 'manager'].includes(callerProfile.role)) {
      throw new Error('Only an owner or manager can create portal users.')
    }

    const body = await req.json()
    if (body?.health_check === true) {
      return new Response(JSON.stringify({ ok: true, function: 'create-portal-user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    const { email, password, full_name, role, phone, customer_id } = body
    if (!email || !password || !full_name || !role) throw new Error('Missing required fields.')
    if (!['employee', 'customer', 'manager'].includes(role)) throw new Error('Invalid role.')
    if (role === 'customer' && !customer_id) throw new Error('Customer account is required.')

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    })
    if (createError) throw createError

    const { error: insertError } = await admin.from('profiles').upsert({
      id: created.user.id,
      company_id: callerProfile.company_id,
      customer_id: role === 'customer' ? customer_id : null,
      full_name,
      role,
      phone: phone || null,
      status: 'active',
    })
    if (insertError) {
      await admin.auth.admin.deleteUser(created.user.id)
      throw insertError
    }

    return new Response(JSON.stringify({ user: created.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
