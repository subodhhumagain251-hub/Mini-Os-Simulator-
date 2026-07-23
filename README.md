# Mini-Os-Simulator
Mini OS Simulator
A browser-based tool designed to bridge the gap between Operating Systems theory and practice. This simulator provides a visual, step-by-step demonstration of classic CPU scheduling, memory management, and disk scheduling algorithms.
Overview
While OS concepts are often taught through static diagrams and pseudocode, this project allows users to experiment with their own data. Built entirely with front-end technologies, it generates real-time Gantt charts, memory maps, and disk seek graphs to help students build an intuitive understanding of how these subsystems behave.
Key Features
1. CPU Scheduling
Visualizes how processes are assigned processor time.
Algorithms: First Come First Served (FCFS), Shortest Job First (Non-Preemptive), Priority Scheduling (Non-Preemptive), and Round Robin.
Output: Dynamic Gantt charts and a results table including Completion Time, Turnaround Time, and Waiting Time.
2. Memory Management
Simulates contiguous memory allocation using fixed-size partitions.
Algorithms: First Fit, Best Fit, and Worst Fit.
Output: A visual memory map showing allocated regions, free blocks, and internal fragmentation.
3. Disk Scheduling
Models the order in which a read/write head services I/O requests.
Algorithms: FCFS, SSTF, SCAN, and C-SCAN.
Output: A seek-path graph (cylinder position vs. order) and total head movement calculation.
Technology Stack
Languages: HTML5, CSS3, Vanilla JavaScript.
Tools: Developed using Visual Studio Code.
Architecture: A single set of static files with no external frameworks or backend dependencies. It is designed to work entirely offline in any modern web browser.
How to Run
Clone or download the repository.
Ensure index.html, style.css, and script.js are in the same folder.
Open index.html in any web browser (Chrome, Firefox, Edge, etc.).
Project Structure
index.html: Defines the layout, input forms, and result containers.
style.css: Manages the visual presentation, including the dark theme and chart styling.
script.js: Contains all algorithmic logic, calculations, and UI rendering.
Future Improvements
Support for Paging and Segmentation in the memory module.
Implementation of preemptive variants (Preemptive SJF/SRTF).
Real-time step-by-step execution animations.
Ability to export results as PDF or image files.
Contributors
This project was developed for the Operating Systems course (July 2026) by:
Biplav Shree Basnet
Subodh Humagain
Sulav Tiwari
Sujal Makaju
Submitted to: Rabina Shrestha
Department: Department of Mathematics, Kathmandu University.
