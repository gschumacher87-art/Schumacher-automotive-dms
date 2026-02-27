
let currentUser = null;
let jobs = JSON.parse(localStorage.getItem("jobs") || "[]");
let users = JSON.parse(localStorage.getItem("users") || "[]");
let invoiceCounter = parseInt(localStorage.getItem("invoiceCounter") || "1");

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function createAdmin() {
  const username = prompt("Admin username:");
  const password = prompt("Admin password:");
  users.push({username, password, role:"admin"});
  localStorage.setItem("users", JSON.stringify(users));
  alert("Admin created.");
}

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const user = users.find(u => u.username===username && u.password===password);
  if(user) {
    currentUser = user;
    showScreen("dashboardScreen");
    renderJobs();
  } else {
    alert("Invalid login");
  }
}

function logout() {
  currentUser = null;
  showScreen("loginScreen");
}

function newJob() {
  showScreen("jobScreen");
}

function saveJob() {
  const rego = document.getElementById("rego").value;
  const customer = document.getElementById("customer").value;
  const notes = document.getElementById("notes").value;
  const photoInput = document.getElementById("photoInput");
  
  if(photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function() {
      addJob(rego, customer, notes, reader.result);
    }
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    addJob(rego, customer, notes, null);
  }
}

function addJob(rego, customer, notes, photo) {
  const invoiceNumber = "SCH-" + String(invoiceCounter).padStart(4,"0");
  invoiceCounter++;
  localStorage.setItem("invoiceCounter", invoiceCounter);
  
  jobs.push({
    rego, customer, notes, photo,
    invoiceNumber
  });
  
  localStorage.setItem("jobs", JSON.stringify(jobs));
  showScreen("dashboardScreen");
  renderJobs();
}

function renderJobs() {
  const container = document.getElementById("jobsList");
  container.innerHTML = "";
  jobs.forEach(job => {
    const div = document.createElement("div");
    div.innerHTML = `<div style="background:var(--card);padding:10px;margin:10px 0;border-radius:10px">
      <b>${job.rego}</b><br>
      ${job.customer}<br>
      Invoice: ${job.invoiceNumber}
    </div>`;
    container.appendChild(div);
  });
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}
function openMonthPicker() {
    const picker = document.getElementById("monthPicker");
    picker.style.display = picker.style.display === "none" ? "block" : "none";
}

function selectMonth(monthIndex) {
    currentDate.setMonth(monthIndex);
    document.getElementById("monthPicker").style.display = "none";
    renderCalendar();
}
