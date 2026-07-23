# Mini OS Simulator

A small, browser-based GUI that simulates three classic operating-system topics:
**CPU scheduling**, **memory allocation**, and **disk scheduling**. Built as a
single static web app — no installation, server, or internet connection needed.

## How to run

Open `index.html` in any modern browser (Chrome, Firefox, Edge). That's it —
there is nothing to install and nothing to build. All three files
(`index.html`, `style.css`, `script.js`) must stay in the same folder.

## Features

### 1. CPU Scheduling
- Algorithms: **FCFS**, **SJF** (non-preemptive), **Priority Scheduling**
  (non-preemptive, lower number = higher priority), **Round Robin**.
- Editable process table (arrival time, burst time, priority).
- Animated Gantt chart with a time ruler.
- Per-process Completion / Turnaround / Waiting time, plus averages.

### 2. Memory Management
- Algorithms: **First Fit**, **Best Fit**, **Worst Fit**.
- Model: fixed-size memory partitions, each holding at most one process
  (the classic contiguous-allocation exercise used in most OS courses).
- Visual memory map showing which block each process lands in, and the
  internal fragmentation left over.
- Flags any process that couldn't be placed.

### 3. Disk Scheduling
- Algorithms: **FCFS**, **SSTF**, **SCAN**, **C-SCAN**.
- Configurable head start position, disk size, and request queue.
- A seek-path diagram (cylinder position vs. service order) plus the total
  head movement and average seek length.

Every panel has a **Load sample** button pre-filled with a well-known
textbook example, so you can demo the tool instantly without typing data.

## Algorithms & assumptions

These are worth knowing before a demo or viva, since disk-scheduling
conventions in particular vary between textbooks:

- **CPU ties** (same arrival time, same burst time, etc.) are broken by the
  order processes were entered in the table.
- **Round Robin** adds newly-arrived processes to the back of the ready
  queue *before* re-queueing the process that just used up its quantum.
- **Memory allocation** here is the fixed-partition model: a block is either
  free or holds exactly one process. It does not split or merge blocks.
- **SCAN** is implemented per its formal definition: the head travels all
  the way to the disk boundary (0 or the last cylinder) in whatever
  direction it's currently heading — even if no request sits exactly there
  — then reverses and services the rest, stopping once the queue is empty.
- **C-SCAN** behaves the same way outward, but instead of reversing, it
  jumps back to cylinder 0 (without servicing anything on the way) and
  continues in the same direction. That jump is counted as real head
  movement here, which is the physically accurate way to measure it.
  Some course slides simplify this by treating the jump as "free" or by
  skipping the boundary trip entirely — if your instructor's numbers look
  different, this is almost always why, and it's worth raising in the demo.

All four CPU-scheduling and disk-scheduling algorithms were checked against
worked examples from *Operating System Concepts* (Silberschatz, Galvin,
Gagne) before being wired into the UI, so the numbers you see match the
standard textbook results for those cases.

## Project structure

```
mini-os-simulator/
├── index.html   # markup for all three panels
├── style.css    # dark, technical theme; one accent colour per module
├── script.js    # algorithms + rendering + all UI wiring
└── README.md    # this file
```

## Possible next steps

The assignment brief mentions further tasks will follow — natural
extensions to this base if you want to keep building:
- Preemptive SJF / Priority scheduling (shortest-remaining-time).
- A step-by-step "play" mode that animates the Gantt chart or disk head
  moving in real time instead of rendering the final result instantly.
- Paging/segmentation as a second memory-management mode.
- Exporting results (Gantt chart, tables) as an image or PDF for the report.

## Tech stack

Plain HTML, CSS, and JavaScript — no frameworks, no build step, no
dependencies. This was a deliberate choice: the assignment says the
language is optional and the focus is on correctly implementing and
explaining the algorithms, so keeping the stack simple keeps the demo
(and the "explain your logic" part of the viva) straightforward.


## Contributors

Developed for the Operating Systems Course (July 2026) by:


- Subodh Humagain
- Biplav Shree Basnet
- Sulav Tiwari
- Sujal Makaju

Submitted to: Rabina Shrestha

Department of Mathematics, Kathmandu University



