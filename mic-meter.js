'use strict';
// A real input meter: it reads only the current microphone AnalyserNode.
(()=>{
 const style=document.createElement('style');style.textContent='.mic-meter{width:100%;display:grid;justify-items:center;gap:8px;padding:8px 0}.mic-meter-bars{height:54px;display:flex;align-items:center;gap:5px}.mic-meter-bars i{display:block;width:5px;height:4px;border-radius:3px;background:var(--accent);transition:height 65ms linear}.mic-meter small{font-size:14px;color:var(--muted);text-align:center}.mic-meter.clipping i{background:var(--red)}.mic-meter.clipping small{color:var(--red)}#raceSignal:has(.mic-meter){height:106px}.micro-box>.mic-meter~svg{display:none}';document.head.append(style);
 let previous=0,lastHost=null,lastMeter=null;let levels=new Float32Array(17),samples=null;
 function meter(host){if(host===lastHost&&lastMeter?.isConnected)return lastMeter;lastHost=host;let el=host.querySelector('.mic-meter');if(!el){el=document.createElement('div');el.className='mic-meter';el.setAttribute('role','img');el.innerHTML='<div class="mic-meter-bars" aria-hidden="true">'+Array(17).fill('<i></i>').join('')+'</div><small>Микрофон выключен</small>';if(host.id==='raceSignal'){host.replaceChildren(el)}else{host.querySelector(':scope > svg')?.remove();host.prepend(el)}}lastMeter=el;return el}
 function tick(t){requestAnimationFrame(tick);if(t-previous<40)return;previous=t;
 const raceHost=document.getElementById('raceSignal');const host=raceHost||document.getElementById('microBox');if(!host||host.classList.contains('matched'))return;
 let ana=raceHost?(typeof race!=='undefined'?race.analyser:null):(typeof analyser!=='undefined'?analyser:null);
 const guarded=typeof sampleInputGuard!=='undefined'&&!sampleInputGuard.armed;if(guarded)ana=null;
 const el=meter(host);let rms=0,peak=0;
 if(ana){if(!samples||samples.length!==ana.fftSize)samples=new Float32Array(ana.fftSize);ana.getFloatTimeDomainData(samples);const bins=new Float32Array(17);for(let i=0;i<samples.length;i++){let a=Math.abs(samples[i]);rms+=a*a;peak=Math.max(peak,a);let j=Math.min(16,Math.floor(i*17/samples.length));bins[j]=Math.max(bins[j],a)}rms=Math.sqrt(rms/samples.length);for(let i=0;i<17;i++)levels[i]=Math.max(bins[i],levels[i]*.63)}else levels.fill(0);
 const bars=el.querySelectorAll('i');for(let i=0;i<17;i++){const scale=ana?Math.max(0,Math.min(1,(20*Math.log10(Math.max(1e-5,levels[i]))+60)/54)):0;bars[i].style.height=(4+48*scale)+'px'}
 const label=guarded?'Проверка приостановлена':!ana?'Микрофон выключен':peak>=.98?'Слишком громко — отодвинь телефон':rms<.004?'Микрофон включён · тихо':'Микрофон слышит звук';el.classList.toggle('clipping',peak>=.98);if(el.getAttribute('aria-label')!==label){el.setAttribute('aria-label',label);el.querySelector('small').textContent=label}
 }requestAnimationFrame(tick);
})();
