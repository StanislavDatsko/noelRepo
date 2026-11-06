const $=(selector,context=document)=>context.querySelector(selector);
const $$=(selector,context=document)=>[...context.querySelectorAll(selector)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');
const afterFirstPaint=callback=>requestAnimationFrame(()=>requestAnimationFrame(callback));
afterFirstPaint(()=>document.documentElement.classList.add('effects-ready'));

// Editorial reveals
const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target)}
}),{threshold:.04,rootMargin:'0px 0px 8%'});
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
const storyCopy=$('[data-cinematic-copy]',productSection);
const productShade=$('.product-shade');
const immersivePhoto=$('[data-photo-reveal]');
const immersiveImage=$('img',immersivePhoto);
const depthPhotos=$$('[data-photo-depth]').map(figure=>({figure,image:$('img',figure),depth:Number(figure.dataset.photoDepth)||0,top:0,height:0}));
const sticky=$('.sticky-buy'),order=$('#order'),hero=$('.hero');
const clamp=value=>Math.min(1,Math.max(0,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t)};
const phase=(value,start,end)=>ease((value-start)/(end-start));
const layout={maxScroll:1,headlineStart:0,storyEnd:1,immersiveTop:0,immersiveHeight:0,heroHeight:0,orderTop:0,orderBottom:0};
let ticking=false,measureTicking=false,storyCur=null,storySmoothing=false;
const productFacts=$('.product-facts');
function measureLayout(){
  layout.maxScroll=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  if(productSection){const top=productSection.getBoundingClientRect().top+scrollY,travel=Math.max(1,productSection.offsetHeight-innerHeight);layout.headlineStart=top+(storyCopy?.offsetTop||64)-innerHeight*.7;layout.storyEnd=top+travel}
  if(immersivePhoto){const rect=immersivePhoto.getBoundingClientRect();layout.immersiveTop=rect.top+scrollY;layout.immersiveHeight=rect.height}
  depthPhotos.forEach(item=>{const rect=item.figure.getBoundingClientRect();item.top=rect.top+scrollY;item.height=rect.height});
  layout.heroHeight=hero?.offsetHeight||innerHeight;
  if(order){const rect=order.getBoundingClientRect();layout.orderTop=rect.top+scrollY;layout.orderBottom=layout.orderTop+rect.height}
  measureTicking=false;
}
function scheduleMeasure(){if(measureTicking)return;measureTicking=true;requestAnimationFrame(()=>{measureLayout();renderScroll()})}
function renderScroll(){
  const y=scrollY;
  progressBar.style.transform=`scaleX(${y/layout.maxScroll})`;
  if(!reduced&&heroProduct&&scrollY<innerHeight*1.2){if(scrollY>4)heroProduct.style.transform=`translate3d(0,${scrollY*.045}px,0) scale(${1+scrollY*.000035})`;else heroProduct.style.removeProperty('transform')}
  if(productSection&&productMask){
    if(reduced){
      [storyChapter,storyLineOne,storyLineTwo,productIntro,productMask,productImage].forEach(element=>{element?.style.removeProperty('opacity');element?.style.removeProperty('transform');element?.style.removeProperty('filter');element?.style.removeProperty('clip-path')});
      productSection.style.setProperty('--story-light','.55');
      storyFacts.forEach(fact=>fact.classList.add('active'));
      productFacts?.style.removeProperty('opacity');productFacts?.style.removeProperty('transform');
    }else{
    const target=clamp((y-layout.headlineStart)/Math.max(1,layout.storyEnd-layout.headlineStart));
    if(storyCur===null)storyCur=target;
    storyCur+=(target-storyCur)*.16;
    if(Math.abs(target-storyCur)>.0004){if(!storySmoothing){storySmoothing=true;requestAnimationFrame(()=>{storySmoothing=false;renderScroll()})}}else storyCur=target;
    const value=storyCur;
    const intro=phase(value,0,.26),accent=phase(value,.12,.42),photo=phase(value,.38,.7),description=phase(value,.7,.86),outro=phase(value,.9,1);
    if(storyChapter){storyChapter.style.opacity=String(intro);storyChapter.style.transform=`translate3d(0,${(1-intro)*16}px,0)`}
    if(storyLineOne){storyLineOne.style.opacity=String(intro);storyLineOne.style.transform=`translate3d(0,${(1-intro)*108}%,0)`}
    if(storyLineTwo){storyLineTwo.style.opacity=String(accent);storyLineTwo.style.transform=`translate3d(0,${(1-accent)*108}%,0) scale(${.94+accent*.06})`}
    if(productIntro){productIntro.style.opacity=String(description);productIntro.style.transform=`translate3d(0,${(1-description)*20}px,0)`}
    productMask.style.opacity=String(photo);
    productMask.style.transform=`translate3d(0,${(1-photo)*14-outro*6}px,0)`;
    productSection.style.setProperty('--story-light',String(photo*(1-outro*.35)));
    productImage.style.transform='scale(1.01)';
    if(productShade)productShade.style.opacity=String(.48-photo*.26);
    const factsProgress=phase(value,.78,.98);
    if(productFacts){const show=phase(value,.72,.84);productFacts.style.opacity=String(show);productFacts.style.transform=`translate3d(0,${(1-show)*14}px,0)`}
    const active=factsProgress<.08?-1:Math.min(2,Math.floor(factsProgress*3));
    storyFacts.forEach((fact,index)=>fact.classList.toggle('active',index===active));
    }
  }
  if(immersivePhoto){
    const photoTop=layout.immersiveTop-y;
    const photoProgress=clamp((innerHeight*.86-photoTop)/(innerHeight*.72));
    if(!reduced)immersivePhoto.style.clipPath=`inset(0 ${9*(1-photoProgress)}% round ${8+photoProgress*10}px)`;
    if(immersiveImage&&!reduced)immersiveImage.style.transform=`scale(${1.1-photoProgress*.1})`;
  }
  if(!reduced)depthPhotos.forEach(item=>{const top=item.top-y;if(top+item.height<0||top>innerHeight)return;if(item.image)item.image.style.transform=`translate3d(0,${(innerHeight/2-(top+item.height/2))*item.depth}px,0) scale(1.06)`});
  if(sticky){const orderVisible=y+innerHeight>layout.orderTop&&y<layout.orderBottom;sticky.classList.toggle('show',y>layout.heroHeight*.68&&!orderVisible)}
  ticking=false;
}
addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(renderScroll);ticking=true}},{passive:true});
addEventListener('resize',scheduleMeasure,{passive:true});
addEventListener('load',scheduleMeasure,{once:true});
addEventListener('pageshow',scheduleMeasure,{passive:true});
document.fonts?.ready.then(scheduleMeasure);
new ResizeObserver(scheduleMeasure).observe(document.body);
measureLayout();renderScroll();

