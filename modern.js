"use strict";
// Every shape is a real major/minor triad in standard E–A–D–G–B–E tuning.
const chordShapes = {
  C: [
    [-1, 3, 2, 0, 1, 0],
    [8, 10, 10, 9, 8, 8],
    [-1, 3, 5, 5, 5, 3],
    [-1, -1, 10, 12, 13, 12],
  ],
  D: [
    [-1, -1, 0, 2, 3, 2],
    [10, 12, 12, 11, 10, 10],
    [-1, 5, 7, 7, 7, 5],
    [-1, -1, 12, 14, 15, 14],
  ],
  E: [
    [0, 2, 2, 1, 0, 0],
    [12, 14, 14, 13, 12, 12],
    [-1, 7, 9, 9, 9, 7],
    [-1, -1, 2, 4, 5, 4],
  ],
  G: [
    [3, 2, 0, 0, 0, 3],
    [3, 5, 5, 4, 3, 3],
    [-1, 10, 12, 12, 12, 10],
    [-1, -1, 5, 7, 8, 7],
  ],
  A: [
    [-1, 0, 2, 2, 2, 0],
    [5, 7, 7, 6, 5, 5],
    [-1, 12, 14, 14, 14, 12],
    [-1, -1, 7, 9, 10, 9],
  ],
  Am: [
    [-1, 0, 2, 2, 1, 0],
    [5, 7, 7, 5, 5, 5],
    [-1, 12, 14, 14, 13, 12],
    [-1, -1, 7, 9, 10, 8],
  ],
  Dm: [
    [-1, -1, 0, 2, 3, 1],
    [10, 12, 12, 10, 10, 10],
    [-1, 5, 7, 7, 6, 5],
    [-1, -1, 12, 14, 15, 13],
  ],
  Em: [
    [0, 2, 2, 0, 0, 0],
    [12, 14, 14, 12, 12, 12],
    [-1, 7, 9, 9, 8, 7],
    [-1, -1, 2, 4, 5, 3],
  ],
};
const barreChords = [
  { id: "F", root: 5, min: false },
  { id: "Fm", root: 5, min: true },
  { id: "B", root: 11, min: false },
  { id: "Bm", root: 11, min: true },
  { id: "B♭", root: 10, min: false },
  { id: "B♭m", root: 10, min: true },
];
for (const c of barreChords) {
  const e = (c.root - 4 + 12) % 12,
    a = (c.root - 9 + 12) % 12,
    d = (c.root - 2 + 12) % 12;
  const eShape = (f) => [f, f + 2, f + 2, f + (c.min ? 0 : 1), f, f];
  chordShapes[c.id] = [
    eShape(e),
    eShape(e + 12),
    [-1, a, a + 2, a + 2, a + (c.min ? 1 : 2), a],
    [-1, -1, d, d + 2, d + 3, d + (c.min ? 1 : 2)],
  ];
  c.frets = chordShapes[c.id][0];
}
const sightChords = [...chords, ...barreChords];
function barreSpan(c) {
  if (c.frets.some((f) => f === 0)) return null;
  const f = Math.min(...c.frets.filter((f) => f > 0)),
    strings = c.frets.flatMap((v, i) => (v === f ? [i] : []));
  const first = strings[0],
    last = strings[strings.length - 1];
  return last - first >= 2 &&
    c.frets.slice(first, last + 1).every((v) => v >= f)
    ? { f, first, last }
    : null;
}
function sightVoicingLabel(c) {
  return (
    (c.voicing === 3
      ? "Форма D"
      : c.voicing === 2
        ? "Форма A"
        : c.voicing === 0 && !barreChords.some((b) => b.id === c.id)
          ? "Открытая позиция"
          : "Форма E") + (barreSpan(c) ? " · баррэ" : "")
  );
}

