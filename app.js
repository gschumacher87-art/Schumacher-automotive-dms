// ===============================
// SCHUMACHER AUTOMOTIVE DMS
// CLEAN CALENDAR CONTROLLER
// ===============================

let currentDate = new Date();
let selectedDate = null;

// ---------- SECTION CONTROL ----------
function openDashboard() {
    hideAll();
    document.getElementById("dashboardSection").style.display = "block";
}

function openCustomers() {
    hideAll();
    document.getElementById("customersSection").style.display = "block";
}

function openJobs() {
    hideAll();
    document.getElementById("jobsSection").style.display = "block";
}

function openCalendar() {
    hideAll();
    document.getElementById("calendarWrapper").style.display = "block";
    renderMonth();
}

function closeCalendar() {
    openDashboard();
}

function hideAll() {
    document.getElementById("dashboardSection").style.display = "none";
    document.getElementById("customersSection").style.display = "none";
    document.getElementById("jobsSection").style.display = "none";
    document.getElementById("calendarWrapper").style.display = "none";
}

// ---------- YEAR CONTROL ----------
function changeYear(direction) {
    currentDate.setFullYear(currentDate.getFullYear() + direction);
    renderMonth();
}

// ---------- MONTH RENDER ----------
function renderMonth() {
    const grid = document.getElementById("calendarGrid");
    const yearDisplay = document.getElementById("yearDisplay");
    const dayPanel = document.getElementById("dayPanel");

    grid.innerHTML = "";
    dayPanel.style.display = "none";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    yearDisplay.innerText = year;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    for (let i = 0; i < startDay; i++) {
        const empty = document.createElement("div");
        empty.className = "day empty";
        grid.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement("div");
        cell.className = "day";
        cell.innerText = day;

        cell.onclick = () => openDay(year, month, day);

        grid.appendChild(cell);
    }
}

// ---------- DAY VIEW ----------
function openDay(year, month, day) {
    selectedDate = new Date(year, month, day);

    const dayPanel = document.getElementById("dayPanel");
    const dayTitle = document.getElementById("dayTitle");

    dayTitle.innerText = selectedDate.toDateString();

    dayPanel.style.display = "block";
}

function backToMonth() {
    document.getElementById("dayPanel").style.display = "none";
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
    openDashboard();
});
