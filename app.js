const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const STORE_KEY = 'cantinaControl.v1';
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
const fmtDate = v => v ? new Date(`${v}T12:00:00`).toLocaleDateString('pt-BR') : 'Não informada';
const fmtQty = n => Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {'Bebidas':'🥤','Biscoitos e snacks':'🍪','Frutas e verduras':'🍎','Grãos e secos':'🌾','Laticínios':'🥛','Limpeza':'🧽','Outros':'🧺'};
let data = loadData();
let toastTimer;
function loadData(){
  try { const saved = JSON.parse(localStorage.getItem(STORE_KEY)); if(saved && Array.isArray(saved.products) && Array.isArray(saved.movements)) return saved; } catch(e){}
  // Exemplos iniciais para a demonstração; podem ser editados ou apagados.
  const products = [
    {id:uid(),name:'Arroz tipo 1',category:'Grãos e secos',unit:'kg',quantity:18,minimum:8,expiry:'2026-11-20',lot:'Prateleira A'},
    {id:uid(),name:'Leite integral',category:'Laticínios',unit:'caixa',quantity:4,minimum:10,expiry:'2026-10-29',lot:'Lote L24'},
    {id:uid(),name:'Suco de uva',category:'Bebidas',unit:'caixa',quantity:12,minimum:5,expiry:'2026-12-05',lot:'Caixa fechada'},
    {id:uid(),name:'Banana',category:'Frutas e verduras',unit:'kg',quantity:3,minimum:4,expiry:todayISO(),lot:'Entrega da manhã'},
    {id:uid(),name:'Biscoito água e sal',category:'Biscoitos e snacks',unit:'pacote',quantity:24,minimum:8,expiry:'2027-01-15',lot:'Lote B08'},
    {id:uid(),name:'Molho de tomate',category:'Outros',unit:'lata',quantity:0,minimum:6,expiry:'2026-10-20',lot:'Lote M11'}
  ];
  const movements = [{id:uid(),productId:products[0].id,productName:products[0].name,type:'entrada',quantity:18,date:todayISO(),reason:'Estoque inicial',responsible:'Equipe da cantina'}];
  return {products,movements};
}
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function daysUntil(date){ if(!date)return null; return Math.round((new Date(`${date}T00:00:00`) - new Date(`${todayISO()}T00:00:00`))/86400000); }
function expiryStatus(p){ if(!p.expiry)return 'sem'; const days=daysUntil(p.expiry); if(days<0)return 'vencido'; if(days<=7)return 'breve'; return 'ok'; }
function stockStatus(p){return Number(p.quantity)<=0?'zero':Number(p.quantity)<=Number(p.minimum)?'baixo':'ok';}
function stockLabel(p){const s=stockStatus(p);return s==='zero'?'Sem estoque':s==='baixo'?'Estoque baixo':'Normal';}
function expiryLabel(p){const s=expiryStatus(p);return s==='sem'?'Sem data':s==='vencido'?'Vencido':s==='breve'?'Vence em breve':'Dentro da validade';}
function badge(text,kind){return `<span class="mini-badge ${kind}">${text}</span>`;}
function statusBadge(p){const s=stockStatus(p);return badge(stockLabel(p),s==='zero'?'badge-zero':s==='baixo'?'badge-low':'badge-good');}
function expiryBadge(p){const s=expiryStatus(p);return badge(expiryLabel(p),s==='vencido'?'tag-expired':s==='breve'?'tag-soon':s==='ok'?'tag-ok':'');}
function productCell(p){return `<div class="table-product"><span class="food-thumb">${icons[p.category]||'🧺'}</span><span><strong>${esc(p.name)}</strong><small>${esc(p.unit)} · ${esc(p.lot||'sem lote informado')}</small></span></div>`;}
function emptyRow(cols,msg){return `<tr><td colspan="${cols}" style="text-align:center;padding:25px;color:#a0a797">${msg}</td></tr>`;}
function render(){
  const products=data.products, movements=[...data.movements].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const low=products.filter(p=>stockStatus(p)==='baixo'||stockStatus(p)==='zero');
  const expired=products.filter(p=>expiryStatus(p)==='vencido');
  const soon=products.filter(p=>expiryStatus(p)==='breve');
  const later=products.filter(p=>expiryStatus(p)==='ok');
  $('#statProducts').textContent=products.length; $('#statLow').textContent=low.length; $('#statSoon').textContent=soon.length; $('#statExpired').textContent=expired.length;
  $('#navProductCount').textContent=products.length; $('#expiryDot').classList.toggle('show',expired.length+soon.length>0);
  $('#attentionList').innerHTML = [...expired.map(p=>({p,label:'Validade vencida',kind:'tag-expired'})),...soon.map(p=>({p,label:'Vence em breve',kind:'tag-soon'})),...low.map(p=>({p,label:stockStatus(p)==='zero'?'Sem estoque':'Estoque baixo',kind:'tag-low'}))].slice(0,5).map(({p,label,kind})=>`<div class="attention-item"><span class="food-thumb">${icons[p.category]||'🧺'}</span><div class="attention-info"><strong>${esc(p.name)}</strong><small>${fmtQty(p.quantity)} ${esc(p.unit)} disponíveis</small></div><span class="attention-status ${kind}">${label}</span></div>`).join('') || `<div class="empty-state"><span>🌼</span><strong>Tudo em ordem por aqui!</strong><p>Nenhum alerta no momento.</p></div>`;
  $('#recentMovements').innerHTML=movements.slice(0,5).map(m=>`<tr><td><div class="table-product"><span class="food-thumb">${icons[(products.find(p=>p.id===m.productId)||{}).category]||'🧺'}</span><strong>${esc(m.productName)}</strong></div></td><td><span class="${m.type==='entrada'?'type-in':m.type==='saida'?'type-out':'type-adjust'}">${m.type==='entrada'?'↗ Entrada':m.type==='saida'?'↘ Saída':'↔ Ajuste'}</span></td><td class="qty-strong">${m.type==='saida'?'−':m.type==='entrada'?'+':''}${fmtQty(m.quantity)}</td><td>${fmtDate(m.date)}</td><td>${esc(m.responsible||'—')}</td></tr>`).join('')||emptyRow(5,'Nenhuma movimentação registrada ainda.');
  renderProducts(); renderMovements(); renderExpiry(); renderReports(); save();
}
function renderProducts(){
 const q=$('#productSearch').value.trim().toLowerCase(), cat=$('#categoryFilter').value, st=$('#stockFilter').value;
 const list=data.products.filter(p=>(p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q))&&(!cat||p.category===cat)&&(!st||stockStatus(p)===st));
 $('#productCountLabel').textContent=`${list.length} ${list.length===1?'produto encontrado':'produtos encontrados'}`;
 $('#productsTable').innerHTML=list.map(p=>`<tr><td>${productCell(p)}</td><td>${esc(p.category)}</td><td><strong class="qty-strong">${fmtQty(p.quantity)} ${esc(p.unit)}</strong></td><td>${fmtQty(p.minimum)} ${esc(p.unit)}</td><td>${statusBadge(p)}</td><td><button class="action-icon" title="Editar produto" data-edit="${p.id}">✎</button><button class="action-icon" title="Registrar movimento" data-move="${p.id}">↔</button><button class="action-icon danger" title="Excluir produto" data-delete="${p.id}">×</button></td></tr>`).join('');
 $('#productsEmpty').classList.toggle('hidden',list.length!==0);
}
function renderMovements(){
 const filter=$('#movementFilter').value;
 const list=[...data.movements].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).filter(m=>!filter||m.type===filter);
 $('#movementTable').innerHTML=list.map(m=>`<tr><td><strong>${esc(m.productName)}</strong></td><td><span class="${m.type==='entrada'?'type-in':m.type==='saida'?'type-out':'type-adjust'}">${m.type==='entrada'?'↗ Entrada':m.type==='saida'?'↘ Saída':'↔ Ajuste'}</span></td><td class="qty-strong">${fmtQty(m.quantity)}</td><td>${fmtDate(m.date)}</td><td>${esc(m.reason||'—')}</td><td>${esc(m.responsible||'—')}</td></tr>`).join('')||emptyRow(6,'Nenhum registro corresponde a este filtro.');
 $('#movementEmpty').classList.toggle('hidden',data.movements.length>0);
}
function renderExpiry(){
 const filter=$('#expiryFilter').value;
 $('#expiryExpiredCount').textContent=data.products.filter(p=>expiryStatus(p)==='vencido').length;
 $('#expirySoonCount').textContent=data.products.filter(p=>expiryStatus(p)==='breve').length;
 $('#expiryLaterCount').textContent=data.products.filter(p=>expiryStatus(p)==='ok').length;
 const list=data.products.filter(p=>!filter||expiryStatus(p)===filter).sort((a,b)=>(a.expiry||'9999').localeCompare(b.expiry||'9999'));
 $('#expiryTable').innerHTML=list.map(p=>`<tr><td>${productCell(p)}</td><td>${esc(p.lot||'—')}</td><td>${fmtQty(p.quantity)} ${esc(p.unit)}</td><td>${fmtDate(p.expiry)}</td><td>${expiryBadge(p)}</td><td><button class="action-icon" title="Editar produto" data-edit="${p.id}">✎</button></td></tr>`).join('')||emptyRow(6,'Nenhum produto nesta situação.');
}
function renderReports(){
 const low=data.products.filter(p=>stockStatus(p)==='baixo'||stockStatus(p)==='zero').length;
 const expiry=data.products.filter(p=>['vencido','breve'].includes(expiryStatus(p))).length;
 $('#reportProducts').textContent=data.products.length;$('#reportLow').textContent=low;$('#reportExpiry').textContent=expiry;
 $('#reportTable').innerHTML=data.products.map(p=>`<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.category)}</td><td>${fmtQty(p.quantity)} ${esc(p.unit)}</td><td>${fmtQty(p.minimum)} ${esc(p.unit)}</td><td>${fmtDate(p.expiry)}</td><td>${statusBadge(p)} ${expiryStatus(p)==='vencido'?expiryBadge(p):''}</td></tr>`).join('')||emptyRow(6,'Cadastre produtos para gerar seu relatório.');
}
function showToast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2800);}
function goView(name){
 $$('.page-view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
 $$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
 const labels={inicio:'Visão geral',produtos:'Produtos',movimentacoes:'Movimentações',validade:'Validade',relatorios:'Relatórios'};
 $('#crumbTitle').textContent=labels[name]||'Visão geral'; $('#sidebar').classList.remove('open'); window.scrollTo({top:0,behavior:'smooth'});
}
function openProduct(product=null){
 $('#productForm').reset();$('#editProductId').value=product?.id||'';
 $('#modalTitle').textContent=product?'Editar produto':'Novo produto';$('#modalSubtitle').textContent=product?'Atualize os dados deste item.':'Vamos adicionar mais um item à nossa cantina.';
 $('#productName').value=product?.name||'';$('#productCategory').value=product?.category||'';$('#productUnit').value=product?.unit||'unidade';
 $('#productQuantity').value=product?.quantity??0;$('#productMinimum').value=product?.minimum??5;$('#productExpiry').value=product?.expiry||'';$('#productLot').value=product?.lot||'';
 $('#modalBackdrop').classList.remove('hidden');setTimeout(()=>$('#productName').focus(),80);
}
function closeProduct(){$('#modalBackdrop').classList.add('hidden');}
function openMovement(productId=''){
 $('#movementForm').reset();$('#movementProduct').innerHTML=data.products.map(p=>`<option value="${p.id}">${esc(p.name)} — ${fmtQty(p.quantity)} ${esc(p.unit)}</option>`).join('');
 if(!data.products.length){showToast('Cadastre um produto antes de registrar uma movimentação.');return;}
 if(productId)$('#movementProduct').value=productId;
 $('#movementType').value='entrada';$('#movementHint').textContent='Entradas aumentam a quantidade disponível.';
 $('#movementBackdrop').classList.remove('hidden');
}
function closeMovement(){$('#movementBackdrop').classList.add('hidden');}
function downloadCsv(){
 const rows=[['Produto','Categoria','Quantidade atual','Unidade','Estoque mínimo','Validade','Lote','Situação do estoque','Situação da validade'],...data.products.map(p=>[p.name,p.category,p.quantity,p.unit,p.minimum,p.expiry||'',p.lot||'',stockLabel(p),expiryLabel(p)])];
 const csv='\ufeff'+rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`cantinacontrol-estoque-${todayISO()}.csv`;a.click();URL.revokeObjectURL(url);showToast('Relatório CSV exportado!');
}
document.addEventListener('click',e=>{
 const nav=e.target.closest('[data-view]');if(nav){goView(nav.dataset.view);return;}
 const action=e.target.closest('[data-action]');if(action){if(action.dataset.action==='add-product')openProduct();if(action.dataset.action==='movement')openMovement();return;}
 const edit=e.target.closest('[data-edit]');if(edit){const p=data.products.find(x=>x.id===edit.dataset.edit);if(p)openProduct(p);return;}
 const move=e.target.closest('[data-move]');if(move){openMovement(move.dataset.move);return;}
 const del=e.target.closest('[data-delete]');if(del){const p=data.products.find(x=>x.id===del.dataset.delete);if(p&&confirm(`Excluir "${p.name}" do catálogo? O histórico de movimentações será mantido.`)){data.products=data.products.filter(x=>x.id!==p.id);save();render();showToast('Produto excluído do catálogo.');}return;}
});
$('#productForm').addEventListener('submit',e=>{
 e.preventDefault();const id=$('#editProductId').value, old=data.products.find(p=>p.id===id);
 const p={id:id||uid(),name:$('#productName').value.trim(),category:$('#productCategory').value,unit:$('#productUnit').value,quantity:Number($('#productQuantity').value),minimum:Number($('#productMinimum').value),expiry:$('#productExpiry').value,lot:$('#productLot').value.trim()};
 if(!p.name||p.quantity<0||p.minimum<0){showToast('Confira os campos antes de salvar.');return;}
 if(old){const delta=p.quantity-Number(old.quantity);Object.assign(old,p);if(delta!==0)data.movements.push({id:uid(),productId:p.id,productName:p.name,type:'ajuste',quantity:Math.abs(delta),date:todayISO(),reason:'Ajuste ao editar cadastro',responsible:'Equipe da cantina'});showToast('Produto atualizado com sucesso!');}
 else{data.products.push(p);data.movements.push({id:uid(),productId:p.id,productName:p.name,type:'entrada',quantity:p.quantity,date:todayISO(),reason:'Cadastro inicial',responsible:'Equipe da cantina'});showToast('Produto cadastrado com sucesso!');}
 closeProduct();render();
});
$('#movementForm').addEventListener('submit',e=>{
 e.preventDefault();const p=data.products.find(x=>x.id===$('#movementProduct').value);if(!p)return;
 const type=$('#movementType').value, qty=Number($('#movementQuantity').value);
 if(!(qty>0)){showToast('Informe uma quantidade maior que zero.');return;}
 if(type==='saida'&&qty>Number(p.quantity)){showToast(`Estoque insuficiente. Disponível: ${fmtQty(p.quantity)} ${p.unit}.`);return;}
 if(type==='entrada')p.quantity=Number(p.quantity)+qty;
 else if(type==='saida')p.quantity=Number(p.quantity)-qty;
 else p.quantity=qty;
 data.movements.push({id:uid(),productId:p.id,productName:p.name,type,quantity:qty,date:todayISO(),reason:$('#movementReason').value.trim()||(type==='entrada'?'Reposição':type==='saida'?'Retirada':'Contagem de estoque'),responsible:$('#movementResponsible').value.trim()||'Equipe da cantina'});
 closeMovement();render();showToast('Movimentação registrada e estoque atualizado!');
});
$('#movementType').addEventListener('change',()=>{$('#movementHint').textContent=$('#movementType').value==='entrada'?'Entradas aumentam a quantidade disponível.':$('#movementType').value==='saida'?'Saídas reduzem a quantidade. O sistema não permite retirar mais do que há em estoque.':'No ajuste, a quantidade informada passa a ser o novo saldo total.';});
$('#closeModal').addEventListener('click',closeProduct);$('#cancelProduct').addEventListener('click',closeProduct);$('#closeMovement').addEventListener('click',closeMovement);$('#cancelMovement').addEventListener('click',closeMovement);
$('#modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')closeProduct();});$('#movementBackdrop').addEventListener('click',e=>{if(e.target.id==='movementBackdrop')closeMovement();});
$('#productSearch').addEventListener('input',renderProducts);$('#categoryFilter').addEventListener('change',renderProducts);$('#stockFilter').addEventListener('change',renderProducts);$('#movementFilter').addEventListener('change',renderMovements);$('#expiryFilter').addEventListener('change',renderExpiry);$('#exportCsv').addEventListener('click',downloadCsv);
$('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeProduct();closeMovement();$('#sidebar').classList.remove('open');}});
$('#todayLabel').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).replace('.','');
render();
