
import { CTDPEngine } from './core/ctdp.js';
import { RSIPEngine } from './core/rsip.js';

const ctdp = new CTDPEngine();
const rsip = new RSIPEngine();

const contentEl = document.getElementById('content');
const navCtdp = document.getElementById('nav-ctdp');
const navRsip = document.getElementById('nav-rsip');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const btnTheory = document.getElementById('btn-theory');
const btnTheoryMobile = document.getElementById('btn-theory-mobile');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const btnConfig = document.getElementById('btn-config');
const btnSync = document.getElementById('btn-sync');

let currentView = 'ctdp';
let ctdpTimerInterval = null;
let taskGroups = [];
let cloud = null;

function render() {
    contentEl.innerHTML = '';
    
    // Update Nav State
    const activeClass = ['text-indigo-600', 'bg-indigo-50'];
    const inactiveClass = ['text-gray-500'];

    if (currentView === 'ctdp') {
        navCtdp.classList.add(...activeClass);
        navCtdp.classList.remove(...inactiveClass);
        navRsip.classList.add(...inactiveClass);
        navRsip.classList.remove(...activeClass);
        renderCTDP();
    } else {
        navRsip.classList.add(...activeClass);
        navRsip.classList.remove(...inactiveClass);
        navCtdp.classList.add(...inactiveClass);
        navCtdp.classList.remove(...activeClass);
        renderRSIP();
    }
}

