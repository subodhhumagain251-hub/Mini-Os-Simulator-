/* ======================================================================
   Mini OS Simulator
   Tabs: CPU Scheduling | Memory Management | Disk Scheduling
   All algorithms below were validated against known textbook examples
   (Silberschatz "Operating System Concepts") before wiring up the UI.
   ====================================================================== */

/* ---------------------------- Tab switching ---------------------------- */
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.panel).classList.add("active");
  });
});

/* Shared colour palette for process/segment identity across all charts */
const PALETTE = ["#5ec8d8", "#e8b563", "#b78ce8", "#5ec88a", "#e8697a", "#7ea8e8", "#e8a3d8", "#c8d85e"];
const colorCache = {};
function colorFor(id) {
  if (!colorCache[id]) {
    const used = Object.keys(colorCache).length;
    colorCache[id] = PALETTE[used % PALETTE.length];
  }
  return colorCache[id];
}

function fmt(n) {
  return Number.isFinite(n) ? (Math.round(n * 100) / 100).toString() : "-";
}

/* ======================================================================
   1) CPU SCHEDULING
   ====================================================================== */

function simulateNonPreemptive(processes, comparator) {
  const pool = processes.map((p, i) => ({ ...p, _idx: i }));
  let time = 0;
  const segments = [];
  const completed = [];
  while (pool.length) {
    const available = pool.filter((p) => p.at <= time);
    if (available.length === 0) {
      const nextArrival = Math.min(...pool.map((p) => p.at));
      if (nextArrival > time) {
        segments.push({ idle: true, start: time, end: nextArrival });
        time = nextArrival;
      }
      continue;
    }
    available.sort(comparator);
    const p = available[0];
    const start = time;
    const finish = time + p.bt;
    segments.push({ id: p.id, start, end: finish });
    time = finish;
    pool.splice(pool.indexOf(p), 1);
    completed.push({ id: p.id, at: p.at, bt: p.bt, ct: finish, tat: finish - p.at, wt: finish - p.at - p.bt });
  }
  return { segments, completed };
}

const FCFS_CMP = (a, b) => a.at - b.at || a._idx - b._idx;
const SJF_CMP = (a, b) => a.bt - b.bt || a.at - b.at || a._idx - b._idx;
const PRIORITY_CMP = (a, b) => a.pr - b.pr || a.at - b.at || a._idx - b._idx;

function simulateRR(processes, quantum) {
  const sortedByArrival = processes.map((p, i) => ({ ...p, _idx: i })).sort((a, b) => a.at - b.at || a._idx - b._idx);
  const remaining = {};
  sortedByArrival.forEach((p) => (remaining[p.id] = p.bt));
  let time = sortedByArrival.length ? sortedByArrival[0].at : 0;
  let idx = 0;
  const queue = [];
  const segments = [];
  const completed = [];
  const pushArrivals = () => {
    while (idx < sortedByArrival.length && sortedByArrival[idx].at <= time) {
      queue.push(sortedByArrival[idx]);
      idx++;
    }
  };
  pushArrivals();
  while (queue.length) {
    const p = queue.shift();
    const start = time;
    const exec = Math.min(quantum, remaining[p.id]);
    const finish = start + exec;
    segments.push({ id: p.id, start, end: finish });
    time = finish;
    remaining[p.id] -= exec;
    pushArrivals();
    if (remaining[p.id] > 0) {
      queue.push(p);
    } else {
      completed.push({ id: p.id, at: p.at, bt: p.bt, ct: finish, tat: finish - p.at, wt: finish - p.at - p.bt });
    }
    if (queue.length === 0 && idx < sortedByArrival.length) {
      const nextT = sortedByArrival[idx].at;
      if (nextT > time) {
        segments.push({ idle: true, start: time, end: nextT });
        time = nextT;
      }
      pushArrivals();
    }
  }
  return { segments, completed };
}

/* ---- CPU panel wiring ---- */
const cpuTableBody = document.querySelector("#cpu-table tbody");
let cpuRowCount = 0;

