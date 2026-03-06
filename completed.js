// ===============================
// INIT COMPLETED PAGE
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    const waitData = setInterval(() => {

        if (typeof state !== "undefined" && state.workOrders && state.workOrders.length > 0) {

            clearInterval(waitData);
            initCompleted();

        }

    }, 300);

});


// ===============================
// COMPLETED WORK ORDERS
// ===============================
function initCompleted() {
    loadSummaryStats();
    loadCompletedList();
    loadCompletionChart();
}

function loadSummaryStats() {

    if (!state.workOrders) return;

    const completed = state.workOrders.filter(wo => Number(wo.status) === 3);
    
    // Completed this month
    const thisMonth = new Date().getMonth();

    const completedThisMonth = completed.filter(wo => {

        const completedDate = new Date(wo.work_completed || wo.updated_at);
        return completedDate.getMonth() === thisMonth;

    }).length;
    
    const completedMonth = document.getElementById('completedMonth');
    if (completedMonth) completedMonth.textContent = completedThisMonth;
    
    // Average completion time
    const completionTimes = completed.map(wo => {

        const start = new Date(wo.date_request);
        const end = new Date(wo.work_completed || wo.updated_at);

        return (end - start) / (1000 * 60 * 60 * 24);

    });
    
    const avgTime = completionTimes.length > 0 
        ? (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length).toFixed(1)
        : 0;
    
    const avgTimeEl = document.getElementById('avgTime');
    if (avgTimeEl) avgTimeEl.textContent = `${avgTime} days`;
    
    // Satisfaction rate (demo)
    const satisfaction = document.getElementById('satisfaction');
    if (satisfaction) satisfaction.textContent = '96%';
}


// ===============================
// COMPLETED LIST
// ===============================
function loadCompletedList() {

    if (!state.workOrders) return;

    const completed = state.workOrders.filter(wo => Number(wo.status) === 3);
    const list = document.getElementById('completedItems');
    
    if (!list) return;
    
    list.innerHTML = completed.map(wo => `
        <div class="completed-item">
            <div class="completed-icon">✅</div>
            <div class="completed-details">
                <h4>${wo.job_name}</h4>
                <div class="completed-meta">
                    <span>${wo.id_wo}</span>
                    <span>${wo.departemen}</span>
                    <span>Completed: ${formatDate(wo.work_completed || wo.updated_at)}</span>
                </div>
            </div>
            <div class="completed-actions">
                <button class="action-btn" onclick="viewWO(${wo.id})">👁️</button>
                <button class="action-btn" onclick="exportWO(${wo.id})">📊</button>
            </div>
        </div>
    `).join('');
}


// ===============================
// COMPLETION CHART
// ===============================
function loadCompletionChart() {

    const ctx = document.getElementById('completionChart');
    if (!ctx || !state.workOrders) return;
    
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const completedData = new Array(12).fill(0);
    
    state.workOrders.forEach(wo => {

        if (Number(wo.status) === 3) {

            const month = new Date(wo.work_completed || wo.updated_at).getMonth();
            completedData[month]++;

        }

    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Completed Work Orders',
                data: completedData,
                backgroundColor: '#2ecc71',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            }
        }
    });

}


// ===============================
// EXPORT FUNCTION
// ===============================
window.exportWO = function(id) {

    const wo = state.workOrders.find(w => w.id === id);
    if (!wo) return;

    alert(`Exporting work order: ${wo.id_wo}`);

};