// --- CTDP View (Focus) ---
function renderCTDP() {
    const state = ctdp.getState();
    const container = document.createElement('div');
    container.className = 'flex flex-col items-center space-y-6 w-full max-w-2xl mx-auto px-4 md:px-0';

    // Header Stats
    const stats = document.createElement('div');
    stats.className = 'w-full grid grid-cols-2 gap-4 md:gap-6';
    stats.innerHTML = `
        <div id="main-chain-card" class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer">
            <div class="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">${state.chainCount}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">主链连胜 (Main Chain)</div>
            <div class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">点击查看历史</div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div class="text-4xl font-extrabold text-blue-500 dark:text-blue-400 mb-1">${state.auxChainCount}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">预约链 (Reservation Chain)</div>
        </div>
    `;
    container.appendChild(stats);

    // Status & Action Area
    const actionArea = document.createElement('div');
    actionArea.className = 'w-full bg-white dark:bg-slate-800 p-6 md:p-10 rounded-3xl shadow-lg flex flex-col items-center justify-center space-y-6 border border-indigo-50 dark:border-slate-700 min-h-[350px] md:min-h-[400px] relative overflow-hidden';
    
    // Background decoration
    const bgDeco = document.createElement('div');
    bgDeco.className = 'absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500';
    actionArea.appendChild(bgDeco);

    if (state.status === 'idle') {
        // Collect tasks
        let taskOptions = '<option value="">-- 选择任务 (可选) --</option>';
        taskGroups.forEach(g => {
            if (g.tasks.length > 0) {
                taskOptions += `<optgroup label="${g.name}">`;
                g.tasks.forEach(t => {
                    const dur = t.minutes ? ` (${t.minutes}m)` : '';
                    let icon = '';
                    if (t.type === 'i_will') icon = '💪 ';
                    else if (t.type === 'i_wont') icon = '🛑 ';
                    else if (t.type === 'i_want') icon = '🎯 ';
                    taskOptions += `<option value="${t.id}">${icon}${t.title}${dur}</option>`;
                });
                taskOptions += `</optgroup>`;
            }
        });

        actionArea.innerHTML += `
            <div class="text-gray-300 dark:text-slate-600 mb-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">准备专注？</h2>
            <p class="text-gray-500 dark:text-gray-400 text-center max-w-md">执行“神圣座位原则”。一旦坐下，必须专注。</p>
            
            <div class="w-full max-w-md mt-2 flex gap-2">
                <select id="task-select" class="flex-1 p-3 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-200 outline-none transition-all">
                    ${taskOptions}
                </select>
                <button id="btn-quick-add-task" class="p-3 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-slate-600 transition-colors border border-indigo-100 dark:border-slate-600" title="快速创建任务">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full max-w-md mt-4">
                <button id="btn-reserve" class="flex-1 py-4 px-6 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all transform hover:scale-[1.02] border border-blue-100 dark:border-blue-900">
                    预约座位 (15分钟)
                </button>
                <button id="btn-start" class="flex-1 py-4 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none transform hover:scale-[1.02]">
                    现在坐下 (开始)
                </button>
            </div>
        `;
    } else if (state.status === 'reserved') {
        actionArea.innerHTML += `
             <div class="text-blue-500 dark:text-blue-400 mb-2 animate-pulse">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 class="text-3xl font-bold text-blue-600 dark:text-blue-400">座位已预约</h2>
            <p class="text-gray-600 dark:text-gray-300 text-center">请在倒计时结束前回到座位并开始专注。</p>
            <div id="timer-display" class="text-6xl font-mono font-bold text-gray-800 dark:text-gray-100 my-6 tracking-tight">15:00</div>
            <button id="btn-start" class="w-full max-w-md py-4 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none transform hover:scale-[1.02]">
                我已就座，开始专注
            </button>
        `;
    } else if (state.status === 'active') {
        const taskName = state.currentTask ? state.currentTask.title : '无特定任务';
        const taskDur = state.currentTask && state.currentTask.minutes ? ` / ${state.currentTask.minutes}m` : '';
        
        actionArea.innerHTML += `
            <div class="text-green-500 dark:text-green-400 mb-2 animate-pulse">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 class="text-3xl font-bold text-green-600 dark:text-green-400">专注进行中...</h2>
            <div class="text-center">
                <p class="text-gray-800 dark:text-gray-100 font-bold text-lg">${taskName}</p>
                <p class="text-gray-500 dark:text-gray-400 text-sm">神圣座位原则生效中</p>
            </div>
            <div id="timer-display" class="text-6xl font-mono font-bold text-gray-800 dark:text-gray-100 my-6 tracking-tight">00:00${taskDur}</div>
            <div class="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <button id="btn-exception" class="flex-1 py-4 px-6 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors border border-yellow-100 dark:border-yellow-900">
                    分心了 (例外)
                </button>
                <button id="btn-fail" class="flex-1 py-4 px-6 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border border-red-100 dark:border-red-900">
                    分心了 (重置)
                </button>
                <button id="btn-complete" class="flex-1 py-4 px-6 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 dark:shadow-none transform hover:scale-[1.02]">
                    完成任务
                </button>
            </div>
        `;
    } else if (state.status === 'paused') {
        actionArea.innerHTML += `
            <div class="text-yellow-500 dark:text-yellow-400 mb-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">专注已暂停</h2>
            <p class="text-gray-600 dark:text-gray-300 text-center">例外处理中... 请尽快恢复。</p>
            <div id="timer-display" class="text-6xl font-mono font-bold text-gray-400 dark:text-gray-500 my-6 tracking-tight">PAUSED</div>
            <div class="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <button id="btn-resume" class="flex-1 py-4 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none transform hover:scale-[1.02]">
                    恢复专注
                </button>
                 <button id="btn-fail" class="flex-1 py-4 px-6 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border border-red-100 dark:border-red-900">
                    彻底分心 (重置)
                </button>
            </div>
        `;
    }

    container.appendChild(actionArea);

    // Task Groups Section
    const taskSection = document.createElement('div');
    taskSection.className = 'w-full max-w-2xl mt-8 pb-20';
    taskSection.innerHTML = `
        <div class="flex items-center justify-between mb-4 px-2">
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100">任务群管理</h3>
            <button id="btn-add-group" class="px-4 py-2 text-sm font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 shadow-sm transition-all">
                + 新增任务群
            </button>
        </div>
        <div id="task-groups" class="space-y-4"></div>
    `;
    container.appendChild(taskSection);

    contentEl.appendChild(container);

    renderTaskGroups();

    // Bind Events
    document.getElementById('main-chain-card').onclick = () => renderHistoryModal();

    if (state.status === 'idle') {
        const btnQuick = document.getElementById('btn-quick-add-task');
        if(btnQuick) {
            btnQuick.onclick = () => {
                if (taskGroups.length === 0) {
                     if(confirm("还没有任务群，是否创建一个？")) {
                         const name = prompt('任务群名称：', '我的任务群');
                         if (name) {
                             const newGroup = { id: Date.now().toString(), name, tasks: [] };
                             taskGroups.push(newGroup);
                             saveTaskGroups();
                             renderTaskGroups();
                             renderCreateTaskModal(newGroup.id);
                         }
                     }
                } else {
                    renderCreateTaskModal(taskGroups[0].id);
                }
            };
        }
        document.getElementById('btn-reserve').onclick = () => { ctdp.reserve(); render(); };
        document.getElementById('btn-start').onclick = () => { 
            const select = document.getElementById('task-select');
            let task = null;
            if (select && select.value) {
                const allTasks = taskGroups.flatMap(g => g.tasks);
                task = allTasks.find(t => t.id === select.value);
            }
            ctdp.startSession(task); 
            render(); 
        };
    } else if (state.status === 'reserved') {
        document.getElementById('btn-start').onclick = () => {
            try { 
                 const select = document.getElementById('task-select'); // Wait, reserved view doesn't have select. 
                 // If reserved, user probably didn't select task yet? 
                 // We should allow selecting task when starting from reserved.
                 // For simplicity, let's just start without specific task or add selection in reserved view too.
                 // Current implementation above doesn't have select in reserved view. 
                 // Let's assume generic session for now or ask via prompt if crucial.
                 ctdp.startSession(); 
                 render(); 
            } catch(e) { alert(e.message); render(); }
        };
        startTimer(new Date(state.reservationTime), state.reservationDuration, true);
    } else if (state.status === 'active') {
        document.getElementById('btn-exception').onclick = () => renderExceptionModal();
        document.getElementById('btn-fail').onclick = () => {
            if(confirm("确认分心并重置？")) { ctdp.fail('Reset'); render(); }
        };
        document.getElementById('btn-complete').onclick = () => { 
             const notes = prompt("任务完成！有什么想备注的吗？");
             ctdp.completeSession(notes || ''); 
             render(); 
        };
        startTimer(new Date(state.startTime), 0, false, state.totalPausedTime);
    } else if (state.status === 'paused') {
        document.getElementById('btn-resume').onclick = () => { ctdp.resume(); render(); };
        document.getElementById('btn-fail').onclick = () => {
            if(confirm("确认分心并重置？")) { ctdp.fail('Reset during pause'); render(); }
        };
    }
}

function startTimer(startTime, durationMs, isCountdown, initialPausedTime = 0) {
    if (ctdpTimerInterval) clearInterval(ctdpTimerInterval);
    
    const display = document.getElementById('timer-display');
    if (!display) return;

    const update = () => {
        const now = new Date();
        let diff;
        
        if (isCountdown) {
            const end = new Date(startTime.getTime() + durationMs);
            diff = end - now;
            if (diff <= 0) {
                diff = 0;
                clearInterval(ctdpTimerInterval);
                ctdp.fail('Reservation Expired');
                render();
                return;
            }
        } else {
            // For active session: Duration = (Now - Start) - PausedTime
            diff = now - startTime - initialPausedTime;
        }

        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        // Only show MM:SS
        display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        // Append task duration if active
        if (!isCountdown) {
             const state = ctdp.getState();
             if (state.currentTask && state.currentTask.minutes) {
                 display.textContent += ` / ${state.currentTask.minutes}m`;
             }
        }
    };

    update();
    ctdpTimerInterval = setInterval(update, 1000);
}

// --- Modals ---

function renderExceptionModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const state = ctdp.getState();
    const reasons = state.savedReasons || [];
    
    const content = document.createElement('div');
    content.className = 'bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all';
    
    content.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">分心了 (例外)</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">记录原因，下必为例。本次专注将暂停，直至恢复。</p>
        
        <div class="mb-4">
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">历史原因 (点击选择)</label>
            <div class="flex flex-wrap gap-2" id="reason-list">
                ${reasons.map(r => `<button class="px-3 py-1 bg-gray-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900 hover:text-indigo-600 dark:text-gray-300 rounded-full text-sm border border-gray-200 dark:border-slate-600 transition-colors reason-btn">${r}</button>`).join('')}
            </div>
        </div>
        
        <div class="mb-6">
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">新原因 / 编辑</label>
            <input type="text" id="reason-input" class="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="输入分心原因...">
        </div>
        
        <div class="flex gap-3">
            <button id="btn-cancel-modal" class="flex-1 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl">取消</button>
            <button id="btn-confirm-exception" class="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200">下必为例 (暂停)</button>
        </div>
        <div class="mt-4 text-center">
             <button id="btn-manage-reasons" class="text-xs text-indigo-500 hover:underline">管理原因列表</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Bindings
    const input = document.getElementById('reason-input');
    
    document.querySelectorAll('.reason-btn').forEach(btn => {
        btn.onclick = () => {
            input.value = btn.innerText;
        };
    });
    
    document.getElementById('btn-cancel-modal').onclick = () => modal.remove();
    
    document.getElementById('btn-confirm-exception').onclick = () => {
        const r = input.value;
        if (!r) return alert("请输入原因");
        ctdp.pause(r);
        modal.remove();
        render();
    };

    document.getElementById('btn-manage-reasons').onclick = () => {
        modal.remove();
        renderReasonManagerModal();
    };
}

function renderReasonManagerModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const state = ctdp.getState();
    
    const content = document.createElement('div');
    content.className = 'bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl';
    
    content.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">管理例外原因</h3>
        <div id="manage-list" class="space-y-2 mb-6 max-h-60 overflow-y-auto"></div>
        <div class="flex justify-end">
            <button id="btn-close-manager" class="px-6 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600">关闭</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    const list = document.getElementById('manage-list');
    
    const renderList = () => {
        list.innerHTML = '';
        const reasons = ctdp.getState().savedReasons || [];
        reasons.forEach(r => {
            const row = document.createElement('div');
            row.className = 'flex justify-between items-center bg-gray-50 p-3 rounded-lg';
            row.innerHTML = `<span>${r}</span>`;
            
            const del = document.createElement('button');
            del.className = 'text-red-500 hover:bg-red-50 p-1 rounded';
            del.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;
            del.onclick = () => {
                ctdp.removeReason(r);
                renderList();
            };
            row.appendChild(del);
            list.appendChild(row);
        });
    };
    
    renderList();
    
    document.getElementById('btn-close-manager').onclick = () => {
        modal.remove();
        renderExceptionModal(); // Go back
    };
}

function renderHistoryModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const state = ctdp.getState();
    const history = state.history || [];
    
    const content = document.createElement('div');
    content.className = 'bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]';
    
    content.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100">主链历史记录</h3>
            <button id="btn-close-history" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div class="overflow-y-auto flex-1 space-y-4 pr-2">
            ${history.length === 0 ? '<p class="text-center text-gray-500">暂无记录</p>' : ''}
            ${history.map(h => {
                const start = new Date(h.startTime).toLocaleString();
                const durMins = Math.floor(h.duration / 60000);
                const taskName = h.task ? h.task.title : '自由专注';
                const notes = h.notes || '';
                return `
                    <div class="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 border border-gray-100 dark:border-slate-600">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <div class="font-bold text-indigo-700 dark:text-indigo-400">${taskName}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">${start} · 持续 ${durMins} 分钟</div>
                            </div>
                            <button class="text-xs text-blue-500 hover:underline btn-edit-note" data-id="${h.id}">
                                ${notes ? '修改备注' : '添加备注'}
                            </button>
                        </div>
                        <div class="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-600 p-2 rounded border border-gray-100 dark:border-slate-500">
                            ${notes || '<span class="text-gray-400 italic">无备注</span>'}
                        </div>
                        ${h.exceptions && h.exceptions.length > 0 ? `
                            <div class="mt-2 text-xs text-red-400">
                                <strong>例外:</strong> ${h.exceptions.map(e => e.reason).join(', ')}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('btn-close-history').onclick = () => modal.remove();
    
    document.querySelectorAll('.btn-edit-note').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            const h = history.find(x => x.id === id);
            if (h) {
                const newNote = prompt("备注:", h.notes || '');
                if (newNote !== null) {
                    ctdp.updateHistoryNote(id, newNote);
                    modal.remove();
                    renderHistoryModal(); // Re-render
                }
            }
        };
    });
}



