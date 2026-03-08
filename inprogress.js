// ===============================
// IN PROGRESS PAGE - MENGGUNAKAN TRACK_STATUS
// ===============================

// State management
let selectedWOId = null;

// Mapping track_status untuk In Progress
const TRACK_STATUS_IN_PROGRESS = {
    deptRecipient: 2,  // Departemen Recipient
    execute: 3         // Execute Departemen Recipient
};

// Mapping untuk detail status
const TRACK_STATUS_DETAIL = {
    2: { name: 'Dept Recipient', class: 'status-dept-recipient', icon: '📦', color: '#f39c12' },
    3: { name: 'Execute', class: 'status-execute', icon: '⚡', color: '#3498db' }
};

// Priority mapping
const PRIORITY_MAP = {
    1: { name: 'Urgent', class: 'priority-urgent' },
    2: { name: 'Routine', class: 'priority-routine' },
    3: { name: 'Others', class: 'priority-others' }
};

document.addEventListener("DOMContentLoaded", function() {
    console.log("In Progress page loaded");
    
    // Tunggu data dari main.js
    checkData();
    
    // Setup event listeners
    setupEventListeners();
});

function checkData() {
    if (typeof state !== "undefined" && state.workOrders && state.workOrders.length > 0) {
        console.log("Data ready, initializing in progress page...");
        initInProgress();
    } else {
        console.log("Waiting for data...");
        setTimeout(checkData, 500);
    }
}

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            filterWorkOrders();
        }, 500));
    }
}

function initInProgress() {
    console.log('In Progress page initialized with', state.workOrders.length, 'records');
    
    // Filter hanya yang track_status 2 dan 3 (In Progress)
    const inProgressData = state.workOrders.filter(wo => 
        Number(wo.track_status) === TRACK_STATUS_IN_PROGRESS.deptRecipient || 
        Number(wo.track_status) === TRACK_STATUS_IN_PROGRESS.execute
    );
    
    console.log('In Progress records:', inProgressData.length);
    
    loadStats();
    loadKanbanBoard();
}

// ===============================
// LOAD STATS
// ===============================
function loadStats() {
    const deptRecipient = state.workOrders.filter(wo => 
        Number(wo.track_status) === TRACK_STATUS_IN_PROGRESS.deptRecipient
    ).length;
    
    const execute = state.workOrders.filter(wo => 
        Number(wo.track_status) === TRACK_STATUS_IN_PROGRESS.execute
    ).length;

    console.log('Stats - Dept Recipient:', deptRecipient, 'Execute:', execute);

    setText('deptRecipientCount', deptRecipient);
    setText('executeCount', execute);
}

// ===============================
// LOAD KANBAN BOARD
// ===============================
function loadKanbanBoard() {
    // Filter data untuk masing-masing kolom
    const deptRecipientList = state.workOrders.filter(wo => 
        Number(wo.track_status) === TRACK_STATUS_IN_PROGRESS.deptRecipient
    );
    
    const executeList = state.workOrders.filter(wo => 
        Number(wo.track_status) === TRACK_STATUS_IN_PROGRESS.execute
    );

    // Update column counts
    setText('deptRecipientColumnCount', deptRecipientList.length);
    setText('executeColumnCount', executeList.length);

    // Load cards ke masing-masing kolom
    loadKanbanColumn('deptRecipientList', deptRecipientList, 'dept-recipient');
    loadKanbanColumn('executeList', executeList, 'execute');
}

