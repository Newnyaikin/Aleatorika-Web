"use strict";
const quickHelp = document.createElement("dialog");
quickHelp.id = "quickHelp";
quickHelp.className = "quick-help";
quickHelp.setAttribute("aria-labelledby", "quickHelpTitle");
quickHelp.innerHTML =
  '<div class="help-top"><h2 id="quickHelpTitle">Как играть</h2><button class="icon-btn" id="closeQuickHelp" aria-label="Закрыть справку"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div id="quickHelpBody"></div><button class="button primary" id="gotQuickHelp">Понятно</button>';
document.body.append(quickHelp);
function openQuickHelp() {
  const mode = race.experience;
  if (mode === "sight") pauseSight();
  else if (mode === "speed") pauseRace();
  else if (mode === "ear" && ["question", "countdown"].includes(ear.phase))
    pauseEar();
  else stopAudio();
  const text =
    mode === "ear"
      ? "Послушай звук и выбери рисунок. В аккордах доступны открытые позиции, баррэ и все формы. На скорость — одна попытка на аккорд; ошибка сбрасывает комбо и открывает следующий звук. Для нот — три попытки."
      : mode === "sight"
        ? "Посмотри на название и схему, затем сыграй. Для нот важна указанная октава. Для аккордов проверяется звучание, а не положение пальцев. «С баррэ» включает F, Fm, B, Bm, B♭ и B♭m."
        : "Послушай короткий образец. Когда появится «Играй», повтори на гитаре. В обучении затем выбери название. «Без проверки» позволяет продолжить вручную.";
  $("quickHelpBody").replaceChildren(
    ...[
      text,
      "Образец не засчитывается: сначала короткий звук, затем защитная секунда и тихий промежуток. Если ещё слышны динамики, проверка ждёт тишины. После «Играй» нужен новый звук гитары. Наушники уменьшают эхо.",
      "На скорость: 30 секунд, +5 секунд за каждые три попадания подряд. В меню можно выбрать обучение без таймера.",
      "На схеме: × — не играть, ○ — открытая струна, полоска — баррэ. Число слева — первый показанный лад. Струны: от 6-й слева к 1-й справа.",
      "Стандартный строй E–A–D–G–B–E. Звук обрабатывается только на устройстве. Кнопка микрофона отключает его; настройки содержат тему и обозначения нот.",
    ].map((t) => {
      const p = document.createElement("p");
      p.textContent = t;
      return p;
    }),
  );
  quickHelp.showModal();
}
$("closeQuickHelp").onclick = $("gotQuickHelp").onclick = () =>
  quickHelp.close();