// --- RSIP View (Strategy) ---
function renderRSIP() {
    if (ctdpTimerInterval) clearInterval(ctdpTimerInterval);

    const nodes = rsip.getNodes();
    const container = document.createElement('div');
    container.className = 'max-w-5xl mx-auto pb-20';

    // Header
    container.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">国策树 (National Focus Tree)</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">拖拽节点可调整层级关系</p>
            </div>
            <div class="flex flex-wrap gap-2">
                 <!-- Sharing Toggle -->
                 <button id="btn-toggle-share" class="flex items-center space-x-2 text-sm px-4 py-2 rounded-lg font-bold transition-all border ${rsip.isShared ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-600'}">
                    <div class="w-3 h-3 rounded-full ${rsip.isShared ? 'bg-green-500' : 'bg-gray-400'}"></div>
                    <span>${rsip.isShared ? '共享已开启' : '共享已关闭'}</span>
                 </button>

                 <button id="btn-browse-community" class="flex items-center space-x-2 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>共识殿堂 (社区)</span>
                 </button>
                 
                 <button id="btn-import-code" class="flex items-center space-x-2 text-sm bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors border border-gray-200 dark:border-slate-600 shadow-sm">
                    <span>代码导入</span>
                 </button>
            </div>
        </div>
    `;

    // Render Tree
    const root = nodes.find(n => n.id === 'root');
    if (root) {
        container.appendChild(renderNode(root, nodes));
    }

    const impTitle = document.createElement('h3');
    impTitle.className = 'text-lg font-bold mt-10 mb-3';
    impTitle.textContent = '导入的国策树';
    container.appendChild(impTitle);
    const imported = rsip.getImportedTrees();
    const impWrap = document.createElement('div');
    impWrap.className = 'space-y-4';
    imported.forEach(t => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4';
        const title = document.createElement('div');
        title.className = 'font-bold mb-2 text-gray-800 dark:text-gray-100';
        title.textContent = t.name;
        card.appendChild(title);
        const actions = document.createElement('div');
        actions.className = 'flex gap-2';
        const btnView = document.createElement('button');
        btnView.className = 'px-3 py-1 text-sm bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-100 dark:border-slate-600';
        btnView.textContent = '查看';
        btnView.onclick = () => {
            const previewRoot = t.nodes.find(n => n.id === 'root');
            const wrap = document.createElement('div');
            wrap.className = 'mt-3';
            wrap.appendChild(renderNode(previewRoot, t.nodes));
            card.appendChild(wrap);
        };
        actions.appendChild(btnView);
        card.appendChild(actions);
        impWrap.appendChild(card);
    });
    container.appendChild(impWrap);



    contentEl.appendChild(container);

    // Bind Share Events
    document.getElementById('btn-toggle-share').onclick = () => {
        rsip.toggleShare();
        render(); // Re-render to update button state
    };

    document.getElementById('btn-browse-community').onclick = () => {
        renderCommunityModal();
    };

    document.getElementById('btn-import-code').onclick = () => {
        const code = prompt("粘贴分享链接或代码:");
        if (code) {
            handleImport(code);
        }
    };
}

const mockCommunityTrees = [
    {
        id: 'c1',
        author: '知乎大神',
        name: '考研上岸协议',
        description: '基于自控力原理设计的考研冲刺国策树，包含早起、背单词、刷题等核心节点。',
        likes: 1240,
        nodes: [
            { id: 'root', title: '考研上岸', description: '金榜题名时', status: 'inactive', parentId: null, children: ['c1_1', 'c1_2'] },
            { id: 'c1_1', title: '早起打卡', description: '每天6:30前起床', status: 'inactive', parentId: 'root', children: [] },
            { id: 'c1_2', title: '专注时长达标', description: '每日有效专注8小时', status: 'inactive', parentId: 'root', children: ['c1_2_1'] },
            { id: 'c1_2_1', title: '数学真题', description: '完成一套试卷', status: 'inactive', parentId: 'c1_2', children: [] }
        ]
    },
    {
        id: 'c2',
        author: '健身狂人',
        name: '斯巴达勇士计划',
        description: '30天塑形计划，严格控制饮食与训练。',
        likes: 856,
        nodes: [
            { id: 'root', title: '斯巴达之躯', description: '以此为誓', status: 'inactive', parentId: null, children: ['c2_1'] },
            { id: 'c2_1', title: '零糖摄入', description: '拒绝一切添加糖', status: 'inactive', parentId: 'root', children: ['c2_1_1'] },
            { id: 'c2_1_1', title: '有氧30分钟', description: '晨跑或夜跑', status: 'inactive', parentId: 'c2_1', children: [] }
        ]
    }
];

function renderCommunityModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900">
                <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100">共识殿堂 (社区共享)</h3>
                <button id="btn-close-community" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="flex flex-1 overflow-hidden">
                <!-- List Side -->
                <div class="w-1/3 border-r border-gray-100 dark:border-slate-700 overflow-y-auto bg-gray-50 dark:bg-slate-800/50">
                    <div class="p-4 space-y-3" id="community-list">
                        <!-- Items -->
                    </div>
                </div>
                <!-- Preview Side -->
                <div class="w-2/3 p-6 overflow-y-auto bg-white dark:bg-slate-800 relative">
                    <div id="community-preview" class="h-full flex flex-col">
                        <div class="flex-1 flex items-center justify-center text-gray-400">
                            <p>请选择左侧的国策树进行预览</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('btn-close-community').onclick = () => modal.remove();
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };

    const listEl = document.getElementById('community-list');
    const previewEl = document.getElementById('community-preview');

    mockCommunityTrees.forEach(tree => {
        const item = document.createElement('div');
        item.className = 'p-4 bg-white dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-all shadow-sm';
        item.innerHTML = `
            <h4 class="font-bold text-gray-800 dark:text-gray-100 text-sm">${tree.name}</h4>
            <div class="flex justify-between items-center mt-2">
                <span class="text-xs text-indigo-500 dark:text-indigo-400 font-medium">@${tree.author}</span>
                <span class="text-xs text-gray-400">♥ ${tree.likes}</span>
            </div>
        `;
        item.onclick = () => {
            // Highlight
            listEl.querySelectorAll('div').forEach(d => d.classList.remove('ring-2', 'ring-indigo-500'));
            item.classList.add('ring-2', 'ring-indigo-500');
            
            // Render Preview
            renderPreview(tree, previewEl, modal);
        };
        listEl.appendChild(item);
    });
}

function renderPreview(tree, container, modal) {
    container.innerHTML = `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">${tree.name}</h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">${tree.description}</p>
            <div class="flex gap-3">
                <button id="btn-import-tree" class="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
                    导入整棵树
                </button>
                <button class="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold rounded-lg cursor-not-allowed opacity-50" title="暂未开放">
                    挑选节点 (开发中)
                </button>
            </div>
        </div>
        <div class="border-t border-gray-100 dark:border-slate-700 pt-6">
            <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">结构预览</h3>
            <div id="tree-preview-content" class="pl-4 border-l-2 border-gray-100 dark:border-slate-700"></div>
        </div>
    `;

    // Render Tree Structure (Read-only)
    const treeContainer = container.querySelector('#tree-preview-content');
    
    // Helper to render nodes recursively
    const renderNodePreview = (nodeId) => {
        const node = tree.nodes.find(n => n.id === nodeId);
        if (!node) return document.createElement('div');

        const el = document.createElement('div');
        el.className = 'mb-4 relative';
        el.innerHTML = `
            <div class="flex items-start">
                <div class="w-3 h-3 rounded-full bg-gray-300 dark:bg-slate-600 mt-1.5 mr-3"></div>
                <div>
                    <h5 class="font-bold text-gray-700 dark:text-gray-200 text-sm">${node.title}</h5>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${node.description}</p>
                </div>
            </div>
        `;

        if (node.children && node.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'ml-2 pl-4 border-l border-gray-200 dark:border-slate-700 mt-2';
            node.children.forEach(childId => {
                childrenContainer.appendChild(renderNodePreview(childId));
            });
            el.appendChild(childrenContainer);
        }
        return el;
    };

    treeContainer.appendChild(renderNodePreview('root'));

    // Bind Import
    document.getElementById('btn-import-tree').onclick = () => {
        if(confirm(`确认导入 "${tree.name}" 吗？它将作为一个新的国策树保存。`)) {
            // Convert mock tree nodes to a clean import format (base64 simulation)
            // Or just directly use importAsNewTree logic if we have the object
            // RSIPEngine expects base64 string for importAsNewTree, but we can bypass or encode it.
            // Let's manually add it to importedTrees since we have the object directly.
            // But we should use rsip methods to be consistent.
            
            // We'll construct a JSON string and encode it to simulate "Cloud Import"
            const json = JSON.stringify(tree.nodes);
            const base64 = btoa(unescape(encodeURIComponent(json)));
            
            rsip.importAsNewTree(base64, tree.name);
            modal.remove();
            alert("导入成功！请在左侧侧边栏查看导入的国策树。");
            render();
        }
    };
}

function handleImport(input) {
    let code = input;
    if (input.includes('?import=')) {
        code = input.split('?import=')[1];
    }
    
    try {
        rsip.importAsNewTree(code, '导入国策树');
        alert('已导入为新树（未点亮），不会覆盖当前树');
        render();
    } catch(e) {
        alert('错误: ' + e.message);
    }
}

function renderNode(node, allNodes) {
    const el = document.createElement('div');
    // Styling: card look
    el.className = 'bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm mb-4 relative transition-all group';
    
    // Drag & Drop Attributes
    el.setAttribute('draggable', 'true');
    el.dataset.id = node.id;

    // Drag Events
    el.ondragstart = (e) => {
        e.stopPropagation(); // Only drag the specific node, not parent
        e.dataTransfer.setData('text/plain', node.id);
        e.dataTransfer.effectAllowed = 'move';
        el.classList.add('opacity-50');
    };

    el.ondragend = (e) => {
        e.stopPropagation();
        el.classList.remove('opacity-50');
        document.querySelectorAll('.drag-over').forEach(d => d.classList.remove('drag-over'));
    };

    el.ondragover = (e) => {
        e.preventDefault(); // Allow drop
        e.stopPropagation();
        // Visual feedback
        el.classList.add('drag-over');
    };

    el.ondragleave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('drag-over');
    };

    el.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('drag-over');
        
        const draggedId = e.dataTransfer.getData('text/plain');
        const targetId = node.id;

        if (draggedId && draggedId !== targetId) {
            rsip.moveNode(draggedId, targetId);
            render(); // Re-render tree
        }
    };
    
    let statusColor = 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200';
    let statusText = '未点亮';
    if (node.status === 'active') { statusColor = 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'; statusText = '进行中'; }
    if (node.status === 'completed') { statusColor = 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'; statusText = '已完成'; }
    if (node.status === 'failed') { statusColor = 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'; statusText = '已失败'; }

    // Node Content
    el.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="flex-1">
                <div class="flex items-center space-x-3 mb-1">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor}">${statusText}</span>
                    <h3 class="font-bold text-gray-800 dark:text-gray-100 text-lg">${node.title}</h3>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">${node.description}</p>
            </div>
            
            <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ${node.id !== 'root' ? `
                    <button class="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 btn-delete" title="删除">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                ` : ''}
                <button class="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 btn-add-child" title="添加子国策">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                    </svg>
                </button>
                ${node.status !== 'active' ? `
                <button class="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 btn-activate" title="点亮">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100-2H9a1 1 0 100 2h2zm-1 15a7 7 0 100-14 7 7 0 000 14z" />
                    </svg>
                </button>` : `
                <button class="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 btn-extinguish" title="熄灭">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 2a1 1 0 000 2h8a1 1 0 100-2H6zM4 6h12v2H4V6zm2 4h8v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6z" />
                    </svg>
                </button>`}
            </div>
        </div>
    `;

    // Render Children Container
    if (node.children && node.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree mt-6 ml-4 pl-6 space-y-4';
        
        node.children.forEach(childId => {
            const childNode = allNodes.find(n => n.id === childId);
            if (childNode) {
                childrenContainer.appendChild(renderNode(childNode, allNodes));
            }
        });
        el.appendChild(childrenContainer);
    }

    // Event Bindings
    el.querySelector('.btn-add-child').onclick = (e) => {
        e.stopPropagation();
        const title = prompt("新国策标题:");
        if (title) {
            const desc = prompt("描述:");
            rsip.addNode(node.id, title, desc || '');
            render();
        }
    };

    if (node.id !== 'root') {
        el.querySelector('.btn-delete').onclick = (e) => {
            e.stopPropagation();
            if(confirm(`确定要删除 "${node.title}" 及其所有子国策吗？`)) {
                rsip.deleteNode(node.id);
                render();
            }
        };
        
        const activateBtn = el.querySelector('.btn-activate');
        if (activateBtn) {
            if (rsip.canActivateNode(node.id)) {
                activateBtn.onclick = (e) => {
                    e.stopPropagation();
                    try {
                        rsip.activateNode(node.id);
                        render();
                    } catch (err) {
                        alert(err.message);
                    }
                };
            } else {
                activateBtn.classList.add('opacity-50', 'cursor-not-allowed');
                activateBtn.title = "必须先点亮父节点";
                activateBtn.onclick = (e) => {
                    e.stopPropagation();
                    alert("必须先点亮父节点！");
                };
            }
        }
        const extinguishBtn = el.querySelector('.btn-extinguish');
        if (extinguishBtn) {
            extinguishBtn.onclick = (e) => {
                e.stopPropagation();
                rsip.extinguishNode(node.id);
                render();
            };
        }
    }

    return el;
}

