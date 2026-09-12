# GitPulse Explorer

GitPulse Explorer is a web application designed to evaluate and compare **2 to 3 public GitHub repositories** side-by-side in real time using the GitHub REST API.

---

## System Architecture & Key Decisions

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, and CSS3.
- **Design:** Built without frameworks such as React or Vue or bundlers such as Vite or Webpack, providing zero runtime dependencies and no build step.
- **State Management:** Browser `localStorage` is used to store search history.
- **API Integration:** Direct asynchronous `fetch` requests to the GitHub REST API v3 using `Promise.all` for parallel data retrieval.

---

## Prerequisites

- **Node.js:** `v18.0.0` or higher
- **npm:** `v9.0.0` or higher
- **Modern Web Browser:** Chrome 115+, Firefox 115+, or Safari 16+
- **Git:** `v2.30.0` or higher

Verify installations with:

```bash
node -v
npm -v
git --version
Environment Variables

The application works with GitHub's unauthenticated API rate limit of approximately 60 requests per hour per IP address.

An optional GitHub Personal Access Token can be used to increase the rate limit.

Variable	Required	Description
GITHUB_TOKEN	Optional	GitHub Personal Access Token for authenticated API requests

If using a token, configure it in script.js according to the project's implementation.

Run Locally
1. Clone the Repository
git clone https://github.com/MobeenFatimaa/GitPulse-Explorer.git
cd GitPulse-Explorer
2. Start the Local Server

Because the application uses modern JavaScript modules, serve it through a local web server:

npx serve .
3. Open the Application

Navigate to:

http://localhost:3000
Usage & Verification
Enter 2 or 3 repositories, such as facebook/react, vuejs/vue.
Click Compare Directly or press Enter.
Review repository metadata side-by-side.
Use keyboard navigation with Tab, Shift + Tab, Enter, and Space.
Test invalid repositories to verify the error state.
Enter only one repository to verify input validation.
Features
Compare 2–3 GitHub repositories simultaneously.
Real-time repository data retrieval.
GitHub REST API integration.
Repository statistics comparison.
Search history using localStorage.
Keyboard-accessible navigation.
Input validation.
Error handling for invalid or unavailable repositories.
Responsive comparison interface.

The comparison includes metadata such as:

Stars
Forks
Open issues
Primary language
License
Repository information
Known Limitations
Private Repositories: Unauthenticated requests cannot access private repositories.
API Rate Limits: Unauthenticated requests are limited to approximately 60 requests per hour per IP.
Repository Count: Direct comparison supports a minimum of 2 and maximum of 3 repositories.
Historical Data: The application does not analyze individual commit diffs, pull requests, or detailed historical commit activity.
Project Repository

GitHub: https://github.com/MobeenFatimaa/GitPulse-Explorer
