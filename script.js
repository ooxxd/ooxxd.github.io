
/* ==========================================
   ooxxd's Security Note
   GitHub Pages + Jekyll Blog

   - 읽기 전용 블로그
   - Markdown 게시글 자동 표시
   - 카테고리 / 태그 / 검색
   - 게시글 캘린더
   - Archives / About
   - 다크 / 라이트 모드
========================================== */

/* ---------- 기본 설정 ---------- */

const BLOG = {
  name: "ooxxd",
  title: "Security Note",
  github: "https://github.com/ooxxd"
};

const CATEGORIES = [
  "개발",
  "CTF/Wargame",
  "Bug Bounty",
  "블로그/기술문서",
  "논문/컨퍼런스",
  "공모전/자격증"
];

const CATEGORY_ICONS = {
  "개발": "⌘",
  "CTF/Wargame": "</>",
  "Bug Bounty": "♢",
  "블로그/기술문서": "▤",
  "논문/컨퍼런스": "▣",
  "공모전/자격증": "★"
};

const THEME_KEY = "ooxxd_theme";

let posts = [];
let calendarDate = new Date();

/* ---------- 공통 유틸리티 ---------- */

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

function formatDate(date) {
  return String(date || "").replace(/-/g, ".");
}

function displayError(message) {
  const area = $("#page-content");
  if (!area) return;

  area.innerHTML = `
    <section class="content-panel">
      <h2>게시글을 불러오지 못했습니다.</h2>
      <p>${escapeHTML(message)}</p>
    </section>
  `;
}

function showEmpty(message = "아직 등록된 게시글이 없습니다.") {
  return `<p class="empty">${escapeHTML(message)}</p>`;
}

/* ---------- 게시글 불러오기 ---------- */

async function loadPosts() {
  const response = await fetch(
    "./posts-feed.json",
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      "posts.json 파일을 확인해 주세요."
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      "posts.json은 배열 형식이어야 합니다."
    );
  }

  posts = data
    .filter(post => post && post.url && post.title)
    .map(post => ({
      id: String(post.id || post.url),
      title: String(post.title),
      date: String(post.date || ""),
      category: String(
        post.category || "블로그/기술문서"
      ),
      tags: Array.isArray(post.tags)
        ? post.tags.map(String)
        : [],
      summary: String(post.summary || ""),
      url: String(post.url)
    }))
    .sort((a, b) =>
      b.date.localeCompare(a.date)
    );
}

function allPosts() {
  return [...posts];
}

/* ---------- 화면 제목 ---------- */

function heading(title, description = "") {
  return `
    <header class="page-heading">
      <h1 class="pixel">
        ${escapeHTML(title)}
      </h1>

      ${description ? `
        <p>${escapeHTML(description)}</p>
      ` : ""}
    </header>
  `;
}

/* ---------- 메인 소개 화면 ---------- */

function hero() {
  return `
    <section class="window hero">

      <div class="window-bar">
        <span>✿ welcome.exe</span>
        <span>─ □ ×</span>
      </div>

      <div class="hero-content">

        <h1>Security Study Log_</h1>

        <div class="hero-subtitle">
          개발하고, 분석하고, 기록하는 보안 학습 블로그
        </div>

        <p>
          CTF 문제 풀이부터 취약점 분석,
          개발, 논문 정리까지<br>
          보안 공부 과정과 기록을
          차곡차곡 남기는 공간입니다.
        </p>

        <div class="actions">

          <button
            class="btn primary"
            data-page="archives">
            ▤ 최신 글 보러가기 →
          </button>

          <button
            class="btn"
            data-page="about">
            About Me
          </button>

        </div>
      </div>
    </section>
  `;
}

/* ---------- 게시글 카드 ---------- */

function postCard(post) {
  const icon =
    CATEGORY_ICONS[post.category] || "▤";

  const tags = post.tags.map(tag => `
    <span class="pill">
      #${escapeHTML(tag)}
    </span>
  `).join("");

  return `
    <button
      class="post-card"
      data-post="${escapeHTML(post.id)}">

      <span class="post-icon">
        ${escapeHTML(icon)}
      </span>

      <div class="post-details">

        <h3>
          ${escapeHTML(post.title)}
        </h3>

        <div class="post-date">
          ${escapeHTML(formatDate(post.date))}
        </div>

        <div class="pills">
          ${tags}
        </div>

        <p class="post-description">
          ${escapeHTML(post.summary)}
        </p>

      </div>
    </button>
  `;
}

function postList(list) {
  if (!list.length) {
    return showEmpty();
  }

  return list.map(postCard).join("");
}

