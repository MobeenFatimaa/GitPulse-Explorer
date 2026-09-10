document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const statusContainer = document.getElementById('status-container');
  const resultsSection = document.getElementById('results-section');
  const metricsBar = document.getElementById('metrics-bar');
  const resultsCountEl = document.getElementById('results-count');
  const executionTimeEl = document.getElementById('execution-time');
  const paginationContainer = document.getElementById('pagination-container');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  const historyPillsContainer = document.getElementById('history-pills');
  const themeToggle = document.getElementById('theme-toggle');

  // Modal Elements
  const analysisModal = document.getElementById('analysis-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const closeModalBtn = document.getElementById('close-modal-btn');

  // Filter Select Elements
  const filterLang = document.getElementById('filter-language');
  const filterStars = document.getElementById('filter-stars');
  const filterForks = document.getElementById('filter-forks');
  const filterUpdated = document.getElementById('filter-updated');
  const filterLicense = document.getElementById('filter-license');
  const filterSort = document.getElementById('filter-sort');

  // Internal State
  let currentPage = 1;
  let currentQuery = '';
  let accumulatedRepos = [];
  let searchHistory = [];

  // Theme Toggle Handler
  themeToggle.addEventListener('click', () => {
    const curTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = curTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '🌙' : '☀️';
  });

  // Modal Close Handlers
  closeModalBtn.addEventListener('click', () => analysisModal.classList.add('hidden'));
  analysisModal.addEventListener('click', (e) => {
    if (e.target === analysisModal) analysisModal.classList.add('hidden');
  });

  // Sandbox Triggers
  document.getElementById('btn-demo-loading').addEventListener('click', () => {
    resetView();
    renderLoadingState('Simulated Sandbox Query');
  });

  document.getElementById('btn-demo-empty').addEventListener('click', () => {
    resetView();
    renderEmptyState('xyzqwerty123456');
  });

  document.getElementById('btn-demo-error').addEventListener('click', () => {
    resetView();
    renderErrorState(
      'GitHub API Connection Failure',
      'The requested search payload failed to execute due to a network disruption.'
    );
  });

  // Clear Filters Handler
  clearFiltersBtn.addEventListener('click', () => {
    filterLang.value = '';
    filterStars.value = '';
    filterForks.value = '';
    filterUpdated.value = '';
    filterLicense.value = '';
    filterSort.value = '';
  });

  // Search Submit Handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    currentPage = 1;
    accumulatedRepos = [];
    currentQuery = query;
    saveSearchHistory(query);

    executeSearch();
  });

  // Pagination Handler
  loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    executeSearch(true);
  });

  // Search Dispatcher
  async function executeSearch(isLoadMore = false) {
    if (!isLoadMore) {
      resetView();
      renderLoadingState(currentQuery);
    } else {
      loadMoreBtn.innerText = 'Loading More...';
      loadMoreBtn.disabled = true;
    }

    if (currentQuery.toLowerCase() === 'force-error') {
      setTimeout(() => {
        resetView();
        renderErrorState(
          'Forced Search Failure (Test Mode)',
          `The search service encountered a simulated issue while fetching results for "${escapeHtml(currentQuery)}".`
        );
      }, 500);
      return;
    }

    const startTime = performance.now();
    const url = buildGitHubApiUrl(currentQuery, currentPage);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('GitHub REST API rate limit exceeded. Please wait a minute and retry.');
        }
        throw new Error(`HTTP Error ${response.status}: Unable to complete repository query.`);
      }

      const data = await response.json();
      const endTime = performance.now();
      const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

      statusContainer.innerHTML = '';
      loadMoreBtn.innerText = 'Load More Repositories';
      loadMoreBtn.disabled = false;

      if (data.items && data.items.length > 0) {
        accumulatedRepos = [...accumulatedRepos, ...data.items];

        resultsCountEl.innerText = `${data.total_count.toLocaleString()} repositories found`;
        executionTimeEl.innerText = `Search completed in ${durationSeconds}s`;
        metricsBar.classList.remove('hidden');

        renderResults(accumulatedRepos);

        if (accumulatedRepos.length < data.total_count && accumulatedRepos.length < 1000) {
          paginationContainer.classList.remove('hidden');
        } else {
          paginationContainer.classList.add('hidden');
        }
      } else {
        if (!isLoadMore) {
          renderEmptyState(currentQuery);
        } else {
          paginationContainer.classList.add('hidden');
        }
      }
    } catch (err) {
      resetView();
      renderErrorState('Search Request Failed', err.message);
    }
  }

  // API URL Builder
  function buildGitHubApiUrl(baseQuery, page) {
    let q = baseQuery;
    if (filterLang.value) q += ` language:${filterLang.value}`;
    if (filterStars.value) q += ` stars:>=${filterStars.value}`;
    if (filterForks.value) q += ` forks:>=${filterForks.value}`;
    if (filterLicense.value) q += ` license:${filterLicense.value}`;

    if (filterUpdated.value) {
      const now = new Date();
      if (filterUpdated.value === '24h') now.setDate(now.getDate() - 1);
      if (filterUpdated.value === '7d') now.setDate(now.getDate() - 7);
      if (filterUpdated.value === '30d') now.setDate(now.getDate() - 30);
      if (filterUpdated.value === '1y') now.setFullYear(now.getFullYear() - 1);
      q += ` pushed:>=${now.toISOString().split('T')[0]}`;
    }

    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&page=${page}&per_page=10`;
    if (filterSort.value) url += `&sort=${filterSort.value}&order=desc`;
    return url;
  }

  // Render Rich Information Cards
  function renderResults(repos) {
    const listHtml = repos.map(repo => {
      const ownerName = repo.owner ? repo.owner.login : 'Unknown';
      const avatarUrl = repo.owner ? repo.owner.avatar_url : '';
      const visibility = repo.visibility || (repo.private ? 'private' : 'public');
      const formattedSize = repo.size ? `${(repo.size / 1024).toFixed(1)} MB` : '0 KB';
      const updatedAgo = formatRelativeTime(repo.updated_at);
      
      const topicsHtml = (repo.topics || []).slice(0, 4).map(t => `
        <span class="topic-tag">${escapeHtml(t)}</span>
      `).join('');

      return `
        <li class="repo-card">
          <div class="repo-header">
            <div class="repo-owner-info">
              <img src="${avatarUrl}" alt="${escapeHtml(ownerName)} avatar" class="repo-avatar" loading="lazy" />
              <div class="repo-title-wrapper">
                <span class="repo-owner">◉ ${escapeHtml(ownerName)}</span>
                <h3>
                  <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
                    ${escapeHtml(repo.name)}
                  </a>
                </h3>
              </div>
            </div>
            <span class="repo-visibility-badge">${escapeHtml(visibility)}</span>
          </div>

          <p class="repo-description">${escapeHtml(repo.description || 'No description provided for this codebase.')}</p>

          ${topicsHtml ? `<div class="repo-topics">${topicsHtml}</div>` : ''}

          <div class="repo-metrics-grid">
            <span class="metric-item">⭐ ${repo.stargazers_count.toLocaleString()}</span>
            <span class="metric-item">⑂ ${repo.forks_count.toLocaleString()}</span>
            <span class="metric-item">👀 ${(repo.watchers_count || 0).toLocaleString()}</span>
            <span class="metric-item">⚠️ ${(repo.open_issues_count || 0).toLocaleString()} issues</span>
            <span class="metric-item">◉ ${escapeHtml(repo.language || 'N/A')}</span>
            <span class="metric-item">🌿 ${escapeHtml(repo.default_branch || 'main')}</span>
            <span class="metric-item">📦 ${formattedSize}</span>
            <span class="metric-item">📜 ${escapeHtml(repo.license ? repo.license.spdx_id : 'No License')}</span>
            <span class="metric-item">◷ ${updatedAgo}</span>
          </div>

          <div class="repo-actions">
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="btn-card-action btn-card-primary">
              View GitHub ↗
            </a>
            <button type="button" class="btn-card-action btn-analyze" data-id="${repo.id}">
              🔍 Analyze
            </button>
            <button type="button" class="btn-card-action btn-copy-url" data-url="${repo.html_url}">
              📋 Copy URL
            </button>
          </div>
        </li>
      `;
    }).join('');

    resultsSection.innerHTML = `<ul class="repo-list">${listHtml}</ul>`;
    attachCardActionEvents();
  }

  // Action listeners for cards
  function attachCardActionEvents() {
    document.querySelectorAll('.btn-copy-url').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = e.currentTarget.getAttribute('data-url');
        navigator.clipboard.writeText(url);
        const originalText = e.currentTarget.innerText;
        e.currentTarget.innerText = '✅ Copied!';
        setTimeout(() => { e.currentTarget.innerText = originalText; }, 1800);
      });
    });

    document.querySelectorAll('.btn-analyze').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const repoId = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        const repoData = accumulatedRepos.find(r => r.id === repoId);
        if (repoData) {
          openRepositoryIntelligenceModal(repoData);
        }
      });
    });
  }

  // Repository Health Engine & Analysis Report Generator
  function openRepositoryIntelligenceModal(repo) {
    modalTitle.innerText = repo.full_name;

    // Health Analysis Calculation Algorithm
    const docScore = repo.has_pages || repo.description ? (repo.description.length > 40 ? 18 : 12) : 8;
    const commScore = repo.forks_count > 100 ? 19 : Math.min(19, Math.floor(repo.forks_count / 10) + 5);
    const actScore = repo.open_issues_count < 200 ? 20 : 14;
    const maintScore = repo.license ? 18 : 10;
    const popScore = Math.min(20, Math.floor(Math.log10(repo.stargazers_count + 1) * 4));
    
    const totalHealthScore = docScore + commScore + actScore + maintScore + popScore;

    const topicsList = repo.topics && repo.topics.length 
      ? repo.topics.map(t => `<span class="topic-tag">${escapeHtml(t)}</span>`).join(' ')
      : 'None specified';

    modalBody.innerHTML = `
      <!-- Overall Health Card -->
      <div class="health-score-card">
        <div class="score-badge-circle">
          <span class="score-number">${totalHealthScore}</span>
          <span class="score-denom">/ 100</span>
        </div>
        <div class="health-bars-grid">
          <div class="health-bar-row">
            <div class="health-label-group"><span>Documentation</span> <span>${docScore}/20</span></div>
            <div class="health-track"><div class="health-fill" style="width: ${(docScore/20)*100}%;"></div></div>
          </div>
          <div class="health-bar-row">
            <div class="health-label-group"><span>Community</span> <span>${commScore}/20</span></div>
            <div class="health-track"><div class="health-fill" style="width: ${(commScore/20)*100}%;"></div></div>
          </div>
          <div class="health-bar-row">
            <div class="health-label-group"><span>Code Activity</span> <span>${actScore}/20</span></div>
            <div class="health-track"><div class="health-fill" style="width: ${(actScore/20)*100}%;"></div></div>
          </div>
          <div class="health-bar-row">
            <div class="health-label-group"><span>Maintenance & License</span> <span>${maintScore}/20</span></div>
            <div class="health-track"><div class="health-fill" style="width: ${(maintScore/20)*100}%;"></div></div>
          </div>
        </div>
      </div>

      <!-- Detailed Metrics Grid -->
      <div class="modal-grid-2">
        <div>
          <h3 class="modal-section-title">Repository Overview</h3>
          <ul class="data-list">
            <li><span>Description:</span> <strong>${escapeHtml(repo.description || 'N/A')}</strong></li>
            <li><span>Primary Language:</span> <strong>${escapeHtml(repo.language || 'N/A')}</strong></li>
            <li><span>License:</span> <strong>${escapeHtml(repo.license ? repo.license.name : 'None')}</strong></li>
            <li><span>Default Branch:</span> <strong>${escapeHtml(repo.default_branch || 'main')}</strong></li>
            <li><span>Topics:</span> <div>${topicsList}</div></li>
          </ul>
        </div>

        <div>
          <h3 class="modal-section-title">Activity & Impact</h3>
          <ul class="data-list">
            <li><span>Stars:</span> <strong>⭐ ${repo.stargazers_count.toLocaleString()}</strong></li>
            <li><span>Forks:</span> <strong>⑂ ${repo.forks_count.toLocaleString()}</strong></li>
            <li><span>Watchers:</span> <strong>👀 ${(repo.watchers_count || 0).toLocaleString()}</strong></li>
            <li><span>Open Issues:</span> <strong>⚠️ ${(repo.open_issues_count || 0).toLocaleString()}</strong></li>
            <li><span>Last Pushed:</span> <strong>◷ ${formatRelativeTime(repo.pushed_at)}</strong></li>
          </ul>
        </div>
      </div>
    `;

    analysisModal.classList.remove('hidden');
  }

  function renderLoadingState(query) {
    statusContainer.innerHTML = `
      <div class="state-box state-loading" role="status">
        <div class="spinner" aria-hidden="true"></div>
        <p>Fetching public repositories for <strong>"${escapeHtml(query)}"</strong>...</p>
      </div>
    `;
  }

  function renderEmptyState(query) {
    statusContainer.innerHTML = `
      <div class="state-box state-empty" role="status">
        <span class="badge-success">Search Completed</span>
        <h2>No Repositories Found</h2>
        <p>Your search for <strong>"${escapeHtml(query)}"</strong> succeeded, but returned 0 public repositories on GitHub.</p>
      </div>
    `;
  }

  function renderErrorState(title, actionMsg) {
    statusContainer.innerHTML = `
      <div class="state-box state-error" role="alert">
        <h2>⚠️ ${escapeHtml(title)}</h2>
        <p>${escapeHtml(actionMsg)}</p>
        <button type="button" class="retry-button" style="margin-top: 1rem;" onclick="document.getElementById('search-input').focus()">
          Try Again
        </button>
      </div>
    `;
  }

  function resetView() {
    statusContainer.innerHTML = '';
    resultsSection.innerHTML = '';
    metricsBar.classList.add('hidden');
    paginationContainer.classList.add('hidden');
  }

  function saveSearchHistory(query) {
    if (!searchHistory.includes(query)) {
      searchHistory.unshift(query);
      if (searchHistory.length > 3) searchHistory.pop();
      renderSearchHistory();
    }
  }

  function renderSearchHistory() {
    if (searchHistory.length === 0) return;
    historyPillsContainer.innerHTML = searchHistory.map(q => `
      <span class="history-chip" data-query="${escapeHtml(q)}">${escapeHtml(q)}</span>
    `).join('');

    document.querySelectorAll('.history-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        input.value = query;
        form.dispatchEvent(new Event('submit'));
      });
    });
  }

  function formatRelativeTime(dateString) {
    if (!dateString) return 'recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});
