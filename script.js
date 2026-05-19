const currentDate = document.querySelector("#currentDate"),
prevYearBtn = document.querySelector("#prevYear"),
nextYearBtn = document.querySelector("#nextYear"),
monthsTag = document.querySelector(".months"),
emojiPopup = document.querySelector("#emojiPopup"),
emojiGrid = document.querySelector("#emojiGrid"),
closeEmojiPopup = document.querySelector("#closeEmojiPopup"),
selectedDateEl = document.querySelector("#selectedDate"),
commentInput = document.querySelector("#commentInput"),
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
deleteTaskBtn = document.querySelector("#deleteTaskBtn"),
exportBtn = document.querySelector("#exportBtn"),
importBtn = document.querySelector("#importBtn"),
importFile = document.querySelector("#importFile");

let date = new Date(),
currYear = date.getFullYear(),
selectedDayElement = null,
selectedEmojiIndex = 0,
currentTaskId = null,
editingTaskId = null,
statsMonthsOpen = new Set();

const months = ["一月", "二月", "三月", "四月", "五月", "六月", "七月",
              "八月", "九月", "十月", "十一月", "十二月"];

const emojis = ["😀", "🙂", "😐", "🙁", "☹️"];

const getDateKey = (year, month, day) => `${year}-${month}-${day}`;

const loadTasks = () => {
    const saved = localStorage.getItem("calendarTasks");
    if (saved) return JSON.parse(saved);
    const defaultTask = { id: "default", name: "默认任务", color: "#4b9cd3", emojis: {}, comments: {}, lastEditYear: null, lastEditMonth: null };
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
    task.emojis[key] = index;
    task.lastEditYear = year;
    task.lastEditMonth = month;
    saveTasks(tasks);
};

const getComment = (year, month, day) => {
    const task = getCurrentTask();
    if (!task.comments) return "";
    const key = getDateKey(year, month, day);
    return task.comments[key] || "";
};