function chordVoicings(c) {
  return chordShapes[c.id].map((frets, i) => ({ ...c, frets, voicing: i }));
}
chordDiagram = function (c) {
  const pressed = c.frets.filter((f) => f > 0),
    base = Math.max(...pressed) > 4 ? Math.min(...pressed) : 1;
  let svg = `<svg class="diagram" viewBox="0 0 128 154" role="img" aria-label="Аккорд ${c.id}, от шестой струны к первой: ${c.frets.map((f) => (f < 0 ? "не играть" : f === 0 ? "открытая" : f + " лад")).join(", ")}">`;
  for (let i = 0; i < 5; i++)
    svg += `<path d="M22 ${28 + i * 25}h90" stroke="currentColor" stroke-opacity=".4" stroke-width="${i === 0 && base === 1 ? 3 : 1}"/>`;
  for (let i = 0; i < 6; i++) {
    const x = 22 + i * 18,
      f = c.frets[i];
    svg += `<path d="M${x} 28v100" stroke="currentColor" stroke-opacity=".45"/>`;
    if (f < 0)
      svg += `<path d="m${x - 3} 11 6 6m0-6-6 6" stroke="currentColor" stroke-width="1.5"/>`;
    else if (f === 0)
      svg += `<circle cx="${x}" cy="14" r="4" fill="none" stroke="currentColor"/>`;
    else
      svg += `<circle cx="${x}" cy="${28 + (f - base + 0.5) * 25}" r="6" fill="var(--accent)"/>`;
  }
  const barre = barreSpan(c);
  if (barre)
    svg += `<path data-barre="true" d="M${22 + barre.first * 18} ${28 + (barre.f - base + 0.5) * 25}H${22 + barre.last * 18}" stroke="var(--accent)" stroke-width="10" stroke-linecap="round"/>`;
  svg += `<text x="14" y="45" text-anchor="end" font-size="10" fill="currentColor">${base}</text><text x="22" y="148" font-size="12" fill="currentColor" text-anchor="middle">6</text><text x="112" y="148" font-size="12" fill="currentColor" text-anchor="middle">1</text></svg>`;
  return svg;
};
function voicingGallery(c) {
  return `<section class="voicing-library" aria-label="Четыре аппликатуры ${c.id}"><h3>Один аккорд · четыре позиции</h3><div class="voicing-grid">${chordVoicings(
    c,
  )
    .map(
      (v, i) =>
        `<div class="voicing-card">${chordDiagram(v)}<span>${["Открытая", "Форма E", "Форма A", "Форма D"][i]}</span></div>`,
    )
    .join(
      "",
    )}</div><p class="micro-copy">× — не играть · ○ — открытая струна · число слева — первый показанный лад. Формы E и A — с баррэ.</p></section>`;
}
const galleryRender = render;
render = function (focus = false) {
  galleryRender(focus);
  if (
    race.experience === "learn" &&
    state.mode === "chords" &&
    state.stage === 3
  ) {
    const result = $("result");
    if (result && !$("stage").querySelector(".voicing-library"))
      result.after(htmlNode(voicingGallery(state.target)));
  }
};
function htmlNode(html) {
  const t = document.createElement("template");
  t.innerHTML = html;
  return t.content.firstElementChild;
}
// Reuse the same local, ambiguity-gated classifier with a bank of real voicings.
chordProfiles.forEach(
  (p) => (p.variants = chordVoicings(p.chord).map(chordProfile)),
);
const openChordClassifier = classifyRaceChord;
// Keep the existing conservative classifier for listening games. The sight mode
// checks against each possible chord, including the chosen shape, independently.
const sightChordProfiles = sightChords.map((c) => ({
  chord: c,
  vector: chordProfile(c),
  variants: chordVoicings(c).map(chordProfile),
}));
function classifySightChord(db, sr, fft) {
  const originals = [...chordProfiles],
    votes = new Map();
  try {
    chordProfiles.splice(0, chordProfiles.length, ...sightChordProfiles);
    for (let i = 0; i < 4; i++) {
      chordProfiles.forEach((p) => (p.vector = p.variants[i]));
      const key = openChordClassifier(db, sr, fft);
      if (key) votes.set(key, (votes.get(key) || 0) + 1);
    }
  } finally {
    chordProfiles.splice(0, chordProfiles.length, ...originals);
  }
  return votes.size === 1 ? votes.keys().next().value : null;
}
const sight = {
  token: 0,
  phase: "menu",
  kind: "practice",
  chordSet: store.get("aleatorika-sight-chord-set", store.get("aleatorika-sight-barre-only", false) ? "barre" : "all"),
  index: 0,
  score: 0,
  target: null,
  media: null,
  node: null,
  source: null,
  raf: 0,
  timer: 0,
  clock: 0,
  ignore: 0,
  stable: 0,
  key: null,
  lastWrong: null,
  remaining: 30000,
  deadline: 0,
  streak: 0,
  best: 0,
  bonus: 0,
  errors: 0,
};
if (!["open", "barre", "all"].includes(sight.chordSet)) sight.chordSet = "all";
const sightButton = document.createElement("button");
sightButton.id = "sightExperience";
sightButton.className = "experience-button";
sightButton.textContent = "По схеме";
sightButton.setAttribute("aria-pressed", "false");
experience.append(sightButton);
function stopSight() {
  sight.token++;
  cancelAnimationFrame(sight.raf);
  clearTimeout(sight.timer);
  clearInterval(sight.clock);
  sight.media?.getTracks().forEach((t) => t.stop());
  detachMicSink(sight.node);
  try {
    sight.source?.disconnect();
  } catch (_) {}
  sight.media = sight.source = sight.node = null;
  sight.phase = "menu";
  document.body.classList.remove("sight-playing");
}
const sightSelect = selectExperience,
  sightMode = setMode;
