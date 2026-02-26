// API Data
const apiResponse = {
    status: "success",
    message: "Get Data Work Order Successfuly",
    data: [
        {
            id: 34,
            id_wo: "WO-DP005-241021-000007",
            years: "2024",
            date_request: "2024-10-21 12:56:08",
            id_dept: "DP011",
            departemen: "IT",
            id_sub_dept: "DS059",
            sub_departemen: "Aplikasi & System",
            id_karyawan: "02-0422-066",
            name_request: "Istaslama Meylana Sukma",
            id_dept_request: "DP005",
            departemen_request: "INPARK REVENUE",
            id_sub_dept_request: "DS068",
            sub_departemen_request: "Inpark Revenue Operational",
            job_image: "https://servicewo.salokapark.app/storage/work_order_master/",
            job_name: "Pemasangan ssd",
            job_description: "Pemasangan ssd",
            work_location: "Pesisir-Office Lama-Ruang IT",
            asset: "trial",
            description_of_image: null,
            description_of_work_order: null,
            description_of_pic_id: null,
            description_of_pic_name: null,
            work_started: null,
            work_completed: null,
            priority: 1,
            priority_others: "",
            track_status: 2,
            status: 1,
            expied: null,
            created_at: "2024-10-21 12:56:08",
            updated_at: "2024-10-22 14:13:29"
        },
        // Data tambahan untuk demo
        {
            id: 35,
            id_wo: "WO-DP005-241021-000008",
            years: "2024",
            date_request: "2024-10-22 09:30:00",
            id_dept: "DP012",
            departemen: "HRD",
            id_sub_dept: "DS060",
            sub_departemen: "Recruitment",
            id_karyawan: "02-0422-067",
            name_request: "Budi Santoso",
            id_dept_request: "DP005",
            departemen_request: "INPARK REVENUE",
            id_sub_dept_request: "DS068",
            sub_departemen_request: "Inpark Revenue Operational",
            job_image: "https://servicewo.salokapark.app/storage/work_order_master/",
            job_name: "Instalasi Software HR",
            job_description: "Instalasi software HRIS",
            work_location: "Gedung A - Lantai 3",
            asset: "Server HR",
            description_of_image: null,
            description_of_work_order: null,
            description_of_pic_id: "PIC001",
            description_of_pic_name: "Ahmad Rizal",
            work_started: "2024-10-22 10:00:00",
            work_completed: null,
            priority: 2,
            priority_others: "",
            track_status: 3,
            status: 2,
            expied: null,
            created_at: "2024-10-22 09:30:00",
            updated_at: "2024-10-22 10:00:00"
        }
    ]
};

// State Management
const state = {
    workOrders: apiResponse.data,
    soundEnabled: true,
    volume: 80,
    notifications: [
        {
            id: 1,
            title: "Work Order Baru",
            message: "Pemasangan SSD - Priority High",
            time: "2 menit yang lalu",
            read: false,
            icon: "📋",
            type: "new"
        },
        {
            id: 2,
            title: "Status Diperbarui",
            message: "WO-DP005-241021-000007 - In Progress",
            time: "15 menit yang lalu",
            read: false,
            icon: "🔄",
            type: "update"
        },
        {
            id: 3,
            title: "Deadline Mendekat",
            message: "WO akan jatuh tempo dalam 2 jam",
            time: "1 jam yang lalu",
            read: false,
            icon: "⏰",
            type: "deadline"
        }
    ],
    currentPage: window.location.pathname.split('/').pop() || 'index.html'
};

// DOM Elements
const elements = {
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    notifCount: document.getElementById('notifCount'),
    sidebarNotif: document.getElementById('sidebarNotif'),
    notificationsPanel: document.getElementById('notificationsPanel'),
    notificationIcon: document.getElementById('notificationIcon'),
    notificationsList: document.getElementById('notificationsList'),
    markAllRead: document.getElementById('markAllRead'),
    soundToggle: document.getElementById('soundToggle'),
    volumeSlider: document.getElementById('volumeSlider'),
    notificationSound: document.getElementById('notificationSound'),
    currentDate: document.getElementById('currentDate'),
    searchInput: document.getElementById('searchInput')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    loadPageContent();
});

function initApp() {
    updateUserInfo();
    updateNotifications();
    updateDate();
    setupEventListeners();
    highlightActiveMenu();
    
    // Update date every minute
    setInterval(updateDate, 60000);
    
    // Simulate random notifications every 30 seconds
    setInterval(addRandomNotification, 30000);
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

function updateDate() {
    if (elements.currentDate) {
        const now = new Date();
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        elements.currentDate.textContent = now.toLocaleDateString('id-ID', options);
    }
}

function updateNotifications() {
    if (!elements.notifCount || !elements.sidebarNotif) return;
    
    const unreadCount = state.notifications.filter(n => !n.read).length;
    elements.notifCount.textContent = unreadCount;
    elements.sidebarNotif.textContent = unreadCount;
    
    if (elements.notificationsList) {
        elements.notificationsList.innerHTML = state.notifications.map(notif => `
            <div class="notif-item ${!notif.read ? 'unread' : ''}" onclick="markNotificationRead(${notif.id})">
                <div class="notif-icon">${notif.icon}</div>
                <div class="notif-content">
                    <div class="notif-title">${notif.title}</div>
                    <div class="notif-message">${notif.message}</div>
                    <div class="notif-time">${notif.time}</div>
                </div>
            </div>
        `).join('');
    }
}

window.markNotificationRead = function(id) {
    state.notifications = state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
    );
    updateNotifications();
};

function addRandomNotification() {
    const notifications = [
        {
            title: "Update Status",
            message: "Pekerjaan sedang dalam proses",
            icon: "🔄",
            type: "update"
        },
        {
            title: "Komentar Baru",
            message: "PIC menambahkan catatan",
            icon: "💬",
            type: "comment"
        },
        {
            title: "Reminder",
            message: "Deadline dalam 2 jam",
            icon: "⏰",
            type: "deadline"
        },
        {
            title: "Work Order Selesai",
            message: "Pekerjaan telah completed",
            icon: "✅",
            type: "completed"
        }
    ];
    
    const random = notifications[Math.floor(Math.random() * notifications.length)];
    
    const newNotif = {
        id: Date.now(),
        title: random.title,
        message: random.message,
        time: "Baru saja",
        read: false,
        icon: random.icon,
        type: random.type
    };
    
    state.notifications.unshift(newNotif);
    if (state.notifications.length > 10) {
        state.notifications.pop();
    }
    
    updateNotifications();
    
    // Play sound if enabled
    if (state.soundEnabled) {
        playNotificationSound();
    }
    

    // Animate bell
    animateNotificationBell();
}

function playNotificationSound() {
    if (elements.notificationSound && state.soundEnabled) {
        elements.notificationSound.volume = state.volume / 100;
        elements.notificationSound.currentTime = 0;
        elements.notificationSound.play().catch(e => console.log('Audio error:', e));
    }
}

function animateNotificationBell() {
    if (elements.notificationIcon) {
        elements.notificationIcon.style.transform = 'scale(1.2)';
        setTimeout(() => {
            elements.notificationIcon.style.transform = 'scale(1)';
        }, 200);
    }
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

function highlightActiveMenu() {
    const currentPage = state.currentPage;
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage || 
            (currentPage === 'index.html' && href === '#')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
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

  const dateInput = document.getElementById('dateInput');
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

// ===============// PLAY NOTIFICATION SOUND // ===============
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