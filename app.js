/* =================================
   GLOBAL STATE
================================= */

let currentYear = new Date().getFullYear();
let selectedDateKey = null;
let currentMonthIndex = null;

let customers = JSON.parse(localStorage.getItem("workshopCustomers")) || [];
let jobTypes = JSON.parse(localStorage.getItem("workshopJobTypes")) || [];
let jobs = JSON.parse(localStorage.getItem("workshopJobs")) || {};

const MAX_BOOKINGS_PER_DAY = 10;

let calendarGrid;
let monthView;
let dayPanel;


/* =================================
   STORAGE
================================= */

function saveCustomers(){
    localStorage.setItem("workshopCustomers", JSON.stringify(customers));
}

function saveJobTypes(){
    localStorage.setItem("workshopJobTypes", JSON.stringify(jobTypes));
}

function saveJobs(){
    localStorage.setItem("workshopJobs", JSON.stringify(jobs));
}


/* =================================
   SECTION SWITCHING
================================= */

function showSection(sectionId){

    const sections = [
        "dashboardSection",
        "customersSection",
        "jobsSection",
        "calendarWrapper"
    ];

    sections.forEach(id=>{
        const el = document.getElementById(id);
        if(el){
            el.style.display = (id === sectionId) ? "block" : "none";
        }
    });
}

function openDashboard(){ showSection("dashboardSection"); }
function openCustomers(){ showSection("customersSection"); renderCustomers(); }
function openJobs(){ showSection("jobsSection"); renderJobTypes(); }
function openCalendar(){ showSection("calendarWrapper"); }


/* =================================
   CUSTOMER + VEHICLE STRUCTURE
================================= */

function addCustomer(){

    const name = prompt("Customer Name:");
    if(!name) return;

    const phone = prompt("Phone:");
    const email = prompt("Email:");

    customers.push({
        id: Date.now(),
        name,
        phone,
        email,
        vehicles: []
    });

    saveCustomers();
    renderCustomers();
}

function deleteCustomer(index){
    customers.splice(index,1);
    saveCustomers();
    renderCustomers();
}

function addVehicleToCustomer(customerId){

    const customer = customers.find(c => c.id === customerId);
    if(!customer) return;

    const rego = prompt("Rego:");
    if(!rego) return;

    const make = prompt("Make:");
    const model = prompt("Model:");
    const year = prompt("Year:");
    const notes = prompt("Notes:");

    customer.vehicles.push({
        id: Date.now(),
        rego,
        make,
        model,
        year,
        notes
    });

    saveCustomers();
    renderCustomers();
}

function renderCustomers(){

    const table = document.getElementById("customerTableBody");
    if(!table) return;

    table.innerHTML = "";

    customers.forEach((c,i)=>{

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${c.name}</td>
            <td>${c.phone || ""}</td>
            <td>${c.email || ""}</td>
            <td>${c.vehicles.length} vehicles</td>
            <td>
                <button onclick="addVehicleToCustomer(${c.id})">+ Vehicle</button>
                <button onclick="deleteCustomer(${i})">✕</button>
            </td>
        `;

        table.appendChild(row);
    });
}


/* =================================
   JOB TYPES
================================= */

function addJobType(){

    const name = prompt("Service Name:");
    if(!name) return;

    const description = prompt("Description:");
    const defaultHours = parseFloat(prompt("Default Labour Hours:")) || 0;

    let parts = [];

    while(true){
        const partName = prompt("Add Part Name (Cancel to stop):");
        if(!partName) break;

        const quantity = parseFloat(prompt("Quantity:")) || 1;

        parts.push({ partName, quantity });
    }

    jobTypes.push({
        id: Date.now(),
        name,
        description,
        defaultHours,
        parts
    });

    saveJobTypes();
    renderJobTypes();
}

function deleteJobType(index){
    jobTypes.splice(index,1);
    saveJobTypes();
    renderJobTypes();
}

function renderJobTypes(){

    const table = document.getElementById("jobTypesTableBody");
    if(!table) return;

    table.innerHTML = "";

    jobTypes.forEach((j,i)=>{

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${j.name}</td>
            <td>${j.description || ""}</td>
            <td>${j.defaultHours || 0} hrs</td>
            <td>${j.parts.length} parts</td>
            <td><button onclick="deleteJobType(${i})">✕</button></td>
        `;

        table.appendChild(row);
    });
}


/* =================================
   VEHICLE LOOKUP
================================= */

