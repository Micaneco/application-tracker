"use strict";
const schools = [
 ["Rikkyo University","立教大学","https://www.rikkyo.ac.jp/admissions/"],
 ["Aoyama Gakuin University","青山学院大学","https://www.aoyama.ac.jp/admission/"],
 ["Hosei University","法政大学","https://nyushi.hosei.ac.jp/"],
 ["Waseda University","早稲田大学","https://www.waseda.jp/inst/admission/undergraduate/application/"],
 ["Sophia University","上智大学","https://adm.sophia.ac.jp/jpn/gakubu_ippan_ad/"],
 ["Temple University, Japan Campus","テンプル大学ジャパンキャンパス","https://www.tuj.ac.jp/ug/admissions"],
 ["Ritsumeikan Asia Pacific University","立命館アジア太平洋大学","https://en.apu.ac.jp/home/admissions/"]
];
const initial = [[0,"Intercultural Communication / 異文化コミュニケーション学部"],[0,"Global Business / 経営学部 国際経営学科"],[0,"Business / 経営学部 経営学科"],[0,"International Business Law / 法学部 国際ビジネス法学科"],[1,"English / 文学部 英米文学科"],[2,"Global and Interdisciplinary Studies / グローバル教養学部"],[3,""],[4,"English Studies / 外国語学部 英語学科"],[5,""],[6,""]];
const routes = ["To select / 選択前","General admission / 一般選抜","Common Test-based / 共通テスト利用","General + Common Test / 共通テスト併用","Eiken-based route / 英検利用方式","Rolling admission / 随時選考","Other / その他"];
const facts = [
 ["open","Application opens / 出願開始","date"],["web","Web application deadline / Web出願締切","date"],["doc","Document deadline / 書類提出締切","date"],["exam","Exam date / 試験日","date"],["exam2","Second exam date / 第2試験日","date"],["result","Acceptance announcement / 合格発表","date"],["initial","Initial enrollment payment / 一次納入締切","date"],["final","Final enrollment payment / 二次・最終納入締切","date"],["provisional","Provisional or T-route deadline / 仮納入・T方式締切","date"],
 ["tuition","Tuition (JPY) / 授業料（円）","number"],["initialFee","Initial payment (JPY) / 一次納入額（円）","number"],["finalFee","Final payment (JPY) / 最終納入額（円）","number"],["scholarship","Scholarships / 奨学金","text"],["abroad","Study abroad / 留学","text"],["eiken","Eiken advantage / 英検活用","text"]
];
const checks = [["transcript","Transcript / 調査書"],["english","English test proof / 英語資格証明"],["webDone","Web application submitted / Web出願済"],["docsDone","Documents submitted / 書類提出済"],["appFee","Application fee paid / 検定料納入済"],["provDone","Provisional payment made / 仮納入済"],["initDone","Initial payment made / 一次納入済"],["finalDone","Final payment made / 最終納入済"]];
const doneFor = {web:"webDone",doc:"docsDone",initial:"initDone",final:"finalDone",provisional:"provDone"};
const statuses = ["未確認","Confirmed / 確認済","N/A / 対象外"];
const key = "university-applications-2027-v1";
const seed = initial.map(([school,program],i)=>({id:"seed-"+i,school,program,route:0,source:schools[school][2],facts:{},checks:{}}));
let records;
try { records = JSON.parse(localStorage.getItem(key)) ?? seed; } catch { records = seed; }
let tab=0, month=0, editing=null, scope=[null,null,null], noticeTimer;
const tabs=["Applications / 出願","Compare / 比較","Calendar / カレンダー","Deadlines / 締切","Checklists / チェック"];
const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const url = value => /^https?:\/\//i.test(value ?? "") ? esc(value) : "";
const link = (value,label) => url(value) ? '<a href="'+url(value)+'" target="_blank" rel="noopener noreferrer">'+label+'</a>' : "";
const status = n => '<span class="badge '+(n===1?"confirmed":n===2?"na":"")+'">'+statuses[n??0]+'</span>';
const options = (items,selected) => items.map(([value,label])=>'<option value="'+esc(value)+'" '+(String(value)===String(selected)?"selected":"")+'>'+esc(label)+'</option>').join("");
const schoolName = r => schools[r.school][0];
const title = r => esc(schoolName(r)) + '<small>'+esc(r.program || schools[r.school][1])+'</small>';
const edit = r => '<button data-edit="'+esc(r.id)+'">Edit / 編集</button>';
const today = () => new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const daysAway = date => Math.round((Date.parse(date)-Date.parse(today()))/86400000);
const pending = e => !e.r.checks[doneFor[e.k]];
function save(next) {
 try { localStorage.setItem(key,JSON.stringify(next)); records=next; return true; }
 catch { notify("Unable to save in this browser."); return false; }
}
function notify(message) {
 $("notice").textContent=message;
 clearTimeout(noticeTimer);
 noticeTimer=setTimeout(()=>$("notice").textContent="",3200);
}
function events(rows) {
 return rows.flatMap(r=>facts.filter(([, ,type])=>type==="date").flatMap(([k,label])=>{
  const f=r.facts[k];
  return f?.value && f.status!==2 ? [{r,k,label,date:f.value,status:f.status??0}] : [];
 })).sort((a,b)=>a.date.localeCompare(b.date));
}
function clashes(all) {
 const dates=[...new Set(all.map(e=>e.date))];
 return dates.flatMap(date=>{
  const on=all.filter(e=>e.date===date && e.k!=="open" && e.k!=="result" && pending(e));
  if(new Set(on.map(e=>e.r.id)).size<2) return [];
  return [{date,on,exam:on.filter(e=>e.k.startsWith("exam")).length>1}];
 });
}
const empty = message => '<div class="empty">'+message+'</div>';
const panel = (heading,body,actions="") => '<section class="panel"><div class="panelHead"><h2>'+heading+'</h2>'+actions+'</div>'+body+'</section>';
const table = (headers,rows) => '<div class="scroll"><table><thead><tr>'+headers.map(x=>'<th scope="col">'+x+'</th>').join("")+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+x+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>';
function valueFor(r,k,type) {
 const f=r.facts[k]??{};
 return (f.value && f.status!==2 ? esc(type==="number"?"¥"+Number(f.value).toLocaleString("ja-JP"):f.value)+"<br>":"")+status(f.status)
 + (f.checked?'<small>Checked '+esc(f.checked)+'</small>':'')
 + (f.source?'<small>'+link(f.source,"Official source / 公式資料")+'</small>':'')
 + (f.note?'<small>'+esc(f.note)+'</small>':'');
}
function render() {
 const all = events(records);
 const visible=records.filter(r=>(scope[0]===null || String(r.school)===scope[0]) && (scope[1]===null || r.program===scope[1]) && (scope[2]===null || String(r.route)===scope[2]));
 const current=events(visible), conflicts=clashes(current);
 const globalConflicts=clashes(all);
 $("nav").innerHTML=tabs.map((label,i)=>'<button data-tab="'+i+'" aria-current="'+(tab===i)+'">'+label+'</button>').join("");
 $("stats").innerHTML=[[records.length,"Application records"],[all.filter(e=>doneFor[e.k] && pending(e) && daysAway(e.date)>=0 && daysAway(e.date)<=30).length,"Deadlines in 30 days"],[globalConflicts.length,"Dates with conflicts"],[records.reduce((n,r)=>n+facts.filter(([k])=>!r.facts[k]?.status).length,0),"Unverified items / 未確認"]].map(([n,l])=>'<div class="stat"><strong>'+n+'</strong>'+l+'</div>').join("");
 const filters=[["University / 大学",schools.map((s,i)=>[i,s[0]])],["Faculty or program / 学部・学科",[...new Set(records.map(r=>r.program))].sort().map(p=>[p,p||"Undecided / 未定"])],["Admission route / 入試方式",routes.map((r,i)=>[i,r])]];
 $("filters").innerHTML=filters.map(([name,items],i)=>'<label class="field">'+name+'<select data-filter="'+i+'">'+options([["*","All / すべて"],...items],scope[i]??"*")+'</select></label>').join("")+'<button id="reset">Clear filters</button>';
 const no=empty("No applications match these filters.");
 let body;
 if(tab===0){
  body=panel("Application records / 出願一覧",visible.length?table(["University / 大学","Faculty or program / 学部・学科","Route / 方式","Verification / 確認状況","Admissions / 入試情報",""],visible.map(r=>[title(r),esc(r.program||"Undecided / 未定"),esc(routes[r.route])+(r.variant?'<small>'+esc(r.variant)+'</small>':""),status(r.status)+(r.checked?'<small>'+esc(r.checked)+'</small>':""),link(r.source,"Official site"),edit(r)])):no);
 } else if(tab===1) {
  const summary=[["Route / 方式",r=>esc(routes[r.route])+(r.variant?"<br>"+esc(r.variant):"")],["Verification / 確認状況",r=>status(r.status)+(r.checked?'<small>'+esc(r.checked)+'</small>':"")],...facts.map(([k,label,type])=>[label,r=>valueFor(r,k,type)]),["Official sources / 公式資料",r=>link(r.source,"Admissions")+(r.guide?"<br>"+link(r.guide,"2027 guidelines"):"")],["Notes / メモ",r=>esc(r.notes)]];
  body=panel("Side-by-side comparison / 比較",visible.length?table(["Field / 項目",...visible.map(r=>title(r)+"<br>"+edit(r))],summary.map(([l,get])=>[l,...visible.map(get)])):no);
 } else if(tab===2){
  const prefix="2027-0"+(month+1)+"-";
  const offset=(new Date(Date.UTC(2027,month,1)).getUTCDay()+6)%7;
  const count=new Date(Date.UTC(2027,month+1,0)).getUTCDate();
  const conflictDates=new Set(conflicts.map(c=>c.date));
  let cells=["Mon 月","Tue 火","Wed 水","Thu 木","Fri 金","Sat 土","Sun 日"].map(d=>'<div class="weekday">'+d+'</div>');
  for(let i=0;i<Math.ceil((offset+count)/7)*7;i++){
   const d=i-offset+1;
   if(d<1 || d>count){ cells.push('<div class="day blank"></div>'); continue; }
   const date=prefix+String(d).padStart(2,"0");
   cells.push('<div class="day"><b>'+d+'</b>'+current.filter(e=>e.date===date).map(e=>'<button class="event '+(conflictDates.has(date)?"clash":"")+'" data-edit="'+esc(e.r.id)+'">'+esc(schoolName(e.r))+' · '+esc(e.label.split(" / ")[0])+(e.status===1?"":" · 未確認")+'</button>').join("")+'</div>');
  }
  const toggle=['January / 1月','February / 2月','March / 3月'].map((l,i)=>'<button data-month="'+i+'" aria-pressed="'+(month===i)+'">'+l+'</button>').join("");
  body=panel("January–March 2027 / 入試カレンダー",'<div class="scroll"><div class="calendar">'+cells.join("")+'</div></div>','<div class="segments">'+toggle+'</div>');
 } else if(tab===3){
  const deadlines=current.filter(e=>doneFor[e.k] && pending(e));
  const list = rows=>rows.length?table(["Date / 日付","Application / 出願","Deadline / 締切","Verification / 確認",""],rows.map(e=>[esc(e.date),title(e.r),esc(e.label),status(e.status),edit(e.r)])):empty("No open deadlines with dates in this view.");
  body=panel("Next 30 days / 直近30日",list(deadlines.filter(e=>daysAway(e.date)>=0 && daysAway(e.date)<=30)))+panel("Later deadlines / 今後の締切",list(deadlines.filter(e=>daysAway(e.date)>30)))+panel("Past open deadlines / 期限経過",list(deadlines.filter(e=>daysAway(e.date)<0)));
 } else {
  body=visible.length?visible.map(r=>panel(esc(schoolName(r)), '<p class="muted">'+esc(r.program||"Undecided / 未定")+' · '+esc(routes[r.route])+'</p><h3 class="group">Documents & submission / 書類・提出</h3>'+checkList(r,checks.slice(0,4))+'<h3 class="group">Payments / 支払い</h3>'+checkList(r,checks.slice(4))+ '<p class="muted">Check the official guidelines for which tasks apply.</p>',edit(r))).join(""):no;
 }
 if(tab===2||tab===3){
  body+=panel("Same-day conflicts / 日程の重複",conflicts.length?table(["Date","Type","Events"],conflicts.map(c=>[esc(c.date),c.exam?"Exam overlap / 試験重複":"Same-day workload / 同日締切・試験",c.on.map(e=>esc(schoolName(e.r)+" · "+(e.r.program||routes[e.r.route])+" · "+e.label)+(e.status===1?"":" · 未確認")).join("<br>")])):empty("No conflicts among dated items in this view."));
 }
 $("view").innerHTML=body;
}
function checkList(r,list){
 return '<div class="checks">'+list.map(([k,l])=>'<label><input type="checkbox" data-check="'+k+'" data-record="'+esc(r.id)+'" '+(r.checks[k]?"checked":"")+'>'+esc(l)+'</label>').join("")+'</div>';
}
const dialog=$("editor");
const field = (label,name,value="",type="text",extra="") => '<label class="field">'+label+'<input type="'+type+'" name="'+name+'" value="'+esc(value)+'" '+extra+'></label>';
const select = (label,name,items,value) => '<label class="field">'+label+'<select name="'+name+'">'+options(items,value)+'</select></label>';
const textarea=(label,name,value)=>'<label class="field">'+label+'<textarea name="'+name+'">'+esc(value)+'</textarea></label>';
const statusOptions=statuses.map((s,i)=>[i,s]);
function openRecord(r) {
 editing=r;
 const details=r??{school:0,route:0,facts:{},checks:{}};
 $("remove").hidden=!r;
 const top=select("University / 大学","school",schools.map((s,i)=>[i,s[0]+" / "+s[1]]),details.school)
 +field("Faculty or program / 学部・学科","program",details.program)
 +select("Admission route / 入試方式","route",routes.map((s,i)=>[i,s]),details.route)
 +field("Route details or intake / 方式の詳細・入学時期","variant",details.variant)
 +field("Official admissions page / 入試情報","source",details.source,"url")
 +field("Official faculty-specific guidelines / 学部別募集要項","guide",details.guide,"url")
 +select("Record verification / 確認状況","status",statusOptions,details.status??0)
 +field("Record last checked / 最終確認日","checked",details.checked,"date")
 +textarea("Notes / メモ","notes",details.notes);
 const items = entries=>'<div class="grid">'+entries.map(([k,label,type])=>{
  const f=details.facts[k]??{};
  return '<div class="item">'+(type==="text"?textarea(label,k,f.value):field(label,k,f.value,type,type==="number"?'min="0" step="1"':""))
   +'<div class="grid">'+select("Verification / 確認",k+"Status",statusOptions,f.status??0)+field("Last checked / 最終確認日",k+"Checked",f.checked,"date")+'</div>'
   +field("Source URL / 公式資料",k+"Source",f.source,"url")+field("Notes / メモ",k+"Note",f.note)+'</div>';
 }).join("")+'</div>';
 $("fields").innerHTML='<div class="grid">'+top+'</div><h3 class="group">Dates / 日程</h3><p class="muted">Enter Japan dates. Use notes for cutoff times, arrival versus postmark, or route-specific conditions.</p>'+items(facts.filter(f=>f[2]==="date"))+'<h3 class="group">Costs and options / 費用・制度</h3>'+items(facts.filter(f=>f[2]!=="date"));
 dialog.showModal();
 dialog.scrollTop=0;
}
$("form").addEventListener("submit",e=>{
 e.preventDefault();
 const data=new FormData(e.currentTarget);
 const get=k=>String(data.get(k)??"").trim();
 const record={id:editing?.id??crypto.randomUUID(),school:Number(get("school")),program:get("program"),route:Number(get("route")),variant:get("variant"),source:get("source")||schools[Number(get("school"))][2],guide:get("guide"),status:Number(get("status")),checked:get("checked"),notes:get("notes"),checks:editing?.checks??{},facts:{}};
 if(record.status===1 && (!url(record.guide)||!record.checked)){
  notify("For record confirmation, add the official faculty guidelines and last checked date."); return;
 }
 for(const [k,label] of facts){
  const fact={value:get(k),status:Number(get(k+"Status")),checked:get(k+"Checked"),source:get(k+"Source"),note:get(k+"Note")};
  if(fact.status===1 && (!fact.value || !fact.checked || !(url(fact.source)||url(record.guide)))){
   notify("To confirm "+label.split(" / ")[0]+", enter a value, checked date, and official source."); return;
  }
  record.facts[k]=fact;
 }
 const next=editing?records.map(r=>r.id===record.id?record:r):[...records,record];
 if(save(next)){
  if(scope[1]!==null&&!records.some(r=>r.program===scope[1])) scope[1]=null;
  dialog.close(); render(); notify("Application saved / 保存しました");
 }
});
$("add").onclick=()=>openRecord(null);
$("close").onclick=()=>dialog.close();
$("remove").onclick=()=>{
 if(editing && confirm("Delete this application record and its checklist? / この出願情報を削除しますか？")){
  if(save(records.filter(r=>r.id!==editing.id))){
   if(scope[1]!==null&&!records.some(r=>r.program===scope[1])) scope[1]=null;
   dialog.close(); render(); notify("Record deleted");
  }
 }
};
document.addEventListener("click",e=>{
 const b=e.target.closest("button");
 if(!b) return;
 if(b.dataset.edit) openRecord(records.find(r=>r.id===b.dataset.edit));
 if(b.dataset.tab!==undefined){tab=Number(b.dataset.tab);render();$("nav").querySelector('[aria-current="true"]').focus();}
 if(b.dataset.month!==undefined){month=Number(b.dataset.month);render();$("view").querySelector('[aria-pressed="true"]').focus();}
 if(b.id==="reset"){scope=[null,null,null];render();}
});
document.addEventListener("change",e=>{
 const {dataset,value,checked}=e.target;
 if(dataset.filter!==undefined){
  scope[Number(dataset.filter)]=value==="*"?null:value;
  render();
  $("filters").querySelector('[data-filter="'+dataset.filter+'"]').focus();
 }
 if(dataset.check){
  const next=records.map(r=>r.id===dataset.record?{...r,checks:{...r.checks,[dataset.check]:checked}}:r);
  if(save(next)) notify("Checklist saved / 保存しました"); else e.target.checked=!checked;
 }
});
$("form").addEventListener("change",e=>{
 if(e.target.name!=="school") return;
 const inputs=e.currentTarget.elements;
 if(!inputs.source.value || schools.some(s=>s[2]===inputs.source.value)) inputs.source.value=schools[Number(e.target.value)][2];
});
render();
