# GitHub Repository Data Fetcher

A command-line tool to fetch and analyze pull request data from GitHub repositories.

## Features

- Fetch pull requests from any GitHub repository
- Filter PRs by author, state (open/closed/all)
- Export data to CSV for analysis in spreadsheets
- Check GitHub API rate limits
- Test authentication status

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A GitHub personal access token

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/hardyjosh/gh-data.git
   cd gh-data
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your GitHub token:
   ```
   GITHUB_TOKEN=your_github_personal_access_token
   ```

   To create a GitHub token:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate a new token with the `repo` scope
   - Copy the token to your `.env` file

4. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Fetching Pull Requests

```bash
npm start -- prs --owner <owner> --repo <repo> [options]
```

#### Required Options:
- `--owner <owner>`: Repository owner (organization or username)
- `--repo <repo>`: Repository name

#### Optional Options:
- `--state <state>`: PR state (open, closed, all) [default: "all"]
- `--limit <limit>`: Limit the number of PRs returned [default: 1000]
- `--author <author>`: Filter PRs by author
- `--format <format>`: Output format (table, csv) [default: "table"]
- `--path <path>`: Path to save CSV file [default: "./output"]

#### Examples:

Fetch all PRs from a repository:
```bash
npm start -- prs --owner rainlanguage --repo rain.orderbook
```

Fetch PRs by a specific author and export to CSV:
```bash
npm start -- prs --owner rainlanguage --repo rain.orderbook --author hardyjosh --format csv
```

Fetch only open PRs with a limit of 50:
```bash
npm start -- prs --owner rainlanguage --repo rain.orderbook --state open --limit 50
```

### Checking Rate Limits

Check your current GitHub API rate limit status:

```bash
npm start -- rate-limit
```

### Testing Authentication

Verify that your GitHub token is working correctly:

```bash
npm start -- test-auth
```

## Output Format

The CSV output includes the following fields:
- `number`: PR number
- `title`: PR title
- `author`: GitHub username of the PR author
- `createdAt`: Date when the PR was created (DD/MM/YYYY format)
- `mergedAt`: Date when the PR was merged, or "Not merged" (DD/MM/YYYY format)
- `url`: URL to the PR on GitHub

## Troubleshooting

If you're experiencing authentication issues:

1. Check that your token is valid:
   ```bash
   source .env
   curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
   ```

2. Verify your rate limit:
   ```bash
   npm start -- rate-limit
   ```

## License

MIT 
