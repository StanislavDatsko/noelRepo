const $=(selector,context=document)=>context.querySelector(selector);
const $$=(selector,context=document)=>[...context.querySelectorAll(selector)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');

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
const storyChapter=$('.product-copy .chapter');
const storyLineOne=$('.story-line-one i');
const storyLineTwo=$('.story-line-two i');
const productIntro=$('.product-intro');
const immersivePhoto=$('[data-photo-reveal]');
const depthPhotos=$$('[data-photo-depth]');
const clamp=value=>Math.min(1,Math.max(0,value));
const ease=value=>1-Math.pow(1-clamp(value),3);
const phase=(value,start,end)=>ease((value-start)/(end-start));
let ticking=false;
function renderScroll(){
  const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  progressBar.style.transform=`scaleX(${scrollY/max})`;
  if(!reduced&&heroProduct&&scrollY<innerHeight*1.2){if(scrollY>4)heroProduct.style.transform=`translate3d(0,${scrollY*.045}px,0) scale(${1+scrollY*.000035})`;else heroProduct.style.removeProperty('transform')}
  if(productSection&&productMask){
    if(reduced){
      [storyChapter,storyLineOne,storyLineTwo,productIntro,productMask,productImage].forEach(element=>{element?.style.removeProperty('opacity');element?.style.removeProperty('transform');element?.style.removeProperty('filter');element?.style.removeProperty('clip-path')});
      productSection.style.setProperty('--story-light','.55');
      storyFacts.forEach(fact=>fact.classList.add('active'));
    }else{
    const travel=Math.max(1,productSection.offsetHeight-innerHeight);
    const copy=$('[data-cinematic-copy]',productSection);
    const sectionTop=productSection.getBoundingClientRect().top+scrollY;
    const headlineStart=sectionTop+(copy?.offsetTop||64)-innerHeight*.7;
    const storyEnd=sectionTop+travel;
    const value=clamp((scrollY-headlineStart)/Math.max(1,storyEnd-headlineStart));
    const intro=phase(value,0,.18),accent=phase(value,.1,.31),description=phase(value,.2,.38);
    const photo=phase(value,.42,.8),outro=phase(value,.82,1);
    if(storyChapter){storyChapter.style.opacity=String(intro);storyChapter.style.transform=`translate3d(0,${(1-intro)*16}px,0)`}
    if(storyLineOne){storyLineOne.style.opacity=String(intro);storyLineOne.style.transform=`translate3d(0,${(1-intro)*108}%,0)`}
    if(storyLineTwo){storyLineTwo.style.opacity=String(accent);storyLineTwo.style.transform=`translate3d(0,${(1-accent)*108}%,0) scale(${.94+accent*.06})`}
    if(productIntro){productIntro.style.opacity=String(description);productIntro.style.transform=`translate3d(0,${(1-description)*20}px,0)`}
    const inset=13*(1-photo);
    productMask.style.clipPath=`inset(0 ${inset}% 0 ${inset}% round ${2+value*16}px)`;
    productMask.style.opacity=String(photo);
    productMask.style.transform=`translate3d(0,${(1-photo)*28-outro*14}px,0) scale(${.97+photo*.03-outro*.012})`;
    productSection.style.setProperty('--story-light',String(photo*(1-outro*.35)));
    productImage.style.transform=`scale(${1.12-photo*.12})`;productImage.style.filter=`brightness(${.82+photo*.18})`;
    const active=photo<.06?-1:Math.min(2,Math.floor(photo*3));
    storyFacts.forEach((fact,index)=>fact.classList.toggle('active',index===active));
    }
  }
  if(immersivePhoto){
    const rect=immersivePhoto.getBoundingClientRect();
    const photoProgress=clamp((innerHeight*.86-rect.top)/(innerHeight*.72));
    if(!reduced)immersivePhoto.style.clipPath=`inset(0 ${9*(1-photoProgress)}% round ${8+photoProgress*10}px)`;
    const image=$('img',immersivePhoto);if(image&&!reduced)image.style.transform=`scale(${1.1-photoProgress*.1})`;
  }
  if(!reduced)depthPhotos.forEach(figure=>{const rect=figure.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight)return;const depth=Number(figure.dataset.photoDepth)||0;const image=$('img',figure);if(image)image.style.transform=`translate3d(0,${(innerHeight/2-(rect.top+rect.height/2))*depth}px,0) scale(1.06)`});
  ticking=false;
}
addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(renderScroll);ticking=true}},{passive:true});
addEventListener('resize',renderScroll,{passive:true});
addEventListener('load',renderScroll,{once:true});
addEventListener('pageshow',renderScroll,{passive:true});
renderScroll();

