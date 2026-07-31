/* ─────────────────────────────────────────────────────────────
   Three.js neural-network particle hero
   ───────────────────────────────────────────────────────────── */
function initHero() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0a0e1a, 1);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.z = 42;

  /* ── glowing circular sprite ── */
  const sc = document.createElement('canvas');
  sc.width = sc.height = 64;
  const sctx = sc.getContext('2d');
  const sg = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  sg.addColorStop(0,    'rgba(0,255,156,1)');
  sg.addColorStop(0.2,  'rgba(0,255,156,0.7)');
  sg.addColorStop(0.55, 'rgba(0,212,255,0.2)');
  sg.addColorStop(1,    'rgba(0,0,0,0)');
  sctx.fillStyle = sg;
  sctx.fillRect(0, 0, 64, 64);
  const sprite = new THREE.CanvasTexture(sc);

  /* ── particles ── */
  const N = 130;
  const SX = 38, SY = 26, SZ = 12;

  const particles = Array.from({ length: N }, () => ({
    x:  (Math.random() - 0.5) * SX * 2,
    y:  (Math.random() - 0.5) * SY * 2,
    z:  (Math.random() - 0.5) * SZ * 2,
    vx: (Math.random() - 0.5) * 0.016,
    vy: (Math.random() - 0.5) * 0.012,
    vz: (Math.random() - 0.5) * 0.005,
  }));

  const pPos = new Float32Array(N * 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    size: 2.2,
    map: sprite,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  /* ── connection lines ── */
  const MAX_VERTS = N * 20;
  const lPos = new Float32Array(MAX_VERTS * 3);
  const lCol = new Float32Array(MAX_VERTS * 3);
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
  lGeo.setAttribute('color',    new THREE.BufferAttribute(lCol, 3));
  lGeo.setDrawRange(0, 0);
  const lMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  scene.add(new THREE.LineSegments(lGeo, lMat));

  const DIST = 13, DIST_SQ = DIST * DIST;
  let mx = 0, my = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX / window.innerWidth  - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  });

  function resize() {
    const W = canvas.clientWidth, H = canvas.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  function loop(t) {
    requestAnimationFrame(loop);
    const tick = t * 0.0004;

    /* move particles */
    for (let i = 0; i < N; i++) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.z += p.vz;
      if (Math.abs(p.x) > SX) p.vx *= -1;
      if (Math.abs(p.y) > SY) p.vy *= -1;
      if (Math.abs(p.z) > SZ) p.vz *= -1;
      pPos[i * 3]     = p.x;
      pPos[i * 3 + 1] = p.y;
      pPos[i * 3 + 2] = p.z;
    }
    pGeo.attributes.position.needsUpdate = true;

    /* update lines */
    let vi = 0;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        if (vi + 2 > MAX_VERTS) break;
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dz = particles[i].z - particles[j].z;
        const dSq = dx * dx + dy * dy + dz * dz;
        if (dSq < DIST_SQ) {
          const str = (1 - Math.sqrt(dSq) / DIST) * 0.55;
          /* blend green → cyan by z depth */
          const tz = (particles[i].z + SZ) / (SZ * 2);
          const gv = (0.85 + 0.15 * (1 - tz)) * str;
          const bv = (0.45 + 0.55 * tz) * str;
          const b  = vi * 3;
          lPos[b]     = particles[i].x; lPos[b + 1] = particles[i].y; lPos[b + 2] = particles[i].z;
          lPos[b + 3] = particles[j].x; lPos[b + 4] = particles[j].y; lPos[b + 5] = particles[j].z;
          lCol[b]     = 0; lCol[b + 1] = gv; lCol[b + 2] = bv;
          lCol[b + 3] = 0; lCol[b + 4] = gv; lCol[b + 5] = bv;
          vi += 2;
        }
      }
    }
    lGeo.attributes.position.needsUpdate = true;
    lGeo.attributes.color.needsUpdate    = true;
    lGeo.setDrawRange(0, vi);

    /* camera follows mouse + slow drift */
    camera.position.x += (mx * 8 + Math.sin(tick) * 2 - camera.position.x) * 0.025;
    camera.position.y += (-my * 5 + Math.cos(tick * 0.7) * 1.5 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
}

initHero();

/* ─────────────────────────────────────────────────────────────
   Page UX
   ───────────────────────────────────────────────────────────── */
document.getElementById('year').textContent = new Date().getFullYear();

document.querySelector('.nav__toggle').addEventListener('click', () => {
  document.querySelector('.nav__links').classList.toggle('open');
});

document.querySelectorAll('.nav__links a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.nav__links').classList.remove('open');
  });
});

const copyPromptBtn = document.getElementById('copyPromptBtn');
if (copyPromptBtn) {
  copyPromptBtn.addEventListener('click', async () => {
    const promptEl = document.getElementById('fitPromptText');
    const text = promptEl.textContent;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const range = document.createRange();
      range.selectNode(promptEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
      sel.removeAllRanges();
    }

    const original = copyPromptBtn.textContent;
    copyPromptBtn.textContent = 'Copied ✓';
    copyPromptBtn.classList.add('is-copied');
    setTimeout(() => {
      copyPromptBtn.textContent = original;
      copyPromptBtn.classList.remove('is-copied');
    }, 2000);
  });
}

document.getElementById('contactForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form     = e.target;
  const feedback = document.getElementById('formFeedback');
  const btn      = form.querySelector('button[type="submit"]');

  btn.disabled    = true;
  btn.textContent = 'Sending...';

  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      feedback.textContent  = "> message_received. I'll be in touch soon.";
      feedback.style.color  = 'var(--color-primary)';
      form.reset();
    } else {
      feedback.textContent = '> send failed. Please try again or reach out on LinkedIn.';
      feedback.style.color = '#f87171';
    }
  } catch {
    feedback.textContent = '> network error. Please try again.';
    feedback.style.color = '#f87171';
  }

  feedback.hidden     = false;
  btn.disabled        = false;
  btn.textContent     = 'Send Message';
  setTimeout(() => { feedback.hidden = true; }, 6000);
});
