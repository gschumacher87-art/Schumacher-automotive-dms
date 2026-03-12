/* =================================
   GLOBAL STATE
================================= */
let editingServiceIndex = null;
let editingCustomerIndex = null;

let currentYear = new Date().getFullYear();
let selectedDateKey = null;
let currentMonthIndex = null;

let customers = JSON.parse(localStorage.getItem("workshopCustomers")) || [];
let serviceTypes = JSON.parse(localStorage.getItem("workshopServiceTypes")) || [];
let jobs = JSON.parse(localStorage.getItem("workshopJobs")) || {};
let quotes = JSON.parse(localStorage.getItem("workshopQuotes")) || [];
let invoices = JSON.parse(localStorage.getItem("workshopInvoices")) || [];

let nextQuoteNumber = parseInt(localStorage.getItem("nextQuoteNumber")) || 1;
let nextInvoiceNumber = parseInt(localStorage.getItem("nextInvoiceNumber")) || 1;

const MAX_BOOKINGS_PER_DAY = 10;

let calendarGrid, monthView, dayPanel;
let currentQuote = null;

/* =================================
   STORAGE HELPERS
================================= */
function saveCustomers(){ localStorage.setItem("workshopCustomers", JSON.stringify(customers)); }
function saveServiceTypes(){ localStorage.setItem("workshopServiceTypes", JSON.stringify(serviceTypes)); }
function saveJobs(){ localStorage.setItem("workshopJobs", JSON.stringify(jobs)); }
function saveQuotes(){ localStorage.setItem("workshopQuotes", JSON.stringify(quotes)); }
function saveInvoices(){ localStorage.setItem("workshopInvoices", JSON.stringify(invoices)); }
function saveParts(){ localStorage.setItem("workshopParts", JSON.stringify(parts)); }

function getNextQuoteNumber(){ const n = nextQuoteNumber++; localStorage.setItem("nextQuoteNumber", nextQuoteNumber); return n; }
function getNextInvoiceNumber(){ const n = nextInvoiceNumber++; localStorage.setItem("nextInvoiceNumber", nextInvoiceNumber); return n; }

/* =================================
   SECTION SWITCHING
================================= */
function showSection(sectionId){
    [
        "dashboardSection","customersSection","jobsSection",
        "partsSection","calendarWrapper","quotesSection","invoicesSection"
    ].forEach(id=>{
        const el = document.getElementById(id);
        if(el) el.style.display = (id === sectionId) ? "block" : "none";
    });
}

function openDashboard(){ showSection("dashboardSection"); updateDashboardToday(); }
function openCustomers(){ showSection("customersSection"); renderCustomers(); }
function openJobs(){ showSection("jobsSection"); renderServiceTypes(); }
function openParts(){ showSection("partsSection"); renderParts(); }
function openCalendar(){ showSection("calendarWrapper"); buildCalendar(); }
function openQuotes(){ showSection("quotesSection"); renderQuotes(); }
function openInvoices(){ showSection("invoicesSection"); renderInvoices(); }

/* =================================
   CUSTOMERS
================================= */
function saveCustomer(){
    const firstName = document.getElementById("customerFirstName").value.trim();
    const lastName  = document.getElementById("customerLastName").value.trim();
    const phone     = document.getElementById("customerPhone").value.trim();
    const email     = document.getElementById("customerEmail").value.trim();

    if(!firstName){ alert("First name required"); return; }

    if(editingCustomerIndex !== null){
        customers[editingCustomerIndex] = { ...customers[editingCustomerIndex], firstName, lastName, phone, email };
        editingCustomerIndex = null;
    } else {
        customers.push({ id: Date.now(), firstName, lastName, phone, email, vehicles: [] });
    }

    saveCustomers();
    renderCustomers();
    clearCustomerForm();
}

function deleteCustomer(index){
    if(!confirm("Delete customer?")) return;
    customers.splice(index,1);
    saveCustomers();
    renderCustomers();
}

function editCustomer(index){
    const c = customers[index];
    document.getElementById("customerFirstName").value = c.firstName || "";
    document.getElementById("customerLastName").value  = c.lastName || "";
    document.getElementById("customerPhone").value     = c.phone || "";
    document.getElementById("customerEmail").value    = c.email || "";
    editingCustomerIndex = index;
}

