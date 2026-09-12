// Local Storage Key
const HISTORY_KEY = "gitpulse_search_history";

// DOM Elements
const compareForm = document.getElementById("compare-form");
const repoInput = document.getElementById("repo-input");
const compareBtn = document.getElementById("compare-btn");
const clearHistoryBtn = document.getElementById("clear-history");
const tagsContainer = document.getElementById("tags-container");
const errorContainer = document.getElementById("error-container");
const errorMessage = document.getElementById("error-message");
const retryBtn = document.getElementById("retry-btn");
const resultsContainer = document.getElementById("results-container");

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  renderHistoryTags();

  compareForm.addEventListener("submit", (e) => {
    e.preventDefault();
    executeComparison(repoInput.value);
  });

  retryBtn.addEventListener("click", () => {
    executeComparison(repoInput.value);
  });

  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistoryTags();
  });
});

// Primary Execution Logic
async function executeComparison(query) {
  const repoList = query
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  // Validation: Keyboard & Input State
  if (repoList.length < 2 || repoList.length > 3) {
    showError("Please enter 2 or 3 valid repository full names separated by commas (e.g., owner/repo1, owner/repo2).");
    return;
  }

  setLoadingState(true);
  hideError();
  hideResults();

  try {
    const fetchedData = await Promise.all(
      repoList.map(async (repoName) => {
        return await fetchRepository(repoName);
      })
    );

    saveToHistory(query);
    renderHistoryTags();
    renderResults(fetchedData);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoadingState(false);
  }
}

// Fetch Repository Data with API Handling
async function fetchRepository(repoFullName) {
  const response = await fetch(`https://api.github.com/repos/${repoFullName}`, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Failed to fetch repository "${repoFullName}". Verify the repository exists and is public.`);
    } else if (response.status === 403) {
      throw new Error("GitHub API rate limit exceeded (60 req/hr). Please wait a few minutes before trying again.");
    }
    throw new Error(`Failed to fetch "${repoFullName}" (HTTP ${response.status}).`);
  }

  return await response.json();
}

// Render Comparison Results
function renderResults(repos) {
  resultsContainer.innerHTML = "";
  
  repos.forEach((repo) => {
    const card = document.createElement("article");
    card.className = "repo-card";
    card.innerHTML = `
      <h3><a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.full_name}</a></h3>
      <p class="repo-desc">${repo.description || "No description provided."}</p>
      <div class="repo-stats">
        <span>⭐ ${repo.stargazers_count.toLocaleString()} stars</span>
        <span>🍴 ${repo.forks_count.toLocaleString()} forks</span>
        <span>🚨 ${repo.open_issues_count.toLocaleString()} issues</span>
      </div>
    `;
    resultsContainer.appendChild(card);
  });

  resultsContainer.classList.remove("hidden");
}

// State Utilities
function setLoadingState(isLoading) {
  compareBtn.disabled = isLoading;
  compareBtn.textContent = isLoading ? "Comparing..." : "Compare Directly";
}

function showError(message) {
  errorMessage.textContent = message;
  errorContainer.classList.remove("hidden");
  retryBtn.focus(); // Focus management for keyboard accessibility
}

function hideError() {
  errorContainer.classList.add("hidden");
}

function hideResults() {
  resultsContainer.classList.add("hidden");
}

// History Tag Management
function saveToHistory(query) {
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  history = history.filter((item) => item.toLowerCase() !== query.toLowerCase());
  history.unshift(query);
  if (history.length > 5) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderHistoryTags() {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  tagsContainer.innerHTML = "";

  if (history.length === 0) {
    tagsContainer.innerHTML = `<span class="empty-history">No search history</span>`;
    return;
  }

  history.forEach((item) => {
    const tag = document.createElement("button");
    tag.type = "button";
    tag.className = "history-tag";
    tag.textContent = item;
    tag.addEventListener("click", () => {
      repoInput.value = item;
      executeComparison(item);
    });
    tagsContainer.appendChild(tag);
  });
}
