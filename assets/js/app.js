
document.querySelector('.menu-btn')?.addEventListener('click',()=>document.querySelector('.main-nav')?.classList.toggle('open'));
const calc=document.getElementById('quoteCalc');
if(calc){calc.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(calc);const method=f.get('method');const qty=Number(f.get('qty')||1);const comp=Number(f.get('complexity')||1);const base=method==='cnc'?62:method==='laser'?28:method==='combo'?86:34;const price=Math.max(35,base*qty*comp);document.getElementById('calcResult').textContent='ca. '+price.toLocaleString('de-DE',{style:'currency',currency:'EUR'});});}
const form=document.getElementById('requestForm');
if(form){form.addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());data.date=new Date().toISOString();const list=JSON.parse(localStorage.getItem('musterteil_messages')||'[]');list.unshift(data);localStorage.setItem('musterteil_messages',JSON.stringify(list));document.getElementById('formNote').textContent='Demo-Anfrage wurde lokal im Browser gespeichert. Im echten Betrieb wird ein Backend angeschlossen.';form.reset();});}
