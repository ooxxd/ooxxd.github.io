const CATEGORIES = [
  "개발",
  "CTF/Wargame",
  "Bug Bounty",
  "블로그/기술문서",
  "논문/컨퍼런스",
  "공모전/자격증"
];

const STORAGE = {
  posts: "ooxxd_posts_v3",
  profile: "ooxxd_profile",
  logo: "ooxxd_logo",
  todo: "ooxxd_todo_v2",
  theme: "ooxxd_theme",
  about: "ooxxd_about_v2",
  deleted: "ooxxd_deleted_posts"
};

const DEFAULT_ABOUT = {
  intro: "정보보안을 공부하며 CTF 문제 풀이와 개발 경험을 기록하고 있습니다. 문제의 정답뿐 아니라 해결 과정과 취약점의 원리를 이해하는 것을 중요하게 생각합니다.",
  interests: "Web Security · CTF · Wargame · Secure Coding · Development",
  goal: "공부한 내용을 다시 설명할 수 있도록 정리하고 꾸준히 기록하는 것이 목표입니다.",
  shortBio: "보안과 개발을 공부하며 기록하는 공간"
};

const DEFAULT_TODOS = [
  { text: "CTF 꾸준히 풀기", checked: false },
  { text: "관심 취약점 공부하기", checked: false },
  { text: "논문 1편 읽고 정리하기", checked: false },
  { text: "블로그 글 주 1회 작성하기", checked: false }
];

let publishedPosts = [];
let localPosts = [];
let deletedIds = [];
let calendarDate = new Date();
let aboutInfo = { ...DEFAULT_ABOUT };
let todos = [...DEFAULT_TODOS];

const $ = selector => document.querySelector(selector);

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function notify(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.style.display = "block";
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => {
    toast.style.display = "none";
  }, 2600);
}

function loadJSON(key, fallback) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function allPosts() {
  const map = new Map();

  publishedPosts.forEach(post => map.set(post.id, post));
  localPosts.forEach(post => map.set(post.id, post));

  return [...map.values()]
    .filter(post => !deletedIds.includes(post.id))
    .sort((a, b) => b.date.localeCompare(a.date));
}

async function init() {
  try {
    const response = await fetch("./posts.json", { cache: "no-store" });
    const data = await response.json();
    publishedPosts = Array.isArray(data) ? data : [];
  } catch {
    publishedPosts = [];
  }

  localPosts = loadJSON(STORAGE.posts, []);
  deletedIds = loadJSON(STORAGE.deleted, []);
  aboutInfo = loadJSON(STORAGE.about, DEFAULT_ABOUT);
  todos = loadJSON(STORAGE.todo, DEFAULT_TODOS);

  setupTheme();
  setupImages();
  renderTodoWidget();
  renderWidgetTags();
  updateProfileWidget();
  setupEvents();
  renderPage();
}

function setupTheme() {
  if (localStorage.getItem(STORAGE.theme) === "light") {
    document.body.classList.add("light");
  }
}

function setupImages() {
  loadImage(STORAGE.profile, "#profile-img", "#profile-placeholder");
  loadImage(STORAGE.logo, "#logo-img", "#logo-placeholder");

  $("#profile-button").onclick = () => $("#profile-upload").click();
  $("#logo-button").onclick = () => $("#logo-upload").click();

  $("#profile-upload").onchange = event =>
    handleImage(event, STORAGE.profile, "#profile-img", "#profile-placeholder");

  $("#logo-upload").onchange = event =>
    handleImage(event, STORAGE.logo, "#logo-img", "#logo-placeholder");
}

function loadImage(key, imgSelector, placeholderSelector) {
  const saved = localStorage.getItem(key);
  const img = $(imgSelector);
  const placeholder = $(placeholderSelector);

  if (saved) {
    img.src = saved;
    img.hidden = false;
    placeholder.hidden = true;
  } else if (img && img.complete && img.naturalWidth > 0) {
    placeholder.hidden = true;
  }
}

