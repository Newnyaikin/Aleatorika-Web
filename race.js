"use strict";
// A separate, microphone-only speed game; the learning flow remains unchanged.
const race = {
  experience: "learn",
  phase: "menu",
  token: 0,
  raf: 0,
  timer: 0,
  stream: null,
  source: null,
  analyser: null,
  target: null,
  remaining: 30000,
  deadline: 0,
  score: 0,
  streak: 0,
  best: 0,
  errors: 0,
  bonusTotal: 0,
  lastFrame: 0,
  stableKey: null,
  stableFrames: 0,
  lastWrongKey: null,
  lastAcceptedKey: null,
  ignoreUntil: 0,
  flashTimer: 0,
  advanceTimer: 0,
  previous: null,
};
let theme = store.get("lad-theme", "system");
if (!["light", "dark", "system"].includes(theme)) theme = "system";
function applyTheme(value) {
  theme = value;
  store.set("lad-theme", value);
  if (value === "system")
    document.documentElement.removeAttribute("data-theme");
  else document.documentElement.dataset.theme = value;
}
applyTheme(theme);
const themeLabel = document.createElement("label");
themeLabel.htmlFor = "themeChoice";
themeLabel.textContent = "Тема приложения";
const themeSelect = document.createElement("select");
themeSelect.id = "themeChoice";
themeSelect.innerHTML =
  '<option value="system">Как на устройстве</option><option value="light">Светлая</option><option value="dark">Тёмная</option>';
themeSelect.value = theme;
themeSelect.onchange = () => applyTheme(themeSelect.value);
$("notation").previousElementSibling.before(themeLabel, themeSelect);
$("settings").querySelector(".version").textContent = "Алеаторика 1.0";
$("settings").querySelectorAll(".settings-info")[1].innerHTML =
  "<strong>Проверка через микрофон</strong>В обучении и на скорость проверяются ноты и 8 открытых аккордов (бета). В обучении можно продолжить кнопкой «Я сыграл — без проверки». Аудио обрабатывается на устройстве, без записи и отправки.";
$("settings").querySelectorAll(
  ".settings-info",
)[1].nextElementSibling.textContent =
  "Микрофон требует HTTPS и разрешения браузера. Встроенный просмотр может блокировать доступ.";
const experience = document.createElement("div");
experience.className = "experience-switch";
experience.setAttribute("role", "group");
experience.setAttribute("aria-label", "Формат практики");
experience.innerHTML =
  '<button class="experience-button" id="learnExperience" aria-pressed="true">Обучение</button><button class="experience-button" id="speedExperience" aria-pressed="false">На скорость</button>';
$("practice").prepend(experience);
const learningSetMode = setMode,
  learningRender = render;