// A real, configurable urgency cue. Without a configured deadline it counts down
// to the next daily offer refresh rather than inventing a false expiry date.
const offerTimer=$('[data-offer-timer]'),offerTimerLabel=$('[data-offer-timer-label]');
if(offerTimer){
  const configuredDeadline=window.STORE_CONFIG?.offerDeadline;
  const parsedDeadline=configuredDeadline?Date.parse(configuredDeadline):NaN;
  let target=Number.isFinite(parsedDeadline)?parsedDeadline:0;
  if(target)offerTimerLabel.textContent='До завершення акції залишилось';
  const nextRefresh=()=>{const date=new Date();date.setHours(24,0,0,0);return date.getTime()};
  const renderOfferTimer=()=>{
    if(!target||target<=Date.now())target=nextRefresh();
    const seconds=Math.max(0,Math.floor((target-Date.now())/1000));
    const hours=String(Math.floor(seconds/3600)).padStart(2,'0');
    const minutes=String(Math.floor(seconds%3600/60)).padStart(2,'0');
    const secs=String(seconds%60).padStart(2,'0');
    offerTimer.textContent=`${hours}:${minutes}:${secs}`;
  };
  renderOfferTimer();setInterval(renderOfferTimer,1000);
}

// Lightweight snow: capped pixel ratio, 30 FPS, fewer particles and no
// expensive canvas filters. It starts on the first paint and pauses in a
// background tab.
if(!reduced){
  const canvas=$('.snow-canvas');
  const ctx=canvas?.getContext('2d',{alpha:true,desynchronized:true});
  if(canvas&&ctx){
    let width=0,height=0,dpr=1,flakes=[],frame=0,lastPaint=0,running=false,resizeFrame=0;
    const isMobile=()=>innerWidth<700;
    const flakeCount=()=>isMobile()?12:20;
    const crystalPath=new Path2D();
    for(let arm=0;arm<6;arm++){const angle=arm*Math.PI/3,x=Math.cos(angle),y=Math.sin(angle);crystalPath.moveTo(0,0);crystalPath.lineTo(x*1.45,y*1.45);for(const side of [-1,1]){const branch=angle+side*.58;crystalPath.moveTo(x*.86,y*.86);crystalPath.lineTo(x*.86+Math.cos(branch)*.36,y*.86+Math.sin(branch)*.36)}}
    function resetFlake(f,initial=false){const depth=.55+Math.random()*.7;f.x=Math.random()*width;f.y=initial?Math.random()*height:-24;f.size=(2.4+Math.random()*4.2)*depth;f.speed=(18+Math.random()*28)*depth;f.wind=(Math.random()-.5)*6;f.phase=Math.random()*Math.PI*2;f.angle=Math.random()*Math.PI;f.spin=(Math.random()-.35)*.35;f.alpha=(.3+Math.random()*.38)*depth;f.crystal=Math.random()>.8;return f}
    function setupSnow(){width=innerWidth;height=Math.round(canvas.getBoundingClientRect().height)||innerHeight;dpr=Math.min(devicePixelRatio||1,isMobile()?1:1.25);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);flakes=Array.from({length:flakeCount()},()=>resetFlake({},true));drawSnow(0)}
    function drawCrystal(f){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.angle);ctx.scale(f.size*1.5,f.size*1.5);ctx.globalAlpha=f.alpha+.12;ctx.lineWidth=.42/(f.size*1.5);ctx.stroke(crystalPath);ctx.restore()}
    function drawSnow(delta){ctx.clearRect(0,0,width,height);ctx.fillStyle='#f7fbff';ctx.strokeStyle='#f7fbff';for(const f of flakes){f.y+=f.speed*delta;f.x+=(f.wind+Math.sin(f.phase+f.y*.012)*5)*delta;f.angle+=f.spin*delta;if(f.y>height+14||f.x<-18||f.x>width+18)resetFlake(f);if(f.crystal)drawCrystal(f);else{ctx.globalAlpha=f.alpha;ctx.beginPath();ctx.arc(f.x,f.y,Math.max(1.3,f.size*.62),0,6.2832);ctx.fill()}}ctx.globalAlpha=1}
    function animateSnow(time){if(!running)return;frame=requestAnimationFrame(animateSnow);const delta=Math.min(.03,(time-lastPaint||16)/1000);lastPaint=time;drawSnow(delta)}
    function startSnow(){if(running||document.hidden)return;running=true;lastPaint=performance.now()-16;frame=requestAnimationFrame(animateSnow)}
    function stopSnow(){running=false;cancelAnimationFrame(frame)}
    setupSnow();afterFirstPaint(startSnow);
    let snowWidth=innerWidth;addEventListener('resize',()=>{if(innerWidth===snowWidth)return;snowWidth=innerWidth;cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(setupSnow)},{passive:true});
    addEventListener('pageshow',startSnow,{passive:true});
    addEventListener('pagehide',stopSnow,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSnow();else startSnow()});
  }
}

