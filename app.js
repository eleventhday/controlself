
import { CTDPEngine } from './core/ctdp.js';
import { RSIPEngine } from './core/rsip.js';

const ctdp = new CTDPEngine();
const rsip = new RSIPEngine();

const contentEl = document.getElementById('content');
const navCtdp = document.getElementById('nav-ctdp');
const navRsip = document.getElementById('nav-rsip');
const themeSelect = document.getElementById('theme-select');
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
    container.className = 'flex flex-col items-center space-y-8 max-w-2xl mx-auto';

    // Header Stats
    const stats = document.createElement('div');
    stats.className = 'w-full grid grid-cols-2 gap-6';
    stats.innerHTML = `
        <div class="bg-white p-6 rounded-2xl shadow-sm text-center border border-gray-100 hover:shadow-md transition-shadow">
            <div class="text-4xl font-extrabold text-indigo-600 mb-1">${state.chainCount}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">主链连胜 (Main Chain)</div>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm text-center border border-gray-100 hover:shadow-md transition-shadow">
            <div class="text-4xl font-extrabold text-blue-500 mb-1">${state.auxChainCount}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">副链积累 (Aux Chain)</div>
        </div>
    `;
    container.appendChild(stats);

    // Status & Action Area
    const actionArea = document.createElement('div');
    actionArea.className = 'w-full bg-white p-10 rounded-3xl shadow-lg flex flex-col items-center justify-center space-y-6 border border-indigo-50 min-h-[400px] relative overflow-hidden';
    
    // Background decoration
    const bgDeco = document.createElement('div');
    bgDeco.className = 'absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500';
    actionArea.appendChild(bgDeco);

    if (state.status === 'idle') {
        actionArea.innerHTML += `
            <div class="text-gray-300 mb-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <h2 class="text-3xl font-bold text-gray-800">准备专注？</h2>
            <p class="text-gray-500 text-center max-w-md">执行“神圣座位原则”。一旦坐下，必须专注。如果还没准备好，可以使用“线性时延”进行预约。</p>
            <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full max-w-md mt-4">
                <button id="btn-reserve" class="flex-1 py-4 px-6 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-all transform hover:scale-[1.02]">
                    预约座位 (15分钟)
                </button>
                <button id="btn-start" class="flex-1 py-4 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 transform hover:scale-[1.02]">
                    现在坐下 (开始)
                </button>
            </div>
        `;
    } else if (state.status === 'reserved') {
        actionArea.innerHTML += `
             <div class="text-blue-500 mb-2 animate-pulse">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 class="text-3xl font-bold text-blue-600">座位已预约</h2>
            <p class="text-gray-600 text-center">请在倒计时结束前回到座位并开始专注。</p>
            <div id="timer-display" class="text-6xl font-mono font-bold text-gray-800 my-6 tracking-tight">15:00</div>
            <button id="btn-start" class="w-full max-w-md py-4 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 transform hover:scale-[1.02]">
                我已就座，开始专注
            </button>
        `;
    } else if (state.status === 'active') {
        actionArea.innerHTML += `
            <div class="text-green-500 mb-2 animate-pulse">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 class="text-3xl font-bold text-green-600">专注进行中...</h2>
            <p class="text-gray-600 text-center">神圣座位原则生效中。请勿离开座位。</p>
            <div id="timer-display" class="text-6xl font-mono font-bold text-gray-800 my-6 tracking-tight">00:00</div>
            <div class="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <button id="btn-exception" class="flex-1 py-4 px-6 bg-yellow-50 text-yellow-700 font-bold rounded-xl hover:bg-yellow-100 transition-colors border border-yellow-100">
                    分心了 (例外)
                </button>
                <button id="btn-fail" class="flex-1 py-4 px-6 bg-red-50 text-red-500 font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-100">
                    分心了 (重置)
                </button>
                <button id="btn-complete" class="flex-1 py-4 px-6 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 transform hover:scale-[1.02]">
                    完成任务
                </button>
            </div>
        `;
    }

    container.appendChild(actionArea);
    contentEl.appendChild(container);

    // Bind Events
    if (state.status === 'idle') {
        document.getElementById('btn-reserve').onclick = () => { ctdp.reserve(); render(); };
        document.getElementById('btn-start').onclick = () => { ctdp.startSession(); render(); };
    } else if (state.status === 'reserved') {
        document.getElementById('btn-start').onclick = () => {
            try { ctdp.startSession(); render(); } catch(e) { alert(e.message); render(); }
        };
        startTimer(new Date(state.reservationTime), state.reservationDuration, true);
    } else if (state.status === 'active') {
        document.getElementById('btn-exception').onclick = () => {
            const reason = prompt("请输入例外原因：");
            if (reason) { ctdp.exception(reason); render(); }
        };
        document.getElementById('btn-fail').onclick = () => {
            if(confirm("确认分心并重置？")) { ctdp.fail('Reset'); render(); }
        };
        document.getElementById('btn-complete').onclick = () => { ctdp.completeSession(); render(); };
        startTimer(new Date(state.startTime), 0, false);
    }
}

