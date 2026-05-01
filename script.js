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
saveTaskBtn = document.querySelector("#saveTaskBtn");

let date = new Date(),
currYear = date.getFullYear(),
selectedDayElement = null,
currentTaskId = null,
editingTaskId = null;

const months = ["一月", "二月", "三月", "四月", "五月", "六月", "七月",
              "八月", "九月", "十月", "十一月", "十二月"];

const emojis = ["😄", "😀", "😊", "🙂", "😶", "😐", "🙁", "☹️", "😍", "🥰",
                "😘", "😎", "🤩", "🥳", "😴", "🤔", "😢", "😭", "😤", "😡"];

const getDateKey = (year, month, day) => `${year}-${month}-${day}`;

const loadTasks = () => {
    const saved = localStorage.getItem("calendarTasks");
    if (saved) return JSON.parse(saved);
    const defaultTask = { id: "default", name: "默认任务", color: "#4b9cd3", emojis: {} };
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

const getEmoji = (year, month, day) => {
    const task = getCurrentTask();
    const key = getDateKey(year, month, day);
    return task.emojis[key] || null;
};

const saveEmoji = (year, month, day, emoji) => {
    const tasks = loadTasks();
    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) return;
    const key = getDateKey(year, month, day);
    task.emojis[key] = emoji;
    saveTasks(tasks);
};

const renderYearView = () => {
    const task = getCurrentTask();
    let monthTag = "";
    for (let i = 0; i < 12; i++) {
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
            let emoji = getEmoji(currYear, i, j);
            let emojiClass = emoji ? "has-emoji" : "";
            dayTag += `<span class="${isToday} ${emojiClass}" data-month="${i}" data-day="${j}">${emoji || j}</span>`;
        }
        for (let j = lastDayofMonth; j < 7; j++) {
            if(lastDayofMonth === 0) break;
            dayTag += `<span class="empty"></span>`;
        }

        monthTag += `<div class="month-card" data-month="${i}">
            <div class="month-title" style="background:${task.color};color:#fff;border-radius:6px;padding:2px 0;">${months[i]}</div>
            <div class="mini-days">${dayTag}</div>
        </div>`;
    }
    currentDate.innerText = `${currYear} - ${task.name}`;
    monthsTag.innerHTML = monthTag;
};

initCurrentTask();
renderYearView();

const renderEmojiGrid = () => {
    let emojiTag = "";
    for (let emoji of emojis) {
        emojiTag += `<span>${emoji}</span>`;
    }
    emojiGrid.innerHTML = emojiTag;
};

renderEmojiGrid();

emojiGrid.addEventListener("click", (e) => {
    if (e.target.tagName === "SPAN") {
        let emoji = e.target.innerText;
        let month = parseInt(selectedDayElement.dataset.month);
        let day = parseInt(selectedDayElement.dataset.day);
        if (!isNaN(day)) {
            saveEmoji(currYear, month, day, emoji);
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
    if (e.target.tagName === "SPAN" && !e.target.classList.contains("empty") && e.target.dataset.day) {
        selectedDayElement = e.target;
        emojiPopup.classList.add("show");
    }
});

prevYearBtn.addEventListener("click", () => {
    currYear -= 1;
    renderYearView();
});

nextYearBtn.addEventListener("click", () => {
    currYear += 1;
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
        renderYearView();
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
