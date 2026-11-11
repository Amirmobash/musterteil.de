import test from "node:test";
import assert from "node:assert/strict";
import {geometrySTL,estimate,gcodeStats,costs} from "../assets/core.mjs";
function cube(){
 const points=[[0,0,0],[20,0,0],[20,20,0],[0,20,0],[0,0,20],[20,0,20],[20,20,20],[0,20,20]];
 const faces=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
 const a=new ArrayBuffer(84+faces.length*50),v=new DataView(a);v.setUint32(80,faces.length,true);
 faces.forEach((t,i)=>t.forEach((j,k)=>points[j].forEach((n,c)=>v.setFloat32(84+i*50+12+k*12+c*4,n,true))));return a;
}
test("valid STL cube: 20 mm in all axes and 8000 cubic mm",()=>{const a=geometrySTL(cube());assert.deepEqual(a.size,[20,20,20]);assert.ok(Math.abs(a.volume-8000)<.01);});
test("higher infill costs more filament",()=>{const a=geometrySTL(cube());assert.ok(estimate(a,{material:"abs",layer:.2,infill:80,support:false}).total>estimate(a,{material:"abs",layer:.2,infill:10,support:false}).total);});
test("GCode extrusion after G92 reset",()=>{const r=gcodeStats("M82\nG90\nG1 F1200 X10 E1\nG1 X20 E2\nG92 E0\nG1 X30 E1",1.04);const expected=3*Math.PI*(1.75/2)**2*1.04/1000;assert.ok(Math.abs(r.total-expected)<1e-7);});
test("GCode support category",()=>{const r=gcodeStats("M82\nG1 F1200 X0 E0\n;TYPE:WALL-OUTER\nG1 X10 E1\n;TYPE:SUPPORT\nG1 X20 E2",1.04);assert.ok(Math.abs(r.markedSupport-r.total/2)<1e-7);});
test("costs have no sales margin",()=>{const c=costs(100,2,25.99);assert.ok(Math.abs(c.total-(2.599+.14))<1e-7);});
test("invalid input fails",()=>assert.throws(()=>geometrySTL(new ArrayBuffer(4))));
