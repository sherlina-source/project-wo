// ===============================
// 🌍 CONFIG API
// ===============================
const API_BASE_URL = "https://stagingservicewo.salokapark.app/api/get_wo_request";
const DEPT_ID = "DP011";
const REFRESH_INTERVAL = 30000; // 30 detik

// ===============================
// 📦 STATE GLOBAL
// ===============================
window.state = window.state || {
    workOrders: [],
    notifications: [],
    knownWOIds: new Set(), // Gunakan Set untuk tracking ID yang sudah dikenal
    lastWOCount: 0,
    currentPage: window.location.pathname.split("/").pop() || "dashboard.html"
};

// ===============================
// 📌 ELEMENT REFERENCES
// ===============================
const mainElements = {
    soundToggle: document.getElementById('soundToggle'),
    volumeSlider: document.getElementById('volumeSlider'),
    notificationIcon: document.getElementById('notificationIcon'),
    notificationsPanel: document.getElementById('notificationsPanel'),
    markAllRead: document.getElementById('markAllRead'),
    searchInput: document.getElementById('searchInput')
};

// ===============================
// 📡 FETCH ALL WORK ORDERS
// ===============================
async function fetchAllWorkOrders() {
    try {
        const url = `${API_BASE_URL}?id_dept=${DEPT_ID}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Server Error");

        const result = await response.json();
        
        return (result?.status === "success" && Array.isArray(result?.data))
            ? result.data
            : [];

    } catch (error) {
        console.error("API Error:", error);
        return [];
    }
}

// ===============================
// 🚀 INIT APP
// ===============================
async function initApp() {
    console.log("Initializing app...");
    
    const data = await fetchAllWorkOrders();
    
    if (data && data.length > 0) {
        state.workOrders = data;
        
        // Inisialisasi Set dengan ID work order yang ADA
        // TAPI JANGAN buat notifikasi untuk data lama
        state.knownWOIds = new Set(data.map(wo => wo.id));
        state.lastWOCount = data.length;
        
        // KOSONGKAN notifikasi di awal - tidak perlu notifikasi untuk data lama
        state.notifications = [];
    }

    // Update UI
    updateNotifications();
    updateDate();
    setupEventListeners();
    highlightActiveMenu();
    initSidebar();
    initDateTime();

    // Set interval untuk refresh
    setInterval(checkNewWorkOrders, REFRESH_INTERVAL);
}

// ===============================
// 🔄 CEK WORK ORDER BARU
// ===============================
async function checkNewWorkOrders() {
    const newData = await fetchAllWorkOrders();
    
    if (!newData || newData.length === 0) return;

    // Cari work order baru (yang ID-nya belum ada di knownWOIds)
    const newWO = newData.filter(wo => !state.knownWOIds.has(wo.id));
    
    if (newWO.length > 0) {
        console.log(`Found ${newWO.length} NEW work orders`);
        
        // Tambahkan ID baru ke Set
        newWO.forEach(wo => state.knownWOIds.add(wo.id));
        
        // Buat notifikasi HANYA untuk work order BARU
        newWO.forEach(wo => {
            const newNotif = {
                id: Date.now() + wo.id,
                title: "New Work Order",
                message: `${wo.id_wo} - ${wo.job_name || 'New work order'}`,
                time: "Baru saja",
                timestamp: new Date().toISOString(),
                read: false,
                type: 'work-order',
                icon: '📋',
                workOrderId: wo.id
            };
            
            // Tambahkan ke awal array
            state.notifications.unshift(newNotif);
        });
        
        // Batasi jumlah notifikasi (max 20)
        if (state.notifications.length > 20) {
            state.notifications = state.notifications.slice(0, 20);
        }
        
        // Update UI
        updateNotifications();
        
        // Suara hanya berbunyi jika ada notifikasi BELUM DIBACA
        playNotificationSound();
        animateNotificationBell();
    }

    state.lastWOCount = newData.length;
    state.workOrders = newData;
}

// ===============================
// 🔔 UPDATE NOTIFICATIONS UI
// ===============================
function updateNotifications() {
    // Update badge di semua tempat
    updateNotificationBadges();
    
    // Update panel notifikasi
    updateNotificationsPanel();
    
    // Update halaman notifications jika sedang dibuka
    if (typeof window.loadNotifications === 'function') {
        window.loadNotifications();
    }
}

// Update semua badge notifikasi di seluruh halaman
function updateNotificationBadges() {
    const unreadCount = state.notifications.filter(n => !n.read).length;
    
    console.log(`Updating badges - Unread count: ${unreadCount}`);
    
    // Daftar semua ID badge yang mungkin ada di berbagai halaman
    const badgeIds = [
        'notifCount',           // Dashboard
        'notificationBadge',     // Work Orders
        'notifBadge',           // Sidebar badge
        'woBadge',              // Work Orders badge
        'progressBadge',        // In Progress badge
        'completedBadge'        // Completed badge
    ];
    
    badgeIds.forEach(id => {
        const badge = document.getElementById(id);
        if (badge) {
            if (unreadCount > 0) {
                // Jika ada notifikasi, tampilkan badge dengan jumlah
                badge.textContent = unreadCount;
                badge.style.display = 'inline-block';
                badge.style.visibility = 'visible';
                badge.style.opacity = '1';
            } else {
                // Jika tidak ada notifikasi, sembunyikan badge
                badge.style.display = 'none';
                badge.style.visibility = 'hidden';
                badge.style.opacity = '0';
            }
        }
    });
    
    // Update badge di sidebar nav items (jika menggunakan class)
    const navBadges = document.querySelectorAll('.nav-badge');
    navBadges.forEach(badge => {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    });
}

// Update panel notifikasi (floating panel)
function updateNotificationsPanel() {
    const panel = document.getElementById('notificationsList') || 
                  document.getElementById('panelNotificationList');
    if (!panel) return;
    
    // Ambil 5 notifikasi TERBARU
    const recentNotifs = [...state.notifications]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    if (recentNotifs.length === 0) {
        panel.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--gray-500);">
                <div style="font-size: 32px; margin-bottom: 10px;">🔔</div>
                <div style="font-size: 14px;">Tidak ada notifikasi</div>
            </div>
        `;
        return;
    }
    
    panel.innerHTML = recentNotifs.map(notif => `
        <div class="notif-item ${!notif.read ? 'unread' : ''}" onclick="markNotificationAsRead('${notif.id}')">
            <div class="notif-icon">${notif.icon}</div>
            <div class="notif-content">
                <div class="notif-title">${notif.title}</div>
                <div class="notif-message">${notif.message}</div>
                <div class="notif-time">${notif.time}</div>
            </div>
        </div>
    `).join('');
}

