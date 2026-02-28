/* =====================
   GLOBAL STATE
===================== */

let currentYear = new Date().getFullYear();
let selectedDateKey = null;

let customers = JSON.parse(localStorage.getItem("workshopCustomers")) || [];
let jobTypes = JSON.parse(localStorage.getItem("workshopJobTypes")) || [];
let jobs = JSON.parse(localStorage.getItem("workshopJobs")) || {};

const MAX_BOOKINGS_PER_DAY = 10;

/* =====================
   SAFE ELEMENT GETTER
===================== */

function el(id){
    return document.getElementById(id);
}

/* =====================
   SECTION SWITCHING (INDEX ONLY)
===================== */

function openDashboard(){
    if(!el("dashboardSection")) return;
    el("dashboardSection").style.display="block";
    el("customersSection").style.display="none";
    el("jobsSection").style.display="none";
    el("calendarWrapper").style.display="none";
}

function openCustomers(){
    if(!el("customersSection")) return;
    el("dashboardSection").style.display="none";
    el("customersSection").style.display="block";
    el("jobsSection").style.display="none";
    el("calendarWrapper").style.display="none";
    renderCustomers();
}

function openJobs(){
    if(!el("jobsSection")) return;
    el("dashboardSection").style.display="none";
    el("customersSection").style.display="none";
    el("jobsSection").style.display="block";
    el("calendarWrapper").style.display="none";
    renderJobTypes();
}

function openCalendar(){
    if(!el("calendarWrapper")) return;
    el("dashboardSection").style.display="none";
    el("customersSection").style.display="none";
    el("jobsSection").style.display="none";
    el("calendarWrapper").style.display="block";
}

/* =====================
   CUSTOMERS
===================== */

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
    if(!el("customerTableBody")) return;

    const table = el("customerTableBody");
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
    if(!el("jobTypesTableBody")) return;

    const table = el("jobTypesTableBody");
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
   CALENDAR (INDEX)
===================== */

function saveJobs(){
    localStorage.setItem("workshopJobs", JSON.stringify(jobs));
}

function changeYear(dir){
    currentYear += dir;
    buildCalendar();
}

function buildCalendar(){

    if(!el("calendarGrid")) return;

    el("yearDisplay").innerText=currentYear;
    el("calendarGrid").innerHTML="";
    el("monthView").innerHTML="";
    if(el("dayPanel")) el("dayPanel").style.display="none";
    el("calendarGrid").style.display="grid";

    const months=["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

    months.forEach((month,index)=>{
        const box=document.createElement("div");
        box.className="month-box";
        box.innerHTML=`<h3>${month}</h3>`;
        box.onclick=()=>showMonth(month,index);
        el("calendarGrid").appendChild(box);
    });

    updateDashboardToday();
}

function showMonth(month,monthIndex){

    el("calendarGrid").style.display="none";
    el("monthView").innerHTML="";

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

        dayBox.onclick=()=>{
            window.location.href = `item.html?year=${currentYear}&month=${monthIndex}&day=${d}`;
        };

        grid.appendChild(dayBox);
    }

    el("monthView").appendChild(back);
    el("monthView").appendChild(title);
    el("monthView").appendChild(grid);
}

/* =====================
   DAY PAGE LOGIC (item.html)
===================== */

function loadDayFromURL(){

    if(!window.location.pathname.includes("item.html")) return;

    const params = new URLSearchParams(window.location.search);
    const year = parseInt(params.get("year"));
    const month = parseInt(params.get("month"));
    const day = parseInt(params.get("day"));

    if(!year || month===null || !day) return;

    selectedDateKey = `${year}-${month}-${day}`;

    const date=new Date(year,month,day);

    el("dayTitle").innerText =
        date.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'});

    if(!jobs[selectedDateKey]){
        jobs[selectedDateKey]=[];
    }

    renderJobs();
    updateSlotCounter();
}

function updateSlotCounter(){
    if(!selectedDateKey) return;

    const count = jobs[selectedDateKey].length;
    const remaining = MAX_BOOKINGS_PER_DAY - count;

    if(remaining <= 0){
        el("slotCounter").innerText=" - DAY FULL";
    } else {
        el("slotCounter").innerText=` - ${remaining} Slots Available`;
    }
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

    if(!el("jobTableBody")) return;

    el("jobTableBody").innerHTML="";

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
        el("jobTableBody").appendChild(row);
    });
}

/* =====================
   DASHBOARD
===================== */

function updateDashboardToday(){
    if(!el("bookingCount")) return;

    const today=new Date();
    const key=`${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const count = jobs[key] ? jobs[key].length : 0;
    el("bookingCount").innerText=count;
}

/* =====================
   INIT
===================== */

document.addEventListener("DOMContentLoaded", function(){

    if(el("calendarGrid")){
        buildCalendar();
        openDashboard();
    }

    loadDayFromURL();
});
