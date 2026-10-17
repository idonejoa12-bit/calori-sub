const $=id=>document.getElementById(id);
const todayKey=()=>new Date().toLocaleDateString('en-CA');
let profile=JSON.parse(localStorage.getItem('cs_profile')||'null');
let meals=JSON.parse(localStorage.getItem('cs_meals')||'[]');
let pendingPhoto='';
let estimate=0;
const foodRefs=[[/pizza|muzza/,266],[/hamburg|burger/,295],[/papas fritas|fritas/,312],[/arroz/,130],[/pollo/,165],[/ensalada/,70],[/manzana/,95],[/banana|pl.tano/,105],[/huevo/,78],[/pan/,265],[/fideo|pasta/,158],[/milanesa/,290],[/empanada/,250],[/yogur/,120],[/leche/,100],[/avena/,150],[/carne|asado/,250],[/lenteja/,116],[/sopa/,90],[/galleta/,480],[/chocolate/,535],[/helado/,207],[/sandwich|s.ndwich/,320],[/tostada/,150],[/queso/,350]];
function save(){localStorage.setItem('cs_meals',JSON.stringify(meals));localStorage.setItem('cs_profile',JSON.stringify(profile));render();}
function dayMeals(){return meals.filter(m=>m.date===todayKey())}
function render(){const today=dayMeals();$('totalKcal').textContent=today.reduce((s,m)=>s+Number(m.kcal||0),0).toLocaleString('es-AR');$('mealCount').textContent=today.length;$('mealList').innerHTML='';$('emptyState').classList.toggle('hidden',today.length>0);today.slice().reverse().forEach(m=>{const el=document.createElement('div');el.className='meal';el.innerHTML=`<div class="meal-pic">${m.photo?`<img src="${m.photo}" alt="">`:'🍽️'}</div><div class="meal-main"><b></b><small></small></div><div class="meal-kcal">${Number(m.kcal).toLocaleString('es-AR')} kcal</div><button class="delete-meal" aria-label="Eliminar">×</button>`;el.querySelector('b').textContent=m.name;el.querySelector('small').textContent=(m.type||'Comida')+' · '+(m.portion||'Porción no indicada')+' · '+m.time;el.querySelector('button').onclick=()=>{meals=meals.filter(x=>x.id!==m.id);save();};$('mealList').append(el);});$('dateLabel').textContent=new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});$('onboarding').classList.toggle('hidden',!!profile);$('dashboard').classList.toggle('hidden',!profile);}
function toast(msg){$('toast').textContent=msg;$('toast').classList.remove('hidden');setTimeout(()=>$('toast').classList.add('hidden'),2800)}
function openFood(photo=''){pendingPhoto=photo;$('foodForm').classList.remove('hidden');$('foodFormTitle').textContent=photo?'Comida desde foto':'Describir comida';$('photoPreviewWrap').classList.toggle('hidden',!photo);$('analyzePhotoBtn').classList.toggle('hidden',!photo);if(photo)$('photoPreview').src=photo;$('foodName').value='';$('portion').value='';$('manualKcal').value='';$('estimateResult').classList.add('hidden');estimate=0;$('mealType').value='Desayuno';$('foodForm').scrollIntoView({behavior:'smooth',block:'start'});}
function estimateKcal(name,portion){const text=name.toLowerCase();let matches=foodRefs.filter(([r])=>r.test(text));if(!matches.length)return 250;let base=matches.reduce((s,m)=>s+m[1],0);if(matches.length>1)base=base*.72;const grams=(portion.match(/(\d+(?:[.,]\d+)?)\s*g/i)||[])[1];if(grams){const g=Number(grams.replace(',','.'));return Math.max(1,Math.round(base*g/100));}if(/2\s*(porciones|platos|unidades|rebanadas)/i.test(portion))base*=2;return Math.round(base);}
$('profileForm').addEventListener('submit',e=>{e.preventDefault();profile={goal:document.querySelector('input[name="goal"]:checked').value,age:Number($('age').value),height:Number($('height').value),weight:Number($('weight').value),target:$('target').value?Number($('target').value):null};save();toast('¡Perfil creado!');});
$('skipProfile').onclick=()=>{profile={goal:'mantener',age:null,height:null,weight:null,target:null};save();toast('Podés completar tu perfil desde Perfil');};
$('photoBtn').onclick=()=>$('photoInput').click();
$('photoInput').onchange=()=>{const f=$('photoInput').files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>openFood(reader.result);reader.readAsDataURL(f);$('photoInput').value='';};
$('describeBtn').onclick=()=>openFood();$('closeFood').onclick=()=>$('foodForm').classList.add('hidden');

