// Work Order Detail specific functionality
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
        }
    ]
};

// State management
let currentWorkOrder = null;

// DOM Elements
const elements = {
    // Loading & Error
    loading: document.getElementById('loading'),
    error: document.getElementById('errorMessage'),
    content: document.getElementById('detailContent'),
    
    // Basic Info
    woId: document.getElementById('woId'),
    createdDate: document.getElementById('createdDate'),
    updatedDate: document.getElementById('updatedDate'),
    statusText: document.getElementById('statusText'),
    statusBadge: document.getElementById('statusBadge'),
    priorityText: document.getElementById('priorityText'),
    priorityBadge: document.getElementById('priorityBadge'),
    trackStatus: document.getElementById('trackStatus'),
    trackSteps: document.getElementById('trackSteps'),
    
    // Job Information
    jobName: document.getElementById('jobName'),
    jobDescription: document.getElementById('jobDescription'),
    workLocation: document.getElementById('workLocation'),
    asset: document.getElementById('asset'),
    years: document.getElementById('years'),
    priorityValue: document.getElementById('priorityValue'),
    
    // Timeline
    requestDate: document.getElementById('requestDate'),
    workStarted: document.getElementById('workStarted'),
    workCompleted: document.getElementById('workCompleted'),
    expired: document.getElementById('expired'),
    
    // Department Info
    idDept: document.getElementById('idDept'),
    departemen: document.getElementById('departemen'),
    idSubDept: document.getElementById('idSubDept'),
    subDepartemen: document.getElementById('subDepartemen'),
    idDeptRequest: document.getElementById('idDeptRequest'),
    departemenRequest: document.getElementById('departemenRequest'),
    idSubDeptRequest: document.getElementById('idSubDeptRequest'),
    subDepartemenRequest: document.getElementById('subDepartemenRequest'),
    
    // Requestor Info
    requestorInitials: document.getElementById('requestorInitials'),
    nameRequest: document.getElementById('nameRequest'),
    idKaryawan: document.getElementById('idKaryawan'),
    
    // PIC Info
    picId: document.getElementById('picId'),
    picName: document.getElementById('picName'),
    
    // Image Info
    jobImage: document.getElementById('jobImage'),
    descImage: document.getElementById('descImage'),
    descWO: document.getElementById('descWO'),
    
    // Buttons
    editBtn: document.getElementById('editBtn'),
    assignBtn: document.getElementById('assignBtn'),
    completeBtn: document.getElementById('completeBtn')
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadWorkOrderDetail();
    setupEventListeners();
});

// Load work order detail
function loadWorkOrderDetail() {
    // Get work order ID from URL (you can modify this to get from query parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const woId = urlParams.get('id') || 34; // Default to ID 34 if no parameter
    
    try {
        // Find work order by ID
        currentWorkOrder = apiResponse.data.find(wo => wo.id == woId) || apiResponse.data[0];
        
        if (currentWorkOrder) {
            displayWorkOrderDetail(currentWorkOrder);
            hideLoading();
        } else {
            showError('Work order tidak ditemukan');
        }
    } catch (error) {
        console.error('Error loading work order:', error);
        showError('Gagal memuat data work order');
    }
}