// Check for Import URL Param on Load
function checkUrlImport() {
    const params = new URLSearchParams(window.location.search);
    const importCode = params.get('import');
    if (importCode) {
        currentView = 'rsip';
        setTimeout(() => {
            try {
                rsip.importAsNewTree(importCode, '导入国策树');
                alert('已导入为新树（未点亮）');
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch(e) {
                alert('导入失败: ' + e.message);
            }
            render();
        }, 500);
    } else {
        render();
    }
}

// Navigation Events
navCtdp.onclick = () => { currentView = 'ctdp'; render(); };
navRsip.onclick = () => { currentView = 'rsip'; render(); };

// Initial Render
checkUrlImport();

function applyThemeFromStorage() {
    let pref = localStorage.getItem('theme_pref');
    // If no preference, use system
    if (!pref) pref = 'system';
    
    const html = document.documentElement;
    const iconSun = document.getElementById('icon-sun');
    const iconMoon = document.getElementById('icon-moon');
    const iconSystem = document.getElementById('icon-system');

    // Reset icons
    if (iconSun) iconSun.classList.add('hidden');
    if (iconMoon) iconMoon.classList.add('hidden');
    if (iconSystem) iconSystem.classList.add('hidden');

    let isDark = false;

    if (pref === 'dark') {
        isDark = true;
        if (iconMoon) iconMoon.classList.remove('hidden');
    } else if (pref === 'light') {
        isDark = false;
        if (iconSun) iconSun.classList.remove('hidden');
    } else {
        // System
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        isDark = mq.matches;
        if (iconSystem) iconSystem.classList.remove('hidden');
        
        // Ensure listener is only added once or handled properly
        // For simplicity in this static app, we just re-check on reload or toggle.
        // But for real-time system change support:
        mq.onchange = (e) => {
            if (localStorage.getItem('theme_pref') === 'system') {
                if (e.matches) {
                    html.classList.add('dark');
                    document.body.classList.add('theme-dark');
                    document.body.classList.remove('theme-light');
                } else {
                    html.classList.remove('dark');
                    document.body.classList.add('theme-light');
                    document.body.classList.remove('theme-dark');
                }
            }
        };
    }

    if (isDark) {
        html.classList.add('dark');
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light');
    } else {
        html.classList.remove('dark');
        document.body.classList.add('theme-light');
        document.body.classList.remove('theme-dark');
    }
}

if (btnThemeToggle) {
    btnThemeToggle.onclick = () => {
        const currentPref = localStorage.getItem('theme_pref') || 'system';
        let newPref;
        if (currentPref === 'light') {
            newPref = 'dark';
        } else if (currentPref === 'dark') {
            newPref = 'system';
        } else {
            newPref = 'light';
        }
        localStorage.setItem('theme_pref', newPref);
        applyThemeFromStorage();
    };
}
applyThemeFromStorage();

if (btnTheory) btnTheory.onclick = renderTheoryModal;
if (btnTheoryMobile) btnTheoryMobile.onclick = renderTheoryModal;

// ----- Task Groups -----
function loadTaskGroups() {
    try {
        taskGroups = JSON.parse(localStorage.getItem('task_groups') || '[]');
    } catch (e) {
        taskGroups = [];
    }
}
function saveTaskGroups() {
    localStorage.setItem('task_groups', JSON.stringify(taskGroups));
}
loadTaskGroups();


function renderTheoryModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900">
                <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100">核心原理：数学工程视角下的自控力</h3>
                <button id="btn-close-theory" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="p-6 overflow-y-auto prose dark:prose-invert max-w-none text-sm md:text-base">
                <p class="text-gray-600 dark:text-gray-300">
                    本系统基于<b>“将自控力视为数学工程问题”</b>的理念构建。我们不依赖模糊的“意志力”，而是通过设计稳态系统来约束行为。
                </p>
                
                <div class="my-6 bg-indigo-50 dark:bg-slate-700/50 p-4 rounded-xl border border-indigo-100 dark:border-slate-600">
                    <h4 class="text-indigo-700 dark:text-indigo-300 font-bold mb-2">核心公式：价值积分模型</h4>
                    <p class="font-mono text-sm md:text-base text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-800 p-3 rounded border border-gray-200 dark:border-slate-600 mb-2 overflow-x-auto">
                        I = ∫₀^∞ V(τ) · W(τ) dτ
                    </p>
                    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                        <li><b>V(τ) (未来价值函数)</b>：该行为在未来每一刻带来的真实价值。</li>
                        <li><b>W(τ) (权重贴现函数)</b>：你对未来的重视程度（通常随时间衰减）。</li>
                        <li><b>I (真实倾向)</b>：两者乘积的积分。只有当学习/工作的积分 I 大于玩乐的积分时，你才会行动。</li>
                    </ul>
                </div>

                <h4 class="font-bold text-gray-800 dark:text-gray-100 mt-4">系统两大协议</h4>
                
                <div class="space-y-4 mt-2">
                    <div>
                        <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            CTDP (链式时延协议)
                        </div>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            <b>解决“启动困难”和“中途分心”。</b><br>
                            通过“神圣座位”和“主链/预约链”机制，将庞大的长期价值 V(τ) 转化为当下必须维护的“连续性”价值，从而在 τ=0 时刻产生巨大的行动权重。
                        </p>
                    </div>
                    
                    <div>
                        <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            RSIP (递归稳态迭代协议)
                        </div>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            <b>解决“长远规划”和“迷茫”。</b><br>
                            利用递归树结构拆解目标，确保每一层的“稳态”都能支持上一层的目标。
                        </p>
                    </div>
                </div>
                
                <div class="mt-6 text-xs text-gray-400 text-center">
                    参考来源：知乎 @edmond (链式时延协议)
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('btn-close-theory').onclick = () => modal.remove();
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
}

