// ===============================
// DASHBOARD PAGE - DENGAN FILTER CHART YANG BERFUNGSI
// ===============================

// Grouping Status sesuai requirement
const STATUS_GROUP = {
    pending: [0, 1],      // Draft dan Dept Request
    progress: [2, 3],     // Dept Recipient dan Execute
    completed: [4, 5]     // Checked Dept Recipient dan Checked Dept Request
};

// Priority mapping
const PRIORITY_MAP = {
    1: 'Urgent',
    2: 'Routine',
    3: 'Others'
};

// Chart instances
let woChartInstance = null;
let statusChartInstance = null;

document.addEventListener("DOMContentLoaded", function() {
    console.log("Dashboard page loaded");
    
    // Tunggu data dari main.js
    checkData();
    
    // Setup chart filter
    setupChartFilter();
});

function checkData() {
    if (typeof state !== "undefined" && state.workOrders && state.workOrders.length > 0) {
        console.log("Data ready, initializing dashboard...");
        initDashboard();
    } else {
        console.log("Waiting for data...");
        setTimeout(checkData, 500);
    }
}

function setupChartFilter() {
    const woChartFilter = document.getElementById('woChartFilter');
    if (woChartFilter) {
        woChartFilter.addEventListener('change', function(e) {
            const period = e.target.value;
            console.log('Chart filter changed to:', period);
            
            // Update chart dengan periode yang dipilih
            if (woChartInstance) {
                updateWOTrendChart(period);
            } else {
                // Jika chart belum dibuat, buat ulang
                loadWOTrendChart(period);
            }
        });
    }
}

function initDashboard() {
    console.log('Dashboard initialized with', state.workOrders.length, 'records');
    
    // Debug: tampilkan sample data pertama
    if (state.workOrders.length > 0) {
        console.log('Sample data track_status:', state.workOrders[0].track_status);
    }
    
    loadStats();
    loadCharts();
    loadPriorityStats();
}

// ===============================
// LOAD STATS
// ===============================
function loadStats() {
    const total = state.workOrders.length;
    
    const pending = state.workOrders.filter(wo => 
        STATUS_GROUP.pending.includes(Number(wo.track_status))
    ).length;
    
    const progress = state.workOrders.filter(wo => 
        STATUS_GROUP.progress.includes(Number(wo.track_status))
    ).length;
    
    const completed = state.workOrders.filter(wo => 
        STATUS_GROUP.completed.includes(Number(wo.track_status))
    ).length;

    console.log('Stats:', { total, pending, progress, completed });

    setText('totalWO', total);
    setText('pendingWO', pending);
    setText('inProgressWO', progress);
    setText('completedWO', completed);
}

// ===============================
// LOAD CHARTS
// ===============================
function loadCharts() {
    const filter = document.getElementById('woChartFilter')?.value || 'month';
    console.log('Loading charts with filter:', filter);
    
    loadWOTrendChart(filter);
    loadStatusChart();
    loadPriorityStats();
}