$('analyzePhotoBtn').onclick=async()=>{
 if(!pendingPhoto){toast('Primero sacá o adjuntá una foto');return;}
 const btn=$('analyzePhotoBtn');btn.disabled=true;btn.textContent='Analizando foto…';
 $('estimateResult').classList.remove('hidden');$('estimateResult').textContent='La IA está identificando los alimentos. La cantidad y las calorías son aproximadas.';
 try{
  const r=await fetch('/api/analyze-food',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageDataUrl:pendingPhoto})});
  const data=await r.json();if(!r.ok)throw new Error(data.error||'No se pudo analizar la imagen.');
  $('foodName').value=data.foods.map(f=>f.name).join(', ')+(data.notes?' — '+data.notes:'');
  $('portion').value=data.portion||'Porción estimada visualmente';
  estimate=Number(data.totalKcal||0);$('manualKcal').value=estimate||'';
  const list=(data.foods||[]).map(f=>`${f.name}: ~${f.kcal} kcal`).join('<br>');
  $('estimateResult').innerHTML=`<strong>≈ ${estimate.toLocaleString('es-AR')} kcal</strong>${list?'<div>'+list+'</div>':''}<p class="muted">Estimación visual; la foto no permite saber con certeza el peso, los ingredientes ocultos ni el aceite usado.</p>`;
 }catch(err){
  $('estimateResult').textContent='El análisis con IA todavía no está conectado o el servidor no está configurado. '+(err.message||'Probá más tarde.');
 }finally{btn.disabled=false;btn.textContent='🤖 Analizar foto con IA';}
};
$('estimateBtn').onclick=()=>{const name=$('foodName').value.trim();if(!name){toast('Describí la comida primero');return;}estimate=$('manualKcal').value?Number($('manualKcal').value):estimateKcal(name,$('portion').value);$('estimateResult').innerHTML=`<strong>≈ ${estimate.toLocaleString('es-AR')} kcal</strong>Estimación orientativa. Puede variar según ingredientes, cantidades y preparación.`;$('estimateResult').classList.remove('hidden');};
$('saveFood').onclick=()=>{const name=$('foodName').value.trim();if(!name){toast('Escribí qué comida querés guardar');return;}const kcal=$('manualKcal').value?Number($('manualKcal').value):(estimate||estimateKcal(name,$('portion').value));meals.push({id:Date.now(),date:todayKey(),time:new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}),type:$('mealType').value,name,portion:$('portion').value,kcal,photo:pendingPhoto});save();$('foodForm').classList.add('hidden');toast('Comida guardada');};
$('clearToday').onclick=()=>{if(confirm('¿Querés borrar todas las comidas de hoy?')){meals=meals.filter(m=>m.date!==todayKey());save();}};
$('historyBtn').onclick=()=>{const groups={};meals.forEach(m=>(groups[m.date]??=[]).push(m));const keys=Object.keys(groups).sort().reverse();$('historyList').innerHTML=keys.length?keys.map(k=>`<div class="history-row"><span>${new Date(k+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short',year:'numeric'})}<small style="display:block;color:#999;margin-top:4px">${groups[k].length} comida(s)</small></span><b>${groups[k].reduce((s,m)=>s+Number(m.kcal),0).toLocaleString('es-AR')} kcal</b></div>`).join(''):'<p class="muted">Todavía no hay registros guardados.</p>';$('historyModal').classList.remove('hidden');};
function showProfile(){$('profileSummary').innerHTML=profile?`<p class="muted">Objetivo: <b>${profile.goal}</b></p><p class="muted">Edad: <b>${profile.age||'No indicada'}</b></p><p class="muted">Altura: <b>${profile.height?profile.height+' cm':'No indicada'}</b></p><p class="muted">Peso actual: <b>${profile.weight?profile.weight+' kg':'No indicado'}</b></p><p class="muted">Peso objetivo: <b>${profile.target?profile.target+' kg':'No indicado'}</b></p>`:'<p class="muted">Todavía no completaste tu perfil.</p>';$('profileModal').classList.remove('hidden');}
$('settingsBtn').onclick=showProfile;$('profileNav').onclick=showProfile;$('editProfile').onclick=()=>{$('profileModal').classList.add('hidden');profile=null;render();window.scrollTo({top:0,behavior:'smooth'});};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).classList.add('hidden'));
document.querySelectorAll('.bottom-nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.bottom-nav button').forEach(x=>x.classList.remove('active'));b.classList.add('active')});