/* ---------- 캘린더 ---------- */

function calendarHTML() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDay =
    new Date(year, month, 1).getDay();

  const lastDate =
    new Date(year, month + 1, 0).getDate();

  const today = new Date();

  const datesWithPosts = new Set(
    posts.map(post => post.date)
  );

  const weekdays = [
    "일", "월", "화", "수", "목", "금", "토"
  ];

  let cells = weekdays.map(day => `
    <div class="calendar-day heading">
      ${day}
    </div>
  `).join("");

  for (let i = 0; i < firstDay; i++) {
    cells += "<div></div>";
  }

  for (let day = 1; day <= lastDate; day++) {
    const date =
      `${year}-` +
      `${String(month + 1).padStart(2, "0")}-` +
      `${String(day).padStart(2, "0")}`;

    const hasPost = datesWithPosts.has(date);

    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;

    const classes = [
      "calendar-day",
      hasPost ? "has-post" : "",
      isToday ? "today" : ""
    ].filter(Boolean).join(" ");

    if (hasPost) {
      cells += `
        <button
          class="${classes}"
          data-day="${date}"
          title="${date} 게시글 보기">
          ${day}
        </button>
      `;
    } else {
      cells += `
        <div class="${classes}">
          ${day}
        </div>
      `;
    }
  }

  return `
    <section class="dashboard-card">

      <div class="calendar-header">

        <button
          data-calendar="-1"
          aria-label="이전 달">
          ‹
        </button>

        <strong>
          ${year}년 ${month + 1}월
        </strong>

        <button
          data-calendar="1"
          aria-label="다음 달">
          ›
        </button>

      </div>

      <div class="calendar-grid">
        ${cells}
      </div>

      <p class="stat-label">
        노란색 날짜를 누르면
        해당 날짜의 게시글을 볼 수 있어요.
      </p>

    </section>
  `;
}


/* ===========================================
   Home Dashboard
=========================================== */

function renderHome() {
  const list = allPosts();

  // 실제 게시글에서 통계 계산
  const categoryCounts = {};

  CATEGORIES.forEach(category => {
    categoryCounts[category] = list.filter(
      post => post.category === category
    ).length;
  });

  const usedCategories = CATEGORIES.filter(
    category => categoryCounts[category] > 0
  ).length;

  const uniqueTags = new Set(
    list.flatMap(post => post.tags || [])
  );

  // 최근 작성한 게시글
  const latestPost = list[0];

  // 카테고리 카드 생성
  const categoryCards = CATEGORIES.map(category => {
    const count = categoryCounts[category];

    return `
      <button
        class="home-category-card"
        data-category="${escapeHTML(category)}">

        <span class="home-category-name">
          ▱ ${escapeHTML(category)}
        </span>

        <span class="home-category-count">
          ${count} posts →
        </span>

      </button>
    `;
  }).join("");

  $("#page-content").innerHTML = `
    ${hero()}

    <!-- 학습 현황 -->
    <section class="home-section">
      <div class="section-title">
        <h2>▤ 학습 아카이브</h2>
      </div>

      <div class="home-stats">

        <div class="home-stat">
          <strong>${list.length}</strong>
          <span>전체 게시글</span>
        </div>

        <div class="home-stat">
          <strong>${usedCategories}</strong>
          <span>기록한 카테고리</span>
        </div>

        <div class="home-stat">
          <strong>${uniqueTags.size}</strong>
          <span>사용한 태그</span>
        </div>

      </div>
    </section>

    <!-- 카테고리 바로가기 -->
    <section class="home-section">
      <div class="section-title">
        <h2>▱ Categories</h2>
      </div>

      <div class="home-category-grid">
        ${categoryCards}
      </div>
    </section>

    <!-- 학습 캘린더 -->
    <section class="home-section">
      <div class="section-title">
        <h2>▦ Study Calendar</h2>
      </div>

      <div class="home-calendar-wrap">
        ${calendarHTML()}
      </div>
    </section>

    <!-- 최신 기록 -->
    <section class="home-section">
      <div class="section-title">
        <h2>▤ Latest Record</h2>
      </div>

      ${
        latestPost
          ? postCard(latestPost)
          : showEmpty("첫 번째 게시글을 작성해 보세요.")
      }
    </section>

    <!-- 최근 게시글 -->
    <section class="home-section">
      <div class="section-title">
        <h2>▱ 최근 게시글</h2>
        <button data-page="archives">
          전체 보기 →
        </button>
      </div>

      ${postList(list.slice(0, 5))}
    </section>
  `;
}

