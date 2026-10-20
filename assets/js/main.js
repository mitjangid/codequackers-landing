const hoverable = window.matchMedia('(hover: hover)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
// Motion preference: enabled by default for all visitors. Can be disabled via ?motion=0 or localStorage 'cq_motion' = 'reduce'
const isMotionDisabled = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('motion') === '0' || params.get('reduce') === '1') return true;
    if (localStorage.getItem('cq_motion') === 'reduce') return true;
  } catch (e) {}
  return false;
};
if (isMotionDisabled()) {
  document.documentElement.classList.add('reduce-motion');
}
const prefersReduced = () => document.documentElement.classList.contains('reduce-motion');
const DEFAULT_TITLE = document.title;

// Scroll: nav state, progress bar, back-to-top
const nav = document.getElementById('nav');
const progress = document.getElementById('progress');
const backTop = document.getElementById('backTop');
const heroGrid = document.querySelector('.hero-grid');
const onScroll = () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
  if (progress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  }
  if (backTop) backTop.classList.toggle('show', window.scrollY > 600);
  if (heroGrid) {
    if (prefersReduced()) {
      heroGrid.style.opacity = '';
      heroGrid.style.transform = '';
    } else {
      const h = heroGrid.offsetHeight + 240;
      const p = Math.min(window.scrollY / h, 1);
      heroGrid.style.opacity = Math.max(0, 1 - p * 1.2).toFixed(3);
      heroGrid.style.transform = 'translateY(' + (window.scrollY * .22).toFixed(1) + 'px)';
    }
  }
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' }));

// Mobile menu
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
if (menuBtn && navLinks) {
  const toggleMenu = open => {
    navLinks.classList.toggle('open', open);
    menuBtn.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
    document.body.classList.toggle('menu-open', open);
  };
  menuBtn.addEventListener('click', () => {
    toggleMenu(!navLinks.classList.contains('open'));
  });
  // Escape closes the mobile menu and returns focus to its toggle
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      toggleMenu(false);
      menuBtn.focus();
    }
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    toggleMenu(false);
  }));
  document.addEventListener('click', e => {
    if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
      toggleMenu(false);
    }
  });
}

// Typewriter
const typedEl = document.querySelector('.typed');
const words = ['insanely fast SaaS', 'production web apps', 'gym management systems', 'restaurant RMS & POS', 'mobile apps in React Native', 'real-time bullion tickers', 'full-stack platforms', 'software that actually ships'];
if (typedEl) {
  if (prefersReduced()) {
    typedEl.textContent = words[0];
  } else {
    let wi = 0, ci = 0, deleting = false;
    (function tick() {
      if (prefersReduced()) { typedEl.textContent = words[0]; return; }
      const word = words[wi];
      ci += deleting ? -1 : 1;
      typedEl.textContent = word.slice(0, ci);
      let delay = deleting ? 42 : 92;
      if (!deleting && ci === word.length) { delay = 1700; deleting = true; }
      else if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % words.length; delay = 350; }
      setTimeout(tick, delay);
    })();
  }
}

