(() => {
  const ROLES = [
    { key: 'admin', label: 'Admin', description: 'Manage the company, team, customers and operations', icon: 'A' },
    { key: 'employee', label: 'Employee', description: 'See assigned jobs, schedules and cleaning steps', icon: 'E' },
    { key: 'customer', label: 'Customer', description: 'See service schedules, reports, inventory and requests', icon: 'C' }
  ];

  let activeRole = 'admin';

  function getPortalButtons() {
    return [...document.querySelectorAll('.portalSwitch button')];
  }

  function readActiveRole() {
    const active = getPortalButtons().find(button => button.classList.contains('active'));
    const role = active?.textContent?.trim().toLowerCase();
    if (ROLES.some(item => item.key === role)) activeRole = role;
    return activeRole;
  }

  function switchRole(role) {
    const button = getPortalButtons().find(item => item.textContent?.trim().toLowerCase() === role);
    if (!button) return;
    button.click();
    activeRole = role;
    closeSheet();
    window.setTimeout(syncBanner, 50);
  }

  function closeSheet() {
    document.getElementById('runtimeRoleSheet')?.remove();
  }

  function openSheet() {
    closeSheet();
    const current = readActiveRole();
    const backdrop = document.createElement('div');
    backdrop.id = 'runtimeRoleSheet';
    backdrop.className = 'runtimeRoleBackdrop';
    backdrop.innerHTML = `
      <section class="runtimeRoleSheet" role="dialog" aria-modal="true" aria-label="Switch user view">
        <div class="runtimeSheetHandle"></div>
        <div class="runtimeRoleHeading">
          <div><p>Mobile preview</p><h3>Switch user view</h3></div>
          <button class="runtimeClose" aria-label="Close">×</button>
        </div>
        <p class="runtimeRoleNote">This changes only the interface you are previewing. Your signed-in Supabase account and permissions stay unchanged.</p>
        <div class="runtimeRoleChoices">
          ${ROLES.map(role => `
            <button data-role="${role.key}" class="${current === role.key ? 'active' : ''}">
              <span class="runtimeRoleIcon">${role.icon}</span>
              <span><strong>${role.label}</strong><small>${role.description}</small></span>
              <span class="runtimeRoleArrow">${current === role.key ? '✓' : '›'}</span>
            </button>`).join('')}
        </div>
      </section>`;
    backdrop.addEventListener('click', event => {
      if (event.target === backdrop || event.target.closest('.runtimeClose')) closeSheet();
      const roleButton = event.target.closest('[data-role]');
      if (roleButton) switchRole(roleButton.dataset.role);
    });
    document.body.appendChild(backdrop);
  }

  function syncBanner() {
    const role = readActiveRole();
    let banner = document.getElementById('runtimePreviewBanner');
    const main = document.querySelector('.main');
    if (!main) return;
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'runtimePreviewBanner';
      banner.className = 'runtimePreviewBanner';
      banner.innerHTML = '<span>Previewing</span><strong></strong><button type="button">Switch</button>';
      banner.querySelector('button').addEventListener('click', openSheet);
      const canvas = main.querySelector('.canvas');
      main.insertBefore(banner, canvas || null);
    }
    banner.querySelector('strong').textContent = `${role} view`;
  }

  function bindAvatar() {
    const avatar = document.querySelector('.top .avatarButton');
    if (!avatar || avatar.dataset.roleSwitcherBound === 'true') return;
    avatar.dataset.roleSwitcherBound = 'true';
    avatar.setAttribute('aria-label', 'Switch preview view');
    avatar.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openSheet();
    });
  }

  function installStyles() {
    if (document.getElementById('runtimeRoleStyles')) return;
    const style = document.createElement('style');
    style.id = 'runtimeRoleStyles';
    style.textContent = `
      .runtimePreviewBanner{display:none}
      .runtimeRoleBackdrop{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.42);display:flex;align-items:flex-end;justify-content:center;padding:16px}
      .runtimeRoleSheet{width:min(100%,520px);background:#fff;border-radius:24px 24px 18px 18px;padding:12px 16px max(24px,env(safe-area-inset-bottom));box-shadow:0 24px 70px rgba(15,23,42,.28)}
      .runtimeSheetHandle{width:44px;height:5px;border-radius:999px;background:#cbd5e1;margin:0 auto 14px}
      .runtimeRoleHeading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.runtimeRoleHeading p{margin:0;color:#2563eb;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.runtimeRoleHeading h3{margin:3px 0 0;font-size:22px}.runtimeClose{border:0;background:#f1f5f9;width:36px;height:36px;border-radius:999px;font-size:25px;line-height:1;color:#334155}
      .runtimeRoleNote{margin:12px 0 16px;color:#64748b;font-size:13px;line-height:1.5}.runtimeRoleChoices{display:grid;gap:10px}.runtimeRoleChoices>button{width:100%;display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:12px;text-align:left;border:1px solid #e2e8f0;background:#fff;border-radius:16px;padding:13px}.runtimeRoleChoices>button.active{border-color:#2563eb;background:#eff6ff}.runtimeRoleIcon{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:#f1f5f9;color:#334155;font-weight:900}.runtimeRoleChoices>button.active .runtimeRoleIcon{background:#dbeafe;color:#1d4ed8}.runtimeRoleChoices strong,.runtimeRoleChoices small{display:block}.runtimeRoleChoices small{margin-top:3px;color:#64748b;font-size:12px;line-height:1.35}.runtimeRoleArrow{font-size:22px;color:#2563eb;font-weight:800}
      @media(max-width:760px){.runtimePreviewBanner{display:flex;align-items:center;gap:6px;position:sticky;top:64px;z-index:12;margin:0 12px 8px;padding:8px 10px;border:1px solid #bfdbfe;border-radius:12px;background:rgba(239,246,255,.96);backdrop-filter:blur(14px);box-shadow:0 5px 18px rgba(15,23,42,.08);font-size:12px;color:#475569}.runtimePreviewBanner strong{text-transform:capitalize;color:#1d4ed8}.runtimePreviewBanner button{margin-left:auto;border:0;background:transparent;color:#2563eb;font-weight:800;padding:4px 6px}.top .avatarButton{cursor:pointer}}
    `;
    document.head.appendChild(style);
  }

  function sync() {
    installStyles();
    bindAvatar();
    syncBanner();
  }

  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', sync);
  window.setTimeout(sync, 100);
})();
