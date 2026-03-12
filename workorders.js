// ===============================
// WORK ORDERS PAGE 
// ===============================

// State management
let currentFilterStatus = 'all';
let currentPage = 1;
let itemsPerPage = 10;
let selectedWOId = null;
let selectedDate = ''; // Untuk filter tanggal


const TRACK_STATUS_MAPPING = {
    pending: [0, 1],      // 0 = Draft, 1 = Departemen Request
    progress: [2, 3],     // 2 = Departemen Recipient, 3 = Execute Departemen Recipient
    completed: [4, 5]     // 4 = Checked Departemen Recipient, 5 = Checked Departemen Request
};

// Mapping untuk detail status
const TRACK_STATUS_DETAIL = {
    0: { name: 'Draft', class: 'status-draft', group: 'pending' },
    1: { name: 'Dept Request', class: 'status-dept-request', group: 'pending' },
    2: { name: 'Dept Recipient', class: 'status-dept-recipient', group: 'progress' },
    3: { name: 'Execute Recipient', class: 'status-execute', group: 'progress' },
    4: { name: 'Checked Recipient', class: 'status-checked-recipient', group: 'completed' },
    5: { name: 'Checked Request', class: 'status-checked-request', group: 'completed' }
};

// Priority mapping
const PRIORITY_MAP = {
    1: { name: 'Urgent', class: 'priority-urgent' },
    2: { name: 'Routine', class: 'priority-routine' },
    3: { name: 'Others', class: 'priority-others' }
};

document.addEventListener("DOMContentLoaded", function() {
    console.log("Work Orders page loaded");
    
    // Set default date
    setDefaultDate();
    
    // Tunggu data dari main.js
    checkData();
    
    // Setup event listeners
    setupEventListeners();
});

// Set default date to today
function setDefaultDate() {
    const dateInput = document.getElementById('filterDate');
    if (dateInput) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        
        // HTML5 date input expects yyyy-mm-dd
        dateInput.value = `${year}-${month}-${day}`;
        console.log('Default date set to:', dateInput.value);
    }
}

// Format date to dd/mm/yyyy for display
function formatDisplayDate(dateString) {
    if (!dateString) return '-';
    try {
        // Handle format "2024-10-21 12:56:08"
        let datePart = dateString;
        if (dateString.includes(' ')) {
            datePart = dateString.split(' ')[0];
        }
        
        // Parse tanggal (format: yyyy-mm-dd)
        const [year, month, day] = datePart.split('-');
        if (year && month && day) {
            return `${day}/${month}/${year}`;
        }
        
        return dateString;
    } catch {
        return dateString;
    }
}

// Parse tanggal dari format dd/mm/yyyy ke yyyy-mm-dd untuk filter
function parseDisplayDate(dateString) {
    if (!dateString) return '';
    try {
        // Handle format "dd/mm/yyyy"
        const [day, month, year] = dateString.split('/');
        if (day && month && year) {
            return `${year}-${month}-${day}`;
        }
        return dateString;
    } catch {
        return dateString;
    }
}

function checkData() {
    if (typeof state !== "undefined" && state.workOrders && state.workOrders.length > 0) {
        console.log("Data ready, initializing...");
        initWorkOrders();
    } else {
        console.log("Waiting for data...");
        setTimeout(checkData, 500);
    }
}

function initWorkOrders() {
    console.log('Work Orders initialized with', state.workOrders.length, 'records');
    
    // Debug: tampilkan sample data
    if (state.workOrders.length > 0) {
        console.log('Sample track_status:', state.workOrders[0].track_status);
        console.log('Sample date:', state.workOrders[0].date_request);
    }
    
    loadStats();
    loadWorkOrdersTable();
    setupFilterTabs();
}

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            filterWorkOrders();
        }, 500));
    }

    // Date filter
    const dateInput = document.getElementById('filterDate');
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            console.log('Date filter changed to:', this.value);
            selectedDate = this.value; // Format: yyyy-mm-dd
            filterWorkOrders();
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
}

async function refreshData() {
    try {
        const url = 'https://stagingservicewo.salokapark.app/api/get_wo_request?id_dept=DP011';
        const response = await fetch(url);
        const result = await response.json();

        if (result.status === 'success' && Array.isArray(result.data)) {
            state.workOrders = result.data;
            initWorkOrders();
        }
    } catch (error) {
        console.error('API Error:', error);
    }
}