// ===============================
// LOAD KANBAN COLUMN
// ===============================
function loadKanbanColumn(elementId, workOrders, type) {
    const column = document.getElementById(elementId);
    if (!column) return;

    if (workOrders.length === 0) {
        column.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                <div style="font-size: 48px; margin-bottom: 10px;">📭</div>
                <div>Tidak ada work order</div>
            </div>
        `;
        return;
    }

    column.innerHTML = workOrders.map(wo => `
        <div class="kanban-card ${type}" onclick="showDetail('${wo.id}')" data-id="${wo.id}">
            <div class="card-header">
                <span class="card-id">${wo.id_wo || '-'}</span>
                <span class="card-priority ${getPriorityClass(wo.priority)}">
                    ${getPriorityText(wo.priority)}
                </span>
            </div>
            
            <div class="card-title">
                ${wo.job_name || 'Untitled'}
            </div>
            
            <div class="card-details">
                <div class="card-detail-item">
                    <span>👤</span>
                    <span>${wo.name_request || 'Unknown'}</span>
                </div>
                <div class="card-detail-item">
                    <span>🏢</span>
                    <span>${wo.departemen || '-'}</span>
                </div>
                <div class="card-detail-item">
                    <span>📍</span>
                    <span>${wo.work_location || '-'}</span>
                </div>
            </div>
            
            <div class="card-footer">
                <span class="card-assignee">
                    <span>⏰</span>
                    ${formatDisplayDate(wo.date_request)}
                </span>
                <span class="status-badge-small ${type === 'dept-recipient' ? 'status-dept-recipient' : 'status-execute'}">
                    ${type === 'dept-recipient' ? 'Dept Recipient' : 'Execute'}
                </span>
            </div>
        </div>
    `).join('');
}

// ===============================
// SHOW DETAIL (reuse dari workorders.js)
// ===============================
window.showDetail = function(id) {
    console.log('Menampilkan detail untuk ID:', id);
    
    const wo = state.workOrders.find(w => w.id == id);
    if (!wo) {
        alert('Data tidak ditemukan!');
        return;
    }
    
    selectedWOId = id;
    
    // Panggil fungsi showDetail dari workorders.js jika ada
    if (typeof window.showWorkOrderDetail === 'function') {
        window.showWorkOrderDetail(id);
    } else {
        // Fallback: buat detail card sederhana
        showSimpleDetail(wo);
    }
};

// Simple detail fallback
function showSimpleDetail(wo) {
    let container = document.getElementById('detailCardContainer');
    if (!container) return;
    
    // Tentukan deskripsi yang akan ditampilkan
    let displayDescription = wo.description_of_work_order;
    if (!displayDescription || displayDescription === 'null' || displayDescription === '') {
        displayDescription = wo.job_description || 'Tidak ada deskripsi';
    }
    
    container.innerHTML = `
        <div style="background: white; border-radius: 15px; padding: 25px; border: 2px solid #2ecc71; box-shadow: 0 5px 20px rgba(46,204,113,0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #2c3e50; margin: 0;">Detail Work Order: ${wo.id_wo}</h3>
                <button onclick="closeDetail()" style="background: #e74c3c; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">✕</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <p><strong>Job Name:</strong> ${wo.job_name || '-'}</p>
                    <p><strong>Location:</strong> ${wo.work_location || '-'}</p>
                    <p><strong>Asset:</strong> ${wo.asset || '-'}</p>
                    <p><strong>Priority:</strong> ${getPriorityText(wo.priority)}</p>
                </div>
                <div>
                    <p><strong>Department:</strong> ${wo.departemen || '-'}</p>
                    <p><strong>Requestor:</strong> ${wo.name_request || '-'}</p>
                    <p><strong>Status:</strong> ${Number(wo.track_status) === 2 ? 'Dept Recipient' : 'Execute'}</p>
                    <p><strong>Date:</strong> ${formatDisplayDate(wo.date_request)}</p>
                </div>
                <div style="grid-column: span 2;">
                    <p><strong>Deskripsi:</strong></p>
                    <p style="background: #f8f9fa; padding: 15px; border-radius: 8px;">${displayDescription}</p>
                </div>
            </div>
        </div>
    `;
    container.style.display = 'block';
}

window.closeDetail = function() {
    const container = document.getElementById('detailCardContainer');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
    selectedWOId = null;
};

function filterWorkOrders() {
    // Implement search filter
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const keyword = searchInput.value.toLowerCase();
    
    // Filter cards berdasarkan keyword
    filterKanbanCards(keyword);
}

function filterKanbanCards(keyword) {
    const cards = document.querySelectorAll('.kanban-card');
    
    cards.forEach(card => {
        const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
        const id = card.querySelector('.card-id')?.textContent.toLowerCase() || '';
        const dept = card.querySelector('.card-details')?.textContent.toLowerCase() || '';
        
        if (title.includes(keyword) || id.includes(keyword) || dept.includes(keyword)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// ===============================
// HELPER FUNCTIONS
// ===============================
function getPriorityClass(priority) {
    const priorityNum = Number(priority);
    switch(priorityNum) {
        case 1: return 'priority-urgent';
        case 2: return 'priority-routine';
        case 3: return 'priority-others';
        default: return 'priority-others';
    }
}

function getPriorityText(priority) {
    const priorityNum = Number(priority);
    switch(priorityNum) {
        case 1: return 'Urgent';
        case 2: return 'Routine';
        case 3: return 'Others';
        default: return '-';
    }
}

function formatDisplayDate(dateString) {
    if (!dateString) return '-';
    try {
        let datePart = dateString;
        if (dateString.includes(' ')) {
            datePart = dateString.split(' ')[0];
        }
        
        const [year, month, day] = datePart.split('-');
        if (year && month && day) {
            return `${day}/${month}/${year}`;
        }
        return dateString;
    } catch {
        return dateString;
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}