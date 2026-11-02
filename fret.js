"use strict";
function compactFretSpace(range, index) {
  return (
    44 +
    28 * (1 - Math.exp(-(44 * Math.pow(2, (range - 1 - index) / 12) - 44) / 40))
  );
}

const ear = {
  kind: "practice",
  phase: "menu",
  orientation: store.get("aleatorika-fret-orientation", "vertical"),
  range: store.get("aleatorika-fret-range", 5),
  token: 0,
  timer: 0,
  audioTimer: 0,
  flashTimer: 0,
  nextTimer: 0,
  playing: false,
  target: null,
  options: [],
  selected: null,
  answered: false,
  correct: false,
  index: 0,
  results: [],
  score: 0,
  streak: 0,
  best: 0,
  bonus: 0,
  remaining: 30000,
  deadline: 0,
  lockUntil: 0,
};
if (!["vertical", "horizontal"].includes(ear.orientation))
  ear.orientation = "vertical";
if (![5, 12, 19, 24].includes(ear.range)) ear.range = 5;
const earButton = document.createElement("button");
earButton.id = "earExperience";
earButton.className = "experience-button";
earButton.setAttribute("aria-pressed", "false");
earButton.textContent = "Без гитары";
experience.append(earButton);
const previousSelectExperience = selectExperience,
  previousSetMode = setMode;
