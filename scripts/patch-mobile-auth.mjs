import fs from 'node:fs';

const path = 'src/app/App.jsx';
let source = fs.readFileSync(path, 'utf8');

const oldEffect = "useEffect(()=>{bootstrap(); if(supabase){const {data:l}=supabase.auth.onAuthStateChange(()=>bootstrap());return()=>l.subscription.unsubscribe();}},[]);";
const newEffect = `useEffect(()=>{
    let active=true;
    const watchdog=window.setTimeout(()=>{ if(active) setLoading(false); },8000);
    bootstrap();
    if(supabase){
      const {data:l}=supabase.auth.onAuthStateChange(()=>{
        window.setTimeout(()=>{ if(active) bootstrap(); },0);
      });
      return()=>{active=false;window.clearTimeout(watchdog);l.subscription.unsubscribe();};
    }
    return()=>{active=false;window.clearTimeout(watchdog);};
  },[]);`;

if (!source.includes(oldEffect)) {
  console.error('Expected auth listener was not found in App.jsx');
  process.exit(1);
}
source = source.replace(oldEffect, newEffect);

const oldCatch = `    } catch(error) {
      console.error('FacilityOS bootstrap error:',error);
      setSession(null); setProfile(null); setData(empty);
    } finally {`;
const newCatch = `    } catch(error) {
      console.error('FacilityOS bootstrap error:',error);
      try {
        const fallbackSession=(await supabase?.auth.getSession())?.data?.session||null;
        setSession(fallbackSession);
      } catch (_) {}
      setData(empty);
    } finally {`;

if (source.includes(oldCatch)) source = source.replace(oldCatch, newCatch);

fs.writeFileSync(path, source);
console.log('Applied mobile-safe Supabase auth bootstrap patch.');