function renderCreateTaskModal(groupId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const content = document.createElement('div');
    content.className = 'bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all';
    
    content.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">创建新任务</h3>
        
        <div class="mb-4">
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">任务名称</label>
            <input type="text" id="task-title" class="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="例如：完成报告">
        </div>
        
        <div class="mb-4">
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">任务描述</label>
            <input type="text" id="task-content" class="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="具体要做什么...">
        </div>
        
        <div class="mb-4">
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">预计时长 (分钟)</label>
            <input type="number" id="task-minutes" class="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="留空为无限">
        </div>
        
        <div class="mb-6">
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">类型 (自控力)</label>
            <div class="grid grid-cols-3 gap-2">
                <button type="button" class="type-btn p-3 border rounded-xl text-center text-sm font-bold transition-all hover:bg-indigo-50 dark:hover:bg-slate-600" data-type="i_will">
                    <div class="text-xl mb-1">💪</div>
                    我要做
                </button>
                <button type="button" class="type-btn p-3 border rounded-xl text-center text-sm font-bold transition-all hover:bg-indigo-50 dark:hover:bg-slate-600" data-type="i_wont">
                    <div class="text-xl mb-1">🛑</div>
                    我不要
                </button>
                <button type="button" class="type-btn p-3 border rounded-xl text-center text-sm font-bold transition-all hover:bg-indigo-50 dark:hover:bg-slate-600" data-type="i_want">
                    <div class="text-xl mb-1">🎯</div>
                    我想要
                </button>
            </div>
            <input type="hidden" id="task-type" value="i_will">
        </div>
        
        <div class="flex gap-3">
            <button id="btn-cancel-task" class="flex-1 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl">取消</button>
            <button id="btn-create-task" class="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200">创建</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Type Selection Logic
    const typeBtns = content.querySelectorAll('.type-btn');
    const typeInput = document.getElementById('task-type');
    
    const updateTypeUI = (selectedType) => {
        typeBtns.forEach(btn => {
            const t = btn.dataset.type;
            if (t === selectedType) {
                btn.classList.add('border-indigo-500', 'bg-indigo-50', 'text-indigo-700', 'dark:bg-slate-600', 'dark:text-indigo-300', 'dark:border-indigo-400');
                btn.classList.remove('border-gray-200', 'dark:border-slate-600', 'text-gray-600', 'dark:text-gray-300');
            } else {
                btn.classList.remove('border-indigo-500', 'bg-indigo-50', 'text-indigo-700', 'dark:bg-slate-600', 'dark:text-indigo-300', 'dark:border-indigo-400');
                btn.classList.add('border-gray-200', 'dark:border-slate-600', 'text-gray-600', 'dark:text-gray-300');
            }
        });
        typeInput.value = selectedType;
    };
    
    // Default selection
    updateTypeUI('i_will');
    
    typeBtns.forEach(btn => {
        btn.onclick = () => updateTypeUI(btn.dataset.type);
    });
    
    document.getElementById('btn-cancel-task').onclick = () => modal.remove();
    
    document.getElementById('btn-create-task').onclick = () => {
        const title = document.getElementById('task-title').value;
        if (!title) return alert("请输入任务名称");
        
        const contentVal = document.getElementById('task-content').value;
        const minutesStr = document.getElementById('task-minutes').value;
        const minutes = minutesStr ? parseInt(minutesStr, 10) : null;
        const type = typeInput.value;
        
        const group = taskGroups.find(g => g.id === groupId);
        if (group) {
            group.tasks.push({
                id: Date.now().toString(),
                title,
                content: contentVal,
                minutes,
                type,
                status: 'idle'
            });
            saveTaskGroups();
            renderTaskGroups();
        }
        
        modal.remove();
    };
}

