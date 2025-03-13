import * as fs from "fs";
import * as path from "path";

export function exportToCsv<T>(data: T[], filePath: string): void {
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Get headers from the first object
    const headers = Object.keys(data[0] || {});

    // Create CSV content
    const csvContent = [
      headers.join(","), // Header row
      ...data.map((item) =>
        headers
          .map((header) => {
            const value = (item as any)[header];

            // Format values for CSV
            if (value === null || value === undefined) {
              return "";
            }

            // If it's a URL or contains commas, wrap in quotes
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes("http"))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }

            return value;
          })
          .join(",")
      ),
    ].join("\n");

    // Write to file
    fs.writeFileSync(filePath, csvContent);
    console.log(`CSV exported to ${filePath}`);
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    throw error;
  }
}