// Chip constellation: connect each floating product chip to the next (and close the
// ring back to the first). The lines are redrawn every frame because the chips bob on
// independent phases — static lines would drift off their anchors within a second.
const heroVisual = document.querySelector('.hero-visual');
if (heroVisual && heroVisual.querySelector('.chip-web')) {
  const webBase = heroVisual.querySelector('.web-base');
  const webFlow = heroVisual.querySelector('.web-flow');
  const chips = [...heroVisual.querySelectorAll('.chip')];
  const duckGs = [...heroVisual.querySelectorAll('.web-duck')];
  const drawWeb = () => {
    const vr = heroVisual.getBoundingClientRect();
    const pts = chips.map(c => {
      const r = c.getBoundingClientRect();
      return [(r.left + r.right) / 2 - vr.left, (r.top + r.bottom) / 2 - vr.top];
    });
    let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (let i = 1; i < pts.length; i++) d += 'L' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
    webBase.setAttribute('d', d + 'Z');
    webFlow.setAttribute('d', d + 'Z');
  };
  if (prefersReduced()) {
    // Chips hold still under reduced motion, so one draw (plus resize/load re-draws) is enough.
    drawWeb();
    addEventListener('resize', drawWeb);
    addEventListener('load', drawWeb);
  } else {
    let webRaf = 0, webRunning = false, lastT = 0, travel = 0;
    const webLoop = now => {
      drawWeb();
      // Ducks waddle the ring, feet on the wire, flipping to face their direction of travel.
      const dt = Math.min(now - lastT, 100); lastT = now;
      const L = webBase.getTotalLength();
      if (L > 0 && duckGs.length) {
        travel = (travel + dt * .055) % L;
        duckGs.forEach((g, i) => {
          const at = (travel + i * L / duckGs.length) % L;
          const p = webBase.getPointAtLength(at);
          const q = webBase.getPointAtLength((at + 2) % L);
          g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')' + (q.x < p.x ? ' scale(-1 1)' : ''));
        });
      }
      webRaf = requestAnimationFrame(webLoop);
    };
    // Burn no frames while the hero is scrolled away (or display:none on a legal page).
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !webRunning) { webRunning = true; webRaf = requestAnimationFrame(webLoop); }
        else if (!e.isIntersecting && webRunning) { webRunning = false; cancelAnimationFrame(webRaf); }
      });
    }).observe(heroVisual);
  }
}

// Count-up stats
const animCount = el => {
  const target = +el.dataset.count, suffix = el.dataset.suffix || '';
  const dur = 1300, t0 = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  const step = now => {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(ease(p) * target) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
const cio = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { animCount(e.target); cio.unobserve(e.target); }
  });
}, { threshold: .6 });
document.querySelectorAll('[data-count]').forEach(el => {
  const suffix = el.dataset.suffix || '';
  if (prefersReduced()) { el.textContent = el.dataset.count + suffix; return; }
  el.textContent = '0' + suffix;
  cio.observe(el);
});

// Reveal on scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));

// Card spotlight + 3D tilt
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    if (hoverable && !prefersReduced() && card.classList.contains('tilt')) {
      const rx = ((e.clientY - r.top) / r.height - .5) * -9;
      const ry = ((e.clientX - r.left) / r.width - .5) * 9;
      card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-4px)';
    }
  });
  card.addEventListener('pointerleave', () => { card.style.transform = ''; });
});

// Click delegation on project & client cards to navigate to deep-dive overview
document.querySelectorAll('.projects-grid .card, .client-grid .card').forEach(card => {
  card.addEventListener('click', e => {
    if (e.target.closest('a') || e.target.closest('button')) return;
    const studyLink = card.querySelector('.card-case-study') || card.querySelector('h3 a');
    if (studyLink && studyLink.href) {
      window.location.href = studyLink.href;
    }
  });
});


// Magnetic buttons
if (hoverable) {
  document.querySelectorAll('.magnetic').forEach(b => {
    b.addEventListener('pointermove', e => {
      if (prefersReduced()) { b.style.transform = ''; return; }
      const r = b.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * .15;
      const dy = (e.clientY - (r.top + r.height / 2)) * .15;
      b.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

// Portfolio category filtering
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('#work .projects-grid .card');
if (filterBtns.length && projectCards.length) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      projectCards.forEach(card => {
        const cat = card.dataset.category;
        if (filter === 'all' || !cat || cat === filter || card.classList.contains('card-coming')) {
          card.removeAttribute('data-hidden');
        } else {
          card.setAttribute('data-hidden', 'true');
        }
      });
    });
  });
}

// Click-to-copy terminal & package commands
document.querySelectorAll('.oss code').forEach(code => {
  code.style.cursor = 'pointer';
  code.title = 'Click to copy command';
  code.addEventListener('click', async () => {
    const raw = code.textContent.trim();
    if (raw.startsWith('✓')) return;
    try {
      await navigator.clipboard.writeText('pip install kalagana');
      const prev = code.textContent;
      code.textContent = '✓ Copied to clipboard!';
      code.style.color = 'var(--teal)';
      setTimeout(() => {
        code.textContent = prev;
        code.style.color = '';
      }, 2200);
    } catch (e) {}
  });
});