// ===============================
// LOAD STATS MENGGUNAKAN TRACK_STATUS
// ===============================
function loadStats() {
    const total = state.workOrders.length;
    
    // Hitung berdasarkan track_status sesuai mapping
    const pending = state.workOrders.filter(wo => 
        TRACK_STATUS_MAPPING.pending.includes(Number(wo.track_status))
    ).length;
    
    const progress = state.workOrders.filter(wo => 
        TRACK_STATUS_MAPPING.progress.includes(Number(wo.track_status))
    ).length;
    
    const completed = state.workOrders.filter(wo => 
        TRACK_STATUS_MAPPING.completed.includes(Number(wo.track_status))
    ).length;

    console.log('Stats - Total:', total, 'Pending:', pending, 'Progress:', progress, 'Completed:', completed);

    // Update UI
    setText('totalWO', total);
    setText('pendingWO', pending);
    setText('inProgressWO', progress);
    setText('completedWO', completed);
}

// ===============================
// LOAD WORK ORDERS TABLE dengan filter status dan tanggal
// ===============================
function loadWorkOrdersTable() {
    const tbody = document.getElementById('woTableBody');
    if (!tbody) return;

    // Filter data
    let filteredData = [...state.workOrders];
    
    // Filter by date if selected
    if (selectedDate) {
        filteredData = filteredData.filter(wo => {
            if (!wo.date_request) return false;
            // Ambil tanggal dari date_request (format: yyyy-mm-dd HH:mm:ss)
            const woDate = wo.date_request.split(' ')[0];
            return woDate === selectedDate; // selectedDate format: yyyy-mm-dd
        });
        console.log(`Filtered by date ${selectedDate}:`, filteredData.length, 'records');
    }
    
    // Filter by status group berdasarkan track_status
    if (currentFilterStatus !== 'all') {
        if (currentFilterStatus === 'pending') {
            filteredData = filteredData.filter(wo => 
                TRACK_STATUS_MAPPING.pending.includes(Number(wo.track_status))
            );
        } else if (currentFilterStatus === 'progress') {
            filteredData = filteredData.filter(wo => 
                TRACK_STATUS_MAPPING.progress.includes(Number(wo.track_status))
            );
        } else if (currentFilterStatus === 'completed') {
            filteredData = filteredData.filter(wo => 
                TRACK_STATUS_MAPPING.completed.includes(Number(wo.track_status))
            );
        }
    }
    
    // Filter by search
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value) {
        const keyword = searchInput.value.toLowerCase();
        filteredData = filteredData.filter(wo => 
            (wo.id_wo || '').toLowerCase().includes(keyword) ||
            (wo.job_name || '').toLowerCase().includes(keyword) ||
            (wo.departemen || '').toLowerCase().includes(keyword) ||
            (wo.name_request || '').toLowerCase().includes(keyword)
        );
    }

    // Pagination
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageData = filteredData.slice(startIndex, endIndex);

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px;">Tidak ada data</td></tr>`;
    } else {
        tbody.innerHTML = pageData.map(wo => `
            <tr style="background-color: ${selectedWOId === wo.id ? '#e8f5e9' : 'transparent'};">
                <td><strong>${wo.id_wo || '-'}</strong></td>
                <td>${wo.job_name || '-'}</td>
                <td>${wo.departemen || '-'}</td>
                <td>${wo.name_request || '-'}</td>
                <td>${formatDisplayDate(wo.date_request)}</td> <!-- Format dd/mm/yyyy -->
                <td>${getPriorityBadge(wo.priority)}</td>
                <td>${getStatusBadge(wo.track_status)}</td> <!-- Gunakan track_status -->
                <td>
                    <button onclick="showDetail('${wo.id}')" 
                            style="background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; border: none; padding: 6px 15px; border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.3s; box-shadow: 0 2px 5px rgba(46,204,113,0.3);"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 10px rgba(46,204,113,0.4)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 5px rgba(46,204,113,0.3)';">
                        Detail
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updatePagination(totalPages);
}

// ===============================
// BADGE PRIORITY
// ===============================
function getPriorityBadge(priority) {
    const priorityNum = Number(priority);
    
    switch(priorityNum) {
        case 1:
            return '<span style="background: #fde8e8; color: #e74c3c; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #fad1d1;">Urgent</span>';
        case 2:
            return '<span style="background: #e8f5e9; color: #27ae60; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #a3e4b7;">Routine</span>';
        case 3:
            return '<span style="background: #f8f9fa; color: #7f8c8d; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #bdc3c7;">Others</span>';
        default:
            return '<span style="background: #ecf0f1; color: #7f8c8d; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600;">-</span>';
    }
}

// ===============================
// BADGE STATUS (berdasarkan track_status)
// ===============================
function getStatusBadge(trackStatus) {
    const statusNum = Number(trackStatus);
    
    switch(statusNum) {
        case 0:
            return '<span style="background: #ecf0f1; color: #7f8c8d; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #bdc3c7;">Draft</span>';
        case 1:
            return '<span style="background: #fde8e8; color: #e74c3c; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #fad1d1;">Dept Request</span>';
        case 2:
            return '<span style="background: #fff3d6; color: #f39c12; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #ffebc2;">Dept Recipient</span>';
        case 3:
            return '<span style="background: #fff3d6; color: #f39c12; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #ffebc2;">Execute</span>';
        case 4:
            return '<span style="background: #e8f5e9; color: #27ae60; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #a3e4b7;">Checked Recipient</span>';
        case 5:
            return '<span style="background: #e8f5e9; color: #27ae60; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #a3e4b7;">Checked Request</span>';
        default:
            return '<span style="background: #ecf0f1; color: #7f8c8d; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600;">-</span>';
    }
}

// ===============================
// FILTER TABS
// ===============================
function setupFilterTabs() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            closeDetail();
            
            // Set filter status berdasarkan data-status
            currentFilterStatus = this.dataset.status;
            console.log('Filter changed to:', currentFilterStatus);
            
            currentPage = 1;
            loadWorkOrdersTable();
            loadStats();
        });
    });
}

function filterWorkOrders() {
    closeDetail();
    currentPage = 1;
    loadWorkOrdersTable();
    loadStats();
}

// ===============================
// PAGINATION
// ===============================
function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';
    html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">‹</button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="page-btn active" onclick="changePage(${i})">${i}</button>`;
        } else {
            html += `<button class="page-btn" onclick="changePage(${i})">${i}</button>`;
        }
    }
    
    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">›</button>`;
    pagination.innerHTML = html;
}