function handleImage(event, key, imgSelector, placeholderSelector) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    notify("이미지 파일만 업로드해 주세요.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem(key, reader.result);
    $(imgSelector).src = reader.result;
    $(imgSelector).hidden = false;
    $(placeholderSelector).hidden = true;
    notify("이 브라우저에 이미지가 저장됐어요.");
  };
  reader.readAsDataURL(file);
}

function updateProfileWidget() {
  const bio = aboutInfo.shortBio || DEFAULT_ABOUT.shortBio;
  const widgetText = document.querySelector(".profile-row + div p");
  if (widgetText) widgetText.textContent = bio;
}

function renderTodoWidget() {
  const wrap = $("#todo-list");
  wrap.innerHTML = todos.map((todo, index) => `
    <div class="todo-item">
      <input type="checkbox" data-todo-check="${index}" ${todo.checked ? "checked" : ""}>
      <input class="todo-text" data-todo-text="${index}" value="${escapeHTML(todo.text)}">
      <button class="todo-remove" data-todo-remove="${index}">×</button>
    </div>
  `).join("");
}

function saveTodos() {
  saveJSON(STORAGE.todo, todos);
  notify("todo가 저장됐어요.");
}

function addTodo() {
  todos.push({ text: "새 할 일", checked: false });
  renderTodoWidget();
}

function heading(title, description = "", showWrite = true) {
  return `
    <div class="page-heading-row">
      <header class="page-heading">
        <h1>${escapeHTML(title)}</h1>
        ${description ? `<p>${escapeHTML(description)}</p>` : ""}
      </header>
      <div class="page-heading-actions">
        ${showWrite ? `<button class="action-button" data-page="write">+ 새 글 작성</button>` : ""}
        <button class="action-button" data-page="home">Home</button>
      </div>
    </div>
  `;
}

function hero() {
  return `
    <section class="window hero">
      <div class="window-bar">
        <span>✿ welcome.exe</span><span>─ □ ×</span>
      </div>
      <div class="hero-content">
        <h1>Security Study Log_</h1>
        <div class="hero-subtitle">개발하고, 분석하고, 기록하는 보안 학습 블로그</div>
        <p>
          CTF 문제 풀이부터 취약점 분석, 개발, 논문 정리까지<br>
          보안 공부 과정과 기록을 차곡차곡 남기는 공간입니다.
        </p>
        <div class="actions">
          <button class="btn primary" data-page="archives">▤ 최신 글 보러가기 →</button>
          <button class="btn" data-page="about">About Me</button>
        </div>
      </div>
    </section>
  `;
}

