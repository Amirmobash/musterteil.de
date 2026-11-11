import {materials,geometrySTL,estimate,gcodeStats,sliceSupportApprox,costs} from "./core.mjs";
const q=id=>document.getElementById(id);
let mesh=null,bytes=null,fileName="",task=0,engineLoad=null,prices={abs:25.99,pla:25.99,petg:25.99},verified="2026-11-11",source="https://bambulab-eu.myshopify.com/de/pages/bambu-filament",timer=null;
const fmt=(n,d=2)=>Number(n).toLocaleString("de-DE",{minimumFractionDigits:d,maximumFractionDigits:d}),eu=n=>fmt(n)+" €",g=n=>fmt(n,1)+" g";
const hours=h=>{let min=Math.max(1,Math.round(h*60));return min>=60?Math.floor(min/60)+" Std. "+String(min%60).padStart(2,"0")+" Min.":min+" Min.";};
const settings=()=>({material:q("material").value,layer:Number(q("layer").value),infill:Number(q("infill").value),support:q("support").checked});
const badge=(t,cls="")=>{q("state").textContent=t;q("state").className="badge "+cls;};
const progress=(msg,n=0)=>{q("progressText").textContent=msg;q("bar").style.width=n+"%";};
function materialUI(){
 const s=settings();q("materialNote").textContent=materials[s.material].details;q("infillText").textContent=s.infill+" %";
 q("kgPrice").textContent=eu(prices[s.material])+" / kg";q("priceDate").textContent="STAND "+verified.split("-").reverse().join(".");
 q("priceLink").href=source;
}
async function loadPrices(){
 try{const res=await fetch("./prices.json",{cache:"no-store"}),x=await res.json();
 if(["abs","pla","petg"].every(k=>Number.isFinite(x.materials?.[k])&&x.materials[k]>=10&&x.materials[k]<100)){prices=x.materials;verified=x.verified;source=x.source;}
 }catch{}materialUI();
}
function render(d,real=false){
 const c=costs(d.total,d.hours,prices[settings().material]);
 q("total").textContent=fmt(c.total);q("time").textContent=hours(d.hours);
 q("part").textContent=g(d.part);q("supportGrams").textContent=g(d.support);q("weight").textContent=g(d.total);
 q("supportNote").textContent=d.supportKind;
 q("filamentCost").textContent=eu(c.filament);q("powerCost").textContent=eu(c.power);
 q("resultInfo").textContent=real?"Extrusion aus geslictem G-Code; Zeit und Stützanteil teils geschätzt.":"Nur geometrische Näherung. Noch keine echten Slicing-Daten.";
 badge(real?"G-CODE ANALYSIERT":"GEOMETRIE-NÄHERUNG",real?"ok":"warn");
}
function rough(){if(mesh)render(estimate(mesh,settings()),false);}
async function getEngine(){
 if(!engineLoad)engineLoad=(async()=>{
  try{const x=await import("https://grid.space/lib/kiri/run/engine.js");if(typeof x.Engine==="function")return x.Engine;}catch(e){console.info("Kiri module:",e?.message);}
  if(!globalThis.kiri?.newEngine)await new Promise((resolve,reject)=>{const el=document.createElement("script");el.src="https://grid.space/code/engine.js";el.onload=resolve;el.onerror=()=>reject(Error("Kiri:Moto ist nicht erreichbar."));document.head.appendChild(el);});
  if(globalThis.kiri?.newEngine)return class{constructor(){return globalThis.kiri.newEngine();}};
  if(globalThis.Engine)return globalThis.Engine;
  throw Error("Browser-Slicer konnte nicht geladen werden.");
 })();
 try{return await engineLoad;}catch(e){engineLoad=null;throw e;}
}
async function calculate(){
 if(!mesh||!bytes)return;
 const current=++task,s=settings();
 if(mesh.size.some(v=>v>350)){progress("Modell überschreitet 350 × 350 × 350 mm. Ausrichtung prüfen.",0);badge("BAURAUM ZU KLEIN","warn");return;}
 q("recalc").disabled=true;badge("SLICER LÄDT");progress("Kiri:Moto wird im Browser geladen …",12);
 try{
  const Engine=await getEngine();if(current!==task)return;
  const engine=new Engine();
  engine.setMode("FDM").setRender(false).setController({threaded:false})
   .setDevice({deviceName:"K2 Plus – vereinfachtes Demo-Profil",bedWidth:350,bedDepth:350,maxHeight:350,originCenter:false,extrudeAbs:true,extruders:[{extFilament:1.75,extNozzle:.4,extSelect:["T0"],extDeselect:[],extOffsetX:0,extOffsetY:0}]})
   .setProcess({sliceHeight:s.layer,firstSliceHeight:s.layer,sliceShells:3,sliceTopLayers:4,sliceBottomLayers:4,sliceFillSparse:s.infill/100,sliceSupportEnable:s.support,sliceSupportDensity:.25,sliceSupportAngle:50,sliceSupportOffset:.4,sliceSupportGap:1,outputTemp:materials[s.material].temp,outputBedTemp:materials[s.material].bed,outputFeedrate:s.material==="abs"?55:65,outputFinishrate:40,outputSeekrate:125})
   .setListener(msg=>{if(current!==task)return;if(msg.slice)progress("Slicing: Schichten und Überhänge …",43);else if(msg.prepare)progress("Bereite G-Code und Stützen vor …",69);else if(msg.export)progress("Lese Extrusionsdaten …",86);});
  await engine.parse(bytes.slice(0));if(current!==task)return;
  await engine.slice();if(current!==task)return;
  const sliceSupport=s.support?sliceSupportApprox(engine,materials[s.material].density):0;
  await engine.prepare();const code=await engine.export();if(current!==task)return;
  const stat=gcodeStats(code,materials[s.material].density);
  const approx=estimate(mesh,s);
  const support=s.support?Math.min(stat.total*.7,Math.max(0,stat.markedSupport??sliceSupport??approx.support)):0;
  render({total:stat.total,part:Math.max(0,stat.total-support),support,hours:stat.hours,supportKind:stat.markedSupport!==null?"Im G-Code markiert":sliceSupport!==null?"Aus Support-Konturen geschätzt":"Aus Überhängen geschätzt"},true);
  q("engineInfo").textContent="Slicing im Browser abgeschlossen. Zeit und Support bleiben Näherungen.";
  progress("Analyse abgeschlossen. Datei nicht hochgeladen.",100);
 }catch(error){
  if(current!==task)return;
  rough();progress("Slicer nicht verfügbar. Die angezeigten Zahlen sind nur geometrische Näherungen.",100);
  q("engineInfo").textContent="Slicer momentan nicht verfügbar: "+String(error.message||error).slice(0,95);
  console.warn("Kiri slicing failed:",error);
 }finally{if(current===task)q("recalc").disabled=false;}
}
function queue(ms=550){
 if(!mesh)return;task++;clearTimeout(timer);rough();timer=setTimeout(calculate,ms);
}
async function fileChosen(file){
 if(!file)return;
 if(!/\.stl$/i.test(file.name)){progress("Bitte nur eine STL-Datei wählen.",0);return;}
 if(file.size>25*1024*1024){progress("Datei zu groß: maximal 25 MB.",0);return;}
 const my=++task;clearTimeout(timer);
 try{
  const data=await file.arrayBuffer();if(my!==task)return;
  const parsed=geometrySTL(data);bytes=data;mesh=parsed;fileName=file.name;
  q("fileLabel").textContent=file.name;q("fileHint").textContent=fmt(file.size/1024,0)+" KB · lokale Datei";
  q("sizeInfo").textContent="Modell: "+parsed.size.map(x=>fmt(x,1)).join(" × ")+" mm · "+parsed.faces.toLocaleString("de-DE")+" Dreiecke";
  q("recalc").disabled=false;rough();
  progress(parsed.reliable?"STL analysiert. Echtes Slicing startet …":"Geometrie möglicherweise nicht wasserdicht. Werte unsicher.",5);
  queue(250);
 }catch(e){progress(e.message||"STL konnte nicht gelesen werden.",0);badge("DATEIFEHLER","warn");}
}
q("upload").addEventListener("change",e=>fileChosen(e.target.files?.[0]));
q("drop").addEventListener("dragover",e=>{e.preventDefault();q("drop").classList.add("dragging");});
q("drop").addEventListener("dragleave",()=>q("drop").classList.remove("dragging"));
q("drop").addEventListener("drop",e=>{e.preventDefault();q("drop").classList.remove("dragging");fileChosen(e.dataTransfer?.files?.[0]);});
q("drop").addEventListener("keydown",e=>{if(e.target===q("drop")&&(e.key==="Enter"||e.key===" ")){e.preventDefault();q("upload").click();}});
for(const id of ["material","layer","infill","support"])q(id).addEventListener("input",()=>{materialUI();queue();});
q("recalc").addEventListener("click",()=>queue(10));
document.querySelectorAll("[data-dialog]").forEach(btn=>btn.addEventListener("click",()=>q(btn.dataset.dialog).showModal()));
document.querySelectorAll("dialog").forEach(d=>d.addEventListener("click",e=>{if(e.target===d)d.close();}));
materialUI();loadPrices();