// The video keeps its poster on initial load. Its source is attached only when
// the section is close, and playback starts only while it is actually visible.
const deferredVideo=$('[data-deferred-video]');
if(deferredVideo){
  const source=$('source[data-src]',deferredVideo);let videoLoaded=false;
  const loadVideo=()=>{if(videoLoaded||!source)return;videoLoaded=true;source.src=source.dataset.src;source.removeAttribute('data-src');deferredVideo.load()};
  const loadObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){loadVideo();loadObserver.disconnect()}},{rootMargin:'500px 0px'});
  const playObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){loadVideo();if(!reduced&&deferredVideo.hasAttribute('data-autoplay'))deferredVideo.play().catch(()=>{})}else deferredVideo.pause()}),{threshold:.15});
  loadObserver.observe(deferredVideo);playObserver.observe(deferredVideo);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)deferredVideo.pause();else if(!reduced&&deferredVideo.getBoundingClientRect().top<innerHeight&&deferredVideo.getBoundingClientRect().bottom>0)deferredVideo.play().catch(()=>{})});
}

// Nine records interaction
const vinyls=$$('.vinyl');
const recordNumber=$('#record-number'),recordTitle=$('#record-title'),recordText=$('#record-text');
vinyls.forEach(vinyl=>vinyl.addEventListener('click',()=>{
  vinyls.forEach(item=>{item.classList.remove('active');item.setAttribute('aria-selected','false')});
  vinyl.classList.add('active');vinyl.setAttribute('aria-selected','true');
  const info=recordTitle.closest('.record-info');
  const apply=()=>{recordNumber.textContent=`Платівка ${vinyl.dataset.number}`;recordTitle.textContent=vinyl.dataset.title;recordText.textContent=vinyl.dataset.text;info?.classList.remove('swap')};
  if(reduced||!info){apply();return}
  info.classList.add('swap');clearTimeout(info._t);info._t=setTimeout(apply,180);
}));

