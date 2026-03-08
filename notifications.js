// ===============================
// NOTIFICATIONS PAGE
// ===============================

let currentFilter = 'all';
let displayedCount = 10;
const incrementCount = 10;

document.addEventListener("DOMContentLoaded", function() {
    console.log("Notifications page loaded");
    
    setupEventListeners();
    window.loadNotifications(); // Panggil fungsi dari main.js
});

function setupEventListeners() {
    // Filter tabs
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            displayedCount = 10;
            window.loadNotifications();
        });
    });
    
    // Mark all read button
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', function() {
            if (typeof window.markAllNotificationsAsRead === 'function') {
                window.markAllNotificationsAsRead();
            }
        });
    }
    
    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMore);
    }
}

// Fungsi loadNotifications sudah didefinisikan di main.js
// Tapi kita override untuk menambahkan filter
window.loadNotifications = function() {
    const container = document.getElementById('notificationList');
    if (!container) return;
    
    if (!state.notifications || state.notifications.length === 0) {
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
    
    // Filter berdasarkan tab
    let filteredNotifs = [...state.notifications];
    if (currentFilter === 'unread') {
        filteredNotifs = filteredNotifs.filter(n => !n.read);
    }
    
    // Sort by timestamp (newest first)
    filteredNotifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Pagination
    const displayNotifs = filteredNotifs.slice(0, displayedCount);
    
    if (displayNotifs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔔</div>
                <h3>Tidak Ada Notifikasi</h3>
                <p>${currentFilter === 'unread' ? 'Tidak ada notifikasi yang belum dibaca' : 'Belum ada notifikasi'}</p>
            </div>
        `;
    } else {
        container.innerHTML = displayNotifs.map(notif => `
            <div class="notif-item-full ${!notif.read ? 'unread' : ''}" onclick="markNotificationAsRead('${notif.id}')">
                <div class="notif-icon-large">${notif.icon}</div>
                <div class="notif-content-full">
                    <div class="notif-header-row">
                        <h4>${notif.title}</h4>
                        <span class="notif-time">${notif.time}</span>
                    </div>
                    <p class="notif-message">${notif.message}</p>
                    <div class="notif-footer">
                        <span class="notif-type ${notif.type}">${notif.type.replace('-', ' ')}</span>
                        ${!notif.read ? '<span class="notif-read">Baru</span>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
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
    window.loadNotifications();
}

// Override fungsi markNotificationAsRead dari main.js
window.markNotificationAsRead = function(id) {
    console.log('Marking notification as read from notifications page:', id);
    
    const notif = state.notifications.find(n => n.id == id);
    if (notif) {
        notif.read = true;
        
        // Reload halaman notifikasi
        window.loadNotifications();
        
        // Update badges dan panel (fungsi dari main.js)
        if (typeof updateNotificationBadges === 'function') {
            updateNotificationBadges();
        }
        if (typeof updateNotificationsPanel === 'function') {
            updateNotificationsPanel();
        }
    }
};