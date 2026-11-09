
const posts = [
  {
    title: "[CTF] SSTI로 풀어본 웹 문제 풀이",
    category: "ctf",
    tags: ["CTF", "Web", "SSTI"],
    summary: "SSTI 취약점을 이용한 웹 문제 풀이 과정과 우회 방법 정리",
    date: "2025.01.19",
    icon: "</>"
  },
  {
    title: "Bug Bounty: 계정 탈취 취약점 리포트 정리",
    category: "bug",
    tags: ["BugBounty", "Account-Takeover"],
    summary: "취약점 분석 과정과 리포트 작성 방법 정리",
    date: "2025.01.15",
    icon: "♧"
  },
  {
    title: "동아리 서비스 리팩토링 회고",
    category: "dev",
    tags: ["개발", "회고", "Spring"],
    summary: "프로젝트에서 개선한 점과 배운 내용 정리",
    date: "2025.01.10",
    icon: "⌘"
  },
  {
    title: "GitHub Pages 블로그 제작 기록",
    category: "docs",
    tags: ["GitHub", "Blog"],
    summary: "개인 기술 블로그의 디자인과 개발 과정",
    date: "2026.11.09",
    icon: "▤"
  }
];

let currentCategory = "all";
let searchTerm = "";

const postList = document.querySelector("#post-list");
const search = document.querySelector("#search");

function renderPosts() {
  const filtered = posts.filter(post => {
    const matchesCategory =
      currentCategory === "all" ||
      currentCategory === post.category;

    const searchable = [
      post.title,
      post.summary,
      ...post.tags
    ].join(" ").toLowerCase();

    return matchesCategory &&
      searchable.includes(searchTerm);
  });

  postList.replaceChildren();

  for (const post of filtered) {
    const card = document.createElement("article");
    card.className = "post-card";

    const icon = document.createElement("div");
    icon.className = "post-icon";
    icon.textContent = post.icon;

    const info = document.createElement("div");
    info.className = "post-info";

    const title = document.createElement("h3");
    title.textContent = post.title;

    const meta = document.createElement("div");
    meta.className = "post-meta";
    meta.textContent = post.date;

    const pills = document.createElement("div");
    pills.className = "pills";

    for (const tag of post.tags) {
      const pill = document.createElement("span");
      pill.textContent = "#" + tag;
      pills.append(pill);
    }

    const summary = document.createElement("p");
    summary.textContent = post.summary;

    info.append(title, meta, pills, summary);
    card.append(icon, info);
    postList.append(card);
  }

  document.querySelector("#empty-message").hidden =
    filtered.length !== 0;
}

document.querySelectorAll(".category").forEach(button => {
  button.addEventListener("click", () => {
    currentCategory = button.dataset.category;

    document.querySelectorAll(".category").forEach(item => {
      item.classList.toggle("selected", item === button);
    });

    renderPosts();
  });
});

search.addEventListener("input", () => {
  searchTerm = search.value.trim().toLowerCase();
  renderPosts();
});

document.querySelector("#show-all").addEventListener("click", () => {
  currentCategory = "all";
  searchTerm = "";
  search.value = "";

  document.querySelectorAll(".category").forEach(item => {
    item.classList.toggle(
      "selected",
      item.dataset.category === "all"
    );
  });

  renderPosts();
});

document.querySelector("#theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
});

renderPosts();