// Decorative gift opening
const giftBox=$('.gift-box'),giftMessage=$('.gift-message');
const toggleGift=()=>{if(!giftBox)return;const open=giftBox.classList.toggle('open');giftBox.setAttribute('aria-expanded',String(open));giftMessage.classList.toggle('visible',open);$('small',giftBox).textContent=open?'Ваш особливий момент':'Натисніть, щоб відкрити'};
giftBox?.addEventListener('click',toggleGift);

// Infinite one-slide gallery with buttons and touch gestures
const galleryTrack=$('.gallery-track');
if(galleryTrack){
  const galleryViewport=$('.gallery-viewport');
  const originalSlides=$$('figure',galleryTrack),total=originalSlides.length;
  const first=originalSlides[0].cloneNode(true),last=originalSlides[total-1].cloneNode(true);
  first.setAttribute('aria-hidden','true');last.setAttribute('aria-hidden','true');galleryTrack.prepend(last);galleryTrack.append(first);
  let index=1,startX=0,currentX=0,dragging=false,moved=false;
  const counter=$('[data-gallery-current]');
  const totalLabel=$('[data-gallery-total]');if(totalLabel)totalLabel.textContent=String(total).padStart(2,'0');
  function updateCounter(){counter.textContent=String(index===0?total:index===total+1?1:index).padStart(2,'0')}
  function move(animate=true){animate=animate&&!reduced;galleryTrack.style.willChange=animate?'transform':'auto';galleryTrack.style.transition=animate?'transform .65s var(--ease)':'none';galleryTrack.style.transform=`translate3d(-${index*100}%,0,0)`;updateCounter();if(!animate)normalizeSoon()}
  let normalizing=false;function normalizeSoon(){if(index!==0&&index!==total+1)return;if(normalizing)return;normalizing=true;requestAnimationFrame(()=>{normalizing=false;normalize()})}
  function normalize(){if(index===0){index=total;move(false)}else if(index===total+1){index=1;move(false)}void galleryTrack.offsetWidth;galleryTrack.style.willChange='auto'}
  galleryTrack.addEventListener('transitionend',event=>{if(event.target===galleryTrack&&event.propertyName==='transform')normalize()});
  $('[data-gallery-prev]')?.addEventListener('click',()=>{if(index<=0)return;index--;move()});
  $('[data-gallery-next]')?.addEventListener('click',()=>{if(index>=total+1)return;index++;move()});
  const finishDrag=()=>{if(!dragging)return;dragging=false;const delta=currentX-startX;if(Math.abs(delta)>45)index=Math.min(total+1,Math.max(0,index+(delta<0?1:-1)));move()};
  galleryViewport?.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button!==0)return;dragging=true;moved=false;startX=event.clientX;currentX=startX;galleryViewport._pid=event.pointerId;galleryTrack.style.willChange='transform';galleryTrack.style.transition='none'});
  galleryViewport?.addEventListener('pointermove',event=>{if(!dragging)return;currentX=event.clientX;if(!moved&&Math.abs(currentX-startX)>6){moved=true;if(event.pointerType==='mouse')galleryViewport.setPointerCapture?.(event.pointerId)}galleryTrack.style.transform=`translate3d(calc(-${index*100}% + ${currentX-startX}px),0,0)`});
  galleryViewport?.addEventListener('pointerup',finishDrag);
  galleryViewport?.addEventListener('pointercancel',()=>{dragging=false;move()});
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

