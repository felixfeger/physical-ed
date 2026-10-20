/* Move — interactive PE tools. No dependencies. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var ctx;
  function beep(freq, dur) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = freq; g.gain.value = 0.08;
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch (e) {}
  }
  function num(id, min, max, fallback) {
    var v = parseInt($(id).value, 10);
    if (isNaN(v)) v = fallback;
    return Math.min(max, Math.max(min, v));
  }

  /* ---------- 1. Warm-up guide ---------- */
  var moves = [
    ['March in place', 'Lift your knees and swing your arms. Start easy and build up.'],
    ['Arm circles', 'Big circles forward, then switch to backward halfway through.'],
    ['Torso twists', 'Feet shoulder-width apart. Rotate side to side, arms relaxed.'],
    ['Leg swings', 'Hold a wall or a friend. Swing one leg forward and back, then switch.'],
    ['Bodyweight squats', 'Sit your hips back, chest up, knees tracking over your toes.'],
    ['Lunges with a reach', 'Step forward into a lunge and reach both arms overhead. Alternate legs.'],
    ['High knees', 'Light and quick on the balls of your feet. Pump your arms.'],
    ['Shake it out', 'Let your arms and legs go loose. Take a few deep breaths.']
  ];
  var WSECS = 30, wi = 0, wleft = WSECS, wtimer = null;
  function wRender() {
    $('warm-count').textContent = 'Move ' + (wi + 1) + ' of ' + moves.length;
    $('warm-title').textContent = moves[wi][0];
    $('warm-text').textContent = moves[wi][1];
    $('warm-time').textContent = wleft;
    $('warm-bar').style.width = (((wi * WSECS) + (WSECS - wleft)) / (moves.length * WSECS) * 100) + '%';
    $('warm-prev').disabled = wi === 0;
    $('warm-prev').style.opacity = wi === 0 ? 0.4 : 1;
  }
  function wGo(n) {
    wleft = WSECS;
    if (n >= moves.length) {
      clearInterval(wtimer); wtimer = null;
      $('warm-count').textContent = 'Complete';
      $('warm-title').textContent = 'You are ready';
      $('warm-text').textContent = 'Nice work. Your body is warm and ready to go.';
      $('warm-time').textContent = '0';
      $('warm-bar').style.width = '100%';
      $('warm-play').textContent = 'Restart';
      wi = moves.length;
      beep(880, 0.4);
      return;
    }
    wi = Math.max(0, n); wRender();
  }
  $('warm-play').addEventListener('click', function () {
    if (wi >= moves.length) { wi = 0; wleft = WSECS; wRender(); }
    if (wtimer) { clearInterval(wtimer); wtimer = null; this.textContent = 'Resume'; return; }
    this.textContent = 'Pause';
    wtimer = setInterval(function () {
      wleft--;
      if (wleft <= 0) { beep(660, 0.2); wGo(wi + 1); } else { $('warm-time').textContent = wleft; wRender(); }
    }, 1000);
  });
  $('warm-next').addEventListener('click', function () { if (wi < moves.length) wGo(wi + 1); });
  $('warm-prev').addEventListener('click', function () { if (wi > 0 && wi < moves.length) wGo(wi - 1); });
  wRender();

  /* ---------- 2. Interval timer ---------- */
  var phases = [], pi = 0, left = 0, timer = null, finished = false;
  function build() {
    var work = num('t-work', 5, 600, 30), rest = num('t-rest', 0, 600, 15), rounds = num('t-rounds', 1, 50, 6);
    phases = [];
    for (var r = 1; r <= rounds; r++) {
      phases.push({ type: 'work', secs: work, round: r, total: rounds });
      if (rest > 0 && r < rounds) phases.push({ type: 'rest', secs: rest, round: r, total: rounds });
    }
    pi = 0; left = phases[0].secs; finished = false;
  }
  function tShow() {
    var p = phases[pi], panel = $('t-panel');
    panel.className = 'panel timer-panel ' + p.type;
    $('t-round').textContent = 'Round ' + p.round + ' of ' + p.total;
    $('t-label').textContent = p.type === 'work' ? 'Work' : 'Rest';
    $('t-time').textContent = left;
  }
  function tStop(label) {
    clearInterval(timer); timer = null;
    $('t-play').textContent = label || 'Start';
  }
  function tFinish() {
    tStop('Start again'); finished = true;
    $('t-panel').className = 'panel timer-panel';
    $('t-round').textContent = 'Complete';
    $('t-label').textContent = 'Great work!';
    $('t-time').textContent = '0';
    beep(880, 0.5);
  }
  $('t-play').addEventListener('click', function () {
    if (timer) { tStop('Resume'); return; }
    if (!phases.length || finished) build();
    this.textContent = 'Pause';
    beep(880, 0.3); tShow();
    timer = setInterval(function () {
      left--;
      if (left > 0 && left <= 3) beep(660, 0.1);
      if (left <= 0) {
        pi++;
        if (pi >= phases.length) return tFinish();
        left = phases[pi].secs; beep(880, 0.3);
      }
      tShow();
    }, 1000);
  });
  $('t-reset').addEventListener('click', function () {
    tStop('Start'); phases = []; finished = false;
    $('t-panel').className = 'panel timer-panel';
    $('t-round').textContent = 'Ready';
    $('t-label').textContent = 'Set your times';
    $('t-time').textContent = '0';
  });

  /* ---------- 3. Heart rate zones ---------- */
  var zoneInfo = [
    ['Zone 1: Very light', 'Warm-up, cool-down, easy recovery', 0.5, 0.6, '#9DB8B8'],
    ['Zone 2: Light', 'Steady, easy effort. You can talk easily', 0.6, 0.7, '#3E6B6B'],
    ['Zone 3: Moderate', 'Comfortably hard. Short sentences only', 0.7, 0.8, '#C9932E'],
    ['Zone 4: Hard', 'Tough effort. Hard to talk', 0.8, 0.9, '#B5651D'],
    ['Zone 5: Maximum', 'All-out, only for very short bursts', 0.9, 1.0, '#8A2B2B']
  ];
  function hrUpdate() {
    var age = num('h-age', 5, 100, 16);
    var restV = parseInt($('h-rest').value, 10);
    var hasRest = !isNaN(restV) && restV >= 30 && restV <= 120;
    var max = 220 - age, html = '';
    zoneInfo.forEach(function (z) {
      var lo, hi;
      if (hasRest) { var hrr = max - restV; lo = Math.round(restV + hrr * z[2]); hi = Math.round(restV + hrr * z[3]); }
      else { lo = Math.round(max * z[2]); hi = Math.round(max * z[3]); }
      html += '<div class="zone" style="border-left-color:' + z[4] + '"><strong>' + z[0] + '</strong>' +
              '<span class="bpm">' + lo + '–' + hi + ' bpm</span><span>' + z[1] + '</span></div>';
    });
    $('zones').innerHTML = html;
    $('h-note').textContent = 'Estimated max heart rate: ' + max + ' bpm (220 minus age)' +
      (hasRest ? ', using your resting heart rate.' : '.') +
      ' These are estimates, not medical advice. Everyone is different, so listen to your body.';
  }
  $('h-age').addEventListener('input', hrUpdate);
  $('h-rest').addEventListener('input', hrUpdate);
  hrUpdate();

  /* ---------- 4. Workout generator ---------- */
  var ex = {
    upper: [['Push-ups', 6], ['Incline push-ups', 8], ['Tricep dips (chair)', 8], ['Plank shoulder taps', 10], ['Arm circles', 20], ['Superman holds', 8], ['Pike push-ups', 5], ['Bear crawl (steps)', 10]],
    lower: [['Bodyweight squats', 10], ['Alternating lunges', 8], ['Glute bridges', 12], ['Calf raises', 15], ['Wall sit (sec)', 15], ['Step-ups', 10], ['Jump squats', 6], ['Side lunges', 8]],
    core: [['Plank (sec)', 20], ['Bicycle crunches', 12], ['Dead bugs', 8], ['Mountain climbers', 14], ['Leg raises', 8], ['Russian twists', 12], ['Side plank each side (sec)', 15], ['Sit-ups', 10]]
  };
  ex.full = [].concat(ex.upper.slice(0, 3), ex.lower.slice(0, 3), ex.core.slice(0, 2), [['Jumping jacks', 20], ['Burpees', 5]]);
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function generate() {
    var list = shuffle(ex[$('w-focus').value]).slice(0, 5), lvl = parseInt($('w-level').value, 10), html = '';
    var mult = lvl === 1 ? 1 : lvl === 2 ? 1.5 : 2;
    list.forEach(function (e) {
      html += '<li><b>' + e[0] + '</b><span>' + Math.round(e[1] * mult) + (/\(sec\)|sec\)/.test(e[0]) ? '' : ' reps') + '</span></li>';
    });
    $('ex-list').innerHTML = html;
  }
  $('w-go').addEventListener('click', generate);
  generate();
})();