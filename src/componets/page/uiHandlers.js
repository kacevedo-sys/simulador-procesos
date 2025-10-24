// uiHandlers.js — renderizado del Gantt, tabla de procesos y resultados
export const MAX_TIME = 30;
export const PROCESS_NAMES = ['A','B','C','D','E','F','G'];
export const colors = { A:'p-A', B:'p-B', C:'p-C', D:'p-D', E:'p-E', F:'p-F', G:'p-G' };

const procTableBody = () => document.querySelector('#procTable tbody');
const ganttGrid = () => document.getElementById('ganttGrid');
const timeHeader = () => document.getElementById('timeHeader');
const legend = () => document.getElementById('legend');
const resultsTbody = () => document.querySelector('#resultsTable tbody');
const resultsFoot = () => document.getElementById('resultsFoot');
const metricsArea = () => document.getElementById('metricsArea');
const summary = () => document.getElementById('summary');

export function renderTimeHeader(){ const el = timeHeader(); if(!el) return; el.innerHTML=''; for(let i=0;i<MAX_TIME;i++){ const c = document.createElement('div'); c.className='time-cell'; c.textContent = i; el.appendChild(c); } }

export function renderEmptyGantt(){ const grid = ganttGrid(); if(!grid) return; grid.innerHTML=''; for(const rowName of PROCESS_NAMES){ const row = document.createElement('div'); row.className='row'; const label = document.createElement('div'); label.className='row-label'; label.textContent = rowName; row.appendChild(label); const rowCells = document.createElement('div'); rowCells.className='row-cells'; for(let c=0;c<MAX_TIME;c++){ const cell = document.createElement('div'); cell.className='cell empty'; cell.dataset.proc=''; rowCells.appendChild(cell); } row.appendChild(rowCells); grid.appendChild(row); } renderLegend(); }

export function renderLegend(){ const el = legend(); if(!el) return; el.innerHTML = ''; for(const p of PROCESS_NAMES){ const item=document.createElement('div'); item.className='legend-item'; const sw=document.createElement('div'); sw.style.width='18px'; sw.style.height='14px'; sw.style.borderRadius='3px'; sw.className = colors[p]; const label=document.createElement('div'); label.textContent = p + (window.SIM_PROCESSES && window.SIM_PROCESSES[p] ? ' (t='+window.SIM_PROCESSES[p].burst+', ti='+window.SIM_PROCESSES[p].arrival+')' : ' — vacío'); item.appendChild(sw); item.appendChild(label); el.appendChild(item); } }

export function refreshProcTable(){ const tb = procTableBody(); if(!tb) return; tb.innerHTML=''; for(const p of PROCESS_NAMES){ const pr = window.SIM_PROCESSES && window.SIM_PROCESSES[p]; if(pr){ const tr = document.createElement('tr'); tr.innerHTML = `<td>${p}</td><td>${pr.arrival}</td><td>${pr.burst}</td>`; tb.appendChild(tr); } } renderLegend(); }

// Añadir versión con logging para depuración (se usa la misma función)
const _origRefresh = refreshProcTable;
export function refreshProcTableWithLog(){ console.log('[ui] refreshProcTable — current processes:', window.SIM_PROCESSES); _origRefresh(); }

export function paintGantt(timeline){ renderEmptyGantt(); const rows = ganttGrid().querySelectorAll('.row'); for(let t=0;t<Math.min(timeline.length, MAX_TIME); t++){ const p = timeline[t]; if(!p) continue; const idx = PROCESS_NAMES.indexOf(p); if(idx<0) continue; const row = rows[idx]; const cells = row.querySelectorAll('.cell'); const cell = cells[t]; cell.className = 'cell ' + colors[p]; cell.textContent = p; } 
