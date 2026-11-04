// 7.5 Champ de 1 200 particules (2 px) en WebGL natif
const PARTICLE_COUNT = 1200;

const VERT_SRC = `
attribute vec2 a_base;
attribute vec2 a_seed;

uniform vec2 u_res;
uniform float u_dpr;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_pointerActive;
uniform float u_scrollOffset;

varying float v_influence;

void main() {
  // Position de base en pixels
  vec2 pos = a_base * u_res;

  // Dérive lente permanente (en mouvement réduit u_time = 0.0)
  float driftX = sin(u_time * 0.55 + a_seed.x * 6.2831853) * 7.5
               + cos(u_time * 0.32 + a_seed.y * 6.2831853) * 4.0;
  float driftY = cos(u_time * 0.48 + a_seed.y * 6.2831853) * 7.5
               + sin(u_time * 0.29 + a_seed.x * 6.2831853) * 4.0;

  pos += vec2(driftX, driftY);

  // Décalage doux lié au défilement avec repliement torique vertical
  pos.y = mod(pos.y - u_scrollOffset * (0.18 + a_seed.x * 0.14), max(1.0, u_res.y));

  // Interaction dans un rayon de 160 px autour du pointeur (ou de l'onde mobile au défilement)
  vec2 delta = pos - u_pointer;
  float dist = length(delta);
  float radius = 160.0;
  float inf = 0.0;

  if (dist < radius && u_pointerActive > 0.001) {
    float t = 1.0 - (dist / radius);
    inf = t * t * (3.0 - 2.0 * t) * u_pointerActive;
    vec2 dir = dist > 0.001 ? (delta / dist) : vec2(0.0, 1.0);
    // Les points s'écartent légèrement autour du pointeur
    pos += dir * (inf * 22.0);
  }

  v_influence = inf;

  // Conversion pixels -> clip space [-1, 1]
  vec2 clip = (pos / max(vec2(1.0), u_res)) * 2.0 - 1.0;
  clip.y = -clip.y;

  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = (2.0 + inf * 1.5) * u_dpr;
}
`;

const FRAG_SRC = `
precision mediump float;

varying float v_influence;
uniform vec3 u_restColor;
uniform vec3 u_tintColor;

void main() {
  // Disque doux de 2 px
  vec2 c = gl_PointCoord - vec2(0.5);
  float r2 = dot(c, c);
  if (r2 > 0.25) discard;

  float edge = smoothstep(0.25, 0.08, r2);
  // Au repos : gris à 30 % d'opacité ; autour du pointeur : teinte de la section visible
  vec3 col = mix(u_restColor, u_tintColor, v_influence);
  float alpha = mix(0.30, 0.88, v_influence) * edge;

  gl_FragColor = vec4(col, alpha);
}
`;

type RGB = [number, number, number];

const TINTS_LIGHT: Record<string, RGB> = {
  care: [11 / 255, 122 / 255, 90 / 255], // #0B7A5A
  'cc-care': [11 / 255, 122 / 255, 90 / 255],
  autonomie: [10 / 255, 122 / 255, 136 / 255], // #0A7A88
  'autonomie-inclusion': [10 / 255, 122 / 255, 136 / 255],
  consulting: [212 / 255, 42 / 255, 58 / 255], // #D42A3A
  'cc-consulting': [212 / 255, 42 / 255, 58 / 255],
  events: [91 / 255, 75 / 255, 196 / 255], // #5B4BC4
  'cc-events': [91 / 255, 75 / 255, 196 / 255],
};

