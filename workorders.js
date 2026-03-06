
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

// Load work order detail
document.addEventListener("DOMContentLoaded", function () {
    loadDetail();
});

function loadDetail() {

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        alert("ID tidak ditemukan di URL");
        return;
    }

    // 🔥 HAPUS filter tanggal agar semua data bisa dicari
    const apiUrl = "https://stagingservicewo.salokapark.app/api/get_wo_request?id_dept=DP011";

    fetch(apiUrl)
        .then(res => res.json())
        .then(result => {

            if (result.status !== "success") {
                alert("Gagal ambil data");
                return;
            }

            const wo = result.data.find(item => item.id == id);

            if (!wo) {
                alert("Data tidak ditemukan");
                return;
            }

            displayDetail(wo);
        })
        .catch(err => {
            console.error(err);
            alert("Error fetch API");
        });
}

function displayDetail(wo) {

    // HEADER
    document.getElementById("woId").textContent = wo.id_wo ?? "-";
    document.getElementById("createdAt").textContent = formatDateTime(wo.created_at);
    document.getElementById("updatedAt").textContent = formatDateTime(wo.updated_at);

    // INFORMASI PEKERJAAN
    document.getElementById("jobName").textContent = wo.job_name ?? "-";
    document.getElementById("workLocation").textContent = wo.work_location ?? "-";
    document.getElementById("asset").textContent = wo.asset ?? "-";
    document.getElementById("years").textContent = wo.years ?? "-";
    document.getElementById("priority").textContent = getPriorityText(wo.priority);

    // DEPARTMENT
    document.getElementById("idDept").textContent = wo.id_dept ?? "-";
    document.getElementById("department").textContent = wo.departemen ?? "-";
    document.getElementById("idSubDept").textContent = wo.id_sub_dept ?? "-";
    document.getElementById("subDepartment").textContent = wo.sub_departemen ?? "-";

    document.getElementById("idDeptRequest").textContent = wo.id_dept_request ?? "-";
    document.getElementById("deptRequest").textContent = wo.departemen_request ?? "-";
    document.getElementById("idSubDeptRequest").textContent = wo.id_sub_dept_request ?? "-";
    document.getElementById("subDeptRequest").textContent = wo.sub_departemen_request ?? "-";

    // TIMELINE
    setTimelineValue("dateRequest", wo.date_request);
    setTimelineValue("workStarted", wo.work_started);
    setTimelineValue("workCompleted", wo.work_completed);
    setTimelineValue("expired", wo.expired);

    // REQUESTOR
    document.getElementById("requestorName").textContent = wo.name_request ?? "-";
    document.getElementById("requestorId").textContent = wo.id_karyawan ?? "-";
    document.getElementById("requestorAvatar").textContent = generateInitials(wo.name_request);

    // PIC
    setPicValue("picId", wo.description_of_pic_id);
    setPicValue("picName", wo.description_of_pic_name);

    // IMAGE
    const imgElement = document.getElementById("jobImage");
    if (wo.job_image) {
        imgElement.innerHTML = `<img src="${wo.job_image}" width="200">`;
    } else {
        imgElement.textContent = "-";
    }

    // DESKRIPSI
    setDescriptionBox("descImage", wo.description_of_image);
    setDescriptionBox("descWO", wo.description_of_work_order);
}

// ================= HELPER FUNCTIONS =================
function formatDateTime(date) {
    if (!date) return "-";

    try {
        const formatted = date.replace(" ", "T");
        const d = new Date(formatted);

        if (isNaN(d)) return "-";

        return d.toLocaleString("id-ID");
    } catch (err) {
        return "-";
    }
}

function getStatusText(status) {
    const map = {
        1: "Open",
        2: "In Progress",
        3: "Completed",
        4: "Cancelled"
    };

    return map[status] ?? "-";
}
function getPriorityText(priority) {
    const map = {
        1: "1 (High Priority)",
        2: "2 (Medium Priority)",
        3: "3 (Low Priority)"
    };

    return map[priority] || "-";
}

function setTimelineValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return; 
    if (!value) {
        el.textContent = "-";
        el.classList.add("empty");
    } else {
        el.textContent = formatDateTime(value);
        el.classList.remove("empty");
    }
}


// Set PIC value
function setPicValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;

    if (!value) {
        el.textContent = "-";
        el.classList.add("empty");
    } else {
        el.textContent = value;
        el.classList.remove("empty");
    }
}

function setDescriptionBox(id, value) {
    const el = document.getElementById(id);
    if (!el) return;

    if (!value) {
        el.textContent = "-";
        el.classList.add("empty");
    } else {
        el.textContent = value;
        el.classList.remove("empty");
    }
}

function generateInitials(name) {
    if (!name) return "--";

    return name
        .trim()
        .split(/\s+/)
        .map(word => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
}