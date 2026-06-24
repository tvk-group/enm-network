(function () {
  const configEl = document.getElementById('presale-config');
  if (!configEl) return;

  let config;
  try {
    config = JSON.parse(configEl.textContent);
  } catch {
    return;
  }

  const parseDate = (s) => new Date(s + 'T00:00:00Z');
  const now = () => new Date();

  function getPhaseState(phase) {
    const start = parseDate(phase.start);
    const end = parseDate(phase.end);
    end.setUTCHours(23, 59, 59, 999);
    const n = now();
    if (n < start) return 'upcoming';
    if (n > end) return 'completed';
    return 'active';
  }

  function getCurrentPhase() {
    for (const phase of config.phases) {
      if (getPhaseState(phase) === 'active') return phase;
    }
    return null;
  }

  function getNextPhase() {
    const n = now();
    for (const phase of config.phases) {
      if (parseDate(phase.start) > n) return phase;
    }
    return null;
  }

  function getCurrentPublicStage() {
    const publicPhase = config.phases.find((p) => p.id === 'public');
    if (!publicPhase || getPhaseState(publicPhase) !== 'active') return null;
    for (const stage of config.publicStages) {
      const start = parseDate(stage.start);
      const end = parseDate(stage.end);
      end.setUTCHours(23, 59, 59, 999);
      const n = now();
      if (n >= start && n <= end) return stage;
    }
    return null;
  }

  function formatCountdown(target) {
    const diff = target - now();
    if (diff <= 0) return '0d 0h 0m';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${d}d ${h}h ${m}m`;
  }

  function badgeClass(state) {
    if (state === 'active') return 'active';
    if (state === 'completed') return 'completed';
    return 'scheduled';
  }

  function badgeText(state) {
    const b = config.badges || {};
    if (state === 'active') return b.active || 'Active';
    if (state === 'completed') return b.completed || 'Completed';
    if (state === 'upcoming') return b.upcoming || 'Upcoming';
    return b.scheduled || 'Scheduled';
  }

  function updateTimeline() {
    document.querySelectorAll('.phase-card[data-phase]').forEach((el) => {
      const id = el.dataset.phase;
      const phase = config.phases.find((p) => p.id === id);
      if (!phase) return;
      const state = getPhaseState(phase);
      const badge = el.querySelector('.phase-status');
      if (badge) {
        badge.textContent = badgeText(state);
        badge.className = `badge ${badgeClass(state)} phase-status`;
      }
      if (state === 'active') el.classList.add('phase-active');
    });

    document.querySelectorAll('.stage-card[data-stage]').forEach((el) => {
      const num = Number(el.dataset.stage);
      const stage = config.publicStages.find((s) => s.stage === num);
      if (!stage) return;
      const start = parseDate(stage.start);
      const end = parseDate(stage.end);
      end.setUTCHours(23, 59, 59, 999);
      const n = now();
      let state = 'upcoming';
      if (n > end) state = 'completed';
      else if (n >= start) state = 'active';
      const badge = el.querySelector('.stage-status');
      if (badge) {
        badge.textContent = badgeText(state);
        badge.className = `badge ${badgeClass(state)} stage-status`;
      }
      if (state === 'active') el.classList.add('stage-active');
    });
  }

  function updateDashboard() {
    const current = getCurrentPhase();
    const next = getNextPhase();
    const stage = getCurrentPublicStage();
    const labels = config.phaseLabels || {};

    const phaseEl = document.getElementById('dash-current-phase');
    const countdownEl = document.getElementById('dash-countdown');
    const stageWrap = document.getElementById('dash-public-stage-wrap');
    const stageEl = document.getElementById('dash-public-stage');
    const statPhase = document.getElementById('dash-stat-phase');
    const statStage = document.getElementById('dash-stat-stage');
    const progress = document.getElementById('dash-phase-progress');
    const statusBadge = document.getElementById('presale-status-badge');

    if (current && phaseEl) {
      phaseEl.textContent = labels[current.id] || current.id;
      if (statPhase) statPhase.textContent = labels[current.id] || current.id;
      if (statusBadge) {
        statusBadge.textContent = badgeText('active');
        statusBadge.className = 'badge active';
      }
      const end = parseDate(current.end);
      end.setUTCHours(23, 59, 59, 999);
      if (countdownEl) countdownEl.textContent = formatCountdown(end);
      const start = parseDate(current.start);
      const total = end - start;
      const elapsed = now() - start;
      if (progress) progress.style.width = `${Math.min(100, Math.max(0, (elapsed / total) * 100))}%`;
    } else if (next && phaseEl) {
      phaseEl.textContent = labels[next.id] || next.id;
      if (statPhase) statPhase.textContent = badgeText('upcoming');
      if (countdownEl) countdownEl.textContent = formatCountdown(parseDate(next.start));
      if (statusBadge) {
        statusBadge.textContent = badgeText('upcoming');
        statusBadge.className = 'badge scheduled';
      }
    } else if (phaseEl) {
      phaseEl.textContent = config.badges?.completed || 'Completed';
      if (countdownEl) countdownEl.textContent = '—';
      if (statusBadge) {
        statusBadge.textContent = badgeText('completed');
        statusBadge.className = 'badge completed';
      }
    }

    if (stage && stageWrap && stageEl) {
      stageWrap.hidden = false;
      stageEl.textContent = String(stage.stage);
      if (statStage) statStage.textContent = String(stage.stage);
    } else if (statStage) {
      statStage.textContent = '—';
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert('No Ethereum wallet detected. Install MetaMask or a compatible wallet.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const statusEl = document.getElementById('dash-wallet-status');
      const addrEl = document.getElementById('dash-wallet-address');
      const btn = document.getElementById('dash-connect-btn');
      if (accounts[0]) {
        const labels = config.labels || {};
        if (statusEl) statusEl.textContent = labels.walletConnected || 'Connected';
        if (addrEl) addrEl.textContent = accounts[0];
        if (btn) btn.textContent = labels.disconnectWallet || 'Disconnect';
        if (chainId !== '0x1') {
          alert('Please switch to Ethereum Mainnet.');
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      if (!btn) return;
      const orig = btn.textContent;
      btn.textContent = '✓';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    });
  }

  document.getElementById('dash-connect-btn')?.addEventListener('click', connectWallet);

  document.getElementById('dash-copy-treasury')?.addEventListener('click', (e) => {
    copyText(config.presaleWallet?.address || '', e.target);
  });

  document.querySelectorAll('.copy-wallet-btn').forEach((btn) => {
    btn.addEventListener('click', () => copyText(btn.dataset.address, btn));
  });

  updateTimeline();
  updateDashboard();
  setInterval(() => {
    updateTimeline();
    updateDashboard();
  }, 60000);
})();