// Prefill message on engagement button click
document.querySelectorAll('[data-model]').forEach(btn => {
  btn.addEventListener('click', () => {
    const msg = document.getElementById('fMsg');
    if (msg) {
      msg.value = 'Hi CodeQuackers,\nI\'m interested in the ' + btn.dataset.model + '. We\'re looking to build…';
      msg.focus();
    }
  });
});

// Nav scrollspy: dynamically highlight active section link
const navSectionIds = ['services', 'why-us', 'work', 'engagement', 'about', 'faq', 'contact'];
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
const sectionMap = new Map();
navSectionIds.forEach(id => {
  const el = document.getElementById(id);
  if (el) sectionMap.set(el, id);
});

if (sectionMap.size && 'IntersectionObserver' in window) {
  const spyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navAnchors.forEach(a => {
          if (a.getAttribute('href') === '#' + id) a.classList.add('active');
          else a.classList.remove('active');
        });
      }
    });
  }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });

  sectionMap.forEach((id, el) => spyObserver.observe(el));
}

// ---- Supercharged FX ----

// Hash router: legacy #/terms and #/privacy redirect to standalone pages
const route = () => {
  const m = location.hash.match(/^#\/(terms|privacy)$/);
  if (m) {
    location.replace(m[1] + '.html');
    return;
  }
  document.title = DEFAULT_TITLE;
  if (location.hash.length > 1 && !location.hash.startsWith('#/')) {
    const t = document.querySelector(location.hash);
    if (t) requestAnimationFrame(() => t.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth' }));
  }
};
window.addEventListener('hashchange', route);
route();

// Ambient particle field
const fxCanvas = document.getElementById('fx');
let startFx = () => {}, stopFx = () => {};
if (fxCanvas && fxCanvas.getContext) {
  const ctx = fxCanvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, parts = [], rafId = null;
  const resize = () => {
    W = fxCanvas.width = Math.round(innerWidth * DPR);
    H = fxCanvas.height = Math.round(innerHeight * DPR);
    fxCanvas.style.width = innerWidth + 'px';
    fxCanvas.style.height = innerHeight + 'px';
    const count = Math.min(70, Math.round((innerWidth * innerHeight) / 16000));
    parts = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: (Math.random() * 1.5 + .6) * DPR,
      vx: (Math.random() - .5) * .4 * DPR,
      vy: (Math.random() - .5) * .4 * DPR,
      ph: Math.random() * Math.PI * 2,
      tw: Math.random() * .02 + .006,
      hue: Math.random() < .55 ? '255,154,60' : '53,224,192',
      base: Math.random() * .45 + .2
    }));
  };
  const LINK = 120 * DPR;
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.ph += p.tw;
      if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.hue + ',' + (p.base + Math.sin(p.ph) * .18).toFixed(3) + ')';
      ctx.fill();
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,154,60,0.045)';
    ctx.beginPath();
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const a = parts[i], b = parts[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        if (dx * dx + dy * dy < LINK * LINK) {
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
      }
    }
    ctx.stroke();
    rafId = requestAnimationFrame(tick);
  };
  startFx = () => { if (rafId) return; resize(); tick(); };
  stopFx = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    ctx.clearRect(0, 0, W, H);
  };
  window.addEventListener('resize', () => { if (rafId) resize(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopFx();
    else if (!prefersReduced()) startFx();
  });
  if (!prefersReduced()) startFx();
}

// Cursor glow (desktop pointers only)
const glow = document.getElementById('cursorGlow');
let startGlow = () => {}, stopGlow = () => {};
if (glow && finePointer) {
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, gRaf = null;
  window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  startGlow = () => {
    if (gRaf) return;
    glow.classList.add('on');
    (function glowLoop() {
      gx += (tx - gx) * .14; gy += (ty - gy) * .14;
      glow.style.transform = 'translate(' + (gx - 260).toFixed(1) + 'px,' + (gy - 260).toFixed(1) + 'px)';
      gRaf = requestAnimationFrame(glowLoop);
    })();
  };
  stopGlow = () => {
    if (gRaf) cancelAnimationFrame(gRaf);
    gRaf = null;
    glow.classList.remove('on');
  };
  if (!prefersReduced()) startGlow();
}