selectExperience = function (value) {
  if (race.experience === "sight") {
    stopSight();
    stopAudio();
    document.body.classList.remove("sight-on");
  }
  sightButton.setAttribute("aria-pressed", String(value === "sight"));
  if (value !== "sight") {
    const result = sightSelect(value);
    syncPracticeNav();
    return result;
  }
  disposeRace();
  disposeEar();
  stopMic();
  stopAudio();
  exitFretFocus(false);
  race.experience = "sight";
  document.body.classList.remove("speed-on", "ear-on", "in-exercise");
  document.body.classList.add("sight-on");
  $("progress").hidden = true;
  showSightMenu();
  syncPracticeNav();
};
setMode = function (mode, force = false) {
  if (race.experience !== "sight") {
    const result = sightMode(mode, force);
    syncPracticeNav();
    return result;
  }
  stopSight();
  stopAudio();
  learningSetMode(mode, true);
  showSightMenu();
  syncPracticeNav();
};
sightButton.onclick = () => selectExperience("sight");
function sightTop() {
  $("counter").parentElement.firstChild.textContent = "По схеме";
  $("counter").textContent =
    sight.kind === "speed"
      ? "На время"
      : sight.phase === "running"
        ? `${sight.index + 1} / 10`
        : "Практика";
  $("asideNote").textContent =
    "Название и схема видны сразу. Повтори рисунок на гитаре — микрофон проверит звучание.";
  $("footerTip").querySelector("span").textContent =
    "Стандартный строй E–A–D–G–B–E. Аудио обрабатывается только на устройстве.";
}
function showSightMenu(message = "") {
  document.body.classList.remove("sight-playing");
  sight.phase = "menu";
  sightTop();
  const speed = sight.kind === "speed";
  $("training").innerHTML =
    `<div class="sight-content sight-menu"><p class="phase-label">СМОТРИ → ПОВТОРЯЙ</p><h2>${speed ? "По схеме на скорость" : "Играй по схеме"}</h2><p class="description">Название ${state.mode === "notes" ? "ноты" : "аккорда"} видно сразу. Просто повтори рисунок на гитаре — без угадывания и выбора ответа.</p><div class="sight-menu-facts">${speed ? "<div><strong>30 сек</strong><span>на старте</span></div><div><strong>+5 сек</strong><span>за 3 попадания</span></div>" : "<div><strong>10 схем</strong><span>без спешки</span></div><div><strong>Микрофон</strong><span>проверяет игру</span></div>"}</div><button class="button primary" id="sightStart">${speed ? "Играть на время" : "Начать · 10 заданий"}</button><p class="sight-menu-note">${speed ? "Таймер начнётся только после подключения микрофона. Ошибка или пропуск сбрасывает комбо." : "Следующая схема появляется после верной игры. Звуковая подсказка — по желанию."}</p>${state.mode === "chords" ? '<p class="sight-menu-note">Открытые и баррэ: в том числе F, Fm, B, Bm, B♭, B♭m. Полоска на схеме — баррэ. Проверяется звучание, не положение пальцев.</p>' : ""}${message ? '<p id="sightError" class="alert" role="alert"></p>' : ""}</div>`;
  if (state.mode === "chords") {
    const filter = document.createElement("div");
    filter.className = "sight-shape-filter";
    filter.setAttribute("role", "group");
    filter.setAttribute("aria-label", "Аппликатуры");
    filter.innerHTML = [["open", "Открытые"], ["barre", "С баррэ"], ["all", "Все"]]
      .map(([id, label]) => `<button data-sight-set="${id}" aria-pressed="${sight.chordSet === id}">${label}</button>`).join("");
    $("sightStart").before(filter);
    filter.querySelectorAll("button").forEach((button) => button.onclick = () => {
      sight.chordSet = button.dataset.sightSet;
      store.set("aleatorika-sight-chord-set", sight.chordSet);
      showSightMenu();
    });
  }
  if (message) $("sightError").textContent = message;
  $("sightStart").onclick = () => startSight(false);
  syncPracticeNav();
}
function pickSight() {
  const prev = sight.target;
  if (state.mode === "chords") {
    const bank = sight.chordSet === "open" ? chords : sightChords;
    const pool = bank.filter((c) => c.id !== prev?.id),
      c = pool[Math.floor(Math.random() * pool.length)];
    const shapes = sight.chordSet === "open" ? [chordVoicings(c)[0]] : chordVoicings(c).filter(
      (v) => sight.chordSet !== "barre" || barreSpan(v),
    );
    sight.target = shapes[Math.floor(Math.random() * shapes.length)];
  } else {
    const pool = notes.filter((n) => n.pc !== prev?.pc),
      positions = notePositions(
        pool[Math.floor(Math.random() * pool.length)].pc,
      );
    sight.target = positions[Math.floor(Math.random() * positions.length)];
  }
  sight.stable = 0;
  sight.key = null;
  sight.lastWrong = null;
  sight.ignore = performance.now() + 110;
}
function sightName() {
  return state.mode === "chords"
    ? fullChord(sight.target) + " / " + sight.target.id
    : noteNames[sight.target.pc] +
        " / " +
        letters[sight.target.pc] +
        Math.floor(sight.target.midi / 12 - 1);
}
function renderSight() {
  sightTop();
  document.body.classList.add("sight-playing");
  const c = state.mode === "chords",
    t = sight.target,
    speed = sight.kind === "speed";
  const shape = c
    ? t
    : {
        id: noteNames[t.pc],
        frets: openMidi.map((_, i) => (6 - i === t.string ? t.fret : -1)),
      };
  $("training").innerHTML =
    `<div class="sight-content sight-live"><div class="sight-topbar"><button id="sightExit" class="session-back" aria-label="Завершить занятие и показать итоги">Итоги</button><span>По схеме · ${speed ? "на время" : "практика"}</span><button id="sightPause" class="session-pause" aria-label="Пауза">Ⅱ</button></div><div class="sight-hud"><div><span>${speed ? "Осталось" : "Задание"}</span><strong id="sightTime">${speed ? Math.ceil(sight.remaining / 1000) + " с" : sight.index + 1 + " / 10"}</strong></div><div><span>Попадания</span><strong id="sightScore">${sight.score}</strong></div><div><span>${speed ? "Комбо" : "Темп"}</span><strong id="sightCombo">${speed ? (sight.streak % 3 || 0) + " / 3" : "Свой"}</strong></div></div><p class="sight-prompt">ПОВТОРИ ЭТУ СХЕМУ</p><h2 id="sightTargetName">${sightName()}</h2><p class="sight-position">${c ? sightVoicingLabel(t) : t.string + "-я струна · " + (t.fret ? t.fret + " лад" : "открытая") + " · " + octaveLabel(t)}</p><div class="sight-diagram">${chordDiagram(shape)}</div><p class="diagram-legend">× не играть · ○ открытая · струны 6 → 1</p><div class="sight-level" aria-label="Уровень микрофона"><span id="sightLevel"></span></div><p id="sightStatus" class="sight-status" role="status" aria-live="polite">Слушаю твою гитару…</p><div class="sight-actions"><button class="button secondary" id="sightHint">♫ Образец</button><button class="button secondary" id="sightSkip">Пропустить</button></div><p class="sight-footnote">${speed ? "3 попадания подряд → +5 секунд" : c ? "Проверяем звучание аккорда, не пальцы." : "Играй в указанной октаве."}</p></div>`;
  $("sightHint").onclick = sightHint;
  $("sightSkip").onclick = () => advanceSight(false);
  $("sightExit").onclick = finishSight;
  $("sightPause").onclick = pauseSight;
}
function updateSightHud() {
  if ($("sightTime")) {
    $("sightTime").textContent = Math.ceil(sight.remaining / 1000) + " с";
    $("sightTime").classList.toggle("urgent", sight.remaining <= 10000);
  }
  if ($("sightScore")) $("sightScore").textContent = sight.score;
  if ($("sightCombo"))
    $("sightCombo").textContent = (sight.streak % 3 || 0) + " / 3";
}
function tickSight() {
  if (sight.kind !== "speed" || !["running", "feedback"].includes(sight.phase))
    return;
  sight.remaining = Math.max(0, sight.deadline - performance.now());
  updateSightHud();
  if (sight.remaining <= 0) finishSight();
}
async function startSight(resume = false) {
  stopSight();
  if (!resume) sight.target = null;
  const token = sight.token;
  sight.phase = "requesting";
  const button = $("sightStart") || $("sightAgain") || $("sightResume");
  if (button) {
    button.disabled = true;
    button.textContent = "Подключаем микрофон…";
  }
  try {
    const ctx = await getAudio(),
      media = await requestGuitarMic();
    if (token !== sight.token || document.hidden) {
      media.getTracks().forEach((t) => t.stop());
      return;
    }
    sight.media = media;
    sight.node = ctx.createAnalyser();
    sight.node.fftSize = state.mode === "chords" ? 8192 : 4096;
    sight.node.smoothingTimeConstant = 0.1;
    sight.source = ctx.createMediaStreamSource(media);
    sight.source.connect(sight.node);
    attachMicSink(ctx, sight.node);
    await ctx.resume();
    if (token !== sight.token) return;
    if (!resume) {
      sight.index =
        sight.score =
        sight.streak =
        sight.best =
        sight.bonus =
        sight.errors =
          0;
      sight.remaining = 30000;
      sight.target = null;
      pickSight();
    } else {
      sight.stable = 0;
      sight.key = null;
      sight.ignore = performance.now() + 160;
    }
    sight.phase = "running";
    if (sight.kind === "speed")
      sight.deadline = performance.now() + sight.remaining;
    renderSight();
    listenSight(token, ctx);
    if (sight.kind === "speed") sight.clock = setInterval(tickSight, 60);
    media.getAudioTracks().forEach((t) =>
      t.addEventListener("ended", () => {
        if (token === sight.token) {
          pauseSight();
          const el = $("sightPauseCopy");
          if (el)
            el.textContent =
              "Микрофон отключился. Проверь подключение и продолжи.";
        }
      }),
    );
  } catch (e) {
    if (token !== sight.token) return;
    stopSight();
    showSightMenu(guitarMicError(e));
  }
}
function listenSight(token, ctx) {
  const a = sight.node,
    time = new Float32Array(a.fftSize),
    db = new Float32Array(a.frequencyBinCount);
  let last = 0;
  const loop = (t) => {
    if (token !== sight.token) return;
    sight.raf = requestAnimationFrame(loop);
    if (t - last < 65 || sight.phase !== "running") return;
    last = t;
    if (sight.kind === "speed" && t >= sight.deadline) {
      tickSight();
      return;
    }
    a.getFloatTimeDomainData(time);
    const rms = Math.sqrt(time.reduce((s, v) => s + v * v, 0) / time.length);
    if ($("sightLevel"))
      $("sightLevel").style.width = (sampleInputGuard.armed?Math.min(100, rms * 650):0) + "%";
    if (t < sight.ignore || document.hidden || $("settings").open) {
      sight.stable = 0;
      return;
    }
    if (!microphoneReadyForInput(time, t)) {
      sight.stable = 0;
      return;
    }
    let key = null;
    if (rms >= 0.008) {
      if (state.mode === "chords") {
        a.getFloatFrequencyData(db);
        key = classifySightChord(db, ctx.sampleRate, a.fftSize);
      } else {
        const f = pitchFrom(time, ctx.sampleRate);
        if (f) {
          const exact = 69 + 12 * Math.log2(f / 440);
          if (Math.abs(exact - Math.round(exact)) < 0.4)
            key = Math.round(exact);
        }
      }
    }
    sight.stable = key !== null && key === sight.key ? sight.stable + 1 : 1;
    sight.key = key;
    if (key === null) {
      sight.lastWrong = null;
      return;
    }
    if (sight.stable < 2) return;
    const correct =
      key === (state.mode === "chords" ? sight.target.id : sight.target.midi);
    if (correct) advanceSight(true);
    else {
      if (sight.kind === "speed" && key !== sight.lastWrong) {
        sight.streak = 0;
        sight.errors++;
        sight.lastWrong = key;
        updateSightHud();
      }
      if ($("sightStatus"))
        $("sightStatus").textContent = "Пока не совпало. Повтори рисунок.";
    }
  };
  sight.raf = requestAnimationFrame(loop);
}
function advanceSight(correct) {
  if (sight.phase !== "running") return;
  if (sight.kind === "speed" && performance.now() >= sight.deadline) {
    tickSight();
    return;
  }
  stopAudio();
  sight.phase = "feedback";
  let bonus = false;
  if (correct) {
    celebrateSuccess();
    sight.score++;
    sight.streak++;
    sight.best = Math.max(sight.best, sight.streak);
    if (sight.kind === "speed" && sight.streak % 3 === 0) {
      sight.deadline += 5000;
      sight.bonus += 5;
      bonus = true;
    }
  } else {
    sight.streak = 0;
    sight.errors++;
  }
  if (sight.kind === "speed") updateSightHud();
  $("sightStatus").textContent = correct
    ? bonus
      ? "✓ Комбо! +5 секунд"
      : "✓ Верно! Следующая схема…"
    : "Задание пропущено";
  $("sightStatus").classList.toggle("good", correct);
  $("sightHint").disabled = $("sightSkip").disabled = true;
  if (correct) navigator.vibrate?.(30);
  const token = sight.token;
  sight.timer = setTimeout(
    () => {
      if (token !== sight.token) return;
      if (sight.kind === "practice" && sight.index >= 9) {
        finishSight();
        return;
      }
      sight.index++;
      sight.phase = "running";
      pickSight();
      renderSight();
    },
    sight.kind === "speed" ? 180 : 500,
  );
}
async function sightHint() {
  if (sight.phase !== "running") return;
  const token = sight.token;
  sight.ignore = Infinity;
  try {
    const ctx = await getAudio();
    if (token !== sight.token || sight.phase !== "running") return;
    stopAudio();
    const t = sight.target,
      midis =
        state.mode === "chords"
          ? t.frets.flatMap((f, i) => (f < 0 ? [] : [openMidi[i] + f]))
          : [t.midi];
    midis.forEach((m, i) =>
      pluck(
        ctx,
        m,
        ctx.currentTime + 0.02 + i * 0.035,
        0.5 / midis.length,
        0.55,
      ),
    );
    sight.ignore = performance.now() + SAMPLE_MIC_MUTE_MS;
    beginSampleInputGuard();
    $("sightStatus").textContent =
      "Образец звучит. Через секунду можно играть.";
  } catch (e) {
    if (token === sight.token) {
      sight.ignore = performance.now() + 160;
      if ($("sightStatus"))
        $("sightStatus").textContent = "Образец недоступен. Микрофон слушает.";
    }
  }
}
function pauseSight() {
  if (!["running", "feedback", "requesting"].includes(sight.phase)) return;
  if (sight.kind === "speed" && sight.phase !== "requesting") {
    sight.remaining = Math.max(0, sight.deadline - performance.now());
    if (!sight.remaining) {
      finishSight();
      return;
    }
  }
  if (sight.phase === "feedback") {
    if (sight.kind === "practice" && sight.index >= 9) {
      finishSight();
      return;
    }
    sight.index++;
    pickSight();
  }
  stopSight();
  stopAudio();
  sight.phase = "paused";
  $("training").innerHTML =
    `<div class="sight-content"><p class="phase-label">ПАУЗА</p><h2>Продолжим в твоём ритме</h2><p class="description" id="sightPauseCopy">${sight.kind === "speed" ? "Осталось " + Math.ceil(sight.remaining / 1000) + " секунд. Счёт и комбо сохранены." : "Схема и результат сохранены."}</p><button class="button primary" id="sightResume">Продолжить</button><button class="replay" id="sightFinish">Завершить</button></div>`;
  $("sightResume").onclick = () => startSight(sight.target !== null);
  $("sightFinish").onclick = finishSight;
}
function finishSight() {
  const score = sight.score,
    total = sight.index + (sight.phase === "feedback" ? 1 : 0),
    speed = sight.kind === "speed";
  stopSight();
  stopAudio();
  sight.phase = "result";
  sightTop();
  $("counter").textContent = "Готово";
  const recordKey = timedModeRecordKey("sight"),
    previous = Number(store.get(recordKey, 0));
  if (speed) store.set(recordKey, Math.max(previous, score));
  $("training").innerHTML =
    `<div class="sight-content"><p class="phase-label">ПО СХЕМЕ · ${speed ? "НА ВРЕМЯ" : "ПРАКТИКА"}</p><h2>${score ? "Хорошая игра!" : "Попробуем ещё раз?"}</h2><div class="sight-result">${score}${speed ? "" : `<span> / ${total}</span>`}</div><p class="description">${speed ? "попаданий · лучшее комбо " + sight.best + " · бонус +" + sight.bonus.toLocaleString("ru-RU") + " с" : "Верно сыгранных заданий. Пропуски не засчитываются."}</p>${speed ? '<p class="sight-record-result">Рекорд · ' + Math.max(previous, score) + "</p>" : ""}<button class="button primary" id="sightAgain">${speed ? "Ещё 30 секунд" : "Ещё 10 заданий"}</button><button class="replay" id="sightMenu">К настройкам режима</button></div>`;
  $("sightAgain").onclick = () => startSight(false);
  $("sightMenu").onclick = () => showSightMenu();
}
document.addEventListener("visibilitychange", () => {
  if (
    document.hidden &&
    race.experience === "sight" &&
    ["requesting", "running", "feedback"].includes(sight.phase)
  )
    pauseSight();
});
window.addEventListener("pagehide", () => {
  stopSight();
  stopAudio();
});
const sightSettingsHandler = $("settingsButton").onclick;
$("settingsButton").onclick = () => {
  if (race.experience === "sight") pauseSight();
  sightSettingsHandler();
};

