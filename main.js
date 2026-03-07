// ===============================
// 🌍 CONFIG API
// ===============================
const API_BASE_URL = "https://stagingservicewo.salokapark.app/api/get_wo_request";
const DEPT_ID = "DP011"; // ID Departemen yang digunakan

// ===============================
// 📦 STATE GLOBAL
// ===============================
window.state = window.state || {
    workOrders: [],
    notifications: [],
    knownWOIds: [],
    lastWOCount: 0,
    currentPage: window.location.pathname.split("/").pop() || "dashboard.html"
};

// ===============================
// 📡 FETCH WORK ORDERS UNTUK 1 DEPARTEMEN
// ===============================
async function fetchWorkOrdersForDepartment() {
    try {
        document.body.classList.add("loading");

        // Hanya filter berdasarkan ID Departemen, TANPA filter tanggal
        const url = `${API_BASE_URL}?id_dept=${DEPT_ID}`;
        
        console.log('Fetching data for department:', DEPT_ID);
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Server Error");

        const result = await response.json();

        console.log("API Response for", DEPT_ID, ":", result);
        console.log("Total data:", result.data?.length || 0);

        document.body.classList.remove("loading");
        
        return (result?.status === "success" && Array.isArray(result?.data))
            ? result.data
            : [];

    } catch (error) {
        document.body.classList.remove("loading");
        console.error("API Error:", error);
        showError("Gagal terhubung ke server");
        return [];
    }
}

// ===============================
// 🚀 INIT APP
// ===============================
async function initApp() {
    console.log("Initializing app for department:", DEPT_ID);
    
    const data = await fetchWorkOrdersForDepartment();
    
    window.state.workOrders = data || [];
    window.state.lastWOCount = window.state.workOrders.length;

    console.log(`Total ${window.state.workOrders.length} work orders loaded for ${DEPT_ID}`);

    // Update UI
    updateNotifications();
    updateDate();
    setupEventListeners();
    highlightActiveMenu();
    initSidebar();
    initDateTime();

    // Set interval untuk refresh (optional)
    setInterval(checkNewWorkOrders, 30000);
}

// ===============================
// 🔄 CEK WORK ORDER BARU
// ===============================
async function checkNewWorkOrders() {
    const newData = await fetchWorkOrdersForDepartment();

    if (newData.length > window.state.lastWOCount) {
        // Ada work order baru
        const newWO = newData[0];
        
        window.state.notifications.unshift({
            id: Date.now(),
            title: "Work Order Baru",
            message: `${newWO.id_wo} - ${newWO.job_name || 'No Title'}`,
            time: "Baru saja",
            read: false,
            icon: "📋"
        });

        playNotificationSound();
        animateNotificationBell();
    }

    window.state.lastWOCount = newData.length;
    window.state.workOrders = newData;
    updateNotifications();
}

// ===============================
// 🔔 NOTIFICATIONS
// ===============================
function updateNotifications() {
    const badge = document.getElementById('notifCount') || document.getElementById('notificationBadge');
    if (badge) {
        const unreadCount = window.state.notifications.filter(n => !n.read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? "inline-block" : "none";
    }
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
    const notificationIcon = document.getElementById('notificationIcon') || document.getElementById('notificationBell');
    const notificationsPanel = document.getElementById('notificationsPanel');
    
    if (notificationIcon && notificationsPanel) {
        notificationIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            notificationsPanel.classList.toggle("active");
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
// 🔊 SOUND & ANIMATION
// ===============================
function playNotificationSound() {
    const audio = document.getElementById("notificationSound");
    if (!audio) return;
    
    const soundEnabled = localStorage.getItem("wo_sound_enabled") !== "false";
    if (!soundEnabled) return;
    
    audio.volume = (localStorage.getItem("wo_volume") || 80) / 100;
    audio.currentTime = 0;
    audio.play().catch(() => {});
}

function animateNotificationBell() {
    const bell = document.getElementById("notificationBell") || document.getElementById("notificationIcon");
    if (!bell) return;

    bell.classList.add("shake");
    setTimeout(() => bell.classList.remove("shake"), 1000);
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
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return dateString;
    }
}

function showError(message) {
    console.error(message);
    // Bisa ditambahkan toast notification
}

// ===============================
// 🚀 START APP
// ===============================
document.addEventListener('DOMContentLoaded', initApp);

// Expose functions globally
window.fetchWorkOrdersForDepartment = fetchWorkOrdersForDepartment;
window.formatDate = formatDate;