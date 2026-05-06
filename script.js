const currentDate = document.querySelector("#currentDate"),
prevYearBtn = document.querySelector("#prevYear"),
nextYearBtn = document.querySelector("#nextYear"),
taskBtn = document.querySelector("#taskBtn"),
monthsTag = document.querySelector(".months"),
emojiPopup = document.querySelector("#emojiPopup"),
emojiGrid = document.querySelector("#emojiGrid"),
closeEmojiPopup = document.querySelector("#closeEmojiPopup"),
taskPopup = document.querySelector("#taskPopup"),
closeTaskPopup = document.querySelector("#closeTaskPopup"),
taskListEl = document.querySelector("#taskList"),
addTaskBtn = document.querySelector("#addTaskBtn"),
taskEditPopup = document.querySelector("#taskEditPopup"),
taskEditTitle = document.querySelector("#taskEditTitle"),
closeTaskEdit = document.querySelector("#closeTaskEdit"),
taskNameInput = document.querySelector("#taskNameInput"),
taskColorInput = document.querySelector("#taskColorInput"),
saveTaskBtn = document.querySelector("#saveTaskBtn"),
exportBtn = document.querySelector("#exportBtn"),
importBtn = document.querySelector("#importBtn"),
importFile = document.querySelector("#importFile");

let date = new Date(),
currYear = date.getFullYear(),
selectedDayElement = null,
currentTaskId = null,
editingTaskId = null,
statsMonthsOpen = new Set();

const months = ["一月", "二月", "三月", "四月", "五月", "六月", "七月",
              "八月", "九月", "十月", "十一月", "十二月"];

const emojis = ["😄", "😀", "😊", "🙂", "😶", "😐", "🙁", "☹️"];

const getDateKey = (year, month, day) => `${year}-${month}-${day}`;

const loadTasks = () => {
    const saved = localStorage.getItem("calendarTasks");
    if (saved) return JSON.parse(saved);
    const defaultTask = { id: "default", name: "默认任务", color: "#4b9cd3", emojis: {}, lastEditYear: null, lastEditMonth: null };
    localStorage.setItem("calendarTasks", JSON.stringify([defaultTask]));
    return [defaultTask];
};

const saveTasks = (tasks) => {
    localStorage.setItem("calendarTasks", JSON.stringify(tasks));
};

const getCurrentTask = () => {
    const tasks = loadTasks();
    return tasks.find(t => t.id === currentTaskId) || tasks[0];
};

const initCurrentTask = () => {
    const tasks = loadTasks();
    const savedId = localStorage.getItem("currentTaskId");
    if (savedId && tasks.find(t => t.id === savedId)) {
        currentTaskId = savedId;
    } else {
        currentTaskId = tasks[0].id;
    }
};

const getEmojiIndex = (year, month, day) => {
    const task = getCurrentTask();
    const key = getDateKey(year, month, day);
    return task.emojis[key] || 0;
};

const saveEmojiIndex = (year, month, day, index) => {
    const tasks = loadTasks();
    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) return;
    const key = getDateKey(year, month, day);
    if (task.emojis[key] === index) {
        delete task.emojis[key];
    } else {
        task.emojis[key] = index;
        task.lastEditYear = year;
        task.lastEditMonth = month;
    }
    saveTasks(tasks);
};

const renderMonthDays = (i) => {
    let firstDayofMonth = new Date(currYear, i, 1).getDay();
    let lastDateofMonth = new Date(currYear, i + 1, 0).getDate();
    let lastDayofMonth = new Date(currYear, i, lastDateofMonth).getDay();
    firstDayofMonth = firstDayofMonth === 0 ? 7 : firstDayofMonth;

    let dayTag = "";
    for (let j = 1; j < firstDayofMonth; j++) {
        dayTag += `<span class="empty"></span>`;
    }
    for (let j = 1; j <= lastDateofMonth; j++) {
        let isToday = j === date.getDate() && i === new Date().getMonth()
                     && currYear === new Date().getFullYear() ? "active" : "";
        let emojiIdx = getEmojiIndex(currYear, i, j);
        let emojiClass = emojiIdx ? "has-emoji" : "";
        dayTag += `<span class="${isToday} ${emojiClass}" data-month="${i}" data-day="${j}">${emojiIdx ? emojis[emojiIdx - 1] : j}</span>`;
    }
    for (let j = lastDayofMonth; j < 7; j++) {
        if(lastDayofMonth === 0) break;
        dayTag += `<span class="empty"></span>`;
    }
    return dayTag;
};