render = function (focus = false) {
  if (race.experience === "learn") return learningRender(focus);
};
setMode = function (mode, force = false) {
  if (race.experience === "speed") {
    if (mode === state.mode && !force) return;
    disposeRace();
    learningSetMode(mode, true);
    showRaceMenu();
  } else learningSetMode(mode, force);
};
function selectExperience(value) {
  if (value === race.experience) return;
  disposeRace();
  stopAudio();
  stopMic();
  race.experience = value;
  document.body.classList.toggle("speed-on", value === "speed");
  document.body.classList.remove("in-exercise");
  $("learnExperience").setAttribute("aria-pressed", value === "learn");
  $("speedExperience").setAttribute("aria-pressed", value === "speed");
  $("progress").hidden = value === "speed";
  learningSetMode(state.mode, true);
  if (value === "speed") showRaceMenu();
  else {
    $("counter").parentElement.firstChild.textContent = "Тренировка";
    $("footerTip").querySelector("span").textContent =
      "Слушай в наушниках, чтобы микрофон слышал только гитару.";
  }
}
$("learnExperience").onclick = () => selectExperience("learn");
$("speedExperience").onclick = () => selectExperience("speed");
const settingsHandler = $("settingsButton").onclick;
$("settingsButton").onclick = () => {
  if (
    race.experience === "speed" &&
    ["running", "countdown", "requesting"].includes(race.phase)
  )
    pauseRace();
  settingsHandler();
};
function releaseRaceMic() {
  detachMicSink(race.analyser);
  cancelAnimationFrame(race.raf);
  if (race.stream) race.stream.getTracks().forEach((t) => t.stop());
  race.stream = null;
  if (race.source) {
    try {
      race.source.disconnect();
    } catch {}
  }
  race.source = null;
  race.analyser = null;
}
function disposeRace() {
  race.token++;
  clearInterval(race.timer);
  clearTimeout(race.flashTimer);
  clearTimeout(race.advanceTimer);
  releaseRaceMic();
  stopAudio();
  document.body.classList.remove("flash-right", "flash-wrong");
  race.phase = "menu";
}
function raceTop() {
  const chord = state.mode === "chords";
  $("counter").parentElement.firstChild.textContent = "На скорость";
  $("counter").textContent = chord ? "Аккорды · бета" : "Ноты";
  $("asideNote").textContent =
    "30 секунд на старте. Каждые 3 верных попадания подряд дают +5 секунд. Названия выбирать не нужно.";
  $("footerTip").querySelector("span").textContent =
    "Нужны наушники и доступ к микрофону. Вибрация доступна не во всех браузерах.";
}
function showRaceMenu(message = "") {
  race.phase = "menu";
  raceTop();
  const chord = state.mode === "chords";
  $("training").innerHTML =
    `<div class="race-content"><p class="phase-label">ОТДЕЛЬНЫЙ РЕЖИМ</p><h2>Игра на скорость</h2><p class="race-subtitle">Услышь ${chord ? "аккорд" : "ноту"} и повтори на гитаре — здесь же, без выбора названия.</p>${chord ? '<span class="beta">Распознавание аккордов · бета</span><p class="race-caption">C, D, E, G, A, Am, Dm, Em — в открытых аппликатурах. Возможны ошибки распознавания.</p>' : ""}<div class="race-rules"><div class="race-rule"><strong>3–2–1</strong><span>перед стартом</span></div><div class="race-rule"><strong>30 сек</strong><span>на старте</span></div><div class="race-rule"><strong>+5 сек</strong><span>за 3 подряд</span></div></div><p class="race-caption">Верно — зелёный экран и следующий звук. Ошибка — красный экран и вибрация, комбо сбрасывается. Игра продолжается, пока не закончится время.</p><button class="button primary" id="raceStart">Начать игру</button>${message ? `<p class="race-message" role="alert">${message}</p>` : ""}<p class="race-caption" style="margin:16px 0 0">Перед стартом разреши микрофон и надень наушники. Без микрофона автоматическая игра недоступна.</p></div>`;
  $("raceStart").onclick = () => startRace(false);
}
async function startRace(resume = false) {
  disposeRace();
  const token = race.token;
  if (!resume) {
    race.remaining = 30000;
    race.score = 0;
    race.streak = 0;
    race.best = 0;
    race.errors = 0;
    race.bonusTotal = 0;
    race.target = null;
    race.previous = null;
    race.lastAcceptedKey = null;
    race.lastWrongKey = null;
  }
  race.phase = "requesting";
  $("training").innerHTML =
    '<div class="race-countdown">' +
    micIcon +
    '<h2>Подключаем микрофон</h2><p class="race-subtitle">Разреши доступ в браузере. Таймер ещё не запущен.</p><button class="button secondary" id="cancelRequest">Отмена</button></div>';
  $("cancelRequest").onclick = () => {
    disposeRace();
    showRaceMenu();
  };
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("UNSUPPORTED");
    const ctx = await getAudio();
    const media = await requestGuitarMic();
    if (token !== race.token) {
      media.getTracks().forEach((t) => t.stop());
      return;
    }
    race.stream = media;
    race.analyser = ctx.createAnalyser();
    race.analyser.fftSize = state.mode === "notes" ? 4096 : 8192;
    race.analyser.smoothingTimeConstant = 0.15;
    race.source = ctx.createMediaStreamSource(media);
    race.source.connect(race.analyser);
    attachMicSink(ctx, race.analyser);
    await ctx.resume();
    race.phase = "countdown";
    let count = 3;
    const countView = () => {
      $("training").innerHTML =
        `<div class="race-countdown"><p class="phase-label">ПРИГОТОВЬ ГИТАРУ</p><div class="countdown-number" role="status" aria-live="assertive">${count}</div><p class="race-subtitle">После отсчёта сразу прозвучит ${state.mode === "notes" ? "нота" : "аккорд"}.</p><button class="text-btn" id="cancelCount">Отмена</button></div>`;
      $("cancelCount").onclick = () => {
        disposeRace();
        showRaceMenu();
      };
    };
    countView();
    race.timer = setInterval(() => {
      if (token !== race.token) return;
      count--;
      if (count === 0) {
        clearInterval(race.timer);
        race.phase = "running";
        race.deadline = performance.now() + race.remaining;
        renderRaceLive();
        if (!resume || !race.target) pickRaceTarget();
        racePlay();
        listenRace();
        race.timer = setInterval(tickRace, 80);
      } else countView();
    }, 1000);
  } catch (e) {
    if (token !== race.token) return;
    disposeRace();
    showRaceMenu(
      e.message === "UNSUPPORTED"
        ? "Микрофон недоступен в этом просмотре. Открой приложение отдельной вкладкой по HTTPS в Safari или Chrome."
        : e.name === "NotAllowedError"
          ? "Нет разрешения на микрофон. Разреши доступ в настройках сайта и попробуй снова."
          : e.name === "NotFoundError"
            ? "Микрофон не найден. Подключи его и попробуй снова."
            : "Не удалось запустить микрофон. Попробуй открыть приложение в Safari или Chrome.",
    );
  }
}
function renderRaceLive() {
  raceTop();
  $("training").innerHTML =
    `<div class="sight-topbar common-session-bar"><button id="raceExit" class="session-back" aria-label="Завершить занятие и показать итоги">Итоги</button><span>На звук · на время</span><button id="racePause" class="session-pause" aria-label="Пауза">Ⅱ</button></div><div class="race-hud"><div><label>Осталось</label><div class="race-timer" id="raceTime">${Math.ceil(race.remaining / 1000)}</div></div><div><label>Попадания</label><div class="race-score" id="raceScore">${race.score}</div></div><div><label>Комбо</label><div class="combo-dots" id="raceCombo" aria-label="Комбо 0 из 3"><span class="combo-dot"></span><span class="combo-dot"></span><span class="combo-dot"></span></div><div class="combo-copy">3 подряд → +5 сек</div></div></div><div class="race-live"><div class="race-glyph" id="raceGlyph">${earIcon}</div><h2 id="raceTitle">Слушай образец</h2><div class="race-signal" id="raceSignal">${wave()}</div><div class="race-status" id="raceStatus" role="status" aria-live="polite">После звука сыграй на гитаре.</div><p class="race-bonus" id="raceBonus" role="status" aria-live="polite"></p><button class="button primary" id="raceReplay">Нажмите чтобы услышать</button>${state.mode === "chords" ? '<span class="beta" style="margin:12px 0 0">Автопроверка аккордов · бета</span>' : ""}</div>`;
  $("raceReplay").onclick = racePlay;
  $("racePause").onclick = () => pauseRace();
  $("raceExit").onclick = () => finishRace(true);
  updateRaceHud();
}
function pickRaceTarget() {
  const previous = race.target;
  if (state.mode === "notes") {
    const pool = notes.filter((n) => !previous || n.pc !== previous.pc),
      pc = pool[Math.floor(Math.random() * pool.length)].pc,
      positions = notePositions(pc);
    race.target = positions[Math.floor(Math.random() * positions.length)];
  } else {
    const pool = chords.filter((c) => !previous || c.id !== previous.id);
    race.target = pool[Math.floor(Math.random() * pool.length)];
  }
  race.stableKey = null;
  race.stableFrames = 0;
  race.lastWrongKey = null;
}
async function racePlay() {
  if (race.phase !== "running") return;
  if (performance.now() >= race.deadline) {
    finishRace();
    return;
  }
  stopAudio();
  const token = race.token;
  race.stableFrames = 0;
  race.stableKey = null;
  race.ignoreUntil = Infinity;
  const button = $("raceReplay");
  if (button) {
    button.disabled = true;
    button.textContent = "Звучит образец…";
  }
  try {
    const ctx = await getAudio();
    if (token !== race.token || race.phase !== "running") return;
    const start = ctx.currentTime + 0.02;
    let duration;
    if (state.mode === "notes") {
      duration = 800;
      pluck(ctx, race.target.midi, start, 0.42, 0.6);
    } else {
      const mids = race.target.frets
        .map((f, i) => (f < 0 ? null : openMidi[i] + f))
        .filter((m) => m !== null);
      duration = 800;
      mids.forEach((m, i) =>
        pluck(ctx, m, start + i * 0.03, 0.7 / mids.length, 0.55),
      );
    }
    race.ignoreUntil = performance.now() + SAMPLE_MIC_MUTE_MS;
    beginSampleInputGuard();
    $("raceTitle").textContent = "Слушай образец";
    $("raceStatus").className = "race-status";
    $("raceStatus").textContent =
      "Первая секунда образца — без проверки. Затем можно играть.";
    $("raceSignal").classList.add("playing");
    clearTimeout(race.advanceTimer);
    race.advanceTimer = setTimeout(() => {
      if (token !== race.token || race.phase !== "running") return;
      $("raceReplay").disabled = false;
      $("raceReplay").textContent = "Нажмите чтобы услышать";
      $("raceTitle").textContent = "Теперь сыграй на гитаре";
      $("raceStatus").textContent = "Слушаю. Название выбирать не нужно.";
      $("raceSignal").classList.remove("playing");
    }, duration + 200);
  } catch (e) {
    pauseRace("Не удалось воспроизвести звук. Попробуй продолжить игру.");
  }
}
function updateRaceHud() {
  if (!$("raceTime")) return;
  const seconds = Math.max(0, Math.ceil(race.remaining / 1000));
  $("raceTime").textContent = seconds;
  $("raceTime").classList.toggle("urgent", seconds <= 10);
  $("raceScore").textContent = race.score;
  const filled = race.streak > 0 && race.streak % 3 === 0 ? 3 : race.streak % 3;
  $("raceCombo").setAttribute("aria-label", `Комбо ${filled} из 3`);
  $("raceCombo")
    .querySelectorAll("span")
    .forEach((el, i) => el.classList.toggle("filled", i < filled));
}
function tickRace() {
  if (race.phase !== "running") return;
  race.remaining = Math.max(0, race.deadline - performance.now());
  updateRaceHud();
  if (!race.remaining) finishRace();
}
function flashRace(correct) {
  if (correct) celebrateSuccess();
  clearTimeout(race.flashTimer);
  document.body.classList.remove("flash-right", "flash-wrong");
  document.body.classList.add(correct ? "flash-right" : "flash-wrong");
  $("raceGlyph").innerHTML = correct
    ? checkIcon
    : '<span aria-hidden="true" style="font-size:36px;line-height:1">×</span>';
  race.flashTimer = setTimeout(() => {
    document.body.classList.remove("flash-right", "flash-wrong");
    if ($("raceGlyph")) $("raceGlyph").innerHTML = earIcon;
  }, 650);
}
function raceVerdict(key) {
  if (race.phase !== "running" || performance.now() < race.ignoreUntil) return;
  if (performance.now() >= race.deadline) {
    finishRace();
    return;
  }
  const expected =
    state.mode === "notes" ? String(race.target.pc) : race.target.id;
  if (key === expected) {
    race.score++;
    race.streak++;
    race.best = Math.max(race.best, race.streak);
    race.lastAcceptedKey = key;
    const bonus = race.streak % 3 === 0;
    if (bonus) {
      race.deadline += 5000;
      race.bonusTotal += 5;
    }
    $("raceBonus").textContent = bonus ? "Комбо из 3! +5 секунд" : "";
    race.remaining = race.deadline - performance.now();
    updateRaceHud();
    flashRace(true);
    $("raceStatus").className = "race-status good";
    $("raceStatus").textContent = bonus
      ? "Точно! Время прибавлено."
      : "Верно! Следующий звук.";
    $("raceTitle").textContent = "Попадание!";
    race.ignoreUntil = Infinity;
    $("raceReplay").disabled = true;
    $("raceReplay").textContent = "Следующий звук…";
    pickRaceTarget();
    clearTimeout(race.advanceTimer);
    race.advanceTimer = setTimeout(() => {
      if (race.phase !== "running") return;
      racePlay();
    }, 280);
  } else {
    if (key === race.lastAcceptedKey || key === race.lastWrongKey) return;
    race.lastWrongKey = key;
    race.lastAcceptedKey = null;
    race.streak = 0;
    race.errors++;
    $("raceBonus").textContent = "";
    updateRaceHud();
    flashRace(false);
    $("raceStatus").className = "race-status error";
    $("raceStatus").textContent = "Не совпало. Попробуй ещё раз — звук тот же.";
    try {
      navigator.vibrate?.(120);
    } catch {}
  }
}
// Harmonic pitch-class profiles, with a low-note cue, for eight open voicings.
// This is an experimental local classifier, not a general-purpose chord recognizer.
function chordProfile(c) {
  const v = new Float32Array(12);
  c.frets.forEach((f, i) => {
    if (f < 0) return;
    const midi = openMidi[i] + f;
    for (let h = 1; h <= 4; h++) {
      const p = ((Math.round(midi + 12 * Math.log2(h)) % 12) + 12) % 12;
      v[p] += 1 / Math.pow(h, 2.2);
    }
  });
  return v;
}
const chordProfiles = chords.map((c) => ({
  chord: c,
  vector: chordProfile(c),
}));
function classifyRaceChord(db, sampleRate, fftSize) {
  const chroma = new Float32Array(12);
  let strongest = 0;
  const peaks = [];
  for (let k = 2; k < db.length - 1; k++) {
    const f = (k * sampleRate) / fftSize;
    if (
      f < 73 ||
      f > 1700 ||
      db[k] < -78 ||
      db[k] < db[k - 1] ||
      db[k] < db[k + 1]
    )
      continue;
    const a = db[k - 1],
      b = db[k],
      c = db[k + 1],
      den = a - 2 * b + c,
      offset = den ? (0.5 * (a - c)) / den : 0;
    const freq =
      ((k + Math.max(-0.5, Math.min(0.5, offset))) * sampleRate) / fftSize;
    const exact = 69 + 12 * Math.log2(freq / 440),
      m = Math.round(exact);
    if (Math.abs(exact - m) > 0.38) continue;
    const weight = Math.pow(10, db[k] / 25) / Math.pow(freq / 100, 0.12);
    strongest = Math.max(strongest, weight);
    peaks.push({ m, weight });
  }
  if (!peaks.length) return null;
  for (const p of peaks)
    if (p.weight > strongest * 0.035)
      chroma[((p.m % 12) + 12) % 12] += p.weight;
  let norm = Math.hypot(...chroma);
  if (!norm) return null;
  const bassCandidates = peaks
    .filter((p) => p.m <= 62 && p.weight > strongest * 0.18)
    .sort((a, b) => a.m - b.m);
  const bass = bassCandidates.length
    ? ((bassCandidates[0].m % 12) + 12) % 12
    : null;
  const ranked = chordProfiles
    .map(({ chord, vector }) => {
      let dot = 0;
      for (let i = 0; i < 12; i++) dot += chroma[i] * vector[i];
      const similarity = dot / (norm * Math.hypot(...vector)),
        fundamentals = chord.frets
          .map((f, i) => (f < 0 ? null : openMidi[i] + f))
          .filter((m) => m !== null),
        triad = [
          chord.root,
          (chord.root + (chord.min ? 3 : 4)) % 12,
          (chord.root + 7) % 12,
        ],
        covered = triad.every((pc) =>
          peaks.some((p) => p.m % 12 === pc && p.weight > strongest * 0.06),
        );
      return {
        id: chord.id,
        score: similarity * 0.93 + (bass === chord.root ? 0.07 : 0),
        similarity,
        covered,
      };
    })
    .sort((a, b) => b.score - a.score);
  if (
    !ranked[0].covered ||
    ranked[0].similarity < 0.8 ||
    ranked[0].score - ranked[1].score < 0.025
  )
    return null;
  return ranked[0].id;
}
function listenRace() {
  const token = race.token,
    ana = race.analyser,
    ctx = audioCtx;
  if (!ana) return;
  const time = new Float32Array(ana.fftSize),
    db = new Float32Array(ana.frequencyBinCount);
  race.lastFrame = 0;
  const loop = (t) => {
    if (token !== race.token || race.phase !== "running") return;
    if (t - race.lastFrame >= 65) {
      race.lastFrame = t;
      if (t >= race.ignoreUntil) {
        ana.getFloatTimeDomainData(time);
        if (!microphoneReadyForInput(time, t)) {
          race.stableFrames = 0;
          race.stableKey = null;
          race.raf = requestAnimationFrame(loop);
          return;
        }
        let rms = 0;
        for (let i = 0; i < time.length; i++) rms += time[i] * time[i];
        rms = Math.sqrt(rms / time.length);
        let key = null;
        if (rms >= 0.008) {
          if (state.mode === "notes") {
            const f = pitchFrom(time, ctx.sampleRate);
            if (f) {
              const exact = 69 + 12 * Math.log2(f / 440),
                m = Math.round(exact);
              if (Math.abs(exact - m) < 0.4) key = String(((m % 12) + 12) % 12);
            }
          } else {
            ana.getFloatFrequencyData(db);
            key = classifyRaceChord(db, ctx.sampleRate, ana.fftSize);
          }
        } else {
          race.lastWrongKey = null;
          race.lastAcceptedKey = null;
        }
        if (key !== null) {
          if (key === race.stableKey) race.stableFrames++;
          else {
            race.stableKey = key;
            race.stableFrames = 1;
          }
          if (race.stableFrames >= 2) raceVerdict(key);
        } else {
          race.stableKey = null;
          race.stableFrames = 0;
        }
      }
    }
    race.raf = requestAnimationFrame(loop);
  };
  race.raf = requestAnimationFrame(loop);
}
function pauseRace(message = "") {
  if (!["running", "countdown", "requesting"].includes(race.phase)) return;
  const wasRunning = race.phase === "running";
  if (wasRunning)
    race.remaining = Math.max(0, race.deadline - performance.now());
  if (wasRunning && !race.remaining) {
    finishRace();
    return;
  }
  disposeRace();
  race.phase = "paused";
  $("training").innerHTML =
    `<div class="race-content"><p class="phase-label">ПАУЗА</p><h2>Вернись в свой ритм</h2><p class="race-subtitle">Осталось ${Math.ceil(race.remaining / 1000)} сек. Попадания и комбо сохранены. После продолжения — отсчёт 3–2–1.</p>${message ? `<p class="race-message">${message}</p>` : ""}<button class="button primary" id="raceResume">Продолжить</button><button class="replay" id="raceQuit">Завершить игру</button></div>`;
  $("raceResume").onclick = () => startRace(true);
  $("raceQuit").onclick = () => finishRace(true);
}
function finishRace(early = false) {
  if (race.phase === "result") return;
  disposeRace();
  race.phase = "result";
  const recordKey = timedModeRecordKey("speed"),
    previous = store.get(recordKey, 0),
    record = Math.max(previous, race.score);
  store.set(recordKey, record);
  $("training").innerHTML =
    `<div class="race-content"><p class="phase-label">${early ? "ИГРА ЗАВЕРШЕНА" : "ВРЕМЯ ВЫШЛО"}</p><h2>${race.score ? "Хорошая игра!" : "Попробуем ещё раз?"}</h2><p class="race-subtitle">${state.mode === "notes" ? "Ноты" : "Аккорды · экспериментальная проверка"} · без выбора названий</p><div class="race-result-stats"><div><strong>${race.score}</strong><span>попаданий</span></div><div><strong>${race.best}</strong><span>лучшее комбо</span></div><div><strong>+${race.bonusTotal.toLocaleString("ru-RU")} сек</strong><span>заработано времени</span></div><div><strong>${record}</strong><span>личный рекорд</span></div></div><p class="race-record">${race.score > previous ? "Новый личный рекорд!" : "Результат сохранён на этом устройстве."}</p><button class="button primary" id="raceAgain">Играть ещё</button><button class="replay" id="raceBack">Назад к режиму</button></div>`;
  $("raceAgain").onclick = () => startRace(false);
  $("raceBack").onclick = () => showRaceMenu();
  announce("Игра завершена. Попаданий: " + race.score);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden && race.experience === "speed") pauseRace();
});
window.addEventListener("pagehide", disposeRace);
