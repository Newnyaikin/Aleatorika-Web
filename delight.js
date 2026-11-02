"use strict";
// Optional visual feedback only: never blocks sound, answers or navigation.
let confettiFrame = 0,
  confettiCanvas = null;
function celebrateSuccess() {
  if (document.hidden || matchMedia("(prefers-reduced-motion:reduce)").matches)
    return;
  cancelAnimationFrame(confettiFrame);
  confettiCanvas?.remove();
  const canvas = document.createElement("canvas");
  confettiCanvas = canvas;
  canvas.className = "success-confetti";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const w = innerWidth,
    h = innerHeight,
    dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const colors = ["#2783DE", "#72BC8F", "#EAC26B", "#BF8EDA", "#5E9FE8"];
  const particles = Array.from({ length: w < 600 ? 48 : 72 }, (_, i) => {
    const side = i % 2;
    return {
      x: side ? w * 0.82 : w * 0.18,
      y: h * 0.48,
      vx: (side ? -1 : 1) * (70 + Math.random() * 190),
      vy: -180 - Math.random() * 230,
      size: 4 + Math.random() * 4,
      spin: (Math.random() - 0.5) * 15,
      angle: Math.random() * 6.28,
      color: colors[i % colors.length],
    };
  });
  const start = performance.now();
  const tick = (now) => {
    const t = (now - start) / 1000;
    ctx.clearRect(0, 0, w, h);
    if (t >= 1.15) {
      canvas.remove();
      if (confettiCanvas === canvas) confettiCanvas = null;
      return;
    }
    ctx.globalAlpha = Math.min(1, (1.15 - t) / 0.35);
    for (const p of particles) {
      ctx.save();
      ctx.translate(p.x + p.vx * t, p.y + p.vy * t + 330 * t * t);
      ctx.rotate(p.angle + p.spin * t);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
      ctx.restore();
    }
    confettiFrame = requestAnimationFrame(tick);
  };
  confettiFrame = requestAnimationFrame(tick);
}
window.addEventListener("pagehide", () => {
  cancelAnimationFrame(confettiFrame);
  confettiCanvas?.remove();
  confettiCanvas = null;
});
// Consistent outline icons. Text labels remain intact and accessible.
const buttonGlyphs = {
  play: "m9 5 11 7-11 7Z",
  pause: "M8 5v14M16 5v14",
  back: "m10 6-6 6 6 6M4 12h16",
  next: "m14 6 6 6-6 6M4 12h16",
  music:
    "M9 18V5l11-2v13M9 7l11-2M9 18c0 2-5 3-5 0s5-3 5 0Zm11-2c0 2-5 3-5 0s5-3 5 0Z",
  learn: "m3 8 9-5 9 5-9 5Zm3 3v6l6 4 6-4v-6",
  speed:
    "M12 8v5l3 2M8 2h8M12 2v3M19 6l2-2M20 14a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  chord: "M5 3v18M12 3v18M19 3v18M3 7h18M3 15h18",
  repeat:
    "M20 7v5h-5M4 17v-5h5M5 8a8 8 0 0 1 13-3l2 2M19 16a8 8 0 0 1-13 3l-2-2",
};
function glyphForButton(b) {
  const id = b.id,
    t = b.textContent.trim();
  if (
    /^[←♫Ⅱ]/.test(t) ||
    b.closest(".experience-switch") ||
    b.querySelector("svg") ||
    b.matches(
      "[data-string],[data-answer],[data-ear-chord],.answer,.fret-cell",
    ) ||
    b.closest(".sight-shape-filter")
  )
    return null;
  if (/Pause/.test(id) || t === "Ⅱ") return "pause";
  if (
    /Exit|Back|Menu|Quit/.test(id) ||
    /Меню|Назад|настройкам|Завершить/.test(t)
  )
    return "back";
  if (/Skip|Next/.test(id) || /Пропустить|Следующ/.test(t)) return "next";
  if (id === "modeNotes") return "music";
  if (id === "modeChords") return "chord";
  if (id === "calmPace") return "learn";
  if (id === "speedExperience") return "speed";
  if (
    /Replay|Hint|replaySound/.test(id) ||
    /Образец|Послушать|услышать|Звучит/.test(t)
  )
    return "music";
  if (
    /Start|Again|Resume|startLearning/.test(id) ||
    /Начать|Продолжить|Играть|Ещё.*секунд/.test(t)
  )
    return "play";
  return null;
}
function decorateButtons() {
  for (const b of document.querySelectorAll("button")) {
    if (b.querySelector(":scope>.button-glyph")) continue;
    const key = glyphForButton(b);
    if (!key) continue;
    const icon = document.createElement("span");
    icon.className = "button-glyph";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="${buttonGlyphs[key]}"/></svg>`;
    b.prepend(icon);
  }
}
let decorateQueued = false;
new MutationObserver(() => {
  if (!decorateQueued) {
    decorateQueued = true;
    queueMicrotask(() => {
      decorateQueued = false;
      decorateButtons();
    });
  }
}).observe(document.body, { childList: true, subtree: true });
decorateButtons();
