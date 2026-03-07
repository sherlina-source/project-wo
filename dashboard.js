/******************** GLOBAL STATE ******************/
window.state = window.state || { workOrders: [] };

/************************ INIT *********************/
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard DOM loaded');
    
    // Chart filter
    const woChartFilter = document.getElementById('woChartFilter');
    if (woChartFilter) {
        woChartFilter.addEventListener('change', function() {
            if (window.woChartInstance) {
                updateWOTrendChart(this.value);
            }
        });
    }

    // Load data untuk ID Departemen DP011 (tanpa filter tanggal)
    loadDataForDepartment();
});

/******************** FETCH DATA UNTUK 1 DEPARTEMEN *******************/
async function loadDataForDepartment() {
    console.log('Loading data for department DP011...');
    
    try {
        
        const url = 'https://stagingservicewo.salokapark.app/api/get_wo_request?id_dept=DP011';
        
        const response = await fetch(url);
        const result = await response.json();
        
        console.log('API Response for DP011:', result);
        console.log('Total data for DP011:', result.data?.length || 0);
        
        if (result.status === 'success' && Array.isArray(result.data)) {
            // Simpan ke state global
            window.state.workOrders = result.data;
            
            // Update dashboard
            updateDashboard();
            
            // Tampilkan informasi rentang tanggal data
            showDateRangeInfo(result.data);
        } else {
            console.error('API returned error:', result);
            showError('Gagal memuat data');
        }
    } catch (error) {
        console.error('API Error:', error);
        showError('Gagal terhubung ke server');
    }
}

// Fungsi untuk menampilkan info rentang tanggal data (opsional)
function showDateRangeInfo(data) {
    if (!data || data.length === 0) return;
    
    const dates = data.map(wo => wo.date_request || wo.created_at).filter(d => d);
    if (dates.length === 0) return;
    
    const sortedDates = [...dates].sort();
    const oldest = new Date(sortedDates[0].replace(' ', 'T'));
    const newest = new Date(sortedDates[sortedDates.length - 1].replace(' ', 'T'));
    
    console.log(`Data dari: ${oldest.toLocaleDateString('id-ID')} hingga ${newest.toLocaleDateString('id-ID')}`);
}

function showError(message) {
    console.error(message);
    // Bisa ditambahkan notifikasi ke user
}

/**************** DASHBOARD CONTROLLER *************/
function updateDashboard() {
    console.log('Updating dashboard with', state.workOrders.length, 'work orders for DP011');
    loadStats();
    loadCharts();
}

/********************* STATS ***********************/
function loadStats() {
    const total = state.workOrders.length;
    
    // Status: 1 = Pending, 2 = In Progress, 3 = Completed
    const pending = state.workOrders.filter(wo => Number(wo.status) === 1).length;
    const progress = state.workOrders.filter(wo => Number(wo.status) === 2).length;
    const completed = state.workOrders.filter(wo => Number(wo.status) === 3).length;

    console.log('Stats for DP011:', { total, pending, progress, completed });

    setText('totalWO', total);
    setText('pendingWO', pending);
    setText('inProgressWO', progress);
    setText('completedWO', completed);
    
    // Update trend indicators
    setText('progressTrend', `${progress} active`);
    setText('pendingTrend', `${pending} waiting`);
    
    if (total > 0) {
        const completedPercentage = Math.round((completed / total) * 100);
        setText('completedTrend', `${completedPercentage}%`);
    }
}

/********************* CHARTS **********************/
window.woChartInstance = null;
let priorityChartInstance = null;

function loadCharts() {
    console.log('Loading charts with', state.workOrders.length, 'data points for DP011');
    const filter = document.getElementById('woChartFilter')?.value || 'month';
    loadWOTrendChart(filter);
    loadPriorityChart();
}

/************* WO TREND CHART **********************/
function loadWOTrendChart(period = 'month') {
    const ctx = document.getElementById('woChart');
    if (!ctx) {
        console.error('Canvas woChart tidak ditemukan');
        return;
    }

    const chartData = prepareChartData(state.workOrders, period);
    console.log(`Chart data for DP011 (${period}):`, chartData);

    if (window.woChartInstance) {
        window.woChartInstance.destroy();
    }

    // Jika tidak ada data
    if (!state.workOrders || state.workOrders.length === 0) {
        window.woChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Tidak Ada Data'],
                datasets: [{
                    label: 'Work Order DP011',
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

    window.woChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Jumlah Work Order DP011',
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

function updateWOTrendChart(period) {
    if (window.woChartInstance) {
        const chartData = prepareChartData(state.workOrders, period);
        window.woChartInstance.data.labels = chartData.labels;
        window.woChartInstance.data.datasets[0].data = chartData.values;
        window.woChartInstance.update();
    }
}

/************* PRIORITY CHART **********************/
function loadPriorityChart() {
    const ctx = document.getElementById('priorityChart');
    if (!ctx) return;

    // Priority: 1 = High, 2 = Medium, 3 = Low
    const high = state.workOrders.filter(wo => Number(wo.priority) === 1).length;
    const medium = state.workOrders.filter(wo => Number(wo.priority) === 2).length;
    const low = state.workOrders.filter(wo => Number(wo.priority) === 3).length;

    if (priorityChartInstance) {
        priorityChartInstance.destroy();
    }

    if (high === 0 && medium === 0 && low === 0) {
        priorityChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Belum Ada Data Priority'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#ecf0f1']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
        return;
    }

    priorityChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                data: [high, medium, low],
                backgroundColor: ['#e74c3c', '#f39c12', '#2ecc71']
            }]
        },
        options: {
            responsive: true,
            plugins: { 
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = high + medium + low;
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/********************* PREPARE CHART DATA *********************/
function prepareChartData(data, period) {
    if (!data || data.length === 0) {
        return { labels: ['No Data'], values: [0] };
    }

    // Urutkan data berdasarkan tanggal
    const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.date_request || a.created_at || 0);
        const dateB = new Date(b.date_request || b.created_at || 0);
        return dateA - dateB;
    });

    if (period === 'week') {
        // Group by day of week untuk 7 hari terakhir
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const dayMap = {};
        days.forEach(day => dayMap[day] = 0);
        
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        
        sortedData.forEach(wo => {
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
        // Group by week of month
        const weeks = ['W1', 'W2', 'W3', 'W4', 'W5'];
        const weekMap = {};
        weeks.forEach(week => weekMap[week] = 0);
        
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        sortedData.forEach(wo => {
            const dateStr = wo.date_request || wo.created_at;
            if (!dateStr) return;
            
            const date = new Date(dateStr.replace(' ', 'T'));
            if (!isNaN(date) && date >= firstDayOfMonth && date <= now) {
                const weekNum = Math.ceil(date.getDate() / 7);
                weekMap[`W${weekNum}`] = (weekMap[`W${weekNum}`] || 0) + 1;
            }
        });
        
        return {
            labels: weeks,
            values: weeks.map(week => weekMap[week] || 0)
        };
    }
    else {
        // Group by month
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const monthMap = {};
        months.forEach(month => monthMap[month] = 0);
        
        const thisYear = new Date().getFullYear();
        
        sortedData.forEach(wo => {
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

/********************* HELPER *********************/
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}