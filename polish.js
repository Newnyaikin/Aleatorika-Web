'use strict';
// Observe structural renders, not score/timer text or microphone status updates.
let panelMotion=null,motionFrame=0;
const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)');
function animatePanel(){if(reducedMotion.matches)return;cancelAnimationFrame(motionFrame);motionFrame=requestAnimationFrame(()=>{const node=$('stage')||$('training');panelMotion?.cancel();panelMotion=node.animate([{opacity:.6},{opacity:1}],{duration:260,easing:'cubic-bezier(.22,1,.36,1)'});});}
new MutationObserver(records=>{if(records.some(r=>r.type==='childList'&&['training','stage','result'].includes(r.target.id)))animatePanel()}).observe($('training'),{childList:true,subtree:true});
// Compact labels: keep instructional copy, remove promotional headings.
function positionTabIndicator(){const active=experience.querySelector('[aria-pressed="true"]');if(!active)return;experience.style.setProperty('--nav-left',active.offsetLeft+'px');experience.style.setProperty('--nav-width',active.offsetWidth+'px')}
new MutationObserver(positionTabIndicator).observe(experience,{attributes:true,subtree:true,attributeFilter:['aria-pressed']});
new ResizeObserver(positionTabIndicator).observe(experience);positionTabIndicator();
