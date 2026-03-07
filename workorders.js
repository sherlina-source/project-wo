// ===============================
// WORK ORDERS PAGE - VERSION IMPROVED
// ===============================

// State management
let currentFilterStatus = 'all';
let currentPage = 1;
let itemsPerPage = 10;
let selectedWOId = null;

document.addEventListener("DOMContentLoaded", function() {
    console.log("Work Orders page loaded");
    
    // Tunggu data dari main.js
    checkData();
    
    // Setup event listeners
    setupEventListeners();
});

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
    loadStats();
    loadWorkOrdersTable();
    setupFilterTabs();
}

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
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

function loadStats() {
    const total = state.workOrders.length;
    const pending = state.workOrders.filter(wo => Number(wo.status) === 1).length;
    const progress = state.workOrders.filter(wo => Number(wo.status) === 2).length;
    const completed = state.workOrders.filter(wo => Number(wo.status) === 3).length;

    setText('totalWO', total);
    setText('pendingWO', pending);
    setText('inProgressWO', progress);
    setText('completedWO', completed);
}

// ===============================
// LOAD WORK ORDERS TABLE dengan BADGE
// ===============================
function loadWorkOrdersTable() {
    const tbody = document.getElementById('woTableBody');
    if (!tbody) return;

    // Filter data
    let filteredData = [...state.workOrders];
    
    // Filter by status
    if (currentFilterStatus !== 'all') {
        filteredData = filteredData.filter(wo => Number(wo.status) === Number(currentFilterStatus));
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
                <td>${formatDate(wo.date_request)}</td>
                <td>${getPriorityBadge(wo.priority)}</td>
                <td>${getStatusBadge(wo.status)}</td>
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
// FUNGSI UNTUK BADGE PRIORITY
// ===============================
function getPriorityBadge(priority) {
    switch(Number(priority)) {
        case 1:
            return '<span style="background: #fde8e8; color: #e74c3c; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #fad1d1;">High</span>';
        case 2:
            return '<span style="background: #fff3d6; color: #f39c12; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #ffebc2;">Medium</span>';
        case 3:
            return '<span style="background: #e8f5e9; color: #27ae60; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #a3e4b7;">Low</span>';
        default:
            return '<span style="background: #ecf0f1; color: #7f8c8d; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600;">-</span>';
    }
}

// ===============================
// FUNGSI UNTUK BADGE STATUS
// ===============================
function getStatusBadge(status) {
    switch(Number(status)) {
        case 1:
            return '<span style="background: #ecf0f1; color: #7f8c8d; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #bdc3c7;">Pending</span>';
        case 2:
            return '<span style="background: #fff3d6; color: #f39c12; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #ffebc2;">In Progress</span>';
        case 3:
            return '<span style="background: #e8f5e9; color: #27ae60; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; border: 1px solid #a3e4b7;">Completed</span>';
        default:
            return '<span style="background: #ecf0f1; color: #7f8c8d; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600;">-</span>';
    }
}

// ===============================
// FUNGSI DETAIL DENGAN TAMPILAN MENARIK
// ===============================
window.showDetail = function(id) {
    console.log('Menampilkan detail untuk ID:', id);
    
    // Cari data
    const wo = state.workOrders.find(w => w.id == id);
    if (!wo) {
        alert('Data tidak ditemukan!');
        return;
    }
    
    // Update selected ID
    selectedWOId = id;
    
    // Refresh table untuk highlight
    loadWorkOrdersTable();
    
    // Cari container
    let container = document.getElementById('detailCardContainer');
    if (!container) {
        alert('Container detail tidak ditemukan!');
        return;
    }
    
    // Buat HTML detail dengan tampilan menarik
    const detailHTML = `
        <div style="background: white; border-radius: 20px; padding: 30px; margin: 25px 0; 
                    border: none; box-shadow: 0 10px 40px rgba(46,204,113,0.15); 
                    position: relative; overflow: hidden;">
            
            <!-- Header dengan gradient -->
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 8px; 
                        background: linear-gradient(90deg, #2ecc71, #3498db, #9b59b6);"></div>
            
            <!-- Tombol Close -->
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
            
            <!-- Title Section -->
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
            </div>
            
            <!-- Grid 2 Kolom -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                
                <!-- Card Informasi Pekerjaan -->
                <div style="background: #f8f9fa; border-radius: 15px; padding: 20px; 
                            border: 1px solid #e8f5e9; transition: all 0.3s;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.02);"
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 5px 20px rgba(46,204,113,0.1)';"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 10px rgba(0,0,0,0.02)';">
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
                        ${renderInfoRow('Priority', getPriorityText(wo.priority), '⚡', true)}
                    </div>
                </div>
                
                <!-- Card Informasi Department -->
                <div style="background: #f8f9fa; border-radius: 15px; padding: 20px; 
                            border: 1px solid #e8f5e9; transition: all 0.3s;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.02);"
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 5px 20px rgba(46,204,113,0.1)';"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 10px rgba(0,0,0,0.02)';">
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
                
                <!-- Card Timeline -->
                <div style="background: #f8f9fa; border-radius: 15px; padding: 20px; 
                            border: 1px solid #e8f5e9; transition: all 0.3s;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.02);"
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 5px 20px rgba(46,204,113,0.1)';"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 10px rgba(0,0,0,0.02)';">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <span style="background: linear-gradient(135deg, #f39c12, #e67e22); 
                                     width: 40px; height: 40px; border-radius: 10px; 
                                     display: flex; align-items: center; justify-content: center;
                                     color: white; font-size: 20px;">⏰</span>
                        <h3 style="color: #2c3e50; margin: 0; font-size: 18px;">Timeline</h3>
                    </div>
                    
                    <div style="display: grid; gap: 12px;">
                        ${renderInfoRow('Tanggal Request', formatDateTime(wo.date_request), '📅')}
                        ${renderInfoRow('Work Started', wo.work_started ? formatDateTime(wo.work_started) : '-', '▶️')}
                        ${renderInfoRow('Work Completed', wo.work_completed ? formatDateTime(wo.work_completed) : '-', '✅')}
                        ${renderInfoRow('Created At', formatDateTime(wo.created_at), '🕒')}
                    </div>
                </div>
                
                <!-- Card Requestor & PIC -->
                <div style="background: #f8f9fa; border-radius: 15px; padding: 20px; 
                            border: 1px solid #e8f5e9; transition: all 0.3s;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.02);"
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 5px 20px rgba(46,204,113,0.1)';"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 10px rgba(0,0,0,0.02)';">
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
                
                <!-- Card Deskripsi (Full Width) -->
                <div style="background: #f8f9fa; border-radius: 15px; padding: 20px; 
                            border: 1px solid #e8f5e9; grid-column: span 2;
                            transition: all 0.3s; box-shadow: 0 2px 10px rgba(0,0,0,0.02);"
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 5px 20px rgba(46,204,113,0.1)';"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 10px rgba(0,0,0,0.02)';">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <span style="background: linear-gradient(135deg, #1abc9c, #16a085); 
                                     width: 40px; height: 40px; border-radius: 10px; 
                                     display: flex; align-items: center; justify-content: center;
                                     color: white; font-size: 20px;">📝</span>
                        <h3 style="color: #2c3e50; margin: 0; font-size: 18px;">Deskripsi</h3>
                    </div>
                    
                    <div style="background: white; padding: 20px; border-radius: 10px; 
                                border: 1px solid #e8f5e9; margin-bottom: 15px;">
                        <p style="margin: 0; color: #2c3e50; line-height: 1.6;">
                            ${wo.description_of_work_order || '<span style="color: #95a5a6; font-style: italic;">Tidak ada deskripsi</span>'}
                        </p>
                    </div>
                    
                   ${wo.job_image ? `
                    <div style="text-align: center;">
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
            
            <!-- Footer -->
            <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #e8f5e9;
                        display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 10px;">
                    <span style="background: #f8f9fa; padding: 5px 15px; border-radius: 20px;
                                 color: #7f8c8d; font-size: 12px;">
                        Status: ${getStatusText(wo.status)}
                    </span>
                    <span style="background: #f8f9fa; padding: 5px 15px; border-radius: 20px;
                                 color: #7f8c8d; font-size: 12px;">
                        Updated: ${formatDate(wo.updated_at)}
                    </span>
                </div>
                <span style="color: #95a5a6; font-size: 12px;">
                    ID Work Order: ${wo.id_wo}
                </span>
            </div>
        </div>
    `;
    
    // Tampilkan detail
    container.innerHTML = detailHTML;
    container.style.display = 'block';
    
    // Scroll ke detail dengan animasi
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ===============================
// HELPER UNTUK RENDER INFO ROW
// ===============================
function renderInfoRow(label, value, icon, isPriority = false) {
    let valueStyle = 'color: #2c3e50; font-weight: 500;';
    
    if (isPriority) {
        const priorityColor = {
            'High': '#e74c3c',
            'Medium': '#f39c12',
            'Low': '#27ae60'
        };
        const color = priorityColor[value] || '#2c3e50';
        valueStyle = `color: ${color}; font-weight: 600;`;
    }
    
    return `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="width: 30px; color: #7f8c8d; font-size: 14px;">${icon}</span>
            <span style="color: #7f8c8d; width: 100px; font-size: 13px;">${label}:</span>
            <span style="${valueStyle} flex: 1; font-size: 13px;">${value}</span>
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

function setupFilterTabs() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            closeDetail();
            currentFilterStatus = this.dataset.status;
            currentPage = 1;
            loadWorkOrdersTable();
        });
    });
}

function filterWorkOrders() {
    closeDetail();
    currentPage = 1;
    loadWorkOrdersTable();
}

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
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">›</button>`;
    pagination.innerHTML = html;
}

window.changePage = function(page) {
    closeDetail();
    currentPage = page;
    loadWorkOrdersTable();
};

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString.replace(' ', 'T'));
        return isNaN(date) ? dateString : date.toLocaleDateString('id-ID');
    } catch {
        return dateString;
    }
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString.replace(' ', 'T'));
        return isNaN(date) ? dateString : date.toLocaleString('id-ID');
    } catch {
        return dateString;
    }
}

function getPriorityText(priority) {
    const map = {1: 'High', 2: 'Medium', 3: 'Low'};
    return map[priority] || '-';
}

function getStatusText(status) {
    const map = {1: 'Pending', 2: 'In Progress', 3: 'Completed'};
    return map[status] || '-';
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}