// Intro splash (once per session)
const introEl = document.getElementById('intro');
if (introEl && !prefersReduced()) {
  let seen = false;
  try { seen = !!sessionStorage.getItem('cq_intro'); sessionStorage.setItem('cq_intro', '1'); } catch (e) {}
  if (!seen) {
    introEl.classList.add('show');
    setTimeout(() => introEl.classList.add('out'), 1800);
    setTimeout(() => introEl.classList.remove('show', 'out'), 2600);
  }
}

// Scramble section titles
const titleScramble = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && !e.target.dataset.scrambled) { scrambleTitle(e.target); titleScramble.unobserve(e.target); }
  });
}, { threshold: .35 });
document.querySelectorAll('.section-title').forEach(el => { if (!el.children.length) titleScramble.observe(el); });
function scrambleTitle(el) {
  if (prefersReduced()) return;
  el.dataset.scrambled = '1';
  const text = el.textContent;
  const chars = '!<>-_\\/[]{}—=+*^?#';
  const total = Math.max(10, Math.min(18, text.length));
  let frame = 0;
  const timer = setInterval(() => {
    frame++;
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      out += c === ' ' ? ' ' : (frame >= Math.floor((i / text.length) * total) ? c : chars[Math.floor(Math.random() * chars.length)]);
    }
    el.textContent = out;
    if (frame >= total) { clearInterval(timer); el.textContent = text; }
  }, 26);
}

// Easter egg: type "quack" for a duck rain
let quackBuf = '';
const duckEmojis = ['🦆', '🐤', '🦢', '🥚'];
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key.length > 1) return;
  quackBuf = (quackBuf + e.key.toLowerCase()).slice(-5);
  if (quackBuf === 'quack') { quackBuf = ''; duckRain(); }
});
function duckRain() {
  if (prefersReduced()) return;
  for (let i = 0; i < 18; i++) {
    const d = document.createElement('span');
    d.className = 'fx-emoji';
    d.textContent = duckEmojis[Math.floor(Math.random() * duckEmojis.length)];
    d.style.left = (Math.random() * 96 + 2) + 'vw';
    d.style.fontSize = (Math.random() * 24 + 16) + 'px';
    d.style.setProperty('--rot', (Math.random() * 180 - 90) + 'deg');
    d.style.animationDuration = (Math.random() * 1.6 + 1.8) + 's';
    d.style.animationDelay = (Math.random() * .5) + 's';
    document.body.appendChild(d);
    d.addEventListener('animationend', () => d.remove());
  }
}

// Confetti burst
function burstConfetti(origin) {
  if (prefersReduced()) return;
  const r = origin.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const bits = ['🦆', '✦', '✨', '●', '★'];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('span');
    p.className = 'burst-piece';
    p.textContent = bits[Math.floor(Math.random() * bits.length)];
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.fontSize = (Math.random() * 14 + 12) + 'px';
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.random() * 160 + 60;
    p.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(0) + 'px');
    p.style.setProperty('--dy', (Math.sin(ang) * dist - 70).toFixed(0) + 'px');
    p.style.setProperty('--rot', (Math.random() * 540 - 270).toFixed(0) + 'deg');
    p.style.setProperty('--t', (Math.random() * .5 + .7).toFixed(2) + 's');
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
}