function addCpuRow(at, bt, pr) {
  cpuRowCount++;
  const pid = "P" + cpuRowCount;
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${pid}</td>
    <td><input type="number" min="0" value="${at ?? 0}" data-field="at" /></td>
    <td><input type="number" min="1" value="${bt ?? 1}" data-field="bt" /></td>
    <td class="pr-col ${document.getElementById("cpu-algo").value === "priority" ? "" : "hidden"}">
      <input type="number" min="0" value="${pr ?? 1}" data-field="pr" />
    </td>
    <td><button class="row-remove" type="button" title="Remove">&times;</button></td>
  `;
  tr.dataset.pid = pid;
  tr.querySelector(".row-remove").addEventListener("click", () => tr.remove());
  cpuTableBody.appendChild(tr);
}

function loadCpuSample() {
  cpuTableBody.innerHTML = "";
  cpuRowCount = 0;
  addCpuRow(0, 5, 2);
  addCpuRow(1, 3, 1);
  addCpuRow(2, 8, 3);
  addCpuRow(3, 6, 4);
}

document.getElementById("cpu-add-row").addEventListener("click", () => addCpuRow());
document.getElementById("cpu-sample").addEventListener("click", loadCpuSample);
document.getElementById("cpu-reset").addEventListener("click", () => {
  cpuTableBody.innerHTML = "";
  cpuRowCount = 0;
  addCpuRow();
  document.getElementById("cpu-results").classList.add("hidden");
  document.getElementById("cpu-empty").classList.remove("hidden");
  document.getElementById("cpu-error").classList.add("hidden");
});

document.getElementById("cpu-algo").addEventListener("change", (e) => {
  const isRR = e.target.value === "rr";
  const isPriority = e.target.value === "priority";
  document.getElementById("cpu-quantum-field").classList.toggle("hidden", !isRR);
  document.querySelectorAll("#cpu-table .pr-col").forEach((el) => el.classList.toggle("hidden", !isPriority));
});

function readCpuProcesses() {
  const rows = [...cpuTableBody.querySelectorAll("tr")];
  return rows.map((tr) => ({
    id: tr.dataset.pid,
    at: Number(tr.querySelector('[data-field="at"]').value),
    bt: Number(tr.querySelector('[data-field="bt"]').value),
    pr: Number(tr.querySelector('[data-field="pr"]')?.value ?? 0),
  }));
}

function showCpuError(msg) {
  const el = document.getElementById("cpu-error");
  if (!msg) { el.classList.add("hidden"); el.textContent = ""; return; }
  el.textContent = msg;
  el.classList.remove("hidden");
}

document.getElementById("cpu-run").addEventListener("click", () => {
  const processes = readCpuProcesses();
  if (processes.length === 0) return showCpuError("Add at least one process first.");
  for (const p of processes) {
    if (!Number.isFinite(p.at) || p.at < 0) return showCpuError(`${p.id}: arrival time must be a non-negative number.`);
    if (!Number.isFinite(p.bt) || p.bt <= 0) return showCpuError(`${p.id}: burst time must be greater than 0.`);
  }
  showCpuError(null);

  const algo = document.getElementById("cpu-algo").value;
  let result;
  if (algo === "fcfs") result = simulateNonPreemptive(processes, FCFS_CMP);
  else if (algo === "sjf") result = simulateNonPreemptive(processes, SJF_CMP);
  else if (algo === "priority") result = simulateNonPreemptive(processes, PRIORITY_CMP);
  else {
    const q = Math.max(1, Number(document.getElementById("cpu-quantum").value) || 1);
    result = simulateRR(processes, q);
  }

  renderCpuResults(result, processes);
});

function renderCpuResults({ segments, completed }, processes) {
  document.getElementById("cpu-empty").classList.add("hidden");
  document.getElementById("cpu-results").classList.remove("hidden");

  // Gantt chart
  const total = segments.length ? segments[segments.length - 1].end - segments[0].start : 1;
  const offset = segments.length ? segments[0].start : 0;
  const ganttEl = document.getElementById("cpu-gantt");
  const ticksEl = document.getElementById("cpu-gantt-ticks");
  ganttEl.innerHTML = "";
  ticksEl.innerHTML = "";

  segments.forEach((seg, i) => {
    const width = ((seg.end - seg.start) / total) * 100;
    const div = document.createElement("div");
    div.className = "gantt-seg" + (seg.idle ? " idle" : "");
    div.style.width = width + "%";
    div.style.background = seg.idle ? "var(--idle)" : colorFor(seg.id);
    div.style.animationDelay = i * 0.03 + "s";
    div.textContent = seg.idle ? "idle" : seg.id;
    div.title = `${seg.idle ? "Idle" : seg.id}: ${seg.start} → ${seg.end}`;
    ganttEl.appendChild(div);
  });

  const boundaries = [segments[0]?.start ?? 0, ...segments.map((s) => s.end)];
  [...new Set(boundaries)].forEach((t) => {
    const span = document.createElement("span");
    span.style.left = ((t - offset) / total) * 100 + "%";
    span.textContent = t;
    ticksEl.appendChild(span);
  });

  // Result table
  const tbody = document.querySelector("#cpu-result-table tbody");
  tbody.innerHTML = "";
  const order = processes.map((p) => p.id);
  const byId = Object.fromEntries(completed.map((c) => [c.id, c]));
  order.forEach((id) => {
    const c = byId[id];
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${c.id}</td><td>${c.at}</td><td>${c.bt}</td><td>${c.ct}</td><td>${c.tat}</td><td>${c.wt}</td>`;
    tbody.appendChild(tr);
  });

  const avgTat = completed.reduce((s, c) => s + c.tat, 0) / completed.length;
  const avgWt = completed.reduce((s, c) => s + c.wt, 0) / completed.length;
  document.getElementById("cpu-stats").innerHTML = `
    <div class="stat-pill">Avg. turnaround time <b>${fmt(avgTat)}</b></div>
    <div class="stat-pill">Avg. waiting time <b>${fmt(avgWt)}</b></div>
    <div class="stat-pill">Total time <b>${fmt(segments[segments.length - 1]?.end ?? 0)}</b></div>
  `;
}