function startTimer(startTime, durationMs, isCountdown) {
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
            diff = now - startTime;
        }

        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    update();
    ctdpTimerInterval = setInterval(update, 1000);
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
                <h2 class="text-2xl font-bold text-gray-800">国策树 (National Focus Tree)</h2>
                <p class="text-sm text-gray-500">拖拽节点可调整层级关系</p>
            </div>
            <div class="flex space-x-2">
                 <button id="btn-share" class="flex items-center space-x-2 text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 transition-colors border border-indigo-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>分享配置</span>
                </button>
                 <button id="btn-import" class="flex items-center space-x-2 text-sm bg-white text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>导入</span>
                </button>
                 <button id="btn-browse-shared" class="flex items-center space-x-2 text-sm bg-white text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm">
                    <span>平台共享</span>
                 </button>
                 <button id="btn-cloud-share" class="flex items-center space-x-2 text-sm bg-white text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm">
                    <span>云端分享</span>
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
        card.className = 'bg-white border border-gray-200 rounded-xl p-4';
        const title = document.createElement('div');
        title.className = 'font-bold mb-2';
        title.textContent = t.name;
        card.appendChild(title);
        const actions = document.createElement('div');
        actions.className = 'flex gap-2';
        const btnView = document.createElement('button');
        btnView.className = 'px-3 py-1 text-sm bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100';
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

    const tg = document.createElement('div');
    tg.className = 'mt-10';
    tg.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-bold">任务群</h3>
            <button id="btn-add-group" class="px-3 py-1 text-sm bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50">新增任务群</button>
        </div>
        <div id="task-groups"></div>
    `;
    container.appendChild(tg);
    renderTaskGroups();

    contentEl.appendChild(container);

    // Bind Share Events
    document.getElementById('btn-share').onclick = () => {
        const code = rsip.exportTree();
        if (code) {
            const url = `${window.location.origin}${window.location.pathname}?import=${code}`;
            navigator.clipboard.writeText(url).then(() => {
                alert('分享链接已复制到剪贴板！');
            }).catch(() => {
                prompt("复制此分享链接:", url);
            });
        }
    };

    document.getElementById('btn-import').onclick = () => {
        const code = prompt("粘贴分享链接或代码:");
        if (code) {
            handleImport(code);
        }
    };
    const browseBtn = document.getElementById('btn-browse-shared');
    if (browseBtn) {
        browseBtn.onclick = async () => {
            if (!cloud) return alert('尚未配置云同步');
            const list = await cloud.listSharedTrees();
            const names = list.map(x => `${x.id}: ${x.name}`).join('\n');
            const pick = prompt(`输入要导入的ID:\n${names}`);
            const item = list.find(x => x.id === pick);
            if (item) {
                rsip.importAsNewTree(item.code, item.name || '共享国策树');
                alert('已导入为新树（未点亮）');
                render();
            }
        };
    }
    const cloudShareBtn = document.getElementById('btn-cloud-share');
    if (cloudShareBtn) {
        cloudShareBtn.onclick = async () => {
            if (!cloud) return alert('未配置云同步或未登录');
            const name = prompt('为共享的国策树命名：', '共享国策树');
            const id = await cloud.shareTree(name || '共享国策树');
            alert(`已分享到云端，ID: ${id}`);
        };
    }
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
    el.className = 'bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-4 relative transition-all group';
    
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
    
    let statusColor = 'bg-gray-100 text-gray-800';
    let statusText = '未点亮';
    if (node.status === 'active') { statusColor = 'bg-blue-100 text-blue-800'; statusText = '进行中'; }
    if (node.status === 'completed') { statusColor = 'bg-green-100 text-green-800'; statusText = '已完成'; }
    if (node.status === 'failed') { statusColor = 'bg-red-100 text-red-800'; statusText = '已失败'; }

    // Node Content
    el.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="flex-1">
                <div class="flex items-center space-x-3 mb-1">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor}">${statusText}</span>
                    <h3 class="font-bold text-gray-800 text-lg">${node.title}</h3>
                </div>
                <p class="text-sm text-gray-500 leading-relaxed">${node.description}</p>
            </div>
            
            <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ${node.id !== 'root' ? `
                    <button class="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 btn-delete" title="删除">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                ` : ''}
                <button class="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 btn-add-child" title="添加子国策">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                    </svg>
                </button>
                ${node.status !== 'active' ? `
                <button class="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 btn-activate" title="点亮">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100-2H9a1 1 0 100 2h2zm-1 15a7 7 0 100-14 7 7 0 000 14z" />
                    </svg>
                </button>` : `
                <button class="p-2 text-gray-400 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 btn-extinguish" title="熄灭">
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
            activateBtn.onclick = (e) => {
                e.stopPropagation();
                try {
                    rsip.activateNode(node.id);
                    render();
                } catch (err) {
                    alert(err.message);
                }
            };
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
    const pref = localStorage.getItem('theme_pref') || 'system';
    if (themeSelect) themeSelect.value = pref;
    if (pref === 'system') {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(mq.matches ? 'theme-dark' : 'theme-light');
    } else {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(pref === 'dark' ? 'theme-dark' : 'theme-light');
    }
}
if (themeSelect) {
    themeSelect.onchange = () => {
        localStorage.setItem('theme_pref', themeSelect.value);
        applyThemeFromStorage();
    };
}
applyThemeFromStorage();

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

