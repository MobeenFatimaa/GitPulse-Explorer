# GitPulse Explorer - Repository Comparison Tool

GitPulse Explorer is a rebuild of GitHub's repository comparison workflow, allowing developers to directly evaluate metrics across multiple public repositories.

##  Original Feature & Comparison
Rebuilt Feature: GitHub Repository Comparison (`github.com/compare`)

### Omissions from Original
* **Full File Diff Viewer:** Excluded line-by-line git diffs to focus strictly on macro metadata and repository performance metrics.
* **Pull Request Generation:** Excluded the "Create Pull Request" action sequence.

### One Key Improvement
* **Instant Inline Batch Validation & Contextual Retry:** Unlike GitHub's multi-step comparison navigation, GitPulse Explorer checks 2–3 repositories in parallel from a single input bar, surfaces exact API failures (e.g., 404 vs rate limits), and lets users retry or fix failed items inline without losing search state.

---

##  Keyboard Operation & Accessibility
* **Full Form Navigation:** Navigate inputs, comparison buttons, and history tags using `Tab` and `Shift + Tab`.
* **Action Execution:** Press `Enter` inside the input box to submit a search. Press `Enter` or `Space` on history tags to re-run past queries.
* **Focus Management:** Automatic focus transfer to the "Try Again" button upon error states (`aria-live="polite"`).

---

##  Failure States Handled
1. **Invalid Input Count:** Triggers a validation alert if fewer than 2 or more than 3 repositories are supplied.
2. **Missing / Private Repositories (HTTP 404):** Displays explicit error messages identifying which repository failed to load.
3. **GitHub API Rate Limits (HTTP 403):** Displays rate-limit warnings when exceeding unauthenticated thresholds (60 requests/hour).

---

##  How to Run Locally

1. Clone or download this repository.
2. Open `index.html` directly in any web browser, or serve it locally using a static server:
   ```bash
   npx serve .
