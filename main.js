// ===============================
// 🌍 CONFIG API
// ===============================
const API_BASE_URL = "https://stagingservicewo.salokapark.app/api/get_wo_request";
const DEPT_ID = "DP011";
const REFRESH_INTERVAL = 30000; // 30 detik
// ===============================
// 📦 STATE GLOBAL
// ===============================
const state = {
    workOrders: [],
    notifications: [],
    knownWOIds: [],
    lastWOCount: 0,
    currentPage: window.location.pathname.split("/").pop() || "index.html"
};

// ===============================
// 📌 ELEMENT REFERENCES
// ===============================
const mainElements = {
    userName: document.getElementById('userName'),
    userAvatar: document.getElementById('userAvatar'),
    userRole: document.getElementById('userRole'),
    soundToggle: document.getElementById('soundToggle'),
    volumeSlider: document.getElementById('volumeSlider'),
    notificationIcon: document.getElementById('notificationBell'),
    notificationsPanel: document.getElementById('notificationsPanel'),
    markAllRead: document.getElementById('markAllRead'),
    searchInput: document.getElementById('searchInput')
};

// ===============================
// 📡 FETCH WORK ORDER FROM API
// ===============================
async function fetchWorkOrders(date = null) {
    try {
        document.body.classList.add("loading");

        let url = `${API_BASE_URL}?id_dept=${DEPT_ID}`;
        if (date) url += `&date_request=${date}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Server Error");

        const result = await response.json();

        // DEBUG DATA API
        console.log("DATA API:", result);
        console.log("DATA WO:", result.data);

        document.body.classList.remove("loading");
        const data = (result?.status === "success" && Array.isArray(result?.data))
        ? result.data
        : [];

        // Simpan global (opsional untuk debug)
        window.allWorkOrders = data;

        return data;

    } catch (error) {
        document.body.classList.remove("loading");
        console.error("API Error:", error);
        showError("Gagal terhubung ke server");
        return [];
    }
}

// expose ke global jika file lain butuh
window.fetchWorkOrders = fetchWorkOrders;


// ===============================
// 🚀 INIT APP
// ===============================
async function initApp() {

    const today = new Date().toISOString().split("T")[0];
    let data = await fetchWorkOrders(today);

    // jika data kosong, ambil semua WO
    if (!data || data.length === 0) {
        console.log("Data hari ini kosong, mengambil semua data...");
        data = await fetchWorkOrders();
    }

    state.workOrders = data || [];
    state.lastWOCount = state.workOrders.length;

    updateUserInfo();
    generateNotificationsFromWO(state.workOrders);
    updateNotifications();
    updateDate();
    setupEventListeners();
    highlightActiveMenu();
    initSidebar();
    initDateTime();

    setInterval(checkNewWorkOrders, 30000);
}

// ===============================
// 👤 USER INFO
// ===============================
function updateUserInfo() {
    if (!mainElements.userName || state.workOrders.length === 0) return;

    const user = state.workOrders[0];
    if (!user.name_request) return;

    const initials = user.name_request
        .split(" ")
        .map(n => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    if (mainElements.userAvatar)
        mainElements.userAvatar.textContent = initials;

    mainElements.userName.textContent = user.name_request;
    if (mainElements.userRole)
        mainElements.userRole.textContent =
            `${user.departemen || ""} - ${user.sub_departemen || ""}`;
}

// ===============================
// 🔄 CEK WORK ORDER BARU
// ===============================
async function checkNewWorkOrders() {
    const today = new Date().toISOString().split("T")[0];
    const newData = await fetchWorkOrders(today);

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
    loadPageContent();
}

// ===============================
// 🔔 NOTIFICATIONS
// ===============================
function generateNotificationsFromWO(workOrders) {
    state.notifications = workOrders.map(wo => ({
        id: wo.id || Date.now(),
        title: "Work Order",
        message: `${wo.id_wo} - ${wo.job_name}`,
        time: formatDate(wo.created_at),
        read: false,
        icon: "📋"
    }));
}

function updateNotifications() {
    const container = document.getElementById("notificationList");
    const badge = document.getElementById("notificationBadge");
    if (!container || !badge) return;

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
// 🔊 SOUND & ANIMATION
// ===============================
function playNotificationSound() {
    const audio = document.getElementById("notificationSound");
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
}

function animateNotificationBell() {
    const bell = document.getElementById("notificationBell");
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
    if (mainElements.notificationIcon) {
        mainElements.notificationIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            if (mainElements.notificationsPanel)
                mainElements.notificationsPanel.classList.toggle("active");
        });
    }

    document.addEventListener("click", (e) => {
        if (
            mainElements.notificationsPanel &&
            !mainElements.notificationsPanel.contains(e.target) &&
            !mainElements.notificationIcon?.contains(e.target)
        ) {
            mainElements.notificationsPanel.classList.remove("active");
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
    const links = document.querySelectorAll(".menu-link");
    links.forEach(link => {
        if (link.getAttribute("href") === state.currentPage)
            link.classList.add("active");
    });
}

// ===============================
// 📄 LOAD PAGE CONTENT
// ===============================
function loadPageContent() {
    switch (state.currentPage) {
        case "index.html":
        case "":
            if (typeof initDashboard === "function") initDashboard();
            break;
        case "work-orders.html":
            if (typeof initWorkOrders === "function") initWorkOrders();
            break;
        case "in-progress.html":
            if (typeof initInProgress === "function") initInProgress();
            break;
        case "completed.html":
            if (typeof initCompleted === "function") initCompleted();
            break;
    }
}

// ===============================
// 🛠 FORMAT HELPERS
// ===============================
function formatDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ===============================
// 📊 PRIORITY CLASS
// ===============================
function getPriorityClass(priority) {
    const classes = {
        1: "high",
        2: "medium",
        3: "low"
    };
    return classes[priority] || "low";
}

// ===============================
// 📌 STATUS TEXT
// ===============================
function getStatusText(status) {
    const map = {
        1: { text: "To Do" },
        2: { text: "In Progress" },
        3: { text: "Done" }
    };
    return map[status] || { text: "-" };
}

// ===============================
// ⏰ FORMAT TIME
// ===============================
function formatTime(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ===============================
// 🔎 SEARCH WORK ORDER
// ===============================
function searchWorkOrders(keyword) {

    if (!keyword) return state.workOrders;

    keyword = keyword.toLowerCase();

    return state.workOrders.filter(wo =>
        (wo.id_wo || "").toLowerCase().includes(keyword) ||
        (wo.job_name || "").toLowerCase().includes(keyword) ||
        (wo.departemen || "").toLowerCase().includes(keyword)
    );
}