// ===============================
// COMPLETED PAGE - VERSI SEDERHANA
// ===============================

// State management
let selectedDate = '';

// Mapping track_status untuk Completed
const TRACK_STATUS_COMPLETED = {
    checkedRecipient: 4,
    checkedRequest: 5
};

document.addEventListener("DOMContentLoaded", function() {
    console.log("Completed page loaded");
    
    // Tunggu data dari main.js
    checkData();
    
    // Setup search
    setupSearch();
});

function checkData() {
    if (typeof state !== "undefined" && state.workOrders && state.workOrders.length > 0) {
        console.log("Data ready, initializing completed page...");
        initCompleted();
    } else {
        console.log("Waiting for data...");
        setTimeout(checkData, 500);
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            loadCompletedList();
        });
    }
}

function initCompleted() {
    console.log('Completed page initialized');
    loadStats();
    loadCompletedList();
}

// ===============================
// LOAD STATS
// ===============================
function loadStats() {
    const checkedRecipient = state.workOrders.filter(wo => 
        Number(wo.track_status) === TRACK_STATUS_COMPLETED.checkedRecipient
    ).length;
    
    const checkedRequest = state.workOrders.filter(wo => 
        Number(wo.track_status) === TRACK_STATUS_COMPLETED.checkedRequest
    ).length;

    document.getElementById('checkedRecipientCount').textContent = checkedRecipient;
    document.getElementById('checkedRequestCount').textContent = checkedRequest;
}

// ===============================
// LOAD COMPLETED LIST
// ===============================
function loadCompletedList() {
    const container = document.getElementById('completedItems');
    if (!container) return;

    // Filter completed (track_status 4 dan 5)
    let completedData = state.workOrders.filter(wo => 
        Number(wo.track_status) === TRACK_STATUS_COMPLETED.checkedRecipient || 
        Number(wo.track_status) === TRACK_STATUS_COMPLETED.checkedRequest
    );
    
    // Filter by search
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value) {
        const keyword = searchInput.value.toLowerCase();
        completedData = completedData.filter(wo => 
            (wo.id_wo || '').toLowerCase().includes(keyword) ||
            (wo.job_name || '').toLowerCase().includes(keyword) ||
            (wo.departemen || '').toLowerCase().includes(keyword) ||
            (wo.name_request || '').toLowerCase().includes(keyword)
        );
    }

    if (completedData.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; background: white; border-radius: 12px;">
                <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                <div style="color: var(--gray-600);">Tidak ada data completed</div>
            </div>
        `;
        return;
    }

    // Sort by completed date (newest first)
    completedData.sort((a, b) => {
        const dateA = new Date(a.work_completed || a.updated_at || 0);
        const dateB = new Date(b.work_completed || b.updated_at || 0);
        return dateB - dateA;
    });

    container.innerHTML = completedData.map(wo => `
        <div class="completed-item" onclick="showDetail('${wo.id}')">
            <div class="completed-icon">✅</div>
            <div class="completed-details">
                <h4>${wo.job_name || 'Untitled'}</h4>
                <div class="completed-meta">
                    <span>📋 ${wo.id_wo || '-'}</span>
                    <span>🏢 ${wo.departemen || '-'}</span>
                    <span>👤 ${wo.name_request || '-'}</span>
                    <span>📅 ${formatDate(wo.work_completed || wo.updated_at)}</span>
                </div>
                <div style="margin-top: 8px; display: flex; gap: 8px;">
                    ${getStatusBadge(wo.track_status)}
                    ${getPriorityBadge(wo.priority)}
                </div>
            </div>
        </div>
    `).join('');
}

// ===============================
// BADGE FUNCTIONS
// ===============================
function getStatusBadge(trackStatus) {
    const statusNum = Number(trackStatus);
    if (statusNum === 4) {
        return '<span class="badge badge-green">Checked Recipient</span>';
    } else if (statusNum === 5) {
        return '<span class="badge badge-green">Checked Request</span>';
    }
    return '';
}

function getPriorityBadge(priority) {
    const priorityNum = Number(priority);
    switch(priorityNum) {
        case 1: return '<span class="badge badge-red">Urgent</span>';
        case 2: return '<span class="badge badge-green">Routine</span>';
        case 3: return '<span class="badge badge-gray">Others</span>';
        default: return '';
    }
}

// ===============================
// DETAIL MODAL
// ===============================
window.showDetail = function(id) {
    const wo = state.workOrders.find(w => w.id == id);
    if (!wo) return;
    
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    
    // Tentukan deskripsi
    let description = wo.description_of_work_order;
    if (!description || description === 'null') {
        description = wo.job_description || 'Tidak ada deskripsi';
    }
    
    // Tentukan status text
    let statusText = '';
    if (Number(wo.track_status) === 4) statusText = 'Checked Recipient';
    else if (Number(wo.track_status) === 5) statusText = 'Checked Request';
    
    // Tentukan priority text
    let priorityText = '';
    switch(Number(wo.priority)) {
        case 1: priorityText = 'Urgent'; break;
        case 2: priorityText = 'Routine'; break;
        case 3: priorityText = 'Others'; break;
        default: priorityText = '-';
    }
    
    content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <p style="margin: 5px 0;"><strong>ID WO:</strong> ${wo.id_wo || '-'}</p>
                <p style="margin: 5px 0;"><strong>Job Name:</strong> ${wo.job_name || '-'}</p>
                <p style="margin: 5px 0;"><strong>Department:</strong> ${wo.departemen || '-'}</p>
                <p style="margin: 5px 0;"><strong>Requestor:</strong> ${wo.name_request || '-'}</p>
                <p style="margin: 5px 0;"><strong>Tanggal Request:</strong> ${formatDate(wo.date_request)}</p>
                <p style="margin: 5px 0;"><strong>Tanggal Selesai:</strong> ${formatDate(wo.work_completed || wo.updated_at)}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> ${statusText}</p>
                <p style="margin: 5px 0;"><strong>Priority:</strong> ${priorityText}</p>
                <p style="margin: 5px 0;"><strong>Lokasi:</strong> ${wo.work_location || '-'}</p>
                <p style="margin: 5px 0;"><strong>Asset:</strong> ${wo.asset || '-'}</p>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <p style="margin: 0 0 5px 0;"><strong>Deskripsi:</strong></p>
                <p style="margin: 0; color: var(--dark);">${description}</p>
            </div>
            ${wo.job_image ? `
                <a href="${wo.job_image}" target="_blank" style="display: inline-block; background: var(--primary); color: white; text-decoration: none; padding: 10px; border-radius: 8px; text-align: center;">
                    Lihat Gambar
                </a>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
};

window.closeDetailModal = function() {
    document.getElementById('detailModal').style.display = 'none';
};

// ===============================
// HELPER FUNCTIONS
// ===============================
function formatDate(dateString) {
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

// Click outside modal to close
window.onclick = function(event) {
    const modal = document.getElementById('detailModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};