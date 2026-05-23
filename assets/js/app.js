
const $=(s,p=document)=>p.querySelector(s);const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const STORE='musterteil_requests_v2';
function load(){try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch(e){return[]}}
function save(x){localStorage.setItem(STORE,JSON.stringify(x))}
function id(){return 'MT-'+new Date().getFullYear()+'-'+Math.floor(1000+Math.random()*9000)}
function toast(msg){let t=document.createElement('div');t.textContent=msg;t.style.cssText='position:fixed;right:18px;bottom:18px;background:#101827;border:1px solid rgba(255,255,255,.15);padding:14px 18px;border-radius:16px;color:white;z-index:99;box-shadow:0 18px 60px rgba(0,0,0,.35)';document.body.appendChild(t);setTimeout(()=>t.remove(),3500)}
function initQuote(){const f=$('#quoteForm');if(!f)return;f.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(f);const item={id:id(),date:new Date().toISOString(),status:'Neu',name:fd.get('name')||'',email:fd.get('email')||'',phone:fd.get('phone')||'',service:fd.get('service')||'',material:fd.get('material')||'',qty:fd.get('qty')||'1',message:fd.get('message')||'',budget:fd.get('budget')||'',deadline:fd.get('deadline')||''};let arr=load();arr.unshift(item);save(arr);toast('Ihre Anfrage wurde als Demo lokal gespeichert. Referenz: '+item.id);f.reset();});}
function calc(){const el=$('#priceCalc'); if(!el)return; const out=$('#calcOut'); el.addEventListener('input',()=>{let h=+($('#hours').value||1), m=+($('#mat').value||15), q=+($('#qty').value||1);let service=$('#serviceCalc').value;let rate=service==='CNC'?68:service==='Laser'?52:44;let total=Math.max(35,(h*rate+m)*q*1.19);out.textContent=total.toLocaleString('de-DE',{style:'currency',currency:'EUR'});}); el.dispatchEvent(new Event('input'));}
document.addEventListener('DOMContentLoaded',()=>{initQuote();calc(); $$('.year').forEach(x=>x.textContent=new Date().getFullYear());});
