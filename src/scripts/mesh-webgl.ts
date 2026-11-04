const VERT_SRC = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// Fragment shader unique avec bruit simplex 2D et 4 taches de couleur
const FRAG_SRC = `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_light;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  // Cycle lent de 14 s (respiration douce)
  float phase = u_time * (6.2831853 / 14.0);
  float n1 = snoise(v_uv * 1.35 + vec2(cos(phase) * 0.18, sin(phase) * 0.18));
  float n2 = snoise(v_uv * 1.8 - vec2(sin(phase * 0.7) * 0.14, cos(phase * 0.7) * 0.14));

  vec2 uv = v_uv + vec2(n1, n2) * 0.06;

  // Palette Sombre : graphite #1A1E21, or #C9A24B (18%), bleu nuit #1D2A3A, bronze #3A2E1A
  vec3 d_base = vec3(0.102, 0.118, 0.129);
  vec3 d_navy = vec3(0.114, 0.165, 0.227);
  vec3 d_bronze = vec3(0.227, 0.180, 0.102);
  vec3 gold = vec3(0.788, 0.635, 0.294);

  // Palette Claire : #F6F4EF, or (14%), #E9E4D8, #EFE7D6
  vec3 l_base = vec3(0.965, 0.957, 0.937);
  vec3 l_warm1 = vec3(0.914, 0.894, 0.847);
  vec3 l_warm2 = vec3(0.937, 0.906, 0.839);

  vec3 baseCol = mix(d_base, l_base, u_light);
  vec3 spot2Col = mix(d_navy, l_warm1, u_light);
  vec3 spot3Col = mix(d_bronze, l_warm2, u_light);
  float goldAlpha = mix(0.18, 0.14, u_light);

  vec2 pNavy = vec2(0.24 + cos(phase) * 0.06, 0.68 + sin(phase) * 0.06);
  vec2 pBronze = vec2(0.76 - sin(phase) * 0.06, 0.26 + cos(phase) * 0.06);
  vec2 pGold = vec2(0.62, 0.52) + u_pointer;

  float wNavy = smoothstep(0.72, 0.0, length(uv - pNavy));
  float wBronze = smoothstep(0.70, 0.0, length(uv - pBronze));
  float wGold = smoothstep(0.58, 0.0, length(uv - pGold)) * goldAlpha;

  vec3 col = baseCol;
  col = mix(col, spot2Col, wNavy * 0.75);
  col = mix(col, spot3Col, wBronze * 0.65);
  col = mix(col, gold, wGold);

  gl_FragColor = vec4(col, 1.0);
}
`;

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

export function initLivingMeshes(): () => void {
  const canvases = document.querySelectorAll<HTMLCanvasElement>('canvas[data-living-mesh]');
  if (!canvases.length) return () => {};

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cleanups: Array<() => void> = [];

  canvases.forEach((canvas) => {
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    });
    if (!gl) return; // Le repli CSS reste visible

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

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uPointer = gl.getUniformLocation(prog, 'u_pointer');
    const uLight = gl.getUniformLocation(prog, 'u_light');

    const resize = () => {
      // Rendu à 0,5x la résolution pour un coût GPU minimal
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.5;
      const w = Math.max(64, Math.floor(rect.width * dpr));
      const h = Math.max(64, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isVisible = true;
    let rafId = 0;
    let lastFrameTime = 0;
    const startTime = performance.now();

    const drawFrame = (now: number) => {
      const isLight =
        document.documentElement.getAttribute('data-theme') === 'light' ? 1.0 : 0.0;
      const elapsed = prefersReducedMotion ? 2.5 : (now - startTime) * 0.001;

      // Lissage lerp de 0,06 par image, amplitude limitée à 12 % de la largeur
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uPointer, currentX, currentY);
      gl.uniform1f(uLight, isLight);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    // Rendu immédiat d'une première image
    drawFrame(startTime);

    if (prefersReducedMotion) {
      const onThemeMut = new MutationObserver(() => drawFrame(performance.now()));
      onThemeMut.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
      cleanups.push(() => onThemeMut.disconnect());
      return;
    }

    const loop = (now: number) => {
      if (!isVisible || document.hidden) return;
      rafId = requestAnimationFrame(loop);
      // Plafond à 30 images/s maximum (33.3 ms)
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
      const nx = e.clientX / Math.max(1, window.innerWidth) - 0.5;
      const ny = 0.5 - e.clientY / Math.max(1, window.innerHeight);
      // Amplitude limitée à 12 % de la largeur
      targetX = Math.max(-0.12, Math.min(0.12, nx * 0.24));
      targetY = Math.max(-0.12, Math.min(0.12, ny * 0.24));
    };

    const onScroll = () => {
      if (window.matchMedia('(hover: none)').matches) {
        const progress =
          window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        targetY = (progress - 0.5) * 0.12;
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
