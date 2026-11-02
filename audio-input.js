"use strict";
// Keep capture alive; only verdicts are suppressed for the first second.
const SAMPLE_MIC_MUTE_MS = 1000;
// Pull the microphone graph through a silent output. Some engines do not process
// an unconnected analyser. Never feed live microphone sound to the loudspeaker.
const guitarMicSinks = new WeakMap();
function attachMicSink(ctx, node) {
  if (guitarMicSinks.has(node)) return;
  const sink = ctx.createGain();
  sink.gain.value = 0;
  node.connect(sink);
  sink.connect(ctx.destination);
  guitarMicSinks.set(node, sink);
}
function detachMicSink(node) {
  if (!node) return;
  const sink = guitarMicSinks.get(node);
  try {
    node.disconnect();
    sink?.disconnect();
  } catch (_) {}
  guitarMicSinks.delete(node);
}
// One browser acquisition per page session. Each mode owns a disposable clone;
// stopping a mode cannot close the session's microphone or reopen its prompt.
let guitarMicSession = null,
  guitarMicPending = null,
  guitarMicFailure = null,
  guitarMicOff = false,
  guitarMicEpoch = 0;
const guitarMicClients = new Set();
function updateGuitarMicButton() {
  const button = document.getElementById("micSessionToggle");
  if (!button) return;
  const active = !!guitarMicSession && !guitarMicOff;
  button.setAttribute("aria-pressed", String(active));
  button.setAttribute(
    "aria-label",
    active ? "Выключить микрофон" : "Подключить микрофон",
  );
  button.title = active
    ? "Микрофон подключён на время сеанса. Нажми, чтобы выключить."
    : "Подключить микрофон один раз для всех режимов";
  button.classList.toggle("mic-session-on", active);
}
async function getGuitarMicSession() {
  if (guitarMicOff) throw new Error("MIC_OFF");
  if (guitarMicSession?.getAudioTracks().some((t) => t.readyState === "live"))
    return guitarMicSession;
  if (guitarMicFailure) throw guitarMicFailure;
  if (guitarMicPending) return guitarMicPending;
  if (!window.isSecureContext) throw new Error("INSECURE");
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("UNSUPPORTED");
  const epoch = guitarMicEpoch;
  guitarMicPending = (async () => {
    try {
      let media;
      try {
        media = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
          video: false,
        });
      } catch (e) {
        if (e.name !== "OverconstrainedError") throw e;
        media = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      }
      if (epoch !== guitarMicEpoch || guitarMicOff) {
        media.getTracks().forEach((t) => t.stop());
        throw new Error("MIC_OFF");
      }
      guitarMicSession = media;
      for (const track of media.getAudioTracks()) {
        track.enabled = !document.hidden;
        track.addEventListener("ended", () => {
          if (guitarMicSession !== media) return;
          guitarMicSession = null;
          guitarMicFailure = new DOMException(
            "Microphone disconnected",
            "NotReadableError",
          );
          updateGuitarMicButton();
        });
      }
      updateGuitarMicButton();
      return media;
    } catch (e) {
      guitarMicFailure = e;
      throw e;
    } finally {
      guitarMicPending = null;
    }
  })();
  return guitarMicPending;
}
async function requestGuitarMic() {
  const master = await getGuitarMicSession();
  for (const old of guitarMicClients)
    if (old.getTracks().every((t) => t.readyState === "ended"))
      guitarMicClients.delete(old);
  const client = master.clone();
  client.getAudioTracks().forEach((t) => (t.enabled = !document.hidden));
  guitarMicClients.add(client);
  return client;
}
function releaseGuitarMicSession(explicit = false) {
  guitarMicEpoch++;
  guitarMicOff = explicit;
  for (const client of guitarMicClients)
    client.getTracks().forEach((t) => t.stop());
  guitarMicClients.clear();
  guitarMicSession?.getTracks().forEach((t) => t.stop());
  guitarMicSession = null;
  guitarMicFailure = null;
  updateGuitarMicButton();
}
const micSessionButton = document.createElement("button");
micSessionButton.id = "micSessionToggle";
micSessionButton.className = "icon-btn";
micSessionButton.innerHTML =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3m-3 0h6"/></svg>';
const headerActions = document.createElement("div");
headerActions.className = "header-actions";
const settingsControl = document.getElementById("settingsButton");
settingsControl.before(headerActions);
headerActions.append(micSessionButton, settingsControl);
updateGuitarMicButton();
micSessionButton.onclick = async () => {
  if (guitarMicSession && !guitarMicOff) {
    if (typeof sight !== "undefined" && race.experience === "sight")
      pauseSight();
    if (typeof race !== "undefined" && race.experience === "speed") pauseRace();
    stopMic();
    releaseGuitarMicSession(true);
    if (document.getElementById("microTitle"))
      document.getElementById("microTitle").textContent =
        "Микрофон выключен. Включи его кнопкой вверху.";
    return;
  }
  guitarMicOff = false;
  guitarMicFailure = null;
  micSessionButton.disabled = true;
  try {
    await getAudio();
    await getGuitarMicSession();
    if (typeof learningActive === "function" && learningActive())
      await startMic();
  } catch (e) {
    announce(guitarMicError(e));
    if (document.getElementById("micAlert")) micError(guitarMicError(e));
  } finally {
    micSessionButton.disabled = false;
    updateGuitarMicButton();
  }
};
document.addEventListener("visibilitychange", () => {
  for (const stream of [guitarMicSession, ...guitarMicClients])
    stream
      ?.getAudioTracks()
      .forEach((t) => (t.enabled = !document.hidden && !guitarMicOff));
});
window.addEventListener("pagehide", () => releaseGuitarMicSession(false));