const scoreMap = {1:100, 2:87.5, 3:75, 4:62.5, 5:50, 6:37.5, 7:25, 8:12.5};

const renderMonthStats = (i) => {
    const lastDate = new Date(currYear, i + 1, 0).getDate();
    let occupied = 0, success = 0, scoreSum = 0;
    for (let d = 1; d <= lastDate; d++) {
        let idx = getEmojiIndex(currYear, i, d);
        if (idx > 0) {
            occupied++;
            scoreSum += scoreMap[idx] || 0;
            if (idx <= 4) success++;
        }
    }
    let workingPct = lastDate ? (occupied / lastDate * 100).toFixed(1) : "0";
    let successPct = occupied ? (success / occupied * 100).toFixed(1) : "0";
    let avgScore = occupied ? (scoreSum / occupied).toFixed(1) : "0";
    return `
        <div class="stats-row"><span class="stats-label">尝试天数</span><span class="stats-value">${occupied}/${lastDate}</span><span class="stats-pct">${workingPct} %</span></div>
        <div class="stats-bar"><div class="stats-bar-fill" style="width:${workingPct}%;background:#4b9cd3;"></div></div>
        <div class="stats-row"><span class="stats-label">成功天数</span><span class="stats-value">${success}/${occupied}</span><span class="stats-pct">${successPct} %</span></div>
        <div class="stats-bar"><div class="stats-bar-fill" style="width:${successPct}%;background:#2ecc71;"></div></div>
        <div class="stats-row"><span class="stats-label">平均得分</span><span class="stats-value">${avgScore}</span><span class="stats-pct">${avgScore}</span></div>
        <div class="stats-bar"><div class="stats-bar-fill" style="width:${avgScore}%;background:#e67e22;"></div></div>
    `;
};

const renderYearView = () => {
    const task = getCurrentTask();
    let monthTag = "";
    for (let i = 0; i < 12; i++) {
        let content = statsMonthsOpen.has(i)
            ? `<div class="mini-stats">${renderMonthStats(i)}</div>`
            : `<div class="mini-days">${renderMonthDays(i)}</div>`;

        monthTag += `<div class="month-card" data-month="${i}">
            <div class="month-title" data-month="${i}" style="background:${task.color};color:#fff;border-radius:6px;padding:4px 0;cursor:pointer;">${months[i]}</div>
            ${content}
        </div>`;
    }
    currentDate.innerText = `${currYear} - ${task.name}`;
    document.title = `${currYear} - ${task.name}`;
    monthsTag.innerHTML = monthTag;
};

