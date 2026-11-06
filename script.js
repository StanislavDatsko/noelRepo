/* NOËL landing — interactions & motion */
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer=matchMedia('(hover:hover) and (pointer:fine)').matches;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const ease=v=>{const t=clamp(v);return t*t*(3-2*t)};
const phase=(v,a,b)=>ease((v-a)/(b-a));
document.documentElement.classList.add('js');
const afterPaint=cb=>requestAnimationFrame(()=>requestAnimationFrame(cb));

/* ---------- Text splitting ---------- */
function splitWords(el,{mask=true}={}){
  let i=0;
  const walk=(node,inEm)=>{
    [...node.childNodes].forEach(ch=>{
      if(ch.nodeType===3){
        const frag=document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(part=>{
          if(!part)return;
          if(/^\s+$/.test(part)){frag.append(' ');return}
          if(mask){
            const w=document.createElement('span'),wi=document.createElement('span');
            w.className='w';wi.className='wi'+(inEm?' em':'');wi.style.setProperty('--i',i++);wi.textContent=part;w.append(wi);frag.append(w);
          }else{
            const s=document.createElement('span');s.className='sw';s.textContent=part;frag.append(s);
          }
        });
        ch.replaceWith(frag);
      }else if(ch.nodeType===1&&ch.tagName!=='BR')walk(ch,inEm||ch.tagName==='EM');
    });
  };
  walk(el,false);
  return i;
}
$$('.split').forEach(el=>{splitWords(el);el.classList.add('is-split')});
const statement=$('[data-words]');
const statementWords=statement?(splitWords(statement,{mask:false}),$$('.sw',statement)):[];

/* ---------- Reveal on view ---------- */
function countUp(el){
  const target=Number(el.dataset.count),prefix=el.dataset.prefix||'',suffix=el.dataset.suffix||'';
  if(reduced){el.textContent=prefix+target+suffix;return}
  const t0=performance.now(),dur=1600;
  const tick=now=>{const p=clamp((now-t0)/dur);el.textContent=prefix+Math.round(target*(1-Math.pow(1-p,4)))+suffix;if(p<1)requestAnimationFrame(tick)};
  requestAnimationFrame(tick);
}
const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(!e.isIntersecting)return;
  e.target.classList.add('in');
  $$('[data-count]',e.target).forEach(countUp);
  revealObserver.unobserve(e.target);
}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
$$('.rv,.split').forEach(el=>revealObserver.observe(el));

/* ---------- Scroll-linked motion ---------- */
const progressBar=$('.scroll-progress i');
const nav=$('[data-nav]');
const sticky=$('.sticky-buy');
const hero=$('.hero');
const story=$('[data-story]');
const steps=$$('[data-step]');
const parallaxImgs=$$('[data-parallax]');
const hideBuy=new Set();
const hideObserver=new IntersectionObserver(es=>es.forEach(e=>{e.isIntersecting?hideBuy.add(e.target):hideBuy.delete(e.target)}),{threshold:0,rootMargin:'0px 0px -10% 0px'});
$$('[data-hide-buy]').forEach(el=>hideObserver.observe(el));

