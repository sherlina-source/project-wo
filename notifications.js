let lastNotificationId = null;
function initNotifications() {

    if (state.notifications.length === 0) return;

    const newestId = state.notifications[0].id;

    if (lastNotificationId && newestId !== lastNotificationId) {
        playNotificationSound();
    }

    lastNotificationId = newestId;

    loadAllNotifications();
    setupNotificationFilters();
}

function loadAllNotifications() {
    const list = document.getElementById('fullNotificationList');
    if (!list) return;
    
    list.innerHTML = state.notifications.map(notif => `
        <div class="notif-item-full ${!notif.read ? 'unread' : ''}" data-id="${notif.id}">
            <div class="notif-icon-large">${notif.icon}</div>
            <div class="notif-content-full">
                <div class="notif-header">
                    <h4>${notif.title}</h4>
                    <span class="notif-time">${notif.time}</span>
                </div>
                <p class="notif-message">${notif.message}</p>
                <div class="notif-footer">
                    <span class="notif-type ${notif.type}">${notif.type}</span>
                    <button class="notif-action" onclick="markSingleRead(${notif.id})">
                        ${notif.read ? 'Read' : 'Mark as read'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function setupNotificationFilters() {
    const tabs = document.querySelectorAll('.notif-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.type;
            filterNotifications(filter);
        });
    });
    
    // Load more button
    const loadMore = document.getElementById('loadMore');
    if (loadMore) {
        loadMore.addEventListener('click', () => {
            alert('Loading more notifications...');
        });
    }
}

function filterNotifications(filter) {
    let filtered = state.notifications;
    
    switch(filter) {
        case 'unread':
            filtered = state.notifications.filter(n => !n.read);
            break;
        case 'mentions':
            filtered = state.notifications.filter(n => n.type === 'mention' || n.type === 'comment');
            break;
    }
    
    displayFilteredNotifications(filtered);
}

function displayFilteredNotifications(notifications) {
    const list = document.getElementById('fullNotificationList');
    if (!list) return;
    
    list.innerHTML = notifications.map(notif => `
        <div class="notif-item-full ${!notif.read ? 'unread' : ''}" data-id="${notif.id}">
            <div class="notif-icon-large">${notif.icon}</div>
            <div class="notif-content-full">
                <div class="notif-header">
                    <h4>${notif.title}</h4>
                    <span class="notif-time">${notif.time}</span>
                </div>
                <p class="notif-message">${notif.message}</p>
                <div class="notif-footer">
                    <span class="notif-type ${notif.type}">${notif.type}</span>
                    <button class="notif-action" onclick="markSingleRead(${notif.id})">
                        ${notif.read ? 'Read' : 'Mark as read'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

window.markSingleRead = function(id) {
    state.notifications = state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
    );
    
    // Update main notification badge
    updateNotifications();
    
    // Reload current view
    const activeTab = document.querySelector('.notif-tab.active');
    if (activeTab) {
        filterNotifications(activeTab.dataset.type);
    } else {
        loadAllNotifications();
    }
};
// =============// PLAY NOTIFICATION SOUND // =============
function playNotificationSound() {

    const enabled = localStorage.getItem("wo_sound_enabled");
    if (enabled !== "true") return;

    const selectedSound =
        localStorage.getItem("wo_selected_sound") ||
        "sound/notification.mp3";

    const volume =
        localStorage.getItem("wo_volume") || 80;

    const audio = new Audio(selectedSound);
    audio.volume = volume / 100;
    audio.play();
}