// Lightweight snow: capped pixel ratio, 30 FPS, fewer particles and no
// expensive canvas filters. It starts on the first paint and pauses in a
// background tab.
if(!reduced){
  const canvas=$('.snow-canvas');
  const ctx=canvas?.getContext('2d',{alpha:true,desynchronized:true});
  if(canvas&&ctx){
    let width=0,height=0,dpr=1,flakes=[],frame=0,lastPaint=0,running=false;
    const isMobile=()=>innerWidth<700;
    const flakeCount=()=>isMobile()?20:34;
    function makeFlake(initial=false){const depth=.45+Math.random()*.65;return{x:Math.random()*width,y:initial?Math.random()*height:-12,size:(1.1+Math.random()*2.8)*depth,speed:(22+Math.random()*34)*depth,wind:(Math.random()-.5)*7,phase:Math.random()*Math.PI*2,angle:Math.random()*Math.PI,spin:(Math.random()-.5)*.5,alpha:(.28+Math.random()*.42)*depth,crystal:Math.random()>.76}}
    function setupSnow(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,isMobile()?1:1.35);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;ctx.setTransform(dpr,0,0,dpr,0,0);flakes=Array.from({length:flakeCount()},()=>makeFlake(true));drawSnow(0)}
    function drawCrystal(f){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.angle);ctx.strokeStyle=`rgba(247,251,255,${f.alpha})`;ctx.lineWidth=.6;ctx.beginPath();for(let arm=0;arm<6;arm++){const angle=arm*Math.PI/3,r=f.size*1.45;ctx.moveTo(0,0);ctx.lineTo(Math.cos(angle)*r,Math.sin(angle)*r)}ctx.stroke();ctx.restore()}
    function drawSnow(delta){ctx.clearRect(0,0,width,height);for(const f of flakes){f.y+=f.speed*delta;f.x+=(f.wind+Math.sin(f.phase+f.y*.012)*5)*delta;f.angle+=f.spin*delta;if(f.y>height+14||f.x<-18||f.x>width+18)Object.assign(f,makeFlake());if(f.crystal)drawCrystal(f);else{ctx.beginPath();ctx.fillStyle=`rgba(247,251,255,${f.alpha})`;ctx.arc(f.x,f.y,Math.max(.65,f.size*.35),0,Math.PI*2);ctx.fill()}}}
    function animateSnow(time){if(!running)return;frame=requestAnimationFrame(animateSnow);if(time-lastPaint<33)return;const delta=Math.min(.05,(time-lastPaint||33)/1000);lastPaint=time;drawSnow(delta)}
    function startSnow(){if(running)return;running=true;lastPaint=performance.now()-34;frame=requestAnimationFrame(animateSnow)}
    function stopSnow(){running=false;cancelAnimationFrame(frame)}
    setupSnow();startSnow();
    addEventListener('resize',setupSnow,{passive:true});
    addEventListener('pageshow',startSnow,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSnow();else startSnow()});
  }
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
  let index=1,startX=0,currentX=0,dragging=false,moved=false;
  const counter=$('[data-gallery-current]');
  const totalLabel=$('[data-gallery-total]');if(totalLabel)totalLabel.textContent=String(total).padStart(2,'0');
  function updateCounter(){counter.textContent=String(index===0?total:index===total+1?1:index).padStart(2,'0')}
  function move(animate=true){galleryTrack.style.transition=animate?'transform .65s var(--ease)':'none';galleryTrack.style.transform=`translate3d(-${index*100}%,0,0)`;updateCounter()}
  function normalize(){if(index===0){index=total;move(false)}else if(index===total+1){index=1;move(false)}}
  galleryTrack.addEventListener('transitionend',normalize);
  $('[data-gallery-prev]')?.addEventListener('click',()=>{if(index<=0)return;index--;move()});
  $('[data-gallery-next]')?.addEventListener('click',()=>{if(index>=total+1)return;index++;move()});
  galleryTrack.addEventListener('pointerdown',event=>{dragging=true;moved=false;startX=event.clientX;currentX=startX;galleryTrack.setPointerCapture(event.pointerId);galleryTrack.style.transition='none'});
  galleryTrack.addEventListener('pointermove',event=>{if(!dragging)return;currentX=event.clientX;moved=moved||Math.abs(currentX-startX)>6;galleryTrack.style.transform=`translate3d(calc(-${index*100}% + ${currentX-startX}px),0,0)`});
  galleryTrack.addEventListener('pointerup',()=>{if(!dragging)return;dragging=false;const delta=currentX-startX;if(Math.abs(delta)>45)index+=delta<0?1:-1;move()});
  galleryTrack.addEventListener('pointercancel',()=>{dragging=false;move()});
  const lightbox=$('.photo-lightbox'),lightboxImage=$('.photo-lightbox img'),lightboxCaption=$('.photo-lightbox figcaption');
  let lightboxIndex=0;
  function showLightbox(nextIndex){
    if(!lightbox||!lightboxImage)return;
    lightboxIndex=(nextIndex+total)%total;
    const slide=originalSlides[lightboxIndex],image=$('img',slide);
    lightboxImage.src=image.currentSrc||image.src;lightboxImage.alt=image.alt;
    lightboxCaption.textContent=$('figcaption',slide)?.textContent||'';
    if(!lightbox.open)lightbox.showModal();
  }
  galleryTrack.addEventListener('click',event=>{if(moved||!event.target.matches('img'))return;const source=event.target.getAttribute('src');const selected=originalSlides.findIndex(slide=>$('img',slide)?.getAttribute('src')===source);showLightbox(selected<0?0:selected)});
  $('.lightbox-close')?.addEventListener('click',()=>lightbox?.close());
  $('.lightbox-prev')?.addEventListener('click',()=>showLightbox(lightboxIndex-1));
  $('.lightbox-next')?.addEventListener('click',()=>showLightbox(lightboxIndex+1));
  lightbox?.addEventListener('click',event=>{if(event.target===lightbox)lightbox.close()});
  lightbox?.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')showLightbox(lightboxIndex-1);if(event.key==='ArrowRight')showLightbox(lightboxIndex+1)});
  const lightboxFigure=$('.photo-lightbox figure');let lightboxStartX=0;
  lightboxFigure?.addEventListener('pointerdown',event=>{lightboxStartX=event.clientX;lightboxFigure.setPointerCapture(event.pointerId)});
  lightboxFigure?.addEventListener('pointerup',event=>{const delta=event.clientX-lightboxStartX;if(Math.abs(delta)>45)showLightbox(lightboxIndex+(delta<0?1:-1))});
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
