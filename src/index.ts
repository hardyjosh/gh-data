#!/usr/bin/env node

// Load environment variables first
import * as dotenv from "dotenv";
dotenv.config();

// Get token from environment
const token = process.env.GITHUB_TOKEN;

import { Command } from "commander";
import { fetchPullRequests, setToken } from "./fetchers/pullRequestFetcher.js";
import { displayTable } from "./utils/display.js";
import { exportToCsv } from "./utils/csvExport.js";
import path from "path";

// Set the token immediately after importing
if (token) {
  setToken(token);
}

const program = new Command();

program.version("1.0.0").description("A tool to fetch GitHub repository data");

program
  .command("prs")
  .description("Fetch pull requests from a GitHub repository")
  .requiredOption(
    "--owner <owner>",
    "Repository owner (organization or username)"
  )
  .requiredOption("--repo <repo>", "Repository name")
  .option("--state <state>", "PR state (open, closed, all)", "all")
  .option("--limit <limit>", "Limit the number of PRs returned", "1000")
  .option("--author <author>", "Filter PRs by author")
  .option("--format <format>", "Output format (table, csv)", "table")
  .option("--path <path>", "Path to save CSV file", "./output")
  .action(async (options) => {
    try {
      // Don't log token details
      if (process.env.GITHUB_TOKEN) {
        setToken(process.env.GITHUB_TOKEN);
      }

      // Fetch PRs without showing rate limit details
      const prs = await fetchPullRequests(
        options.owner,
        options.repo,
        options.state as "open" | "closed" | "all",
        parseInt(options.limit),
        options.author,
        process.env.GITHUB_TOKEN
      );

      if (prs.length === 0) {
        console.log("No pull requests found");
        return;
      }

      if (options.format === "csv") {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `${options.owner}_${options.repo}_prs_${timestamp}.csv`;
        const filePath = path.join(options.path, fileName);
        exportToCsv(prs, filePath);
      } else {
        displayTable(prs);
      }
    } catch (error) {
      console.error("Error fetching pull requests:", (error as Error).message);
      process.exit(1);
    }
  });

program
  .command("rate-limit")
  .description("Check GitHub API rate limit status")
  .action(async () => {
    try {
      const { checkRateLimit } = await import(
        "./fetchers/pullRequestFetcher.js"
      );
      await checkRateLimit();
    } catch (error) {
      console.error("Error checking rate limit:", (error as Error).message);
      process.exit(1);
    }
  });

program
  .command("test-auth")
  .description("Test GitHub API authentication")
  .action(async () => {
    try {
      const { testAuth } = await import("./fetchers/pullRequestFetcher.js");
      await testAuth(token);
    } catch (error) {
      console.error("Error testing authentication:", (error as Error).message);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
