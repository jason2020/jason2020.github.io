// Inlined GLSL for the garden's animated nebula backdrop.
// Kept as TS strings so they ride the normal module graph (no .glsl typing setup),
// while vite-plugin-glsl stays available for future standalone shaders.

// ─── starfield ────────────────────────────────────────────────────────────────
// A GPU-driven point cloud: each star carries its own size, colour and twinkle
// phase, so the whole field shimmers independently with zero per-frame CPU work.

export const starVertex = /* glsl */ `
  uniform float uTime;
  uniform float uScale; // drawingBufferHeight * 0.5 — matches three's size attenuation
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Per-star twinkle from its own phase: a slow breathing brightness.
    float tw = 0.5 + 0.5 * sin(uTime * 1.8 + aPhase * 6.2831853);
    vTwinkle = 0.5 + tw * 0.7;
    vColor = aColor;
    // Perspective size attenuation (three's formula) modulated by the twinkle.
    gl_PointSize = aSize * uScale / -mv.z * (0.6 + tw * 0.8);
    gl_Position = projectionMatrix * mv;
  }
`

export const starFragment = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    // Round, soft-edged sprite from the square point.
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 1.6); // tight bright centre, soft halo
    gl_FragColor = vec4(vColor * 1.25, glow * vTwinkle);
  }
`

export const nebulaVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const nebulaFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uPointer; // smoothed cursor in NDC (-1..1)
  uniform vec3 uColorDeep;
  uniform vec3 uColorTeal;
  uniform vec3 uColorViolet;

  // Ashima Arts simplex noise (2D) — public domain.
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float total = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      total += snoise(p) * amp;
      p *= 2.02;
      amp *= 0.5;
    }
    return total;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(2.4, 1.5);
    float t = uTime * 0.045;

    // Pointer-reactive domain warp: the field swells gently toward the cursor.
    vec2 pp = uPointer * vec2(0.7, 0.5); // cursor mapped into p-space
    float pd = length(p - pp);
    float infl = exp(-pd * 2.2); // tighter falloff → warp stays close to the cursor
    vec2 pw = p + normalize(p - pp + 1e-4) * 0.1 * infl;

    float n1 = fbm(pw * 1.4 + vec2(t, -t * 0.6));
    float n2 = fbm(pw * 3.1 - vec2(t * 0.8, t * 0.5) + n1);

    float neb = smoothstep(-0.2, 0.9, n1 * 0.7 + n2 * 0.45);
    vec3 col = mix(uColorDeep, uColorTeal, neb);
    col = mix(col, uColorViolet, smoothstep(0.35, 1.0, n2) * 0.65);

    // bright filaments
    float filaments = pow(smoothstep(0.55, 0.95, n2), 2.0);
    col += uColorTeal * filaments * 0.35;

    // cursor light: a soft cool brightening that follows the pointer
    float glow = exp(-pd * pd * 2.2);
    col += (uColorTeal * 0.6 + uColorViolet * 0.4) * glow * 0.5;

    // radial vignette so edges fall into the dark
    float vig = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(1.7, 1.05)));
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
  }
`
