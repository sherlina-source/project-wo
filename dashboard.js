/******************** GLOBAL STATE ******************/
const state = {
  workOrders: [],
  selectedDate: null
};

/********************** API CONFIG ******************/
const url = "https://stagingservicewo.salokapark.app/api/get_wo_request?id_dept=DP011&date_request=2024-10-21";
const BASE_API = 'https://stagingservicewo.salokapark.app/api/get_wo_request';
const ID_DEPT = 'DP011';
console.log("URL:", url);

/******************** AUTO REFRESH ******************/
const AUTO_REFRESH_INTERVAL = 30000; // 30 detik
let autoRefreshTimer = null;

/************************ INIT *********************/
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  startAutoRefresh();

  const filterDate = document.getElementById('filterDate');
  if (filterDate) {
    filterDate.addEventListener('change', function () {
      state.selectedDate = this.value;
      loadWorkOrdersFromAPI(state.selectedDate);
    });
  }
});

function initDashboard() {
  loadWorkOrdersFromAPI();
}

/******************** AUTO REFRESH *****************/
function startAutoRefresh() {
  stopAutoRefresh();
  autoRefreshTimer = setInterval(() => {
    loadWorkOrdersFromAPI(state.selectedDate);
  }, AUTO_REFRESH_INTERVAL);
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

/******************** FETCH DATA *******************/
function loadWorkOrdersFromAPI(date = null) {
  let url = `${BASE_API}?id_dept=${ID_DEPT}`;
  if (date) url += `&date_request=${date}`;

  fetch(url)
    .then(res => res.json())
    .then(result => {
      state.workOrders = result.status === 'success'
        ? (result.data || [])
        : [];

      updateDashboard();
    })
    .catch(err => {
      console.error('API Error:', err);
    });
}

async function fetchWorkOrders(date = null) {

  let url = "https://stagingservicewo.salokapark.app/api/get_wo_request?id_dept=DP011";

  if (date) {
      url += "&date_request=" + date;
  }

  try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("API gagal");

      const result = await response.json();
      return result.data || [];
  } catch (error) {
      console.error("Error API:", error);
      return [];
  }
}


/**************** DASHBOARD CONTROLLER *************/
function updateDashboard() {
  console.log('WO Data:', state.workOrders);

  loadStats();
  loadCharts();
  loadRecentWorkOrders();
  renderWorkOrders(state.workOrders);
  showTrendIndicator();
}

/********************* STATS ***********************/
function loadStats() {
  const total = state.workOrders.length;
  const pending = state.workOrders.filter(wo => wo.status == 1).length;
  const progress = state.workOrders.filter(wo => wo.status == 2).length;
  const completed = state.workOrders.filter(wo => wo.status == 3).length;

  setText('totalWO', total);
  setText('pendingWO', pending);
  setText('inProgressWO', progress);
  setText('completedWO', completed);
}

/********************* CHARTS **********************/
let woTrendChartInstance = null;
let priorityChartInstance = null;

function loadCharts() {
  loadWOTrendChart();
  loadPriorityChart();
}

/************* WO TREND CHART **********************/
function loadWOTrendChart() {
  const ctx = document.getElementById('woChart');
  if (!ctx) return;

  const grouped = groupByDate(state.workOrders);
  const labels = Object.keys(grouped).sort();
  const values = labels.map(date => grouped[date]);

  if (woTrendChartInstance) {
    woTrendChartInstance.destroy();
  }

  if (labels.length === 0) return;

  woTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Work Order',
        data: values,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.15)',
        tension: 0.4,
        fill: true,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
}

/************* PRIORITY CHART **********************/
function loadPriorityChart() {
  const ctx = document.getElementById('priorityChart');
  if (!ctx) return;

  const high = state.workOrders.filter(wo => wo.priority == 1).length;
  const medium = state.workOrders.filter(wo => wo.priority == 2).length;
  const low = state.workOrders.filter(wo => wo.priority == 3).length;

  if (priorityChartInstance) {
    priorityChartInstance.destroy();
  }

  priorityChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['High', 'Medium', 'Low'],
      datasets: [{
        data: [high, medium, low],
        backgroundColor: ['#ef4444', '#f59e0b', '#22c55e']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

/**************** RECENT WORK ORDERS ***************/
function loadRecentWorkOrders() {
  const tbody = document.getElementById('recentWOList');
  if (!tbody) return;

  const recent = state.workOrders.slice(0, 7);

  tbody.innerHTML = recent.map(wo => `
    <tr>
      <td>${wo.id_wo || "-"}</td>
      <td>${wo.job_name || "-"}</td>
      <td>${wo.department || "-"}</td>
      <td>${wo.requestor || "-"}</td>
      <td>${formatDate(wo.date_request)}</td>
      <td>${getPriorityText(wo.priority)}</td>
      <td>${getStatusText(wo.status)}</td>
    </tr>
  `).join('');
}

/********************* TABLE ***********************/
function renderWorkOrders(data) {
  const tbody = document.getElementById('woTableBody');
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center">
          Tidak ada Work Order
        </td>
      </tr>`;
    return;
  }
  
  tbody.innerHTML = data.map(wo => `
<tr>
  <td>${wo.id_wo || "-"}</td>
  <td>${wo.job_name || "-"}</td>
  <td>${wo.department || "-"}</td>
  <td>${wo.requestor || "-"}</td>
  <td>${formatDate(wo.date_request)}</td>
  <td>${getPriorityText(wo.priority)}</td>
  <td>${getStatusText(wo.status)}</td>
</tr>
`).join('');


}

/**************** TREND INDICATOR ******************/
function showTrendIndicator() {
  const el = document.getElementById('woTrend');
  if (!el) return;

  const grouped = groupByDate(state.workOrders);
  const values = Object.keys(grouped).sort().map(d => grouped[d]);

  if (values.length < 2) {
    el.textContent = '';
    return;
  }

  const last = values[values.length - 1];
  const prev = values[values.length - 2];

  if (last > prev) {
    el.textContent = '🔼 Trend Naik';
    el.className = 'trend-up';
  } else if (last < prev) {
    el.textContent = '🔽 Trend Turun';
    el.className = 'trend-down';
  } else {
    el.textContent = '⏸ Stabil';
    el.className = '';
  }
}

/********************* HELPERS *********************/
function groupByDate(data) {
  const map = {};

  data.forEach(wo => {
    if (!wo.date_request) return;
    const date = wo.date_request.split(' ')[0];

    map[date] = (map[date] || 0) + 1;
  });

  return map;
}

function formatDate(date) {
  if (!date) return '-';

  const parsed = new Date(date.replace(' ', 'T'));
  if (isNaN(parsed)) return date;

  return parsed.toLocaleDateString('id-ID');
}

function getStatusText(status) {
  return status == 1 ? 'Pending'
       : status == 2 ? 'In Progress'
       : status == 3 ? 'Completed'
       : '-';
}

function getPriorityText(priority) {
  return priority == 1 ? 'High'
       : priority == 2 ? 'Medium'
       : priority == 3 ? 'Low'
       : '-';
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