window.changePage = function(page) {
    closeDetail();
    currentPage = page;
    loadWorkOrdersTable();
};

// ===============================
// SHOW DETAIL
// ===============================
window.showDetail = function(id) {
    console.log('Menampilkan detail untuk ID:', id);
    
    const wo = state.workOrders.find(w => w.id == id);
    if (!wo) {
        alert('Data tidak ditemukan!');
        return;
    }
    
    selectedWOId = id;
    loadWorkOrdersTable();
    
    let container = document.getElementById('detailCardContainer');
    if (!container) {
        alert('Container detail tidak ditemukan!');
        return;
    }
    
    const detailHTML = generateDetailCard(wo);
    
    container.innerHTML = detailHTML;
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ===============================
// GENERATE DETAIL CARD
// ===============================
function generateDetailCard(wo) {
    // Tentukan deskripsi yang akan ditampilkan
    // Prioritaskan description_of_work_order, jika null gunakan job_description
    let displayDescription = wo.description_of_work_order;
    if (!displayDescription || displayDescription === 'null' || displayDescription === '') {
        displayDescription = wo.job_description || 'Tidak ada deskripsi';
    }
    
    // Cek apakah ada job_image
    const hasJobImage = wo.job_image && wo.job_image !== 'null' && wo.job_image !== '';
    
    return `
        <div style="background: white; border-radius: 20px; padding: 30px; margin: 25px 0; 
                    border: none; box-shadow: 0 10px 40px rgba(46,204,113,0.15); 
                    position: relative; overflow: hidden;">
            
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 8px; 
                        background: linear-gradient(90deg, #2ecc71, #3498db, #9b59b6);"></div>
            
            <div style="position: absolute; top: 20px; right: 20px;">
                <button onclick="closeDetail()" 
                        style="background: #f8f9fa; border: none; width: 36px; height: 36px; 
                               border-radius: 50%; cursor: pointer; font-size: 18px; 
                               color: #7f8c8d; transition: all 0.3s; display: flex; 
                               align-items: center; justify-content: center;
                               box-shadow: 0 2px 5px rgba(0,0,0,0.1);"
                        onmouseover="this.style.background='#e74c3c'; this.style.color='white';"
                        onmouseout="this.style.background='#f8f9fa'; this.style.color='#7f8c8d';">
                    ✕
                </button>
            </div>
            
            <div style="margin-bottom: 30px; padding-right: 50px;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                    <span style="background: #2ecc71; color: white; width: 50px; height: 50px; 
                                 border-radius: 15px; display: flex; align-items: center; 
                                 justify-content: center; font-size: 24px; transform: rotate(-5deg);
                                 box-shadow: 0 5px 15px rgba(46,204,113,0.3);">
                        📋
                    </span>
                    <div>
                        <h2 style="color: #2c3e50; margin: 0; font-size: 24px; font-weight: 700;">
                            Detail Work Order
                        </h2>
                        <p style="color: #7f8c8d; margin: 5px 0 0; font-size: 14px;">
                            ID: <span style="color: #2ecc71; font-weight: 600; background: #e8f5e9; padding: 2px 10px; border-radius: 20px;">${wo.id_wo || '-'}</span>
                        </p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    ${getStatusBadge(wo.track_status)}
                    ${getPriorityBadge(wo.priority)}
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <!-- Informasi Pekerjaan -->
                <div style="background: #f8f9fa; border-radius: 15px; padding: 20px; border: 1px solid #e8f5e9;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <span style="background: linear-gradient(135deg, #2ecc71, #27ae60); 
                                     width: 40px; height: 40px; border-radius: 10px; 
                                     display: flex; align-items: center; justify-content: center;
                                     color: white; font-size: 20px;">🔧</span>
                        <h3 style="color: #2c3e50; margin: 0; font-size: 18px;">Informasi Pekerjaan</h3>
                    </div>
                    
                    <div style="display: grid; gap: 12px;">
                        ${renderInfoRow('Job Name', wo.job_name || '-', '📋')}
                        ${renderInfoRow('Work Location', wo.work_location || '-', '📍')}
                        ${renderInfoRow('Asset', wo.asset || '-', '💻')}
                        ${renderInfoRow('Years', wo.years || '-', '📅')}
                        ${renderInfoRow('Job Description', wo.job_description || '-', '📝')}
                    </div>
                </div>
                
                <!-- Informasi Department -->
                <div style="background: #f8f9fa; border-radius: 15px; padding: 20px; border: 1px solid #e8f5e9;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <span style="background: linear-gradient(135deg, #3498db, #2980b9); 
                                     width: 40px; height: 40px; border-radius: 10px; 
                                     display: flex; align-items: center; justify-content: center;
                                     color: white; font-size: 20px;">🏢</span>
                        <h3 style="color: #2c3e50; margin: 0; font-size: 18px;">Informasi Department</h3>
                    </div>
                    
                    <div style="display: grid; gap: 12px;">
                        ${renderInfoRow('Dept Asal', wo.departemen || '-', '📌')}
                        ${renderInfoRow('Sub Dept', wo.sub_departemen || '-', '🔖')}
                        ${renderInfoRow('Dept Tujuan', wo.departemen_request || '-', '🎯')}
                        ${renderInfoRow('Sub Dept Tujuan', wo.sub_departemen_request || '-', '📍')}
                    </div>
                </div>
                
                <!-- Timeline -->
                <div style="background: #f8f9fa; border-radius: 15px; padding: 20px; border: 1px solid #e8f5e9;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <span style="background: linear-gradient(135deg, #f39c12, #e67e22); 
                                     width: 40px; height: 40px; border-radius: 10px; 
                                     display: flex; align-items: center; justify-content: center;
                                     color: white; font-size: 20px;">⏰</span>
                        <h3 style="color: #2c3e50; margin: 0; font-size: 18px;">Timeline</h3>
                    </div>
                    
                    <div style="display: grid; gap: 12px;">
                        ${renderInfoRow('Tanggal Request', formatDisplayDate(wo.date_request), '📅')}
                        ${renderInfoRow('Work Started', wo.work_started ? formatDisplayDate(wo.work_started) : '-', '▶️')}
                        ${renderInfoRow('Work Completed', wo.work_completed ? formatDisplayDate(wo.work_completed) : '-', '✅')}
                        ${renderInfoRow('Created At', formatDisplayDate(wo.created_at), '🕒')}
                    </div>
                </div>
                
                <!-- Requestor & PIC -->
                <div style="background: #f8f9fa; border-radius: 15px; padding: 20px; border: 1px solid #e8f5e9;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <span style="background: linear-gradient(135deg, #9b59b6, #8e44ad); 
                                     width: 40px; height: 40px; border-radius: 10px; 
                                     display: flex; align-items: center; justify-content: center;
                                     color: white; font-size: 20px;">👥</span>
                        <h3 style="color: #2c3e50; margin: 0; font-size: 18px;">Requestor & PIC</h3>
                    </div>
                    
                    <div style="display: grid; gap: 12px;">
                        ${renderInfoRow('Requestor', wo.name_request || '-', '👤')}
                        ${renderInfoRow('ID Karyawan', wo.id_karyawan || '-', '🆔')}
                        ${renderInfoRow('PIC ID', wo.description_of_pic_id || '-', '🔑')}
                        ${renderInfoRow('PIC Name', wo.description_of_pic_name || '-', '👥')}
                    </div>
                </div>
                
                <!-- Deskripsi -->
                <div style="background: #f8f9fa; border-radius: 15px; padding: 20px; grid-column: span 2; border: 1px solid #e8f5e9;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <span style="background: linear-gradient(135deg, #1abc9c, #16a085); 
                                     width: 40px; height: 40px; border-radius: 10px; 
                                     display: flex; align-items: center; justify-content: center;
                                     color: white; font-size: 20px;">📝</span>
                        <h3 style="color: #2c3e50; margin: 0; font-size: 18px;">Deskripsi</h3>
                    </div>
                    
                    <div style="background: white; padding: 20px; border-radius: 10px; 
                                border: 1px solid #e8f5e9; margin-bottom: 15px;">
                        <p style="margin: 0; color: #2c3e50; line-height: 1.6; white-space: pre-wrap;">
                            ${displayDescription}
                        </p>
                        ${wo.description_of_work_order ? `
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e8f5e9;">
                                <small style="color: #7f8c8d;">Description of Work Order:</small>
                                <p style="margin: 5px 0 0; color: #2c3e50;">${wo.description_of_work_order}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${hasJobImage ? `
                        <div style="text-align: center; margin-top: 15px;">
                            <a href="${wo.job_image}" target="_blank" 
                               style="display: inline-flex; align-items: center; gap: 8px;
                                      background: linear-gradient(135deg, #2ecc71, #27ae60);
                                      color: white; text-decoration: none; padding: 12px 25px;
                                      border-radius: 25px; font-weight: 600; transition: all 0.3s;
                                      box-shadow: 0 5px 15px rgba(46,204,113,0.3);"
                               onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px rgba(46,204,113,0.4)';"
                               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 15px rgba(46,204,113,0.3)';">
                                <span style="font-size: 20px;">🖼️</span>
                                Lihat Gambar Work Order
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #e8f5e9;
                        display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 10px;">
                    <span style="background: #f8f9fa; padding: 5px 15px; border-radius: 20px;
                                 color: #7f8c8d; font-size: 12px;">
                        Updated: ${formatDisplayDate(wo.updated_at)}
                    </span>
                </div>
                <span style="color: #95a5a6; font-size: 12px;">
                    ID Work Order: ${wo.id_wo}
                </span>
            </div>
        </div>
    `;
}

// ===============================
// HELPER UNTUK RENDER INFO ROW
// ===============================
function renderInfoRow(label, value, icon) {
    return `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="width: 30px; color: #7f8c8d; font-size: 14px;">${icon}</span>
            <span style="color: #7f8c8d; width: 100px; font-size: 13px;">${label}:</span>
            <span style="color: #2c3e50; font-weight: 500; flex: 1; font-size: 13px;">${value}</span>
        </div>
    `;
}

// ===============================
// CLOSE DETAIL
// ===============================
window.closeDetail = function() {
    console.log('Menutup detail');
    const container = document.getElementById('detailCardContainer');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
    selectedWOId = null;
    loadWorkOrdersTable();
};

// ===============================
// HELPER FUNCTIONS
// ===============================
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