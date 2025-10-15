/* -------------------------
   Canvas: aura + particle flow
   ------------------------- */
(function(){
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d', {alpha:true});
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const DPR = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = w * DPR; canvas.height = h * DPR;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.scale(DPR, DPR);

  window.addEventListener('resize', () => {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    canvas.width = w * DPR; canvas.height = h * DPR;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.scale(DPR, DPR);
  });

  // particles
  const NUM = Math.round(Math.max(60, Math.min(220, (w*h)/25000)));
  const particles = [];
  const center = { x: w/2, y: h/2 };
  let mouse = { x: center.x, y: center.y, vx:0, vy:0 };

  function rand(min,max){ return Math.random()*(max-min)+min; }

  for(let i=0;i<NUM;i++){
    const a = Math.random()*Math.PI*2;
    const r = rand(20, Math.sqrt(w*w + h*h)/2 * rand(0.06,0.9));
    particles.push({
      angle: a,
      radius: r,
      speed: rand(0.0006,0.0035),
      size: rand(0.6,3.4),
      hue: rand(200,270),
      alpha: rand(0.08,0.7),
      phase: rand(0,Math.PI*2),
      tw: rand(0.3,1.6)
    });
  }

  // small orbs for sparkle
  const orbs = [];
  for(let i=0;i<Math.round(NUM*0.08);i++){
    orbs.push({
      x: rand(0,w),
      y: rand(0,h),
      vx: rand(-0.08,0.08),
      vy: rand(-0.08,0.08),
      r: rand(0.6,2.6),
      life: rand(80,240),
      hue: rand(190,260)
    });
  }

  // animate
  let t = 0;
  function draw(){
    t += 1;
    // subtle background gradient with moving band
    ctx.clearRect(0,0,w,h);
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, 'rgba(2,3,5,0.85)');
    g.addColorStop(0.5, 'rgba(6,8,12,0.72)');
    g.addColorStop(1, 'rgba(2,3,6,0.88)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // ambient radial glow at center
    const rg = ctx.createRadialGradient(center.x, center.y, 40, center.x, center.y, Math.max(w,h)*0.9);
    rg.addColorStop(0, 'rgba(92,180,255,0.06)');
    rg.addColorStop(0.25, 'rgba(177,125,255,0.03)');
    rg.addColorStop(1, 'rgba(10,12,16,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0,0,w,h);

    // trails layer
    ctx.globalCompositeOperation = 'lighter';
    particles.forEach((p, i) => {
      // update angle with a slow wobble influenced by mouse
      const dx = (mouse.x - center.x) * 0.00008;
      const dy = (mouse.y - center.y) * 0.00008;
      p.angle += p.speed + Math.sin(p.phase + t * 0.002 * p.tw) * 0.0006 + dx + dy;
      p.phase += 0.003;

      // radius slowly oscillates
      const rr = p.radius + Math.sin(t*0.002 + p.phase) * (p.radius*0.02);

      const x = center.x + Math.cos(p.angle) * rr;
      const y = center.y + Math.sin(p.angle) * rr;

      // luminosity gradient for particle
      const rad = p.size * (1 + Math.abs(Math.sin(t*0.01 + p.phase)) * 1.8);
      const gradient = ctx.createRadialGradient(x,y,0,x,y,rad*6);
      gradient.addColorStop(0, `hsla(${p.hue},95%,70%,${p.alpha})`);
      gradient.addColorStop(0.12, `hsla(${p.hue},85%,60%,${p.alpha*0.45})`);
      gradient.addColorStop(0.35, `hsla(${p.hue+20},75%,50%,${p.alpha*0.08})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(x,y, rad*3.6, 0, Math.PI*2);
      ctx.fill();

      // soft streak
      ctx.strokeStyle = `hsla(${p.hue},80%,60%,${p.alpha*0.12})`;
      ctx.lineWidth = Math.max(0.2, p.size*0.6);
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(p.angle)*6, y - Math.sin(p.angle)*6);
      ctx.lineTo(x + Math.cos(p.angle)*8, y + Math.sin(p.angle)*8);
      ctx.stroke();
    });

    // orbs (slow floaters)
    orbs.forEach((o, idx) => {
      o.x += o.vx + Math.sin(t*0.002 + idx)*0.02;
      o.y += o.vy + Math.cos(t*0.001 + idx)*0.02;
      if(o.x < -30) o.x = w + 30;
      if(o.x > w + 30) o.x = -30;
      if(o.y < -30) o.y = h + 30;
      if(o.y > h + 30) o.y = -30;

      const og = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r*12);
      og.addColorStop(0, `hsla(${o.hue},90%,70%,0.85)`);
      og.addColorStop(0.25, `hsla(${o.hue},80%,60%,0.18)`);
      og.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.fillStyle = og;
      ctx.arc(o.x,o.y,o.r*6,0,Math.PI*2);
      ctx.fill();
    });

    // faint scanning lines
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(120,160,255,0.015)`;
    const step = 40;
    for(let y=0;y<h;y+=step){
      const offset = Math.sin((t*0.002)+(y*0.01))*6;
      ctx.moveTo(0, y+offset);
      ctx.lineTo(w, y+offset+ (Math.cos((t*0.001)+(y*0.005))*2));
    }
    ctx.stroke();

    // restore
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(draw);
  }

  // parallax mouse
  window.addEventListener('mousemove', e=>{
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // small idle motion for center
  setInterval(()=> {
    center.x = innerWidth*0.5 + Math.sin(t*0.0009)*20;
    center.y = innerHeight*0.5 + Math.cos(t*0.0007)*14;
  }, 60);

  draw();
})();

/* -------------------------
   Small accessible enhancements & parallax
   ------------------------- */
(function(){
  // Focus outline for keyboard users
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Tab'){
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  });

  // subtle parallax for sigil element react to mouse
  const sigil = document.querySelector('.sigil');
  const title = document.querySelector('.title');

  window.addEventListener('mousemove', (ev) => {
    const cx = window.innerWidth/2, cy = window.innerHeight/2;
    const dx = (ev.clientX - cx)/cx;
    const dy = (ev.clientY - cy)/cy;
    const rot = dx * 6;
    if(sigil){
      sigil.style.transform = `translate(-50%,-50%) rotate(${rot}deg) translateZ(0)`;
      sigil.style.left = 50 + dx*2 + '%';
      sigil.style.top = 50 + dy*2 + '%';
    }
    if(title){
      title.style.textShadow = `${-dx*6}px ${dy*6}px 12px rgba(30,40,60,0.6), 0 8px 30px rgba(0,0,0,0.7)`;
    }
  });

  // small demo actions (hash navigation)
  const btnExplore = document.getElementById('btnExplore');
  const btnAbout = document.getElementById('btnAbout');
  if(btnExplore) btnExplore.addEventListener('click', ()=>{ location.hash = 'explore'; });
  if(btnAbout) btnAbout.addEventListener('click', ()=>{ location.hash = 'about'; });
})();
