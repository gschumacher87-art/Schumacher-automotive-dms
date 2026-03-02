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
   DATA NORMALISATION
================================= */

// Ensure customer structure integrity
customers = customers.map(c => ({
    id: c.id || Date.now() + Math.random(),
    name: c.name || "",
    phone: c.phone || "",
    email: c.email || "",
    vehicles: Array.isArray(c.vehicles) ? c.vehicles : []
}));

saveCustomers();


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
    ["dashboardSection","customersSection","jobsSection","partsSection","calendarWrapper","invoicesSection"]
        .forEach(id=>{
            const el = document.getElementById(id);
            if(el){
                el.style.display = id === sectionId ? "block" : "none";
            }
        });
}

function openDashboard(){
    showSection("dashboardSection");
}

function openCustomers(){
    showSection("customersSection");
    renderCustomers();
}

function openJobs(){
    showSection("jobsSection");
    renderJobTypes();
}

function openParts(){
    showSection("partsSection");
    renderParts();
}

function openCalendar(){
    showSection("calendarWrapper");
}

function openInvoices(){
    showSection("invoicesSection");
}


/* =================================
   CUSTOMERS DATABASE
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

function addVehicleToCustomer(index){

    const rego = prompt("Rego:");
    if(!rego) return;

    const make = prompt("Make:");
    const model = prompt("Model:");
    const year = prompt("Year:");
    const notes = prompt("Notes:");

    customers[index].vehicles.push({
        rego,
        make,
        model,
        year,
        notes
    });

    saveCustomers();
    renderCustomers();
}

function searchCustomers(){

    const input = document.getElementById("customerSearchInput");
    if(!input) return;

    const term = input.value.toLowerCase();
    renderCustomers(term);
}

function renderCustomers(searchTerm=""){

    const table = document.getElementById("customerTableBody");
    if(!table) return;

    table.innerHTML = "";

    customers.forEach((c,i)=>{

        const match =
            c.name.toLowerCase().includes(searchTerm) ||
            c.phone.includes(searchTerm) ||
            c.email.toLowerCase().includes(searchTerm) ||
            c.vehicles.some(v => v.rego.toLowerCase().includes(searchTerm));

        if(searchTerm && !match) return;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${c.name}</td>
            <td>${c.phone}</td>
            <td>${c.email}</td>
            <td>${c.vehicles.length}</td>
            <td>
                <button onclick="addVehicleToCustomer(${i})">+ Vehicle</button>
                <button onclick="deleteCustomer(${i})">✕</button>
            </td>
        `;

        table.appendChild(row);

        c.vehicles.forEach(v=>{
            const vehicleRow = document.createElement("tr");
            vehicleRow.style.background = "#f3f3f3";

            vehicleRow.innerHTML = `
                <td style="padding-left:30px;">↳ ${v.rego}</td>
                <td>${v.make}</td>
                <td>${v.model}</td>
                <td>${v.year}</td>
                <td>${v.notes}</td>
            `;

            table.appendChild(vehicleRow);
        });
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
        parts.push({partName,quantity});
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
            <td>${j.description}</td>
            <td>${j.defaultHours} hrs</td>
            <td>${j.parts.length}</td>
            <td><button onclick="deleteJobType(${i})">✕</button></td>
        `;
        table.appendChild(row);
    });
}


/* =================================
   CALENDAR
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
    title.innerText =
        new Date(currentYear,monthIndex)
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

        dayBox.innerHTML =
            `${d}${count>0 ? `<div class="day-count">${count}</div>`:""}`;

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

    selectedDateKey =
        `${currentYear}-${currentMonthIndex}-${day}`;

    const date =
        new Date(currentYear,currentMonthIndex,day);

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
    updateSlotCounter();
}

function updateSlotCounter(){

    if(!selectedDateKey) return;

    const remaining =
        MAX_BOOKINGS_PER_DAY -
        jobs[selectedDateKey].length;

    document.getElementById("slotCounter").innerText =
        remaining <= 0 ?
        " - DAY FULL" :
        ` - ${remaining} Slots Available`;
}

function updateDashboardToday(){

    const today = new Date();
    const key =
        `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    const count = jobs[key] ? jobs[key].length : 0;

    const el = document.getElementById("bookingCount");
    if(el) el.innerText = count;
}


/* =================================
   JOBS TABLE
================================= */

function addVehicle(){

    if(!selectedDateKey) return;
    if(jobs[selectedDateKey].length >= MAX_BOOKINGS_PER_DAY){
        alert("Day is fully booked");
        return;
    }

    const rego = prompt("Rego:");
    if(!rego) return;

    const customer = prompt("Customer:");
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

        const choice = prompt(list);

        if(choice && jobTypes[choice-1]){

            const template = jobTypes[choice-1];

            templateId = template.id;
            type = template.name;
            hours = template.defaultHours || 0;
            parts = JSON.parse(JSON.stringify(template.parts || []));

            const adjust =
                prompt(`Adjust Labour Hours (Default ${hours}):`);

            if(adjust !== null){
                hours = parseFloat(adjust) || hours;
            }
        }
    }

    jobs[selectedDateKey].push({
        id: Date.now(),
        rego,
        customer,
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

    if(!selectedDateKey) return;

    const tableBody =
        document.getElementById("bookingsBody");
    if(!tableBody) return;

    tableBody.innerHTML = "";

    const dayJobs = jobs[selectedDateKey] || [];

    for(let i=0;i<MAX_BOOKINGS_PER_DAY;i++){

        const row = document.createElement("tr");

        if(dayJobs[i]){

            const job = dayJobs[i];

            row.innerHTML = `
                <td>${i+1}</td>
                <td>${job.rego}</td>
                <td>${job.customer}</td>
                <td>${job.type}</td>
                <td>${job.hours} hrs</td>
                <td>${job.status}</td>
                <td>${job.notes}</td>
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

function backToMonth(){
    if(currentMonthIndex !== null){
        showMonth(currentMonthIndex);
    }
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
