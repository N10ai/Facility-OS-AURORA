import fs from 'node:fs';

const path = 'src/app/App.jsx';
let source = fs.readFileSync(path, 'utf8');
let changes = 0;

function replaceRegex(pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`Could not find ${label} target in ${path}.`);
  }
  source = source.replace(pattern, replacement);
  changes += 1;
  console.log(`Applied ${label}.`);
}

// A profile/workspace timeout is not a logout. Never clear a valid login here.
replaceRegex(
  /}\s*catch\(error\)\s*{\s*console\.error\('FacilityOS bootstrap error:',error\);\s*setSession\(null\);\s*setProfile\(null\);\s*setData\(empty\);\s*}\s*finally\s*{/,
  `} catch(error) {
      console.error('FacilityOS bootstrap error:',error);
      setData(empty);
    } finally {`,
  'session preservation'
);

// Run startup once. Auth events update session state but must not recursively call
// bootstrap/getSession while Supabase is processing its own auth callback.
replaceRegex(
  /useEffect\(\(\)=>\{bootstrap\(\);\s*if\(supabase\)\{const \{data:l\}=supabase\.auth\.onAuthStateChange\(\(\)=>bootstrap\(\)\);return\(\)=>l\.subscription\.unsubscribe\(\);}\},\[\]\);/,
  `useEffect(()=>{
    let active=true;
    const loadingEscape=window.setTimeout(()=>{if(active)setLoading(false)},8000);
    bootstrap();
    if(!supabase) return()=>{active=false;window.clearTimeout(loadingEscape)};
    const {data:l}=supabase.auth.onAuthStateChange((event,nextSession)=>{
      if(!active) return;
      setSession(nextSession||null);
      if(event==='SIGNED_OUT') {
        setProfile(null);
        setData(empty);
        setLoading(false);
      }
    });
    return()=>{
      active=false;
      window.clearTimeout(loadingEscape);
      l.subscription.unsubscribe();
    };
  },[]);`,
  'non-recursive auth listener'
);

// Login already returns a session; defer one normal startup refresh outside the click stack.
source = source.replace(/\s+onReady\?\.\(\);/, `\n    window.setTimeout(()=>onReady?.(),0);`);

fs.writeFileSync(path, source);
console.log(`Auth startup patch complete (${changes} critical changes).`);