selectExperience = function (value) {
  if (value === "ear") {
    if (race.experience === "ear") return;
    disposeRace();
    stopMic();
    race.experience = "ear";
    document.body.classList.remove("speed-on", "in-exercise");
    document.body.classList.add("ear-on");
    $("learnExperience").setAttribute("aria-pressed", "false");
    $("speedExperience").setAttribute("aria-pressed", "false");
    earButton.setAttribute("aria-pressed", "true");
    $("progress").hidden = true;
    learningSetMode(state.mode, true);
    showEarMenu();
  } else {
    if (race.experience === "ear") disposeEar();
    document.body.classList.remove("ear-on");
    earButton.setAttribute("aria-pressed", "false");
    previousSelectExperience(value);
  }
};
setMode = function (mode, force = false) {
  if (race.experience === "ear") {
    if (mode === state.mode && !force) return;
    disposeEar();
    previousSetMode(mode, true);
    showEarMenu();
  } else previousSetMode(mode, force);
};
earButton.onclick = () => selectExperience("ear");
const earSettingsHandler = $("settingsButton").onclick;
$("settingsButton").onclick = () => {
  if (
    race.experience === "ear" &&
    ["question", "countdown"].includes(ear.phase)
  )
    pauseEar();
  earSettingsHandler();
};
$("settings").querySelector(".version").textContent = "Алеаторика 1.0";
function disposeEar() {
  ear.token++;
  clearInterval(ear.timer);
  clearTimeout(ear.audioTimer);
  clearTimeout(ear.flashTimer);
  clearTimeout(ear.nextTimer);
  ear.playing = false;
  stopAudio();
  document.body.classList.remove("flash-right", "flash-wrong");
  ear.phase = "menu";
}
function earTop() {
  const speed = ear.kind === "speed";
  $("counter").parentElement.firstChild.textContent = "Без гитары";
  $("counter").textContent = speed
    ? "На время"
    : ear.phase === "question" || ear.phase === "answered"
      ? `${ear.index + 1} из 10`
      : "Тренировка";
  $("asideNote").textContent =
    "Ноты отмечаются на грифе, аккорды выбираются по рисунку. Микрофон не используется.";
  $("footerTip").querySelector("span").textContent =
    state.mode === "notes"
      ? "Микрофон и гитара не нужны. Октава скрыта до ответа. Гриф — в стандартном строе."
      : "Микрофон и гитара не нужны. Выбирай по рисунку; названия скрыты до ответа.";
}
function phoneFret() {
  return matchMedia("(max-width:760px), (hover:none) and (pointer:coarse)")
    .matches;
}
function syncFretDevice() {
  if (phoneFret()) ear.orientation = "vertical";
}
function showEarMenu(message = "") {
  syncFretDevice();
  ear.phase = "menu";
  earTop();
  const chord = state.mode === "chords",
    speed = ear.kind === "speed";
  $("training").innerHTML =
    `<div class="ear-content"><div class="ear-format" role="group" aria-label="Режим без гитары"><button id="earPractice" aria-pressed="${!speed}">Тренировка</button><button id="earSpeed" aria-pressed="${speed}">На время</button></div><span class="ear-badge">${chord ? "Выбор по рисунку" : "Интерактивный гриф"} · без микрофона</span><h2>${chord ? "Узнай аккорд по звучанию" : "Услышь ноту. Найди на грифе."}</h2><p class="ear-description">${chord ? "Послушай аккорд и выбери одну из трёх аппликатур. Названия появятся только после ответа." : "Послушай ноту и отметь струну и лад. Если тот же звук есть в нескольких местах, подойдёт любое — в той же октаве."}</p>${chord ? "" : `<div class="ear-menu-fields"><div><label for="earOrientation">Расположение грифа</label><select id="earOrientation"><option value="vertical">Вдоль ↓</option><option value="horizontal">Поперёк →</option></select></div><div class="ear-range-field"><label for="earRange">Диапазон ладов</label><select id="earRange" class="range-native" hidden tabindex="-1"><option value="5">0–5 ладов</option><option value="12">0–12 ладов</option><option value="19">0–19 ладов</option><option value="24">0–24 лада</option></select></div></div>`}${speed ? '<div class="race-rules"><div class="race-rule"><strong>3–2–1</strong><span>перед стартом</span></div><div class="race-rule"><strong>30 сек</strong><span>на старте</span></div><div class="race-rule"><strong>+5 сек</strong><span>за 3 подряд</span></div></div><p class="ear-menu-note" style="margin-bottom:20px">Верный ответ запускает следующий звук. Ошибка сбрасывает комбо, но можно попробовать снова. Задания не заканчиваются, пока есть время.</p>' : '<p class="ear-menu-note" style="margin-bottom:20px">10 заданий без спешки. Для ноты на грифе — 3 попытки. Повтор звука не тратит попытку.</p>'}<button class="button primary" id="earStart">${speed ? "Играть на время" : "Начать тренировку"}</button>${message ? `<p class="race-message" role="alert">${message}</p>` : ""}</div>`;
  $("earPractice").onclick = () => {
    ear.kind = "practice";
    showEarMenu();
  };
  $("earSpeed").onclick = () => {
    ear.kind = "speed";
    showEarMenu();
  };
  if (!chord) {
    $("earOrientation").parentElement.classList.add("ear-orientation-field");
    $("earOrientation").parentElement.hidden = phoneFret();
    $("earOrientation").disabled = phoneFret();
    $("earOrientation").value = ear.orientation;
    $("earRange").value = String(ear.range);
    const rangeButtons = document.createElement("div");
    rangeButtons.className = "fret-range-filter";
    rangeButtons.setAttribute("role", "group");
    rangeButtons.setAttribute("aria-label", "Диапазон ладов");
    rangeButtons.innerHTML = [5, 12, 19, 24].map(n => `<button type="button" data-range="${n}" aria-pressed="${ear.range === n}">0–${n}</button>`).join("");
    $("earRange").after(rangeButtons);
    rangeButtons.querySelectorAll("button").forEach(button => button.onclick = () => {
      $("earRange").value = button.dataset.range;
      $("earRange").dispatchEvent(new Event("change", {bubbles: true}));
      rangeButtons.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
    });
    $("earOrientation").onchange = (e) => {
      ear.orientation = e.target.value;
      store.set("aleatorika-fret-orientation", ear.orientation);
    };
    $("earRange").onchange = (e) => {
      ear.range = Number(e.target.value);
      store.set("aleatorika-fret-range", ear.range);
      refreshMenuRecord();
    };
  }
  $("earStart").onclick = () => startEar(false);
}
async function startEar(resume = false) {
  disposeEar();
  const token = ear.token;
  try {
    await getAudio();
    if (token !== ear.token) return;
    if (!resume) {
      ear.index = 0;
      ear.results = [];
      ear.score = 0;
      ear.streak = 0;
      ear.best = 0;
      ear.bonus = 0;
      ear.remaining = 30000;
      ear.target = null;
      pickEarTarget();
    }
    if (ear.kind === "speed") {
      ear.phase = "countdown";
      let count = 3;
      const draw = () => {
        $("training").innerHTML =
          `<div class="race-countdown"><p class="phase-label">БЕЗ ГИТАРЫ · НА ВРЕМЯ</p><div class="countdown-number" role="status" aria-live="assertive">${count}</div><p class="race-subtitle">Слушай, затем ${state.mode === "notes" ? "отметь ноту на грифе" : "выбери рисунок аккорда"}.</p><button class="text-btn" id="earCancelCount">Отмена</button></div>`;
        $("earCancelCount").onclick = () => {
          disposeEar();
          showEarMenu();
        };
      };
      draw();
      ear.timer = setInterval(() => {
        if (token !== ear.token) return;
        count--;
        if (count === 0) {
          clearInterval(ear.timer);
          ear.phase = "question";
          ear.deadline = performance.now() + ear.remaining;
          renderEarQuestion();
          playEarTarget();
          ear.timer = setInterval(tickEar, 80);
        } else draw();
      }, 1000);
    } else {
      ear.phase = "question";
      renderEarQuestion();
      playEarTarget();
    }
  } catch (e) {
    disposeEar();
    showEarMenu(
      "Не удалось включить звук. Открой приложение в Safari или Chrome и попробуй снова.",
    );
  }
}
function earPositions(pc) {
  return openMidi.flatMap((m, i) =>
    Array.from({ length: ear.range + 1 }, (_, f) => ({
      pc: (m + f) % 12,
      midi: m + f,
      string: 6 - i,
      fret: f,
    })).filter((n) => n.pc === pc),
  );
}
function pickEarTarget() {
  const prev = ear.target;
  if (state.mode === "notes") {
    const pool = notes.filter((n) => !prev || n.pc !== prev.pc),
      pc = pool[Math.floor(Math.random() * pool.length)].pc,
      positions = earPositions(pc),
      midis = [...new Set(positions.map((n) => n.midi))],
      midi = midis[Math.floor(Math.random() * midis.length)];
    ear.target = positions.find((n) => n.midi === midi);
    ear.options = [];
  } else {
    const pool = chords.filter((c) => !prev || c.id !== prev.id);
    ear.target = pool[Math.floor(Math.random() * pool.length)];
    ear.options = shuffle([
      ear.target,
      ...shuffle(chords.filter((c) => c !== ear.target)).slice(0, 2),
    ]);
  }
  ear.selected = null;
  ear.answered = false;
  ear.correct = false;
  ear.lockUntil = 0;
  ear.resetScroll = true;
}
function earHud() {
  if (ear.kind === "speed")
    return `<div class="ear-hud"><div><span>Осталось</span><strong class="ear-time" id="earTime">${Math.ceil(ear.remaining / 1000)}</strong></div><div><span>Попадания</span><strong id="earScore">${ear.score}</strong></div><div><span>Комбо</span><strong id="earCombo">${ear.streak % 3 || (ear.streak ? 3 : 0)} / 3</strong><span class="ear-bonus-hud" id="earBonus">${ear.bonus ? "+ " + ear.bonus.toLocaleString("ru-RU") + " сек" : ""}</span></div></div>`;
  return `<div class="ear-hud"><div><span>Тренировка</span><strong>${ear.index + 1} / 10</strong></div><div><span>Правильно</span><strong>${ear.score}</strong></div></div>`;
}
function boardCell(string, fret) {
  const midi = openMidi[6 - string] + fret,
    same = ear.target && midi === ear.target.midi,
    selected =
      ear.selected &&
      ear.selected.string === string &&
      ear.selected.fret === fret,
    show = ear.answered && ear.kind === "practice",
    hit = (show && same) || (selected && ear.correct),
    miss = selected && !ear.correct;
  const text = hit ? "✓" : miss ? "×" : "";
  return `<button class="fret-cell ${fret === 0 ? "open " : ""}${[3, 5, 7, 9, 15, 17, 19, 21].includes(fret) && string === 4 ? "inlay " : ""}${[12, 24].includes(fret) && [5, 2].includes(string) ? "double-inlay " : ""}${hit ? "hit " : ""}${miss ? "miss " : ""}" style="--string-width:${1 + (string - 1) * 0.22}px" data-string="${string}" data-fret="${fret}" aria-label="${string}-я струна, ${fret === 0 ? "открытая" : fret + "-й лад"}${hit ? ", верная позиция" : miss ? ", не совпало" : ""}" ${ear.answered ? "disabled" : ""}>${text ? `<span class="fret-mark" aria-hidden="true">${text}</span>` : fret === 0 ? '<span class="fret-open" aria-hidden="true"></span>' : ""}</button>`;
}
function earBoard() {
  const vertical = ear.orientation === "vertical";
  const spaces = Array.from(
    { length: ear.range },
    (_, i) => compactFretSpace(ear.range, i).toFixed(2) + "px",
  );
  const tracks = vertical
    ? "grid-template-rows:28px 44px " + spaces.join(" ")
    : "grid-template-columns:28px 44px " + spaces.join(" ");
  let html = `<div class="ear-board ${ear.orientation}" style="--cols:${ear.range + 1};${tracks}" role="group" aria-label="Гитарный гриф, лады от 0 до ${ear.range}">`;
  html += '<span class="ear-board-head">' + (vertical ? "лад" : "") + "</span>";
  if (vertical) {
    for (let s = 6; s >= 1; s--)
      html += `<span class="ear-board-head" aria-hidden="true">${s}</span>`;
    for (let f = 0; f <= ear.range; f++) {
      html += `<span class="ear-board-label" aria-hidden="true">${f}</span>`;
      for (let s = 6; s >= 1; s--) html += boardCell(s, f);
    }
  } else {
    for (let f = 0; f <= ear.range; f++)
      html += `<span class="ear-board-head" aria-hidden="true">${f}</span>`;
    for (let s = 1; s <= 6; s++) {
      html += `<span class="ear-board-label" aria-hidden="true">${s}</span>`;
      for (let f = 0; f <= ear.range; f++) html += boardCell(s, f);
    }
  }
  return html + "</div>";
}
function anonymousChord(c, index) {
  return chordDiagram(c)
    .replace('class="diagram"', 'class="ear-chord-diagram"')
    .replace(
      /aria-label="[^"]*"/,
      `aria-label="Аппликатура ${index + 1}: от 6-й струны к 1-й, ${c.frets.map((f) => (f < 0 ? "не играть" : f === 0 ? "открытая" : f + " лад")).join(", ")}"`,
    );
}
function earChordOptions() {
  return (
    '<div class="ear-chord-options" role="group" aria-label="Выбери аппликатуру">' +
    ear.options
      .map((c, i) => {
        const show = ear.answered,
          hit =
            (show && c === ear.target) || (ear.selected === i && ear.correct),
          miss = ear.selected === i && !ear.correct;
        return `<button class="ear-chord-choice ${hit ? "hit" : miss ? "miss" : ""}" data-ear-chord="${i}" aria-label="Выбрать рисунок ${i + 1}: от 6-й струны к 1-й, ${c.frets.map((f) => (f < 0 ? "не играть" : f === 0 ? "открытая" : f + " лад")).join(", ")}" ${ear.answered ? "disabled" : ""}><span class="ear-variant">${hit ? "✓ " : miss ? "× " : ""}${i + 1}</span>${anonymousChord(c, i)}</button>`;
      })
      .join("") +
    "</div>"
  );
}
function renderEarQuestion() {
  syncFretDevice();
  const previousViewport = $("earBoardViewport"),
    scroll =
      previousViewport && !ear.resetScroll
        ? { top: previousViewport.scrollTop, left: previousViewport.scrollLeft }
        : { top: 0, left: 0 };
  ear.resetScroll = false;
  earTop();
  const chord = state.mode === "chords";
  $("training").innerHTML =
    `<div class="sight-topbar common-session-bar"><button id="earExit" class="session-back" aria-label="Завершить занятие и показать итоги">Итоги</button><span>Без гитары · ${ear.kind === "speed" ? "на время" : "практика"}</span><button id="earPause" class="session-pause" aria-label="Пауза" ${ear.phase === "answered" ? "disabled" : ""}>Ⅱ</button></div>` + earHud() +
    `<div class="ear-question"><h2>${chord ? "Какой рисунок звучит?" : "Где прозвучала нота?"}</h2><button class="button primary ear-repeat" id="earReplay" ${ear.playing || (ear.kind === "speed" && ear.answered) ? "disabled" : ""}>${ear.playing ? "Звучит образец…" : ear.kind === "speed" && ear.answered ? "Следующий звук…" : "Нажмите чтобы услышать"}</button>${chord ? '<p class="ear-board-legend">6-я струна слева, 1-я справа.<br>○ — открытая, × — не играть. Названия пока скрыты.</p>' + earChordOptions() : `<div class="ear-toolbar"><div class="ear-orientation" role="group" aria-label="Ориентация грифа"><button id="earVertical" aria-label="Гриф вертикально: 6-я струна слева, 1-я справа" aria-pressed="${ear.orientation === "vertical"}">Вдоль ↓</button><button id="earHorizontal" aria-label="Гриф горизонтально: 1-я струна сверху, 6-я снизу" aria-pressed="${ear.orientation === "horizontal"}">Поперёк →</button></div><span class="ear-range-label">Лады 0–${ear.range}</span></div><p class="ear-board-legend">${ear.orientation === "vertical" ? "6-я струна слева → 1-я справа." : "1-я струна сверху → 6-я снизу."} 0 — открытая.</p><div class="ear-board-viewport" id="earBoardViewport">${earBoard()}</div>${ear.range > 5 ? `<p class="ear-scroll-hint">Прокрути гриф, чтобы увидеть все ${ear.range} ладов.</p>` : ""}`}<div class="ear-status ${ear.answered && ear.kind === "practice" ? (ear.correct ? "good" : "error") : ""}" id="earStatus" role="status" aria-live="polite">${ear.answered && ear.kind === "practice" ? earAnswerFeedback() : chord ? "Выбери один из трёх рисунков." : "Отметь струну и лад — в той же октаве, что в образце."}</div>${ear.answered && ear.kind === "practice" ? `<button class="button primary ear-next" id="earNext">${ear.index === 9 ? "Посмотреть результат" : "Следующее задание →"}</button>` : ""}</div>`;
  $("earReplay").onclick = playEarTarget;
  $("earExit").onclick = () => finishEar(true);
  $("earPause").onclick = () => pauseEar();
  if (!chord) {
    $("earVertical").onclick = () => changeEarOrientation("vertical");
    $("earHorizontal").onclick = () => changeEarOrientation("horizontal");
    document
      .querySelectorAll("[data-string]")
      .forEach(
        (b) =>
          (b.onclick = () =>
            answerEarPosition(
              Number(b.dataset.string),
              Number(b.dataset.fret),
            )),
      );
  } else
    document
      .querySelectorAll("[data-ear-chord]")
      .forEach(
        (b) => (b.onclick = () => answerEarChord(Number(b.dataset.earChord))),
      );
  if ($("earNext"))
    $("earNext").onclick = () => {
      if (ear.index === 9) finishEar();
      else {
        ear.index++;
        pickEarTarget();
        ear.phase = "question";
        renderEarQuestion();
        playEarTarget();
      }
    };
  if ($("earBoardViewport")) {
    $("earBoardViewport").scrollTop = scroll.top;
    $("earBoardViewport").scrollLeft = scroll.left;
  }
  updateEarHud();
}
function changeEarOrientation(value) {
  ear.orientation = phoneFret() ? "vertical" : value;
  store.set("aleatorika-fret-orientation", value);
  const status = $("earStatus")?.innerHTML,
    statusClass = $("earStatus")?.className;
  renderEarQuestion();
  if (ear.kind === "speed" && status) {
    $("earStatus").innerHTML = status;
    $("earStatus").className = statusClass;
  }
}
async function playEarTarget() {
  if (
    !["question", "answered"].includes(ear.phase) ||
    (ear.kind === "speed" && ear.answered)
  )
    return;
  if (ear.kind === "speed" && performance.now() >= ear.deadline) {
    finishEar();
    return;
  }
  stopAudio();
  clearTimeout(ear.audioTimer);
  const token = ear.token,
    target = ear.target;
  ear.playing = true;
  if ($("earReplay")) {
    $("earReplay").disabled = true;
    $("earReplay").textContent = "Звучит образец…";
  }
  try {
    const ctx = await getAudio();
    if (token !== ear.token || target !== ear.target) return;
    const start = ctx.currentTime + 0.02;
    let duration;
    if (state.mode === "notes") {
      duration = ear.kind === "speed" ? 1000 : 1700;
      pluck(ctx, target.midi, start, 0.42, ear.kind === "speed" ? 0.9 : 1.65);
    } else {
      duration = ear.kind === "speed" ? 1350 : 2150;
      const mids = target.frets
        .map((f, i) => (f < 0 ? null : openMidi[i] + f))
        .filter((m) => m !== null);
      mids.forEach((m, i) =>
        pluck(
          ctx,
          m,
          start + i * 0.035,
          0.7 / mids.length,
          ear.kind === "speed" ? 1.1 : 1.9,
        ),
      );
    }
    ear.audioTimer = setTimeout(() => {
      if (token !== ear.token || target !== ear.target) return;
      ear.playing = false;
      if ($("earReplay")) {
        $("earReplay").disabled = false;
        $("earReplay").textContent = "Нажмите чтобы услышать";
      }
    }, duration);
  } catch (e) {
    ear.playing = false;
    if ($("earReplay")) {
      $("earReplay").disabled = false;
      $("earReplay").textContent = "Повторить звук";
    }
    if ($("earStatus"))
      $("earStatus").textContent =
        "Не удалось воспроизвести звук. Попробуй ещё раз.";
  }
}
function earNoteName(note) {
  return `${noteNames[note.pc]} / ${letters[note.pc]}${octaveNumber(note)}`;
}
function earAnswerFeedback() {
  const chord = state.mode === "chords",
    n = ear.target;
  return `<strong>${ear.correct ? "Верно!" : "Запомним этот звук"}</strong><p>${chord ? `${n.id} — ${fullChord(n)}. Правильный рисунок выделен зелёным.` : `Звучала ${earNoteName(n)}. ${octaveLabel(n)}. Все зелёные позиции дают тот же звук.`}</p>`;
}
function answerEarPosition(string, fret) {
  const midi = openMidi[6 - string] + fret;
  submitEar(midi === ear.target.midi, { string, fret });
}
function answerEarChord(index) {
  submitEar(ear.options[index] === ear.target, index);
}
function earFlash(correct) {
  if (correct) celebrateSuccess();
  clearTimeout(ear.flashTimer);
  document.body.classList.remove("flash-right", "flash-wrong");
  document.body.classList.add(correct ? "flash-right" : "flash-wrong");
  ear.flashTimer = setTimeout(
    () => document.body.classList.remove("flash-right", "flash-wrong"),
    650,
  );
  if (!correct)
    try {
      navigator.vibrate?.(120);
    } catch {}
}
function submitEar(correct, selection) {
  if (
    ear.phase !== "question" ||
    ear.answered ||
    performance.now() < ear.lockUntil
  )
    return;
  if (ear.kind === "speed" && performance.now() >= ear.deadline) {
    finishEar();
    return;
  }
  ear.selected = selection;
  ear.correct = correct;
  if (ear.kind === "practice") {
    stopAudio();
    clearTimeout(ear.audioTimer);
    ear.playing = false;
    ear.answered = true;
    ear.phase = "answered";
    ear.results.push(correct);
    if (correct) ear.score++;
    stats.total++;
    if (correct) stats.correct++;
    store.set("lad-stats", stats);
    refreshStats();
    renderEarQuestion();
    revealEarPosition();
    $("earStatus").className = "ear-status " + (correct ? "good" : "error");
    earFlash(correct);
    announce(correct ? "Правильно" : "Правильный ответ показан на экране");
  } else {
    if (correct) {
      stopAudio();
      clearTimeout(ear.audioTimer);
      ear.playing = false;
      ear.answered = true;
      ear.score++;
      ear.streak++;
      ear.best = Math.max(ear.best, ear.streak);
      const bonus = ear.streak % 3 === 0;
      if (bonus) {
        ear.deadline += 5000;
        ear.bonus += 5;
      }
      renderEarQuestion();
      $("earReplay").disabled = true;
      $("earReplay").textContent = "Следующий звук…";
      $("earStatus").className = "ear-status good";
      $("earStatus").textContent = bonus
        ? "Комбо из 3! +5 секунд"
        : "Верно! Следующий звук.";
      earFlash(true);
      ear.nextTimer = setTimeout(() => {
        if (ear.phase !== "question" || race.experience !== "ear") return;
        pickEarTarget();
        renderEarQuestion();
        playEarTarget();
      }, 300);
    } else if (state.mode === "chords") {
      stopAudio();
      clearTimeout(ear.audioTimer);
      ear.playing = false;
      ear.answered = true;
      ear.streak = 0;
      renderEarQuestion();
      $("earStatus").className = "ear-status error";
      $("earStatus").textContent =
        "Неверно. Ответ: " +
        fullChord(ear.target) +
        " / " +
        ear.target.id +
        ". Следующий аккорд…";
      earFlash(false);
      const token = ear.token;
      ear.nextTimer = setTimeout(() => {
        if (
          token !== ear.token ||
          ear.phase !== "question" ||
          race.experience !== "ear"
        )
          return;
        if (performance.now() >= ear.deadline) {
          finishEar();
          return;
        }
        pickEarTarget();
        renderEarQuestion();
        playEarTarget();
      }, 850);
    } else {
      ear.streak = 0;
      ear.lockUntil = performance.now() + 450;
      renderEarQuestion();
      $("earStatus").className = "ear-status error";
      $("earStatus").textContent =
        "Не совпало. Попробуй ещё раз — звук тот же.";
      earFlash(false);
    }
  }
  updateEarHud();
}
function updateEarHud() {
  if (ear.kind !== "speed" || !$("earTime")) return;
  ear.remaining = Math.max(0, ear.deadline - performance.now());
  const secs = Math.ceil(ear.remaining / 1000);
  $("earTime").textContent = secs;
  $("earTime").classList.toggle("urgent", secs <= 10);
  $("earScore").textContent = ear.score;
  $("earCombo").textContent = `${ear.streak % 3 || (ear.streak ? 3 : 0)} / 3`;
  $("earBonus").textContent = ear.bonus
    ? `+${ear.bonus.toLocaleString("ru-RU")} сек`
    : "";
}
function tickEar() {
  if (ear.phase !== "question") return;
  updateEarHud();
  if (ear.remaining <= 0) finishEar();
}
function pauseEar() {
  if (!["question", "countdown"].includes(ear.phase)) return;
  const speed = ear.kind === "speed";
  if (speed && ear.phase === "question") {
    ear.remaining = Math.max(0, ear.deadline - performance.now());
    if (!ear.remaining) {
      finishEar();
      return;
    }
  }
  const alreadyAnswered = ear.answered;
  if (alreadyAnswered && speed) pickEarTarget();
  disposeEar();
  ear.phase = "paused";
  $("training").innerHTML =
    `<div class="ear-content"><p class="phase-label">БЕЗ ГИТАРЫ · ПАУЗА</p><h2>Продолжим, когда будешь готов</h2><p class="ear-description">${speed ? `Осталось ${Math.ceil(ear.remaining / 1000)} сек. Счёт и комбо сохранены.` : "Задание и выбранная октава сохранены."}</p><button class="button primary" id="earResume">Продолжить</button><button class="replay" id="earQuit">Завершить</button></div>`;
  $("earResume").onclick = () => startEar(true);
  $("earQuit").onclick = () => finishEar(true);
}
function finishEar(early = false) {
  disposeEar();
  ear.phase = "result";
  earTop();
  const speed = ear.kind === "speed";
  let record = 0,
    newRecord = false;
  if (speed) {
    const key = timedModeRecordKey("ear"),
      prev = store.get(key, 0);
    record = Math.max(prev, ear.score);
    newRecord = ear.score > prev;
    store.set(key, record);
  }
  $("training").innerHTML =
    `<div class="ear-content"><p class="phase-label">БЕЗ ГИТАРЫ · ${speed && !early ? "ВРЕМЯ ВЫШЛО" : "ТРЕНИРОВКА ЗАВЕРШЕНА"}</p><h2>Итоги тренировки</h2>${speed ? `<div class="race-result-stats"><div><strong>${ear.score}</strong><span>попаданий</span></div><div><strong>${ear.best}</strong><span>лучшее комбо</span></div><div><strong>+${ear.bonus.toLocaleString("ru-RU")} сек</strong><span>заработано времени</span></div><div><strong>${record}</strong><span>личный рекорд</span></div></div><p class="race-record">${newRecord ? "Новый личный рекорд!" : "Рекорд сохранён на устройстве."}</p>` : `<div class="ear-result-total">${ear.score}<span>${ear.results.length ? " / " + ear.results.length : " ответов"}</span></div><p class="ear-description">${ear.results.length ? "правильных ответов · " + (state.mode === "notes" ? "гриф" : "аппликатуры") : "Ответов пока нет. Можно начать, когда будет удобно."}</p>`}<button class="button primary" id="earAgain">${speed ? "Играть ещё" : "Ещё одна тренировка"}</button><button class="replay" id="earBack">К настройкам режима</button></div>`;
  $("earAgain").onclick = () => startEar(false);
  $("earBack").onclick = () => showEarMenu();
  announce("Тренировка завершена. Правильных ответов: " + ear.score);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden && race.experience === "ear") pauseEar();
});
window.addEventListener("pagehide", disposeEar);

function revealEarPosition() {
  if (state.mode !== "notes" || ear.kind !== "practice") return;
  const viewport = $("earBoardViewport"),
    hit = viewport?.querySelector(".fret-cell.hit");
  if (!hit) return;
  const vr = viewport.getBoundingClientRect(),
    hr = hit.getBoundingClientRect();
  if (hr.top < vr.top || hr.bottom > vr.bottom)
    viewport.scrollTop += hr.top - vr.top - viewport.clientHeight / 2 + 22;
  if (hr.left < vr.left || hr.right > vr.right)
    viewport.scrollLeft += hr.left - vr.left - viewport.clientWidth / 2 + 22;
}

let fretWasPhone = phoneFret();
addEventListener("resize", () => {
  const now = phoneFret();
  if (now === fretWasPhone) return;
  fretWasPhone = now;
  if (race.experience !== "ear") return;
  if (["question", "answered"].includes(ear.phase)) renderEarQuestion();
  else if (ear.phase === "menu") showEarMenu();
});
