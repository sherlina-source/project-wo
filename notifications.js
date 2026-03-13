// ===============================
// NOTIFICATIONS PAGE 
// ===============================

let currentFilter = 'all';
let displayedCount = 10;
const incrementCount = 10;

document.addEventListener("DOMContentLoaded", function() {
    console.log("Notifications page loaded");
    
    setupEventListeners();
    if (typeof window.loadNotifications === 'function') {
        window.loadNotifications();
    }
});

function setupEventListeners() {

    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            displayedCount = 10;
            if (typeof window.loadNotifications === 'function') {
                window.loadNotifications();
            }
        });
    });
    
   
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', function() {
            if (typeof window.markAllNotificationsAsRead === 'function') {
                window.markAllNotificationsAsRead();
            }
        });
    }
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMore);
    }
}

// ===============================
// FORMAT DATE & TIME 
// ===============================
function formatNotifDateTime(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = days[date.getDay()];
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        const fullDate = `${dayName}, ${day}/${month}/${year}`;
        const fullTime = `${hours}:${minutes}`;
        
        if (diffHours < 24) {
            if (diffHours < 1) {
                if (diffMins < 1) return 'Baru saja';
                if (diffMins < 60) return `${diffMins} menit yang lalu`;
            }
            return `${diffHours} jam yang lalu (${fullTime})`;
        }
        
        if (diffDays === 1) return `Kemarin, ${fullTime}`;
        if (diffDays < 7) return `${diffDays} hari yang lalu, ${fullTime}`;
        
        return `${fullDate} ${fullTime}`;
        
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

// ===============================
// LOAD NOTIFICATIONS - DENGAN DATE & TIME
// ===============================
window.loadNotifications = function() {
    const container = document.getElementById('notificationList');
    if (!container) return;
    
    if (!state || !state.notifications || state.notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔔</div>
                <h3>Tidak Ada Notifikasi</h3>
                <p>Belum ada notifikasi saat ini</p>
            </div>
        `;
        updateLoadMoreButton(0);
        return;
    }
    
    let filteredNotifs = [...state.notifications];
    if (currentFilter === 'unread') {
        filteredNotifs = filteredNotifs.filter(n => !n.read);
    }
    
    filteredNotifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const displayNotifs = filteredNotifs.slice(0, displayedCount);
    
    if (displayNotifs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>Tidak Ada Notifikasi</h3>
                <p>${currentFilter === 'unread' ? 'Tidak ada notifikasi yang belum dibaca' : 'Belum ada notifikasi'}</p>
            </div>
        `;
    } else {
        container.innerHTML = displayNotifs.map(notif => {
        
            const formattedDateTime = formatNotifDateTime(notif.timestamp);
            
            return `
            <div class="notif-item-full ${!notif.read ? 'unread' : ''}" onclick="markNotificationAsRead('${notif.id}')">
                <div class="notif-icon-large">${notif.icon || '📋'}</div>
                <div class="notif-content-full">
                    <div class="notif-header-row">
                        <h4>${notif.title || 'Work Order'}</h4>
                        <span class="notif-time" title="${new Date(notif.timestamp).toLocaleString('id-ID')}">${formattedDateTime}</span>
                    </div>
                    <p class="notif-message">${notif.message || ''}</p>
                    <div class="notif-meta" style="display: flex; gap: 10px; margin-top: 8px; font-size: 11px; color: #7f8c8d;">
                        <span>🆔 ${notif.workOrderId || '-'}</span>
                        <span>📋 ${notif.type || 'work-order'}</span>
                    </div>
                    <div class="notif-footer" style="margin-top: 10px;">
                        <span class="notif-type">${notif.type || 'work-order'}</span>
                        ${!notif.read 
                            ? '<span class="notif-read" style="background:#2ecc71; color:white;">Baru</span>' 
                            : '<span class="notif-read" style="background:#e8f5e9; color:#27ae60;">Sudah dibaca</span>'
                        }
                    </div>
                </div>
            </div>
        `}).join('');
    }
    
    updateLoadMoreButton(filteredNotifs.length);
};

function updateLoadMoreButton(totalItems) {
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (!loadMoreContainer) return;
    
    if (totalItems > displayedCount) {
        loadMoreContainer.style.display = 'block';
    } else {
        loadMoreContainer.style.display = 'none';
    }
}

function loadMore() {
    displayedCount += incrementCount;
    if (typeof window.loadNotifications === 'function') {
        window.loadNotifications();
    }
}

// ===============================
// MARK NOTIFICATION AS READ
// ===============================
window.markNotificationAsRead = function(id) {
    console.log('Marking notification as read:', id);
    
    const notif = state.notifications.find(n => n.id == id);
    if (notif) {
        notif.read = true;
        
        if (typeof window.loadNotifications === 'function') {
            window.loadNotifications();
        }
        
        if (typeof updateNotificationBadges === 'function') {
            updateNotificationBadges();
        }
        if (typeof updateNotificationsPanel === 'function') {
            updateNotificationsPanel();
        }
    }
};