// Local math, independent from DOM and the externally fetched slicer.
export const materials={
 abs:{name:"ABS",density:1.04,temp:255,bed:100,flow:4.4,details:"ABS ist zäh und wärmebeständiger als PLA; neigt zum Verzug und benötigt einen geschlossenen Bauraum."},
 pla:{name:"PLA Basic",density:1.24,temp:220,bed:60,flow:5.1,details:"PLA ist steif, vergleichsweise einfach zu drucken und gut für Modelle; bei höherer Wärme wenig beständig."},
 petg:{name:"PETG HF",density:1.27,temp:250,bed:75,flow:4.7,details:"PETG ist robust und zäh mit guter Feuchtigkeitsbeständigkeit; es kann Fäden bilden und weniger steif als PLA sein."}
};
const bound=(v,min,max)=>Math.max(min,Math.min(max,v));
export function geometrySTL(data){
 if(!(data instanceof ArrayBuffer)||data.byteLength<84)throw Error("Ungültige oder leere STL-Datei.");
 const view=new DataView(data),count=view.getUint32(80,true);
 const triangles=[];
 if(count>0&&84+count*50===data.byteLength){
  if(count>500000)throw Error("Modell hat zu viele Dreiecke.");
  for(let i=0;i<count;i++){const base=84+50*i+12,arr=[];for(let j=0;j<9;j++)arr.push(view.getFloat32(base+4*j,true));triangles.push(arr);}
 }else{
  const raw=new TextDecoder().decode(data);
  if(!/^\s*solid\b/i.test(raw))throw Error("Keine unterstützte STL-Datei.");
  const rex=/vertex\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)/ig;let match,tri=[];
  while((match=rex.exec(raw))){tri.push(...match.slice(1).map(Number));if(tri.length===9){triangles.push(tri);tri=[];}if(triangles.length>500000)throw Error("Modell hat zu viele Dreiecke.");}
  if(tri.length)throw Error("STL-Geometrie unvollständig.");
 }
 if(triangles.length<4)throw Error("Die STL-Datei enthält zu wenige Dreiecke.");
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];let volume=0,surface=0;
 for(const t of triangles){
  if(!t.every(Number.isFinite))throw Error("Ungültige Koordinaten in der STL.");
  for(let j=0;j<9;j+=3)for(let k=0;k<3;k++){min[k]=Math.min(min[k],t[j+k]);max[k]=Math.max(max[k],t[j+k]);}
  const [ax,ay,az,bx,by,bz,cx,cy,cz]=t;
  const ux=bx-ax,uy=by-ay,uz=bz-az,vx=cx-ax,vy=cy-ay,vz=cz-az;
  volume+=(ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx))/6;
  surface+=Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)/2;
 }
 const size=max.map((v,i)=>v-min[i]),box=size.reduce((a,b)=>a*b,1);
 if(size.some(v=>v<=0||v>10000))throw Error("STL-Abmessungen unplausibel. Sind die Maße in mm?");
 volume=Math.abs(volume);
 const reliable=volume>0&&volume<=box*1.02;
 let downArea=0;
 for(const t of triangles){
  const z=(t[2]+t[5]+t[8])/3;if(z<min[2]+0.5)continue;
  const ux=t[3]-t[0],uy=t[4]-t[1],uz=t[5]-t[2],vx=t[6]-t[0],vy=t[7]-t[1],vz=t[8]-t[2];
  const nz=ux*vy-uy*vx,len=Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,nz);
  if(len>0&&-nz/len>.45)downArea+=-nz/2;
 }
 return {size,volume:reliable?volume:box*.18,surface,downArea,faces:triangles.length,reliable};
}
export function estimate(g,s){
 const m=materials[s.material],v=g.volume,layer=s.layer,infill=s.infill/100;
 const shell=Math.min(v*.65,g.surface*.3),caps=Math.min((v-shell)*.45,g.size[0]*g.size[1]*layer*6);
 const solid=bound(shell+caps+(v-shell-caps)*infill,v*.07,v),area=Math.min(g.downArea,g.size[0]*g.size[1]*.75);
 const sup=s.support?area*g.size[2]*.35*.22:0,total=(solid+sup)*m.density/1000;
 return {part:solid*m.density/1000,support:sup*m.density/1000,total,hours:bound(((solid+sup)/m.flow+Math.ceil(g.size[2]/layer)*6+360)/3600,.01,1000),supportKind:"Geometrische Näherung"};
}
export function gcodeStats(gcode,density){
 if(typeof gcode!=="string"||gcode.length<15)throw Error("Leerer G-Code.");
 let pos=[0,0,0],e=0,absE=true,absPos=true,feed=1800,time=0,mm=0,sup=0,hasTag=false,inSupport=false,hasSpeed=false;
 for(const source of gcode.split(/\r?\n/)){
  const ci=source.indexOf(";"),comment=ci<0?"":source.slice(ci+1).trim();
  if(/^(TYPE|FEATURE)\s*:\s*(support|tree support)/i.test(comment)){inSupport=true;hasTag=true;}
  else if(/^(TYPE|FEATURE)\s*:/i.test(comment))inSupport=false;
  const line=(ci<0?source:source.slice(0,ci)).trim(),match=/^(G0|G1|G92|M82|M83|G90|G91|G4)\b/i.exec(line);
  if(!match)continue;const cmd=match[1].toUpperCase();
  if(cmd==="M82"){absE=true;continue;}if(cmd==="M83"){absE=false;continue;}if(cmd==="G90"){absPos=true;continue;}if(cmd==="G91"){absPos=false;continue;}
  const args={};for(const item of line.matchAll(/([XYZEFPS])\s*(-?\d+(?:\.\d+)?)/ig))args[item[1].toUpperCase()]=Number(item[2]);
  if(cmd==="G92"){for(let j=0;j<3;j++)if(args["XYZ"[j]]!==undefined)pos[j]=args["XYZ"[j]];if(args.E!==undefined)e=args.E;continue;}
  if(cmd==="G4"){time+=(args.P||0)/1000+(args.S||0);continue;}
  if(args.F>0){feed=args.F;hasSpeed=true;}
  const next=pos.slice();for(let j=0;j<3;j++){const v=args["XYZ"[j]];if(v!==undefined)next[j]=absPos?v:pos[j]+v;}
  if(feed>0)time+=Math.hypot(...next.map((v,j)=>v-pos[j]))/(feed/60);
  if(args.E!==undefined){const delta=absE?args.E-e:args.E;e=absE?args.E:e+args.E;if(delta>0){mm+=delta;if(inSupport)sup+=delta;}}
  pos=next;
 }
 if(!hasSpeed||mm<=0)throw Error("Keine auswertbaren Extrusionsdaten im G-Code.");
 const toGrams=Math.PI*(1.75/2)**2*density/1000;
 return {total:mm*toGrams,markedSupport:hasTag?sup*toGrams:null,hours:bound((time*1.18+480)/3600,.01,1000)};
}
export function sliceSupportApprox(engine,density){
 try{
  let volume=0,n=0;for(const slice of engine.widget?.slices||[])for(const element of slice.supports||[]){
   const poly=element.poly||element;
   const a=typeof poly.area==="function"?Math.abs(poly.area()):0;
   if(Number.isFinite(a)&&a>0){volume+=a*(slice.height||.2);n++;}
  }
  return n?volume*.25*density/1000:null;
 }catch{return null;}
}
export function costs(g,h,kg){const filament=g/1000*kg,power=h*.2*.35;return {filament,power,total:filament+power};}
