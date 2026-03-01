// ===============================
// SCHUMACHER AUTOMOTIVE DMS
// CLEAN CORE APP.JS
// ===============================

// ---------- GLOBAL STATE ----------
const App = {
    currentDate: new Date(),
    view: "month", // month | day
};

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
    init();
});

function init() {
    bindNavigation();
    render();
}

// ---------- NAVIGATION ----------
function bindNavigation() {
    const monthBtn = document.getElementById("monthBtn");
    const todayBtn = document.getElementById("todayBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (monthBtn) {
        monthBtn.addEventListener("click", () => {
            App.view = "month";
            render();
        });
    }

    if (todayBtn) {
        todayBtn.addEventListener("click", () => {
            App.currentDate = new Date();
            render();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (App.view === "month") {
                App.currentDate.setMonth(App.currentDate.getMonth() - 1);
            } else {
                App.currentDate.setDate(App.currentDate.getDate() - 1);
            }
            render();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (App.view === "month") {
                App.currentDate.setMonth(App.currentDate.getMonth() + 1);
            } else {
                App.currentDate.setDate(App.currentDate.getDate() + 1);
            }
            render();
        });
    }
}

// ---------- MAIN RENDER ----------
function render() {
    const calendar = document.getElementById("calendar");
    if (!calendar) return;

    calendar.innerHTML = "";

    if (App.view === "month") {
        renderMonth(calendar);
    } else {
        renderDay(calendar);
    }
}

// ---------- MONTH VIEW ----------
function renderMonth(container) {
    const year = App.currentDate.getFullYear();
    const month = App.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const grid = document.createElement("div");
    grid.className = "month-grid";

    // Empty cells before month starts
    for (let i = 0; i < startDay; i++) {
        const empty = document.createElement("div");
        empty.className = "day empty";
        grid.appendChild(empty);
    }

    // Actual days
    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement("div");
        cell.className = "day";
        cell.innerText = day;

        cell.addEventListener("click", () => {
            App.currentDate = new Date(year, month, day);
            App.view = "day";
            render();
        });

        grid.appendChild(cell);
    }

    container.appendChild(grid);
}

// ---------- DAY VIEW ----------
function renderDay(container) {
    const wrapper = document.createElement("div");
    wrapper.className = "day-view";

    const title = document.createElement("h2");
    title.innerText = App.currentDate.toDateString();

    const backBtn = document.createElement("button");
    backBtn.innerText = "Back to Month";
    backBtn.addEventListener("click", () => {
        App.view = "month";
        render();
    });

    wrapper.appendChild(title);
    wrapper.appendChild(backBtn);

    container.appendChild(wrapper);
}
