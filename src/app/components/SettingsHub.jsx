import { Building2, Palette, UsersRound, Bell, FileText, CreditCard, Plug, ShieldCheck, Activity, ChevronRight } from 'lucide-react';

const sections=[
  ['company','Company',Building2,'Business name, address, timezone, and operating preferences.'],
  ['branding','Branding',Palette,'Logo, colors, customer-facing reports, and email identity.'],
  ['users','Users & roles',UsersRound,'Owners, managers, employees, customers, and permissions.'],
  ['notifications','Notifications',Bell,'Operational alerts, reminders, and delivery preferences.'],
  ['documents','Documents',FileText,'Templates, agreements, W-9s, SOPs, and retention settings.'],
  ['billing','Billing',CreditCard,'Invoice defaults, payment methods, and future Stripe connection.'],
  ['integrations','Integrations',Plug,'Supabase, email, calendar, accounting, and external services.'],
  ['security','Security',ShieldCheck,'Authentication, access controls, audit history, and data policies.'],
  ['health','System health',Activity,'Database, storage, functions, migrations, and environment status.']
];

export function SettingsHub({onOpenSection,healthChecks=[],checking=false,onRunHealthCheck}){
  return <div className="page settingsHub">
    <div className="pageHeader"><div><p className="eyebrow">Workspace administration</p><h1>Settings</h1><p>Configure FacilityOS by business purpose instead of technical setup steps.</p></div></div>
    <div className="settingsSectionGrid">
      {sections.map(([key,title,Icon,description])=><button className="settingsSectionCard" key={key} onClick={()=>onOpenSection?.(key)}>
        <span className="settingsSectionIcon"><Icon size={21}/></span>
        <span><strong>{title}</strong><small>{description}</small></span>
        <ChevronRight size={18}/>
      </button>)}
    </div>
    <section className="panel settingsHealthSummary">
      <div className="panelTitle"><div><p className="eyebrow">System health</p><h2>Aurora infrastructure</h2><p>Confirm the services required for daily operations.</p></div><button className="btn secondary" onClick={onRunHealthCheck} disabled={checking}>{checking?'Checking…':'Run system check'}</button></div>
      <div className="settingsHealthGrid">
        {healthChecks.length?healthChecks.map(check=><div className={check.ok?'settingsHealthItem ok':'settingsHealthItem bad'} key={check.key}><span/><div><strong>{check.label}</strong><small>{check.message}</small></div></div>):<div className="settingsHealthEmpty">Run the system check to verify database, storage, and secure functions.</div>}
      </div>
    </section>
  </div>;
}