function clearCustomerForm(){
    document.getElementById("customerFirstName").value = "";
    document.getElementById("customerLastName").value  = "";
    document.getElementById("customerPhone").value     = "";
    document.getElementById("customerEmail").value    = "";
    editingCustomerIndex = null;
}

function addVehicleToCustomer(index){
    const rego  = document.getElementById("vehicleRego").value.trim();
    const make  = document.getElementById("vehicleMake").value.trim();
    const model = document.getElementById("vehicleModel").value.trim();
    const year  = document.getElementById("vehicleYear").value.trim();

    if(!rego){ alert("Rego required"); return; }

    customers[index].vehicles.push({ rego, make, model, year });
    saveCustomers();
    renderCustomers();

    document.getElementById("vehicleRego").value = "";
    document.getElementById("vehicleMake").value = "";
    document.getElementById("vehicleModel").value = "";
    document.getElementById("vehicleYear").value = "";
}

function searchCustomers(){
    const input = document.getElementById("customerSearchInput");
    if(!input) return;
    renderCustomers(input.value.toLowerCase());
}

function renderCustomers(searchTerm=""){
    const table = document.getElementById("customerTableBody");
    if(!table) return;
    table.innerHTML = "";

    customers.forEach((c,i)=>{
        const fullName = ((c.firstName||"")+" "+(c.lastName||"")).toLowerCase();
        const match = !searchTerm || fullName.includes(searchTerm) || (c.phone||"").toLowerCase().includes(searchTerm) || (c.email||"").toLowerCase().includes(searchTerm) || c.vehicles.some(v=> (v.rego||"").toLowerCase().includes(searchTerm));
        if(!match) return;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${c.firstName||""}</td>
            <td>${c.lastName||""}</td>
            <td>${c.phone||""}</td>
            <td>${c.email||""}</td>
            <td>${c.vehicles.length}</td>
            <td>
                <button onclick="editCustomer(${i})">Edit</button>
                <button onclick="addVehicleToCustomer(${i})">+ Vehicle</button>
                <button onclick="deleteCustomer(${i})">✕</button>
            </td>
        `;
        table.appendChild(row);

        c.vehicles.forEach(v=>{
            const vRow = document.createElement("tr");
            vRow.style.background="#f3f3f3";
            vRow.innerHTML = `<td style="padding-left:30px;">↳ ${v.rego}</td><td>${v.make}</td><td>${v.model}</td><td>${v.year}</td><td></td><td></td>`;
            table.appendChild(vRow);
        });
    });
}

/* =================================
   SERVICE TYPES
================================= */
function addServiceType(){
    const name = document.getElementById("serviceName").value.trim();
    const description = document.getElementById("serviceDescription").value.trim();
    const hours = parseFloat(document.getElementById("serviceHours").value) || 0;
    const rate = parseFloat(document.getElementById("serviceRate").value) || 0;

    if(!name){ alert("Service name required"); return; }

    if(editingServiceIndex !== null){
        serviceTypes[editingServiceIndex] = { ...serviceTypes[editingServiceIndex], name, description, defaultHours: hours, defaultRate: rate };
        editingServiceIndex = null;
    } else {
        serviceTypes.push({ id: Date.now(), name, description, defaultHours: hours, defaultRate: rate });
    }

    saveServiceTypes();
    renderServiceTypes();
    clearServiceForm();
}

function deleteServiceType(index){
    serviceTypes.splice(index,1);
    saveServiceTypes();
    renderServiceTypes();
}

function renderServiceTypes(){
    const table = document.getElementById("jobTypesTableBody");
    if(!table) return;
    table.innerHTML = "";

    serviceTypes.forEach((s,i)=>{
        const row = document.createElement("tr");
        row.innerHTML = `<td>${s.name}</td><td>${s.description}</td><td>${s.defaultHours} hrs</td><td>$${s.defaultRate.toFixed(2)}</td><td><button onclick="deleteServiceType(${i}); event.stopPropagation();">✕</button></td>`;
        row.style.cursor="pointer";
        row.onclick = ()=> loadServiceForEdit(i);
        table.appendChild(row);
    });
}

function loadServiceForEdit(index){
    const s = serviceTypes[index];
    if(!s) return;
    document.getElementById("serviceName").value = s.name;
    document.getElementById("serviceDescription").value = s.description;
    document.getElementById("serviceHours").value = s.defaultHours;
    document.getElementById("serviceRate").value = s.defaultRate;
    editingServiceIndex = index;
}

function clearServiceForm(){
    document.getElementById("serviceName").value="";
    document.getElementById("serviceDescription").value="";
    document.getElementById("serviceHours").value="";
    document.getElementById("serviceRate").value="";
    editingServiceIndex=null;
}

/* =================================
   PARTS LIBRARY
================================= */
let parts = JSON.parse(localStorage.getItem("workshopParts")) || [];

function addPart(){
    const number = document.getElementById("partNumber").value.trim();
    const description = document.getElementById("partDescription").value.trim();
    const price = parseFloat(document.getElementById("partPrice").value) || 0;

    if(!number||!description){ alert("Part number and description required"); return; }

    parts.push({ id: Date.now(), number, description, price });
    saveParts();
    renderParts();

    document.getElementById("partNumber").value="";
    document.getElementById("partDescription").value="";
    document.getElementById("partPrice").value="";
}

function deletePart(index){ parts.splice(index,1); saveParts(); renderParts(); }

function renderParts(){
    const table = document.getElementById("partsTableBody");
    if(!table) return;
    table.innerHTML="";
    parts.forEach((p,i)=>{
        const row = document.createElement("tr");
        row.innerHTML = `<td>${p.number}</td><td>${p.description}</td><td>$${p.price.toFixed(2)}</td><td><button onclick="deletePart(${i})">✕</button></td>`;
        table.appendChild(row);
    });
}

/* =================================
   QUOTES
================================= */
function startQuote(){
    currentQuote={ id: Date.now(), quoteNumber: getNextQuoteNumber(), customerName:"", vehicle:"", items:[], subtotal:0, gst:0, total:0, status:"Draft", date:new Date().toISOString() };

    // Clear fields
    document.getElementById("quoteCustomerName").value="";
    document.getElementById("quoteVehicle").value="";
    document.getElementById("quoteItemsBody").innerHTML="";
    document.getElementById("quoteSubtotal").textContent="0.00";
    document.getElementById("quoteGst").textContent="0.00";
    document.getElementById("quoteGrandTotal").textContent="0.00";

    document.getElementById("quoteBuilder").style.display="block";
}

function addQuoteItem(){
    const desc = document.getElementById("quoteItemDescription").value;
    const price = parseFloat(document.getElementById("quoteItemPrice").value) || 0;
    const qty = parseInt(document.getElementById("quoteItemQty").value) || 0;
    if(!desc||price<=0||qty<=0) return;

    const total = price*qty;
    currentQuote.items.push({ description:desc, price, qty, total });

    const tbody=document.getElementById("quoteItemsBody");
    const row=document.createElement("tr");
    row.innerHTML=`<td>${desc}</td><td>${price.toFixed(2)}</td><td>${qty}</td><td>${total.toFixed(2)}</td><td><button onclick="removeQuoteItem(${currentQuote.items.length-1}, this)">Remove</button></td>`;
    tbody.appendChild(row);

    updateQuoteTotals();
}

function removeQuoteItem(index, btn){
    currentQuote.items.splice(index,1);
    btn.closest("tr").remove();
    updateQuoteTotals();
}

function updateQuoteTotals(){
    const subtotal=currentQuote.items.reduce((sum,i)=>sum+i.total,0);
    const gst=subtotal*0.1;
    const total=subtotal+gst;

    currentQuote.subtotal=subtotal;
    currentQuote.gst=gst;
    currentQuote.total=total;

    document.getElementById("quoteSubtotal").textContent=subtotal.toFixed(2);
    document.getElementById("quoteGst").textContent=gst.toFixed(2);
    document.getElementById("quoteGrandTotal").textContent=total.toFixed(2);
}

function saveCurrentQuote(){
    if(!currentQuote) return;
    currentQuote.customerName=document.getElementById("quoteCustomerName").value;
    currentQuote.vehicle=document.getElementById("quoteVehicle").value;

    quotes.push(currentQuote);
    saveQuotes();
    renderQuotes();

    document.getElementById("quoteBuilder").style.display="none";
    currentQuote=null;
}

function convertQuoteToInvoice(index){
    const quote=quotes[index];
    if(!quote) return;

    const invoice={ ...quote, invoiceNumber:getNextInvoiceNumber(), status:"Unpaid" };
    invoices.push(invoice);
    saveInvoices();

    quote.status="Converted";
    saveQuotes();
    renderQuotes();
}

function renderQuotes(){
    const table=document.getElementById("quotesTableBody");
    if(!table) return;
    table.innerHTML="";
    quotes.forEach((q,i)=>{
        const row=document.createElement("tr");
        row.innerHTML=`<td>Q${q.quoteNumber}</td><td>${new Date(q.date).toLocaleDateString('en-AU')}</td><td>$${q.total.toFixed(2)}</td><td>${q.status}</td><td><button onclick="convertQuoteToInvoice(${i})">Convert</button></td>`;
        table.appendChild(row);
    });
}

/* =================================
   INVOICES
================================= */
function renderInvoices(){
    const table=document.getElementById("invoicesTableBody");
    if(!table) return;
    table.innerHTML="";
    invoices.forEach(inv=>{
        const row=document.createElement("tr");
        row.innerHTML=`<td>INV${inv.invoiceNumber}</td><td>${new Date(inv.date).toLocaleDateString('en-AU')}</td><td>$${inv.total.toFixed(2)}</td><td>${inv.status}</td>`;
        table.appendChild(row);
    });
}

/* =================================
   CALENDAR
================================= */
function buildCalendar(){
    if(!calendarGrid||!monthView||!dayPanel) return;

    selectedDateKey=null;
    currentMonthIndex=null;

    document.getElementById("yearDisplay").innerText=currentYear;
    calendarGrid.innerHTML="";
    monthView.innerHTML="";
    dayPanel.style.display="none";
    calendarGrid.style.display="grid";

    const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
    months.forEach((month,index)=>{
        const box=document.createElement("div");
        box.className="month-box";
        box.innerHTML=`<h3>${month}</h3>`;
        box.onclick=()=>showMonth(index);
        calendarGrid.appendChild(box);
    });

    updateDashboardToday();
}

function changeYear(dir){ currentYear+=dir; buildCalendar(); }
function showMonth(monthIndex){
    currentMonthIndex=monthIndex;
    calendarGrid.style.display="none";
    monthView.innerHTML="";
    dayPanel.style.display="none";

    const back=document.createElement("button"); back.innerText="← Back to Year"; back.onclick=buildCalendar;
    const title=document.createElement("h2"); title.innerText=new Date(currentYear,monthIndex).toLocaleDateString('en-AU',{month:'long',year:'numeric'});
    const grid=document.createElement("div"); grid.className="day-grid";

    const days=new Date(currentYear,monthIndex+1,0).getDate();
    for(let d=1;d<=days;d++){
        const key=`${currentYear}-${monthIndex}-${d}`;
        const count=jobs[key]?jobs[key].length:0;
        const dayBox=document.createElement("div");
        dayBox.className="day-box";
        if(count>=MAX_BOOKINGS_PER_DAY) dayBox.classList.add("day-full");
        dayBox.innerHTML=`${d}${count>0?`<div class="day-count">${count}</div>`:""}`;
        dayBox.onclick=()=>openDayView(d);
        grid.appendChild(dayBox);
    }

    monthView.appendChild(back);
    monthView.appendChild(title);
    monthView.appendChild(grid);
}

function openDayView(day){
    if(currentMonthIndex===null) return;
    monthView.innerHTML="";
    dayPanel.style.display="block";
    selectedDateKey=`${currentYear}-${currentMonthIndex}-${day}`;
    if(!jobs[selectedDateKey]) jobs[selectedDateKey]=[];
    renderJobs();
    updateSlotCounter();
}

function addVehicle(){
    if(!selectedDateKey) return;
    if(!jobs[selectedDateKey]) jobs[selectedDateKey]=[];
    if(jobs[selectedDateKey].length>=MAX_BOOKINGS_PER_DAY){ alert("Day is fully booked"); return; }

    const rego=prompt("Rego:"); if(!rego) return;
    const customer=prompt("Customer:"); const status=prompt("Status:"); const notes=prompt("Notes:");
    let templateId=null,type="",hours=0;

    if(serviceTypes.length>0){
        let list="Select Service Type:\n";
        serviceTypes.forEach((s,i)=>list+=`${i+1}. ${s.name}\n`);
        const choice=prompt(list);
        if(choice && serviceTypes[choice-1]){
            const template=serviceTypes[choice-1];
            templateId=template.id; type=template.name; hours=template.defaultHours||0;
