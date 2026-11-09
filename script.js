
const CATEGORIES = [
  "개발",
  "CTF/Wargame",
  "Bug Bounty",
  "블로그/기술문서",
  "논문/컨퍼런스",
  "공모전/자격증"
];

const STORAGE = {
  posts: "ooxxd_posts_v2",
  profile: "ooxxd_profile",
  logo: "ooxxd_logo",
  todo: "ooxxd_todo",
  theme: "ooxxd_theme"
};

let publishedPosts = [];
let localPosts = [];
let query = "";
let calendarDate = new Date();
let previewMode = false;

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

function allPosts() {
  const map = new Map();
  publishedPosts.forEach(p => map.set(p.id, p));
  localPosts.forEach(p => map.set(p.id, p));

  return [...map.values()].sort(
    (a, b) => b.date.localeCompare(a.date)
  );
}

function notify(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.style.display = "block";
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => {
    toast.style.display = "none";
  }, 2700);
}

async function init() {
  try {
    const response = await fetch("./posts.json", { cache: "no-store" });
    if (!response.ok) throw new Error("게시글 파일 없음");
    const data = await response.json();
    publishedPosts = Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(error);
    publishedPosts = [];
    notify("posts.json 파일을 확인해 주세요.");
  }

  try {
    localPosts = JSON.parse(localStorage.getItem(STORAGE.posts)) || [];
    if (!Array.isArray(localPosts)) localPosts = [];
  } catch {
    localPosts = [];
  }

  setupImages();
  setupTodo();
  setupEvents();
  setupTheme();
  renderWidgetTags();
  renderPage();
}

/* 이동 */
function go(page, value = "") {
  const route = value
    ? `#/${page}/${encodeURIComponent(value)}`
    : `#/${page}`;

  if (location.hash === route) renderPage();
  else location.hash = route;

  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function routeInfo() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [page = "home", ...rest] = raw.split("/");
  let value = "";
  try {
    value = decodeURIComponent(rest.join("/"));
  } catch {
    value = rest.join("/");
  }
  return { page: page || "home", value };
}

function heading(title, description = "") {
  return `
    <header class="page-heading">
      <h1 class="pixel">${escapeHTML(title)}</h1>
      ${description ? `<p>${escapeHTML(description)}</p>` : ""}
    </header>
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
        <div class="hero-subtitle">
          개발하고, 분석하고, 기록하는 보안 학습 블로그
        </div>
        <p>
          CTF 문제 풀이부터 취약점 분석, 개발, 논문 정리까지<br>
          보안 공부 과정과 기록을 차곡차곡 남기는 공간입니다.
        </p>
        <div class="actions">
          <button class="btn primary" data-page="archives">
            ▤ 최신 글 보러가기 →
          </button>
          <button class="btn" data-page="about">About Me</button>
        </div>
      </div>
    </section>
  `;
}

/* 게시글 카드 */
function postCard(post) {
  const icons = {
    "개발": "⌘",
    "CTF/Wargame": "</>",
    "Bug Bounty": "♢",
    "블로그/기술문서": "▤",
    "논문/컨퍼런스": "▣",
    "공모전/자격증": "★"
  };

  const pills = (post.tags || []).map(tag =>
    `<span class="pill">#${escapeHTML(tag)}</span>`
  ).join("");

  return `
    <button class="post-card" data-post="${escapeHTML(post.id)}">
      <span class="post-icon">${escapeHTML(icons[post.category] || "▤")}</span>
      <div class="post-details">
        <h3>${escapeHTML(post.title)}</h3>
        <div class="post-date">${escapeHTML(post.date)}</div>
        <div class="pills">${pills}</div>
        <p class="post-description">${escapeHTML(post.summary || "")}</p>
      </div>
    </button>
  `;
}

function postList(posts) {
  return posts.length
    ? posts.map(postCard).join("")
    : `<p class="empty">아직 등록된 게시글이 없습니다.</p>`;
}

