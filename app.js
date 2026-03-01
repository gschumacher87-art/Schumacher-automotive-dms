console.log("JS LOADED");
/* =====================
   SECTION SWITCHING
===================== */

function openDashboard(){
    document.getElementById("dashboardSection").style.display="block";
    document.getElementById("customersSection").style.display="none";
    document.getElementById("jobsSection").style.display="none";
    document.getElementById("calendarWrapper").style.display="none";
}

function openCustomers(){
    document.getElementById("dashboardSection").style.display="none";
    document.getElementById("customersSection").style.display="block";
    document.getElementById("jobsSection").style.display="none";
    document.getElementById("calendarWrapper").style.display="none";
    renderCustomers();
}

function openJobs(){
    document.getElementById("dashboardSection").style.display="none";
    document.getElementById("customersSection").style.display="none";
    document.getElementById("jobsSection").style.display="block";
    document.getElementById("calendarWrapper").style.display="none";
    renderJobTypes();
}

function openCalendar(){
    document.getElementById("dashboardSection").style.display="none";
    document.getElementById("customersSection").style.display="none";
    document.getElementById("jobsSection").style.display="none";
    document.getElementById("calendarWrapper").style.display="block";
}

/* =====================
   CUSTOMERS
===================== */

let customers = JSON.parse(localStorage.getItem("workshopCustomers")) || [];

function saveCustomers(){
    localStorage.setItem("workshopCustomers", JSON.stringify(customers));
}

function addCustomer(){
    const name = prompt("Customer Name:");
    if(!name) return;

    const phone = prompt("Phone:");
    const email = prompt("Email:");

    customers.push({name,phone,email});
    saveCustomers();
    renderCustomers();
}

function deleteCustomer(index){
    customers.splice(index,1);
    saveCustomers();
    renderCustomers();
}

function renderCustomers(){
    const table = document.getElementById("customerTableBody");
    table.innerHTML="";

    customers.forEach((customer,i)=>{
        const row=document.createElement("tr");
        row.innerHTML=`
            <td>${customer.name}</td>
            <td>${customer.phone||""}</td>
            <td>${customer.email||""}</td>
            <td><button onclick="deleteCustomer(${i})">✕</button></td>
        `;
        table.appendChild(row);
    });
}

/* =====================
   JOB TYPES
===================== */

let jobTypes = JSON.parse(localStorage.getItem("workshopJobTypes")) || [];

function saveJobTypes(){
    localStorage.setItem("workshopJobTypes", JSON.stringify(jobTypes));
}

function addJobType(){
    const name = prompt("Service Name:");
    if(!name) return;

    const description = prompt("Description:");

    jobTypes.push({name,description});
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

    table.innerHTML="";

    jobTypes.forEach((job,i)=>{
        const row=document.createElement("tr");
        row.innerHTML=`
            <td>${job.name}</td>
            <td>${job.description||""}</td>
            <td><button onclick="deleteJobType(${i})">✕</button></td>
        `;
        table.appendChild(row);
    });
}

/* =====================
   CALENDAR
===================== */

let currentYear = new Date().getFullYear();
let selectedDateKey = null;
let jobs = JSON.parse(localStorage.getItem("workshopJobs")) || {};
const MAX_BOOKINGS_PER_DAY = 10;

let calendarGrid;
let monthView;
let dayPanel;
let jobTableBody;

function saveJobs(){
    localStorage.setItem("workshopJobs", JSON.stringify(jobs));
}

function closeCalendar(){
    openDashboard();
}

function changeYear(dir){
    currentYear += dir;
    buildCalendar();
}

