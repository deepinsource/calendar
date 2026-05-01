const daysTag = document.querySelector(".days"),
currentDate = document.querySelector("#currentDate"),
prevNextIcon = document.querySelectorAll(".nav-btn"),
viewBtns = document.querySelectorAll(".view-btn"),
monthsTag = document.querySelector(".months"),
emojiPopup = document.querySelector("#emojiPopup"),
emojiGrid = document.querySelector("#emojiGrid"),
closeEmojiPopup = document.querySelector("#closeEmojiPopup");

let date = new Date(),
currYear = date.getFullYear(),
currMonth = date.getMonth(),
currentView = "month",
selectedDayElement = null;

const months = ["一月", "二月", "三月", "四月", "五月", "六月", "七月",
              "八月", "九月", "十月", "十一月", "十二月"];

const emojis = ["😄", "😀", "😊", "🙂", "😶", "😐", "🙁", "☹️"];


const getDateKey = (year, month, day) => {
    return `${year}-${month}-${day}`;
}

const loadEmojis = () => {
    const saved = localStorage.getItem("calendarEmojis");
    return saved ? JSON.parse(saved) : {};
}

const saveEmoji = (year, month, day, emoji) => {
    const emojis = loadEmojis();
    const key = getDateKey(year, month, day);
    emojis[key] = emoji;
    localStorage.setItem("calendarEmojis", JSON.stringify(emojis));
}

const getEmoji = (year, month, day) => {
    const emojis = loadEmojis();
    const key = getDateKey(year, month, day);
    return emojis[key] || null;
}

const renderCalendar = () => {
    let firstDayofMonth = new Date(currYear, currMonth, 1).getDay(),
    lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate(),
    lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay();
    let liTag = "";

    firstDayofMonth = firstDayofMonth === 0 ? 7 : firstDayofMonth;

    for (let i = 1; i < firstDayofMonth; i++) {
        liTag += `<div class="empty"></div>`;
    }

    for (let i = 1; i <= lastDateofMonth; i++) {
        let isToday = i === date.getDate() && currMonth === new Date().getMonth()
                     && currYear === new Date().getFullYear() ? "active" : "";
        let emoji = getEmoji(currYear, currMonth, i);
        let emojiClass = emoji ? "has-emoji" : "";
        liTag += `<div class="${isToday} ${emojiClass}" data-day="${i}">${emoji || i}</div>`;
    }

    for (let i = lastDayofMonth; i < 7; i++) {
        if(lastDayofMonth === 0) break;
        liTag += `<div class="empty"></div>`;
    }
    currentDate.innerText = `${months[currMonth]} ${currYear}`;
    daysTag.innerHTML = liTag;
}

renderCalendar();

const renderEmojiGrid = () => {
    let emojiTag = "";
    for (let emoji of emojis) {
        emojiTag += `<span>${emoji}</span>`;
    }
    emojiGrid.innerHTML = emojiTag;
}

renderEmojiGrid();

emojiGrid.addEventListener("click", (e) => {
    if (e.target.tagName === "SPAN") {
        let emoji = e.target.innerText;
        let day = parseInt(selectedDayElement.dataset.day);
        if (!isNaN(day)) {
            saveEmoji(currYear, currMonth, day, emoji);
            renderCalendar();
        }
        closeEmojiPopupFn();
    }
});

const closeEmojiPopupFn = () => {
    emojiPopup.classList.remove("show");
    selectedDayElement = null;
}

closeEmojiPopup.addEventListener("click", closeEmojiPopupFn);

emojiPopup.addEventListener("click", (e) => {
    if (e.target === emojiPopup) {
        closeEmojiPopupFn();
    }
});

daysTag.addEventListener("click", (e) => {
    if (e.target.tagName === "DIV" && !e.target.classList.contains("empty") && e.target.dataset.day) {
        selectedDayElement = e.target;
        emojiPopup.classList.add("show");
    }
});

prevNextIcon.forEach(icon => {
    icon.addEventListener("click", () => {
        if (icon.id === "prevYear") {
            currYear = currYear - 1;
        } else if (icon.id === "prevMonth") {
            currMonth = currMonth - 1;
            if (currMonth < 0 || currMonth > 11) {
                date = new Date(currYear, currMonth, new Date().getDate());
                currYear = date.getFullYear();
                currMonth = date.getMonth();
            }
        } else if (icon.id === "nextMonth") {
            currMonth = currMonth + 1;
            if (currMonth < 0 || currMonth > 11) {
                date = new Date(currYear, currMonth, new Date().getDate());
                currYear = date.getFullYear();
                currMonth = date.getMonth();
            }
        } else if (icon.id === "nextYear") {
            currYear = currYear + 1;
        }
        if (currentView === "month") {
            renderCalendar();
        } else {
            renderYearView();
        }
    });
});

const renderYearView = () => {
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
            dayTag += `<span class="${isToday} ${emojiClass}">${emoji || j}</span>`;
        }
        for (let j = lastDayofMonth; j < 7; j++) {
            if(lastDayofMonth === 0) break;
            dayTag += `<span class="empty"></span>`;
        }

        monthTag += `<div class="month-card" data-month="${i}">
            <div class="month-title">${months[i]}</div>
            <div class="mini-days">${dayTag}</div>
        </div>`;
    }
    currentDate.innerText = `${currYear}`;
    monthsTag.innerHTML = monthTag;
}

viewBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        viewBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        if (btn.id === "yearView") {
            currentView = "year";
            renderYearView();
            daysTag.classList.add("hidden");
            monthsTag.classList.remove("hidden");
        } else {
            currentView = "month";
            renderCalendar();
            daysTag.classList.remove("hidden");
            monthsTag.classList.add("hidden");
        }
    });
});

monthsTag.addEventListener("click", (e) => {
    const monthCard = e.target.closest(".month-card");
    if (monthCard) {
        currMonth = parseInt(monthCard.dataset.month);
        currentView = "month";
        viewBtns.forEach(b => b.classList.remove("active"));
        document.querySelector("#monthView").classList.add("active");
        daysTag.classList.remove("hidden");
        monthsTag.classList.add("hidden");
        renderCalendar();
    }
});
