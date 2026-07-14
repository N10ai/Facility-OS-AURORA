import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization') || ''
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const callerClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) throw new Error('Unauthorized')
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: profile } = await admin.from('profiles').select('company_id, role').eq('id', caller.id).single()
    if (!profile || !['owner','manager'].includes(profile.role)) throw new Error('Only an owner or manager can delete users.')
    const { user_id } = await req.json()
    if (!user_id || user_id === caller.id) throw new Error('Invalid user.')
    const { data: target } = await admin.from('profiles').select('company_id').eq('id', user_id).single()
    if (!target || target.company_id !== profile.company_id) throw new Error('User does not belong to your company.')
    await admin.from('profiles').delete().eq('id', user_id)
    const { error } = await admin.auth.admin.deleteUser(user_id)
    if (error) throw error
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type':'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type':'application/json' } })
  }
})