/* 캘린더 */
function calendarHTML() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const postDates = new Set(allPosts().map(p => p.date));

  let cells = ["일", "월", "화", "수", "목", "금", "토"]
    .map(day => `<div class="calendar-day heading">${day}</div>`)
    .join("");

  for (let i = 0; i < firstDay; i++) {
    cells += `<div></div>`;
  }

  for (let day = 1; day <= lastDate; day++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const hasPost = postDates.has(date);
    const isToday = (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );

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
        <button data-calendar="-1" aria-label="이전 달">‹</button>
        <strong>${year}년 ${month + 1}월</strong>
        <button data-calendar="1" aria-label="다음 달">›</button>
      </div>
      <div class="calendar-grid">${cells}</div>
      <p class="stat-label">노란 날짜를 누르면 그날의 게시글을 볼 수 있어요.</p>
    </section>
  `;
}

/* Home */
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

/* About */
function renderAbout() {
  $("#page-content").innerHTML = `
    ${heading("About Me", "ooxxd의 소개 페이지")}
    <section class="content-panel">
      <h2>안녕하세요, ooxxd입니다.</h2>
      <p>
        정보보안을 공부하며 CTF 문제 풀이와 개발 경험을 기록하고 있습니다.
        문제의 정답뿐 아니라 해결 과정과 취약점의 원리를 이해하는 것을
        중요하게 생각합니다.
      </p>
      <h2>관심 분야</h2>
      <p>Web Security · CTF · Wargame · Secure Coding · Development</p>
      <h2>블로그 운영 목적</h2>
      <p>
        공부한 내용을 다시 설명할 수 있도록 정리하고
        꾸준히 기록하는 것이 목표입니다.
      </p>
      <h2>프로필 꾸미기</h2>
      <p>오른쪽 프로필 사진을 누르면 사진을 선택할 수 있습니다.</p>
      <p>왼쪽 블로그 제목 위의 아이콘을 누르면 로고 사진을 변경할 수 있습니다.</p>
      <button class="action-button" id="export-images">사진 설정 내보내기</button>
    </section>
  `;
}

/* Archives */
function renderArchives() {
  const posts = allPosts();

  $("#page-content").innerHTML = `
    ${heading("Archives", "게시글을 최신 날짜순으로 정리")}
    <section class="content-panel">
      <div class="form-actions">
        <button data-page="write">+ 새 글 작성</button>
        <button id="export-posts" class="secondary">게시글 JSON 내보내기</button>
      </div>
    </section>
    ${postList(posts)}
  `;
}

/* Category */
function renderCategory(category) {
  const posts = allPosts().filter(p => p.category === category);

  $("#page-content").innerHTML = `
    ${heading(category, `${posts.length}개의 게시글`)}
    ${postList(posts)}
  `;
}

/* Tags */
function renderTags() {
  const tags = [...new Set(allPosts().flatMap(p => p.tags || []))];
  $("#page-content").innerHTML = `
    ${heading("Tags", "태그를 클릭하면 해당 글만 표시됩니다.")}
    <section class="content-panel">
      <div class="tag-cloud">
        ${tags.map(tag => `
          <button class="action-button" data-tag="${escapeHTML(tag)}">
            #${escapeHTML(tag)}
          </button>
        `).join(" ")}
      </div>
    </section>
  `;
}

function renderTagPosts(tag) {
  const posts = allPosts().filter(p => (p.tags || []).includes(tag));
  $("#page-content").innerHTML = `
    ${heading("#" + tag, `${posts.length}개의 게시글`)}
    ${postList(posts)}
  `;
}

function renderDayPosts(date) {
  const posts = allPosts().filter(p => p.date === date);
  $("#page-content").innerHTML = `
    ${heading(date, "이 날짜에 작성한 게시글")}
    ${postList(posts)}
  `;
}

/* Markdown: 기본적인 안전한 렌더러 */
function markdownToHTML(source = "") {
  const lines = String(source).split(/\r?\n/);
  const output = [];
  let inCode = false;
  let codeLines = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      output.push("</ul>");
      listOpen = false;
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      closeList();

      if (inCode) {
        output.push(`<pre><code>${escapeHTML(codeLines.join("\n"))}</code></pre>`);
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
      output.push(`<h1>${escapeHTML(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      closeList();
      output.push(`<h2>${escapeHTML(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      closeList();
      output.push(`<h3>${escapeHTML(line.slice(4))}</h3>`);
    } else if (line.startsWith("- ")) {
      if (!listOpen) {
        output.push("<ul>");
        listOpen = true;
      }
      output.push(`<li>${escapeHTML(line.slice(2))}</li>`);
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      output.push(`<p>${escapeHTML(line)}</p>`);
    }
  }

  closeList();
  if (inCode) {
    output.push(`<pre><code>${escapeHTML(codeLines.join("\n"))}</code></pre>`);
  }

  return output.join("\n");
}

/* Article */
function renderPost(id) {
  const post = allPosts().find(p => p.id === id);
  if (!post) {
    $("#page-content").innerHTML = heading("게시글을 찾을 수 없습니다.");
    return;
  }

  const editable = localPosts.some(p => p.id === id);

  $("#page-content").innerHTML = `
    ${heading(post.title, `${post.date} · ${post.category}`)}
    <article class="content-panel">
      <div class="pills">
        ${(post.tags || []).map(t => `<span class="pill">#${escapeHTML(t)}</span>`).join("")}
      </div>
      <hr>
      <div class="article-body">${markdownToHTML(post.content)}</div>
      <hr>
      <div class="form-actions">
        <button data-page="archives">목록으로</button>
        ${editable ? `
          <button data-edit="${escapeHTML(id)}">수정</button>
          <button data-delete="${escapeHTML(id)}" class="secondary">삭제</button>
        ` : ""}
      </div>
    </article>
  `;
}

/* Write page */
function renderWrite(id = "") {
  const editing = id ? allPosts().find(p => p.id === id) : null;

  // GitHub에 배포된 기존 글은 직접 덮어쓰지 않고
  // 브라우저에 같은 ID의 수정본을 저장한다.
  const post = editing || {
    title: "",
    date: new Date().toLocaleDateString("en-CA"),
    category: CATEGORIES[0],
    tags: [],
    summary: "",
    content: ""
  };

  $("#page-content").innerHTML = `
    ${heading(editing ? "게시글 수정" : "새 글 작성", "Markdown 형식으로 글을 작성할 수 있습니다.")}
    <section class="content-panel">
      <form id="post-form">
        <input type="hidden" name="id" value="${escapeHTML(editing?.id || "")}">

        <div class="form-group">
          <label>제목</label>
          <input class="form-input" name="title" required
                 value="${escapeHTML(post.title)}" placeholder="게시글 제목">
        </div>

        <div class="form-group">
          <label>카테고리</label>
          <select class="form-input" name="category">
            ${CATEGORIES.map(c => `
              <option value="${escapeHTML(c)}" ${c === post.category ? "selected" : ""}>
                ${escapeHTML(c)}
              </option>
            `).join("")}
          </select>
        </div>

        <div class="form-group">
          <label>작성 날짜</label>
          <input class="form-input" name="date" type="date"
                 required value="${escapeHTML(post.date)}">
        </div>

        <div class="form-group">
          <label>태그 (쉼표로 구분)</label>
          <input class="form-input" name="tags"
                 value="${escapeHTML((post.tags || []).join(", "))}"
                 placeholder="CTF, Web, SSTI">
        </div>

        <div class="form-group">
          <label>한 줄 요약</label>
          <input class="form-input" name="summary"
                 value="${escapeHTML(post.summary || "")}">
        </div>

        <div class="form-group">
          <label>본문 (Markdown)</label>
          <textarea class="form-input" name="content"
            placeholder="# 제목&#10;&#10;## 분석 과정&#10;&#10;- 내용">${escapeHTML(post.content || "")}</textarea>
        </div>

        <div class="form-actions">
          <button type="submit">브라우저에 저장</button>
          <button type="button" id="preview-button" class="secondary">미리보기</button>
          <button type="button" id="export-posts" class="secondary">전체 글 JSON 내보내기</button>
        </div>
      </form>

      <div id="markdown-preview" class="article-body" hidden></div>

      <p style="font-size:12px;margin-top:20px">
        브라우저 저장은 공개 배포가 아닙니다.
        모든 방문자에게 게시하려면 JSON 내보내기 후 GitHub의 posts.json을 교체하세요.
      </p>
    </section>
  `;
}

/* 글쓰기 저장 */
function savePost(form) {
  const data = new FormData(form);

  const id = String(data.get("id") || "") ||
    "post-" + Date.now().toString(36);

  const post = {
    id,
    title: String(data.get("title")).trim(),
    category: String(data.get("category")),
    date: String(data.get("date")),
    tags: String(data.get("tags") || "")
      .split(",")
      .map(t => t.trim().replace(/^#/, ""))
      .filter(Boolean),
    summary: String(data.get("summary") || "").trim(),
    content: String(data.get("content") || "")
  };

  if (!post.title || !post.date) {
    notify("제목과 날짜를 입력해 주세요.");
    return;
  }

  localPosts = localPosts.filter(p => p.id !== id);
  localPosts.push(post);

  try {
    localStorage.setItem(STORAGE.posts, JSON.stringify(localPosts));
  } catch {
    notify("저장 공간이 부족합니다.");
    return;
  }

  notify("브라우저에 글을 저장했습니다.");
  renderWidgetTags();
  go("post", id);
}

/* JSON 다운로드 */
function downloadFile(name, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportPosts() {
  const content = JSON.stringify(allPosts(), null, 2);
  downloadFile("posts.json", content);
  notify("posts.json을 다운로드했습니다.");
}

/* 사진 */
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
  const image = $(imgSelector);
  const placeholder = $(placeholderSelector);

  if (saved) {
    image.src = saved;
    image.hidden = false;
    placeholder.hidden = true;
  } else if (!image.hidden && image.complete && image.naturalWidth > 0) {
    placeholder.hidden = true;
  }
}

function handleImage(event, key, imgSelector, placeholderSelector) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    notify("이미지 파일만 선택해 주세요.");
    return;
  }

  if (file.size > 700 * 1024) {
    notify("700KB 이하 이미지로 줄여서 업로드해 주세요.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      localStorage.setItem(key, reader.result);
      $(imgSelector).src = reader.result;
      $(imgSelector).hidden = false;
      $(placeholderSelector).hidden = true;
      notify("이 브라우저에 사진을 저장했습니다.");
    } catch {
      notify("이미지를 저장하지 못했습니다. 용량을 줄여 주세요.");
    }
  };
  reader.readAsDataURL(file);
}

function exportImages() {
  const profile = localStorage.getItem(STORAGE.profile);
  const logo = localStorage.getItem(STORAGE.logo);

  downloadFile("image-settings.json", JSON.stringify({
    profile,
    logo
  }, null, 2));

  notify("이미지 설정을 내보냈습니다.");
}

/* Todo */
function setupTodo() {
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE.todo)) || [];
  } catch {}

  const checks = [...document.querySelectorAll("#todo-list input")];

  checks.forEach((checkbox, i) => {
    checkbox.checked = saved.includes(i);
    checkbox.onchange = () => {
      const completed = checks
        .map((item, index) => item.checked ? index : -1)
        .filter(i => i >= 0);

      localStorage.setItem(STORAGE.todo, JSON.stringify(completed));
    };
  });
}

/* Tags */
function renderWidgetTags() {
  const tags = [...new Set(allPosts().flatMap(p => p.tags || []))];

  $("#widget-tags").innerHTML = tags.length
    ? tags.slice(0, 12).map(tag =>
        `<button class="tag-button" data-tag="${escapeHTML(tag)}">#${escapeHTML(tag)}</button>`
      ).join("")
    : `<span>태그가 없습니다.</span>`;
}

/* Search */
function renderSearch(term) {
  const search = term.toLowerCase();
  const result = allPosts().filter(p =>
    [p.title, p.summary, p.category, ...(p.tags || []), p.content]
      .join(" ")
      .toLowerCase()
      .includes(search)
  );

  $("#page-content").innerHTML = `
    ${heading("검색 결과", `"${term}" 검색 · ${result.length}건`)}
    ${postList(result)}
  `;
}

function setupTheme() {
  if (localStorage.getItem(STORAGE.theme) === "light") {
    document.body.classList.add("light");
  }
}

/* Global events */
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

    if (button.dataset.calendar) {
      calendarDate.setMonth(
        calendarDate.getMonth() + Number(button.dataset.calendar)
      );
      renderHome();
      return;
    }

    if (button.dataset.edit) {
      go("write", button.dataset.edit);
      return;
    }

    if (button.dataset.delete) {
      if (confirm("이 글을 브라우저에서 삭제할까요?")) {
        localPosts = localPosts.filter(p => p.id !== button.dataset.delete);
        localStorage.setItem(STORAGE.posts, JSON.stringify(localPosts));
        renderWidgetTags();
        go("archives");
      }
      return;
    }

    if (button.id === "export-posts") {
      exportPosts();
      return;
    }

    if (button.id === "export-images") {
      exportImages();
      return;
    }

    if (button.id === "preview-button") {
      const source = document.querySelector('[name="content"]').value;
      const target = $("#markdown-preview");
      previewMode = !previewMode;
      target.hidden = !previewMode;
      target.innerHTML = markdownToHTML(source);
      return;
    }
  });

  document.addEventListener("submit", event => {
    if (event.target.id === "post-form") {
      event.preventDefault();
      savePost(event.target);
    }
  });

  $("#search").addEventListener("input", event => {
    query = event.target.value.trim();
    if (query) renderSearch(query);
    else renderPage();
  });

  $("#theme-toggle").onclick = () => {
    document.body.classList.toggle("light");
    localStorage.setItem(
      STORAGE.theme,
      document.body.classList.contains("light") ? "light" : "dark"
    );
  };

  $("#menu-toggle").onclick = () => {
    $("#sidebar").classList.toggle("open");
  };

  window.addEventListener("hashchange", () => {
    query = "";
    $("#search").value = "";
    renderPage();
  });
}

function renderPage() {
  const { page, value } = routeInfo();

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.classList.toggle(
      "active",
      page === "category" && btn.dataset.category === value
    );
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

document.addEventListener("DOMContentLoaded", init);