let lastY=scrollY,storyE=0,storyTargetE=0,smoothing=false,ticking=false;
function render(){
  ticking=false;
  const y=scrollY,vh=innerHeight;
  const max=Math.max(1,document.documentElement.scrollHeight-vh);
  progressBar.style.transform=`scaleX(${y/max})`;
  if(nav){const dy=y-lastY;if(y<140)nav.classList.remove('hide');else if(dy>6)nav.classList.add('hide');else if(dy<-6)nav.classList.remove('hide')}
  lastY=y;
  if(sticky&&hero){sticky.classList.toggle('show',y>hero.offsetHeight*.6&&hideBuy.size===0)}

  if(!reduced){
    parallaxImgs.forEach(img=>{
      const r=img.parentElement.getBoundingClientRect();
      if(r.bottom<-100||r.top>vh+100)return;
      const k=Number(img.dataset.parallax)||.05;
      img.style.transform=`translate3d(0,${(vh/2-(r.top+r.height/2))*k}px,0) scale(1.04)`;
    });
    if(story){
      let top=0,n=story;while(n){top+=n.offsetTop;n=n.offsetParent}
      const run=Math.max(1,story.offsetHeight-vh);
      const p=clamp((y-top)/run);
      storyTargetE=phase(p,.02,.42);
      story.style.setProperty('--p',p.toFixed(4));
      const active=p<.46?-1:p<.64?0:p<.82?1:2;
      steps.forEach((s,i)=>s.classList.toggle('active',i===active));
      if(Math.abs(storyTargetE-storyE)>.0005&&!smoothing){smoothing=true;requestAnimationFrame(smoothStory)}
    }
    if(statementWords.length){
      const r=statement.getBoundingClientRect();
      const p=clamp((vh*.82-r.top)/(r.height+vh*.28));
      const lit=Math.round(p*statementWords.length*1.12);
      statementWords.forEach((w,i)=>w.classList.toggle('on',i<lit));
    }
  }
}
function smoothStory(){
  storyE+=(storyTargetE-storyE)*.1;
  if(Math.abs(storyTargetE-storyE)<.0008)storyE=storyTargetE;
  story.style.setProperty('--e',storyE.toFixed(4));
  if(storyE!==storyTargetE)requestAnimationFrame(smoothStory);else smoothing=false;
}
if(reduced){story?.style.setProperty('--e','1');steps.forEach(s=>s.classList.add('active'));statementWords.forEach(w=>w.classList.add('on'));storyE=1}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(render)}},{passive:true});
addEventListener('resize',()=>requestAnimationFrame(render),{passive:true});
addEventListener('load',()=>requestAnimationFrame(render),{once:true});
render();

/* ---------- Hero tilt + spotlight + magnetic ---------- */
if(finePointer&&!reduced){
  const visual=$('[data-tilt]'),card=$('.hero-card');
  visual?.addEventListener('pointermove',e=>{const r=visual.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.setProperty('--ry',`${x*14}deg`);card.style.setProperty('--rx',`${-y*14}deg`)});
  visual?.addEventListener('pointerleave',()=>{card.style.setProperty('--ry','0deg');card.style.setProperty('--rx','0deg')});
  document.addEventListener('pointermove',e=>{const t=e.target.closest?.('.spot');if(!t)return;const r=t.getBoundingClientRect();t.style.setProperty('--mx',`${e.clientX-r.left}px`);t.style.setProperty('--my',`${e.clientY-r.top}px`)},{passive:true});
  $$('.magnetic').forEach(b=>{
    b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();b.style.translate=`${(e.clientX-r.left-r.width/2)*.14}px ${(e.clientY-r.top-r.height/2)*.22}px`});
    b.addEventListener('pointerleave',()=>{b.style.translate=''});
  });
}

