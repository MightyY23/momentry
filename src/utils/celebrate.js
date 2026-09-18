//----------------------------------------
// Confetti burst — a tiny canvas-free
// celebration used when a memory is saved.
// Self-removing; respects reduced motion.
//----------------------------------------

export function celebrate() {
  if (typeof document === "undefined") return;

  if (
    window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches
  ) {
    return;
  }

  const colors = [
    "#ff5c8d",
    "#8b5cf6",
    "#22d3ee",
    "#fbbf24",
    "#f472b6",
  ];

  const host = document.createElement("div");

  host.setAttribute("aria-hidden", "true");

  Object.assign(host.style, {
    position: "fixed",

    inset: 0,

    pointerEvents: "none",

    zIndex: 4000,

    overflow: "hidden",
  });

  document.body.appendChild(host);

  const pieces = [];

  const COUNT = 36;

  for (let i = 0; i < COUNT; i += 1) {
    const el = document.createElement("span");

    const size = 6 + Math.random() * 8;

    Object.assign(el.style, {
      position: "absolute",

      left: `${20 + Math.random() * 60}%`,

      top: "55%",

      width: `${size}px`,

      height: `${size * (Math.random() > 0.5 ? 1 : 0.45)}px`,

      borderRadius: "2px",

      background:
        colors[i % colors.length],

      opacity: "0.95",

      willChange: "transform, opacity",
    });

    host.appendChild(el);

    pieces.push({
      el,

      vx: (Math.random() - 0.5) * 14,

      vy: -(8 + Math.random() * 10),

      rot: (Math.random() - 0.5) * 24,

      vr: (Math.random() - 0.5) * 16,
    });
  }

  let frame = 0;

  function tick() {
    frame += 1;

    let alive = false;

    for (const p of pieces) {
      p.vy += 0.45; // gravity

      // animate via transform
      const cur =
        p.el._t || { x: 0, y: 0, r: 0 };

      cur.x += p.vx;

      cur.y += p.vy;

      cur.r += p.vr;

      p.el._t = cur;

      p.el.style.transform = `translate(${cur.x}px, ${cur.y}px) rotate(${cur.r}deg)`;

      p.el.style.opacity = String(
        Math.max(0, 0.95 - frame / 90)
      );

      if (frame < 90) alive = true;
    }

    if (alive) {
      requestAnimationFrame(tick);
    } else {
      host.remove();
    }
  }

  requestAnimationFrame(tick);

  // Hard stop after 2.5s regardless.
  setTimeout(() => host.remove(), 2500);
}