// Navigation has three independent decisions: activity, material and pace.
const paceControl = document.createElement("div");
paceControl.className = "pace-control";
paceControl.id = "paceControl";
paceControl.innerHTML =
  '<span class="control-caption">Режим</span><div class="pace-buttons" role="group" aria-label="Темп занятия"><button id="calmPace" class="pace-button">Обучение</button></div>';
const speedButton = $("speedExperience");
speedButton.className = "pace-button";
speedButton.textContent = "На скорость";
paceControl.querySelector(".pace-buttons").append(speedButton);
const setupControls = document.createElement("div");
setupControls.className = "setup-controls";
setupControls.id = "setupControls";
const materialControl = document.createElement("div");
materialControl.className = "material-control";
materialControl.innerHTML = '<span class="control-caption">Материал</span>';
const practiceTop = document.querySelector(".practice-top");
practiceTop.before(setupControls);
materialControl.append(practiceTop);
setupControls.append(materialControl, paceControl);
const listenButton = $("learnExperience");
listenButton.innerHTML =
  '<span class="activity-icon" aria-hidden="true">' +
  earIcon +
  "</span><strong>На слух</strong><small>Слушай и повторяй</small>";
sightButton.innerHTML =
  '<span class="activity-icon" aria-hidden="true">▥</span><strong>По схеме</strong><small>Смотри и играй</small>';
