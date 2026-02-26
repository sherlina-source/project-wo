// In Progress functionality
function initInProgress() {
    loadKanbanBoard();
    loadTodaySchedule();
}

function loadKanbanBoard() {
    const workOrders = state.workOrders;
    
    const todoList = workOrders.filter(wo => wo.status === 1);
    const progressList = workOrders.filter(wo => wo.status === 2);
    const reviewList = workOrders.filter(wo => wo.track_status === 3 && wo.status === 2);
    const doneList = workOrders.filter(wo => wo.status === 3);
    
    // Update counts
    document.getElementById('todoCount').textContent = todoList.length;
    document.getElementById('progressCount').textContent = progressList.length;
    document.getElementById('reviewCount').textContent = reviewList.length;
    document.getElementById('doneCount').textContent = doneList.length;
    
    // Load Todo column
    loadKanbanColumn('todoList', todoList);
    loadKanbanColumn('progressList', progressList);
    loadKanbanColumn('reviewList', reviewList);
    loadKanbanColumn('doneList', doneList);
    
    // Make cards draggable
    makeCardsDraggable();
}

function loadKanbanColumn(elementId, workOrders) {
    const column = document.getElementById(elementId);
    if (!column) return;
    
    column.innerHTML = workOrders.map(wo => `
        <div class="kanban-card" draggable="true" data-id="${wo.id}" data-status="${wo.status}">
            <div class="card-header">
                <span class="card-id">${wo.id_wo}</span>
                <span class="card-priority ${getPriorityClass(wo.priority)}"></span>
            </div>
            <div class="card-title">${wo.job_name}</div>
            <div class="card-footer">
                <span class="card-assignee">
                    <span>👤</span> ${wo.description_of_pic_name || 'Unassigned'}
                </span>
                <span class="card-date">${formatDate(wo.date_request)}</span>
            </div>
        </div>
    `).join('');
}

function getPriorityClass(priority) {
    const classes = {
        1: 'high',
        2: 'medium',
        3: 'low'
    };
    return classes[priority] || 'low';
}

function makeCardsDraggable() {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.column-body');
    
    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });
    
    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const card = document.querySelector(`[data-id="${id}"]`);
    const newColumn = e.target.closest('.column-body');
    
    if (card && newColumn) {
        newColumn.appendChild(card);
        updateWorkOrderStatus(id, newColumn.id);
    }
}

function updateWorkOrderStatus(id, columnId) {
    const wo = state.workOrders.find(w => w.id == id);
    if (!wo) return;
    
    let newStatus;
    switch(columnId) {
        case 'todoList':
            newStatus = 1;
            break;
        case 'progressList':
            newStatus = 2;
            wo.work_started = new Date().toISOString();
            break;
        case 'reviewList':
            newStatus = 2;
            wo.track_status = 3;
            break;
        case 'doneList':
            newStatus = 3;
            wo.work_completed = new Date().toISOString();
            break;
    }
    
    if (newStatus) {
        wo.status = newStatus;
        wo.updated_at = new Date().toISOString();
        
        // Add notification
        addCustomNotification(
            'Status Updated',
            `Work order ${wo.id_wo} moved to ${getStatusText(newStatus).text}`,
            '🔄'
        );
    }
}

function loadTodaySchedule() {
    const todaySchedule = document.getElementById('todaySchedule');
    if (!todaySchedule) return;
    
    const today = new Date().toDateString();
    const todayWOs = state.workOrders.filter(wo => {
        const woDate = new Date(wo.date_request).toDateString();
        return woDate === today && wo.status !== 3;
    });
    
    todaySchedule.innerHTML = todayWOs.map(wo => `
        <div class="timeline-item">
            <div class="timeline-time">${formatTime(wo.date_request)}</div>
            <div class="timeline-content">
                <h4>${wo.job_name}</h4>
                <p>${wo.departemen} - ${wo.work_location}</p>
            </div>
        </div>
    `).join('');
}

function formatTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
}