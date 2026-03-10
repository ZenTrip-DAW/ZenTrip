import { useEffect } from "react";

export default function useParticles(canvasRef, { count = 60, speed = 0.3 } = {}) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = [
      { r: 100, g: 160, b: 255 },
      { r: 140, g: 190, b: 255 },
      { r:  80, g: 130, b: 240 },
      { r: 180, g: 210, b: 255 },
      { r: 160, g: 140, b: 255 }, // toque violeta mágico
      { r: 120, g: 220, b: 255 }, // cian brillante
    ];

    // Partículas normales
    const dots = Array.from({ length: count }, () => {
      const c = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        x:       Math.random() * canvas.width,
        y:       Math.random() * canvas.height,
        vx:      (Math.random() - 0.5) * speed,
        vy:      (Math.random() - 0.5) * speed,
        r:       Math.random() * 2.2 + 0.8,
        color:   c,
        phase:   Math.random() * Math.PI * 2,
        freq:    0.012 + Math.random() * 0.018,
        wobbleX: (Math.random() - 0.5) * 0.007,
        wobbleY: (Math.random() - 0.5) * 0.007,
      };
    });

    // Partículas especiales tipo "destello" — aparecen y desaparecen
    const sparks = Array.from({ length: 18 }, () => ({
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,
      phase:   Math.random() * Math.PI * 2,
      freq:    0.025 + Math.random() * 0.03,
      size:    Math.random() * 1.5 + 0.5,
      color:   COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    // Orbes grandes y difusos que flotan lentamente
    const orbs = Array.from({ length: 4 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      vx:    (Math.random() - 0.5) * 0.12,
      vy:    (Math.random() - 0.5) * 0.12,
      r:     80 + Math.random() * 80,
      phase: Math.random() * Math.PI * 2,
      freq:  0.006 + Math.random() * 0.006,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const MAX_DIST = 120;

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Orbes grandes difusos ──
      orbs.forEach(o => {
        o.x     += o.vx;
        o.y     += o.vy;
        o.phase += o.freq;
        if (o.x < -o.r || o.x > canvas.width  + o.r) o.vx *= -1;
        if (o.y < -o.r || o.y > canvas.height + o.r) o.vy *= -1;

const alpha = 0.015 + 0.012 * ((Math.sin(o.phase) + 1) / 2);
        const { r, g, b } = o.color;
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        grad.addColorStop(0,   `rgba(${r},${g},${b},${alpha.toFixed(3)})`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},${(alpha * 0.5).toFixed(3)})`);
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      

      // ── Partículas normales ──
      dots.forEach(d => {
        d.vx += d.wobbleX;
        d.vy += d.wobbleY;
        const maxSpeed = speed * 2;
        d.vx = Math.max(-maxSpeed, Math.min(maxSpeed, d.vx));
        d.vy = Math.max(-maxSpeed, Math.min(maxSpeed, d.vy));
        d.x     += d.vx;
        d.y     += d.vy;
        d.phase += d.freq;
        if (d.x < 0 || d.x > canvas.width)  d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;

        const alpha = 0.12 + 0.33 * ((Math.sin(d.phase) + 1) / 2);
        const { r, g, b } = d.color;

        const spread = d.r * 24;
        const glow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, spread);
        glow.addColorStop(0,    `rgba(${r},${g},${b},${alpha.toFixed(2)})`);
        glow.addColorStop(0.12, `rgba(${r},${g},${b},${(alpha * 0.6).toFixed(2)})`);
        glow.addColorStop(0.4,  `rgba(${r},${g},${b},${(alpha * 0.2).toFixed(2)})`);
        glow.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(d.x, d.y, spread, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        const core = d.r * 2;
        const coreGlow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, core);
        coreGlow.addColorStop(0,   `rgba(${r},${g},${b},${Math.min(alpha * 2.5, 1).toFixed(2)})`);
        coreGlow.addColorStop(0.5, `rgba(${r},${g},${b},${(alpha * 0.8).toFixed(2)})`);
        coreGlow.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(d.x, d.y, core, 0, Math.PI * 2);
        ctx.fillStyle = coreGlow;
        ctx.fill();
      });

      // ── Destellos mágicos ──
      sparks.forEach(s => {
        s.phase += s.freq;
        // parpadean: solo visibles en el pico del seno
        const pulse = (Math.sin(s.phase) + 1) / 2;
        if (pulse < 0.6) return; // invisible la mayor parte del tiempo
        const alpha = (pulse - 0.6) / 0.4; // 0 → 1 solo en el pico
        const { r, g, b } = s.color;

        // cruz de 4 rayos
        const len = s.size * 8 * alpha;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = alpha * 0.9;
        ctx.strokeStyle = `rgba(${r},${g},${b},1)`;
        ctx.lineWidth = s.size * 0.6;
        ctx.lineCap = "round";
        // rayo horizontal
        ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(len, 0); ctx.stroke();
        // rayo vertical
        ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(0, len); ctx.stroke();
        // rayos diagonales más cortos
        const diagLen = len * 0.5;
        ctx.lineWidth = s.size * 0.3;
        ctx.beginPath(); ctx.moveTo(-diagLen, -diagLen); ctx.lineTo(diagLen, diagLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(diagLen, -diagLen); ctx.lineTo(-diagLen, diagLen); ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1;
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef, count, speed]);
}