function postCard(post) {
  const icons = {
    "개발": "⌘",
    "CTF/Wargame": "</>",
    "Bug Bounty": "♢",
    "블로그/기술문서": "▤",
    "논문/컨퍼런스": "▣",
    "공모전/자격증": "★"
  };

  return `
    <div class="post-card-wrap">
      <button class="post-card" data-post="${escapeHTML(post.id)}">
        <span class="post-icon">${escapeHTML(icons[post.category] || "▤")}</span>
        <div class="post-details">
          <h3>${escapeHTML(post.title)}</h3>
          <div class="post-date">${escapeHTML(post.date)}</div>
          <div class="pills">
            ${(post.tags || []).map(tag => `<span class="pill">#${escapeHTML(tag)}</span>`).join("")}
          </div>
          <p class="post-description">${escapeHTML(post.summary || "")}</p>
        </div>
      </button>
      <div class="post-actions">
        <button data-edit="${escapeHTML(post.id)}">수정</button>
        <button data-delete="${escapeHTML(post.id)}">삭제</button>
      </div>
    </div>
  `;
}

function postList(posts) {
  return posts.length
    ? posts.map(postCard).join("")
    : `<p class="empty">아직 등록된 게시글이 없습니다.</p>`;
}

function calendarHTML() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const postDates = new Set(allPosts().map(post => post.date));

  let cells = ["일","월","화","수","목","금","토"]
    .map(day => `<div class="calendar-day heading">${day}</div>`).join("");

  for (let i = 0; i < firstDay; i++) {
    cells += `<div></div>`;
  }

  for (let day = 1; day <= lastDate; day++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const hasPost = postDates.has(date);
    const isToday = today.getFullYear() === year &&
                    today.getMonth() === month &&
                    today.getDate() === day;

    const className = [
      "calendar-day",
      hasPost ? "has-post" : "",
      isToday ? "today" : ""
    ].join(" ");

    cells += hasPost
      ? `<button class="${className}" data-day="${date}">${day}</button>`
      : `<div class="${className}">${day}</div>`;
  }

  return `
    <section class="dashboard-card">
      <div class="calendar-header">
        <button data-calendar="-1">‹</button>
        <strong>${year}년 ${month + 1}월</strong>
        <button data-calendar="1">›</button>
      </div>
      <div class="calendar-grid">${cells}</div>
      <p class="stat-label">노란 날짜를 누르면 그날의 게시글을 볼 수 있어요.</p>
    </section>
  `;
}

function renderHome() {
  const posts = allPosts();
  const categoriesUsed = new Set(posts.map(p => p.category));
  const tagCount = new Set(posts.flatMap(p => p.tags || [])).size;

  $("#page-content").innerHTML = `
    ${hero()}
    <div class="dashboard-grid">
      ${calendarHTML()}
      <section class="dashboard-card">
        <h3>▤ Learning Archive</h3>
        <div class="stat-number">${posts.length}</div>
        <div class="stat-label">작성한 게시글</div>
        <hr style="border:0;border-top:1px dashed #a38b76;margin:18px 0">
        <p>카테고리 <b>${categoriesUsed.size}</b>개</p>
        <p>태그 <b>${tagCount}</b>개</p>
        <button class="action-button" data-page="write">+ 새 글 작성</button>
      </section>
    </div>
    <div class="section-title">
      <h2>▱ 최근 게시글</h2>
      <button data-page="archives">전체 보기 →</button>
    </div>
    ${postList(posts.slice(0, 4))}
  `;
}

function renderAbout() {
  $("#page-content").innerHTML = `
    ${heading("About Me", "ooxxd의 소개 페이지")}
    <section class="content-panel">
      <h2>소개 수정</h2>
      <form id="about-form" class="about-form">
        <label>짧은 소개 (오른쪽 프로필 카드)</label>
        <input class="form-input" name="shortBio" value="${escapeHTML(aboutInfo.shortBio || "")}">

        <label>자기소개</label>
        <textarea class="form-input" name="intro">${escapeHTML(aboutInfo.intro || "")}</textarea>

        <label>관심 분야</label>
        <input class="form-input" name="interests" value="${escapeHTML(aboutInfo.interests || "")}">

        <label>블로그 운영 목표</label>
        <textarea class="form-input" name="goal">${escapeHTML(aboutInfo.goal || "")}</textarea>

        <div class="about-save-wrap form-actions">
          <button type="submit">소개 저장</button>
          <button type="button" id="export-about" class="secondary">소개 설정 내보내기</button>
        </div>
      </form>

      <hr>

      <h2>미리보기</h2>
      <p>${escapeHTML(aboutInfo.intro || "")}</p>
      <h2>관심 분야</h2>
      <p>${escapeHTML(aboutInfo.interests || "")}</p>
      <h2>블로그 운영 목표</h2>
      <p>${escapeHTML(aboutInfo.goal || "")}</p>
    </section>
  `;
}

function renderArchives() {
  $("#page-content").innerHTML = `
    ${heading("Archives", "전체 게시글 목록")}
    ${postList(allPosts())}
  `;
}

function renderCategory(category) {
  const posts = allPosts().filter(post => post.category === category);
  $("#page-content").innerHTML = `
    ${heading(category, `${posts.length}개의 게시글`)}
    ${postList(posts)}
  `;
}

function renderTags() {
  const tags = [...new Set(allPosts().flatMap(post => post.tags || []))];

  $("#page-content").innerHTML = `
    ${heading("Tags", "태그별로 게시글을 볼 수 있어요.")}
    <section class="content-panel">
      <div class="widget-tags">
        ${tags.map(tag => `<button class="tag-button" data-tag="${escapeHTML(tag)}">#${escapeHTML(tag)}</button>`).join("")}
      </div>
    </section>
  `;
}

function renderTagPosts(tag) {
  const posts = allPosts().filter(post => (post.tags || []).includes(tag));
  $("#page-content").innerHTML = `
    ${heading("#" + tag, `${posts.length}개의 게시글`)}
    ${postList(posts)}
  `;
}

function renderDayPosts(date) {
  const posts = allPosts().filter(post => post.date === date);
  $("#page-content").innerHTML = `
    ${heading(date, "이 날짜에 작성한 게시글")}
    ${postList(posts)}
  `;
}

function markdownToHTML(source = "") {
  const lines = String(source).split(/\r?\n/);
  const out = [];
  let inCode = false;
  let codeLines = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      closeList();
      if (inCode) {
        out.push(`<pre><code>${escapeHTML(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      out.push(`<h1>${escapeHTML(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      closeList();
      out.push(`<h2>${escapeHTML(line.slice(3))}</h2>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${escapeHTML(line.slice(2))}</li>`);
    } else if (!line.trim()) {
      closeList();
    } else {
      closeList();
      out.push(`<p>${escapeHTML(line)}</p>`);
    }
  }

  closeList();
  if (inCode) {
    out.push(`<pre><code>${escapeHTML(codeLines.join("\n"))}</code></pre>`);
  }

  return out.join("\n");
}

function renderPost(id) {
  const post = allPosts().find(post => post.id === id);
  if (!post) {
    $("#page-content").innerHTML = heading("게시글을 찾을 수 없습니다.");
    return;
  }

  $("#page-content").innerHTML = `
    ${heading(post.title, `${post.date} · ${post.category}`)}
    <article class="content-panel">
      <div class="pills">
        ${(post.tags || []).map(tag => `<span class="pill">#${escapeHTML(tag)}</span>`).join("")}
      </div>
      <hr>
      <div class="article-body">${markdownToHTML(post.content)}</div>
      <hr>
      <div class="form-actions">
        <button data-page="archives">목록으로</button>
        <button data-edit="${escapeHTML(post.id)}">수정</button>
        <button data-delete="${escapeHTML(post.id)}" class="secondary">삭제</button>
      </div>
    </article>
  `;
}

function renderWrite(id = "") {
  const editing = allPosts().find(post => post.id === id);

  const post = editing || {
    title: "",
    date: new Date().toLocaleDateString("en-CA"),
    category: CATEGORIES[0],
    tags: [],
    summary: "",
    content: ""
  };

  $("#page-content").innerHTML = `
    ${heading(editing ? "게시글 수정" : "새 글 작성", "Markdown으로 작성할 수 있어요.", false)}
    <section class="content-panel">
      <form id="post-form">
        <input type="hidden" name="id" value="${escapeHTML(editing?.id || "")}">

        <div class="form-group">
          <label>제목</label>
          <input class="form-input" name="title" required value="${escapeHTML(post.title)}">
        </div>

        <div class="form-group">
          <label>카테고리</label>
          <select class="form-input" name="category">
            ${CATEGORIES.map(category => `
              <option value="${escapeHTML(category)}" ${category === post.category ? "selected" : ""}>
                ${escapeHTML(category)}
              </option>
            `).join("")}
          </select>
        </div>

        <div class="form-group">
          <label>날짜</label>
          <input class="form-input" name="date" type="date" value="${escapeHTML(post.date)}">
        </div>

        <div class="form-group">
          <label>태그 (쉼표로 구분)</label>
          <input class="form-input" name="tags" value="${escapeHTML((post.tags || []).join(", "))}">
        </div>

        <div class="form-group">
          <label>한 줄 요약</label>
          <input class="form-input" name="summary" value="${escapeHTML(post.summary || "")}">
        </div>

        <div class="form-group">
          <label>본문</label>
          <textarea class="form-input" name="content">${escapeHTML(post.content || "")}</textarea>
        </div>

        <div class="form-actions">
          <button type="submit">저장</button>
          <button type="button" id="preview-btn" class="secondary">미리보기</button>
          <button type="button" id="export-posts" class="secondary">posts.json 내보내기</button>
        </div>
      </form>

      <div id="preview-box" class="article-body" style="display:none;margin-top:20px"></div>
    </section>
  `;
}

function savePost(form) {
  const data = new FormData(form);

  const id = String(data.get("id") || "") || `post-${Date.now()}`;

  const post = {
    id,
    title: String(data.get("title") || "").trim(),
    category: String(data.get("category") || CATEGORIES[0]),
    date: String(data.get("date") || new Date().toLocaleDateString("en-CA")),
    tags: String(data.get("tags") || "")
      .split(",")
      .map(tag => tag.trim().replace(/^#/, ""))
      .filter(Boolean),
    summary: String(data.get("summary") || "").trim(),
    content: String(data.get("content") || "")
  };

  if (!post.title) {
    notify("제목을 입력해 주세요.");
    return;
  }

  deletedIds = deletedIds.filter(item => item !== id);
  localPosts = localPosts.filter(item => item.id !== id);
  localPosts.push(post);

  saveJSON(STORAGE.posts, localPosts);
  saveJSON(STORAGE.deleted, deletedIds);

  renderWidgetTags();
  notify("브라우저에 게시글이 저장됐어요.");
  go("post", id);
}

function deletePost(id) {
  const post = allPosts().find(item => item.id === id);
  if (!post) return;

  if (!confirm(`"${post.title}" 글을 삭제할까요?`)) return;

  localPosts = localPosts.filter(item => item.id !== id);
  if (!deletedIds.includes(id)) deletedIds.push(id);

  saveJSON(STORAGE.posts, localPosts);
  saveJSON(STORAGE.deleted, deletedIds);

  renderWidgetTags();
  notify("현재 브라우저에서 글을 삭제했어요. 모두에게 반영하려면 posts.json도 다시 업로드해야 해요.");
  go("archives");
}

function renderWidgetTags() {
  const tags = [...new Set(allPosts().flatMap(post => post.tags || []))];
  $("#widget-tags").innerHTML = tags.length
    ? tags.map(tag => `<button class="tag-button" data-tag="${escapeHTML(tag)}">#${escapeHTML(tag)}</button>`).join("")
    : `<span>태그가 없습니다.</span>`;
}

function exportPosts() {
  const data = JSON.stringify(allPosts(), null, 2);
  downloadFile("posts.json", data, "application/json");
  notify("posts.json을 다운로드했어요.");
}

function exportAbout() {
  const data = JSON.stringify(aboutInfo, null, 2);
  downloadFile("about.json", data, "application/json");
  notify("about.json을 다운로드했어요.");
}

function downloadFile(name, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function renderSearch(term) {
  const lower = term.toLowerCase();
  const result = allPosts().filter(post =>
    [post.title, post.summary, post.category, post.content, ...(post.tags || [])]
      .join(" ")
      .toLowerCase()
      .includes(lower)
  );

  $("#page-content").innerHTML = `
    ${heading("검색 결과", `"${term}" 검색 결과 ${result.length}건`)}
    ${postList(result)}
  `;
}

function go(page, value = "") {
  const hash = value ? `#/${page}/${encodeURIComponent(value)}` : `#/${page}`;
  if (location.hash === hash) renderPage();
  else location.hash = hash;

  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function routeInfo() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [page = "home", ...rest] = raw.split("/");
  return { page: page || "home", value: decodeURIComponent(rest.join("/")) };
}

function renderPage() {
  const { page, value } = routeInfo();

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.classList.toggle("active", page === "category" && btn.dataset.category === value);
  });

  if (page === "home") renderHome();
  else if (page === "about") renderAbout();
  else if (page === "archives") renderArchives();
  else if (page === "tags") renderTags();
  else if (page === "category") renderCategory(value);
  else if (page === "tag") renderTagPosts(value);
  else if (page === "day") renderDayPosts(value);
  else if (page === "post") renderPost(value);
  else if (page === "write") renderWrite(value);
  else renderHome();
}

function setupEvents() {
  document.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.page) {
      go(button.dataset.page);
      return;
    }

    if (button.dataset.category) {
      go("category", button.dataset.category);
      return;
    }

    if (button.dataset.post) {
      go("post", button.dataset.post);
      return;
    }

    if (button.dataset.tag) {
      go("tag", button.dataset.tag);
      return;
    }

    if (button.dataset.day) {
      go("day", button.dataset.day);
      return;
    }

    if (button.dataset.edit) {
      go("write", button.dataset.edit);
      return;
    }

    if (button.dataset.delete) {
      deletePost(button.dataset.delete);
      return;
    }

    if (button.id === "add-todo-btn") {
      addTodo();
      return;
    }

    if (button.id === "save-todo-btn") {
      saveTodos();
      return;
    }

    if (button.id === "preview-btn") {
      const textarea = document.querySelector('[name="content"]');
      const box = $("#preview-box");
      box.style.display = box.style.display === "none" ? "block" : "none";
      box.innerHTML = markdownToHTML(textarea.value);
      return;
    }

    if (button.id === "export-posts") {
      exportPosts();
      return;
    }

    if (button.id === "export-about") {
      exportAbout();
      return;
    }
  });

  document.addEventListener("input", event => {
    if (event.target.matches("[data-todo-text]")) {
      const index = Number(event.target.dataset.todoText);
      todos[index].text = event.target.value;
    }
  });

  document.addEventListener("change", event => {
    if (event.target.matches("[data-todo-check]")) {
      const index = Number(event.target.dataset.todoCheck);
      todos[index].checked = event.target.checked;
    }
  });

  document.addEventListener("click", event => {
    const remove = event.target.closest("[data-todo-remove]");
    if (remove) {
      const index = Number(remove.dataset.todoRemove);
      todos.splice(index, 1);
      renderTodoWidget();
    }
  });

  document.addEventListener("submit", event => {
    if (event.target.id === "post-form") {
      event.preventDefault();
      savePost(event.target);
      return;
    }

    if (event.target.id === "about-form") {
      event.preventDefault();
      const formData = new FormData(event.target);

      aboutInfo = {
        shortBio: String(formData.get("shortBio") || "").trim(),
        intro: String(formData.get("intro") || "").trim(),
        interests: String(formData.get("interests") || "").trim(),
        goal: String(formData.get("goal") || "").trim()
      };

      saveJSON(STORAGE.about, aboutInfo);
      updateProfileWidget();
      notify("소개가 저장됐어요.");
      renderAbout();
      return;
    }
  });

  $("#search").addEventListener("input", event => {
    const value = event.target.value.trim();
    if (value) renderSearch(value);
    else renderPage();
  });

  $("#theme-toggle").onclick = () => {
    document.body.classList.toggle("light");
    localStorage.setItem(STORAGE.theme, document.body.classList.contains("light") ? "light" : "dark");
  };

  $("#menu-toggle").onclick = () => $("#sidebar").classList.toggle("open");

  window.addEventListener("hashchange", renderPage);
}

document.addEventListener("DOMContentLoaded", init);
