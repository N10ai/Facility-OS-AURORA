import fs from 'node:fs';

const path = 'src/app/App.jsx';
let source = fs.readFileSync(path, 'utf8');

const oldBlock = `    } catch(error) {
      console.error('FacilityOS bootstrap error:',error);
      setSession(null); setProfile(null); setData(empty);
    } finally {`;

const newBlock = `    } catch(error) {
      console.error('FacilityOS bootstrap error:',error);
      // A workspace/profile request failure is not an authentication failure.
      // Preserve a valid Supabase session so mobile users are not returned to Login.
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const preservedSession = sessionData?.session || null;
        setSession(preservedSession);
        if (!preservedSession) {
          setProfile(null);
          setData(empty);
        }
      } catch(sessionError) {
        console.error('FacilityOS session recovery error:', sessionError);
      }
    } finally {`;

if (!source.includes(oldBlock)) {
  console.log('Auth session patch already applied or target block changed.');
  process.exit(0);
}

source = source.replace(oldBlock, newBlock);
fs.writeFileSync(path, source);
console.log('Applied mobile auth session preservation patch.');