function guitarMicError(e) {
  if (e.message === "MIC_OFF")
    return "Микрофон выключен. Подключи его кнопкой микрофона вверху.";
  if (e.message === "INSECURE" || e.message === "UNSUPPORTED")
    return "Микрофону нужен HTTPS или localhost. Открой сайт отдельной вкладкой, не внутри предпросмотра.";
  if (e.name === "NotAllowedError" || e.name === "SecurityError")
    return "Доступ к микрофону заблокирован браузером или страницей. Проверь разрешение сайта и открой его отдельной вкладкой по HTTPS.";
  if (e.name === "NotFoundError")
    return "Микрофон не найден. Подключи устройство ввода и попробуй снова.";
  if (e.name === "NotReadableError" || e.name === "AbortError")
    return "Не удалось открыть микрофон. Закрой приложения, которые могут его занимать, и попробуй снова.";
  return "Не удалось запустить микрофон. Проверь устройство ввода и повтори подключение.";
}

// A sample must end AND the room must settle before a fresh guitar attack counts.
const sampleInputGuard = { until: 0, quiet: 0, armed: true };
function beginSampleInputGuard() {
  sampleInputGuard.until = performance.now() + SAMPLE_MIC_MUTE_MS;
  sampleInputGuard.quiet = 0;
  sampleInputGuard.armed = false;
}
function microphoneReadyForInput(samples, now) {
  if (document.getElementById("quickHelp")?.open) return false;
  if (sampleInputGuard.armed) return true;
  if (now < sampleInputGuard.until) return false;
  let energy = 0;
  for (const v of samples) energy += v * v;
  const rms = Math.sqrt(energy / samples.length);
  sampleInputGuard.quiet = rms < 0.004 ? sampleInputGuard.quiet + 1 : 0;
  if(rms>=.004){const label=document.getElementById("microTitle")||document.getElementById("raceStatus")||document.getElementById("sightStatus");if(label&&label.textContent!=="Жду тишины…")label.textContent="Жду тишины…";}
  if (sampleInputGuard.quiet >= 2) {
    sampleInputGuard.armed = true;
    const label =
      document.getElementById("microTitle") ||
      document.getElementById("raceStatus") ||
      document.getElementById("sightStatus");
    if (label) label.textContent = "Играй";
  }
  return false;
}