function renderTaskGroups() {
    const wrap = document.getElementById('task-groups');
    if (!wrap) return;
    wrap.innerHTML = '';
    taskGroups.forEach(group => {
        const card = document.createElement('div');
        card.className = 'bg-white border border-gray-200 rounded-xl p-4 mb-4';
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-2';
        const title = document.createElement('div');
        title.className = 'font-bold';
        title.textContent = group.name;
        header.appendChild(title);
        const hBtns = document.createElement('div');
        hBtns.className = 'flex gap-2';
        const rename = document.createElement('button');
        rename.className = 'px-2 py-1 text-xs bg-white border border-gray-200 rounded';
        rename.textContent = '重命名';
        rename.onclick = () => {
            const n = prompt('新的名称：', group.name);
            if (n) { group.name = n; saveTaskGroups(); renderTaskGroups(); }
        };
        const addTask = document.createElement('button');
        addTask.className = 'px-2 py-1 text-xs bg-white border border-gray-200 rounded';
        addTask.textContent = '添加任务';
        addTask.onclick = () => {
            const title = prompt('任务名称：');
            if (!title) return;
            const content = prompt('任务内容：') || '';
            const dur = prompt('时长(分钟)，留空为无限：');
            const m = dur ? parseInt(dur, 10) : null;
            group.tasks.push({ id: Date.now().toString(), title, content, minutes: isNaN(m) ? null : m, status: 'idle' });
            saveTaskGroups(); renderTaskGroups();
        };
        const examples = document.createElement('button');
        examples.className = 'px-2 py-1 text-xs bg-indigo-50 border border-indigo-100 rounded text-indigo-700';
        examples.textContent = '添加范例';
        examples.onclick = () => {
            const presets = [
                { title: '番茄钟', content: '专注一个番茄钟', minutes: 25 },
                { title: '深度工作', content: '无干扰深度工作', minutes: 90 },
                { title: '阅读', content: '阅读非虚构书籍', minutes: 30 },
                { title: '散步冥想', content: '户外散步冥想', minutes: 20 },
                { title: '自由练习', content: '无限时长的自由练习', minutes: null }
            ];
            const menu = presets.map((p, i) => `${i+1}. ${p.title}(${p.minutes ?? '∞'}分钟)`).join('\n');
            const pick = prompt(`选择范例编号：\n${menu}`);
            const idx = parseInt(pick, 10) - 1;
            const item = presets[idx];
            if (item) {
                group.tasks.push({ id: Date.now().toString(), title: item.title, content: item.content, minutes: item.minutes, status: 'idle' });
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
            row.className = 'flex items-center justify-between bg-gray-50 rounded p-2';
            const info = document.createElement('div');
            info.innerHTML = `<div class="font-medium">${task.title}</div><div class="text-xs text-gray-500">${task.content} · 时长：${task.minutes ?? '无限'} 分钟</div>`;
            row.appendChild(info);
            const btns = document.createElement('div');
            btns.className = 'flex gap-2';
            const edit = document.createElement('button');
            edit.className = 'px-2 py-1 text-xs bg-white border border-gray-200 rounded';
            edit.textContent = '编辑';
            edit.onclick = () => {
                const t = prompt('名称：', task.title) || task.title;
                const c = prompt('内容：', task.content) || task.content;
                const d = prompt('时长(分钟)，留空为无限：', task.minutes ?? '') || '';
                task.title = t; task.content = c; task.minutes = d === '' ? null : parseInt(d, 10);
                saveTaskGroups(); renderTaskGroups();
            };
            const del = document.createElement('button');
            del.className = 'px-2 py-1 text-xs bg-white border border-gray-200 rounded';
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
        signIn: () => auth.signInWithPopup(provider),
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
