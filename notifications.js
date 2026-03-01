function initNotifications() {

    const currentCount = state.notifications.length;

    if (currentCount > lastNotificationCount) {
        playNotificationSound();
    }

    lastNotificationCount = currentCount;

    loadAllNotifications();
    setupNotificationFilters();
}

function loadAllNotifications() {

    const list = document.getElementById('fullNotificationList');
    if (!list) return;

    if (state.notifications.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:40px; color:#888;">
                Tidak ada notifikasi
            </div>
        `;
        return;
    }

    list.innerHTML = state.notifications.map(notif => `
        <div class="notif-item-full ${!notif.read ? 'unread' : ''}" data-id="${notif.id}">
            <div class="notif-icon-large">${notif.icon}</div>
            <div>
                <div style="display:flex; justify-content:space-between;">
                    <strong>${notif.title}</strong>
                    <small>${notif.time}</small>
                </div>
                <p>${notif.message}</p>
                <button onclick="markSingleRead(${notif.id})">
                    ${notif.read ? 'Read' : 'Mark as read'}
                </button>
            </div>
        </div>
    `).join('');
}

function setupNotificationFilters() {

    const tabs = document.querySelectorAll('.filter-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {

            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            filterNotifications(this.dataset.type);
        });
    });
}

function filterNotifications(filter) {

    let filtered = state.notifications;

    if (filter === 'unread') {
        filtered = state.notifications.filter(n => !n.read);
    }

    if (filter === 'mentions') {
        filtered = state.notifications.filter(n =>
            n.type === 'comment'
        );
    }

    const list = document.getElementById('fullNotificationList');
    if (!list) return;

    list.innerHTML = filtered.map(notif => `
        <div class="notif-item-full ${!notif.read ? 'unread' : ''}">
            <div class="notif-icon-large">${notif.icon}</div>
            <div>
                <strong>${notif.title}</strong>
                <p>${notif.message}</p>
                <small>${notif.time}</small>
            </div>
        </div>
    `).join('');
}

window.markSingleRead = function (id) {
    state.notifications = state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
    );
    loadAllNotifications();
};