const scrollToLastEditMonth = () => {
    if (window.innerWidth > 480) return;
    const task = getCurrentTask();
    if (task && task.lastEditMonth !== null) {
        const monthCard = document.querySelector(`.month-card[data-month="${task.lastEditMonth}"]`);
        if (monthCard) {
            monthCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }
};

initCurrentTask();
const initTask = getCurrentTask();
currYear = initTask.lastEditYear || date.getFullYear();
renderYearView();
scrollToLastEditMonth();

const renderEmojiGrid = () => {
    let emojiTag = "";
    for (let i = 0; i < emojis.length; i++) {
        emojiTag += `<span data-index="${i + 1}">${emojis[i]}</span>`;
    }
    emojiGrid.innerHTML = emojiTag;
};

renderEmojiGrid();

emojiGrid.addEventListener("click", (e) => {
    if (e.target.tagName === "SPAN") {
        let index = parseInt(e.target.dataset.index);
        let month = parseInt(selectedDayElement.dataset.month);
        let day = parseInt(selectedDayElement.dataset.day);
        if (!isNaN(day) && !isNaN(index)) {
            saveEmojiIndex(currYear, month, day, index);
            renderYearView();
        }
        closeEmojiPopupFn();
    }
});

const closeEmojiPopupFn = () => {
    emojiPopup.classList.remove("show");
    selectedDayElement = null;
};

closeEmojiPopup.addEventListener("click", closeEmojiPopupFn);
emojiPopup.addEventListener("click", (e) => {
    if (e.target === emojiPopup) closeEmojiPopupFn();
});

monthsTag.addEventListener("click", (e) => {
    if (e.target.classList.contains("month-title")) {
        const monthIdx = parseInt(e.target.dataset.month);
        if (statsMonthsOpen.has(monthIdx)) {
            statsMonthsOpen.delete(monthIdx);
        } else {
            statsMonthsOpen.add(monthIdx);
        }
        renderYearView();
        return;
    }
    if (e.target.tagName === "SPAN" && !e.target.classList.contains("empty") && e.target.dataset.day) {
        selectedDayElement = e.target;
        emojiPopup.classList.add("show");
    }
});

currentDate.addEventListener("click", () => {
    if (statsMonthsOpen.size === 12) {
        statsMonthsOpen.clear();
    } else {
        for (let i = 0; i < 12; i++) statsMonthsOpen.add(i);
    }
    renderYearView();
});

prevYearBtn.addEventListener("click", () => {
    currYear -= 1;
    statsMonthsOpen.clear();
    renderYearView();
});

nextYearBtn.addEventListener("click", () => {
    currYear += 1;
    statsMonthsOpen.clear();
    renderYearView();
});

const renderTaskList = () => {
    const tasks = loadTasks();
    let html = "";
    for (let task of tasks) {
        let isActive = task.id === currentTaskId ? "active" : "";
        html += `<div class="task-item ${isActive}" data-id="${task.id}">
            <div class="task-item-name" data-id="${task.id}" style="border-left:4px solid ${task.color};">
                <span class="task-item-label">${task.name}</span>
            </div>
            <button class="task-edit-btn" data-id="${task.id}">编辑</button>
        </div>`;
    }
    taskListEl.innerHTML = html;
};

taskBtn.addEventListener("click", () => {
    renderTaskList();
    taskPopup.classList.add("show");
});

closeTaskPopup.addEventListener("click", () => {
    taskPopup.classList.remove("show");
});

taskPopup.addEventListener("click", (e) => {
    if (e.target === taskPopup) taskPopup.classList.remove("show");
});

taskListEl.addEventListener("click", (e) => {
    if (e.target.classList.contains("task-edit-btn")) {
        e.stopPropagation();
        const id = e.target.dataset.id;
        const tasks = loadTasks();
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        editingTaskId = id;
        taskEditTitle.innerText = "编辑任务";
        taskNameInput.value = task.name;
        taskColorInput.value = task.color;
        taskEditPopup.classList.add("show");
        return;
    }
    const nameEl = e.target.closest(".task-item-name");
    if (nameEl) {
        const id = nameEl.dataset.id;
        currentTaskId = id;
        localStorage.setItem("currentTaskId", id);
        taskPopup.classList.remove("show");
        const tasks = loadTasks();
        const task = tasks.find(t => t.id === id);
        if (task && task.lastEditYear) currYear = task.lastEditYear;
        renderYearView();
        scrollToLastEditMonth();
    }
});

addTaskBtn.addEventListener("click", () => {
    editingTaskId = null;
    taskEditTitle.innerText = "新建任务";
    taskNameInput.value = "";
    taskColorInput.value = "#4b9cd3";
    taskEditPopup.classList.add("show");
});

closeTaskEdit.addEventListener("click", () => {
    taskEditPopup.classList.remove("show");
});

taskEditPopup.addEventListener("click", (e) => {
    if (e.target === taskEditPopup) taskEditPopup.classList.remove("show");
});

saveTaskBtn.addEventListener("click", () => {
    const name = taskNameInput.value.trim();
    if (!name) return;
    const color = taskColorInput.value;
    const tasks = loadTasks();

    if (editingTaskId) {
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.name = name;
            task.color = color;
        }
    } else {
        const newTask = {
            id: "task_" + Date.now(),
            name: name,
            color: color,
            emojis: {}
        };
        tasks.push(newTask);
        currentTaskId = newTask.id;
        localStorage.setItem("currentTaskId", currentTaskId);
    }

    saveTasks(tasks);
    taskEditPopup.classList.remove("show");
    renderTaskList();
    renderYearView();
});

exportBtn.addEventListener("click", () => {
    const data = {
        calendarTasks: loadTasks(),
        currentTaskId: localStorage.getItem("currentTaskId") || loadTasks()[0].id
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendar_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => {
    importFile.click();
});

importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.calendarTasks && Array.isArray(data.calendarTasks)) {
                saveTasks(data.calendarTasks);
                if (data.currentTaskId) {
                    localStorage.setItem("currentTaskId", data.currentTaskId);
                    currentTaskId = data.currentTaskId;
                }
                initCurrentTask();
                renderYearView();
                alert("导入成功");
            } else {
                alert("文件格式不正确");
            }
        } catch {
            alert("文件解析失败");
        }
    };
    reader.readAsText(file);
    importFile.value = "";
});
