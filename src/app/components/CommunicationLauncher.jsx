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

  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user || !active) return;
      const profile = await getMyProfile(user.id);
      if (!profile || !['owner', 'admin', 'manager', 'supervisor'].includes(profile.role)) return;
      const workspace = await loadWorkspace(profile);
      if (!active) return;
      setData(workspace);
      setVisible(true);
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
      <Mail size={20}/><span>Communications</span>
    </button>
    {open && <div className="auroraCommsOverlay">
      <div className="auroraCommsTopbar">
        <strong>Communications</strong>
        <button onClick={() => setOpen(false)} aria-label="Close Communications"><X size={20}/></button>
      </div>
      <div className="auroraCommsCanvas">
        {data ? <CommunicationHub data={data}/> : <div className="loading">Loading communications…</div>}
      </div>
    </div>}
  </>;
}