// Contact form → send the enquiry
// Supports direct delivery via Web3Forms, Formspree, or any JSON POST endpoint.
// To receive submissions directly in codequackers.in@gmail.com without opening a mail client,
// obtain a free access key from https://web3forms.com and paste it into WEB3FORMS_ACCESS_KEY.
// If left blank, the form automatically falls back to opening the visitor's mail client (mailto)
// and copying the draft to clipboard.
const WEB3FORMS_ACCESS_KEY = 'abfb3998-032e-4b86-87a2-2b0f5f6e675f'; 
const FORM_ENDPOINT = 'https://api.web3forms.com/submit';
const STUDIO_EMAIL = 'codequackers.in@gmail.com';
const cqForm = document.getElementById('cqForm');
const composeBody = f => {
  const name = f.name.value.trim();
  const email = f.email.value.trim();
  const msg = f.message.value.trim();
  return {
    subject: 'Project inquiry from ' + (name || 'someone'),
    body: 'Hi CodeQuackers,\n\n' + msg + '\n\n— ' + (name || '—') + (email ? ' (' + email + ')' : '')
  };
};
cqForm.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  // Botcheck honeypot: silently ignore bots
  if (f.botcheck && f.botcheck.checked) return;

  const { subject, body } = composeBody(f);
  const note = document.getElementById('formNote');
  const show = (html, isErr) => { note.hidden = false; note.classList.toggle('err', !!isErr); note.innerHTML = html; };
  const copyBtn = () => '<button type="button" class="copy-msg" id="copyMsg">Copy message</button>';
  const btn = f.querySelector('.form-submit');
  const busy = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Sending…';
  try {
    if (WEB3FORMS_ACCESS_KEY) {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          name: f.name.value.trim(),
          email: f.email.value.trim(),
          message: f.message.value.trim(),
          subject: subject,
          from_name: 'CodeQuackers Landing'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || 'HTTP ' + res.status);
      burstConfetti(btn);
      show('Message sent — we\'ll get back to you soon. <strong>Quack!</strong>');
      f.reset();
    } else {
      const mailto = 'mailto:' + STUDIO_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      const win = window.open(mailto, '_blank');
      if (win) win.close();
      const copied = await navigator.clipboard.writeText(body + '\n\n(To: ' + STUDIO_EMAIL + ')').then(() => true, () => false);
      if (copied) {
        show('Your email app should have opened with the message pre-filled — if not, it\'s <a href="mailto:' + STUDIO_EMAIL + '?subject=' + encodeURIComponent(subject) + '">ready to copy into any mail app</a>. ' + copyBtn());
      } else {
        show('Opening your email app… if nothing happens, write to <a href="mailto:' + STUDIO_EMAIL + '">' + STUDIO_EMAIL + '</a>. ' + copyBtn());
      }
      document.getElementById('copyMsg')?.addEventListener('click', () => navigator.clipboard.writeText('Subject: ' + subject + '\n\n' + body));
      burstConfetti(btn);
    }
  } catch (err) {
    show('Something went wrong sending the message — please email us directly at <a href="mailto:' + STUDIO_EMAIL + '">' + STUDIO_EMAIL + '</a>. ' + copyBtn(), true);
    document.getElementById('copyMsg')?.addEventListener('click', () => navigator.clipboard.writeText('Subject: ' + subject + '\n\n' + body));
  } finally {
    btn.disabled = false;
    btn.innerHTML = busy;
  }
});

// ---- The Pond: a flock of ducks living along the bottom of the screen ----
const pondStage = document.getElementById('pondDucks');
const pondBubbles = document.getElementById('pondBubbles');
let startPond = () => {}, stopPond = () => {};

