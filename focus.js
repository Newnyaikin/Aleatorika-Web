"use strict";
// Focused fretboard uses the page viewport, including Safari where native
// Fullscreen API is unavailable; no microphone or browser permission required.
let fretFocusActive = false,
  fretFocusTarget = null,
  fretFocusDismissed = false,
  fretFocusScroll = 0;
const originalEarQuestion = renderEarQuestion,
  originalDisposeEar = disposeEar;
const inertBefore = new Map();
function lockFretBackground(lock) {
  const nodes = [
    document.querySelector(".shell>header"),
    document.querySelector("aside"),
    ...$("practice").children,
  ].filter((n) => n && n !== $("training") && n !== experience);
  if (lock) {
    for (const n of nodes) {
      if (!inertBefore.has(n)) inertBefore.set(n, n.inert);
      n.inert = true;
    }
  } else {
    for (const [n, value] of inertBefore) n.inert = value;
    inertBefore.clear();
  }
}
function fitFocusedFret() {
  if (!fretFocusActive) return;
  const board = $("earBoardViewport")?.querySelector(".ear-board"),
    view = $("earBoardViewport");
  if (!board || !view) return;
  const heights = Array.from({ length: ear.range }, (_, i) =>
    compactFretSpace(ear.range, i),
  );
  if (ear.orientation === "vertical") {
    const scale =
      ear.range <= 5
        ? Math.max(
            1,
            (view.clientHeight - 76) / heights.reduce((a, b) => a + b, 0),
          )
        : 1;
    board.style.gridTemplateRows =
      "28px 44px " +
      heights.map((h) => (h * scale).toFixed(2) + "px").join(" ");
  } else {
    const scale =
      ear.range <= 5
        ? Math.max(
            1,
            (view.clientWidth - 76) / heights.reduce((a, b) => a + b, 0),
          )
        : 1;
    board.style.gridTemplateColumns =
      "28px 44px " +
      heights.map((h) => (h * scale).toFixed(2) + "px").join(" ");
    board.style.gridTemplateRows =
      "28px repeat(6," +
      Math.max(44, Math.min(84, (view.clientHeight - 28) / 6)).toFixed(2) +
      "px)";
  }
}
function enterFretFocus() {
  if (state.mode !== "notes" || !$("earBoardViewport")) return;
  const entering = !fretFocusActive;
  if (entering) fretFocusScroll = window.scrollY;
  fretFocusActive = true;
  fretFocusDismissed = false;
  document.body.classList.add("fret-focused");
  $("training").setAttribute("role", $("paceControl") ? "region" : "dialog");
  if ($("paceControl")) $("training").removeAttribute("aria-modal");
  else $("training").setAttribute("aria-modal", "true");
  $("training").setAttribute("aria-label", "Гриф на весь экран");
  lockFretBackground(true);
  requestAnimationFrame(() => {
    fitFocusedFret();
    if (entering) $("fretFocusBack")?.focus({ preventScroll: true });
  });
}
function exitFretFocus(dismiss = true) {
  if (dismiss) fretFocusDismissed = true;
  const active = fretFocusActive;
  fretFocusActive = false;
  document.body.classList.remove("fret-focused");
  lockFretBackground(false);
  $("training").setAttribute("role", "tabpanel");
  $("training").removeAttribute("aria-modal");
  $("training").removeAttribute("aria-label");
  const board = $("earBoardViewport")?.querySelector(".ear-board");
  if (board && ear.orientation === "vertical") {
    board.style.gridTemplateRows =
      "28px 44px " +
      Array.from(
        { length: ear.range },
        (_, i) => compactFretSpace(ear.range, i).toFixed(2) + "px",
      ).join(" ");
  }
  if (board && ear.orientation === "horizontal") {
    board.style.gridTemplateRows = "";
    board.style.gridTemplateColumns =
      "28px 44px " +
      Array.from(
        { length: ear.range },
        (_, i) => compactFretSpace(ear.range, i).toFixed(2) + "px",
      ).join(" ");
  }
  if (active) {
    window.scrollTo(0, fretFocusScroll);
    if (dismiss) $("fretFocusOpen")?.focus({ preventScroll: true });
  }
}
renderEarQuestion = function () {
  originalEarQuestion();
  if (state.mode !== "notes") {
    exitFretFocus(false);
    return;
  }
  const fresh = fretFocusTarget !== ear.target;
  if (fresh) {
    fretFocusTarget = ear.target;
    fretFocusDismissed = false;
  }
  const bar = document.createElement("div");
  bar.className = "fret-focus-bar";
  bar.innerHTML =
    '<button class="fret-focus-back" id="fretFocusBack" aria-label="Назад к экрану задания"><span aria-hidden="true">←</span> Назад</button><span class="fret-focus-meta" id="fretFocusMeta"></span>';
  $("training").querySelector(".ear-question").prepend(bar);
  $("fretFocusBack").onclick = () => exitFretFocus(true);
  const open = document.createElement("button");
  open.id = "fretFocusOpen";
  open.className = "fret-focus-launch";
  open.textContent = "Гриф на весь экран";
  open.onclick = enterFretFocus;
  $("training").querySelector(".ear-toolbar").after(open);
  if (ear.kind === "practice" && ear.answered) {
    $("earReplay").classList.add("focus-replay-answered");
    $("earNext").classList.add("focus-next-answer");
  }
  if (!fretFocusDismissed) enterFretFocus();
  updateFretFocusMeta();
};
function updateFretFocusMeta() {
  const meta = $("fretFocusMeta");
  if (!meta) return;
  meta.textContent =
    ear.kind === "speed"
      ? Math.ceil(Math.max(0, ear.remaining) / 1000) +
        " сек · " +
        ear.score +
        " попаданий"
      : ear.index + 1 + " / 10";
}
const priorHud = updateEarHud;
updateEarHud = function () {
  priorHud();
  updateFretFocusMeta();
};
disposeEar = function () {
  exitFretFocus(false);
  fretFocusTarget = null;
  fretFocusDismissed = false;
  originalDisposeEar();
};
document.addEventListener("keydown", (e) => {
  if (!fretFocusActive) return;
  if (e.key === "Escape") {
    e.preventDefault();
    exitFretFocus(true);
    return;
  }
  if (e.key === "Tab" && !$("paceControl")) {
    const items = [
      ...$("training").querySelectorAll("button:not(:disabled)"),
    ].filter((n) => n.getClientRects().length);
    const first = items[0],
      last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
});
addEventListener("resize", () => requestAnimationFrame(fitFocusedFret));
window.visualViewport?.addEventListener("resize", () =>
  requestAnimationFrame(fitFocusedFret),
);

// Three attempts per pitch-placement task; chord diagrams retain their own rules.
ear.attemptsLeft = 3;
ear.attemptsUsed = 0;
ear.wrongPositions = [];
let attemptsTarget = null;
const attemptsPick = pickEarTarget,
  attemptsRender = renderEarQuestion,
  attemptsSubmit = submitEar;
function resetNoteAttempts() {
  ear.attemptsLeft = 3;
  ear.attemptsUsed = 0;
  ear.wrongPositions = [];
  attemptsTarget = ear.target;
}
pickEarTarget = function () {
  attemptsPick();
  resetNoteAttempts();
};
function attemptMessage() {
  return ear.answered
    ? ear.correct
      ? "Угадано · попытка " + ear.attemptsUsed + " / 3"
      : "Попытки закончились"
    : "Попытки: " + ear.attemptsLeft + " / 3";
}
const attemptsMeta = updateFretFocusMeta;
updateFretFocusMeta = function () {
  attemptsMeta();
  if (state.mode !== "notes") return;
  const meta = $("fretFocusMeta");
  if (meta) {
    const span = document.createElement("span");
    span.className = "fret-attempt-meta";
    span.textContent = attemptMessage();
    meta.append(span);
  }
};
renderEarQuestion = function () {
  if (state.mode === "notes" && attemptsTarget !== ear.target)
    resetNoteAttempts();
  attemptsRender();
  if (state.mode !== "notes") return;
  const count = document.createElement("p");
  count.className = "ear-attempt-count";
  count.textContent = attemptMessage();
  $("training").querySelector(".ear-question>h2").after(count);
  for (const position of ear.wrongPositions) {
    const button = document.querySelector(
      `[data-string="${position.string}"][data-fret="${position.fret}"]`,
    );
    if (button) {
      button.classList.add("miss");
      button.disabled = true;
      button.innerHTML = '<span class="fret-mark" aria-hidden="true">×</span>';
      button.setAttribute(
        "aria-label",
        position.string +
          "-я струна, " +
          position.fret +
          "-й лад, уже проверено: не совпало",
      );
    }
  }
  if (ear.kind === "speed" && ear.answered && ear.attemptsLeft === 0) {
    document.querySelectorAll("[data-string]").forEach((button) => {
      if (
        openMidi[6 - Number(button.dataset.string)] +
          Number(button.dataset.fret) ===
        ear.target.midi
      ) {
        button.classList.remove("miss");
        button.classList.add("hit");
        button.innerHTML =
          '<span class="fret-mark" aria-hidden="true">✓</span>';
        button.setAttribute(
          "aria-label",
          "Правильная позиция: " +
            button.dataset.string +
            "-я струна, " +
            button.dataset.fret +
            "-й лад",
        );
      }
    });
  }
  updateFretFocusMeta();
};
submitEar = function (correct, selection) {
  if (state.mode !== "notes") return attemptsSubmit(correct, selection);
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
  if (attemptsTarget !== ear.target) resetNoteAttempts();
  if (
    ear.wrongPositions.some(
      (p) => p.string === selection.string && p.fret === selection.fret,
    )
  )
    return;
  ear.attemptsUsed++;
  ear.attemptsLeft = Math.max(0, 3 - ear.attemptsUsed);
  if (correct) {
    attemptsSubmit(true, selection);
    return;
  }
  ear.wrongPositions.push(selection);
  if (ear.kind === "practice" && ear.attemptsLeft > 0) {
    stopAudio();
    clearTimeout(ear.audioTimer);
    ear.playing = false;
    ear.selected = selection;
    ear.correct = false;
    ear.lockUntil = performance.now() + 450;
    renderEarQuestion();
    $("earStatus").className = "ear-status error";
    $("earStatus").textContent =
      "Не совпало. " +
      (ear.attemptsLeft === 1 ? "Осталась 1 попытка." : "Осталось 2 попытки.") +
      " Можно послушать ещё раз.";
    earFlash(false);
    announce($("earStatus").textContent);
    return;
  }
  attemptsSubmit(false, selection);
  if (ear.kind === "speed") {
    if (ear.attemptsLeft > 0) {
      $("earStatus").textContent =
        "Не совпало. " +
        (ear.attemptsLeft === 1
          ? "Осталась 1 попытка."
          : "Осталось 2 попытки.");
      return;
    }
    ear.answered = true;
    renderEarQuestion();
    $("earReplay").disabled = true;
    $("earReplay").textContent = "Следующая нота…";
    $("earStatus").className = "ear-status error";
    $("earStatus").textContent =
      "Попытки закончились. Ответ: " + earNoteName(ear.target) + ".";
    ear.nextTimer = setTimeout(() => {
      if (ear.phase !== "question" || race.experience !== "ear") return;
      pickEarTarget();
      renderEarQuestion();
      playEarTarget();
    }, 1100);
  }
};

// Web Audio must start inside a user gesture. Thereafter every new learning
// question auto-plays once; normal rerenders never choose/replay another sound.
let learningAutoEnabled = false,
  learningQuestionId = 0,
  learningAutoPlayed = -1;
const autoRender = render,
  autoNewQuestion = newQuestion,
  autoSelectExperience = selectExperience,
  autoSetMode = setMode;
newQuestion = function () {
  learningQuestionId++;
  autoNewQuestion();
};
function showLearningStart() {
  document.body.classList.remove("in-exercise");
  $("training").innerHTML =
    '<div class="ear-content"><p class="phase-label">ОБУЧЕНИЕ</p><h2>' +
    (state.mode === "notes" ? "Ноты на гитаре" : "Аккорды на гитаре") +
    '</h2><p class="ear-description">Слушай образец, повторяй на гитаре и выбирай название. В начале каждого задания звук включается автоматически.</p><button class="button primary" id="startLearning">Начать обучение</button></div>';
  $("startLearning").onclick = () => {
    learningAutoEnabled = true;
    if (state.stage !== 2 || learningAutoPlayed === learningQuestionId)
      newQuestion();
    else render();
  };
}
render = function (focus = false) {
  if (race.experience !== "learn") return autoRender(focus);
  if (!learningAutoEnabled) {
    showLearningStart();
    return;
  }
  if (!$("stage")) $("training").innerHTML = trainingShell;
  autoRender(focus);
  if (
    state.stage === 2 &&
    learningAutoPlayed !== learningQuestionId &&
    !document.hidden
  ) {
    learningAutoPlayed = learningQuestionId;
    playTarget();
  }
};
selectExperience = function (value) {
  if (value === "learn") learningAutoEnabled = true;
  return autoSelectExperience(value);
};
setMode = function (mode, force = false) {
  if (race.experience === "learn") learningAutoEnabled = true;
  return autoSetMode(mode, force);
};
if (race.experience === "learn") showLearningStart();

// Practice feedback remains visible for a second, then advances without a tap.
const continuousEarSubmit = submitEar;
submitEar = function (correct, selection) {
  const wasAnswered = ear.answered;
  continuousEarSubmit(correct, selection);
  if (!wasAnswered && ear.answered && ear.kind === "practice") {
    const target = ear.target,
      token = ear.token;
    $("earNext")?.setAttribute("disabled", "");
    if ($("earNext")) $("earNext").textContent = "Следующее задание…";
    clearTimeout(ear.nextTimer);
    const advance = () => {
      if (
        token !== ear.token ||
        ear.target !== target ||
        race.experience !== "ear" ||
        ear.phase !== "answered"
      )
        return;
      if (document.hidden || $("settings").open) {
        ear.nextTimer = setTimeout(advance, 250);
        return;
      }
      if (ear.index === 9) finishEar();
      else {
        ear.index++;
        pickEarTarget();
        ear.phase = "question";
        renderEarQuestion();
        playEarTarget();
      }
    };
    ear.nextTimer = setTimeout(advance, 1000);
  }
};