/* ======================================================================
   2) MEMORY MANAGEMENT (fixed-partition allocation)
   ====================================================================== */

function allocateMemory(blockSizes, processSizes, strategy) {
  const blocks = blockSizes.map((size, i) => ({ index: i, size, free: true, process: null, frag: 0 }));
  const allocations = [];
  processSizes.forEach((size, pIdx) => {
    const pid = "P" + (pIdx + 1);
    const candidates = blocks.filter((b) => b.free && b.size >= size);
    let chosen = null;
    if (candidates.length) {
      if (strategy === "first") chosen = candidates[0];
      else if (strategy === "best") chosen = candidates.reduce((a, b) => (b.size < a.size ? b : a));
      else if (strategy === "worst") chosen = candidates.reduce((a, b) => (b.size > a.size ? b : a));
    }
    if (chosen) {
      chosen.free = false;
      chosen.process = pid;
      chosen.frag = chosen.size - size;
      allocations.push({ pid, size, block: chosen.index + 1, frag: chosen.frag });
    } else {
      allocations.push({ pid, size, block: null, frag: null });
    }
  });
  return { blocks, allocations };
}

function parseNumberList(str) {
  return str.split(",").map((s) => s.trim()).filter((s) => s.length).map(Number);
}

document.getElementById("mem-sample").addEventListener("click", () => {
  document.getElementById("mem-blocks").value = "100, 500, 200, 300, 600";
  document.getElementById("mem-procs").value = "212, 417, 112, 426";
});
document.getElementById("mem-reset").addEventListener("click", () => {
  document.getElementById("mem-blocks").value = "";
  document.getElementById("mem-procs").value = "";
  document.getElementById("mem-results").classList.add("hidden");
  document.getElementById("mem-empty").classList.remove("hidden");
  document.getElementById("mem-error").classList.add("hidden");
});

