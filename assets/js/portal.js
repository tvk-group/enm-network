(function () {
  const config = window.ENM_PORTAL_CONFIG || { previewMode: true };
  const SESSION_KEY = 'enm_portal_session';
  const APPLY_KEY = 'enm_portal_application';

  function toast(msg, type) {
    let el = document.getElementById('portal-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'portal-toast';
      el.className = 'portal-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = `portal-toast show${type ? ` ${type}` : ''}`;
    setTimeout(() => el.classList.remove('show'), 3200);
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function setSession(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getApplication() {
    try {
      return JSON.parse(localStorage.getItem(APPLY_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function setApplication(data) {
    localStorage.setItem(APPLY_KEY, JSON.stringify(data));
  }

  /* ---- Tabs (Apply / Login) ---- */
  if (window.location.hash === '#login') {
    document.querySelector('[data-portal-tab="login"]')?.click();
  }
  document.querySelectorAll('[data-portal-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.portalTab;
      document.querySelectorAll('[data-portal-tab]').forEach((b) => b.classList.toggle('active', b.dataset.portalTab === tab));
      document.querySelectorAll('[data-portal-panel]').forEach((p) => p.classList.toggle('active', p.dataset.portalPanel === tab));
    });
  });

  /* ---- Apply form ---- */
  const applyForm = document.getElementById('portal-apply-form');
  if (applyForm) {
    applyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(applyForm);
      const password = fd.get('password');
      const confirm = fd.get('confirmPassword');
      if (password !== confirm) {
        toast('Passwords do not match.', 'error');
        return;
      }
      const required = ['fullName', 'email', 'password', 'country', 'wallet', 'round', 'allocation', 'payment'];
      for (const field of required) {
        if (!fd.get(field)) {
          toast('Please complete all required fields.', 'error');
          return;
        }
      }
      const checks = applyForm.querySelectorAll('input[type="checkbox"][required]');
      for (const c of checks) {
        if (!c.checked) {
          toast('Please accept all required declarations.', 'error');
          return;
        }
      }

      const app = {
        fullName: fd.get('fullName'),
        email: fd.get('email'),
        country: fd.get('country'),
        phone: fd.get('phone') || '',
        wallet: fd.get('wallet'),
        round: fd.get('round'),
        allocation: fd.get('allocation'),
        payment: fd.get('payment'),
        investorType: fd.get('investorType') || 'individual',
        referral: fd.get('referral') || '',
        status: 'pending',
        kycStatus: 'not_started',
        submittedAt: new Date().toISOString(),
      };
      setApplication(app);
      setSession({ email: app.email, name: app.fullName, loggedInAt: new Date().toISOString() });

      if (config.previewMode) {
        toast('Application saved (preview mode). Redirecting to dashboard…', 'success');
      } else {
        toast('Application submitted. Redirecting to dashboard…', 'success');
      }
      const dashPath = applyForm.dataset.dashboardPath || '/en/dashboard';
      setTimeout(() => { window.location.href = dashPath; }, 1200);
    });
  }

  /* ---- Login form ---- */
  const loginForm = document.getElementById('portal-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const email = fd.get('email');
      const password = fd.get('password');
      if (!email || !password) {
        toast('Enter email and password.', 'error');
        return;
      }
      const app = getApplication();
      if (config.previewMode && app && app.email === email) {
        setSession({ email: app.email, name: app.fullName, loggedInAt: new Date().toISOString() });
        toast('Logged in (preview mode).', 'success');
        const dashPath = loginForm.dataset.dashboardPath || '/en/dashboard';
        setTimeout(() => { window.location.href = dashPath; }, 800);
        return;
      }
      if (config.previewMode) {
        setSession({ email, name: email.split('@')[0], loggedInAt: new Date().toISOString() });
        toast('Preview login — connect Supabase for production auth.', 'success');
        const dashPath = loginForm.dataset.dashboardPath || '/en/dashboard';
        setTimeout(() => { window.location.href = dashPath; }, 800);
        return;
      }
      toast('Backend not configured. Set Supabase credentials in assets/config.js', 'error');
    });
  }

  /* ---- Dashboard ---- */
  const dashRoot = document.getElementById('portal-dashboard');
  if (dashRoot) {
    const session = getSession();
    const app = getApplication();
    const guestView = document.getElementById('portal-guest-view');
    const investorView = document.getElementById('portal-investor-view');

    if (!session) {
      if (guestView) guestView.classList.remove('portal-hidden');
      if (investorView) investorView.classList.add('portal-hidden');
    } else {
      if (guestView) guestView.classList.add('portal-hidden');
      if (investorView) investorView.classList.remove('portal-hidden');
      populateDashboard(session, app);
    }

    document.getElementById('portal-logout')?.addEventListener('click', () => {
      clearSession();
      window.location.reload();
    });
  }

  function populateDashboard(session, app) {
    const nameEl = document.getElementById('portal-user-name');
    const emailEl = document.getElementById('portal-user-email');
    if (nameEl) nameEl.textContent = session.name || '—';
    if (emailEl) emailEl.textContent = session.email || '—';

    const kyc = app?.kycStatus || 'not_started';
    const kycEl = document.getElementById('kpi-kyc');
    const kycInline = document.getElementById('kpi-kyc-inline');
    if (kycEl) {
      const labels = dashRoot?.dataset || {};
      const map = {
        not_started: { text: labels.kycNotStarted || 'Not started', cls: 'gray' },
        pending: { text: labels.kycPending || 'Pending', cls: 'amber' },
        approved: { text: labels.kycApproved || 'Approved', cls: 'green' },
        rejected: { text: labels.kycRejected || 'Rejected', cls: 'red' },
      };
      const s = map[kyc] || map.not_started;
      kycEl.innerHTML = `<span class="portal-badge ${s.cls}">${s.text}</span>`;
      if (kycInline) kycInline.innerHTML = kycEl.innerHTML;
    }

    const investedEl = document.getElementById('kpi-invested');
    if (investedEl) investedEl.textContent = app?.allocation ? `$${Number(app.allocation).toLocaleString()}` : '—';

    const allocEl = document.getElementById('kpi-allocation');
    if (allocEl) allocEl.textContent = app?.allocation ? `$${Number(app.allocation).toLocaleString()}` : '—';

    const claimEl = document.getElementById('kpi-claim');
    if (claimEl) {
      claimEl.innerHTML = '<span class="portal-badge gray">TGE Pending</span>';
    }

    if (app) {
      setText('detail-round', app.round);
      setText('detail-wallet', app.wallet);
      setText('detail-payment', app.payment);
      setText('detail-country', app.country);
      setText('detail-status', app.status || 'pending');
    }

    updateJourney(app);
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el && val) el.textContent = val;
  }

  function updateJourney(app) {
    const steps = document.querySelectorAll('.journey-step');
    if (!app) {
      steps.forEach((s, i) => {
        s.classList.toggle('active', i === 0);
        s.classList.remove('done');
      });
      return;
    }
    const stage = app.kycStatus === 'approved' ? 3 : app.status === 'approved' ? 2 : 1;
    steps.forEach((s, i) => {
      s.classList.toggle('done', i < stage);
      s.classList.toggle('active', i === stage);
    });
  }

  /* ---- Countdown (home + dashboard) ---- */
  function initCountdown() {
    const el = document.getElementById('energy-countdown');
    if (!el) return;
    const target = el.dataset.target;
    if (!target) return;
    const end = new Date(target + 'T00:00:00Z');

    function tick() {
      const diff = end - new Date();
      if (diff <= 0) {
        ['days', 'hours', 'mins', 'secs'].forEach((u) => {
          const n = el.querySelector(`[data-unit="${u}"]`);
          if (n) n.textContent = '0';
        });
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const map = { days: d, hours: h, mins: m, secs: s };
      Object.entries(map).forEach(([u, v]) => {
        const n = el.querySelector(`[data-unit="${u}"]`);
        if (n) n.textContent = String(v);
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  initCountdown();

  /* ---- Copy buttons ---- */
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy || '';
      navigator.clipboard.writeText(text).then(() => toast(btn.dataset.copiedLabel || 'Copied!', 'success'));
    });
  });

  /* ---- Presale phase sync (reuse config) ---- */
  const configEl = document.getElementById('presale-config');
  if (configEl && document.getElementById('portal-phase-label')) {
    try {
      const presale = JSON.parse(configEl.textContent);
      const now = new Date();
      let current = null;
      for (const phase of presale.phases) {
        const start = new Date(phase.start + 'T00:00:00Z');
        const end = new Date(phase.end + 'T23:59:59Z');
        if (now >= start && now <= end) { current = phase; break; }
      }
      const label = current
        ? (presale.phaseLabels?.[current.id] || current.id)
        : (presale.badges?.upcoming || 'Upcoming');
      document.getElementById('portal-phase-label').textContent = label;
      const progress = document.getElementById('portal-phase-progress');
      if (current && progress) {
        const start = new Date(current.start + 'T00:00:00Z');
        const end = new Date(current.end + 'T23:59:59Z');
        const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
        progress.style.width = `${pct}%`;
      }
    } catch { /* ignore */ }
  }
})();
