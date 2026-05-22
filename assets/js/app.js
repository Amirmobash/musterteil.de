(function(){
  const $=(s,c=document)=>c.querySelector(s); const $$=(s,c=document)=>[...c.querySelectorAll(s)];
  $('[data-year]') && ($('[data-year]').textContent = new Date().getFullYear());
  const toggle=$('[data-menu-toggle]'), nav=$('[data-mainnav]'); if(toggle&&nav) toggle.addEventListener('click',()=>nav.classList.toggle('open'));
  const calc=$('#calcForm');
  if(calc){calc.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(calc);const base=Number(d.get('process'));const mat=Number(d.get('material'));const qty=Math.max(1,Number(d.get('qty')));const c=Number(d.get('complexity'));const setup=35;const total=(setup+(base*mat*c*qty))*1.19;$('#calcResult').innerHTML=`<strong>Demo-Schätzung:</strong> ca. ${total.toFixed(2)} € brutto · unverbindlich · echte Kalkulation folgt später.`;});}
  const form=$('#requestForm');
  if(form){form.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form);const req={id:'REQ-'+Date.now().toString().slice(-6),created:new Date().toISOString(),company:fd.get('company')||'',name:fd.get('name')||'',email:fd.get('email')||'',phone:fd.get('phone')||'',process:fd.get('process')||'',fileType:fd.get('fileType')||'',qty:fd.get('qty')||'1',date:fd.get('date')||'',message:fd.get('message')||'',file:fd.get('file') && fd.get('file').name ? fd.get('file').name : 'keine Datei'};const existing=JSON.parse(localStorage.getItem('musterteilRequests')||'[]');existing.unshift(req);localStorage.setItem('musterteilRequests',JSON.stringify(existing));
    const data=JSON.parse(localStorage.getItem('musterteilAdminData')||'null'); if(data){data.messages.unshift({id:req.id,from:req.name,email:req.email,subject:req.process,message:req.message,created:req.created,read:false});data.orders.unshift({id:'ORD-'+Date.now().toString().slice(-6),title:req.process+' Anfrage',customer:req.company||req.name,process:req.process,status:'Neu',value:0,created:req.created,file:req.file});localStorage.setItem('musterteilAdminData',JSON.stringify(data));}
    $('#formNote').className='form-note success';$('#formNote').textContent='Demo-Anfrage wurde lokal gespeichert. Öffne den Adminbereich, um sie zu sehen.';form.reset();});}
})();
