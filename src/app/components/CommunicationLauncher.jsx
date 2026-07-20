import { useEffect, useState } from 'react';
import { Mail, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { getMyProfile, loadWorkspace } from '../../services/api';
import { CommunicationHub } from './CommunicationHub';
import './CommunicationLauncher.css';

export function CommunicationLauncher() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!active) return;

      if (!user) {
        setVisible(false);
        setData(null);
        return;
      }

      // Show the launcher immediately for every authenticated workspace user.
      // Data and role checks must never make the navigation disappear silently.
      setVisible(true);
      setLoading(true);

      try {
        const profile = await getMyProfile(user.id);
        if (!active) return;
        if (profile?.company_id) {
          const workspace = await loadWorkspace(profile);
          if (active) setData(workspace);
        }
      } catch (error) {
        console.error('Unable to load Communications workspace', error);
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();
    const { data: listener } = supabase.auth.onAuthStateChange(() => initialize());
    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  if (!visible) return null;

  return <>
    <button className="auroraCommsLauncher" onClick={() => setOpen(true)} aria-label="Open Communications">
      <Mail size={20}/><span>Communications</span><small>v3.25</small>
    </button>
    {open && <div className="auroraCommsOverlay">
      <div className="auroraCommsTopbar">
        <div><strong>Communications</strong><span>Customer messages and history</span></div>
        <button onClick={() => setOpen(false)} aria-label="Close Communications"><X size={20}/></button>
      </div>
      <div className="auroraCommsCanvas">
        {data ? <CommunicationHub data={data}/> : <div className="auroraCommsLoading">{loading ? 'Loading communications…' : 'Communications is available, but workspace data could not be loaded.'}</div>}
      </div>
    </div>}
  </>;
}
