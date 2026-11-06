const $=(selector,context=document)=>context.querySelector(selector);
const $$=(selector,context=document)=>[...context.querySelectorAll(selector)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

// Editorial reveals
const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target)}
}),{threshold:.12,rootMargin:'0px 0px -5%'});
$$('.reveal').forEach(element=>revealObserver.observe(element));

// Scroll-linked progress, hero depth and product reveal
const progressBar=$('.scroll-progress i');
const heroProduct=$('.hero-product');
const productSection=$('.product-story');
const productMask=$('[data-product-reveal]');
const productImage=$('[data-product-reveal] img');
const storyFacts=$$('[data-story]');
let ticking=false;
function renderScroll(){
  const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  progressBar.style.transform=`scaleX(${scrollY/max})`;
  if(!reduced&&heroProduct&&scrollY<innerHeight*1.2){if(scrollY>4)heroProduct.style.transform=`translate3d(0,${scrollY*.045}px,0) scale(${1+scrollY*.000035})`;else heroProduct.style.removeProperty('transform')}
  if(productSection&&productMask){
    const rect=productSection.getBoundingClientRect();
    const travel=Math.max(1,productSection.offsetHeight-innerHeight);
    // Begin revealing the object as soon as the story enters the viewport,
    // instead of waiting until the section reaches the very top.
    const startOffset=innerHeight*.18;
    const value=Math.min(1,Math.max(0,(startOffset-rect.top)/travel));
    const inset=13*(1-value);
    productMask.style.clipPath=`inset(0 ${inset}% 0 ${inset}% round ${2+value*16}px)`;
    if(!reduced)productImage.style.transform=`scale(${1.12-value*.12})`;
    const active=Math.min(2,Math.floor(value*3));
    storyFacts.forEach((fact,index)=>fact.classList.toggle('active',index===active));
  }
  ticking=false;
}
addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(renderScroll);ticking=true}},{passive:true});
addEventListener('resize',renderScroll,{passive:true});renderScroll();

// Multi-depth procedural six-arm snow crystals
if(!reduced){
  const canvas=$('.snow-canvas'),ctx=canvas.getContext('2d',{alpha:true});
  let width,height,dpr,flakes=[];
  const count=()=>Math.min(62,Math.max(30,Math.round(innerWidth/7)));
  function makeFlake(initial=false){const depth=.35+Math.random()*.9;return{x:Math.random()*width,y:initial?Math.random()*height:-24,size:(1.2+Math.random()*4.5)*depth,speed:(.22+Math.random()*.62)*depth,wind:(Math.random()-.5)*.18,phase:Math.random()*Math.PI*2,angle:Math.random()*Math.PI,spin:(Math.random()-.5)*.006,alpha:(.14+Math.random()*.5)*depth,crystal:Math.random()>.55,blur:Math.random()>.82?1.2:0}}
  function setupSnow(){dpr=Math.min(devicePixelRatio||1,2);width=innerWidth;height=innerHeight;canvas.width=width*dpr;canvas.height=height*dpr;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;ctx.setTransform(dpr,0,0,dpr,0,0);flakes=Array.from({length:count()},()=>makeFlake(true))}
  function drawCrystal(f){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.angle);ctx.filter=f.blur?`blur(${f.blur}px)`:'none';ctx.strokeStyle=`rgba(247,251,255,${Math.min(.72,f.alpha)})`;ctx.lineWidth=f.size>3?.65:.45;ctx.beginPath();for(let arm=0;arm<6;arm++){const angle=arm*Math.PI/3,r=f.size*1.35,ex=Math.cos(angle)*r,ey=Math.sin(angle)*r;ctx.moveTo(0,0);ctx.lineTo(ex,ey);if(f.size>2.8){for(const point of [.5,.72]){const bx=Math.cos(angle)*r*point,by=Math.sin(angle)*r*point,branch=r*.22;ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(angle+.7)*branch,by+Math.sin(angle+.7)*branch);ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(angle-.7)*branch,by+Math.sin(angle-.7)*branch)}}}ctx.stroke();ctx.restore()}
  function animateSnow(){ctx.clearRect(0,0,width,height);for(const f of flakes){f.y+=f.speed;f.x+=f.wind+Math.sin(f.phase+f.y*.009)*.18;f.angle+=f.spin;if(f.y>height+25||f.x<-30||f.x>width+30)Object.assign(f,makeFlake());if(f.crystal&&f.size>2)drawCrystal(f);else{ctx.beginPath();ctx.filter=f.blur?`blur(${f.blur}px)`:'none';ctx.fillStyle=`rgba(247,251,255,${f.alpha*.72})`;ctx.arc(f.x,f.y,Math.max(.45,f.size*.22),0,Math.PI*2);ctx.fill()}}ctx.filter='none';requestAnimationFrame(animateSnow)}
  setupSnow();addEventListener('resize',setupSnow,{passive:true});animateSnow();
}

// Nine records interaction
const vinyls=$$('.vinyl');
const recordNumber=$('#record-number'),recordTitle=$('#record-title'),recordText=$('#record-text');
vinyls.forEach(vinyl=>vinyl.addEventListener('click',()=>{
  vinyls.forEach(item=>{item.classList.remove('active');item.setAttribute('aria-selected','false')});
  vinyl.classList.add('active');vinyl.setAttribute('aria-selected','true');
  recordNumber.textContent=`Платівка ${vinyl.dataset.number}`;recordTitle.textContent=vinyl.dataset.title;recordText.textContent=vinyl.dataset.text;
}));

