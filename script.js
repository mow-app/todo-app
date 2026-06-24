// 通知の許可
if (Notification.permission === "default") {
    Notification.requestPermission();
}

const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const startDate = document.getElementById("startDate");
const dueDate = document.getElementById("dueDate");
const todayText = document.getElementById("today");

// ▼ 現在のジャンル
let currentGenre = "work";

// ▼ ジャンルボタン処理
document.querySelectorAll("#genreButtons button").forEach(btn => {
    btn.addEventListener("click", () => {
        currentGenre = btn.dataset.genre;

        document.querySelectorAll("#genreButtons button")
            .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        loadTasks();
        generateCalendar(new Date().getFullYear(), new Date().getMonth()); // ← ★これを追加！
    });
});

// 今日の日付
window.addEventListener("load", () => {
    function migrateOldTaskFormat() {
    // すでに変換済みなら何もしない
    if (localStorage.getItem("task_format_migrated") === "1") {
        return;
    }

    const genres = ["work", "private", "shopping"];

    genres.forEach(genre => {
        const saved = localStorage.getItem("todo_" + genre);
        if (!saved) return;

        let tasks = JSON.parse(saved);
        let updated = false;

        tasks = tasks.map(t => {
            // 古い形式から「期限：YYYY-MM-DD」を抽出
            const dueMatch = t.info.match(/期限：(\d{4}-\d{2}-\d{2})/);
            const startMatch = t.info.match(/記入日：(\d{4}-\d{2}-\d{2})/);

            if (!dueMatch && !startMatch) return t; // 変換不要

            const start = startMatch ? startMatch[1] : "";
            const due = dueMatch ? dueMatch[1] : "";

            // 新形式に書き換え（残り日数は付けない）
            t.info = `記入日：${start}　期限：${due}`;
            updated = true;

            return t;
        });

        if (updated) {
            localStorage.setItem("todo_" + genre, JSON.stringify(tasks));
        }
    });

    // 変換済みフラグを保存
    localStorage.setItem("task_format_migrated", "1");
}


    const today = new Date().toLocaleDateString("ja-JP");
    todayText.textContent = "今日：" + today;

    document.querySelector('[data-genre="work"]').classList.add("active");
    loadTasks();
    generateCalendar(new Date().getFullYear(), new Date().getMonth());
});

// タスク追加
addBtn.addEventListener("click", () => {
    const text = taskInput.value.trim();
    if (text === "") return;

    addTask(text, startDate.value, dueDate.value, false);
    saveTasks();

    taskInput.value = "";
});

// タスク追加処理
function addTask(text, start, due, completed) {
    const li = document.createElement("li");

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "task-check";
    check.checked = completed;
    check.addEventListener("change", () => {
    if (check.checked) {
        li.classList.add("completed");
        launchConfetti();   // ← ★ここに追加！
    } else {
        li.classList.remove("completed");
    }
    saveTasks();
});



    const title = document.createElement("span");
    title.textContent = text;

    let className = "";
    let remainText = "";

    if (due) {
        const today = new Date();
        const dueDateObj = new Date(due);
        const diff = Math.ceil((dueDateObj - today) / (1000 * 60 * 60 * 24));

        if (diff < 0) {
            className = "due-today";
            remainText = "（期限切れ）";
        } else if (diff === 0) {
            className = "due-today";
            remainText = "（今日が期限）";
        } else if (diff === 1) {
            className = "due-soon";
            remainText = "（明日まで）";
        } else if (diff <= 3) {
            className = "due-later";
            remainText = `（残り ${diff} 日）`;
        }
    }

    if (className) li.classList.add(className);

    const info = document.createElement("div");
    info.className = "task-info";
    info.textContent = `記入日：${start || "未設定"}　期限：${due || "未設定"}　${remainText}`;

    const delBtn = document.createElement("button");
delBtn.classList.add("delete-btn"); // ← これを追加
delBtn.textContent = "";            // ← テキストは消す

    delBtn.addEventListener("click", () => {
        li.remove();
        saveTasks();
    });

    const topRow = document.createElement("div");
    topRow.style.display = "flex";
    topRow.style.alignItems = "center";
    topRow.style.gap = "10px";

    topRow.appendChild(check);
    topRow.appendChild(title);

    li.appendChild(topRow);
    li.appendChild(info);
    li.appendChild(delBtn);

    taskList.appendChild(li);
}

// ▼ 古いタスク形式を新形式に変換する
function migrateOldTaskFormat() {
    const genres = ["work", "private", "shopping"];

    genres.forEach(genre => {
        const saved = localStorage.getItem("todo_" + genre);
        if (!saved) return;

        let tasks = JSON.parse(saved);
        let updated = false;

        tasks = tasks.map(t => {
            // 古い形式から「期限：YYYY-MM-DD」を抽出
            const dueMatch = t.info.match(/期限：(\d{4}-\d{2}-\d{2})/);
            const startMatch = t.info.match(/記入日：(\d{4}-\d{2}-\d{2})/);

            if (!dueMatch && !startMatch) return t; // 変換不要

            const start = startMatch ? startMatch[1] : "";
            const due = dueMatch ? dueMatch[1] : "";

            // 新形式に書き換え
            t.info = `記入日：${start}　期限：${due}`;
            updated = true;

            return t;
        });

        if (updated) {
            localStorage.setItem("todo_" + genre, JSON.stringify(tasks));
        }
    });
}