quickHelp.addEventListener("click", (e) => {
  if (e.target === quickHelp) quickHelp.close();
});
let minimalQueued = false;
function simplifyScreen() {
  const host = $("training");
  if (!host) return;
  document.body.classList.toggle("learning-session",!!host.querySelector("#unifiedLearning"));
  const title = host.querySelector("h2");
  if(title&&!title.closest('.minimal-title-row')){const row=document.createElement('div');row.className='minimal-title-row';title.before(row);row.append(title);}
  refreshMenuRecord();
  const replacements = {
    "Ноты на гитаре": "Ноты",
    "Аккорды на гитаре": "Аккорды",
    "Услышь и повтори ноту": "Слушай и играй",
    "Услышь и повтори аккорд": "Слушай и играй",
    "Играй по схеме": "По схеме",
    "По схеме на скорость": "По схеме",
    "Узнай аккорд по звучанию": "Узнай аккорд",
    "Услышь ноту. Найди на грифе.": "Найди ноту",
    "Теперь выбери название ноты": "Выбери ноту",
    "Теперь выбери название аккорда": "Выбери аккорд",
    "Послушать ещё раз": "Образец",
    "Послушать образец": "Образец",
    "Нажмите, чтобы услышать": "Образец",
    "Нажмите чтобы услышать": "Образец",
    "Я сыграл — без проверки": "Без проверки",
    "Начать обучение": "Начать",
    "Начать тренировку": "Начать",
    "Начать · 10 заданий": "Начать",
    "Звучит образец…": "Образец…",
    "К настройкам режима": "В меню",
    "Игра подтверждена. Теперь выбери название.": "Выбери ответ",
    "✓ Сыграно верно. Теперь выбери название.": "Верно",
    "Слушай образец — затем сыграй здесь.": "Образец…",
    "Слушаю твою гитару…": "Играй",
    "Слушаю твою гитару": "Играй",
    "Слушай образец": "Слушай и играй",
    "Теперь сыграй на гитаре": "Слушай и играй",
    "Образец звучит. Через секунду можно играть.": "Образец…",
    "Образец прозвучал. Выбери название ниже.": "Выбери ответ",
    "Слушай образец ещё раз.": "Образец…",
  };
  for (const node of host.querySelectorAll(
    "h2,h3,button,.micro-title,.sight-status",
  )) {
    const text = node.textContent.trim(),
      next = replacements[text];
    if (next && text !== next) {
      if (node.matches("button")) {
        for (const child of [...node.childNodes])
          if (child.nodeType === Node.TEXT_NODE) child.textContent = next;
      } else node.textContent = next;
    }
  }
  const status = $("microTitle");
  if (
    status &&
    state.stage === 2 &&
    !sampleInputGuard.armed &&
    status.textContent !== (performance.now()<sampleInputGuard.until?"Образец…":"Жду тишины…")
  )
    status.textContent = performance.now()<sampleInputGuard.until?"Образец…":"Жду тишины…";
}
new MutationObserver(() => {
  if (!minimalQueued) {
    minimalQueued = true;
    queueMicrotask(() => {
      minimalQueued = false;
      simplifyScreen();
    });
  }
}).observe($("training"), {
  childList: true,
  subtree: true,
  characterData: true,
});

function timedModeRecordKey(activity=race.experience){
 if(activity==='ear')return `aleatorika-ear-v1-record-${state.mode}-${state.mode==='notes'?ear.range:ear.chordSet||'open'}`;
 if(activity==='sight')return `aleatorika-sight-speed-v1-${state.mode}`+(state.mode==='chords'&&sight.chordSet === 'barre' ? '-barre' : sight.chordSet === 'open' ? '-open' : '');
 return 'aleatorika-speed-v1-record-'+state.mode;
}
const recordTrophy='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h10v5a5 5 0 0 1-10 0ZM7 5H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4M12 13v7m-4 1h8"/></svg>';
function refreshMenuRecord(){
 const activity=race.experience,speed=activity==='speed'||activity==='sight'&&sight.kind==='speed'||activity==='ear'&&ear.kind==='speed',button=$('raceStart')||$('sightStart')||$('earStart');
 const old=$('menuModeRecord');if(!speed||!button){old?.remove();return;}
 const key=timedModeRecordKey(),value=Number(store.get(key,0));
 if(old&&old.dataset.key===key&&old.dataset.value===String(value))return;
 const badge=old||document.createElement('div');badge.id='menuModeRecord';badge.className='mode-record';badge.dataset.key=key;badge.dataset.value=String(value);badge.setAttribute('aria-label','Рекорд данного режима: '+value);badge.innerHTML=recordTrophy+'<span>Рекорд</span><strong>'+value+'</strong>';button.before(badge);
}
const globalHelp=document.createElement('button');globalHelp.id='helpButton';globalHelp.className='icon-btn help-trigger';globalHelp.setAttribute('aria-label','Как играть');globalHelp.title='Как играть';globalHelp.innerHTML='<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.3"/><path d="M9.5 9a2.6 2.6 0 0 1 5 .8c0 1.7-2.5 1.8-2.5 3.4"/><circle cx="12" cy="16.7" r=".65" fill="currentColor" stroke="none"/></svg>';globalHelp.onclick=openQuickHelp;$('settingsButton').before(globalHelp);
for(const [id,path] of [['sightExperience','M5 3v18M10 3v18M15 3v18M20 3v18M3 7h19M3 16h19'],['earExperience',buttonGlyphs.music]]){const slot=$(id).querySelector('.activity-icon');if(slot)slot.innerHTML=`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;}
refreshMenuRecord();

simplifyScreen();
