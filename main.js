// ===============================
// 🌍 CONFIG API
// ===============================
const API_BASE_URL = "https://stagingservicewo.salokapark.app/api/get_wo_request";
const DEPT_ID = "DP011";

// ===============================
// 📦 STATE GLOBAL
// ===============================
const state = {
    workOrders: [],
    notifications: [],
    lastWOCount: 0,
    currentPage: window.location.pathname.split("/").pop() || "index.html"
};

// ===============================
// 📡 FETCH WORK ORDER FROM API
// ===============================
async function fetchWorkOrdersFromAPI(date = null) {
    try {
        let url = `${API_BASE_URL}?id_dept=${DEPT_ID}`;

        if (date) {
            url += `&date_request=${date}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Gagal mengambil API");

        const result = await response.json();
        return result.status === "success" ? result.data : [];
    } catch (error) {
        console.error("Fetch API Error:", error);
        return [];
    }
}

// ===============================
// 🚀 INIT APP
// ===============================
document.addEventListener("DOMContentLoaded", async function () {
    await initApp();
    loadPageContent();
});

async function initApp() {

    const today = new Date().toISOString().split("T")[0];

    const data = await fetchWorkOrdersFromAPI(today);

    state.workOrders = data;
    state.lastWOCount = data.length;

    updateUserInfo();
    generateNotificationsFromWO(data);
    updateNotifications();
    updateDate();
    setupEventListeners();
    highlightActiveMenu();

    // Cek WO baru tiap 30 detik
    setInterval(checkNewWorkOrders, 30000);
}
function updateUserInfo() {
    if (elements.userName && apiResponse.data.length > 0) {
        const user = apiResponse.data[0];
        const nameParts = user.name_request.split(' ');
        elements.userAvatar.textContent = nameParts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
        elements.userName.textContent = user.name_request;
        elements.userRole.textContent = `${user.departemen} - ${user.sub_departemen}`;
    }
}

// ===============================
// 🔄 CEK WORK ORDER BARU
// ===============================
async function checkNewWorkOrders() {

    const today = new Date().toISOString().split("T")[0];

    const newData = await fetchWorkOrdersFromAPI(today);

    if (newData.length > state.lastWOCount) {

        const newWO = newData[0];

        state.notifications.unshift({
            id: Date.now(),
            title: "Work Order Baru",
            message: `${newWO.id_wo} - ${newWO.job_name}`,
            time: "Baru saja",
            read: false,
            icon: "📋"
        });

        playNotificationSound();
        animateNotificationBell();
    }

    state.lastWOCount = newData.length;
    state.workOrders = newData;

    updateNotifications();
}

// ===============================
// 🔔 GENERATE NOTIFICATION AWAL
// ===============================
function generateNotificationsFromWO(workOrders) {

    state.notifications = workOrders.map(wo => ({
        id: wo.id,
        title: "Work Order",
        message: `${wo.id_wo} - ${wo.job_name}`,
        time: formatDate(wo.created_at),
        read: false,
        icon: "📋"
    }));
}

// ===============================
// 🔊 PLAY SOUND
// ===============================
function playNotificationSound() {
    const audio = document.getElementById("notificationSound");
    if (!audio) return;

    audio.currentTime = 0;
    audio.play().catch(err => console.log("Audio blocked:", err));
}

// ===============================
// 🔔 ANIMASI ICON LONCENG
// ===============================
function animateNotificationBell() {
    const bell = document.getElementById("notificationBell");
    if (!bell) return;

    bell.classList.add("shake");

    setTimeout(() => {
        bell.classList.remove("shake");
    }, 1000);
}

// ===============================
// 📋 UPDATE NOTIFICATION UI
// ===============================
function updateNotifications() {

    const container = document.getElementById("notificationList");
    const badge = document.getElementById("notificationBadge");

    if (!container) return;

    container.innerHTML = "";

    const unreadCount = state.notifications.filter(n => !n.read).length;

    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? "inline-block" : "none";

    state.notifications.forEach(notification => {

        const item = document.createElement("div");
        item.className = "notification-item";

        item.innerHTML = `
            <div class="notif-icon">${notification.icon}</div>
            <div class="notif-content">
                <strong>${notification.title}</strong>
                <p>${notification.message}</p>
                <small>${notification.time}</small>
            </div>
        `;

        container.appendChild(item);
    });
}

// ===============================
// 📅 FORMAT TANGGAL
// ===============================
function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    
    });
}

// ===============================
// 📆 UPDATE TANGGAL HEADER
// ===============================
function updateDate() {
    const dateElement = document.getElementById("currentDate");
    if (!dateElement) return;

    const today = new Date();

    dateElement.textContent = today.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function setupEventListeners() {
    // Sound toggle
    if (elements.soundToggle) {
        elements.soundToggle.addEventListener('click', () => {
            state.soundEnabled = !state.soundEnabled;
            elements.soundToggle.textContent = state.soundEnabled ? '🔊' : '🔇';
        });
    }

    // Volume slider
    if (elements.volumeSlider) {
        elements.volumeSlider.addEventListener('input', (e) => {
            state.volume = e.target.value;
        });
    }
    
    // Notification icon click
    if (elements.notificationIcon) {
        elements.notificationIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (elements.notificationsPanel) {
                elements.notificationsPanel.classList.toggle('active');
            }
        });
    }
 
    
    // Mark all as read
    if (elements.markAllRead) {
        elements.markAllRead.addEventListener('click', () => {
            state.notifications = state.notifications.map(n => ({ ...n, read: true }));
            updateNotifications();
        });
    }
    
    // Search input
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', debounce(handleSearch, 500));
    }
     // Close notifications when clicking outside
     document.addEventListener('click', (e) => {
        if (elements.notificationsPanel && 
            !elements.notificationsPanel.contains(e.target) && 
            !elements.notificationIcon?.contains(e.target)) {
            elements.notificationsPanel.classList.remove('active');
        }
    });
    
    // Request notification permission
    if (Notification.permission === "default") {
        Notification.requestPermission();
    }
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

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    console.log('Searching:', searchTerm);
    // Implement search functionality based on current page
}

// ===============================
// 🎨 MENU ACTIVE
// ===============================
function highlightActiveMenu() {
    const links = document.querySelectorAll(".menu-link");

    links.forEach(link => {
        if (link.getAttribute("href") === state.currentPage) {
            link.classList.add("active");
        }
    });
}
function loadPageContent() {
    const page = state.currentPage;
    
    switch(page) {
        case 'index.html':
        case '':
        case '#':
            loadDashboard();
            break;
        case 'work-orders.html':
            loadWorkOrders();
            break;
        case 'in-progress.html':
            loadInProgress();
            break;
        case 'completed.html':
            loadCompleted();
            break;
        case 'notifications.html':
            loadNotifications();
            break;
        case 'settings.html':
            loadSettings();
            break;
    }
}

// Page-specific functions will be implemented in separate files
function loadDashboard() {
    if (typeof initDashboard === 'function') {
        initDashboard();
    }
}

function loadWorkOrders() {
    if (typeof initWorkOrders === 'function') {
        initWorkOrders();
    }
}

function loadInProgress() {
    if (typeof initInProgress === 'function') {
        initInProgress();
    }
}

function loadCompleted() {
    if (typeof initCompleted === 'function') {
        initCompleted();
    }
}

function loadNotifications() {
    if (typeof initNotifications === 'function') {
        initNotifications();
    }
}

function loadSettings() {
    if (typeof initSettings === 'function') {
        initSettings();
    }
}

// Format helpers
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getPriorityText(priority) {
    const priorityMap = {
        1: { text: 'High Priority', class: 'priority-high' },
        2: { text: 'Medium Priority', class: 'priority-medium' },
        3: { text: 'Low Priority', class: 'priority-low' }
    };
    return priorityMap[priority] || { text: 'Unknown', class: 'priority-low' };
}

function getStatusText(status) {
    const statusMap = {
        1: { text: 'Pending', class: 'status-pending' },
        2: { text: 'In Progress', class: 'status-progress' },
        3: { text: 'Completed', class: 'status-completed' }
    };
    return statusMap[status] || { text: 'Unknown', class: 'status-pending' };
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const mainContent = document.querySelector('.main-content');
  
    if (!sidebar || !toggleBtn || !mainContent) return;
  
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      mainContent.classList.toggle('collapsed');
    });
  });

  
const timeInput = document.getElementById('timeInput');

// Set default hari ini
const now = new Date();
dateInput.valueAsDate = now;
timeInput.value = now.toTimeString().slice(0,5);

// Event saat diubah
dateInput.addEventListener('change', updateDateTime);
timeInput.addEventListener('change', updateDateTime);

function updateDateTime() {
  const date = dateInput.value;
  const time = timeInput.value;
  console.log("Tanggal:", date, "Waktu:", time);
}