// ===============================
// ✅ MARK NOTIFICATION AS READ
// ===============================
window.markNotificationAsRead = function(id) {
    console.log('Marking notification as read:', id);
    
    const notif = state.notifications.find(n => n.id == id);
    if (notif) {
        notif.read = true;
        
        // Update semua UI
        updateNotificationBadges();
        updateNotificationsPanel();
        
        // Update halaman notifications jika ada
        if (typeof window.loadNotifications === 'function') {
            window.loadNotifications();
        }
    }
};

// Mark all as read
window.markAllNotificationsAsRead = function() {
    console.log('Marking ALL notifications as read');
    
    // Tandai semua notifikasi sebagai read
    state.notifications.forEach(n => n.read = true);
    
    // Update semua UI
    updateNotificationBadges();
    updateNotificationsPanel();
    
    // Update halaman notifications jika ada
    if (typeof window.loadNotifications === 'function') {
        window.loadNotifications();
    }
    
    // Tampilkan pesan sukses
    showToast('Semua notifikasi telah ditandai dibaca');
};

// Simple toast function
function showToast(message) {
    // Cek apakah sudah ada toast container
    let toastContainer = document.getElementById('toastContainer');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: var(--primary);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin-top: 10px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
        font-size: 14px;
    `;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===============================
// 🔊 SOUND & ANIMATION
// ===============================
function playNotificationSound() {
    // CEK PENTING: Hanya mainkan suara jika ada notifikasi BELUM DIBACA
    const unreadCount = state.notifications.filter(n => !n.read).length;
    
    if (unreadCount === 0) {
        console.log('No unread notifications, sound not played');
        return;
    }
    
    const audio = document.getElementById("notificationSound");
    if (!audio) return;
    
    // Cek apakah suara diaktifkan di settings
    const soundEnabled = localStorage.getItem("wo_sound_enabled") !== "false";
    if (!soundEnabled) {
        console.log('Sound disabled in settings');
        return;
    }
    
    // Set volume dari settings
    const volume = localStorage.getItem("wo_volume") || 80;
    audio.volume = volume / 100;
    
    // Set sound file dari settings
    const selectedSound = localStorage.getItem("wo_selected_sound") || "notification4";
    let soundFile = 'sounds/notification4.wav';
    switch(selectedSound) {
        case 'notification1': soundFile = 'sounds/notification1.wav'; break;
        case 'notification2': soundFile = 'sounds/notification2.wav'; break;
        case 'notification3': soundFile = 'sounds/notification3.wav'; break;
        case 'notification4': soundFile = 'sounds/notification4.wav'; break;
    }
    audio.src = soundFile;
    
    // Mainkan suara
    audio.currentTime = 0;
    audio.play().catch(err => {
        console.log('Audio play failed:', err);
    });
    
    console.log('🔔 Notification sound played');
}

function animateNotificationBell() {
    const bell = document.getElementById("notificationIcon") || 
                 document.getElementById("notificationBell");
    if (!bell) return;

    bell.classList.add("shake");
    setTimeout(() => bell.classList.remove("shake"), 1000);
}

// ===============================
// 📆 DATE HEADER
// ===============================
function updateDate() {
    const dateElement = document.getElementById("currentDate");
    if (!dateElement) return;

    dateElement.textContent = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

// ===============================
// 🎧 EVENT LISTENERS
// ===============================
function setupEventListeners() {
    // Notification icon click
    const notificationIcon = document.getElementById('notificationIcon') || 
                            document.getElementById('notificationBell');
    const notificationsPanel = document.getElementById('notificationsPanel');
    
    if (notificationIcon && notificationsPanel) {
        notificationIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            notificationsPanel.classList.toggle("active");
        });
    }

    // Mark all read button
    const markAllRead = document.getElementById('markAllRead') || 
                        document.getElementById('markPanelRead') ||
                        document.getElementById('markAllReadBtn');
    
    if (markAllRead) {
        markAllRead.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            markAllNotificationsAsRead();
        });
    }

    // Click outside to close panel
    document.addEventListener("click", (e) => {
        if (notificationsPanel && 
            !notificationsPanel.contains(e.target) && 
            notificationIcon && 
            !notificationIcon.contains(e.target)) {
            notificationsPanel.classList.remove("active");
        }
    });
}

// ===============================
// 📂 SIDEBAR
// ===============================
function initSidebar() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");
    const mainContent = document.querySelector(".main-content");

    if (!sidebar || !toggleBtn || !mainContent) return;

    toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        mainContent.classList.toggle("collapsed");
    });
}

// ===============================
// 🎨 MENU ACTIVE
// ===============================
function highlightActiveMenu() {
    const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";
    const links = document.querySelectorAll(".nav-item");
    
    links.forEach(link => {
        const href = link.getAttribute("href");
        if (href === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}

// ===============================
// 📅 DATE & TIME INPUT
// ===============================
function initDateTime() {
    const dateInput = document.getElementById("dateInput");
    const timeInput = document.getElementById("timeInput");
    if (!dateInput || !timeInput) return;

    const now = new Date();
    dateInput.valueAsDate = now;
    timeInput.value = now.toTimeString().slice(0, 5);
}

// ===============================
// 🛠 UTILITY FUNCTIONS
// ===============================
function formatDate(dateString) {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString.replace(' ', 'T'));
        if (isNaN(date)) return dateString;
        return date.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
    } catch {
        return dateString;
    }
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    
    return formatDate(date.toISOString());
}

// ===============================
// 🚀 START APP
// ===============================
document.addEventListener('DOMContentLoaded', initApp);

// Tambahkan CSS animation untuk toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .shake {
        animation: shake 0.5s ease;
    }
    
    @keyframes shake {
        0%, 100% { transform: rotate(0); }
        20% { transform: rotate(15deg); }
        40% { transform: rotate(-15deg); }
        60% { transform: rotate(7deg); }
        80% { transform: rotate(-7deg); }
    }
`;
document.head.appendChild(style);

// Expose functions globally
window.fetchAllWorkOrders = fetchAllWorkOrders;
window.formatDate = formatDate;
window.markNotificationAsRead = markNotificationAsRead;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;