/* ---------- About ---------- */

function renderAbout() {
  $("#page-content").innerHTML = `
    ${heading(
      "About Me",
      "ooxxd의 소개 페이지"
    )}

    <section class="content-panel">

      <h2>
        안녕하세요, 김서연(ooxxd) 입니다.
      </h2>

      <p>
        정보보안을 공부하며
        CTF 문제 풀이와 개발 경험을
        기록하고 있습니다.
      </p>

      <p>
        문제의 정답뿐 아니라
        해결 과정과 취약점의 원리를
        이해하는 것을 중요하게 생각합니다.
      </p>

      <h2>관심 분야</h2>

      <p>
        Web Security · CTF · Wargame ·
        Secure Coding · Development
      </p>

      <h2>블로그 운영 목적</h2>

      <p>
        공부한 내용을 직접 설명할 수 있도록
        정리하고 꾸준히 기록하는 것이 목표입니다.
      </p>

      <h2>GitHub</h2>

      <p>
        <a
          href="${BLOG.github}"
          target="_blank"
          rel="noopener noreferrer">
          github.com/ooxxd ↗
        </a>
      </p>

    </section>
  `;
}

/* ---------- Archives ---------- */

function renderArchives() {
  $("#page-content").innerHTML = `
    ${heading(
      "Archives",
      "지금까지 작성한 게시글"
    )}

    <div class="section-title">

      <h2>
        전체 게시글 (${posts.length})
      </h2>

    </div>

    ${postList(allPosts())}
  `;
}

/* ---------- Categories ---------- */

function renderCategory(category) {
  const result = posts.filter(
    post => post.category === category
  );

  $("#page-content").innerHTML = `
    ${heading(
      category,
      `${result.length}개의 게시글`
    )}

    ${postList(result)}
  `;
}

/* ---------- Tags ---------- */

function getAllTags() {
  return [...new Set(
    posts.flatMap(post => post.tags)
  )].sort((a, b) => a.localeCompare(b));
}

function renderTags() {
  const tags = getAllTags();

  $("#page-content").innerHTML = `
    ${heading(
      "Tags",
      "태그별로 게시글을 찾아보세요."
    )}

    <section class="content-panel">

      <div class="tag-cloud">

        ${tags.length ? tags.map(tag => `
          <button
            class="action-button"
            data-tag="${escapeHTML(tag)}">

            #${escapeHTML(tag)}

          </button>
        `).join(" ") : `
          <p>아직 등록된 태그가 없습니다.</p>
        `}

      </div>

    </section>
  `;
}

function renderTagPosts(tag) {
  const result = posts.filter(
    post => post.tags.includes(tag)
  );

  $("#page-content").innerHTML = `
    ${heading(
      "#" + tag,
      `${result.length}개의 게시글`
    )}

    ${postList(result)}
  `;
}

/* ---------- 날짜별 게시글 ---------- */

function renderDayPosts(date) {
  const result = posts.filter(
    post => post.date === date
  );

  $("#page-content").innerHTML = `
    ${heading(
      formatDate(date),
      "이 날짜에 작성한 게시글"
    )}

    ${postList(result)}
  `;
}

/* ---------- 검색 ---------- */

function renderSearch(term) {
  const normalized = term.toLowerCase();

  const result = posts.filter(post => {
    const searchable = [
      post.title,
      post.summary,
      post.category,
      ...post.tags
    ].join(" ").toLowerCase();

    return searchable.includes(normalized);
  });

  $("#page-content").innerHTML = `
    ${heading(
      "검색 결과",
      `"${term}" · ${result.length}건`
    )}

    ${postList(result)}
  `;
}

/* ---------- 오른쪽 태그 위젯 ---------- */

function renderWidgetTags() {
  const container = $("#widget-tags");

  if (!container) return;

  const tags = getAllTags();

  if (!tags.length) {
    container.innerHTML =
      "<span>아직 태그가 없습니다.</span>";
    return;
  }

  container.innerHTML = tags
    .slice(0, 12)
    .map(tag => `
      <button
        class="tag-button"
        data-tag="${escapeHTML(tag)}">

        #${escapeHTML(tag)}

      </button>
    `)
    .join("");
}

/* ---------- 페이지 이동 ---------- */

