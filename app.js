(() => {
  const BPM_MIN = 20;
  const BPM_MAX = 240;
  const STROKE_CYCLE = ["down", "up", "off"];
  const STROKE_SYMBOL = { down: "↓", up: "↑", off: "—" };
  // Each preset is a run of bars sharing one subdivision, so a pattern can mix
  // bar lengths (6 beats then 8) while the scheduler keeps a constant step.
  const PATTERN_PRESETS = {
    "4": { label: "Quarters", sub: 1, bars: [4] },
    "6": { label: "Eighths · 3 beats", sub: 2, bars: [3] },
    "8": { label: "Eighths", sub: 2, bars: [4] },
    "12": { label: "Eighths · 6 beats", sub: 2, bars: [6] },
    "16": { label: "Sixteenths", sub: 4, bars: [4] },
    "24": { label: "Eighths · 6 beats · 2 bars", sub: 2, bars: [6, 6] },
    "32": { label: "Sixteenths · 2 bars", sub: 4, bars: [4, 4] },
  };
  const DEFAULT_PRESET = "8";
  const COUNT_SYLLABLES = { 1: [""], 2: ["", "+"], 4: ["", "e", "&", "a"] };
  const SAVED_STRUMS_KEY = "metronome.savedStrums";
  // Shipped with the app so it shows up in every user's saved list on first
  // load, without depending on a particular browser session's localStorage.
  const BUILT_IN_STRUMS = [
    {
      id: "built-in-how-to-disappear-completely",
      name: "How to Disappear Completely",
      notes: "16",
      pattern: [
        { stroke: "down", accent: true },
        { stroke: "down", accent: false },
        { stroke: "up", accent: false },
        { stroke: "off", accent: false },
        { stroke: "down", accent: false },
        { stroke: "up", accent: false },
        { stroke: "off", accent: false },
        { stroke: "up", accent: false },
        { stroke: "down", accent: true },
        { stroke: "down", accent: false },
        { stroke: "up", accent: false },
        { stroke: "off", accent: false },
        { stroke: "down", accent: false },
        { stroke: "up", accent: false },
        { stroke: "off", accent: false },
        { stroke: "up", accent: false },
      ],
    },
  ];
  const LONG_PRESS_MS = 450;
  const CELL_MIN = 28;
  const CELL_MAX = 152;
  const DISPLAY_TICK_MS = 100;
  const BLOCK_START_MAX = 7;
  const MAX_FRET = 22;
  const INLAY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21];
  const STRINGS = ["e", "B", "G", "D", "A", "E"];
  // MIDI pitches for open strings, same index order as STRINGS (0 = high e).
  const STRING_PITCHES = [64, 59, 55, 50, 45, 40];
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const STRING_LABELS = [
    "1st string (e)",
    "2nd string (B)",
    "3rd string (G)",
    "4th string (D)",
    "5th string (A)",
    "6th string (E)",
  ];
  const INTERVALS = [
    { id: "pu", label: "Perfect Unison", short: "1", semitones: 0 },
    { id: "m2", label: "Minor 2nd", short: "m2", semitones: 1 },
    { id: "M2", label: "Major 2nd", short: "M2", semitones: 2 },
    { id: "m3", label: "Minor 3rd", short: "m3", semitones: 3 },
    { id: "M3", label: "Major 3rd", short: "M3", semitones: 4 },
    { id: "P4", label: "Perfect 4th", short: "P4", semitones: 5 },
    { id: "TT", label: "Tritone (Augmented 4th / Diminished 5th)", short: "TT", semitones: 6 },
    { id: "P5", label: "Perfect 5th", short: "P5", semitones: 7 },
    { id: "m6", label: "Minor 6th", short: "m6", semitones: 8 },
    { id: "M6", label: "Major 6th", short: "M6", semitones: 9 },
    { id: "m7", label: "Minor 7th", short: "m7", semitones: 10 },
    { id: "M7", label: "Major 7th", short: "M7", semitones: 11 },
    { id: "P8", label: "Perfect Octave", short: "8ve", semitones: 12 },
  ];

  const els = {
    app: document.querySelector(".app"),
    modeSwitch: document.getElementById("modeSwitch"),
    bpmInput: document.getElementById("bpmInput"),
    bpmSlider: document.getElementById("bpmSlider"),
    bpmDown: document.getElementById("bpmDown"),
    bpmUp: document.getElementById("bpmUp"),
    tapBpm: document.getElementById("tapBpm"),
    playBtn: document.getElementById("playBtn"),
    resetBtn: document.getElementById("resetBtn"),
    beatOrb: document.getElementById("beatOrb"),
    beatNum: document.getElementById("beatNum"),
    beatDots: document.getElementById("beatDots"),
    pulseRing: document.getElementById("pulseRing"),
    beatPicker: document.getElementById("beatPicker"),
    accentFirst: document.getElementById("accentFirst"),
    chrono: document.getElementById("chrono"),
    chronoReset: document.getElementById("chronoReset"),
    timerMin: document.getElementById("timerMin"),
    timerSec: document.getElementById("timerSec"),
    timerRemaining: document.getElementById("timerRemaining"),
    timerMeter: document.querySelector(".meter-timer"),
    notePicker: document.getElementById("notePicker"),
    patternGrid: document.getElementById("patternGrid"),
    strumMeta: document.getElementById("strumMeta"),
    accentModeBtn: document.getElementById("accentModeBtn"),
    strumPanels: [...document.querySelectorAll(".panel-strum")],
    strumName: document.getElementById("strumName"),
    strumSaveBtn: document.getElementById("strumSaveBtn"),
    strumList: document.getElementById("strumList"),
    strumExportBtn: document.getElementById("strumExportBtn"),
    strumImportInput: document.getElementById("strumImportInput"),
    intervalsPanel: document.querySelector(".panel-intervals"),
    blockStartDown: document.getElementById("blockStartDown"),
    blockStartUp: document.getElementById("blockStartUp"),
    blockStartValue: document.getElementById("blockStartValue"),
    blockRangeLabel: document.getElementById("blockRangeLabel"),
    rootPicker: document.getElementById("rootPicker"),
    stringPicker: document.getElementById("stringPicker"),
    intervalName: document.getElementById("intervalName"),
    intervalRootHint: document.getElementById("intervalRootHint"),
    intervalRevealBtn: document.getElementById("intervalRevealBtn"),
    intervalNextBtn: document.getElementById("intervalNextBtn"),
    intervalAnswer: document.getElementById("intervalAnswer"),
    fretboard: document.getElementById("fretboard"),
    fretCaptions: document.getElementById("fretCaptions"),
    wholeStepsValue: document.getElementById("wholeStepsValue"),
    halfStepsValue: document.getElementById("halfStepsValue"),
    stepFormula: document.getElementById("stepFormula"),
  };

  const state = {
    mode: "metronome",
    bpm: 120,
    beats: 4,
    accentFirst: true,
    beat: 0,
    step: 0,
    playing: false,
    audioCtx: null,
    commonSound: null,
    accentSound: null,
    downSound: null,
    upSound: null,
    downAccentSound: null,
    upAccentSound: null,
    nextNoteTime: 0,
    scheduleId: null,
    lookAhead: 50,
    scheduleAhead: 0.12,
    startEpoch: 0,
    elapsedBefore: 0,
    displayTimer: null,
    timerDurationMs: 0,
    timerEndsAt: 0,
    tapTimes: [],
    preset: DEFAULT_PRESET,
    pattern: [],
    accentMode: false,
    cellButtons: [],
    activeCellBtn: null,
    visualQueue: [],
    visualQueueHead: 0,
    visualWake: null,
    visualWakeKind: null,
    lastChronoText: "",
    lastTimerText: "",
    lowPower: false,
    batteryDischarging: false,
    fitCache: { w: 0, h: 0, preset: "", cell: "" },
    blockStart: 0,
    rootIndex: 0,
    stringIndex: 5,
    currentInterval: null,
    revealed: false,
  };

  function preset(key = state.preset) {
    return PATTERN_PRESETS[key] || PATTERN_PRESETS[DEFAULT_PRESET];
  }

  function stepsPerBeat() {
    return preset().sub;
  }

  function patternLength(key = state.preset) {
    const config = preset(key);
    return config.bars.reduce((sum, beats) => sum + beats, 0) * config.sub;
  }

  function defaultCell(index) {
    const sub = stepsPerBeat();
    if (sub === 1) return { stroke: "down", accent: false };
    if (index % sub === 0) return { stroke: "down", accent: false };
    return { stroke: "off", accent: false };
  }

  function buildDefaultPattern() {
    const length = patternLength();
    const next = [];
    for (let i = 0; i < length; i += 1) next.push(defaultCell(i));
    return next;
  }

  function resizePattern(preserve = true) {
    const length = patternLength();
    const prev = preserve ? state.pattern : [];
    const next = [];
    for (let i = 0; i < length; i += 1) {
      if (preserve && prev[i]) {
        next.push({ stroke: prev[i].stroke, accent: prev[i].accent });
      } else {
        next.push(defaultCell(i));
      }
    }
    state.pattern = next;
    state.step = 0;
    renderPattern();
    updateStrumMeta();
  }

  function updateStrumMeta() {
    els.strumMeta.textContent = `${patternLength()} notes · ${preset().label}`;
  }

  function paintCell(btn, cell, index) {
    const wasActive = btn === state.activeCellBtn;
    btn.className = `pattern-cell ${cell.stroke}`;
    if (cell.accent) btn.classList.add("accented");
    if (wasActive) btn.classList.add("active");
    btn.dataset.index = String(index);
    btn.setAttribute(
      "aria-label",
      `Step ${index + 1}, ${cell.stroke}${cell.accent ? ", accented" : ""}`
    );
    btn.textContent = STROKE_SYMBOL[cell.stroke];
  }

  function makeCellButton(cell, index) {
    const btn = document.createElement("button");
    btn.type = "button";
    paintCell(btn, cell, index);
    return btn;
  }

  function appendBeatMarks(parent, beatStart, beatCount, stepsPerBeat) {
    const cols = beatCount * stepsPerBeat;
    const row = document.createElement("div");
    row.className = "beat-marks";
    row.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    row.setAttribute("aria-hidden", "true");

    for (let i = 0; i < cols; i += 1) {
      const mark = document.createElement("span");
      mark.className = "beat-mark";
      const offset = i % stepsPerBeat;
      if (offset === 0) {
        mark.textContent = String(beatStart + Math.floor(i / stepsPerBeat));
        mark.classList.add("on");
      } else {
        mark.textContent = COUNT_SYLLABLES[stepsPerBeat][offset];
      }
      row.appendChild(mark);
    }

    parent.appendChild(row);
  }

  function appendCellRow(parent, start, count) {
    const row = document.createElement("div");
    row.className = "pattern-row";
    row.style.gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;
    for (let i = start; i < start + count; i += 1) {
      row.appendChild(makeCellButton(state.pattern[i], i));
    }
    parent.appendChild(row);
  }

  // A bar wraps onto extra rows once it would exceed 8 cells, so sixteenths
  // read as two rows of 8 instead of one unusably thin row of 16.
  function appendBar(parent, start, beats, sub, label) {
    const board = document.createElement("div");
    board.className = "pattern-board";

    if (label) {
      const title = document.createElement("span");
      title.className = "pattern-bar-label";
      title.textContent = label;
      board.appendChild(title);
    }

    // Split into the fewest rows that keep each row at or under 8 cells,
    // spreading beats evenly rather than cramming as many as possible into
    // the first row and leaving a short, lopsided last one.
    const maxBeatsPerRow = Math.max(1, Math.floor(8 / sub));
    const rowCount = Math.max(1, Math.ceil(beats / maxBeatsPerRow));
    const beatsPerRow = Math.ceil(beats / rowCount);
    board.style.setProperty("--cols", String(Math.min(beats, beatsPerRow) * sub));

    let index = start;
    for (let beat = 0; beat < beats; beat += beatsPerRow) {
      const count = Math.min(beatsPerRow, beats - beat);
      appendBeatMarks(board, beat + 1, count, sub);
      appendCellRow(board, index, count * sub);
      index += count * sub;
    }

    parent.appendChild(board);
  }

  function renderPattern() {
    state.activeCellBtn = null;
    els.patternGrid.dataset.notes = state.preset;
    els.patternGrid.innerHTML = "";

    const { bars, sub } = preset();
    let start = 0;
    bars.forEach((beats, i) => {
      appendBar(els.patternGrid, start, beats, sub, bars.length > 1 ? `Strum ${i + 1}` : "");
      start += beats * sub;
    });

    state.cellButtons = [...els.patternGrid.querySelectorAll(".pattern-cell")];
    fitPatternCells({ force: true });
  }

  // Cells are square, so their size is whichever of the free width or free
  // height runs out first. Measuring with zero-sized cells exposes how much
  // room the beat labels and gaps take, which has to come off the top.
  function fitPatternCells({ force = false } = {}) {
    const grid = els.patternGrid;
    const rows = grid.querySelectorAll(".pattern-row");
    if (!rows.length || !grid.clientWidth) return;

    const w = grid.clientWidth;
    const h = grid.clientHeight;
    if (
      !force &&
      state.fitCache.preset === state.preset &&
      state.fitCache.w === w &&
      state.fitCache.h === h
    ) {
      return;
    }

    grid.style.setProperty("--cell", "0px");

    const boards = grid.children;
    const gridStyle = getComputedStyle(grid);
    const sideBySide = gridStyle.flexDirection === "row";
    const gridGap = parseFloat(gridStyle.gap) || 0;
    const boardCount = boards.length;
    const spread = gridGap * (boardCount - 1);

    let maxChrome = 0;
    let sumChrome = 0;
    let maxRowCount = 0;
    let maxFloor = 0;
    let sumFloor = 0;
    let maxCols = 0;

    for (let b = 0; b < boardCount; b += 1) {
      const board = boards[b];
      const boardRows = board.querySelectorAll(".pattern-row");
      let floor = 0;
      for (let r = 0; r < boardRows.length; r += 1) {
        floor += boardRows[r].getBoundingClientRect().height;
        maxCols = Math.max(maxCols, boardRows[r].children.length);
      }
      const chrome = board.getBoundingClientRect().height - floor;
      const count = boardRows.length;
      maxChrome = Math.max(maxChrome, chrome);
      sumChrome += chrome;
      maxRowCount = Math.max(maxRowCount, count);
      maxFloor = Math.max(maxFloor, floor);
      sumFloor += floor;
    }

    const gap = parseFloat(getComputedStyle(rows[0]).columnGap) || 8;
    const availWidth = sideBySide ? (w - spread) / boardCount : w;
    const chrome = sideBySide ? maxChrome : sumChrome + spread;
    const rowCount = sideBySide ? maxRowCount : rows.length;
    const rowsFloor = sideBySide ? maxFloor : sumFloor;

    // When the grid only hugs its content there is no height budget to honour,
    // so the cells are free to grow until the row runs out of width.
    const collapsed = chrome + rowsFloor;
    const bounded = h > collapsed + 4;

    const byWidth = (availWidth - gap * (maxCols - 1)) / maxCols;
    const byHeight = bounded ? (h - chrome) / rowCount - 2 : Infinity;

    const size = Math.max(CELL_MIN, Math.min(CELL_MAX, byWidth, byHeight));
    const cell = `${Math.floor(size)}px`;
    grid.style.setProperty("--cell", cell);
    state.fitCache = { w, h, preset: state.preset, cell };
  }

  function highlightPatternStep(index) {
    if (state.activeCellBtn) state.activeCellBtn.classList.remove("active");
    const btn = state.cellButtons[index];
    if (btn) {
      btn.classList.add("active");
      state.activeCellBtn = btn;
    } else {
      state.activeCellBtn = null;
    }
  }

  function clearPatternHighlight() {
    if (state.activeCellBtn) {
      state.activeCellBtn.classList.remove("active");
      state.activeCellBtn = null;
    }
  }

  function cycleStroke(index) {
    const cell = state.pattern[index];
    if (!cell) return;
    const next = (STROKE_CYCLE.indexOf(cell.stroke) + 1) % STROKE_CYCLE.length;
    cell.stroke = STROKE_CYCLE[next];
    if (cell.stroke === "off") cell.accent = false;
    const btn = state.cellButtons[index];
    if (btn) paintCell(btn, cell, index);
    else renderPattern();
  }

  function toggleAccent(index) {
    const cell = state.pattern[index];
    if (!cell || cell.stroke === "off") return;
    cell.accent = !cell.accent;
    const btn = state.cellButtons[index];
    if (btn) paintCell(btn, cell, index);
    else renderPattern();
  }

  function clampBpm(value) {
    return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(value)));
  }

  function resetChrono() {
    state.elapsedBefore = 0;
    state.startEpoch = performance.now();
    state.lastChronoText = "00:00.0";
    els.chrono.textContent = state.lastChronoText;
    els.chrono.setAttribute("datetime", "PT0S");
  }

  function setBpm(value, { syncInputs = true } = {}) {
    const next = clampBpm(value);
    const changed = next !== state.bpm;
    state.bpm = next;
    if (syncInputs) {
      els.bpmInput.value = String(state.bpm);
      els.bpmSlider.value = String(state.bpm);
    }
    if (changed) resetChrono();
  }

  function renderDots() {
    els.beatDots.innerHTML = "";
    for (let i = 0; i < state.beats; i += 1) {
      const dot = document.createElement("span");
      dot.setAttribute("role", "listitem");
      if (i === state.beat && state.playing && state.mode === "metronome") {
        dot.classList.add("active");
        if (i === 0 && state.accentFirst) dot.classList.add("accent");
      }
      els.beatDots.appendChild(dot);
    }
  }

  function createClickBuffer(ctx, { frequency, volume, decay, noise, overtone }) {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    const fund = (2 * Math.PI * frequency) / sampleRate;
    const high = (2 * Math.PI * frequency * 2.7) / sampleRate;
    const toneDecay = decay / sampleRate;
    const clickDecay = 320 / sampleRate;

    for (let i = 0; i < length; i += 1) {
      const toneEnv = Math.exp(-i * toneDecay);
      const clickEnv = Math.exp(-i * clickDecay);
      const tone =
        (1 - overtone) * Math.sin(fund * i) + overtone * Math.sin(high * i);
      const click = (Math.random() * 2 - 1) * noise;
      data[i] = volume * (toneEnv * tone + clickEnv * click);
    }

    return buffer;
  }

  function ensureAudio() {
    if (!state.audioCtx) {
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      state.commonSound = createClickBuffer(state.audioCtx, {
        frequency: 880,
        volume: 0.38,
        decay: 52,
        noise: 0.06,
        overtone: 0.18,
      });
      state.accentSound = createClickBuffer(state.audioCtx, {
        frequency: 1960,
        volume: 0.92,
        decay: 110,
        noise: 0.32,
        overtone: 0.55,
      });
      state.downSound = createClickBuffer(state.audioCtx, {
        frequency: 720,
        volume: 0.48,
        decay: 58,
        noise: 0.07,
        overtone: 0.2,
      });
      state.upSound = createClickBuffer(state.audioCtx, {
        frequency: 1180,
        volume: 0.42,
        decay: 62,
        noise: 0.08,
        overtone: 0.22,
      });
      // Pre-bake accents so each hit is only a BufferSource → destination
      // (no per-note GainNode allocation). Same stroke pitch, sharper/louder.
      state.downAccentSound = createClickBuffer(state.audioCtx, {
        frequency: 720,
        volume: 0.95,
        decay: 105,
        noise: 0.3,
        overtone: 0.5,
      });
      state.upAccentSound = createClickBuffer(state.audioCtx, {
        frequency: 1180,
        volume: 0.9,
        decay: 108,
        noise: 0.28,
        overtone: 0.5,
      });
    }
    if (state.audioCtx.state === "suspended") {
      state.audioCtx.resume();
    }
    return state.audioCtx;
  }

  function playBuffer(time, buffer) {
    const ctx = state.audioCtx;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(time);
    source.stop(time + buffer.duration);
  }

  function playClick(time, isAccent) {
    playBuffer(time, isAccent ? state.accentSound : state.commonSound);
  }

  function playStrum(time, cell) {
    if (!cell || cell.stroke === "off") return;
    if (cell.stroke === "down") {
      playBuffer(time, cell.accent ? state.downAccentSound : state.downSound);
    } else {
      playBuffer(time, cell.accent ? state.upAccentSound : state.upSound);
    }
  }

  function flashVisual(beatIndex) {
    const isAccent = state.accentFirst && beatIndex === 0;
    els.beatNum.textContent = String(beatIndex + 1);
    els.beatOrb.className = isAccent ? "beat-orb hit accent" : "beat-orb hit";

    if (state.lowPower) {
      els.pulseRing.className = "pulse-ring";
      els.pulseRing.style.animation = "";
    } else {
      // Restart the ring animation without reading layout (offsetWidth). Setting
      // animation to none, flushing computed style, then re-applying is enough.
      const ring = els.pulseRing;
      ring.className = "pulse-ring";
      ring.style.animation = "none";
      getComputedStyle(ring).animationName;
      ring.style.animation = "";
      ring.className = isAccent ? "pulse-ring accent flash" : "pulse-ring flash";
    }

    const dots = els.beatDots.children;
    for (let i = 0; i < dots.length; i += 1) {
      const on = i === beatIndex;
      dots[i].classList.toggle("active", on);
      dots[i].classList.toggle("accent", on && isAccent);
    }
  }

  function clearVisualQueue() {
    state.visualQueue = [];
    state.visualQueueHead = 0;
  }

  function enqueueVisual(time, payload) {
    state.visualQueue.push({ time, payload });
    armVisualWake();
  }

  // A queued highlight only fires once the audio clock has actually reached
  // its scheduled time, so the flash never jumps ahead of the sound.
  function flushVisuals() {
    if (!state.audioCtx) return;
    const now = state.audioCtx.currentTime;
    const q = state.visualQueue;
    let i = state.visualQueueHead;
    while (i < q.length && q[i].time <= now) {
      const item = q[i];
      i += 1;
      if (item.payload.kind === "strum") highlightPatternStep(item.payload.index);
      else flashVisual(item.payload.index);
    }
    state.visualQueueHead = i;
    // Compact occasionally so the array does not grow unboundedly.
    if (i > 32 && i * 2 >= q.length) {
      state.visualQueue = q.slice(i);
      state.visualQueueHead = 0;
    }
  }

  // Rather than polling every animation frame (60 wake-ups a second even at
  // a slow tempo with nothing due), sleep through most of the wait with a
  // plain timer — cheap, and lets the tab go idle between notes — then hand
  // off to requestAnimationFrame for the last stretch so the flip still
  // lands on a real paint instead of firing early off a drifted timer.
  function armVisualWake() {
    if (
      state.visualWake ||
      !state.playing ||
      state.visualQueueHead >= state.visualQueue.length ||
      !state.audioCtx
    ) {
      return;
    }
    const next = state.visualQueue[state.visualQueueHead];
    const msUntilDue = (next.time - state.audioCtx.currentTime) * 1000;
    if (msUntilDue > 20) {
      state.visualWake = setTimeout(visualWake, msUntilDue - 12);
      state.visualWakeKind = "timeout";
    } else {
      state.visualWake = requestAnimationFrame(visualWake);
      state.visualWakeKind = "raf";
    }
  }

  function visualWake() {
    state.visualWake = null;
    if (!state.playing) return;
    flushVisuals();
    armVisualWake();
  }

  function cancelVisualWake() {
    if (!state.visualWake) return;
    if (state.visualWakeKind === "raf") cancelAnimationFrame(state.visualWake);
    else clearTimeout(state.visualWake);
    state.visualWake = null;
  }

  function refreshPowerMode() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    state.lowPower = reduced || state.batteryDischarging;
    state.lookAhead = state.lowPower ? 75 : 50;
    els.app.classList.toggle("low-power", state.lowPower);
  }

  function watchPowerMode() {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => refreshPowerMode();
    if (motionQuery.addEventListener) motionQuery.addEventListener("change", onMotion);
    else motionQuery.addListener(onMotion);

    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        const update = () => {
          state.batteryDischarging = !battery.charging;
          refreshPowerMode();
        };
        battery.addEventListener("chargingchange", update);
        update();
      }).catch(() => {
        refreshPowerMode();
      });
    } else {
      refreshPowerMode();
    }
  }

  function schedule() {
    if (!state.playing) return;

    const ctx = state.audioCtx;
    flushVisuals();

    if (state.mode === "strum") {
      const secondsPerStep = 60 / state.bpm / stepsPerBeat();
      const length = patternLength();

      while (state.nextNoteTime < ctx.currentTime + state.scheduleAhead) {
        const stepIndex = state.step;
        playStrum(state.nextNoteTime, state.pattern[stepIndex]);
        enqueueVisual(state.nextNoteTime, { kind: "strum", index: stepIndex });
        state.step = (stepIndex + 1) % length;
        state.nextNoteTime += secondsPerStep;
      }
    } else {
      const secondsPerBeat = 60 / state.bpm;

      while (state.nextNoteTime < ctx.currentTime + state.scheduleAhead) {
        const beatIndex = state.beat;
        const isAccent = state.accentFirst && beatIndex === 0;
        playClick(state.nextNoteTime, isAccent);
        enqueueVisual(state.nextNoteTime, { kind: "metro", index: beatIndex });
        state.beat = (beatIndex + 1) % state.beats;
        state.nextNoteTime += secondsPerBeat;
      }
    }

    state.scheduleId = setTimeout(schedule, state.lookAhead);
  }

  function formatChrono(ms) {
    const totalTenths = Math.floor(ms / 100);
    const tenths = totalTenths % 10;
    const totalSeconds = Math.floor(totalTenths / 10);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
  }

  function formatTimer(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function getElapsedMs(now = performance.now()) {
    if (!state.playing) return state.elapsedBefore;
    return state.elapsedBefore + (now - state.startEpoch);
  }

  function tickDisplays() {
    const now = performance.now();
    const elapsed = getElapsedMs(now);
    const chronoText = formatChrono(elapsed);
    if (chronoText !== state.lastChronoText) {
      state.lastChronoText = chronoText;
      els.chrono.textContent = chronoText;
      els.chrono.setAttribute("datetime", `PT${(elapsed / 1000).toFixed(1)}S`);
    }

    if (state.playing && state.timerDurationMs > 0) {
      const remaining = state.timerEndsAt - now;
      const timerText = formatTimer(remaining);
      if (timerText !== state.lastTimerText) {
        state.lastTimerText = timerText;
        els.timerRemaining.textContent = timerText;
      }
      if (remaining <= 0) {
        stop();
      }
    }
  }

  function startDisplayTicker() {
    if (state.displayTimer) return;
    tickDisplays();
    state.displayTimer = setInterval(tickDisplays, DISPLAY_TICK_MS);
  }

  function stopDisplayTicker() {
    if (!state.displayTimer) return;
    clearInterval(state.displayTimer);
    state.displayTimer = null;
  }

  function readTimerDurationMs() {
    const minutes = Math.max(0, Math.min(99, Number(els.timerMin.value) || 0));
    const seconds = Math.max(0, Math.min(59, Number(els.timerSec.value) || 0));
    els.timerMin.value = String(minutes);
    els.timerSec.value = String(seconds);
    return (minutes * 60 + seconds) * 1000;
  }

  function setMode(mode) {
    if (mode === state.mode) return;
    if (state.playing) stop();

    state.mode = mode;
    els.app.dataset.mode = mode;
    els.strumPanels.forEach((panel) => {
      panel.hidden = mode !== "strum";
    });
    if (els.intervalsPanel) {
      els.intervalsPanel.hidden = mode !== "intervals";
    }

    els.modeSwitch.querySelectorAll("button").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.mode === mode ? "true" : "false");
    });

    if (mode === "strum") {
      renderPattern();
      updateStrumMeta();
      renderSavedStrums();
      requestAnimationFrame(fitPatternCells);
    } else if (mode === "intervals") {
      renderIntervalSetup();
      dealInterval();
    } else {
      renderDots();
    }
  }

  function rootFret() {
    return state.blockStart + state.rootIndex;
  }

  function pitchAt(stringIndex, fret) {
    return STRING_PITCHES[stringIndex] + fret;
  }

  function noteName(pitch) {
    return NOTE_NAMES[((pitch % 12) + 12) % 12];
  }

  function outsideBlockDistance(fret) {
    const lo = state.blockStart;
    const hi = state.blockStart + 3;
    if (fret < lo) return lo - fret;
    if (fret > hi) return fret - hi;
    return 0;
  }

  function findInPositionSpot(targetPitch) {
    const candidates = [];
    for (let stringIndex = 0; stringIndex < STRINGS.length; stringIndex += 1) {
      for (let fret = 0; fret <= MAX_FRET; fret += 1) {
        if (pitchAt(stringIndex, fret) !== targetPitch) continue;
        candidates.push({ stringIndex, fret });
      }
    }
    if (!candidates.length) return null;

    candidates.sort((a, b) => {
      const scoreA = outsideBlockDistance(a.fret) * 10 + Math.abs(a.stringIndex - state.stringIndex);
      const scoreB = outsideBlockDistance(b.fret) * 10 + Math.abs(b.stringIndex - state.stringIndex);
      if (scoreA !== scoreB) return scoreA - scoreB;
      const sameA = a.stringIndex === state.stringIndex ? 0 : 1;
      const sameB = b.stringIndex === state.stringIndex ? 0 : 1;
      if (sameA !== sameB) return sameA - sameB;
      return a.fret - b.fret;
    });

    return candidates[0];
  }

  function renderIntervalSetup() {
    els.blockStartValue.textContent = String(state.blockStart);
    els.blockRangeLabel.textContent = `Frets ${state.blockStart}–${state.blockStart + 3}`;
    els.blockStartDown.disabled = state.blockStart <= 0;
    els.blockStartUp.disabled = state.blockStart >= BLOCK_START_MAX;

    els.rootPicker.querySelectorAll("button").forEach((btn) => {
      btn.setAttribute(
        "aria-pressed",
        Number(btn.dataset.root) === state.rootIndex ? "true" : "false"
      );
    });

    els.stringPicker.querySelectorAll("button").forEach((btn) => {
      btn.setAttribute(
        "aria-pressed",
        Number(btn.dataset.string) === state.stringIndex ? "true" : "false"
      );
    });

    updateIntervalRootHint();
  }

  function updateIntervalRootHint() {
    els.intervalRootHint.textContent = `Root on fret ${rootFret()} · ${STRING_LABELS[state.stringIndex]}`;
  }

  function renderIntervalPrompt() {
    els.intervalName.textContent = state.currentInterval
      ? state.currentInterval.label
      : "—";
    updateIntervalRootHint();
  }

  function makeFretDot(kind, label) {
    const dot = document.createElement("span");
    dot.className = `fret-dot ${kind}`;
    dot.textContent = label;
    return dot;
  }

  function renderFretboard() {
    els.fretboard.innerHTML = "";
    els.fretCaptions.innerHTML = "";
    if (!state.currentInterval || !state.revealed) {
      els.intervalAnswer.hidden = true;
      return;
    }

    const root = { stringIndex: state.stringIndex, fret: rootFret() };
    const rootPitch = pitchAt(root.stringIndex, root.fret);
    const targetPitch = rootPitch + state.currentInterval.semitones;
    const sameStringFret = root.fret + state.currentInterval.semitones;
    const inPos =
      findInPositionSpot(targetPitch) ||
      { stringIndex: state.stringIndex, fret: sameStringFret };
    const short = state.currentInterval.short;
    const inPosIsRoot = inPos.stringIndex === root.stringIndex && inPos.fret === root.fret;
    const acrossStrings = inPos.stringIndex !== root.stringIndex;

    // Only frame the natural answer (root + in-position). When the shape
    // moves to another string, skip the same-string stretch so the board
    // stays focused on how it's actually fretted.
    const frets = [root.fret, inPos.fret, state.blockStart, state.blockStart + 3];
    if (!acrossStrings) frets.push(sameStringFret);
    const from = Math.max(0, Math.min(...frets) - 1);
    const to = Math.min(MAX_FRET, Math.max(...frets) + 1);
    const fretCount = to - from + 1;

    els.fretboard.style.setProperty("--frets", String(fretCount));
    els.fretboard.style.setProperty("--fret-w", fretCount > 10 ? "2.35rem" : "2.75rem");

    for (let s = 0; s < STRINGS.length; s += 1) {
      const label = document.createElement("div");
      label.className = "fret-string-label";
      label.textContent = STRINGS[s];
      els.fretboard.appendChild(label);

      for (let fret = from; fret <= to; fret += 1) {
        const lane = document.createElement("div");
        lane.className = "fret-lane";
        if (fret === 0) lane.classList.add("open", "nut");
        if (fret >= state.blockStart && fret <= state.blockStart + 3) {
          lane.classList.add("in-block");
        }
        if (INLAY_FRETS.includes(fret)) {
          if (fret === 12) {
            if (s === 1 || s === 4) {
              const inlay = document.createElement("span");
              inlay.className = "fret-inlay";
              inlay.setAttribute("aria-hidden", "true");
              lane.appendChild(inlay);
            }
          } else if (s === 2) {
            const inlay = document.createElement("span");
            inlay.className = "fret-inlay";
            inlay.setAttribute("aria-hidden", "true");
            lane.appendChild(inlay);
          }
        }

        if (root.stringIndex === s && root.fret === fret) {
          lane.appendChild(makeFretDot("root", "R"));
        }
        if (inPos.stringIndex === s && inPos.fret === fret && !inPosIsRoot) {
          lane.appendChild(makeFretDot("target", short));
        }

        els.fretboard.appendChild(lane);
      }
    }

    const corner = document.createElement("div");
    corner.className = "fret-num-label";
    corner.setAttribute("aria-hidden", "true");
    els.fretboard.appendChild(corner);

    for (let fret = from; fret <= to; fret += 1) {
      const num = document.createElement("div");
      num.className = "fret-num";
      if (fret >= state.blockStart && fret <= state.blockStart + 3) {
        num.classList.add("in-block");
      }
      num.textContent = String(fret);
      els.fretboard.appendChild(num);
    }

    const steps = state.currentInterval.semitones;
    const wholeCount = Math.floor(steps / 2);
    const remHalf = steps % 2;
    els.wholeStepsValue.textContent = remHalf
      ? wholeCount === 0
        ? "½"
        : `${wholeCount}½`
      : String(wholeCount);
    els.halfStepsValue.textContent = String(steps);
    if (steps === 0) {
      els.stepFormula.textContent = "Unison · no steps";
    } else if (remHalf === 0) {
      els.stepFormula.textContent =
        wholeCount === 1 ? "1 whole step" : `${wholeCount} whole steps`;
    } else if (wholeCount === 0) {
      els.stepFormula.textContent = "1 half step";
    } else {
      els.stepFormula.textContent = `${wholeCount} whole + 1 half`;
    }

    const stepLabel = steps === 1 ? "1 half step" : `${steps} half steps`;
    const lines = [
      `Root: ${STRING_LABELS[root.stringIndex]}, fret ${root.fret} (${noteName(rootPitch)})`,
    ];

    if (inPosIsRoot) {
      lines.push("Same note · unison");
    } else {
      const targetLine = `Answer: ${STRING_LABELS[inPos.stringIndex]}, fret ${inPos.fret} (${noteName(pitchAt(inPos.stringIndex, inPos.fret))})`;
      lines.push(
        acrossStrings
          ? targetLine
          : `${targetLine} · +${stepLabel}`
      );
    }

    lines.forEach((text) => {
      const p = document.createElement("p");
      p.className = "fret-note-line";
      p.textContent = text;
      els.fretCaptions.appendChild(p);
    });

    els.intervalAnswer.hidden = false;
  }

  function setReveal(on) {
    state.revealed = on;
    els.intervalRevealBtn.setAttribute("aria-pressed", on ? "true" : "false");
    els.intervalRevealBtn.textContent = on ? "Hide answer" : "Show answer";
    renderFretboard();
  }

  function dealInterval() {
    const pick = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
    state.currentInterval = pick;
    renderIntervalPrompt();
    setReveal(false);
  }

  function refreshIntervalAnswerLayout() {
    updateIntervalRootHint();
    if (state.revealed) renderFretboard();
  }

  function setBlockStart(value) {
    const next = Math.min(BLOCK_START_MAX, Math.max(0, value));
    if (next === state.blockStart) return;
    state.blockStart = next;
    renderIntervalSetup();
    refreshIntervalAnswerLayout();
  }

  function setRootIndex(index) {
    const next = Math.min(3, Math.max(0, index));
    if (next === state.rootIndex) return;
    state.rootIndex = next;
    renderIntervalSetup();
    refreshIntervalAnswerLayout();
  }

  function setStringIndex(index) {
    const next = Math.min(5, Math.max(0, index));
    if (next === state.stringIndex) return;
    state.stringIndex = next;
    renderIntervalSetup();
    refreshIntervalAnswerLayout();
  }

  function setAccentMode(on) {
    state.accentMode = on;
    els.accentModeBtn.setAttribute("aria-pressed", on ? "true" : "false");
    els.accentModeBtn.textContent = on ? "Accent: On" : "Accent: Off";
  }

  function clonePattern(pattern) {
    return pattern.map((cell) => ({ stroke: cell.stroke, accent: Boolean(cell.accent) }));
  }

  function loadSavedStrums() {
    try {
      const raw = localStorage.getItem(SAVED_STRUMS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function persistSavedStrums(items) {
    localStorage.setItem(SAVED_STRUMS_KEY, JSON.stringify(items));
  }

  function seedBuiltInStrums() {
    const items = loadSavedStrums();
    let changed = false;
    BUILT_IN_STRUMS.forEach((builtIn) => {
      if (!items.some((item) => item.id === builtIn.id)) {
        items.push({ ...builtIn, pattern: clonePattern(builtIn.pattern) });
        changed = true;
      }
    });
    if (changed) persistSavedStrums(items);
  }

  function markPresetButtons(key) {
    els.notePicker.querySelectorAll("button").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.notes === key ? "true" : "false");
    });
  }

  function setPreset(key, { preserve = true } = {}) {
    state.preset = PATTERN_PRESETS[key] ? key : DEFAULT_PRESET;
    markPresetButtons(state.preset);
    resizePattern(preserve);
  }

  function renderSavedStrums() {
    const items = loadSavedStrums();
    els.strumList.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "strum-item";
      li.innerHTML = `
        <span class="strum-item-name"></span>
        <span class="strum-item-meta"></span>
        <button type="button" class="strum-load">Load</button>
        <button type="button" class="strum-delete">Delete</button>
      `;
      li.querySelector(".strum-item-name").textContent = item.name;
      li.querySelector(".strum-item-meta").textContent = `${item.pattern.length} notes`;
      li.querySelector(".strum-load").addEventListener("click", () => loadStrum(item.id));
      li.querySelector(".strum-delete").addEventListener("click", () => deleteStrum(item.id));
      els.strumList.appendChild(li);
    });
  }

  function saveCurrentStrum() {
    const name = els.strumName.value.trim() || `Strum ${loadSavedStrums().length + 1}`;
    const items = loadSavedStrums();
    const existing = items.find((item) => item.name.toLowerCase() === name.toLowerCase());
    const entry = {
      id: existing ? existing.id : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      notes: state.preset,
      pattern: clonePattern(state.pattern),
    };
    const next = existing
      ? items.map((item) => (item.id === existing.id ? entry : item))
      : [entry, ...items];
    persistSavedStrums(next);
    els.strumName.value = name;
    renderSavedStrums();
  }

  function loadStrum(id) {
    const item = loadSavedStrums().find((saved) => saved.id === id);
    if (!item) return;
    if (state.playing) stop();
    const key = String(item.notes);
    state.preset = PATTERN_PRESETS[key] ? key : DEFAULT_PRESET;
    state.pattern = clonePattern(item.pattern);
    els.strumName.value = item.name;
    markPresetButtons(state.preset);
    if (state.pattern.length !== patternLength()) resizePattern(true);
    else {
      renderPattern();
      updateStrumMeta();
    }
  }

  function deleteStrum(id) {
    persistSavedStrums(loadSavedStrums().filter((item) => item.id !== id));
    renderSavedStrums();
  }

  function start() {
    ensureAudio();
    state.playing = true;
    state.beat = 0;
    state.step = 0;
    clearVisualQueue();
    refreshPowerMode();
    state.nextNoteTime = state.audioCtx.currentTime + 0.05;
    state.startEpoch = performance.now();
    els.app.classList.add("is-playing");

    state.timerDurationMs = readTimerDurationMs();
    if (state.timerDurationMs > 0) {
      state.timerEndsAt = performance.now() + state.timerDurationMs;
      els.timerMeter.classList.add("running");
      els.timerRemaining.hidden = false;
      state.lastTimerText = formatTimer(state.timerDurationMs);
      els.timerRemaining.textContent = state.lastTimerText;
    }

    els.playBtn.textContent = "Stop";
    els.playBtn.setAttribute("aria-pressed", "true");
    els.timerMin.disabled = true;
    els.timerSec.disabled = true;

    if (state.mode === "strum") highlightPatternStep(0);
    schedule();
    startDisplayTicker();
  }

  function stop() {
    if (state.playing) {
      state.elapsedBefore = getElapsedMs();
    }
    state.playing = false;
    clearVisualQueue();
    els.app.classList.remove("is-playing");

    if (state.scheduleId) {
      clearTimeout(state.scheduleId);
      state.scheduleId = null;
    }
    cancelVisualWake();
    stopDisplayTicker();

    els.playBtn.textContent = "Start";
    els.playBtn.setAttribute("aria-pressed", "false");
    els.timerMin.disabled = false;
    els.timerSec.disabled = false;
    els.timerMeter.classList.remove("running");
    els.timerRemaining.hidden = true;

    els.beatOrb.classList.remove("hit", "accent");
    els.pulseRing.classList.remove("flash", "accent");
    state.beat = 0;
    state.step = 0;
    els.beatNum.textContent = "1";
    renderDots();
    clearPatternHighlight();
    tickDisplays();
  }

  function reset() {
    stop();
    state.elapsedBefore = 0;
    state.lastChronoText = "00:00.0";
    els.chrono.textContent = state.lastChronoText;
    els.chrono.setAttribute("datetime", "PT0S");
    els.timerMin.value = "0";
    els.timerSec.value = "0";
    if (state.mode === "strum") {
      state.pattern = buildDefaultPattern();
      setAccentMode(false);
      renderPattern();
      updateStrumMeta();
    }
  }

  function handleTap() {
    const now = performance.now();
    state.tapTimes.push(now);
    state.tapTimes = state.tapTimes.filter((t) => now - t < 3000);

    if (state.tapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < state.tapTimes.length; i += 1) {
        intervals.push(state.tapTimes[i] - state.tapTimes[i - 1]);
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setBpm(60000 / avg);
    }
  }

  function bindPatternInteractions() {
    let pressTimer = null;
    let longPressed = false;
    let pressIndex = -1;

    function clearPress() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }

    els.patternGrid.addEventListener("click", (event) => {
      const btn = event.target.closest(".pattern-cell");
      if (!btn) return;
      if (longPressed) {
        longPressed = false;
        return;
      }
      const index = Number(btn.dataset.index);
      if (state.accentMode) toggleAccent(index);
      else cycleStroke(index);
    });

    els.patternGrid.addEventListener("contextmenu", (event) => {
      const btn = event.target.closest(".pattern-cell");
      if (!btn) return;
      event.preventDefault();
      if (longPressed) return;
      toggleAccent(Number(btn.dataset.index));
    });

    els.patternGrid.addEventListener("pointerdown", (event) => {
      const btn = event.target.closest(".pattern-cell");
      if (!btn || event.button === 2) return;
      pressIndex = Number(btn.dataset.index);
      longPressed = false;
      clearPress();
      pressTimer = setTimeout(() => {
        longPressed = true;
        toggleAccent(pressIndex);
      }, LONG_PRESS_MS);
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach((type) => {
      els.patternGrid.addEventListener(type, clearPress);
    });
  }

  els.modeSwitch.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-mode]");
    if (!btn) return;
    setMode(btn.dataset.mode);
  });

  els.bpmInput.addEventListener("change", () => {
    setBpm(Number(els.bpmInput.value) || state.bpm);
  });

  els.bpmSlider.addEventListener("input", () => {
    setBpm(Number(els.bpmSlider.value), { syncInputs: false });
    els.bpmInput.value = String(state.bpm);
  });

  els.bpmDown.addEventListener("click", () => setBpm(state.bpm - 1));
  els.bpmUp.addEventListener("click", () => setBpm(state.bpm + 1));
  els.tapBpm.addEventListener("click", handleTap);

  els.beatPicker.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-beats]");
    if (!btn) return;
    state.beats = Number(btn.dataset.beats);
    state.beat = 0;
    els.beatPicker.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    });
    els.beatNum.textContent = "1";
    renderDots();
  });

  els.notePicker.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-notes]");
    if (!btn) return;
    setPreset(btn.dataset.notes);
  });

  els.accentFirst.addEventListener("change", () => {
    state.accentFirst = els.accentFirst.checked;
  });

  els.accentModeBtn.addEventListener("click", () => {
    setAccentMode(!state.accentMode);
  });

  els.strumSaveBtn.addEventListener("click", saveCurrentStrum);
  els.strumName.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveCurrentStrum();
    }
  });

  els.strumExportBtn.addEventListener("click", () => {
    const items = loadSavedStrums();
    if (!items.length) {
      alert("No saved strums to export.");
      return;
    }
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "strums.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  els.strumImportInput.addEventListener("change", () => {
    const file = els.strumImportInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error("Not an array");
        const current = loadSavedStrums();
        const merged = [...imported];
        current.forEach((item) => {
          if (!merged.find((m) => m.id === item.id)) merged.push(item);
        });
        persistSavedStrums(merged);
        renderSavedStrums();
      } catch {
        alert("Could not read the file. Make sure it's a valid strums.json export.");
      } finally {
        els.strumImportInput.value = "";
      }
    };
    reader.readAsText(file);
  });

  els.blockStartDown.addEventListener("click", () => setBlockStart(state.blockStart - 1));
  els.blockStartUp.addEventListener("click", () => setBlockStart(state.blockStart + 1));

  els.rootPicker.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-root]");
    if (!btn) return;
    setRootIndex(Number(btn.dataset.root));
  });

  els.stringPicker.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-string]");
    if (!btn) return;
    setStringIndex(Number(btn.dataset.string));
  });

  els.intervalRevealBtn.addEventListener("click", () => {
    if (!state.currentInterval) return;
    setReveal(!state.revealed);
  });

  els.intervalNextBtn.addEventListener("click", () => {
    dealInterval();
  });

  els.playBtn.addEventListener("click", () => {
    if (state.playing) stop();
    else start();
  });

  els.resetBtn.addEventListener("click", reset);
  els.chronoReset.addEventListener("click", resetChrono);

  let fitRaf = null;
  window.addEventListener("resize", () => {
    if (fitRaf) cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(fitPatternCells);
  });

  window.addEventListener("keydown", (event) => {
    if (event.target.matches("input")) return;
    if (event.code === "Space") {
      event.preventDefault();
      if (state.mode === "intervals") return;
      if (state.playing) stop();
      else start();
    }
  });

  bindPatternInteractions();
  watchPowerMode();
  setBpm(120);
  state.pattern = buildDefaultPattern();
  renderDots();
  renderPattern();
  updateStrumMeta();
  seedBuiltInStrums();
  renderSavedStrums();
  renderIntervalSetup();
})();
