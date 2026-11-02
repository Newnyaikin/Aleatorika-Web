
'use strict';
let accidentals=store.get('aleatorika-accidentals','sharp');
const sharpNoteNames=[...noteNames],sharpLetters=[...letters];
const flatNoteNames=['До','Ре♭','Ре','Ми♭','Ми','Фа','Соль♭','Соль','Ля♭','Ля','Си♭','Си'];
const flatLetters=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
function setAccidentals(value){accidentals=value==='flat'?'flat':'sharp';store.set('aleatorika-accidentals',accidentals);noteNames.splice(0,12,...(accidentals==='flat'?flatNoteNames:sharpNoteNames));letters.splice(0,12,...(accidentals==='flat'?flatLetters:sharpLetters));}
setAccidentals(accidentals);
const accidentalsLabel=document.createElement('label');accidentalsLabel.htmlFor='accidentalsChoice';accidentalsLabel.textContent='Знаки альтерации';accidentalsLabel.style.marginTop='24px';
const accidentalsSelect=document.createElement('select');accidentalsSelect.id='accidentalsChoice';accidentalsSelect.innerHTML='<option value="sharp">♯ — диезы</option><option value="flat">♭ — бемоли</option>';accidentalsSelect.value=accidentals;accidentalsSelect.onchange=()=>setAccidentals(accidentalsSelect.value);
const accidentalsHelp=document.createElement('p');accidentalsHelp.className='settings-note';accidentalsHelp.textContent='В заданиях все 12 нот. До♯ / C♯ и Ре♭ / D♭ — один и тот же звук. Меняется только написание, не высота.';
$('notation').after(accidentalsLabel,accidentalsSelect,accidentalsHelp);
