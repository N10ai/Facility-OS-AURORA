import fs from 'node:fs';

const path = 'src/app/App.jsx';
let source = fs.readFileSync(path, 'utf8');
let changes = 0;

function replaceOnce(before, after, label) {
  if (source.includes(after)) {
    console.log(`${label} already applied.`);
    return;
  }
  if (!source.includes(before)) {
    throw new Error(`Could not find ${label} target in ${path}.`);
  }
  source = source.replace(before, after);
  changes += 1;
  console.log(`Applied ${label}.`);
}

replaceOnce(
`    } catch(error) {
       console.error('FacilityOS bootstrap error:',error);
       setSession(null); setProfile(null); setData(empty);
     } finally {`,
`    } catch(error) {
       console.error('FacilityOS bootstrap error:',error);
       // A profile or workspace request failure must not invalidate a successful login.
       // Keep the current session/profile state and allow the UI to leave the loading screen.
       setData(empty);
     } finally {`,
'mobile session-preservation patch'
);

replaceOnce(
`  useEffect(()=>{bootstrap(); if(supabase){const {data:l}=supabase.auth.onAuthStateChange(()=>bootstrap());return()=>l.subscription.unsubscribe();}},[]);`,
`  useEffect(()=>{
    let active=true;
    const loadingEscape=window.setTimeout(()=>{if(active)setLoading(false)},12000);
    bootstrap();
    if(!supabase) return()=>{active=false;window.clearTimeout(loadingEscape)};
    const {data:l}=supabase.auth.onAuthStateChange((_event,nextSession)=>{
      if(nextSession) setSession(nextSession);
      // Supabase warns against awaiting another auth method inside this callback.
      // Defer bootstrap until the auth callback has released its internal lock.
      window.setTimeout(()=>{if(active)bootstrap()},0);
    });
    return()=>{
      active=false;
      window.clearTimeout(loadingEscape);
      l.subscription.unsubscribe();
    };
  },[]);`,
'mobile auth-listener deadlock patch'
);

replaceOnce(
`    onReady?.();`,
`    window.setTimeout(()=>onReady?.(),0);`,
'post-login bootstrap deferral patch'
);

fs.writeFileSync(path, source);
console.log(`Auth startup patch complete (${changes} change${changes===1?'':'s'}).`);