// Display work order detail
function displayWorkOrderDetail(wo) {
    // Basic Info
    elements.woId.textContent = wo.id_wo;
    elements.createdDate.textContent = formatDate(wo.created_at);
    elements.updatedDate.textContent = formatDate(wo.updated_at);
    
    // Status
    const statusInfo = getStatusInfo(wo.status);
    elements.statusText.textContent = statusInfo.text;
    elements.statusBadge.className = `status-badge ${statusInfo.class}`;
    
    // Priority
    const priorityInfo = getPriorityInfo(wo.priority);
    elements.priorityText.textContent = priorityInfo.text;
    elements.priorityBadge.className = `priority-badge ${priorityInfo.class}`;
    
    // Track Status
    elements.trackStatus.textContent = `${wo.track_status || 0}/4`;
    updateTrackSteps(wo.track_status || 0);
    
    // Job Information
    elements.jobName.textContent = wo.job_name || '-';
    elements.jobDescription.textContent = wo.job_description || '-';
    elements.workLocation.textContent = wo.work_location || '-';
    elements.asset.textContent = wo.asset || '-';
    elements.years.textContent = wo.years || '-';
    
    const priorityDisplay = getPriorityDisplay(wo.priority);
    elements.priorityValue.textContent = priorityDisplay;
    elements.priorityValue.className = `priority-indicator ${priorityDisplay.toLowerCase().includes('high') ? 'high' : 
                                      priorityDisplay.toLowerCase().includes('medium') ? 'medium' : 'low'}`;
    
    // Timeline
    elements.requestDate.textContent = wo.date_request ? formatDate(wo.date_request) : '-';
    elements.workStarted.textContent = wo.work_started ? formatDate(wo.work_started) : '-';
    elements.workCompleted.textContent = wo.work_completed ? formatDate(wo.work_completed) : '-';
    elements.expired.textContent = wo.expied ? formatDate(wo.expied) : '-';
    
    // Department Info
    elements.idDept.textContent = wo.id_dept || '-';
    elements.departemen.textContent = wo.departemen || '-';
    elements.idSubDept.textContent = wo.id_sub_dept || '-';
    elements.subDepartemen.textContent = wo.sub_departemen || '-';
    elements.idDeptRequest.textContent = wo.id_dept_request || '-';
    elements.departemenRequest.textContent = wo.departemen_request || '-';
    elements.idSubDeptRequest.textContent = wo.id_sub_dept_request || '-';
    elements.subDepartemenRequest.textContent = wo.sub_departemen_request || '-';
    
    // Requestor Info
    const initials = wo.name_request ? 
        wo.name_request.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '--';
    elements.requestorInitials.textContent = initials;
    elements.nameRequest.textContent = wo.name_request || '-';
    elements.idKaryawan.textContent = wo.id_karyawan || '-';
    
    // PIC Info
    elements.picId.textContent = wo.description_of_pic_id || '-';
    elements.picName.textContent = wo.description_of_pic_name || '-';
    
    // Image Info
    elements.jobImage.textContent = wo.job_image || '-';
    elements.descImage.textContent = wo.description_of_image || '-';
    elements.descWO.textContent = wo.description_of_work_order || '-';
    
    // Update button states based on status
    updateButtonStates(wo.status);
}

// Update track steps
function updateTrackSteps(currentStep) {
    const steps = elements.trackSteps.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.classList.remove('completed', 'active');
        if (index + 1 < currentStep) {
            step.classList.add('completed');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
        }
    });
}

// Get status info
function getStatusInfo(status) {
    const statusMap = {
        1: { text: 'Pending', class: 'pending' },
        2: { text: 'In Progress', class: 'in-progress' },
        3: { text: 'Completed', class: 'completed' }
    };
    return statusMap[status] || { text: 'Unknown', class: 'pending' };
}

// Get priority info
function getPriorityInfo(priority) {
    const priorityMap = {
        1: { text: 'High Priority', class: 'high' },
        2: { text: 'Medium Priority', class: 'medium' },
        3: { text: 'Low Priority', class: 'low' }
    };
    return priorityMap[priority] || { text: 'Unknown', class: 'low' };
}