function renderTaskGroups() {
    const wrap = document.getElementById('task-groups');
    if (!wrap) return;
    wrap.innerHTML = '';
    taskGroups.forEach(group => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mb-4';
        const header = document.createElement('div');
        header.className = 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3';
        const title = document.createElement('div');
        title.className = 'font-bold text-gray-800 dark:text-gray-100 text-lg';
        title.textContent = group.name;
        header.appendChild(title);
        const hBtns = document.createElement('div');
        hBtns.className = 'flex gap-2 flex-wrap';
        const rename = document.createElement('button');
        rename.className = 'px-2 py-1 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-gray-700 dark:text-gray-200';
        rename.textContent = '重命名';
        rename.onclick = () => {
            const n = prompt('新的名称：', group.name);
            if (n) { group.name = n; saveTaskGroups(); renderTaskGroups(); }
        };
        const addTask = document.createElement('button');
        addTask.className = 'px-2 py-1 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-gray-700 dark:text-gray-200';
        addTask.textContent = '添加任务';
        addTask.onclick = () => {
            renderCreateTaskModal(group.id);
        };
        const examples = document.createElement('button');
        examples.className = 'px-2 py-1 text-xs bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded text-indigo-700 dark:text-indigo-300';
        examples.textContent = '添加范例';
        examples.onclick = () => {
            const presets = [
                { title: '番茄钟', content: '专注一个番茄钟', minutes: 25, type: 'i_will' },
                { title: '深度工作', content: '无干扰深度工作', minutes: 90, type: 'i_will' },
                { title: '阅读', content: '阅读非虚构书籍', minutes: 30, type: 'i_want' },
                { title: '戒烟/戒手机', content: '忍住冲动', minutes: 15, type: 'i_wont' },
                { title: '自由练习', content: '无限时长的自由练习', minutes: null, type: 'i_will' }
            ];
            const menu = presets.map((p, i) => `${i+1}. ${p.title}(${p.minutes ?? '∞'}分钟)`).join('\n');
            const pick = prompt(`选择范例编号：\n${menu}`);
            const idx = parseInt(pick, 10) - 1;
            const item = presets[idx];
            if (item) {
                group.tasks.push({ id: Date.now().toString(), title: item.title, content: item.content, minutes: item.minutes, type: item.type || 'i_will', status: 'idle' });
                saveTaskGroups(); renderTaskGroups();
            }
        };
        hBtns.appendChild(rename);
        hBtns.appendChild(addTask);
        hBtns.appendChild(examples);
        header.appendChild(hBtns);
        card.appendChild(header);
        const list = document.createElement('div');
        list.className = 'space-y-2';
        group.tasks.forEach(task => {
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between bg-gray-50 dark:bg-slate-700 rounded p-2';
            
            let icon = '💪';
            if (task.type === 'i_wont') icon = '🛑';
            if (task.type === 'i_want') icon = '🎯';

            const info = document.createElement('div');
            info.innerHTML = `<div class="font-medium text-gray-800 dark:text-gray-100">${icon} ${task.title}</div><div class="text-xs text-gray-500 dark:text-gray-400">${task.content} · 时长：${task.minutes ?? '无限'} 分钟</div>`;
            row.appendChild(info);
            const btns = document.createElement('div');
            btns.className = 'flex gap-2';
            const edit = document.createElement('button');
            edit.className = 'px-2 py-1 text-xs bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded text-gray-700 dark:text-gray-200';
            edit.textContent = '编辑';
            edit.onclick = () => {
                // Simplified edit for now, or could use modal too. Keeping prompt for speed unless requested.
                // User asked to "Pre-create tasks".
                const t = prompt('名称：', task.title) || task.title;
                const c = prompt('内容：', task.content) || task.content;
                const d = prompt('时长(分钟)，留空为无限：', task.minutes ?? '') || '';
                task.title = t; task.content = c; task.minutes = d === '' ? null : parseInt(d, 10);
                saveTaskGroups(); renderTaskGroups();
            };
            const del = document.createElement('button');
            del.className = 'px-2 py-1 text-xs bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded text-gray-700 dark:text-gray-200';
            del.textContent = '删除';
            del.onclick = () => {
                group.tasks = group.tasks.filter(x => x.id !== task.id);
                saveTaskGroups(); renderTaskGroups();
            };
            btns.appendChild(edit);
            btns.appendChild(del);
            row.appendChild(btns);
            list.appendChild(row);
        });
        card.appendChild(list);
        wrap.appendChild(card);
    });
    const addGroupBtn = document.getElementById('btn-add-group');
    if (addGroupBtn) {
        addGroupBtn.onclick = () => {
            const name = prompt('任务群名称：', '我的任务群');
            if (!name) return;
            taskGroups.push({ id: Date.now().toString(), name, tasks: [] });
            saveTaskGroups(); renderTaskGroups();
        };
    }
}
function initCloud() {
    const confStr = localStorage.getItem('firebase_config') || '';
    if (!window.firebase) return null;
    if (!confStr) return null;
    const cfg = JSON.parse(confStr);
    const app = firebase.initializeApp(cfg);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const provider = new firebase.auth.GoogleAuthProvider();
    return {
        signIn: async () => {
            try {
                await auth.signInWithPopup(provider);
            } catch (e) {
                await auth.signInWithRedirect(provider);
            }
        },
        signOut: () => auth.signOut(),
        onAuth: (cb) => auth.onAuthStateChanged(cb),
        isSignedIn: () => !!auth.currentUser,
        sync: async () => {
            if (!auth.currentUser) return;
            const uid = auth.currentUser.uid;
            const docRef = db.collection('users').doc(uid).collection('app').doc('state');
            await docRef.set({
                ctdp_state: ctdp.getState(),
                rsip_nodes: rsip.getNodes(),
                rsip_imported: rsip.getImportedTrees(),
                task_groups: taskGroups,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            alert('已同步到云端');
        },
        listSharedTrees: async () => {
            const col = await db.collection('shared_trees').orderBy('createdAt', 'desc').limit(50).get();
            return col.docs.map(d => ({ id: d.id, ...d.data() }));
        },
        shareTree: async (name = '共享国策树') => {
            const code = rsip.exportTree();
            const col = db.collection('shared_trees');
            const doc = await col.add({
                name,
                code,
                createdAt: new Date().toISOString()
            });
            return doc.id;
        }
    };
}
cloud = initCloud();
if (cloud && cloud.isSignedIn && cloud.isSignedIn()) {
    if (btnLogin) btnLogin.classList.add('hidden');
    if (btnLogout) btnLogout.classList.remove('hidden');
}
if (btnLogin) {
    btnLogin.onclick = async () => {
        if (!cloud) return alert('未配置云同步');
        await cloud.signIn();
        btnLogin.classList.add('hidden');
        btnLogout.classList.remove('hidden');
        alert('登录成功');
    };
}
if (btnLogout) {
    btnLogout.onclick = async () => {
        if (!cloud) return;
        await cloud.signOut();
        btnLogout.classList.add('hidden');
        btnLogin.classList.remove('hidden');
        alert('已退出');
    };
}
if (btnConfig) {
    btnConfig.onclick = () => {
        const json = prompt('粘贴 Firebase 配置 JSON:');
        if (!json) return;
        try {
            JSON.parse(json);
            localStorage.setItem('firebase_config', json);
            alert('配置已保存，请刷新页面');
        } catch {
            alert('格式错误');
        }
    };
}
if (btnSync) {
    btnSync.onclick = async () => {
        if (!cloud) return alert('未配置云同步');
        await cloud.sync();
    };
}