function showMemError(msg) {
  const el = document.getElementById("mem-error");
  if (!msg) { el.classList.add("hidden"); el.textContent = ""; return; }
  el.textContent = msg;
  el.classList.remove("hidden");
}

document.getElementById("mem-run").addEventListener("click", () => {
  const blocks = parseNumberList(document.getElementById("mem-blocks").value);
  const procs = parseNumberList(document.getElementById("mem-procs").value);
  if (!blocks.length) return showMemError("Enter at least one memory block size.");
  if (!procs.length) return showMemError("Enter at least one process size.");
  if (blocks.some((b) => !Number.isFinite(b) || b <= 0) || procs.some((p) => !Number.isFinite(p) || p <= 0)) {
    return showMemError("Sizes must be positive numbers.");
  }
  showMemError(null);

  const strategy = document.getElementById("mem-algo").value;
  const { blocks: result, allocations } = allocateMemory(blocks, procs, strategy);
  renderMemResults(result, allocations);
});

function renderMemResults(blocks, allocations) {
  document.getElementById("mem-empty").classList.add("hidden");
  document.getElementById("mem-results").classList.remove("hidden");

  const mapEl = document.getElementById("mem-map");
  mapEl.innerHTML = "";
  blocks.forEach((b, i) => {
    const div = document.createElement("div");
    div.className = "mem-block " + (b.free ? "free" : "allocated");
    div.style.animationDelay = i * 0.04 + "s";
    div.innerHTML = `
      <div class="mb-left">
        <span>Block ${b.index + 1}${b.process ? " — " + b.process : ""}</span>
        <span class="mb-size">${b.size} KB total${b.free ? "" : ` &middot; ${b.frag} KB fragmentation`}</span>
      </div>
      <span class="mb-tag">${b.free ? "free" : "allocated"}</span>
    `;
    mapEl.appendChild(div);
  });

  const tbody = document.querySelector("#mem-result-table tbody");
  tbody.innerHTML = "";
  allocations.forEach((a) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.pid}</td>
      <td>${a.size} KB</td>
      <td>${a.block ? "Block " + a.block : "—"}</td>
      <td>${a.block ? a.frag + " KB" : "Not allocated"}</td>
    `;
    tbody.appendChild(tr);
  });

  const allocatedCount = allocations.filter((a) => a.block).length;
  const totalFrag = allocations.reduce((s, a) => s + (a.frag || 0), 0);
  document.getElementById("mem-stats").innerHTML = `
    <div class="stat-pill">Processes placed <b>${allocatedCount} / ${allocations.length}</b></div>
    <div class="stat-pill">Total internal fragmentation <b>${totalFrag} KB</b></div>
  `;
}

/* ======================================================================
   3) DISK SCHEDULING
   ====================================================================== */

function diskFCFS(requests, head) {
  const path = [head, ...requests];
  let total = 0;
  for (let i = 1; i < path.length; i++) total += Math.abs(path[i] - path[i - 1]);
  return { serviceOrder: [...requests], path, total, jumps: [] };
}

function diskSSTF(requests, head) {
  let cur = head;
  const remaining = [...requests];
  const order = [];
  const path = [head];
  let total = 0;
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Math.abs(remaining[0] - cur);
    for (let i = 1; i < remaining.length; i++) {
      const d = Math.abs(remaining[i] - cur);
      if (d < bestDist || (d === bestDist && remaining[i] < remaining[bestIdx])) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining[bestIdx];
    total += bestDist;
    path.push(next);
    order.push(next);
    cur = next;
    remaining.splice(bestIdx, 1);
  }
  return { serviceOrder: order, path, total, jumps: [] };
}

// SCAN: go to the disk boundary in the current direction, then reverse.
function diskSCAN(requests, head, diskMax, direction) {
  const sorted = [...requests].sort((a, b) => a - b);
  const less = sorted.filter((r) => r < head);
  const greaterEq = sorted.filter((r) => r >= head);
  let serviceOrder = [];
  const path = [head];
  if (direction === "right") {
    serviceOrder = [...greaterEq, ...less.slice().reverse()];
    path.push(...greaterEq);
    if (greaterEq[greaterEq.length - 1] !== diskMax) path.push(diskMax);
    path.push(...less.slice().reverse());
  } else {
    serviceOrder = [...less.slice().reverse(), ...greaterEq];
    path.push(...less.slice().reverse());
    if (less[0] !== 0) path.push(0);
    path.push(...greaterEq);
  }
  let total = 0;
  for (let i = 1; i < path.length; i++) total += Math.abs(path[i] - path[i - 1]);
  return { serviceOrder, path, total, jumps: [] };
}

// C-SCAN: like SCAN, but jumps back to 0 (or diskMax) without servicing, then continues.
function diskCSCAN(requests, head, diskMax, direction) {
  const sorted = [...requests].sort((a, b) => a - b);
  const less = sorted.filter((r) => r < head);
  const greaterEq = sorted.filter((r) => r >= head);
  let serviceOrder = [];
  const path = [head];
  const jumps = [];
  if (direction === "right") {
    serviceOrder = [...greaterEq, ...less];
    path.push(...greaterEq);
    if (greaterEq[greaterEq.length - 1] !== diskMax) path.push(diskMax);
    jumps.push(path.length - 1); // index of the point right before the jump
    path.push(0);
    path.push(...less);
  } else {
    serviceOrder = [...less.slice().reverse(), ...greaterEq.slice().reverse()];
    path.push(...less.slice().reverse());
    if (less[0] !== 0) path.push(0);
    jumps.push(path.length - 1);
    path.push(diskMax);
    path.push(...greaterEq.slice().reverse());
  }
  let total = 0;
  for (let i = 1; i < path.length; i++) total += Math.abs(path[i] - path[i - 1]);
  return { serviceOrder, path, total, jumps };
}

document.getElementById("disk-algo").addEventListener("change", (e) => {
  const needsDir = e.target.value === "scan" || e.target.value === "cscan";
  document.getElementById("disk-dir-field").classList.toggle("hidden", !needsDir);
});

document.getElementById("disk-sample").addEventListener("click", () => {
  document.getElementById("disk-head").value = 53;
  document.getElementById("disk-size").value = 200;
  document.getElementById("disk-requests").value = "98, 183, 37, 122, 14, 124, 65, 67";
});
document.getElementById("disk-reset").addEventListener("click", () => {
  document.getElementById("disk-head").value = "";
  document.getElementById("disk-size").value = 200;
  document.getElementById("disk-requests").value = "";
  document.getElementById("disk-results").classList.add("hidden");
  document.getElementById("disk-empty").classList.remove("hidden");
  document.getElementById("disk-error").classList.add("hidden");
});

function showDiskError(msg) {
  const el = document.getElementById("disk-error");
  if (!msg) { el.classList.add("hidden"); el.textContent = ""; return; }
  el.textContent = msg;
  el.classList.remove("hidden");
}

document.getElementById("disk-run").addEventListener("click", () => {
  const head = Number(document.getElementById("disk-head").value);
  const diskSizeInput = Number(document.getElementById("disk-size").value);
  const requests = parseNumberList(document.getElementById("disk-requests").value);
  const algo = document.getElementById("disk-algo").value;
  const direction = document.getElementById("disk-dir").value;

  if (!Number.isFinite(diskSizeInput) || diskSizeInput < 2) return showDiskError("Disk size must be at least 2 cylinders.");
  const diskMax = diskSizeInput - 1;
  if (!Number.isFinite(head) || head < 0 || head > diskMax) return showDiskError(`Head position must be between 0 and ${diskMax}.`);
  if (!requests.length) return showDiskError("Enter at least one request.");
  if (requests.some((r) => !Number.isFinite(r) || r < 0 || r > diskMax)) return showDiskError(`Requests must be between 0 and ${diskMax}.`);
  showDiskError(null);

  let result;
  if (algo === "fcfs") result = diskFCFS(requests, head);
  else if (algo === "sstf") result = diskSSTF(requests, head);
  else if (algo === "scan") result = diskSCAN(requests, head, diskMax, direction);
  else result = diskCSCAN(requests, head, diskMax, direction);

  renderDiskResults(result, head, diskMax, requests);
});

function renderDiskResults({ serviceOrder, path, total, jumps }, head, diskMax, requests) {
  document.getElementById("disk-empty").classList.add("hidden");
  document.getElementById("disk-results").classList.remove("hidden");

  const svg = document.getElementById("disk-svg");
  const W = 720, H = 320;
  const padL = 46, padR = 30, padT = 24, padB = 34;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = "";

  const xFor = (cyl) => padL + (cyl / diskMax) * (W - padL - padR);
  const rowH = Math.min(26, (H - padT - padB) / Math.max(1, path.length - 1));
  const yFor = (step) => padT + step * rowH;

  const ns = "http://www.w3.org/2000/svg";
  const make = (tag, attrs) => {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  // axis line
  svg.appendChild(make("line", { x1: padL, y1: padT - 10, x2: W - padR, y2: padT - 10, stroke: "#232b37", "stroke-width": 1 }));
  [0, diskMax].forEach((c) => {
    svg.appendChild(make("text", { x: xFor(c), y: padT - 16, "text-anchor": "middle", fill: "#55606f", "font-size": 10, "font-family": "SFMono-Regular,Consolas,monospace" })).textContent = c;
  });
  [...new Set(requests)].forEach((r) => {
    svg.appendChild(make("line", { x1: xFor(r), y1: padT - 14, x2: xFor(r), y2: padT - 6, stroke: "#3a4451", "stroke-width": 1 }));
  });

  // path lines
  for (let i = 1; i < path.length; i++) {
    const isJump = jumps.includes(i - 1) && Math.abs(path[i] - path[i - 1]) > 1 && (path[i] === 0 || path[i] === diskMax);
    const line = make("line", {
      x1: xFor(path[i - 1]), y1: yFor(i - 1),
      x2: xFor(path[i]), y2: yFor(i),
      stroke: "var(--disk)", "stroke-width": 2,
      "stroke-dasharray": isJump ? "5,4" : "0",
      opacity: isJump ? 0.55 : 0.95,
    });
    svg.appendChild(line);
  }

  // points
  path.forEach((cyl, i) => {
    const isHead = i === 0;
    const circle = make("circle", {
      cx: xFor(cyl), cy: yFor(i), r: isHead ? 5 : 3.5,
      fill: isHead ? "#e7ebf1" : "var(--disk)",
      stroke: "#0a0e14", "stroke-width": 1.4,
    });
    svg.appendChild(circle);
    const label = make("text", {
      x: xFor(cyl), y: yFor(i) - 8, "text-anchor": "middle",
      fill: isHead ? "#e7ebf1" : "#8b96a6", "font-size": 10.5,
      "font-family": "SFMono-Regular,Consolas,monospace",
    });
    label.textContent = isHead ? `head (${cyl})` : cyl;
    svg.appendChild(label);
  });

  // service order
  const orderEl = document.getElementById("disk-order");
  const parts = [`<span>${head}</span> <span class="arrow">start</span>`];
  path.slice(1).forEach((c, i) => {
    const wasJump = jumps.includes(i);
    parts.push(`<span class="arrow">→</span> <span class="${wasJump ? "jump" : ""}">${c}</span>`);
  });
  orderEl.innerHTML = parts.join(" ");

  document.getElementById("disk-stats").innerHTML = `
    <div class="stat-pill">Total head movement <b>${total}</b> cylinders</div>
    <div class="stat-pill">Average seek length <b>${fmt(total / requests.length)}</b></div>
    <div class="stat-pill">Requests serviced <b>${serviceOrder.length}</b></div>
  `;
}

/* ---------------------------- init ---------------------------- */
loadCpuSample();