const TINTS_DARK: Record<string, RGB> = {
  care: [79 / 255, 209 / 255, 165 / 255], // #4FD1A5
  'cc-care': [79 / 255, 209 / 255, 165 / 255],
  autonomie: [79 / 255, 214 / 255, 232 / 255], // #4FD6E8
  'autonomie-inclusion': [79 / 255, 214 / 255, 232 / 255],
  consulting: [255 / 255, 107 / 255, 117 / 255], // #FF6B75
  'cc-consulting': [255 / 255, 107 / 255, 117 / 255],
  events: [169 / 255, 155 / 255, 255 / 255], // #A99BFF
  'cc-events': [169 / 255, 155 / 255, 255 / 255],
};

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function buildParticleBuffers(): Float32Array {
  // 1 200 particules réparties sur une grille stratifiée (40 x 30 = 1 200) avec gigue déterministe
  const cols = 40;
  const rows = 30;
  const data = new Float32Array(PARTICLE_COUNT * 4);
  let idx = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idx >= PARTICLE_COUNT) break;
      const i = idx * 4;
      // Pseudo-aléatoire déterministe pour éviter tout saut visuel
      const s1 = Math.sin((idx + 1) * 12.9898) * 43758.5453;
      const s2 = Math.sin((idx + 1) * 78.233) * 43758.5453;
      const randX = s1 - Math.floor(s1);
      const randY = s2 - Math.floor(s2);

      const bx = (c + 0.15 + randX * 0.7) / cols;
      const by = (r + 0.15 + randY * 0.7) / rows;

      data[i] = bx;
      data[i + 1] = by;
      data[i + 2] = randX;
      data[i + 3] = randY;
      idx++;
    }
  }
  return data;
}