function buildCalendar(){

    document.getElementById("yearDisplay").innerText=currentYear;
    calendarGrid.innerHTML="";
    monthView.innerHTML="";
    dayPanel.style.display="none";
    calendarGrid.style.display="grid";

    const months=["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

    months.forEach((month,index)=>{
        const box=document.createElement("div");
        box.className="month-box";
        box.innerHTML=`<h3>${month}</h3>`;
        box.onclick=()=>showMonth(month,index);
        calendarGrid.appendChild(box);
    });

    updateDashboardToday();
}

function showMonth(month,monthIndex){

    calendarGrid.style.display="none";
    monthView.innerHTML="";
    dayPanel.style.display="none";

    const back=document.createElement("button");
    back.innerText="← Back to Year";
    back.onclick=buildCalendar;

    const title=document.createElement("h2");
    title.innerText=month+" "+currentYear;

    const grid=document.createElement("div");
    grid.className="day-grid";

    const days=new Date(currentYear,monthIndex+1,0).getDate();

    for(let d=1;d<=days;d++){

        const key=`${currentYear}-${monthIndex}-${d}`;
        const count = jobs[key] ? jobs[key].length : 0;

        const dayBox=document.createElement("div");
        dayBox.className="day-box";
        if(count >= MAX_BOOKINGS_PER_DAY){
            dayBox.classList.add("day-full");
        }

        dayBox.innerHTML=`
            ${d}
            ${count>0 ? `<div class="day-count">${count}</div>` : ""}
        `;

        dayBox.onclick=()=>openDayView(d,monthIndex);
        grid.appendChild(dayBox);
    }

    monthView.appendChild(back);
    monthView.appendChild(title);
    monthView.appendChild(grid);
}

function openDayView(day,monthIndex){

    monthView.innerHTML="";
    dayPanel.style.display="block";

    selectedDateKey=`${currentYear}-${monthIndex}-${day}`;

    const date=new Date(currentYear,monthIndex,day);
    document.getElementById("dayTitle").innerText=
        date.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'});

    if(!jobs[selectedDateKey]){
        jobs[selectedDateKey]=[];
    }

    renderJobs();
    updateSlotCounter();
}

function updateSlotCounter(){
    const count = jobs[selectedDateKey].length;
    const remaining = MAX_BOOKINGS_PER_DAY - count;

    document.getElementById("slotCounter").innerText =
        remaining <= 0 ? " - DAY FULL" : ` - ${remaining} Slots Available`;
}

function updateDashboardToday(){
    const today=new Date();
    const key=`${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const count = jobs[key] ? jobs[key].length : 0;
    document.getElementById("bookingCount").innerText=count;
}

function addVehicle(){

    if(!selectedDateKey) return;

    if(jobs[selectedDateKey].length >= MAX_BOOKINGS_PER_DAY){
        alert("Day is fully booked");
        return;
    }

    const rego=prompt("Rego:");
    if(!rego) return;

    const customer=prompt("Customer:");

    let type="";
    if(jobTypes.length > 0){
        let list="Select Job Type:\n";
        jobTypes.forEach((j,i)=>{
            list += `${i+1}. ${j.name}\n`;
        });
        const choice=prompt(list);
        if(choice && jobTypes[choice-1]){
            type=jobTypes[choice-1].name;
        }
    } else {
        type=prompt("Job Type:");
    }

    const status=prompt("Status:");
    const notes=prompt("Notes:");

    jobs[selectedDateKey].push({rego,customer,type,status,notes});
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

    jobTableBody.innerHTML="";

    jobs[selectedDateKey].forEach((job,i)=>{
        const row=document.createElement("tr");
        row.innerHTML=`
            <td>${job.rego}</td>
            <td>${job.customer||""}</td>
            <td>${job.type||""}</td>
            <td>${job.status||""}</td>
            <td>${job.notes||""}</td>
            <td><button onclick="deleteJob(${i})">✕</button></td>
        `;
        jobTableBody.appendChild(row);
    });
}

function backToMonth(){
    buildCalendar();
}

/* =====================
   INIT (IMPORTANT FIX)
===================== */

document.addEventListener("DOMContentLoaded", function(){

    calendarGrid = document.getElementById("calendarGrid");
    monthView = document.getElementById("monthView");
    dayPanel = document.getElementById("dayPanel");
    jobTableBody = document.getElementById("jobTableBody");

    buildCalendar();
    openDashboard();
});