function findVehicleByRego(rego){

    for(const customer of customers){
        for(const vehicle of customer.vehicles){
            if(vehicle.rego.toLowerCase() === rego.toLowerCase()){
                return { customer, vehicle };
            }
        }
    }

    return null;
}


/* =================================
   CALENDAR (UNCHANGED STRUCTURE)
================================= */

function changeYear(dir){
    currentYear += dir;
    buildCalendar();
}

function buildCalendar(){

    selectedDateKey = null;
    currentMonthIndex = null;

    document.getElementById("yearDisplay").innerText = currentYear;

    calendarGrid.innerHTML = "";
    monthView.innerHTML = "";
    dayPanel.style.display = "none";
    calendarGrid.style.display = "grid";

    const months = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ];

    months.forEach((month,index)=>{
        const box = document.createElement("div");
        box.className = "month-box";
        box.innerHTML = `<h3>${month}</h3>`;
        box.onclick = ()=> showMonth(index);
        calendarGrid.appendChild(box);
    });

    updateDashboardToday();
}

function showMonth(monthIndex){

    currentMonthIndex = monthIndex;

    calendarGrid.style.display = "none";
    monthView.innerHTML = "";
    dayPanel.style.display = "none";

    const back = document.createElement("button");
    back.innerText = "← Back to Year";
    back.onclick = buildCalendar;

    const title = document.createElement("h2");
    title.innerText = new Date(currentYear,monthIndex)
        .toLocaleDateString('en-AU',{month:'long',year:'numeric'});

    const grid = document.createElement("div");
    grid.className = "day-grid";

    const days = new Date(currentYear,monthIndex+1,0).getDate();

    for(let d=1; d<=days; d++){

        const key = `${currentYear}-${monthIndex}-${d}`;
        const count = jobs[key] ? jobs[key].length : 0;

        const dayBox = document.createElement("div");
        dayBox.className = "day-box";

        if(count >= MAX_BOOKINGS_PER_DAY){
            dayBox.classList.add("day-full");
        }

        dayBox.innerHTML = `
            ${d}
            ${count>0 ? `<div class="day-count">${count}</div>` : ""}
        `;

        dayBox.onclick = ()=> openDayView(d);
        grid.appendChild(dayBox);
    }

    monthView.appendChild(back);
    monthView.appendChild(title);
    monthView.appendChild(grid);
}

function openDayView(day){

    if(currentMonthIndex === null) return;

    monthView.innerHTML = "";
    dayPanel.style.display = "block";

    selectedDateKey = `${currentYear}-${currentMonthIndex}-${day}`;

    const date = new Date(currentYear,currentMonthIndex,day);

    document.getElementById("dayTitle").innerText =
        date.toLocaleDateString('en-AU',{
            weekday:'long',
            day:'numeric',
            month:'long',
            year:'numeric'
        });

    if(!jobs[selectedDateKey]){
        jobs[selectedDateKey] = [];
    }

    renderJobs();
}


/* =================================
   BOOKINGS NOW USE VEHICLES
================================= */

function addVehicle(){

    if(!selectedDateKey) return;

    const rego = prompt("Enter Rego to Lookup:");

    const result = findVehicleByRego(rego);

    if(!result){
        alert("Vehicle not found. Add it under Customers first.");
        return;
    }

    const { customer, vehicle } = result;

    jobs[selectedDateKey].push({
        id: Date.now(),
        customerId: customer.id,
        vehicleId: vehicle.id,
        rego: vehicle.rego,
        customerName: customer.name
    });

    saveJobs();
    renderJobs();
}

function renderJobs(){

    if(!selectedDateKey) return;

    const tableBody = document.getElementById("bookingsBody");
    if(!tableBody) return;

    tableBody.innerHTML = "";

    const dayJobs = jobs[selectedDateKey] || [];

    dayJobs.forEach((job,i)=>{

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${i+1}</td>
            <td>${job.rego}</td>
            <td>${job.customerName}</td>
            <td><button onclick="deleteJob(${i})">✕</button></td>
        `;

        tableBody.appendChild(row);
    });
}

function deleteJob(index){
    jobs[selectedDateKey].splice(index,1);
    saveJobs();
    renderJobs();
}


/* =================================
   INIT
================================= */

document.addEventListener("DOMContentLoaded",function(){

    calendarGrid = document.getElementById("calendarGrid");
    monthView = document.getElementById("monthView");
    dayPanel = document.getElementById("dayPanel");

    buildCalendar();
    openDashboard();
});