// ===============================
// WO TREND CHART
// ===============================
function loadWOTrendChart(period = 'month') {
    const ctx = document.getElementById('woChart');
    if (!ctx) {
        console.error('Canvas woChart tidak ditemukan');
        return;
    }

    const chartData = prepareChartData(state.workOrders, period);
    console.log(`Chart data for period ${period}:`, chartData);

    if (woChartInstance) {
        woChartInstance.destroy();
    }

    if (!state.workOrders || state.workOrders.length === 0) {
        woChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Tidak Ada Data'],
                datasets: [{
                    label: 'Work Order',
                    data: [0],
                    borderColor: '#95a5a6',
                    backgroundColor: 'rgba(149, 165, 166, 0.1)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
        return;
    }

    woChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Jumlah Work Order',
                data: chartData.values,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#27ae60',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Jumlah: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        precision: 0,
                        stepSize: 1
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// ===============================
// UPDATE WO TREND CHART (dipanggil saat filter berubah)
// ===============================
function updateWOTrendChart(period) {
    console.log('Updating chart with period:', period);
    
    if (!woChartInstance) {
        console.log('Chart instance not found, creating new one');
        loadWOTrendChart(period);
        return;
    }
    
    const chartData = prepareChartData(state.workOrders, period);
    console.log('New chart data:', chartData);
    
    woChartInstance.data.labels = chartData.labels;
    woChartInstance.data.datasets[0].data = chartData.values;
    woChartInstance.update();
}

// ===============================
// STATUS DISTRIBUTION CHART
// ===============================
function loadStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    const pending = state.workOrders.filter(wo => 
        STATUS_GROUP.pending.includes(Number(wo.track_status))
    ).length;
    
    const progress = state.workOrders.filter(wo => 
        STATUS_GROUP.progress.includes(Number(wo.track_status))
    ).length;
    
    const completed = state.workOrders.filter(wo => 
        STATUS_GROUP.completed.includes(Number(wo.track_status))
    ).length;

    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    if (pending === 0 && progress === 0 && completed === 0) {
        statusChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Belum Ada Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#ecf0f1']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'bottom' },
                    tooltip: { enabled: false }
                }
            }
        });
        return;
    }

    statusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pending (0-1)', 'In Progress (2-3)', 'Completed (4-5)'],
            datasets: [{
                data: [pending, progress, completed],
                backgroundColor: ['#e74c3c', '#f39c12', '#2ecc71'],
                borderWidth: 0,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 15,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return {
                                        text: `${label}: ${value} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = pending + progress + completed;
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// ===============================
// LOAD PRIORITY STATS
// ===============================
function loadPriorityStats() {
    const urgent = state.workOrders.filter(wo => Number(wo.priority) === 1).length;
    const routine = state.workOrders.filter(wo => Number(wo.priority) === 2).length;
    const others = state.workOrders.filter(wo => Number(wo.priority) === 3).length;

    setText('urgentCount', urgent);
    setText('routineCount', routine);
    setText('othersCount', others);
}

// ===============================
// PREPARE CHART DATA
// ===============================
function prepareChartData(data, period) {
    if (!data || data.length === 0) {
        return { labels: ['No Data'], values: [0] };
    }

    const now = new Date();
    
    if (period === 'week') {
        // Group by day of week (7 hari terakhir)
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const dayMap = {};
        days.forEach(day => dayMap[day] = 0);
        
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        
        data.forEach(wo => {
            const dateStr = wo.date_request || wo.created_at;
            if (!dateStr) return;
            
            const date = new Date(dateStr.replace(' ', 'T'));
            if (!isNaN(date) && date >= weekAgo) {
                const dayName = days[date.getDay()];
                dayMap[dayName] = (dayMap[dayName] || 0) + 1;
            }
        });
        
        return {
            labels: days,
            values: days.map(day => dayMap[day])
        };
    } 
    else if (period === 'month') {
        // Group by week of current month
        const weeks = ['W1', 'W2', 'W3', 'W4', 'W5'];
        const weekMap = {};
        weeks.forEach(week => weekMap[week] = 0);
        
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        data.forEach(wo => {
            const dateStr = wo.date_request || wo.created_at;
            if (!dateStr) return;
            
            const date = new Date(dateStr.replace(' ', 'T'));
            if (!isNaN(date) && date >= firstDayOfMonth && date <= lastDayOfMonth) {
                const weekNum = Math.ceil(date.getDate() / 7);
                weekMap[`W${weekNum}`] = (weekMap[`W${weekNum}`] || 0) + 1;
            }
        });
        
        return {
            labels: weeks,
            values: weeks.map(week => weekMap[week] || 0)
        };
    }
    else { // year
        // Group by month of current year
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const monthMap = {};
        months.forEach(month => monthMap[month] = 0);
        
        const thisYear = now.getFullYear();
        
        data.forEach(wo => {
            const dateStr = wo.date_request || wo.created_at;
            if (!dateStr) return;
            
            const date = new Date(dateStr.replace(' ', 'T'));
            if (!isNaN(date) && date.getFullYear() === thisYear) {
                const monthName = months[date.getMonth()];
                monthMap[monthName] = (monthMap[monthName] || 0) + 1;
            }
        });
        
        return {
            labels: months,
            values: months.map(month => monthMap[month] || 0)
        };
    }
}

// ===============================
// HELPER FUNCTIONS
// ===============================
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Expose function untuk debugging
window.updateChartPeriod = function(period) {
    updateWOTrendChart(period);
};