/* ---------- Offer timer ---------- */
const timers=$$('[data-offer-timer]'),timerLabels=$$('[data-offer-timer-label]');
if(timers.length){
  const parsed=window.STORE_CONFIG?.offerDeadline?Date.parse(window.STORE_CONFIG.offerDeadline):NaN;
  let target=Number.isFinite(parsed)?parsed:0;
  if(target)timerLabels.forEach(l=>l.textContent='До завершення акції залишилось');
  const nextRefresh=()=>{const d=new Date();d.setHours(24,0,0,0);return d.getTime()};
  const tick=()=>{
    if(!target||target<=Date.now())target=nextRefresh();
    const s=Math.max(0,Math.floor((target-Date.now())/1000));
    const txt=`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    timers.forEach(t=>t.textContent=txt);
  };
  tick();setInterval(tick,1000);
}

/* ---------- Snow: real snowflake crystals only ---------- */
if(!reduced){
  const canvas=$('.snow-canvas'),ctx=canvas?.getContext('2d',{alpha:true});
  if(canvas&&ctx){
    let W=0,H=0,dpr=1,flakes=[],sprites=[],raf=0,last=0,running=false,snowW=innerWidth;
    const mobile=()=>innerWidth<700;
    function makeSprite(size,variant){
      const s=Math.ceil(size*dpr*1.25),c=document.createElement('canvas');c.width=c.height=s;
      const x=c.getContext('2d'),R=size*dpr/2;
      x.translate(s/2,s/2);x.strokeStyle='#f7fbff';x.lineCap='round';x.lineJoin='round';
      x.shadowColor='rgba(185,216,236,.95)';x.shadowBlur=R*.4;
      x.lineWidth=Math.max(1.1*dpr,R*(variant===1?.11:.085));
      const branches=variant===2?[.34,.55,.76]:variant===1?[.5,.74]:[.45,.72];
      for(let a=0;a<6;a++){
        x.save();x.rotate(a*Math.PI/3);x.beginPath();x.moveTo(0,-R*.12);x.lineTo(0,-R);
        branches.forEach((t,k)=>{const L=R*(variant===2?.26-k*.04:.34-k*.07);x.moveTo(0,-R*t);x.lineTo(L*.8,-R*t-L*.75);x.moveTo(0,-R*t);x.lineTo(-L*.8,-R*t-L*.75)});
        x.stroke();
        if(variant===2){x.beginPath();x.moveTo(0,-R);x.lineTo(R*.07,-R*.93);x.moveTo(0,-R);x.lineTo(-R*.07,-R*.93);x.stroke()}
        x.restore();
      }
      if(variant!==0){x.lineWidth=Math.max(1*dpr,R*.06);x.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6,px=Math.cos(a)*R*.2,py=Math.sin(a)*R*.2;i?x.lineTo(px,py):x.moveTo(px,py)}x.closePath();x.stroke()}
      return c;
    }
    function buildSprites(){sprites=[];[16,24,34].forEach(size=>[0,1,2].forEach(v=>sprites.push({size,c:makeSprite(size,v)})))}
    function reset(f,initial){
      const bucket=Math.floor(Math.random()*3),sp=sprites[bucket*3+Math.floor(Math.random()*3)];
      const depth=[.6,.85,1.15][bucket];
      f.sp=sp;f.scale=.85+Math.random()*.3;
      f.x=Math.random()*W;f.y=initial?Math.random()*H:-sp.size*1.5;
      f.speed=(22+Math.random()*26)*(.6+depth*.5);f.wind=(Math.random()-.5)*8;f.phase=Math.random()*6.28;
      f.angle=Math.random()*6.28;f.spin=(Math.random()-.5)*.9;f.alpha=.5+Math.random()*.4;
      return f;
    }
    function setup(){
      dpr=Math.min(devicePixelRatio||1,2);
      W=innerWidth;H=Math.round(canvas.getBoundingClientRect().height)||innerHeight;
      canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
      buildSprites();
      flakes=Array.from({length:mobile()?15:26},()=>reset({},true));
      draw(0);
    }
    function draw(dt){
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
      for(const f of flakes){
        f.y+=f.speed*dt;f.x+=(f.wind+Math.sin(f.phase+f.y*.012)*14)*dt;f.angle+=f.spin*dt;
        if(f.y>H+40||f.x<-50||f.x>W+50)reset(f,false);
        ctx.globalAlpha=f.alpha;
        const c=Math.cos(f.angle)*f.scale,s=Math.sin(f.angle)*f.scale;
        ctx.setTransform(c,s,-s,c,f.x*dpr,f.y*dpr);
        ctx.drawImage(f.sp.c,-f.sp.c.width/2,-f.sp.c.height/2);
      }
      ctx.globalAlpha=1;
    }
    function loop(t){if(!running)return;raf=requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000||.016);last=t;draw(dt)}
    const start=()=>{if(running||document.hidden)return;running=true;last=performance.now();raf=requestAnimationFrame(loop)};
    const stop=()=>{running=false;cancelAnimationFrame(raf)};
    setup();afterPaint(start);
    let rz=0;
    addEventListener('resize',()=>{if(innerWidth===snowW)return;snowW=innerWidth;cancelAnimationFrame(rz);rz=requestAnimationFrame(setup)},{passive:true});
    document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  }
}

/* ---------- Deferred video ---------- */
const video=$('[data-deferred-video]');
if(video){
  const source=$('source[data-src]',video);let loaded=false;
  const load=()=>{if(loaded||!source)return;loaded=true;source.src=source.dataset.src;source.removeAttribute('data-src');video.load()};
  const lo=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){load();lo.disconnect()}},{rootMargin:'500px 0px'});
  const po=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){load();if(!reduced&&video.hasAttribute('data-autoplay'))video.play().catch(()=>{})}else video.pause()}),{threshold:.25});
  lo.observe(video);po.observe(video);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause()});
}

/* ---------- Records ---------- */
const vinyls=$$('.vinyl'),deck=$('[data-deck]'),deckNum=$('#deck-num');
const recNumber=$('#record-number'),recTitle=$('#record-title'),recText=$('#record-text');
vinyls.forEach(v=>v.addEventListener('click',()=>{
  if(v.classList.contains('active'))return;
  vinyls.forEach(i=>{i.classList.remove('active');i.setAttribute('aria-selected','false')});
  v.classList.add('active');v.setAttribute('aria-selected','true');
  const info=recTitle.closest('.record-info');
  const apply=()=>{recNumber.textContent=`Платівка ${v.dataset.number}`;recTitle.textContent=v.dataset.title;recText.textContent=v.dataset.text;deckNum.textContent=v.dataset.number;info.classList.remove('swap')};
  if(reduced){apply();return}
  deck.classList.remove('swap');void deck.offsetWidth;deck.classList.add('swap');
  info.classList.add('swap');clearTimeout(info._t);info._t=setTimeout(apply,200);
}));

/* ---------- Gift ---------- */
const giftBox=$('.gift-box'),giftMessage=$('.gift-message');
giftBox?.addEventListener('click',()=>{
  const open=giftBox.classList.toggle('open');
  giftBox.setAttribute('aria-expanded',String(open));
  giftMessage.classList.toggle('visible',open);
  $('small',giftBox).textContent=open?'Ваш особливий момент':'Натисніть, щоб відкрити';
});

/* ---------- Gallery (buttons + swipe + lightbox) ---------- */
const track=$('.gallery-track');
if(track){
  const viewport=$('.gallery-viewport');
  const slides=$$('figure',track),total=slides.length;
  const first=slides[0].cloneNode(true),last=slides[total-1].cloneNode(true);
  first.setAttribute('aria-hidden','true');last.setAttribute('aria-hidden','true');track.prepend(last);track.append(first);
  let index=1,startX=0,curX=0,dragging=false,moved=false,normalizing=false;
  const counter=$('[data-gallery-current]'),totalLabel=$('[data-gallery-total]');
  if(totalLabel)totalLabel.textContent=String(total).padStart(2,'0');
  const pad=n=>String(n).padStart(2,'0');
  const updateCounter=()=>{counter.textContent=pad(index===0?total:index===total+1?1:index)};
  function normalize(){
    if(index===0){index=total;move(false)}else if(index===total+1){index=1;move(false)}
    track.style.willChange='auto';
  }
  function move(animate=true){
    animate=animate&&!reduced;
    track.style.willChange=animate?'transform':'auto';
    track.style.transition=animate?'transform .7s cubic-bezier(.22,.7,0,1)':'none';
    track.style.transform=`translate3d(-${index*100}%,0,0)`;
    updateCounter();
    if(!animate){void track.offsetWidth;if((index===0||index===total+1)&&!normalizing){normalizing=true;requestAnimationFrame(()=>{normalizing=false;normalize()})}}
  }
  track.addEventListener('transitionend',e=>{if(e.target===track&&e.propertyName==='transform')normalize()});
  $('[data-gallery-prev]')?.addEventListener('click',()=>{if(index<=0)return;index--;move()});
  $('[data-gallery-next]')?.addEventListener('click',()=>{if(index>=total+1)return;index++;move()});
  const finish=()=>{if(!dragging)return;dragging=false;const d=curX-startX;if(Math.abs(d)>45)index=clamp(index+(d<0?1:-1),0,total+1);move()};
  viewport.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;dragging=true;moved=false;startX=curX=e.clientX;track.style.transition='none';track.style.willChange='transform'});
  viewport.addEventListener('pointermove',e=>{
    if(!dragging)return;curX=e.clientX;
    if(!moved&&Math.abs(curX-startX)>6){moved=true;if(e.pointerType==='mouse')viewport.setPointerCapture?.(e.pointerId)}
    track.style.transform=`translate3d(calc(-${index*100}% + ${curX-startX}px),0,0)`;
  });
  viewport.addEventListener('pointerup',finish);
  viewport.addEventListener('pointercancel',()=>{dragging=false;move()});

  const lb=$('.photo-lightbox'),lbImg=$('.photo-lightbox img'),lbCap=$('.photo-lightbox figcaption');
  let lbIndex=0;
  function showLightbox(n){
    if(!lb||!lbImg)return;
    lbIndex=(n+total)%total;
    const slide=slides[lbIndex],img=$('img',slide);
    lbImg.src=img.currentSrc||img.src;lbImg.alt=img.alt;lbCap.textContent=$('figcaption',slide)?.textContent||'';
    if(!lb.open)lb.showModal();
  }
  track.addEventListener('click',e=>{
    if(moved||!e.target.matches('img'))return;
    const src=e.target.getAttribute('src');
    showLightbox(Math.max(0,slides.findIndex(s=>$('img',s)?.getAttribute('src')===src)));
  });
  $('.lightbox-close')?.addEventListener('click',()=>lb?.close());
  $('.lightbox-prev')?.addEventListener('click',()=>showLightbox(lbIndex-1));
  $('.lightbox-next')?.addEventListener('click',()=>showLightbox(lbIndex+1));
  lb?.addEventListener('click',e=>{if(e.target===lb)lb.close()});
  lb?.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')showLightbox(lbIndex-1);if(e.key==='ArrowRight')showLightbox(lbIndex+1)});
  const fig=$('.photo-lightbox figure');let lx=0;
  fig?.addEventListener('pointerdown',e=>{lx=e.clientX});
  fig?.addEventListener('pointerup',e=>{const d=e.clientX-lx;if(Math.abs(d)>45)showLightbox(lbIndex+(d<0?1:-1))});
  move(false);
}

/* ---------- Accordion ---------- */
$$('.accordion details').forEach(details=>{
  const summary=$('summary',details);let anim=null;
  summary.addEventListener('click',e=>{
    e.preventDefault();
    if(anim){anim.cancel();anim=null}
    const opening=!details.open,start=details.offsetHeight;
    if(opening)details.open=true;
    const end=opening?details.scrollHeight:summary.offsetHeight;
    if(reduced){if(!opening)details.open=false;return}
    details.style.overflow='hidden';
    anim=details.animate({height:[`${start}px`,`${end}px`]},{duration:opening?480:360,easing:'cubic-bezier(.22,.7,0,1)'});
    anim.onfinish=()=>{anim=null;details.style.overflow='';if(!opening)details.open=false};
    anim.oncancel=()=>{anim=null};
  });
});

/* ---------- Forms ---------- */
$$('input[name=phone]').forEach(p=>p.addEventListener('input',e=>{
  let v=e.target.value.replace(/\D/g,'');
  if(v.startsWith('380'))v=v.slice(0,12);else if(v.startsWith('0'))v=`38${v.slice(0,10)}`;else v=`380${v.slice(0,9)}`;
  e.target.value=`+${v}`;
}));
const trafficData=()=>{const q=new URLSearchParams(location.search);return Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid','ttclid'].filter(k=>q.get(k)).map(k=>[k,q.get(k)]))};
$$('.order-form').forEach(form=>form.addEventListener('submit',async e=>{
  e.preventDefault();
  const button=$('button[type=submit]',form),label=$('.lbl',button),status=$('.form-status',form),data=Object.fromEntries(new FormData(form));
  const original=button.dataset.label||(button.dataset.label=label.textContent);
  if(data.name.trim().length<2||!/^\+380\d{9}$/.test(data.phone)||!data.consent){status.textContent='Перевірте ім’я, номер у форматі +380 та згоду на обробку даних.';status.className='form-status error';return}
  button.disabled=true;label.textContent='Надсилаємо…';status.textContent='';status.className='form-status';
  Object.assign(data,{product:window.STORE_CONFIG?.product||'Різдвяний магнітний мініпрогравач',price:window.STORE_CONFIG?.currencyPrice||'1422.98',traffic:trafficData()});
  try{
    const res=await fetch('/api/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const result=await res.json().catch(()=>({}));
    if(!res.ok)throw Error(result.error);
    status.textContent='Дякуємо! Ваша заявка прийнята — незабаром ми зателефонуємо.';status.className='form-status success';
    label.textContent='Заявку прийнято';button.classList.add('is-done');form.reset();window.dataLayer?.push({event:'Lead'});
  }catch{
    status.textContent='Не вдалося надіслати заявку. Перевірте з’єднання або спробуйте ще раз.';status.className='form-status error';
    button.disabled=false;label.textContent=original;
  }
}));