earButton.innerHTML =
  '<span class="activity-icon" aria-hidden="true">♬</span><strong>Без гитары</strong><small>Звук и гриф</small>';
experience.replaceChildren(listenButton, sightButton, earButton);
experience.setAttribute("aria-label", "Способ игры");
function syncPracticeNav() {
  if (!document.getElementById("calmPace")) return;
  const current = race.experience,
    speed =
      current === "speed" ||
      (current === "sight" && sight.kind === "speed") ||
      (current === "ear" && ear.kind === "speed");
  listenButton.setAttribute(
    "aria-pressed",
    String(current === "learn" || current === "speed"),
  );
  sightButton.setAttribute("aria-pressed", String(current === "sight"));
  earButton.setAttribute("aria-pressed", String(current === "ear"));
  $("calmPace").setAttribute("aria-pressed", String(!speed));
  speedButton.setAttribute("aria-pressed", String(speed));
}
function selectPace(speed) {
  if (race.experience === "sight") {
    stopSight();
    stopAudio();
    sight.kind = speed ? "speed" : "practice";
    showSightMenu();
  } else if (race.experience === "ear") {
    disposeEar();
    ear.kind = speed ? "speed" : "practice";
    showEarMenu();
  } else selectExperience(speed ? "speed" : "learn");
  syncPracticeNav();
}
$("calmPace").onclick = () => selectPace(false);
speedButton.onclick = () => selectPace(true);
const navEarMenu = showEarMenu;
showEarMenu = function (...args) {
  navEarMenu(...args);
  syncPracticeNav();
};
syncPracticeNav();