function go(page, value = "") {
  const hash = value
    ? `#/${page}/${encodeURIComponent(value)}`
    : `#/${page}`;

  if (location.hash === hash) {
    renderPage();
  } else {
    location.hash = hash;
  }

  const sidebar = $("#sidebar");

  if (sidebar) {
    sidebar.classList.remove("open");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
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

  return {
    page: page || "home",
    value
  };
}

function renderPage() {
  const { page, value } = routeInfo();

  document.querySelectorAll(".nav-btn")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === page
      );
    });

  document.querySelectorAll(".category-btn")
    .forEach(button => {
      button.classList.toggle(
        "active",
        page === "category" &&
        button.dataset.category === value
      );
    });

  switch (page) {
    case "home":
      renderHome();
      break;

    case "about":
      renderAbout();
      break;

    case "archives":
      renderArchives();
      break;

    case "tags":
      renderTags();
      break;

    case "category":
      renderCategory(value);
      break;

    case "tag":
      renderTagPosts(value);
      break;

    case "day":
      renderDayPosts(value);
      break;

    default:
      renderHome();
  }
}

/* ---------- 테마 ---------- */

function setupTheme() {
  if (localStorage.getItem(THEME_KEY) === "light") {
    document.body.classList.add("light");
  }
}

function toggleTheme() {
  document.body.classList.toggle("light");

  const current = document.body.classList.contains("light")
    ? "light"
    : "dark";

  localStorage.setItem(THEME_KEY, current);
}

/* ---------- 이미지 표시 ---------- */

function setupImages() {
  // GitHub에 업로드된 이미지 파일을 그대로 사용한다.
  // 공개 사이트에서는 방문자 사진 업로드를 지원하지 않는다.

  const images = [
    {
      image: "#profile-img",
      placeholder: "#profile-placeholder"
    },
    {
      image: "#logo-img",
      placeholder: "#logo-placeholder"
    }
  ];

  images.forEach(item => {
    const img = $(item.image);
    const placeholder = $(item.placeholder);

    if (!img || !placeholder) return;

    img.onload = () => {
      img.hidden = false;
      placeholder.hidden = true;
    };

    img.onerror = () => {
      img.hidden = true;
      placeholder.hidden = false;
    };

    if (img.complete && img.naturalWidth > 0) {
      img.hidden = false;
      placeholder.hidden = true;
    }
  });
}

/* ---------- 이벤트 연결 ---------- */

function setupEvents() {
  document.addEventListener("click", event => {
    const button = event.target.closest("button");

    if (!button) return;

    // 메뉴 이동
    if (button.dataset.page) {
      go(button.dataset.page);
      return;
    }

    // 카테고리 이동
    if (button.dataset.category) {
      go("category", button.dataset.category);
      return;
    }

    // 태그 이동
    if (button.dataset.tag) {
      go("tag", button.dataset.tag);
      return;
    }

    // 게시글 열기
    if (button.dataset.post) {
      const post = posts.find(
        item => item.id === button.dataset.post
      );

      if (post && post.url) {
        const url = new URL(post.url, window.location.origin);

        // 외부 사이트로 임의 이동하지 않도록
        // 현재 블로그 내부 경로만 허용한다.
        if (url.origin === window.location.origin) {
          window.location.href = url.href;
        }
      }

      return;
    }

    // 캘린더 날짜
    if (button.dataset.day) {
      go("day", button.dataset.day);
      return;
    }

    // 캘린더 이전/다음 달
    if (button.dataset.calendar) {
      const difference = Number(
        button.dataset.calendar
      );

      calendarDate.setDate(1);

      calendarDate.setMonth(
        calendarDate.getMonth() + difference
      );

      renderHome();
      return;
    }
  });

  // 검색창
  const search = $("#search");

  if (search) {
    search.addEventListener("input", event => {
      const term = event.target.value.trim();

      if (term) {
        renderSearch(term);
      } else {
        renderPage();
      }
    });
  }

  // 테마 버튼
  const themeToggle = $("#theme-toggle");

  if (themeToggle) {
    themeToggle.addEventListener(
      "click",
      toggleTheme
    );
  }

  // 모바일 메뉴
  const menuToggle = $("#menu-toggle");

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      $("#sidebar")?.classList.toggle("open");
    });
  }

  window.addEventListener("hashchange", () => {
    const search = $("#search");

    if (search) search.value = "";

    renderPage();
  });
}

/* ---------- 실행 ---------- */

async function init() {
  setupTheme();
  setupImages();
  setupEvents();

  try {
    await loadPosts();

    renderWidgetTags();
    renderPage();

  } catch (error) {
    console.error(error);

    displayError(
      "posts.json 생성 및 GitHub Pages 배포 상태를 확인해 주세요."
    );
  }
}

document.addEventListener(
  "DOMContentLoaded",
  init
);
