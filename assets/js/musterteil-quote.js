
const menuBtn=document.getElementById('menuBtn'), mainNav=document.getElementById('mainNav');
if(menuBtn&&mainNav){menuBtn.addEventListener('click',()=>mainNav.classList.toggle('open'))}
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
function euro(n){return n.toLocaleString('de-DE',{style:'currency',currency:'EUR'})}
function sizeMB(file){return file?file.size/1024/1024:0}
function calcPrice(type, qty, complexity=1, quality=0, shipping=0, mb=0){
  const base={small:14,student:28,prototype:42,series:62}[type]||20;
  const sizeFactor=Math.min(50,Math.max(0,mb*3.2));
  return Math.max(10,Math.round((base+sizeFactor)*qty*complexity+quality+shipping));
}
const hFile=document.getElementById('homeFileInput'), hInfo=document.getElementById('homeFileInfo'), hForm=document.getElementById('homeQuoteForm');
if(hFile&&hInfo){hFile.addEventListener('change',()=>{const f=hFile.files[0];hInfo.textContent=f?`${f.name} · ${sizeMB(f).toFixed(2)} MB`:'oder 3MF / OBJ wählen';})}
if(hForm){hForm.addEventListener('submit',e=>{e.preventDefault();const f=hFile.files[0];const type=document.getElementById('homeProjectType').value;const qty=Number(document.getElementById('homeQuantity').value||1);const price=calcPrice(type,qty,1.25,0,0,sizeMB(f));document.getElementById('homePrice').textContent='ca. '+euro(price);})}

const fileInput=document.getElementById('fileInput'), fileInfo=document.getElementById('fileInfo');
if(fileInput&&fileInfo){fileInput.addEventListener('change',()=>{const f=fileInput.files[0];fileInfo.innerHTML=f?`<strong>${f.name}</strong><br>${sizeMB(f).toFixed(2)} MB · wird nur lokal im Browser gelesen`:'Noch keine Datei ausgewählt.'})}
const quoteForm=document.getElementById('quoteForm');
if(quoteForm){quoteForm.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(quoteForm);const f=fileInput.files[0];const mb=sizeMB(f);const type=fd.get('projectType');const quantity=Number(fd.get('quantity')||1);const complexity=Number(fd.get('complexity')||1);const quality=Number(fd.get('quality')||0);const shipping=Number(fd.get('shipping')||0);const color=fd.get('color')||'nicht angegeben';const notes=fd.get('notes')||'';const price=calcPrice(type,quantity,complexity,quality,shipping,mb);const summary=`Musterteil Anfrage
-----------------
Datei: ${f?f.name:'keine Datei gewählt'}
Dateigröße: ${f?mb.toFixed(2)+' MB':'nicht verfügbar'}
Projektart: ${type}
Menge: ${quantity}
Komplexität: ${complexity}
Nachbearbeitung: ${quality} €
Versand: ${shipping} €
Farbwunsch / Hinweis: ${color}
Preisindikation: ${euro(price)}

Beschreibung:
${notes||'-'}

Hinweis: Dies ist eine unverbindliche Preisindikation. Die finale Kalkulation erfolgt nach Prüfung der Datei.`;document.getElementById('priceOutput').textContent='ca. '+euro(price);document.getElementById('quoteNote').textContent='Unverbindliche Preisindikation. Finale Prüfung nach Sichtung der Datei.';document.getElementById('quoteSummary').value=summary;document.getElementById('mailtoQuote').href='mailto:?subject='+encodeURIComponent('PLA 3D-Druck Anfrage Musterteil')+'&body='+encodeURIComponent(summary);})}
const copyQuote=document.getElementById('copyQuote');
if(copyQuote){copyQuote.addEventListener('click',async()=>{const text=document.getElementById('quoteSummary').value;if(!text)return;await navigator.clipboard.writeText(text);const old=copyQuote.textContent;copyQuote.textContent='Kopiert!';setTimeout(()=>copyQuote.textContent=old,1500)})}
const contactForm=document.getElementById('contactForm');
if(contactForm){contactForm.addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(contactForm).entries());const all=JSON.parse(localStorage.getItem('musterteil_contact_msgs')||'[]');data.created_at=new Date().toLocaleString('de-DE');all.unshift(data);localStorage.setItem('musterteil_contact_msgs',JSON.stringify(all));document.getElementById('contactMsg').textContent='Nachricht wurde lokal im Browser gespeichert. Für den echten Betrieb bitte E-Mail-Adresse eintragen.';contactForm.reset()})}

// ================================
// Musterteil status popup + cookies
// ================================
document.addEventListener("DOMContentLoaded", function () {
  const statusOverlay = document.getElementById("mtStatusOverlay");
  const statusClose = document.getElementById("mtStatusClose");
  const statusOk = document.getElementById("mtStatusOk");

  const cookieBanner = document.getElementById("mtCookieBanner");
  const cookieAccept = document.getElementById("mtCookieAccept");

  const statusKey = "musterteil_status_notice_seen";
  const cookieKey = "musterteil_cookie_accepted";

  // Show status popup once per visitor
  if (statusOverlay && localStorage.getItem(statusKey) !== "yes") {
    setTimeout(function () {
      statusOverlay.classList.add("mt-visible");
    }, 450);
  }

  function closeStatusPopup() {
    if (!statusOverlay) return;
    statusOverlay.classList.remove("mt-visible");
    localStorage.setItem(statusKey, "yes");
  }

  if (statusClose) {
    statusClose.addEventListener("click", closeStatusPopup);
  }

  if (statusOk) {
    statusOk.addEventListener("click", closeStatusPopup);
  }

  if (statusOverlay) {
    statusOverlay.addEventListener("click", function (event) {
      if (event.target === statusOverlay) {
        closeStatusPopup();
      }
    });
  }

  // Show cookie banner until accepted
  if (cookieBanner && localStorage.getItem(cookieKey) !== "yes") {
    setTimeout(function () {
      cookieBanner.classList.add("mt-visible");
    }, 800);
  }

  if (cookieAccept) {
    cookieAccept.addEventListener("click", function () {
      cookieBanner.classList.remove("mt-visible");
      localStorage.setItem(cookieKey, "yes");
    });
  }
});