export function initLivingMeshes(): () => void {
  const canvases = document.querySelectorAll<HTMLCanvasElement>('canvas[data-living-mesh]');
  if (!canvases.length) return () => {};

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(hover: none)').matches;
  const particleData = buildParticleBuffers();
  const cleanups: Array<() => void> = [];

  canvases.forEach((canvas) => {
    const wrap = canvas.closest<HTMLElement>('[data-particle-wrap]');
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    wrap?.classList.add('has-webgl');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.STATIC_DRAW);

    const aBase = gl.getAttribLocation(prog, 'a_base');
    const aSeed = gl.getAttribLocation(prog, 'a_seed');
    gl.enableVertexAttribArray(aBase);
    gl.vertexAttribPointer(aBase, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aSeed);
    gl.vertexAttribPointer(aSeed, 2, gl.FLOAT, false, 16, 8);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uDpr = gl.getUniformLocation(prog, 'u_dpr');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uPointer = gl.getUniformLocation(prog, 'u_pointer');
    const uPointerActive = gl.getUniformLocation(prog, 'u_pointerActive');
    const uScrollOffset = gl.getUniformLocation(prog, 'u_scrollOffset');
    const uRestColor = gl.getUniformLocation(prog, 'u_restColor');
    const uTintColor = gl.getUniformLocation(prog, 'u_tintColor');

    let cssW = 1;
    let cssH = 1;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = Math.max(64, rect.width);
      cssH = Math.max(64, rect.height);
      const w = Math.floor(cssW * dpr);
      const h = Math.floor(cssH * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();

    let targetX = cssW * 0.5;
    let targetY = cssH * 0.45;
    let currentX = targetX;
    let currentY = targetY;
    let pointerActiveTarget = isCoarsePointer ? 0.85 : 0.0;
    let pointerActiveCurrent = pointerActiveTarget;
    let scrollYVal = window.scrollY;

    let activeSectionTintKey =
      wrap?.getAttribute('data-default-tint') ||
      document.documentElement.getAttribute('data-activity') ||
      'care';

    const resolveTargetTint = (isLight: boolean): RGB => {
      const map = isLight ? TINTS_LIGHT : TINTS_DARK;
      return map[activeSectionTintKey] || map.care;
    };

    const isLightInitial = document.documentElement.getAttribute('data-theme') !== 'dark';
    const initialTint = resolveTargetTint(isLightInitial);
    let currentTintR = initialTint[0];
    let currentTintG = initialTint[1];
    let currentTintB = initialTint[2];

    let isVisible = true;
    let rafId = 0;
    let lastFrameTime = 0;
    const startTime = performance.now();

    const updateVisibleSectionTint = () => {
      const defaultTint =
        wrap?.getAttribute('data-default-tint') ||
        document.documentElement.getAttribute('data-activity');
      const tintedEls = document.querySelectorAll<HTMLElement>('[data-particle-tint]');
      if (!tintedEls.length) {
        if (defaultTint) activeSectionTintKey = defaultTint;
        return;
      }
      const vh = window.innerHeight || 1;
      const center = vh * 0.5;
      let bestKey = defaultTint || 'care';
      let bestDist = Infinity;

      tintedEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) {
          const mid = (r.top + r.bottom) * 0.5;
          const dist = Math.abs(mid - center);
          if (dist < bestDist) {
            bestDist = dist;
            bestKey = el.getAttribute('data-particle-tint') || bestKey;
          }
        }
      });
      activeSectionTintKey = bestKey;
    };

    const drawFrame = (now: number) => {
      const isLight = document.documentElement.getAttribute('data-theme') !== 'dark';
      const elapsed = prefersReducedMotion ? 0.0 : (now - startTime) * 0.001;

      // Lissage 0,08 exigé en 7.5
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      pointerActiveCurrent += (pointerActiveTarget - pointerActiveCurrent) * 0.08;

      const targetTint = resolveTargetTint(isLight);
      currentTintR += (targetTint[0] - currentTintR) * 0.08;
      currentTintG += (targetTint[1] - currentTintG) * 0.08;
      currentTintB += (targetTint[2] - currentTintB) * 0.08;

      // Couleur au repos : gris #0B0D12 en clair, #F4F6FA en sombre (opacité 30 % appliquée dans le shader)
      const restR = isLight ? 11 / 255 : 244 / 255;
      const restG = isLight ? 13 / 255 : 246 / 255;
      const restB = isLight ? 18 / 255 : 250 / 255;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(uRes, cssW, cssH);
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uPointer, currentX, currentY);
      gl.uniform1f(uPointerActive, prefersReducedMotion ? 0.0 : pointerActiveCurrent);
      gl.uniform1f(uScrollOffset, prefersReducedMotion ? 0.0 : scrollYVal);
      gl.uniform3f(uRestColor, restR, restG, restB);
      gl.uniform3f(uTintColor, currentTintR, currentTintG, currentTintB);

      gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
    };

    updateVisibleSectionTint();
    drawFrame(startTime);

    // En mouvement réduit : trame fixe (rendu uniquement si le thème ou la taille change)
    if (prefersReducedMotion) {
      const onThemeMut = new MutationObserver(() => drawFrame(performance.now()));
      onThemeMut.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
      const onResizeReduced = () => {
        resize();
        drawFrame(performance.now());
      };
      window.addEventListener('resize', onResizeReduced, { passive: true });
      cleanups.push(() => {
        onThemeMut.disconnect();
        window.removeEventListener('resize', onResizeReduced);
      });
      return;
    }

    const loop = (now: number) => {
      if (!isVisible || document.hidden) return;
      rafId = requestAnimationFrame(loop);
      // Plafond strict à 30 images/s (33,3 ms)
      if (now - lastFrameTime < 33.3) return;
      lastFrameTime = now;
      drawFrame(now);
    };

    const startLoop = () => {
      if (!rafId && isVisible && !document.hidden) {
        rafId = requestAnimationFrame(loop);
      }
    };

    const stopLoop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      pointerActiveTarget = 1.0;

      // Si le curseur survole une carte avec [data-particle-tint], utilise sa teinte immédiatement
      const hoveredTintEl = (e.target as HTMLElement | null)?.closest?.('[data-particle-tint]');
      if (hoveredTintEl) {
        const key = hoveredTintEl.getAttribute('data-particle-tint');
        if (key) activeSectionTintKey = key;
      }
    };

    const onScroll = () => {
      scrollYVal = window.scrollY;
      updateVisibleSectionTint();
      // Sur mobile, réaction au défilement au lieu du pointeur
      if (isCoarsePointer) {
        const phase = scrollYVal * 0.004;
        targetX = cssW * (0.5 + Math.sin(phase) * 0.28);
        targetY = cssH * (0.45 + Math.cos(phase * 0.8) * 0.22);
        pointerActiveTarget = 0.9;
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) startLoop();
          else stopLoop();
        });
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    const onVisChange = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisChange);

    startLoop();

    cleanups.push(() => {
      stopLoop();
      io.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisChange);
    });
  });

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
