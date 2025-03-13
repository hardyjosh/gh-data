export function displayTable<T extends Record<string, any>>(data: T[]): void {
  if (!data || data.length === 0) {
    console.log("No data to display");
    return;
  }

  // Get all keys from the first object
  const keys = Object.keys(data[0]);

  // Calculate column widths
  const columnWidths: Record<string, number> = {};
  keys.forEach((key) => {
    columnWidths[key] = key.length;
    data.forEach((item) => {
      const valueLength = String(item[key] || "").length;
      if (valueLength > columnWidths[key]) {
        columnWidths[key] = valueLength;
      }
    });
  });

  // Create header row
  let headerRow = "";
  let separatorRow = "";
  keys.forEach((key) => {
    headerRow += `| ${key.padEnd(columnWidths[key])} `;
    separatorRow += `| ${"-".repeat(columnWidths[key])} `;
  });
  headerRow += "|";
  separatorRow += "|";

  console.log(headerRow);
  console.log(separatorRow);

  // Create data rows
  data.forEach((item) => {
    let row = "";
    keys.forEach((key) => {
      const value = String(item[key] || "");
      row += `| ${value.padEnd(columnWidths[key])} `;
    });
    row += "|";
    console.log(row);
  });
}
