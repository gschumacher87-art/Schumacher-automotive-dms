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
   CUSTOMERS + VEHICLES
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

function deleteCustomer(customerId){
    customers = customers.filter(c => c.id !== customerId);
    saveCustomers();
    renderCustomers();
}

function renderCustomers(){

    const table = document.getElementById("customerTableBody");
    if(!table) return;

    table.innerHTML = "";

    customers.forEach(c => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${c.name}</td>
            <td>${c.phone || ""}</td>
            <td>${c.email || ""}</td>
            <td>${c.vehicles.length}</td>
            <td>
                <button onclick="addVehicleToCustomer(${c.id})">+ Vehicle</button>
                <button onclick="deleteCustomer(${c.id})">✕</button>
            </td>
        `;

        table.appendChild(row);
    });
}


/* =================================
   JOB TEMPLATES
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

        parts.push({
            partName,
            quantity
        });
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
            <td>${j.defaultHours} hrs</td>
            <td>${j.parts.length}</td>
            <td><button onclick="deleteJobType(${i})">✕</button></td>
        `;

        table.appendChild(row);
    });
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

    monthView.innerHTML = "";
    dayPanel.style.display = "block";

    selectedDateKey = `${currentYear}-${currentMonthIndex}-${day}`;

    if(!jobs[selectedDateKey]){
        jobs[selectedDateKey] = [];
    }

    renderJobs();
    updateSlotCounter();
}


/* =================================
   BOOKINGS (PROPERLY LINKED)
================================= */

function addVehicle(){

    if(!selectedDateKey) return;
    if(jobs[selectedDateKey].length >= MAX_BOOKINGS_PER_DAY){
        alert("Day is fully booked");
        return;
    }

    let vehicleList = "Select Vehicle:\n";
    let vehicleMap = [];

    customers.forEach(customer=>{
        customer.vehicles.forEach(vehicle=>{
            vehicleList += `${vehicleMap.length+1}. ${vehicle.rego} - ${customer.name}\n`;
            vehicleMap.push({
                customerId: customer.id,
                vehicleId: vehicle.id
            });
        });
    });

    if(vehicleMap.length === 0){
        alert("No vehicles exist.");
        return;
    }

    const choice = prompt(vehicleList);
    const selected = vehicleMap[choice-1];
    if(!selected) return;

    const status = prompt("Status:");
    const notes = prompt("Notes:");

    let templateId = null;
    let type = "";
    let hours = 0;
    let parts = [];

    if(jobTypes.length > 0){

        let list = "Select Job Type:\n";
        jobTypes.forEach((j,i)=>{
            list += `${i+1}. ${j.name}\n`;
        });

        const jobChoice = prompt(list);

        if(jobChoice && jobTypes[jobChoice-1]){
            const template = jobTypes[jobChoice-1];
            templateId = template.id;
            type = template.name;
            hours = template.defaultHours;
            parts = JSON.parse(JSON.stringify(template.parts));

            const adjustHours = prompt(`Adjust Labour Hours (Default ${hours}):`);
            if(adjustHours !== null){
                hours = parseFloat(adjustHours) || hours;
            }
        }
    }

    jobs[selectedDateKey].push({
        id: Date.now(),
        customerId: selected.customerId,
        vehicleId: selected.vehicleId,
        templateId,
        type,
        hours,
        parts,
        status,
        notes
    });

    saveJobs();
    renderJobs();
    updateSlotCounter();
}

function deleteJob(index){
    jobs[selectedDateKey].splice(index,1);
    saveJobs();
    renderJobs();
    updateSlotCounter();
}

function renderJobs(){

    const tableBody = document.getElementById("bookingsBody");
    if(!tableBody) return;

    tableBody.innerHTML = "";

    const dayJobs = jobs[selectedDateKey] || [];

    for(let i=0;i<MAX_BOOKINGS_PER_DAY;i++){

        const row = document.createElement("tr");

        if(dayJobs[i]){

            const job = dayJobs[i];
            const customer = customers.find(c=>c.id===job.customerId);
            const vehicle = customer
                ? customer.vehicles.find(v=>v.id===job.vehicleId)
                : null;

            row.innerHTML = `
                <td>${i+1}</td>
                <td>${vehicle ? vehicle.rego : ""}</td>
                <td>${customer ? customer.name : ""}</td>
                <td>${job.type || ""}</td>
                <td>${job.hours} hrs</td>
                <td>${job.status || ""}</td>
                <td>${job.notes || ""}</td>
                <td><button onclick="deleteJob(${i})">✕</button></td>
            `;

        } else {

            row.innerHTML = `
                <td>${i+1}</td>
                <td style="opacity:0.3;">Empty</td>
                <td></td><td></td><td></td><td></td><td></td><td></td>
            `;

            row.style.cursor = "pointer";
            row.onclick = ()=> addVehicle();
        }

        tableBody.appendChild(row);
    }
}

function updateSlotCounter(){

    const count = jobs[selectedDateKey].length;
    const remaining = MAX_BOOKINGS_PER_DAY - count;

    document.getElementById("slotCounter").innerText =
        remaining <= 0
        ? " - DAY FULL"
        : ` - ${remaining} Slots Available`;
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