// Mouse-only magnetic CTA
if(matchMedia('(hover:hover) and (pointer:fine)').matches&&!reduced){$$('.magnetic').forEach(button=>{button.addEventListener('pointermove',event=>{const rect=button.getBoundingClientRect(),x=(event.clientX-rect.left-rect.width/2)*.12,y=(event.clientY-rect.top-rect.height/2)*.18;button.style.translate=`${x}px ${y}px`});button.addEventListener('pointerleave',()=>button.style.translate='')})}

// Order form and traffic attribution
$$('input[name=phone]').forEach(phone=>phone.addEventListener('input',event=>{let value=event.target.value.replace(/\D/g,'');if(value.startsWith('380'))value=value.slice(0,12);else if(value.startsWith('0'))value=`38${value.slice(0,10)}`;else value=`380${value.slice(0,9)}`;event.target.value=`+${value}`}));
function trafficData(){const params=new URLSearchParams(location.search),keys=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid','ttclid'];return Object.fromEntries(keys.filter(key=>params.get(key)).map(key=>[key,params.get(key)]))}
$$('.order-form').forEach(orderForm=>orderForm.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,button=$('button[type=submit]',form),status=$('.form-status',form),data=Object.fromEntries(new FormData(form));
  if(data.name.trim().length<2||!/^\+380\d{9}$/.test(data.phone)||!data.consent){status.textContent='Перевірте ім’я, номер у форматі +380 та згоду на обробку даних.';status.className='form-status error';return}
  button.disabled=true;button.innerHTML='Надсилаємо…';status.textContent='';status.className='form-status';Object.assign(data,{product:window.STORE_CONFIG?.product||'Різдвяний магнітний мініпрогравач',price:window.STORE_CONFIG?.currencyPrice||'1422.98',traffic:trafficData()});
  try{const response=await fetch('/api/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),result=await response.json().catch(()=>({}));if(!response.ok)throw Error(result.error);status.textContent='Дякуємо! Ваша заявка прийнята — незабаром ми зателефонуємо.';status.className='form-status success';button.innerHTML='Заявку прийнято <span class="done">✓</span>';form.reset();window.dataLayer?.push({event:'Lead'})}
  catch{status.textContent='Не вдалося надіслати заявку. Перевірте з’єднання або спробуйте ще раз.';status.className='form-status error';button.disabled=false;button.innerHTML='Отримати зі знижкою <span>→</span>'}
}));

// Smooth accordion: animate the <details> height with the Web Animations API
$$('.accordion details').forEach(details=>{
  const summary=$('summary',details);let anim=null;
  summary.addEventListener('click',event=>{
    event.preventDefault();
    if(anim){anim.cancel();anim=null}
    const opening=!details.open,start=details.offsetHeight;
    if(opening){
      details.open=true;
    }
    const end=opening?details.scrollHeight:summary.offsetHeight;
    if(reduced){if(!opening)details.open=false;return}
    details.style.overflow='hidden';
    anim=details.animate({height:[`${start}px`,`${end}px`]},{duration:opening?450:350,easing:'cubic-bezier(.22,.7,0,1)'});
    const done=()=>{anim=null;details.style.overflow='';if(!opening)details.open=false};
    anim.onfinish=done;anim.oncancel=()=>{anim=null};
  });
});