// One learning window: listening, playing and naming unfold inside the same card.
let unifiedQuestion = null;
const fallbackLearningRender = render;
render = function (focus = false) {
  if (race.experience !== "learn" || !learningAutoEnabled)
    return fallbackLearningRender(focus);
  progress();
  document.body.classList.add("in-exercise");
  if (!$("unifiedLearning")) {
    $("training").innerHTML =
      `<div class="content unified-learning" id="unifiedLearning"><div class="learning-toolbar"><button class="session-back" id="learnMenu" aria-label="Вернуться в меню обучения">← Меню</button><span>Обучение</span><button class="icon-btn" id="learnHelp" aria-label="Как играть">?</button><button class="icon-btn" id="learnSettings" aria-label="Настройки"></button></div><div id="stage"><p class="phase-label">НА ЗВУК · ОБУЧЕНИЕ</p><h2 id="unifiedTitle"></h2><p class="description">Послушай образец и повтори на гитаре. Всё происходит здесь — микрофон уже слушает.</p><button class="button primary" id="replaySound">Послушать образец</button><div class="micro-box" id="microBox"><div class="micro-title" id="microTitle" role="status" aria-live="polite">Подключаем микрофон…</div><div class="micro-copy" id="microCopy">После образца сыграй сам.</div></div><div id="micAlert" class="alert" role="alert" hidden></div><button class="button secondary" id="manualPlay">Я сыграл — без проверки</button><section class="learn-answer-panel" id="learnAnswerPanel" aria-hidden="true"><div class="learn-answer-inner"><h3 id="learnQuestionTitle"></h3><div class="answers" id="learnAnswers" role="group" aria-label="Варианты ответа"></div><div id="result"></div><div id="learnGallery"></div></div></section></div></div>`;
    unifiedQuestion = null;
  }
  const changed = unifiedQuestion !== state.target,
    chord = state.mode === "chords";
  $("unifiedTitle").textContent = chord
    ? "Услышь и повтори аккорд"
    : "Услышь и повтори ноту";
  if (changed) {
    unifiedQuestion = state.target;
    $("result").innerHTML = "";
    $("learnGallery").innerHTML = "";
    $("learnAnswers").innerHTML = state.options
      .map(
        (o, i) =>
          `<button class="answer" data-answer="${i}"><strong>${name(o)}</strong>${chord ? `<span>${o.min ? "минор" : "мажор"}</span>` : ""}</button>`,
      )
      .join("");
    $("learnQuestionTitle").textContent = chord
      ? "Теперь выбери название аккорда"
      : "Теперь выбери название ноты";
    $("microBox").classList.remove("matched");
  }
  const ready = state.stage === 3;
  $("learnAnswerPanel").classList.toggle("is-open", ready);
  $("learnAnswerPanel").inert = !ready;
  $("learnAnswerPanel").setAttribute("aria-hidden", String(!ready));
  $("manualPlay").hidden = ready;
  if (ready) {
    $("microBox").classList.add("matched");
    $("microTitle").textContent = state.matched
      ? "✓ Сыграно верно. Теперь выбери название."
      : "Игра подтверждена. Теперь выбери название.";
    $("microCopy").textContent = "Образец можно послушать ещё раз.";
    if (chord && !$("learnGallery").children.length)
      $("learnGallery").innerHTML = voicingGallery(state.target);
  }
  bindStage();
  $("learnMenu").onclick=()=>{clearTimeout(learningAdvanceTimer);stopAudio();stopMic();learningAutoEnabled=false;showLearningStart();syncPracticeNav();};
  $("learnHelp").innerHTML=$("helpButton").innerHTML;
  $("learnHelp").onclick=()=>$("helpButton").click();
  $("learnSettings").innerHTML=$("settingsButton").innerHTML;
  $("learnSettings").onclick=()=>$("settingsButton").click();
  if (
    state.stage === 2 &&
    learningAutoPlayed !== learningQuestionId &&
    !document.hidden
  ) {
    learningAutoPlayed = learningQuestionId;
    playTarget();
  }
};
// Keep the three primary labels identical in Android and on the web.
listenButton.querySelector("strong").textContent = "На звук";
// Preserve stable content and soften structural changes; audio never waits on motion.
let captionText = "",
  captionAnimation = null;