const saveComment = (year, month, day, comment) => {
    const tasks = loadTasks();
    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) return;
    if (!task.comments) task.comments = {};
    const key = getDateKey(year, month, day);
    if (comment.trim()) {
        task.comments[key] = comment.trim();
    } else {
        delete task.comments[key];
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

const scoreMap = {1:100, 2:75, 3:50, 4:25, 5:0};

const renderMonthStats = (i) => {
    const lastDate = new Date(currYear, i + 1, 0).getDate();
    let occupied = 0, success = 0, scoreSum = 0;
    let commentsList = [];
    let dailyScores = [];
    
    for (let d = 1; d <= lastDate; d++) {
        let idx = getEmojiIndex(currYear, i, d);
        let score = idx > 0 ? (scoreMap[idx] || 0) : null;
        dailyScores.push(score);
        
        if (idx > 0) {
            occupied++;
            scoreSum += scoreMap[idx] || 0;
            if (idx <= 2) success++;
        }
        let comment = getComment(currYear, i, d);
        if (comment) {
            let emoji = idx > 0 ? emojis[idx - 1] : "";
            commentsList.push(`<div class="comment-item" data-month="${i}" data-day="${d}"><span class="comment-date">${String(d).padStart(2, '0')}</span><span class="comment-emoji">${emoji}</span><span class="comment-text">${comment}</span></div>`);
        }
    }
    
    let workingPct = lastDate ? (occupied / lastDate * 100).toFixed(1) : "0";
    let successPct = occupied ? (success / occupied * 100).toFixed(1) : "0";
    let avgScore = occupied ? (scoreSum / occupied).toFixed(1) : "0";
    let commentsHtml = commentsList.length ? `<div class="comments-list">${commentsList.join("")}</div>` : "";
    
    let chartHtml = "";
    if (occupied > 0) {
        const chartId = `chart-${i}-${Date.now()}`;
        chartHtml = `<div class="score-chart-container"><canvas id="${chartId}" class="score-chart"></canvas></div>`;
        setTimeout(() => {
            const canvas = document.getElementById(chartId);
            if (canvas) drawScoreChart(canvas, dailyScores);
        }, 0);
    }
    
    return `
        ${chartHtml}
        <div class="stats-row"><span class="stats-label">尝试天数</span><span class="stats-value">${occupied}/${lastDate}</span><span class="stats-pct">${workingPct} %</span></div>
        <div class="stats-bar"><div class="stats-bar-fill" style="width:${workingPct}%;background:#4b9cd3;"></div></div>
        <div class="stats-row"><span class="stats-label">成功天数</span><span class="stats-value">${success}/${occupied}</span><span class="stats-pct">${successPct} %</span></div>
        <div class="stats-bar"><div class="stats-bar-fill" style="width:${successPct}%;background:#2ecc71;"></div></div>
        <div class="stats-row"><span class="stats-label">平均得分</span><span class="stats-value">${avgScore}</span><span class="stats-pct">${avgScore}</span></div>
        <div class="stats-bar"><div class="stats-bar-fill" style="width:${avgScore}%;background:#e67e22;"></div></div>
        ${commentsHtml}
    `;
};

const drawScoreChart = (canvas, scores) => {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth;
    const height = 80;
    const padding = 20;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding;
    
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(width - padding, padding);
    ctx.stroke();
    
    const validScores = scores.filter(s => s !== null);
    if (validScores.length === 0) return;
    
    const stepX = chartWidth / (scores.length - 1 || 1);
    
    ctx.strokeStyle = "#4b9cd3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let firstPoint = true;
    scores.forEach((score, index) => {
        if (score !== null) {
            const x = padding + index * stepX;
            const y = padding + chartHeight * (1 - score / 100);
            
            if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                ctx.lineTo(x, y);
            }
        }
    });
    
    ctx.stroke();
    
    ctx.fillStyle = "#4b9cd3";
    scores.forEach((score, index) => {
        if (score !== null) {
            const x = padding + index * stepX;
            const y = padding + chartHeight * (1 - score / 100);
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
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

const renderEmojiGrid = (selectedIdx) => {
    let emojiTag = "";
    for (let i = 0; i < emojis.length; i++) {
        let selected = (i + 1 === selectedIdx) ? "selected" : "";
        emojiTag += `<span data-index="${i + 1}" class="${selected}">${emojis[i]}</span>`;
    }
    emojiGrid.innerHTML = emojiTag;
};

renderEmojiGrid(0);

emojiGrid.addEventListener("click", (e) => {
    if (e.target.tagName === "SPAN") {
        let index = parseInt(e.target.dataset.index);
        if (!isNaN(index)) {
            if (selectedEmojiIndex === index) {
                selectedEmojiIndex = 0;
            } else {
                selectedEmojiIndex = index;
            }
            renderEmojiGrid(selectedEmojiIndex);
        }
    }
});

const closeEmojiPopupFn = () => {
    emojiPopup.classList.remove("show");
    selectedDayElement = null;
    selectedEmojiIndex = 0;
};

const saveEmojiAndComment = () => {
    if (!selectedDayElement) return;
    const month = parseInt(selectedDayElement.dataset.month);
    const day = parseInt(selectedDayElement.dataset.day);
    if (isNaN(day)) return;
    
    if (selectedEmojiIndex === 0) {
        const tasks = loadTasks();
        const task = tasks.find(t => t.id === currentTaskId);
        if (task) {
            const key = getDateKey(currYear, month, day);
            delete task.emojis[key];
            saveTasks(tasks);
        }
    } else {
        saveEmojiIndex(currYear, month, day, selectedEmojiIndex);
    }
    
    saveComment(currYear, month, day, commentInput.value);
    renderYearView();
    closeEmojiPopupFn();
};

closeEmojiPopup.addEventListener("click", closeEmojiPopupFn);
emojiPopup.addEventListener("click", (e) => {
    if (e.target === emojiPopup) closeEmojiPopupFn();
});

document.querySelector("#saveEmojiBtn").addEventListener("click", saveEmojiAndComment);

document.querySelector("#deleteEmojiBtn").addEventListener("click", () => {
    if (!selectedDayElement) return;
    const month = parseInt(selectedDayElement.dataset.month);
    const day = parseInt(selectedDayElement.dataset.day);
    if (isNaN(day)) return;
    
    const tasks = loadTasks();
    const task = tasks.find(t => t.id === currentTaskId);
    if (task) {
        const key = getDateKey(currYear, month, day);
        delete task.emojis[key];
        if (task.comments) delete task.comments[key];
        saveTasks(tasks);
    }
    
    renderYearView();
    closeEmojiPopupFn();
});

let singleClickTimer = null;

monthsTag.addEventListener("click", (e) => {
    if (e.target.classList.contains("month-title")) {
        const monthIdx = parseInt(e.target.dataset.month);
        
        if (singleClickTimer) {
            clearTimeout(singleClickTimer);
            singleClickTimer = null;
        }
        
        singleClickTimer = setTimeout(() => {
            if (statsMonthsOpen.has(monthIdx)) {
                statsMonthsOpen.delete(monthIdx);
            } else {
                statsMonthsOpen.add(monthIdx);
            }
            renderYearView();
            singleClickTimer = null;
        }, 250);
        return;
    }
    
    const commentItem = e.target.closest(".comment-item");
    if (commentItem) {
        const month = parseInt(commentItem.dataset.month);
        const day = parseInt(commentItem.dataset.day);
        if (!isNaN(day)) {
            selectedEmojiIndex = getEmojiIndex(currYear, month, day);
            renderEmojiGrid(selectedEmojiIndex);
            commentInput.value = getComment(currYear, month, day);
            selectedDayElement = { dataset: { month: month, day: day } };
            selectedDateEl.innerText = `${currYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            emojiPopup.classList.add("show");
        }
        return;
    }
    
    if (e.target.tagName === "SPAN" && !e.target.classList.contains("empty") && e.target.dataset.day) {
        selectedDayElement = e.target;
        const month = parseInt(e.target.dataset.month);
        const day = parseInt(e.target.dataset.day);
        selectedEmojiIndex = getEmojiIndex(currYear, month, day);
        renderEmojiGrid(selectedEmojiIndex);
        commentInput.value = getComment(currYear, month, day);
        selectedDateEl.innerText = `${currYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        emojiPopup.classList.add("show");
    }
});

monthsTag.addEventListener("dblclick", (e) => {
    if (e.target.classList.contains("month-title")) {
        if (singleClickTimer) {
            clearTimeout(singleClickTimer);
            singleClickTimer = null;
        }
        if (statsMonthsOpen.size === 12) {
            statsMonthsOpen.clear();
        } else {
            for (let i = 0; i < 12; i++) statsMonthsOpen.add(i);
        }
        renderYearView();
        e.preventDefault();
    }
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

currentDate.addEventListener("click", () => {
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
        deleteTaskBtn.style.display = "block";
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
    deleteTaskBtn.style.display = "none";
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
            emojis: {},
            comments: {},
            lastEditYear: null,
            lastEditMonth: null
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

deleteTaskBtn.addEventListener("click", () => {
    if (!editingTaskId) return;
    const tasks = loadTasks();
    const idx = tasks.findIndex(t => t.id === editingTaskId);
    if (idx === -1) return;
    
    tasks.splice(idx, 1);
    saveTasks(tasks);
    
    if (currentTaskId === editingTaskId) {
        currentTaskId = tasks[0]?.id || null;
        if (currentTaskId) localStorage.setItem("currentTaskId", currentTaskId);
    }
    
    taskEditPopup.classList.remove("show");
    renderTaskList();
    renderYearView();
});

exportBtn.addEventListener("click", () => {
    const data = {
        calendarTasks: loadTasks(),
        currentTaskId: localStorage.getItem("currentTaskId") || loadTasks()[0].id
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const filename = `calendar_backup_${new Date().toISOString().slice(0,10)}.json`;
    
    let downloadSuccess = false;
    
    try {
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        downloadSuccess = true;
    } catch (e) {
        try {
            const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(jsonStr);
            const a = document.createElement("a");
            a.href = dataUri;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            downloadSuccess = true;
        } catch (e2) {
            downloadSuccess = false;
        }
    }
    
    if (!downloadSuccess) {
        const textArea = document.createElement("textarea");
        textArea.value = jsonStr;
        textArea.style.position = "fixed";
        textArea.style.top = "50%";
        textArea.style.left = "50%";
        textArea.style.transform = "translate(-50%, -50%)";
        textArea.style.width = "80%";
        textArea.style.height = "300px";
        textArea.style.zIndex = "10000";
        textArea.style.background = "white";
        textArea.style.border = "2px solid #4b9cd3";
        textArea.style.borderRadius = "8px";
        textArea.style.padding = "10px";
        textArea.style.fontFamily = "monospace";
        textArea.style.fontSize = "12px";
        document.body.appendChild(textArea);
        textArea.select();
        
        const hint = document.createElement("div");
        hint.innerText = "请复制上方数据并保存为 " + filename;
        hint.style.position = "fixed";
        hint.style.top = "calc(50% + 170px)";
        hint.style.left = "50%";
        hint.style.transform = "translateX(-50%)";
        hint.style.zIndex = "10000";
        hint.style.background = "#4b9cd3";
        hint.style.color = "white";
        hint.style.padding = "10px 20px";
        hint.style.borderRadius = "8px";
        hint.style.cursor = "pointer";
        document.body.appendChild(hint);
        
        hint.onclick = () => {
            document.body.removeChild(textArea);
            document.body.removeChild(hint);
        };
        
        textArea.onclick = () => {
            textArea.select();
        };
    }
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

let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

const handleSwipe = () => {
    if (emojiPopup.classList.contains("show") ||
        taskPopup.classList.contains("show") ||
        taskEditPopup.classList.contains("show")) {
        return;
    }
    
    const swipeThreshold = 183;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) < swipeThreshold) return;
    
    const tasks = loadTasks();
    if (tasks.length <= 1) return;
    
    const currentIdx = tasks.findIndex(t => t.id === currentTaskId);
    if (currentIdx === -1) return;
    
    let newIdx;
    if (diff > 0) {
        newIdx = (currentIdx + 1) % tasks.length;
    } else {
        newIdx = (currentIdx - 1 + tasks.length) % tasks.length;
    }
    
    currentTaskId = tasks[newIdx].id;
    localStorage.setItem("currentTaskId", currentTaskId);
    
    if (tasks[newIdx].lastEditYear) {
        currYear = tasks[newIdx].lastEditYear;
    }
    
    renderYearView();
    
    const monthCards = document.querySelectorAll(".month-card");
    monthCards.forEach((card, index) => {
        card.classList.add("swipe-animate");
        card.style.animationDelay = `${index * 0.06}s`;
    });
    
    setTimeout(() => {
        monthCards.forEach(card => {
            card.classList.remove("swipe-animate");
            card.style.animationDelay = "";
        });
    }, 300 + monthCards.length * 60);
    
    scrollToLastEditMonth();
};