if (pondStage) {
  const LINES = [
    'quack.', 'ship it', 'LGTM', 'it works on my machine', '404: worm not found',
    'deploy on a Friday?', 'rm -rf /breadcrumbs', 'brb, refactoring',
    'have you tried turning it off and on?', 'git commit -m "stuff"',
    'i only eat bugs', 'semicolons are a lifestyle',
    'rubber duck debugging is my whole job', 'explain it to me. slowly.',
    'it is not a bug, it is a feature', 'works locally. fails in prod.',
    'closing as wontfix', 'it is a DNS issue', 'that is a caching issue',
    'the tests pass. do not ask how.', 'reverting to the last commit that worked',
    'who wrote this? ...oh. me.', 'i will fix it in the next sprint',
    'have you read the error message?', 'just one more refactor, i promise',
    'i speak fluent stack trace', 'undefined is not a function',
    'nested ternaries are a crime', 'scope creep? never met her',
    'quack-driven development', 'waddle you do when prod breaks?',
    'duck tape > unit tests', 'bread-driven development',
    'feature or bug? quack.', 'i am the senior engineer here',
    'demo gods, please be kind'
  ];
  const ducks = [];
  const ptr = { x: -999, y: -999 };
  // keep clear of the back-to-top button parked in the bottom-right corner
  const bounds = () => ({ min: 30, max: Math.max(70, innerWidth - 100) });
  let raf = null, gen = 0, last = 0, clock = 0, boost = 0, lastScroll = window.scrollY;
  let rapid = 0, rapidUntil = 0, panicUntil = 0;

  function layout(d, t) {
    const y = Math.sin(t * 1.7 + d.phase) * d.bob;
    const tilt = d.face > 0 ? -2 : 2;
    d.el.style.transform = 'translate3d(' + (d.x - d.size / 2).toFixed(1) + 'px,' + y.toFixed(2) +
      'px,0) rotate(' + tilt + 'deg) scaleX(' + d.face + ')';
    if (d.bubble && d.bubble.classList.contains('show')) {
      // Keep the bubble on screen, then slide its tail so it still points at the duck
      const half = (d.bubbleW || d.bubble.offsetWidth) / 2;
      const lo = half + 8, hi = Math.max(lo, innerWidth - half - 8);
      const bx = Math.min(Math.max(d.x, lo), hi);
      d.bubble.style.left = bx.toFixed(0) + 'px';
      d.bubble.style.bottom = (d.size + 6) + 'px';
      const tail = Math.min(Math.max(d.x - bx + half, 14), half * 2 - 14);
      d.bubble.style.setProperty('--tail', tail.toFixed(0) + 'px');
    }
  }

  let lastLine = -1;
  function pickLine() {
    let i = (Math.random() * LINES.length) | 0;
    if (LINES.length > 1 && i === lastLine) i = (i + 1) % LINES.length;   // never twice in a row
    lastLine = i;
    return LINES[i];
  }

  function say(d, text) {
    if (!pondBubbles) return;
    if (!d.bubble) {
      d.bubble = document.createElement('div');
      d.bubble.className = 'pond-bubble';
      pondBubbles.appendChild(d.bubble);
    }
    d.bubble.textContent = text || pickLine();
    d.bubbleW = d.bubble.offsetWidth;   // opacity:0 still has layout, so this measures correctly
    d.bubble.classList.add('show');
    clearTimeout(d.bubbleT);
    d.bubbleT = setTimeout(() => d.bubble && d.bubble.classList.remove('show'), 2400);
  }

  function play(d, cls, ms) {
    const inner = d.el.firstElementChild;
    if (!inner) return;
    inner.classList.remove('flip', 'spin', 'dive', 'squash', 'hop');
    void inner.offsetWidth;
    inner.classList.add(cls);
    setTimeout(() => inner.classList.remove(cls), ms);
  }

  function quirk(d) {
    const r = Math.random();
    if (r < .36) say(d);
    else if (r < .53) play(d, 'flip', 900);
    else if (r < .68) play(d, 'dive', 1000);
    else if (r < .83) play(d, 'spin', 900);
    else play(d, 'squash', 800);
  }

  function feather(d) {
    if (prefersReduced()) return;
    const f = document.createElement('span');
    f.className = 'pond-feather';
    f.textContent = '🪶';
    f.style.left = Math.round(d.x) + 'px';
    f.style.top = (innerHeight - 62) + 'px';
    f.style.setProperty('--fx', (Math.random() * 60 - 30).toFixed(0) + 'px');
    f.style.setProperty('--fr', (Math.random() * 400 - 200).toFixed(0) + 'deg');
    document.body.appendChild(f);
    f.addEventListener('animationend', () => f.remove());
  }

  function flock() {
    const want = innerWidth < 700 ? 3 : innerWidth < 1020 ? 4 : 5;
    while (ducks.length > want) {
      const d = ducks.pop();
      d.el.remove();
      if (d.bubble) d.bubble.remove();
      clearTimeout(d.bubbleT);
    }
    while (ducks.length < want) {
      const el = document.createElement('div');
      el.className = 'pond-duck';
      el.innerHTML = '<div class="pond-duck-in"><svg viewBox="0 0 64 64"><use href="#duckSprite"/></svg></div>';
      pondStage.appendChild(el);
      const size = 38 + Math.random() * 16;
      el.style.width = el.style.height = size.toFixed(0) + 'px';
      const b = bounds();
      const d = {
        el, size,
        x: b.min + Math.random() * (b.max - b.min),
        dir: Math.random() < .5 ? -1 : 1,
        face: 1,
        speed: 18 + Math.random() * 20,
        phase: Math.random() * 6.283,
        bob: 1.4 + Math.random() * 1.6,
        next: 1.5 + Math.random() * 4,
        bubble: null, bubbleT: null
      };
      d.face = d.dir;
      el.addEventListener('click', () => {
        say(d);
        play(d, 'hop', 620);
        feather(d);
        rapid = clock < rapidUntil ? rapid + 1 : 1;
        rapidUntil = clock + 1.6;
        if (rapid >= 3) { panicUntil = clock + 2.2; rapid = 0; }
      });
      ducks.push(d);
    }
  }

  function frame(now, g) {
    if (g !== gen) return;            // superseded by a later run or a stop
    const dt = Math.min(.05, (now - last) / 1000) || .016;
    last = now;
    clock += dt;

    // fast scrolling stirs them up
    const sy = window.scrollY, dv = Math.abs(sy - lastScroll);
    lastScroll = sy;
    if (dv > 1) boost = Math.min(2.6, boost + dv / 80);
    boost *= Math.pow(.10, dt);

    const b = bounds();
    const near = ptr.y > innerHeight - 170;
    const panic = clock < panicUntil;

    for (const d of ducks) {
      let mul = 1 + boost;
      d.face = d.dir;
      if (panic) mul = 3.4;
      if (near && !panic) {
        const dx = ptr.x - d.x, ad = Math.abs(dx);
        if (ad < 130) {
          d.face = dx >= 0 ? 1 : -1;                       // turn to look at the pointer
          if (ad < 62) { d.dir = dx >= 0 ? -1 : 1; d.face = d.dir; mul = 3.6; }  // scurry away
          else mul *= .10;                                  // freeze and stare
        }
      }
      d.x += d.dir * d.speed * mul * dt;
      if (d.x < b.min) { d.x = b.min; d.dir = 1; }
      else if (d.x > b.max) { d.x = b.max; d.dir = -1; }

      d.next -= dt;
      if (d.next <= 0) {
        d.next = 2.5 + Math.random() * 4.5;
        if (!(d.bubble && d.bubble.classList.contains('show'))) quirk(d);
      }
      layout(d, clock);
    }
    raf = requestAnimationFrame(t => frame(t, g));
  }

  window.addEventListener('pointermove', e => { ptr.x = e.clientX; ptr.y = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', () => { ptr.x = -999; ptr.y = -999; });
  window.addEventListener('pointerup', () => { ptr.x = -999; ptr.y = -999; }, { passive: true });
  window.addEventListener('touchend', () => { ptr.x = -999; ptr.y = -999; }, { passive: true });
  window.addEventListener('resize', flock);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPond();
    else if (!prefersReduced()) startPond();
  });

  flock();
  // Position them once up front so they are never stacked at the left edge
  // waiting for the first animation frame.
  if (prefersReduced()) ducks.forEach(d => { d.bob = 0; });
  ducks.forEach(d => layout(d, 0));

  startPond = () => {
    if (raf || prefersReduced()) return;
    ducks.forEach(d => { if (!d.bob) d.bob = 1.4 + Math.random() * 1.6; });
    const g = ++gen;
    last = performance.now();
    raf = requestAnimationFrame(t => frame(t, g));
  };
  stopPond = () => {
    gen++;                            // invalidate any frame already in flight
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  };
  if (!prefersReduced()) startPond();
}

// React live if the motion preference changes mid-session
const onMotionPreferenceChange = () => {
  if (prefersReduced()) { stopFx(); stopGlow(); stopPond(); }
  else { startFx(); startGlow(); startPond(); }
  onScroll();
};
window.addEventListener('storage', e => {
  if (e.key === 'cq_motion') {
    document.documentElement.classList.toggle('reduce-motion', e.newValue === 'reduce');
    onMotionPreferenceChange();
  }
});
window.addEventListener('cq-motion-change', onMotionPreferenceChange);
