// Champ de petits traits réactif à la souris (esprit « page vivante »).
// Palettes par activité : [rgb, opacité de repos]
const PALETTES = {
  consulting: {
    clair: [['20,20,20', 0.32], ['85,89,95', 0.3], ['180,35,42', 0.55], ['185,138,78', 0.55], ['154,161,169', 0.35]],
    sombre: [['242,242,243', 0.28], ['164,168,176', 0.3], ['224,72,79', 0.6], ['217,185,138', 0.55], ['120,126,134', 0.35]],
  },
  events: {
    clair: [['20,20,20', 0.3], ['91,75,196', 0.5], ['201,160,74', 0.6], ['120,126,134', 0.3], ['214,120,170', 0.4]],
    sombre: [['242,242,243', 0.26], ['164,152,242', 0.55], ['233,196,110', 0.6], ['120,126,134', 0.32], ['240,150,200', 0.45]],
  },
  care: {
    clair: [['20,20,20', 0.26], ['43,93,156', 0.45], ['90,154,58', 0.45], ['201,160,74', 0.5], ['214,130,110', 0.45]],
    sombre: [['242,242,243', 0.24], ['110,160,220', 0.5], ['130,200,100', 0.5], ['233,196,110', 0.55], ['240,160,140', 0.5]],
  },
};

export function mountField(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let theme = opts.theme === 'sombre' ? 'sombre' : 'clair';
  const palKey = PALETTES[opts.palette] ? opts.palette : 'consulting';
  let W = 0, H = 0, dpr = 1, parts = [];
  const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, active: 0, target: 0 };
  let lastScroll = window.scrollY || 0, raf = 0, t0 = performance.now();

  function build() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(1300, Math.round((W * H) / 1500));
    const pal = PALETTES[palKey][theme];
    parts = [];
    for (let i = 0; i < n; i++) {
      // distribution un peu plus dense à droite et en bas, plus aérée derrière le texte
      let x = Math.random() * W, y = Math.random() * H;
      if (x < W * 0.45 && Math.random() < 0.45) x = W * 0.45 + Math.random() * W * 0.55;
      const c = pal[Math.random() < 0.7 ? (Math.random() < 0.5 ? 0 : 1) : 2 + Math.floor(Math.random() * 3)];
      parts.push({ hx: x, hy: y, x, y, vx: 0, vy: 0, a: Math.random() * Math.PI, len: 3 + Math.random() * 6, rgb: c[0], al: c[1], ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.8 });
    }
  }

  function onMove(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    if (mouse.sx < -1000) { mouse.sx = mouse.x; mouse.sy = mouse.y; }
    mouse.target = 1;
  }
  function onLeave() { mouse.target = 0; }
  function onScroll() {
    const y = window.scrollY || 0, dy = y - lastScroll; lastScroll = y;
    const k = Math.max(-40, Math.min(40, dy)) * 0.06;
    for (const p of parts) p.vy -= k * p.sp;
  }

  function frame(now) {
    raf = 0;
    const t = (now - t0) / 1000;
    mouse.sx += (mouse.x - mouse.sx) * 0.09; mouse.sy += (mouse.y - mouse.sy) * 0.09;
    mouse.active += (mouse.target - mouse.active) * 0.04;
    const R = Math.min(W, H) * 0.16 + 40;
    const R2 = R * 2.4;
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    for (const p of parts) {
      // dérive lente façon champ de flux
      const fx = Math.sin(p.hy * 0.004 + t * 0.35 * p.sp + p.ph) * 14;
      const fy = Math.cos(p.hx * 0.004 + t * 0.3 * p.sp + p.ph) * 14;
      let ax = (p.hx + fx - p.x) * 0.012, ay = (p.hy + fy - p.y) * 0.012;
      let flowA = Math.atan2(Math.cos(p.hx * 0.003 + t * 0.2), Math.sin(p.hy * 0.003 - t * 0.2));
      let glow = 0;
      if (mouse.active > 0.01) {
        const dx = p.x - mouse.sx, dy = p.y - mouse.sy, d = Math.hypot(dx, dy) || 0.001;
        if (d < R2) {
          const f = (1 - d / R2) * mouse.active;
          const nx = dx / d, ny = dy / d;
          // attirées vers un anneau autour du curseur
          const ring = (R - d) * 0.035 * f;
          ax += nx * ring; ay += ny * ring;
          // tourbillon tangent
          ax += -ny * 0.9 * f * p.sp; ay += nx * 0.9 * f * p.sp;
          flowA = flowA * (1 - f) + Math.atan2(nx, -ny) * f;
          glow = Math.max(0, 1 - Math.abs(d - R) / (R * 0.6)) * mouse.active;
        }
      }
      p.vx = (p.vx + ax) * 0.88; p.vy = (p.vy + ay) * 0.88;
      p.x += p.vx; p.y += p.vy;
      // orientation lissée
      let da = flowA - p.a; da = Math.atan2(Math.sin(da), Math.cos(da));
      p.a += da * 0.1;
      const l = p.len * (1 + glow * 0.9);
      const cx = Math.cos(p.a) * l * 0.5, cy = Math.sin(p.a) * l * 0.5;
      ctx.strokeStyle = 'rgba(' + p.rgb + ',' + Math.min(0.95, p.al + glow * 0.45).toFixed(3) + ')';
      ctx.lineWidth = 1.5 + glow * 0.6;
      ctx.beginPath(); ctx.moveTo(p.x - cx, p.y - cy); ctx.lineTo(p.x + cx, p.y + cy); ctx.stroke();
    }
    if (!reduce) raf = requestAnimationFrame(frame);
  }

  const ro = new ResizeObserver(() => { build(); if (reduce) frame(performance.now()); });
  ro.observe(canvas);
  build();
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  function onVis() { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf && !reduce) raf = requestAnimationFrame(frame); }
  document.addEventListener('visibilitychange', onVis);
  raf = requestAnimationFrame(frame);

  return {
    setTheme(th) { theme = th === 'sombre' ? 'sombre' : 'clair'; build(); },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll, { capture: true });
      document.removeEventListener('visibilitychange', onVis);
    }
  };
}
