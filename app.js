const ui={tabs:document.querySelectorAll('.tabs button'),sections:document.querySelectorAll('.tab'),currentBalance:document.getElementById('currentBalance'),monthSummary:document.getElementById('monthSummary'),projection:document.getElementById('projection'),entry:{type:document.getElementById('entryType'),amount:document.getElementById('entryAmount'),merchant:document.getElementById('entryMerchant'),category:document.getElementById('entryCategory'),date:document.getElementById('entryDate'),recurrence:document.getElementById('entryRecurrence'),addBtn:document.getElementById('addEntryBtn'),grid:document.getElementById('ledgerGrid'),filterMonth:document.getElementById('filterMonth'),invoiceTotal:document.getElementById('invoiceTotal'),invoicePaid:document.getElementById('invoicePaid'),paid:document.getElementById('entryPaid')},card:{merchant:document.getElementById('cardMerchant'),amount:document.getElementById('cardAmount'),category:document.getElementById('cardCategory'),date:document.getElementById('cardDate'),debitDate:document.getElementById('cardDebitDate'),addBtn:document.getElementById('addCardBtn'),grid:document.getElementById('cardGrid'),month:document.getElementById('cardMonth'),closingDay:document.getElementById('closingDay'),statementTotal:document.getElementById('statementTotal')},budget:{category:document.getElementById('budgetCategory'),planned:document.getElementById('budgetPlanned'),addBtn:document.getElementById('addBudgetBtn'),month:document.getElementById('budgetMonth'),grid:document.getElementById('budgetGrid')},invest:{subtabs:document.querySelectorAll('#investments .subtabs button'),subsections:document.querySelectorAll('#investments .subtab'),assetType:document.getElementById('invAssetType'),assetTicker:document.getElementById('invAssetTicker'),addAssetBtn:document.getElementById('invAddAssetBtn'),assetsGrid:document.getElementById('invAssetsGrid'),opType:document.getElementById('invOpType'),opAsset:document.getElementById('invOpAsset'),opDate:document.getElementById('invOpDate'),opQty:document.getElementById('invOpQty'),opPrice:document.getElementById('invOpPrice'),addOpBtn:document.getElementById('invAddOpBtn'),opsGrid:document.getElementById('invOpsGrid'),returnsGrid:document.getElementById('invReturnsGrid'),returnsChart:document.getElementById('invReturnsChart'),returnsFiisGrid:document.getElementById('invReturnsFiisGrid'),returnsFiisChart:document.getElementById('invReturnsFiisChart'),returnsDetailsGrid:document.getElementById('invReturnsDetailsGrid'),stocksBudget:document.getElementById('invStocksBudget'),stocksPlanGrid:document.getElementById('invStocksPlanGrid'),stocksDonut:document.getElementById('invStocksDonut'),fiisBudget:document.getElementById('invFiisBudget'),fiisPlanGrid:document.getElementById('invFiisPlanGrid'),fiisDonut:document.getElementById('invFiisDonut')},lock:{overlay:document.getElementById('lock'),password:document.getElementById('password'),unlockBtn:document.getElementById('unlockBtn'),setupBtn:document.getElementById('setupBtn'),newPassword:document.getElementById('newPassword')},io:{exportBtn:document.getElementById('exportBtn'),importInput:document.getElementById('importInput'),exportEncBtn:document.getElementById('exportEncBtn'),importEncInput:document.getElementById('importEncInput')},themeToggle:document.getElementById('themeToggle')}
ui.lock.setupConfirmBtn=document.getElementById('setupConfirmBtn')
const state={key:null,db:null}
const emptyDb=()=>({settings:{cardClosingDay:5,currency:'BRL'},transactions:[],cardEntries:[],budgets:{},paidMap:{},cardStatementsPaid:{},invest:{assets:[],ops:[]}})
function fmt(n){const v=Number(n)||0;return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function ym(d){const dt=d instanceof Date?d:new Date(d);return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,'0')}
function fmtDate(d){const dt=new Date(d.getFullYear?d:Date.parse(d));const y=dt.getFullYear();const m=String(dt.getMonth()+1).padStart(2,'0');const da=String(dt.getDate()).padStart(2,'0');return `${y}-${m}-${da}`}
function monthLabelStr(ymStr){const m=parseInt(ymStr.slice(5),10)-1;const abbr=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][m]||ymStr.slice(5);return `${abbr}/${ymStr.slice(2,4)}`}
function addMonths(d,n){const dt=new Date(d);dt.setMonth(dt.getMonth()+n);return dt}
function withinMonth(date,month){return ym(date)===month}
async function deriveKey(pass){const enc=new TextEncoder().encode(pass);const h=await crypto.subtle.digest('SHA-256',enc);return crypto.subtle.importKey('raw',h,{name:'AES-GCM'},false,['encrypt','decrypt'])}
async function save(){const iv=crypto.getRandomValues(new Uint8Array(12));const data=new TextEncoder().encode(JSON.stringify(state.db));const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},state.key,data);const blob=new Uint8Array(ct);const b64=btoa(String.fromCharCode(...iv)+String.fromCharCode(...blob));localStorage.setItem('money.enc',b64)}
async function load(pass){state.key=await deriveKey(pass);const b64=localStorage.getItem('money.enc');if(!b64){state.db=emptyDb();await save();return true}try{const raw=atob(b64);const iv=new Uint8Array([...raw.slice(0,12)].map(c=>c.charCodeAt(0)));const ct=new Uint8Array([...raw.slice(12)].map(c=>c.charCodeAt(0)));const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv},state.key,ct);const txt=new TextDecoder().decode(pt);state.db=JSON.parse(txt);if(!state.db.invest)state.db.invest={assets:[],ops:[]};return true}catch(e){return false}}
function switchTab(id){ui.sections.forEach(s=>s.classList.toggle('active',s.id===id));ui.tabs.forEach(b=>b.classList.toggle('active',b.dataset.tab===id))}
function addTransaction(){const t={id:crypto.randomUUID(),type:ui.entry.type.value,amount:Number(ui.entry.amount.value||0),merchant:(ui.entry.merchant.value||'').trim(),category:(ui.entry.category.value||'').trim(),date:ui.entry.date.value,recurrence:{freq:ui.entry.recurrence.value,end:null},paid:ui.entry.paid.checked};if(!t.date||!t.category||!t.amount)return;state.db.transactions.push(t);save().then(()=>{ui.entry.amount.value='';ui.entry.category.value='';ui.entry.merchant.value='';ui.entry.paid.checked=false;renderAll()})}
function addCardEntry(){const e={id:crypto.randomUUID(),merchant:(ui.card.merchant.value||'').trim(),amount:Number(ui.card.amount.value||0),category:(ui.card.category.value||'').trim(),date:ui.card.date.value,debitDate:ui.card.debitDate.value,paid:true};if(!e.date||!e.debitDate||!e.category||!e.amount)return;state.db.cardEntries.push(e);save().then(()=>{ui.card.amount.value='';ui.card.merchant.value='';ui.card.debitDate.value='';renderAll()})}
function upsertBudget(){const c=(ui.budget.category.value||'').trim();const p=Number(ui.budget.planned.value||0);if(!c)return;state.db.budgets[c]={planned:p};save().then(()=>renderBudget())}
function generateInstances(t,fromMonth,count){const res=[];if(t.recurrence?.freq==='none'){if(withinMonth(t.date,fromMonth))res.push(t);return res}let start=new Date(t.date);let end=t.recurrence?.end?new Date(t.recurrence.end):null;for(let i=0;i<count;i++){const targetMonth=new Date(fromMonth+'-01');targetMonth.setMonth(targetMonth.getMonth()+i);let d=new Date(start);const targetYm=ym(targetMonth);while(true){if(end&&d>end)break;const dYm=ym(d);if(dYm===targetYm){const dateStr=fmtDate(d);const key=t.id+"|"+dateStr;const paid=!!state.db.paidMap[key];res.push({...t,date:dateStr,paid});break}if(dYm>targetYm)break;switch(t.recurrence.freq){case 'monthly':d=addMonths(d,1);break;case 'weekly':d=new Date(d);d.setDate(d.getDate()+7);break;case 'yearly':d=new Date(d);d.setFullYear(d.getFullYear()+1);break}}}
return res}
function monthLedger(month){const base=state.db.transactions.flatMap(t=>generateInstances(t,month,1));const closing=Number(ui.card.closingDay.value||state.db.settings.cardClosingDay);const cardTotal=statementTotalForMonth(month,closing);return {items:base,invoice:cardTotal}}
function statementTotalForMonth(month,closing){const start=new Date(month+'-01');const startWindow=new Date(start);startWindow.setDate(closing+1);const endWindow=new Date(start);endWindow.setMonth(endWindow.getMonth()+1);endWindow.setDate(closing);const items=state.db.cardEntries.filter(e=>{if(e.debitDate){return ym(e.debitDate)===month}const d=new Date(e.date);return d>=startWindow&&d<=endWindow});const total=items.reduce((s,i)=>s+i.amount,0);return {total,items}}
function currentBalanceNow(){const todayYm=ym(new Date());const tx=state.db.transactions.flatMap(t=>{if(t.recurrence?.freq==='none'){return withinMonth(t.date,todayYm)&&t.paid?[t]:[]}return generateInstances(t,todayYm,1).filter(i=>i.paid)});const base=tx.reduce((s,t)=>s+(t.type==='income'?t.amount:-t.amount),0);const inv=statementTotalForMonth(todayYm,state.db.settings.cardClosingDay);const invPaid=state.db.cardStatementsPaid[todayYm]?inv.total:0;return base-invPaid}
function projectionSeriesDetailed(n=12){const start=ym(new Date());const series=[];let cumInc=0,cumExp=0;for(let i=0;i<n;i++){const m=new Date(start+'-01');m.setMonth(m.getMonth()+i);const monthStr=ym(m);const ledger=monthLedger(monthStr);const inc=ledger.items.filter(i=>i.type==='income').reduce((s,i)=>s+i.amount,0);const exp=ledger.items.filter(i=>i.type==='expense').reduce((s,i)=>s+i.amount,0)+ledger.invoice.total;cumInc+=inc;cumExp+=exp;const netCum=cumInc-cumExp;series.push({month:monthStr,cumIncome:cumInc,cumExpense:cumExp,netCum})}return series}
function renderDashboard(){ui.currentBalance.textContent=fmt(currentBalanceNow());const thisMonth=ym(new Date());const led=monthLedger(thisMonth);const incomes=led.items.filter(i=>i.type==='income').reduce((s,i)=>s+i.amount,0);const expenses=led.items.filter(i=>i.type==='expense').reduce((s,i)=>s+i.amount,0)+led.invoice.total;ui.monthSummary.innerHTML=`Rendimentos ${fmt(incomes)} · Despesas ${fmt(expenses)} · Fatura ${fmt(led.invoice.total)}`;const series=projectionSeriesDetailed(12);drawProjectionChart('projChart',series);ui.projection.innerHTML='';const totalsReal=realTotalsForMonth(thisMonth);drawCategoryChart('catChart',totalsReal)}
function renderLedger(){const month=ui.entry.filterMonth.value||ym(new Date());ui.entry.filterMonth.value=month;const led=monthLedger(month);ui.entry.invoiceTotal.textContent=fmt(led.invoice.total);ui.entry.invoicePaid.checked=!!state.db.cardStatementsPaid[month];const tbody=ui.entry.grid.querySelector('tbody');tbody.innerHTML='';led.items.sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(row=>{const tr=document.createElement('tr');const paid=row.recurrence?.freq==='none'?!!row.paid:!!state.db.paidMap[row.id+'|'+row.date];tr.innerHTML=`<td>${row.date}</td><td>${row.type==='income'?'Rendimento':'Despesa'}</td><td>${row.merchant||'-'}</td><td>${row.category}</td><td>${fmt(row.amount)}</td><td>${row.recurrence?.freq||'none'}</td><td><input type="checkbox" ${paid?'checked':''}></td><td><button class="edit" data-id="${row.id}">Editar</button> <button class="del" data-id="${row.id}">Excluir</button></td>`;const chk=tr.querySelector('input[type="checkbox"]');chk.onchange=()=>{if(row.recurrence?.freq==='none'){const t=state.db.transactions.find(t=>t.id===row.id);if(t){t.paid=chk.checked}}else{const key=row.id+'|'+row.date;state.db.paidMap[key]=chk.checked}save().then(()=>renderDashboard())};tr.querySelector('.del').onclick=()=>{state.db.transactions=state.db.transactions.filter(t=>t.id!==row.id);save().then(()=>renderLedger())};tr.querySelector('.edit').onclick=()=>{const disableDate=row.recurrence?.freq!=='none';tr.innerHTML=`<td>${disableDate?row.date:`<input type="date" value="${row.date}">`}</td><td><select><option value="income" ${row.type==='income'?'selected':''}>Rendimento</option><option value="expense" ${row.type==='expense'?'selected':''}>Despesa</option></select></td><td><input type="text" value="${row.merchant||''}" list="merchantsList"></td><td><input type="text" value="${row.category}" list="categoriesList"></td><td><input type="number" step="0.01" value="${row.amount}"></td><td>${row.recurrence?.freq||'none'}</td><td>${paid?'<input type="checkbox" checked disabled>':'<input type="checkbox" disabled>'}</td><td><button class="save">Salvar</button> <button class="cancel">Cancelar</button></td>`;const saveBtn=tr.querySelector('.save');const cancelBtn=tr.querySelector('.cancel');cancelBtn.onclick=()=>renderLedger();saveBtn.onclick=()=>{const inputs=tr.querySelectorAll('input,select');const newDate=disableDate?row.date:inputs[0].value;const newType=inputs[1].value;const newMerchant=inputs[2].value.trim();const newCategory=inputs[3].value.trim();const newAmount=Number(inputs[4].value||0);const t=state.db.transactions.find(t=>t.id===row.id);if(t){t.date=newDate;t.type=newType;t.merchant=newMerchant;t.category=newCategory;t.amount=newAmount}save().then(()=>{renderLedger();renderBudget();refreshSuggestions()})}};tbody.appendChild(tr)})}
function renderCard(){const month=ui.card.month.value||ym(new Date());ui.card.month.value=month;ui.card.closingDay.value=ui.card.closingDay.value||state.db.settings.cardClosingDay;const inv=statementTotalForMonth(month,Number(ui.card.closingDay.value));ui.card.statementTotal.textContent=fmt(inv.total);const tbody=ui.card.grid.querySelector('tbody');tbody.innerHTML='';inv.items.sort((a,b)=>new Date(a.debitDate||a.date)-new Date(b.debitDate||b.date)).forEach(row=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${row.date}</td><td>${row.merchant}</td><td>${row.category}</td><td>${fmt(row.amount)}</td><td>${row.debitDate||'-'}</td><td><input type="checkbox" checked disabled></td><td><button class="edit" data-id="${row.id}">Editar</button> <button class="del" data-id="${row.id}">Excluir</button></td>`;tr.querySelector('.del').onclick=()=>{state.db.cardEntries=state.db.cardEntries.filter(t=>t.id!==row.id);save().then(()=>{renderCard();renderLedger();renderBudget()})};tr.querySelector('.edit').onclick=()=>{tr.innerHTML=`<td><input type="date" value="${row.date}"></td><td><input type="text" value="${row.merchant}" list="merchantsList"></td><td><input type="text" value="${row.category}" list="categoriesList"></td><td><input type="number" step="0.01" value="${row.amount}"></td><td><input type="date" value="${row.debitDate||''}"></td><td><input type="checkbox" checked disabled></td><td><button class="save">Salvar</button> <button class="cancel">Cancelar</button></td>`;const saveBtn=tr.querySelector('.save');const cancelBtn=tr.querySelector('.cancel');cancelBtn.onclick=()=>renderCard();saveBtn.onclick=()=>{const inputs=tr.querySelectorAll('input');const newDate=inputs[0].value;const newMerchant=inputs[1].value.trim();const newCategory=inputs[2].value.trim();const newAmount=Number(inputs[3].value||0);const newDebitDate=inputs[4].value;const e=state.db.cardEntries.find(t=>t.id===row.id);if(e){e.date=newDate;e.merchant=newMerchant;e.category=newCategory;e.amount=newAmount;e.debitDate=newDebitDate}save().then(()=>{renderCard();renderLedger();renderBudget();refreshSuggestions()})}};tbody.appendChild(tr)})}
function renderBudget(){const month=ui.budget.month.value||ym(new Date());ui.budget.month.value=month;const totals=realTotalsForMonth(month);const tbody=ui.budget.grid.querySelector('tbody');tbody.innerHTML='';const cats=new Set([...Object.keys(state.db.budgets),...Object.keys(totals)]);[...cats].sort().forEach(c=>{const planned=state.db.budgets[c]?.planned||0;const real=-(totals[c]||0);const saldo=planned-real;const cls=saldo>=0?'ok':'bad';const tr=document.createElement('tr');const hasBudget=!!state.db.budgets[c];tr.innerHTML=`<td>${c}</td><td>${fmt(planned)}</td><td>${fmt(real)}</td><td class="${cls}">${fmt(saldo)}</td><td>${hasBudget?'<button class="edit">Editar</button> <button class="del">Excluir</button>':''}</td>`;if(hasBudget){tr.querySelector('.del').onclick=()=>{delete state.db.budgets[c];save().then(()=>{renderBudget();refreshSuggestions()})};tr.querySelector('.edit').onclick=()=>{tr.innerHTML=`<td>${c}</td><td><input type="number" step="0.01" value="${planned}"></td><td>${fmt(real)}</td><td class="${cls}">${fmt(saldo)}</td><td><button class="save">Salvar</button> <button class="cancel">Cancelar</button></td>`;tr.querySelector('.cancel').onclick=()=>renderBudget();tr.querySelector('.save').onclick=()=>{const newPlanned=Number(tr.querySelector('input').value||0);state.db.budgets[c]={planned:newPlanned};save().then(()=>{renderBudget();refreshSuggestions()})}}}tbody.appendChild(tr)})}
function realTotalsForMonth(month){const totals={};state.db.transactions.forEach(t=>{if(t.recurrence?.freq==='none'){if(withinMonth(t.date,month)&&t.type==='expense'){totals[t.category]=(totals[t.category]||0)-t.amount}}else{generateInstances(t,month,1).forEach(i=>{if(i.type==='expense'){totals[i.category]=(totals[i.category]||0)-i.amount}})} });const inv=statementTotalForMonth(month,Number(ui.card.closingDay.value||state.db.settings.cardClosingDay));inv.items.forEach(i=>{totals[i.category]=(totals[i.category]||0)-i.amount});return totals}
function renderAll(){renderDashboard();renderLedger();renderCard();renderBudget();refreshSuggestions();refreshAssetsList();renderInvAssets();renderInvOps();renderInvReturns();renderInvFiisReturns();renderInvReturnsDetails();renderInvStocksPlan();renderInvFiisPlan()}
ui.tabs.forEach(b=>b.onclick=()=>{switchTab(b.dataset.tab);renderAll()});
function applyTheme(t){document.documentElement.setAttribute('data-theme',t);localStorage.setItem('theme',t);if(ui.themeToggle){ui.themeToggle.textContent=t==='dark'?'☀️':'🌙'}}
applyTheme(localStorage.getItem('theme')||'dark');
if(ui.themeToggle){ui.themeToggle.onclick=()=>{const t=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';applyTheme(t)}}
ui.entry.addBtn.onclick=addTransaction
ui.entry.filterMonth.onchange=renderLedger
ui.entry.invoicePaid.onchange=()=>{const month=ui.entry.filterMonth.value||ym(new Date());state.db.cardStatementsPaid[month]=ui.entry.invoicePaid.checked;save().then(()=>{renderDashboard();renderBudget()})}
ui.card.addBtn.onclick=addCardEntry
ui.card.month.onchange=renderCard
ui.card.closingDay.onchange=()=>{state.db.settings.cardClosingDay=Number(ui.card.closingDay.value||5);save().then(()=>{renderCard();renderLedger();renderBudget()})}
ui.budget.addBtn.onclick=upsertBudget
ui.budget.month.onchange=renderBudget
ui.entry.merchant.oninput=ui.entry.merchant.onchange=()=>{const m=(ui.entry.merchant.value||'').trim();const cat=guessCategoryForMerchant(m);if(cat)ui.entry.category.value=cat}
ui.card.merchant.oninput=ui.card.merchant.onchange=()=>{const m=(ui.card.merchant.value||'').trim();const cat=guessCategoryForMerchant(m);if(cat)ui.card.category.value=cat}
ui.invest.subtabs.forEach(b=>b.onclick=()=>{ui.invest.subsections.forEach(s=>s.classList.toggle('active',s.id===b.dataset.subtab));ui.invest.subtabs.forEach(x=>x.classList.toggle('active',x===b))})
ui.invest.subtabs.forEach(b=>b.addEventListener('click',()=>{
  const id=b.dataset.subtab;
  if(id==='inv-assets') renderInvAssets();
  else if(id==='inv-ops') renderInvOps();
  else if(id==='inv-returns') renderInvReturns();
  else if(id==='inv-returns-fiis') renderInvFiisReturns();
  else if(id==='inv-returns-details') renderInvReturnsDetails();
  else if(id==='inv-stocks') renderInvStocksPlan();
  else if(id==='inv-fiis') renderInvFiisPlan();
}));
ui.invest.addAssetBtn.onclick=addAsset;
ui.invest.addOpBtn.onclick=addOp;
ui.invest.stocksBudget.oninput=renderInvStocksPlan;
ui.invest.fiisBudget.oninput=renderInvFiisPlan;
function renderInvFiisReturns(){const tbody=ui.invest.returnsFiisGrid.querySelector('tbody');tbody.innerHTML='';const assets=state.db.invest.assets.filter(a=>a.type==='fii');const ops=state.db.invest.ops;let totalBuy=0,totalSell=0;assets.forEach(a=>{const buys=ops.filter(o=>o.assetId===a.id&&o.type==='compra');const sells=ops.filter(o=>o.assetId===a.id&&o.type==='venda');const qtyHold=buys.reduce((s,o)=>s+o.qty,0)-sells.reduce((s,o)=>s+o.qty,0);const buy=buys.reduce((s,o)=>s+o.qty*o.price,0);const sell=qtyHold*(a.price||0);const tirR=sell-buy;const tirP=buy>0?(tirR/buy*100):0;totalBuy+=buy;totalSell+=sell;const tr=document.createElement('tr');tr.innerHTML=`<td>${a.ticker}</td><td>${fmt(buy)}</td><td>${fmt(sell)}</td><td>${fmt(tirR)}</td><td>${tirP.toFixed(2)}%</td>`;tbody.appendChild(tr)});const tr=document.createElement('tr');const totR=totalSell-totalBuy;const totP=totalBuy>0?(totR/totalBuy*100):0;tr.innerHTML=`<td>Total</td><td>${fmt(totalBuy)}</td><td>${fmt(totalSell)}</td><td>${fmt(totR)}</td><td>${totP.toFixed(2)}%</td>`;tbody.appendChild(tr);const series=assets.map(a=>{const buys=ops.filter(o=>o.assetId===a.id&&o.type==='compra');const sells=ops.filter(o=>o.assetId===a.id&&o.type==='venda');const qtyHold=buys.reduce((s,o)=>s+o.qty,0)-sells.reduce((s,o)=>s+o.qty,0);const buy=buys.reduce((s,o)=>s+o.qty*o.price,0);const sell=qtyHold*(a.price||0);const tirR=sell-buy;const tirP=buy>0?(tirR/buy*100):0;return {label:a.ticker,net:tirP}});drawSimpleBar('invReturnsFiisChart',series)}
ui.lock.unlockBtn.onclick=async()=>{const ok=await load(ui.lock.password.value);if(ok){ui.lock.overlay.style.display='none';renderAll()}else{ui.lock.password.value=''} }
ui.lock.setupBtn.onclick=()=>{ui.lock.newPassword.style.display='block';ui.lock.setupConfirmBtn.style.display='inline-block'}
ui.lock.setupConfirmBtn.onclick=async()=>{const pass=ui.lock.newPassword.value;if(!pass)return;state.key=await deriveKey(pass);if(!state.db)state.db=emptyDb();await save();ui.lock.overlay.style.display='none';renderAll()}
ui.io.exportBtn.onclick=()=>{const blob=new Blob([JSON.stringify(state.db)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='money-data.json';a.click();URL.revokeObjectURL(a.href)}
ui.io.importInput.onchange=e=>{const f=e.target.files?.[0];if(!f)return;f.text().then(txt=>{try{const j=JSON.parse(txt);if(!j.invest)j.invest={assets:[],ops:[]};state.db=j;save().then(()=>renderAll())}catch{}})}
ui.io.exportEncBtn.onclick=()=>{const b64=localStorage.getItem('money.enc')||'';const blob=new Blob([b64],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='money-data.enc';a.click();URL.revokeObjectURL(a.href)}
ui.io.importEncInput.onchange=e=>{const f=e.target.files?.[0];if(!f)return;f.text().then(async txt=>{localStorage.setItem('money.enc',txt.trim());const ok=await load(ui.lock.password.value||'');if(ok){renderAll()}})}

function drawProjectionChart(canvasId,series){const c=document.getElementById(canvasId);if(!c)return;const w=c.width=Math.floor(c.clientWidth||c.offsetWidth||300);const h=c.height=Math.floor((c.clientHeight||parseInt(getComputedStyle(c).height)||160));const ctx=c.getContext('2d');ctx.clearRect(0,0,w,h);if(!series||!series.length)return;const margin=28;const baseY=Math.floor(h*0.65);const cellW=Math.floor((w-margin*2)/series.length);const innerGap=8;const barW=Math.max(10,Math.floor(cellW*0.32));const max=Math.max(...series.flatMap(s=>[Math.abs(s.cumIncome),Math.abs(s.cumExpense)]))||1;ctx.strokeStyle='#233044';ctx.beginPath();ctx.moveTo(margin,baseY);ctx.lineTo(w-margin,baseY);ctx.stroke();ctx.font='12px Inter';ctx.textAlign='center';for(let i=0;i<series.length;i++){const s=series[i];const mLabel=monthLabelStr(s.month);const cellX=margin+i*cellW;const centerX=cellX+cellW/2;const incBh=(Math.abs(s.cumIncome)/max)*(h*0.45-20);const expBh=(Math.abs(s.cumExpense)/max)*(h*0.45-20);const incX=centerX-barW-innerGap/2;const expX=centerX+innerGap/2;ctx.fillStyle='#22d3ee';ctx.fillRect(incX,baseY-incBh,barW,incBh);ctx.fillStyle='#ef4444';ctx.fillRect(expX,baseY-expBh,barW,expBh);ctx.fillStyle='#9ca3af';ctx.fillText(mLabel,centerX,baseY+14);const netColor=(s.netCum>=0)?'#22d3ee':'#ef4444';ctx.fillStyle=netColor;ctx.fillText(fmt(s.netCum),centerX,baseY+28);} }
function drawCategoryChart(canvasId,totals){const c=document.getElementById(canvasId);if(!c)return;const w=c.width=Math.floor(c.clientWidth||c.offsetWidth||300);const h=c.height=Math.floor((c.clientHeight||parseInt(getComputedStyle(c).height)||160));const ctx=c.getContext('2d');ctx.clearRect(0,0,w,h);const entries=Object.entries(totals||{});if(!entries.length)return;const items=entries.filter(([k,v])=>v<0).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,8);if(!items.length)return;const margin=24;const barH=Math.max(12,Math.floor((h-margin*2)/items.length)-6);const max=Math.max(...items.map(i=>Math.abs(i[1])))||1;for(let i=0;i<items.length;i++){const [cat,val]=items[i];const x=margin;const y=margin+i*(barH+6);const bw=(Math.abs(val)/max)*(w-margin*2);ctx.fillStyle='#ef4444';ctx.fillRect(x,y,bw,barH);ctx.fillStyle='#e5e7eb';ctx.font='12px Inter';ctx.fillText(`${cat} ${fmt(-val)}`,x+6,y+barH-4)}}
function drawDonut(canvasId,pairs){const c=document.getElementById(canvasId);if(!c||!pairs.length)return;const w=c.width=Math.floor(c.clientWidth||300);const h=c.height=Math.floor(c.clientHeight||140);const ctx=c.getContext('2d');ctx.clearRect(0,0,w,h);const r=Math.min(w,h)/2-18;const sum=pairs.reduce((s,p)=>s+p.v,0)||1;let start=0;const cx=w/2,cy=h/2;const cols=['#22d3ee','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6'];const labels=[];pairs.forEach((p,i)=>{const ang=(p.v/sum)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,start+ang);ctx.closePath();ctx.fillStyle=cols[i%cols.length];ctx.fill();const mid=start+ang/2;labels.push({text:p.name,x:cx+Math.cos(mid)*r*0.85,y:cy+Math.sin(mid)*r*0.85,color:'#e5e7eb'});start+=ang});ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(cx,cy,r*0.6,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';ctx.font='12px Inter';ctx.textAlign='center';labels.forEach(l=>{ctx.fillStyle=l.color;ctx.fillText(l.text,l.x,l.y)})}
async function addAsset(){
  const t=ui.invest.assetType.value;
  const k=(ui.invest.assetTicker.value||'').trim();
  if(!k) return;
  let price=0;
  try{price=await fetchPriceForTicker(k,t)}catch{price=0}
  if(price<=0){
    const m=prompt("Não foi possível buscar o preço. Informe o preço atual (R$):");
    const v=Number(m||0);
    if(v>0) price=v;
  }
  if(!state.db.invest) state.db.invest={assets:[],ops:[]};
  state.db.invest.assets.push({id:crypto.randomUUID(),type:t,ticker:k,price:price||0,avg:0});
  save().then(()=>{
    ui.invest.assetTicker.value='';
    renderInvAssets();
    refreshAssetsList();
    renderInvOps();
    renderInvStocksPlan();
    renderInvFiisPlan();
  })
}

let PRICE_SHEET_URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vQEHdKjpl7oydNH0e6O5HOuBrIYQbsDavNzWv6V8ex7h2Xef7SorWQx5l2WQP5-FSSOKZRiQ3226Yf4/pub?output=csv';
let priceCache={};
let priceCacheTs=0;
let cacheLoadPromise=null;

function normTicker(t){
  return String(t||'').trim().toUpperCase().replace(/\.SA$/,'');
}

async function loadPricesFromSheet(){
  console.log('🔄 Carregando preços via proxy CORS...');
  
  try{
    const proxyUrl='https://api.allorigins.win/raw?url='+encodeURIComponent(PRICE_SHEET_URL);
    console.log('🌐 URL:', proxyUrl);
    
    const res=await fetch(proxyUrl);
    
    if(!res.ok){
      console.error('❌ Erro HTTP:', res.status);
      return {};
    }
    
    const txt=await res.text();
    console.log('📄 CSV recebido:', txt.substring(0,200));
    
    const lines=txt.replace(/^\uFEFF/,'').split(/\r?\n/);
    const map={};
    
    for(let i=1;i<lines.length;i++){
      const line=lines[i].trim();
      if(!line) continue;
      
      const parts=line.split(',');
      if(parts.length<2) continue;
      
      const ticker=parts[0].replace(/"/g,'').trim();
      const priceStr=parts.slice(1).join(',').replace(/"/g,'').trim();
      
      const tk=normTicker(ticker);
      const pv=parseFloat(priceStr.replace(',','.'));
      
      if(tk&&isFinite(pv)&&pv>0){
        map[tk]=pv;
        console.log(`  ✓ ${tk}: R$ ${pv.toFixed(2)}`);
      }
    }
    
    console.log('✅ Preços carregados:', Object.keys(map).length);
    console.log('📦 Sample:', {
      MDIA3: map['MDIA3'],
      BBDC4: map['BBDC4'],
      ITSA4: map['ITSA4']
    });
    
    priceCache=map;
    priceCacheTs=Date.now();
    
    return map;
    
  }catch(e){
    console.error('❌ Erro ao carregar preços:', e);
    return {};
  }
}

async function fetchPriceForTicker(ticker,type){
  const now=Date.now();
  const cacheExpired=now-priceCacheTs>300000;
  const cacheEmpty=Object.keys(priceCache).length===0;
  
  if(cacheEmpty||cacheExpired){
    console.log('⏳ Aguardando cache...');
    
    if(!cacheLoadPromise){
      cacheLoadPromise=loadPricesFromSheet().finally(()=>{
        cacheLoadPromise=null;
      });
    }
    
    await cacheLoadPromise;
  }
  
  const normalized=normTicker(ticker);
  const price=priceCache[normalized]||0;
  
  console.log(`🔍 Buscando: ${ticker} → ${normalized} → R$ ${price}`);
  
  return price;
}

setTimeout(()=>{
  loadPricesFromSheet().then(()=>{
    console.log('✅ Cache inicial pronto!');
  });
},100);

function addOp(){const type=ui.invest.opType.value;const assetId=ui.invest.opAsset.value;const date=ui.invest.opDate.value;const qty=Number(ui.invest.opQty.value||0);const price=Number(ui.invest.opPrice.value||0);if(!assetId||!date||(type!=='provento'&&(qty<=0||price<=0)))return;state.db.invest.ops.push({id:crypto.randomUUID(),type,assetId,date,qty,price});save().then(()=>{ui.invest.opQty.value='';ui.invest.opPrice.value='';renderInvOps();renderInvReturns();renderInvStocksPlan();renderInvFiisPlan()})}
function refreshAssetsList(){const el=document.getElementById('assetsList');el.innerHTML=state.db.invest.assets.map(a=>`<option value="${a.ticker}"></option>`).join('');ui.invest.opAsset.innerHTML=state.db.invest.assets.map(a=>`<option value="${a.id}">${a.ticker}</option>`).join('')}
function holdingsByType(type){const res={};state.db.invest.assets.filter(a=>a.type===type).forEach(a=>res[a.id]={ticker:a.ticker,price:a.price,qty:0});state.db.invest.ops.forEach(op=>{const a=res[op.assetId];if(!a)return; if(op.type==='compra')a.qty+=op.qty; if(op.type==='venda')a.qty-=op.qty});return res}
function valueMap(type){const h=holdingsByType(type);Object.values(h).forEach(v=>v.val=(v.qty||0)*(v.price||0));return h}
function renderInvAssets(){const tbody=ui.invest.assetsGrid.querySelector('tbody');tbody.innerHTML='';const ops=state.db.invest.ops;state.db.invest.assets.forEach(a=>{const buys=ops.filter(o=>o.assetId===a.id&&o.type==='compra');const sumQty=buys.reduce((s,o)=>s+o.qty,0);const sumVal=buys.reduce((s,o)=>s+o.qty*o.price,0);const avgBuy=sumQty?sumVal/sumQty:0;const tr=document.createElement('tr');tr.innerHTML=`<td>${a.type}</td><td>${a.ticker}</td><td>${fmt(a.price)}</td><td>${fmt(avgBuy)}</td><td><button class="refresh">Atualizar preço</button> <button class="edit">Editar</button> <button class="del">Excluir</button></td>`;tr.querySelector('.refresh').onclick=async()=>{try{let p=await fetchPriceForTicker(a.ticker,a.type);if(p<=0){const m=prompt('Não foi possível buscar o preço. Informe o preço atual (R$):');const v=Number(m||0);if(v>0)p=v}a.price=p;save().then(()=>renderInvAssets())}catch{}};tr.querySelector('.del').onclick=()=>{state.db.invest.assets=state.db.invest.assets.filter(x=>x.id!==a.id);save().then(()=>{renderInvAssets();refreshAssetsList();renderInvOps();renderInvStocksPlan();renderInvFiisPlan()})};tr.querySelector('.edit').onclick=()=>{tr.innerHTML=`<td><select><option value="acao" ${a.type==='acao'?'selected':''}>Ação</option><option value="fii" ${a.type==='fii'?'selected':''}>FII</option><option value="usd" ${a.type==='usd'?'selected':''}>U$</option><option value="fi" ${a.type==='fi'?'selected':''}>FI</option><option value="fixa" ${a.type==='fixa'?'selected':''}>Fixa</option></select></td><td><input type="text" value="${a.ticker}"></td><td>${fmt(a.price)} <button class="refresh">Atualizar preço</button></td><td>${fmt(avgBuy)}</td><td><button class="save">Salvar</button> <button class="cancel">Cancelar</button></td>`;tr.querySelector('.cancel').onclick=()=>renderInvAssets();tr.querySelector('.refresh').onclick=async()=>{try{let p=await fetchPriceForTicker(a.ticker,a.type);if(p<=0){const m=prompt('Não foi possível buscar o preço. Informe o preço atual (R$):');const v=Number(m||0);if(v>0)p=v}a.price=p;save().then(()=>renderInvAssets())}catch{}};tr.querySelector('.save').onclick=()=>{const inputs=tr.querySelectorAll('input,select');a.type=inputs[0].value;a.ticker=inputs[1].value.trim();save().then(()=>{renderInvAssets();refreshAssetsList();renderInvOps();renderInvStocksPlan();renderInvFiisPlan()})}};tbody.appendChild(tr)} )}
function renderInvOps(){const tbody=ui.invest.opsGrid.querySelector('tbody');tbody.innerHTML='';const assetsById={};state.db.invest.assets.forEach(a=>assetsById[a.id]=a);state.db.invest.ops.slice().sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(op=>{const tr=document.createElement('tr');const total=(op.type==='provento')?op.price:(op.qty*op.price);tr.innerHTML=`<td>${op.type}</td><td>${assetsById[op.assetId]?.ticker||'-'}</td><td>${op.date}</td><td>${op.type==='provento'?'-':op.qty}</td><td>${fmt(op.price)}</td><td>${fmt(total)}</td><td><button class="del">Excluir</button></td>`;tr.querySelector('.del').onclick=()=>{state.db.invest.ops=state.db.invest.ops.filter(x=>x.id!==op.id);save().then(()=>{renderInvOps();renderInvReturns();renderInvStocksPlan();renderInvFiisPlan()})};tbody.appendChild(tr)})}
function renderInvReturns(){const tbody=ui.invest.returnsGrid.querySelector('tbody');tbody.innerHTML='';const assets=state.db.invest.assets.filter(a=>a.type==='acao');const ops=state.db.invest.ops;let totalBuy=0,totalSell=0;assets.forEach(a=>{const buys=ops.filter(o=>o.assetId===a.id&&o.type==='compra');const sells=ops.filter(o=>o.assetId===a.id&&o.type==='venda');const qtyHold=buys.reduce((s,o)=>s+o.qty,0)-sells.reduce((s,o)=>s+o.qty,0);const buy=buys.reduce((s,o)=>s+o.qty*o.price,0);const sell=qtyHold*(a.price||0);const tirR=sell-buy;const tirP=buy>0?(tirR/buy*100):0;totalBuy+=buy;totalSell+=sell;const tr=document.createElement('tr');tr.innerHTML=`<td>${a.ticker}</td><td>${fmt(buy)}</td><td>${fmt(sell)}</td><td>${fmt(tirR)}</td><td>${tirP.toFixed(2)}%</td>`;tbody.appendChild(tr)});const tr=document.createElement('tr');const totR=totalSell-totalBuy;const totP=totalBuy>0?(totR/totalBuy*100):0;tr.innerHTML=`<td>Total</td><td>${fmt(totalBuy)}</td><td>${fmt(totalSell)}</td><td>${fmt(totR)}</td><td>${totP.toFixed(2)}%</td>`;tbody.appendChild(tr);const series=assets.map(a=>{const buys=ops.filter(o=>o.assetId===a.id&&o.type==='compra');const sells=ops.filter(o=>o.assetId===a.id&&o.type==='venda');const qtyHold=buys.reduce((s,o)=>s+o.qty,0)-sells.reduce((s,o)=>s+o.qty,0);const buy=buys.reduce((s,o)=>s+o.qty*o.price,0);const sell=qtyHold*(a.price||0);const tirR=sell-buy;const tirP=buy>0?(tirR/buy*100):0;return {label:a.ticker,net:tirP}});drawSimpleBar('invReturnsChart',series)}
function renderInvReturnsDetails(){const tbody=ui.invest.returnsDetailsGrid.querySelector('tbody');tbody.innerHTML='';const assets=state.db.invest.assets;const ops=state.db.invest.ops;let totalBuy=0,totalSell=0,totalProv=0;assets.forEach(a=>{const buys=ops.filter(o=>o.assetId===a.id&&o.type==='compra');const sells=ops.filter(o=>o.assetId===a.id&&o.type==='venda');const provs=ops.filter(o=>o.assetId===a.id&&o.type==='provento');const qtyHold=buys.reduce((s,o)=>s+o.qty,0)-sells.reduce((s,o)=>s+o.qty,0);const buyTot=buys.reduce((s,o)=>s+o.qty*o.price,0);const sellNow=(a.price||0)*qtyHold;const avgBuy=(buys.reduce((s,o)=>s+o.qty,0))?buyTot/(buys.reduce((s,o)=>s+o.qty,0)):0;const avgSell=a.price||0;const provTot=provs.reduce((s,o)=>s+o.price,0);const valR=sellNow-buyTot;const valPct=buyTot>0?(valR/buyTot*100):0;const rendR=provTot;const rendPct=buyTot>0?(provTot/buyTot*100):0;const tirR=valR+rendR;const tirP=buyTot>0?((valR+rendR)/buyTot*100):0;totalBuy+=buyTot;totalSell+=sellNow;totalProv+=provTot;const tr=document.createElement('tr');tr.innerHTML=`<td>${a.ticker}</td><td>${qtyHold}</td><td>${fmt(buyTot)}</td><td>${fmt(sellNow)}</td><td>${fmt(avgBuy)}</td><td>${fmt(avgSell)}</td><td>${fmt(buyTot)}</td><td>${fmt(sellNow)}</td><td>${fmt(valR)}</td><td>${valPct.toFixed(2)}%</td><td>${fmt(rendR)}</td><td>${rendPct.toFixed(2)}%</td><td>${fmt(tirR)}</td><td>${tirP.toFixed(2)}%</td>`;tbody.appendChild(tr)});const valR=totalSell-totalBuy;const valPct=totalBuy>0?(valR/totalBuy*100):0;const tirR=valR+totalProv;const tirP=totalBuy>0?(tirR/totalBuy*100):0;const tr=document.createElement('tr');tr.innerHTML=`<td>Total</td><td>-</td><td>${fmt(totalBuy)}</td><td>${fmt(totalSell)}</td><td>-</td><td>-</td><td>${fmt(totalBuy)}</td><td>${fmt(totalSell)}</td><td>${fmt(valR)}</td><td>${valPct.toFixed(2)}%</td><td>${fmt(totalProv)}</td><td>${(totalBuy>0?(totalProv/totalBuy*100):0).toFixed(2)}%</td><td>${fmt(tirR)}</td><td>${tirP.toFixed(2)}%</td>`;tbody.appendChild(tr)}
function drawSimpleBar(canvasId,series){const c=document.getElementById(canvasId);if(!c)return;const cssW=(c.clientWidth||300);const cssH=(c.clientHeight||120);const dpr=window.devicePixelRatio||1;c.width=Math.floor(cssW*dpr);c.height=Math.floor(cssH*dpr);const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cssW,cssH);if(!series.length)return;const margin=24;const gap=10;const barW=Math.max(10,Math.floor((cssW-margin*2)/series.length)-gap);const max=Math.max(...series.map(s=>Math.abs(s.net)))||1;for(let i=0;i<series.length;i++){const s=series[i];const x=margin+i*(barW+gap);const bh=(Math.abs(s.net)/max)*(cssH-margin*2);ctx.fillStyle=s.net>=0?'#10b981':'#ef4444';ctx.fillRect(x,cssH-margin-(s.net>=0?bh:0),barW,bh);ctx.fillStyle='#9ca3af';ctx.font='12px Inter';ctx.fillText(s.label,x,cssH-6)} }
function renderInvStocksPlan(){refreshAssetsList();const map=valueMap('acao');const rows=Object.values(map);const total=rows.reduce((s,r)=>s+(r.val||0),0);const invest=Number(ui.invest.stocksBudget.value||0);const tbody=ui.invest.stocksPlanGrid.querySelector('tbody');tbody.innerHTML='';const donutData=[];rows.forEach(r=>{const pct=total>0?((r.val/total)*100):0;const target=total>0?invest*(r.val/total):(rows.length?invest/rows.length:0);const falta=Math.floor(target/(r.price||1));const tr=document.createElement('tr');tr.innerHTML=`<td>${r.ticker}</td><td>${fmt(r.price)}</td><td>${fmt(r.val)}</td><td>${pct.toFixed(1)}%</td><td>${falta}</td>`;tbody.appendChild(tr);donutData.push({name:r.ticker,v:r.val})});requestAnimationFrame(()=>drawDonut('invStocksDonut',donutData))}
function renderInvFiisPlan(){refreshAssetsList();const map=valueMap('fii');const rows=Object.values(map);const total=rows.reduce((s,r)=>s+(r.val||0),0);const invest=Number(ui.invest.fiisBudget.value||0);const tbody=ui.invest.fiisPlanGrid.querySelector('tbody');tbody.innerHTML='';const donutData=[];rows.forEach(r=>{const pct=total>0?((r.val/total)*100):0;const target=total>0?invest*(r.val/total):(rows.length?invest/rows.length:0);const falta=Math.floor(target/(r.price||1));const tr=document.createElement('tr');tr.innerHTML=`<td>${r.ticker}</td><td>${fmt(r.price)}</td><td>${fmt(r.val)}</td><td>${pct.toFixed(1)}%</td><td>${falta}</td>`;tbody.appendChild(tr);donutData.push({name:r.ticker,v:r.val})});requestAnimationFrame(()=>drawDonut('invFiisDonut',donutData))}
function refreshSuggestions(){const cats=new Set();const mers=new Set();state.db.transactions.forEach(t=>{if(t.category)cats.add(t.category);if(t.merchant)mers.add(t.merchant)});state.db.cardEntries.forEach(e=>{if(e.category)cats.add(e.category);if(e.merchant)mers.add(e.merchant)});Object.keys(state.db.budgets).forEach(c=>cats.add(c));const catEl=document.getElementById('categoriesList');const merEl=document.getElementById('merchantsList');catEl.innerHTML=[...cats].sort().map(c=>`<option value="${c}"></option>`).join('');merEl.innerHTML=[...mers].sort().map(m=>`<option value="${m}"></option>`).join('')}
function guessCategoryForMerchant(m){if(!m)return'';const cands=[];state.db.transactions.forEach(t=>{if((t.merchant||'')===m)cands.push({cat:t.category,date:t.date})});state.db.cardEntries.forEach(e=>{if((e.merchant||'')===m)cands.push({cat:e.category,date:e.debitDate||e.date})});cands.sort((a,b)=>new Date(b.date)-new Date(a.date));return cands[0]?.cat||''}