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
        state.knownWOIds = new Set(data.map(wo => wo.id));
        state.lastWOCount = data.length;
        
        // Generate notifikasi awal (SEMUA READ = TRUE)
        generateInitialNotifications(data);
    } else {
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
        
        // Buat notifikasi HANYA untuk work order BARU (READ = FALSE)
        newWO.forEach(wo => {
            const newNotif = {
                id: Date.now() + wo.id,
                title: "New Work Order",
                message: `${wo.id_wo} - ${wo.job_name || 'New work order'}`,
                time: "Baru saja",
                timestamp: new Date().toISOString(),
                read: false, // ✅ NOTIF BARU = BELUM DIBACA
                icon: getNotificationIcon(wo),
                type: 'work-order',
                workOrderId: wo.id
            };
            
            state.notifications.unshift(newNotif);
        });
        
        // Batasi jumlah notifikasi (max 50)
        if (state.notifications.length > 50) {
            state.notifications = state.notifications.slice(0, 50);
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
// 🔔 GENERATE INITIAL NOTIFICATIONS - SEMUA READ = TRUE
// ===============================
function generateInitialNotifications(workOrders) {
    if (!workOrders || workOrders.length === 0) {
        state.notifications = [];
        return;
    }
    
    // Ambil 10 work order terbaru untuk notifikasi awal
    const recent = [...workOrders]
        .sort((a, b) => {
            const dateA = new Date(a.created_at || a.date_request || 0);
            const dateB = new Date(b.created_at || b.date_request || 0);
            return dateB - dateA;
        })
        .slice(0, 10);
    
    // Buat notifikasi dengan status READ = TRUE (badge TIDAK muncul)
    state.notifications = recent.map((wo, index) => ({
        id: Date.now() - index,
        title: "Work Order",
        message: `${wo.id_wo || 'WO'} - ${wo.job_name || 'Work order'}`,
        time: formatTimeAgo(new Date(wo.created_at || wo.date_request || Date.now())),
        timestamp: wo.created_at || wo.date_request || new Date().toISOString(),
        read: true, // ✅ READ = TRUE - BADGE TIDAK MUNCUL
        icon: getNotificationIcon(wo),
        type: 'work-order',
        workOrderId: wo.id
    }));
    
    console.log(`Generated ${state.notifications.length} initial notifications (all marked as read)`);
}

// ===============================
// 🔔 GET NOTIFICATION ICON
// ===============================
function getNotificationIcon(wo) {
    const status = Number(wo.track_status || wo.status);
    if (status === 2 || status === 3) return '⏳';
    if (status === 4 || status === 5) return '✅';
    return '📋';
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

// ===============================
// 🔔 UPDATE NOTIFICATION BADGES - HANYA MUNCUL JIKA ADA UNREAD
// ===============================
function updateNotificationBadges() {
    // Hitung notifikasi yang BELUM DIBACA
    const unreadCount = state.notifications.filter(n => !n.read).length;
    
    console.log(`Updating badges - Unread count: ${unreadCount}`);
    
    // Daftar semua ID badge
    const badgeIds = [
        'notifCount',           // Dashboard
        'notificationBadge',    // Top bar
        'notifBadge',           // Sidebar badge
        'woBadge',              // Work Orders badge
        'progressBadge',        // In Progress badge
        'completedBadge'        // Completed badge
    ];
    
    // Update setiap badge
    badgeIds.forEach(id => {
        const badge = document.getElementById(id);
        if (badge) {
            if (unreadCount > 0) {
                // Jika ada notifikasi belum dibaca, TAMPILKAN badge
                badge.textContent = unreadCount;
                badge.style.display = 'inline-block';
                badge.style.visibility = 'visible';
                badge.style.opacity = '1';
            } else {
                // Jika tidak ada notifikasi, SEMBUNYIKAN badge
                badge.style.display = 'none';
                badge.style.visibility = 'hidden';
                badge.style.opacity = '0';
            }
        }
    });
    
    // Update badge di sidebar nav items
    document.querySelectorAll('.nav-badge').forEach(badge => {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    });
}

// ===============================
// 🔔 UPDATE NOTIFICATIONS PANEL (FLOATING PANEL)
// ===============================
function updateNotificationsPanel() {
    const panel = document.getElementById('notificationsList') || 
                  document.getElementById('panelNotificationList');
    if (!panel) return;
    
    // Ambil 5 notifikasi UNREAD TERBARU untuk panel
    const unreadNotifs = [...state.notifications]
        .filter(n => !n.read)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    if (unreadNotifs.length === 0) {
        panel.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--gray-500);">
                <div style="font-size: 32px; margin-bottom: 10px;">✅</div>
                <div style="font-size: 14px;">Semua notifikasi sudah dibaca</div>
            </div>
        `;
        return;
    }
    
    panel.innerHTML = unreadNotifs.map(notif => `
        <div class="notif-item unread" onclick="markNotificationAsRead('${notif.id}')">
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

// ===============================
// ✅ MARK ALL AS READ - TANPA MENGHAPUS NOTIFIKASI
// ===============================
window.markAllNotificationsAsRead = function() {
    console.log('Marking ALL notifications as read (keeping history)');
    
    // Tandai semua notifikasi sebagai read (status dibaca)
    // TAPI TIDAK MENGHAPUS ARRAY notifikasi
    state.notifications.forEach(n => n.read = true);
    
    // Update UI - badge akan hilang karena unreadCount = 0
    updateNotificationBadges();
    updateNotificationsPanel();
    
    // Update halaman notifications jika sedang dibuka
    if (typeof window.loadNotifications === 'function') {
        window.loadNotifications();
    }
    
    showToast('Semua notifikasi telah ditandai dibaca', 'success');
};

// ===============================
// 🔔 TOAST FUNCTION
// ===============================
function showToast(message, type = 'info') {
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
    
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        info: '#3498db'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin-top: 10px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
        font-size: 14px;
        cursor: pointer;
    `;
    toast.textContent = message;
    toast.onclick = () => toast.remove();
    
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
    const unreadCount = state.notifications.filter(n => !n.read).length;
    
    if (unreadCount === 0) {
        console.log('No unread notifications, sound not played');
        return;
    }
    
    const audio = document.getElementById("notificationSound");
    if (!audio) return;
    
    const soundEnabled = localStorage.getItem("wo_sound_enabled") !== "false";
    if (!soundEnabled) return;
    
    const volume = localStorage.getItem("wo_volume") || 80;
    audio.volume = volume / 100;
    
    const selectedSound = localStorage.getItem("wo_selected_sound") || "notification4";
    let soundFile = 'sounds/notification4.wav';
    switch(selectedSound) {
        case 'notification1': soundFile = 'sounds/notification1.wav'; break;
        case 'notification2': soundFile = 'sounds/notification2.wav'; break;
        case 'notification3': soundFile = 'sounds/notification3.wav'; break;
        case 'notification4': soundFile = 'sounds/notification4.wav'; break;
    }
    audio.src = soundFile;
    
    audio.currentTime = 0;
    audio.play().catch(err => console.log('Audio play failed:', err));
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
    const notificationIcon = document.getElementById('notificationIcon') || 
                            document.getElementById('notificationBell');
    const notificationsPanel = document.getElementById('notificationsPanel');
    
    if (notificationIcon && notificationsPanel) {
        notificationIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            notificationsPanel.classList.toggle("active");
        });
    }

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
    if (!dateString) return '-';
    try {
        let cleanDate = dateString;
        if (dateString.includes(' ')) {
            cleanDate = dateString.split(' ')[0]; 
        }
        const [year, month, day] = cleanDate.split('-');
        if (year && month && day) {
            return `${day}/${month}/${year}`;
        }
        
        const date = new Date(dateString);
        if (!isNaN(date)) {
            const d = String(date.getDate()).padStart(2, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const y = date.getFullYear();
            return `${d}/${m}/${y}`;
        }
        
        return dateString;
    } catch (error) {
        console.warn('Error formatting date:', dateString);
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
// 💅 CSS ANIMATIONS
// ===============================
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

// ===============================
// 🚀 START APP
// ===============================
document.addEventListener('DOMContentLoaded', initApp);

// ===============================
// 🌐 EXPOSE GLOBAL FUNCTIONS
// ===============================
window.fetchAllWorkOrders = fetchAllWorkOrders;
window.formatDate = formatDate;
window.markNotificationAsRead = markNotificationAsRead;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.showToast = showToast;