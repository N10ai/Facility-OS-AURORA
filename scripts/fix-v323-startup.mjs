import fs from 'node:fs';

const path = 'src/app/App.jsx';
let source = fs.readFileSync(path, 'utf8');
let changes = 0;

function replace(pattern, replacement, label) {
  if (source.includes(replacement)) {
    console.log(`${label} already applied.`);
    return;
  }
  if (!pattern.test(source)) {
    throw new Error(`Could not locate ${label} in ${path}`);
  }
  source = source.replace(pattern, replacement);
  changes += 1;
  console.log(`Applied ${label}.`);
}

replace(
  /async function bootstrap\(\)\s*\{/,
  'async function bootstrap(sessionOverride=null) {',
  'bootstrap session override'
);

replace(
  /const sessionResult=await Promise\.race\(\[supabase\.auth\.getSession\(\),timeout\]\);/,
  'const sessionResult=sessionOverride ? {data:{session:sessionOverride}} : await Promise.race([supabase.auth.getSession(),timeout]);',
  'direct session bootstrap'
);

replace(
  /setSession\(null\);\s*setProfile\(null\);\s*setData\(empty\);/,
  'setData(empty);',
  'preserve authenticated session on workspace error'
);

replace(
  /useEffect\(\(\)=>\{bootstrap\(\);\s*if\(supabase\)\{const \{data:l\}=supabase\.auth\.onAuthStateChange\(\(\)=>bootstrap\(\)\);return\(\)=>l\.subscription\.unsubscribe\(\);\}\},\[\]\);/,
  `useEffect(()=>{
    let active=true;
    const loadingEscape=window.setTimeout(()=>{if(active)setLoading(false)},12000);
    bootstrap();
    if(!supabase) return()=>{active=false;window.clearTimeout(loadingEscape)};
    const {data:l}=supabase.auth.onAuthStateChange((event,nextSession)=>{
      if(!active) return;
      if(event==='SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setData(empty);
        setLoading(false);
        return;
      }
      if(nextSession) window.setTimeout(()=>{if(active)bootstrap(nextSession)},0);
    });
    return()=>{
      active=false;
      window.clearTimeout(loadingEscape);
      l.subscription.unsubscribe();
    };
  },[]);`,
  'non-recursive auth startup'
);

replace(
  /onReady\?\.\(\);/,
  'onReady?.(session||null);',
  'login session handoff'
);

fs.writeFileSync(path, source);
console.log(`v3.23 startup fix complete (${changes} changes).`);