new MutationObserver(() => {
  const caption = $("microTitle");
  if (!caption || caption.textContent === captionText) return;
  captionText = caption.textContent;
  if (!matchMedia("(prefers-reduced-motion:reduce)").matches) {
    captionAnimation?.cancel();
    captionAnimation = caption.animate([{ opacity: 0.4 }, { opacity: 1 }], {
      duration: 400,
      easing: "ease-out",
    });
  }
}).observe($("training"), {
  subtree: true,
  childList: true,
  characterData: true,
});
// Re-tapping a bottom destination returns to its own material/pace settings.
listenButton.onclick = () => {
  if (race.experience === "speed") {
    disposeRace();
    showRaceMenu();
    syncPracticeNav();
    return;
  }
  selectExperience("learn");
  stopAudio();
  stopMic();
  learningAutoEnabled = false;
  showLearningStart();
  syncPracticeNav();
};
earButton.onclick = () => {
  if (race.experience === "ear") {
    disposeEar();
    exitFretFocus(false);
    showEarMenu();
    syncPracticeNav();
  } else selectExperience("ear");
};

ear.chordSet = store.get("aleatorika-ear-chord-set", "open");
if (!["open", "barre", "all"].includes(ear.chordSet)) ear.chordSet = "open";
const shapeEarMenu = showEarMenu;
showEarMenu = function (message = "") {
  shapeEarMenu(message);
  if (state.mode !== "chords") return;
  if (ear.kind === "speed")
    document
      .querySelector(".ear-menu-note")
      ?.replaceChildren(
        document.createTextNode(
          "Одна попытка на аккорд. После выбора — следующий звук. Ошибка сбрасывает комбо; правильный рисунок кратко подсветится.",
        ),
      );
  const group = document.createElement("div");
  group.className = "sight-shape-filter";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Аккорды без гитары");
  group.innerHTML = [
    ["open", "Открытые"],
    ["barre", "С баррэ"],
    ["all", "Все"],
  ]
    .map(
      ([id, title]) =>
        `<button data-ear-set="${id}" aria-pressed="${ear.chordSet === id}">${title}</button>`,
    )
    .join("");
  $("earStart").before(group);
  group.querySelectorAll("button").forEach(
    (b) =>
      (b.onclick = () => {
        ear.chordSet = b.dataset.earSet;
        store.set("aleatorika-ear-chord-set", ear.chordSet);
        showEarMenu();
      }),
  );
};
function earChordBank() {
  return ear.chordSet === "open" ? chords : sightChords;
}
function pickEarShape(c) {
  if (ear.chordSet === "open") return c;
  const shapes = chordVoicings(c).filter(
    (v) => ear.chordSet !== "barre" || barreSpan(v),
  );
  return shapes[Math.floor(Math.random() * shapes.length)];
}
const shapeEarTarget = pickEarTarget;
pickEarTarget = function () {
  const prev = ear.target;
  shapeEarTarget();
  if (state.mode !== "chords") return;
  const bank = earChordBank(),
    pool = bank.filter((c) => c.id !== prev?.id);
  ear.target = pickEarShape(pool[Math.floor(Math.random() * pool.length)]);
  ear.options = shuffle([
    ear.target,
    ...shuffle(bank.filter((c) => c.id !== ear.target.id))
      .slice(0, 2)
      .map(pickEarShape),
  ]);
};