// Get priority display text
function getPriorityDisplay(priority) {
    const priorityMap = {
        1: '1 (High Priority)',
        2: '2 (Medium Priority)',
        3: '3 (Low Priority)'
    };
    return priorityMap[priority] || `${priority} (Unknown)`;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Update button states based on work order status
function updateButtonStates(status) {
    if (status === 3) { // Completed
        elements.completeBtn.disabled = true;
        elements.completeBtn.style.opacity = '0.5';
        elements.completeBtn.style.cursor = 'not-allowed';
    }
    
    if (currentWorkOrder?.description_of_pic_id) {
        elements.assignBtn.textContent = '👤 Change PIC';
    }
}

// Hide loading and show content
function hideLoading() {
    if (elements.loading) elements.loading.style.display = 'none';
    if (elements.error) elements.error.style.display = 'none';
    if (elements.content) elements.content.style.display = 'block';
}

// Show error message
function showError(message) {
    if (elements.loading) elements.loading.style.display = 'none';
    if (elements.content) elements.content.style.display = 'none';
    if (elements.error) {
        elements.error.style.display = 'block';
        document.getElementById('errorText').textContent = message;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Edit button
    if (elements.editBtn) {
        elements.editBtn.addEventListener('click', () => {
            if (currentWorkOrder) {
                editWorkOrder(currentWorkOrder);
            }
        });
    }
    
    // Assign button
    if (elements.assignBtn) {
        elements.assignBtn.addEventListener('click', () => {
            openAssignModal();
        });
    }
    
    // Complete button
    if (elements.completeBtn) {
        elements.completeBtn.addEventListener('click', () => {
            markAsComplete();
        });
    }
}

// Edit work order
function editWorkOrder(wo) {
    alert(`Edit work order: ${wo.id_wo}\nFitur edit akan segera tersedia.`);
}

// Open assign PIC modal
function openAssignModal() {
    const modal = document.getElementById('assignModal');
    if (modal) {
        modal.classList.add('active');
        
        // Pre-fill if PIC already assigned
        if (currentWorkOrder?.description_of_pic_id) {
            document.getElementById('picIdInput').value = currentWorkOrder.description_of_pic_id;
            document.getElementById('picNameInput').value = currentWorkOrder.description_of_pic_name || '';
        } else {
            document.getElementById('picIdInput').value = '';
            document.getElementById('picNameInput').value = '';
        }
    }
}

// Close assign modal
window.closeAssignModal = function() {
    const modal = document.getElementById('assignModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

// Assign PIC
window.assignPIC = function() {
    const picId = document.getElementById('picIdInput').value;
    const picName = document.getElementById('picNameInput').value;
    
    if (!picId || !picName) {
        alert('Harap isi ID PIC dan Nama PIC');
        return;
    }
    
    // Update work order
    if (currentWorkOrder) {
        currentWorkOrder.description_of_pic_id = picId;
        currentWorkOrder.description_of_pic_name = picName;
        currentWorkOrder.updated_at = new Date().toISOString();
        
        // Update display
        elements.picId.textContent = picId;
        elements.picName.textContent = picName;
        elements.assignBtn.textContent = '👤 Change PIC';
        
        // Close modal
        closeAssignModal();
        
        // Show success message
        alert('PIC berhasil diassign');
        
        // Add notification
        if (typeof addCustomNotification === 'function') {
            addCustomNotification(
                'PIC Assigned',
                `PIC ${picName} telah diassign ke work order ${currentWorkOrder.id_wo}`,
                '👤'
            );
        }
    }
};

// Mark as complete
function markAsComplete() {
    if (!currentWorkOrder) return;
    
    if (currentWorkOrder.status === 3) {
        alert('Work order sudah selesai');
        return;
    }
    
    if (confirm('Apakah Anda yakin ingin menandai work order ini sebagai selesai?')) {
        currentWorkOrder.status = 3;
        currentWorkOrder.work_completed = new Date().toISOString();
        currentWorkOrder.track_status = 4;
        currentWorkOrder.updated_at = new Date().toISOString();
        
        // Update display
        const statusInfo = getStatusInfo(3);
        elements.statusText.textContent = statusInfo.text;
        elements.statusBadge.className = `status-badge ${statusInfo.class}`;
        elements.workCompleted.textContent = formatDate(currentWorkOrder.work_completed);
        updateTrackSteps(4);
        
        // Disable complete button
        elements.completeBtn.disabled = true;
        elements.completeBtn.style.opacity = '0.5';
        elements.completeBtn.style.cursor = 'not-allowed';
        
        // Show success message
        alert('Work order telah ditandai sebagai selesai');
        
        // Add notification
        if (typeof addCustomNotification === 'function') {
            addCustomNotification(
                'Work Order Completed',
                `Work order ${currentWorkOrder.id_wo} telah selesai`,
                '✅'
            );
        }
    }
}

// Export function untuk digunakan di file lain
window.loadWorkOrderDetail = loadWorkOrderDetail;