async function searchFoods(){
 const q=$('foodSearch').value.trim();const box=$('searchResults');if(!q){toast('Escribí un alimento para buscar');return;}
 box.innerHTML='<p class="muted">Buscando alimentos…</p>';
 try{
  const url='https://world.openfoodfacts.org/cgi/search.pl?search_terms='+encodeURIComponent(q)+'&search_simple=1&action=process&json=1&page_size=8&fields=product_name,brands,nutriments,serving_size,image_front_small_url';
  const res=await fetch(url,{headers:{'Accept':'application/json'}});if(!res.ok)throw new Error('network');const data=await res.json();
  const products=(data.products||[]).filter(p=>p.product_name);
  if(!products.length){box.innerHTML='<p class="muted">No encontramos resultados. Probá con otro nombre o describí la comida manualmente.</p>';return;}
  box.innerHTML='';
  products.forEach(p=>{
   const kcal=Number(p.nutriments?.['energy-kcal_100g']??p.nutriments?.['energy-kcal_value']??0);
   const carbs=p.nutriments?.carbohydrates_100g,protein=p.nutriments?.proteins_100g,fat=p.nutriments?.fat_100g;
   const row=document.createElement('div');row.className='food-result';
   if(p.image_front_small_url){const im=document.createElement('img');im.src=p.image_front_small_url;im.alt='';row.append(im);}
   const main=document.createElement('div');main.className='food-result-main';
   const title=document.createElement('b');title.textContent=p.product_name;const sub=document.createElement('small');sub.textContent=`${p.brands||'Alimento'} · ${kcal?Math.round(kcal)+' kcal/100 g':'calorías no disponibles'}${p.serving_size?' · porción: '+p.serving_size:''}`;
   main.append(title,sub);
   if(carbs!==undefined||protein!==undefined||fat!==undefined){const macros=document.createElement('small');macros.textContent=`Por 100 g: carb. ${carbs??'—'} g · proteína ${protein??'—'} g · grasas ${fat??'—'} g`;main.append(macros);}
   const add=document.createElement('button');add.textContent='Agregar';add.onclick=()=>{openFood();$('foodName').value=p.product_name;$('portion').value='100 g';$('manualKcal').value=kcal?Math.round(kcal):'';estimate=kcal?Math.round(kcal):0;$('estimateResult').innerHTML=`<strong>${kcal?Math.round(kcal)+' kcal':'Sin dato de calorías'}</strong>Valores declarados por producto por cada 100 g; verificá el envase.`;$('estimateResult').classList.remove('hidden');};
   row.append(main,add);box.append(row);
  });
 }catch(e){box.innerHTML='<p class="muted">No se pudo conectar con la base de alimentos. Revisá tu conexión o registrá la comida manualmente.</p>';}
}
$('searchFoodBtn').onclick=searchFoods;$('foodSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchFoods();}});

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();