// 保存（ジャンルごと）
function saveTasks() {
    const tasks = [];
    document.querySelectorAll("#taskList li").forEach(li => {
        const text = li.querySelector("span").textContent;
        const info = li.querySelector(".task-info").textContent;
        const completed = li.querySelector(".task-check").checked;

        tasks.push({ text, info, completed });
    });

    localStorage.setItem("todo_" + currentGenre, JSON.stringify(tasks));
}

// 読み込み（ジャンルごと）
function loadTasks() {
    taskList.innerHTML = "";

    const saved = localStorage.getItem("todo_" + currentGenre);
    if (!saved) return;

    let tasks = JSON.parse(saved);

    tasks.forEach(t => {
        const startMatch = t.info.match(/記入日：(\d{4}-\d{2}-\d{2})/);
        const dueMatch = t.info.match(/期限：(\d{4}-\d{2}-\d{2})/);

        const start = startMatch ? startMatch[1] : "";
        const due = dueMatch ? dueMatch[1] : "";

        addTask(t.text, start, due, t.completed);
    });
}

function launchConfetti() {
    for (let i = 0; i < 400; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");

        const colors = ["#ff4d4d", "#ffcc00", "#66ccff", "#ff99cc", "#99ff99"];
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        // 画面上のランダム位置
        confetti.style.left = Math.random() * window.innerWidth + "px";

        // ランダムサイズ
        const size = Math.random() * 6 + 6;
        confetti.style.width = size + "px";
        confetti.style.height = size + "px";

        // ★ 最初から左右に揺れるためのランダム値
        const startX = (Math.random() * 40 - 20) + "px"; // -20〜20px
        const endX = (Math.random() * 80 - 40) + "px";   // -40〜40px
        confetti.style.setProperty("--start-x", startX);
        confetti.style.setProperty("--end-x", endX);

        // 落下速度（ゆっくり）
        const fallTime = (Math.random() * 3 + 3).toFixed(2) + "s"; // 3〜6秒
        confetti.style.setProperty("--fall-time", fallTime);

        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 6000);
    }
}

// ▼ 日本時間ベースで YYYY-MM-DD を作るヘルパー
function formatDateLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}


function generateCalendar(year, month) {
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";

    const today = new Date();
    const todayStr = formatDateLocal(today);

    // ▼ ヘッダー（前月・タイトル・次月）
    const header = document.createElement("div");
    header.className = "calendar-header";

    const prev = document.createElement("button");
    prev.textContent = "←";
    prev.onclick = () => {
        const newDate = new Date(year, month - 1, 1);
        generateCalendar(newDate.getFullYear(), newDate.getMonth());
    };

    const next = document.createElement("button");
    next.textContent = "→";
    next.onclick = () => {
        const newDate = new Date(year, month + 1, 1);
        generateCalendar(newDate.getFullYear(), newDate.getMonth());
    };

    const title = document.createElement("div");
    title.textContent = `${year}年 ${month + 1}月`;

    header.appendChild(prev);
    header.appendChild(title);
    header.appendChild(next);

    // ▼ グリッド本体
    const grid = document.createElement("div");
    grid.className = "calendar-grid";

    // ▼ 曜日ヘッダー
    ["日","月","火","水","木","金","土"].forEach((d, i) => {
        const cell = document.createElement("div");
        cell.textContent = d;
        cell.style.fontWeight = "bold";
        cell.style.textAlign = "center";

        if (i === 0) cell.style.color = "#e74c3c"; // 日曜
        if (i === 6) cell.style.color = "#3498db"; // 土曜

        grid.appendChild(cell);
    });

    // ▼ その月の1日
    const firstDate = new Date(year, month, 1);
    const firstDayOfWeek = firstDate.getDay();

    // ▼ 空白セル（1日の前のマス）
    for (let i = 0; i < firstDayOfWeek; i++) {
        grid.appendChild(document.createElement("div"));
    }

    // ▼ 現在ジャンルのタスクを取得
    const saved = JSON.parse(localStorage.getItem("todo_" + currentGenre) || "[]");

    // ▼ 日付ループ用の作業用日付
    let d = new Date(year, month, 1);

    while (d.getMonth() === month) {
        const cell = document.createElement("div");
        cell.className = "calendar-day";
        cell.style.position = "relative";

        const dateStr = formatDateLocal(d);   // ← タイムゾーンずれ対策済み
        const dayOfWeek = d.getDay();

        // 日付数字
        cell.textContent = d.getDate();

        // 土日色分け
        if (dayOfWeek === 0) cell.style.color = "#e74c3c"; // 日曜
        if (dayOfWeek === 6) cell.style.color = "#3498db"; // 土曜

        // 今日
        if (dateStr === todayStr) {
            cell.classList.add("calendar-today");
        }

        // ▼ その日のタスクを抽出（期限：YYYY-MM-DD と完全一致）
        const tasksForDay = saved.filter(t => {
            const dueMatch = t.info.match(/期限：(\d{4}-\d{2}-\d{2})/);
            if (!dueMatch) return false;
            return dueMatch[1] === dateStr;
        });

        if (tasksForDay.length > 0) {
            cell.classList.add("calendar-has-task");

            const badge = document.createElement("div");
            badge.className = "calendar-badge";
            badge.textContent = tasksForDay.length;
            cell.appendChild(badge);
        }

        // ▼ 日付クリックでその日のタスクだけ表示（既存の filterTasksByDate を利用）
        cell.onclick = () => filterTasksByDate(dateStr);

        grid.appendChild(cell);

        // 次の日へ
        d.setDate(d.getDate() + 1);
    }

    calendar.appendChild(header);
    calendar.appendChild(grid);
}
