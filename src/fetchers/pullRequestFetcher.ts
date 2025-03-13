import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";

// Add throttling plugin to Octokit
const ThrottledOctokit = Octokit.plugin(throttling);

// Define types for our PR data
export interface PullRequestData {
  number: number;
  title: string;
  author: string;
  createdAt: string;
  mergedAt: string;
  url: string;
}

// Create a function to initialize Octokit with a token
function createOctokit(token: string) {
  // Don't log token details
  return new ThrottledOctokit({
    auth: token,
    throttle: {
      onRateLimit: (retryAfter, options: any, octokit) => {
        console.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );
        console.log(`Retrying after ${retryAfter} seconds!`);
        return true; // Retry the request
      },
      onSecondaryRateLimit: (retryAfter, options: any, octokit) => {
        console.warn(
          `Secondary rate limit detected for request ${options.method} ${options.url}`
        );
        return true; // Retry the request
      },
    },
  });
}

// Initialize with empty token, will be set later
let octokit = createOctokit("");

// Function to set the token
export function setToken(token: string) {
  octokit = createOctokit(token);
}

export async function fetchPullRequests(
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "all",
  limit: number = 1000,
  author?: string,
  token?: string
): Promise<PullRequestData[]> {
  // If token is provided, update the octokit instance
  if (token) {
    setToken(token);
  }

  try {
    // Check rate limit but don't display it
    await checkRateLimit(false);

    console.log(
      `Fetching PRs for ${owner}/${repo}${
        state !== "all" ? ` with state: ${state}` : ""
      }${author ? ` by author: ${author}` : ""}`
    );

    // Use search API for all cases - it's more efficient
    let query = author
      ? `type:pr repo:${owner}/${repo} author:${author}`
      : `type:pr repo:${owner}/${repo}`;

    if (state !== "all") {
      query += ` state:${state}`;
    }

    // Don't log the query

    const prs: PullRequestData[] = [];
    let page = 1;
    let hasMorePages = true;

    // Show deprecation warning only once
    let deprecationWarningShown = false;

    // Suppress Octokit deprecation warnings after showing once
    const originalConsoleWarn = console.warn;
    console.warn = function (message, ...args) {
      if (
        message &&
        typeof message === "string" &&
        message.includes("deprecated") &&
        message.includes("search/issues")
      ) {
        if (!deprecationWarningShown) {
          originalConsoleWarn(
            "Note: GitHub Search API is deprecated and will be removed in September 2025."
          );
          deprecationWarningShown = true;
        }
        // Don't show the full warning
        return;
      }
      originalConsoleWarn(message, ...args);
    };

    try {
      while (hasMorePages && prs.length < limit) {
        const searchResponse = await octokit.search.issuesAndPullRequests({
          q: query,
          per_page: 100,
          page,
        });

        console.log(
          `Page ${page}: Found ${searchResponse.data.items.length} results`
        );

        if (searchResponse.data.items.length === 0) {
          hasMorePages = false;
        } else {
          // Process search results directly
          for (const item of searchResponse.data.items) {
            if (prs.length >= limit) break;

            // The search API returns issues and PRs, so we need to check if it's a PR
            if (item.pull_request) {
              prs.push({
                number: item.number,
                title: item.title,
                author: item.user?.login || "Unknown",
                createdAt: formatDateForSheets(item.created_at),
                mergedAt:
                  item.closed_at && item.state === "closed"
                    ? formatDateForSheets(item.closed_at)
                    : "Not merged",
                url: item.html_url,
              });
            }
          }

          page++;
        }
      }
    } finally {
      // Restore original console.warn
      console.warn = originalConsoleWarn;
    }

    console.log(`Total PRs found: ${prs.length}`);
    return prs;
  } catch (error) {
    console.error("Error fetching pull requests:", error);
    throw new Error(
      `Failed to fetch pull requests: ${(error as Error).message}`
    );
  }
}

// Make checkRateLimit exportable
export async function checkRateLimit(verbose = false) {
  try {
    const response = await octokit.rateLimit.get();
    const { limit, used, remaining, reset } = response.data.resources.core;
    const resetDate = new Date(reset * 1000);

    if (verbose) {
      console.log("=== GitHub API Rate Limit Status ===");
      console.log(`Limit: ${limit}`);
      console.log(`Used: ${used}`);
      console.log(`Remaining: ${remaining}`);
      console.log(`Reset at: ${resetDate.toLocaleString()}`);
      console.log(
        `Time until reset: ${Math.round(
          (reset * 1000 - Date.now()) / 60000
        )} minutes`
      );
      console.log("====================================");
    }

    return { limit, used, remaining, reset, resetDate };
  } catch (error) {
    console.error("Error checking rate limit:", error);
    return { limit: 0, used: 0, remaining: 0, reset: 0, resetDate: new Date() };
  }
}

// Add this function to test authentication
export async function testAuth(token?: string) {
  // If token is provided, update the octokit instance
  if (token) {
    setToken(token);
  }

  try {
    // First check rate limit to see what GitHub thinks our auth status is
    const rateLimit = await octokit.rateLimit.get();
    console.log("Rate limit info:", {
      limit: rateLimit.data.resources.core.limit,
      remaining: rateLimit.data.resources.core.remaining,
    });

    // If limit is 60, we're not authenticated properly
    if (rateLimit.data.resources.core.limit === 60) {
      console.error(
        "⚠️ WARNING: Rate limit is only 60, suggesting unauthenticated access"
      );
      console.error("Check your token and authentication method");
    }

    // Try to get authenticated user info
    const { data } = await octokit.users.getAuthenticated();
    console.log(`✅ Successfully authenticated as ${data.login}`);
    return true;
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    return false;
  }
}

// Update the helper function to format dates as DD/MM/YYYY
function formatDateForSheets(dateString: string): string {
  if (
    !dateString ||
    dateString === "Not merged" ||
    dateString === "Unknown" ||
    dateString.includes("Not available")
  ) {
    return dateString;
  }

  try {
    // Parse the ISO date string
    const date = new Date(dateString);

    // Format as DD/MM/YYYY which is preferred for Google Sheets
    // Pad with leading zeros for single-digit days and months
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.warn(`Could not parse date: ${dateString}`);
    return dateString;
  }
}