// Decorative gift opening
const giftBox=$('.gift-box'),giftMessage=$('.gift-message');
giftBox?.addEventListener('click',()=>{const open=giftBox.classList.toggle('open');giftBox.setAttribute('aria-expanded',String(open));giftMessage.classList.toggle('visible',open);$('small',giftBox).textContent=open?'Ваш особливий момент':'Натисніть, щоб відкрити'});

// Infinite one-slide gallery with buttons and touch gestures
const galleryTrack=$('.gallery-track');
if(galleryTrack){
  const originalSlides=$$('figure',galleryTrack),total=originalSlides.length;
  const first=originalSlides[0].cloneNode(true),last=originalSlides[total-1].cloneNode(true);
  first.setAttribute('aria-hidden','true');last.setAttribute('aria-hidden','true');galleryTrack.prepend(last);galleryTrack.append(first);
  let index=1,startX=0,currentX=0,dragging=false;
  const counter=$('[data-gallery-current]');
  function updateCounter(){counter.textContent=String(index===0?total:index===total+1?1:index).padStart(2,'0')}
  function move(animate=true){galleryTrack.style.transition=animate?'transform .65s var(--ease)':'none';galleryTrack.style.transform=`translate3d(-${index*100}%,0,0)`;updateCounter()}
  function normalize(){if(index===0){index=total;move(false)}else if(index===total+1){index=1;move(false)}}
  galleryTrack.addEventListener('transitionend',normalize);
  $('[data-gallery-prev]')?.addEventListener('click',()=>{if(index<=0)return;index--;move()});
  $('[data-gallery-next]')?.addEventListener('click',()=>{if(index>=total+1)return;index++;move()});
  galleryTrack.addEventListener('pointerdown',event=>{dragging=true;startX=event.clientX;currentX=startX;galleryTrack.setPointerCapture(event.pointerId);galleryTrack.style.transition='none'});
  galleryTrack.addEventListener('pointermove',event=>{if(!dragging)return;currentX=event.clientX;const width=galleryTrack.clientWidth;galleryTrack.style.transform=`translate3d(calc(-${index*100}% + ${currentX-startX}px),0,0)`});
  galleryTrack.addEventListener('pointerup',()=>{if(!dragging)return;dragging=false;const delta=currentX-startX;if(Math.abs(delta)>45)index+=delta<0?1:-1;move()});
  galleryTrack.addEventListener('pointercancel',()=>{dragging=false;move()});
  move(false);
}

// Sticky mobile offer
const sticky=$('.sticky-buy'),order=$('#order'),hero=$('.hero');
function toggleSticky(){if(!sticky||!order||!hero)return;const orderRect=order.getBoundingClientRect();sticky.classList.toggle('show',scrollY>hero.offsetHeight*.68&&!(orderRect.top<innerHeight&&orderRect.bottom>0))}
addEventListener('scroll',toggleSticky,{passive:true});toggleSticky();

// Mouse-only magnetic CTA
if(matchMedia('(hover:hover) and (pointer:fine)').matches&&!reduced){$$('.magnetic').forEach(button=>{button.addEventListener('pointermove',event=>{const rect=button.getBoundingClientRect(),x=(event.clientX-rect.left-rect.width/2)*.12,y=(event.clientY-rect.top-rect.height/2)*.18;button.style.transform=`translate(${x}px,${y}px)`});button.addEventListener('pointerleave',()=>button.style.transform='')})}

// Order form and traffic attribution
const phone=$('input[name=phone]');
phone?.addEventListener('input',event=>{let value=event.target.value.replace(/\D/g,'');if(value.startsWith('380'))value=value.slice(0,12);else if(value.startsWith('0'))value=`38${value.slice(0,10)}`;else value=`380${value.slice(0,9)}`;event.target.value=`+${value}`});
function trafficData(){const params=new URLSearchParams(location.search),keys=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid','ttclid'];return Object.fromEntries(keys.filter(key=>params.get(key)).map(key=>[key,params.get(key)]))}
$('#order-form')?.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,button=$('button[type=submit]',form),status=$('.form-status',form),data=Object.fromEntries(new FormData(form));
  if(data.name.trim().length<2||!/^\+380\d{9}$/.test(data.phone)||!data.consent){status.textContent='Перевірте ім’я, номер у форматі +380 та згоду на обробку даних.';status.className='form-status error';return}
  button.disabled=true;button.innerHTML='Надсилаємо…';status.textContent='';status.className='form-status';Object.assign(data,{product:window.STORE_CONFIG?.product||'Різдвяний магнітний мініпрогравач',price:window.STORE_CONFIG?.currencyPrice||'1422.98',traffic:trafficData()});
  try{const response=await fetch('/api/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),result=await response.json().catch(()=>({}));if(!response.ok)throw Error(result.error);status.textContent='Дякуємо! Ваша заявка прийнята — незабаром ми зателефонуємо.';status.className='form-status success';form.reset();window.dataLayer?.push({event:'Lead'})}
  catch{status.textContent='Не вдалося надіслати заявку. Перевірте з’єднання або спробуйте ще раз.';status.className='form-status error';button.disabled=false;button.innerHTML='Отримати зі знижкою <span>↘</span>'}
});
