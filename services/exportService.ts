import { Row } from '../types';

// Fix: Restrict `key` to the properties that are actually used ('mapcode', 'telephone', 'address').
// This allows TypeScript to correctly infer the return type as `string`, resolving the type error.
function getRowValue(row: Row, key: 'mapcode' | 'telephone' | 'address'): string {
    if (key in row.manual_overrides) {
        // The `key` is one of 'mapcode', 'telephone', 'address', so this access is safe.
        // The `|| ''` handles cases where the override value is `null`.
        return row.manual_overrides[key] || '';
    }
    // Accessing row[key] is also safe, and we ensure a string is returned.
    return row[key] || '';
}

function rowToTsv(row: Row): string {
    const displayName = row.display_name || '';
    const mapcode = getRowValue(row, 'mapcode');
    const telephone = getRowValue(row, 'telephone');
    const address = getRowValue(row, 'address');
    return [displayName, mapcode, telephone, address].join('\t');
}

function rowToCsvArray(row: Row): string[] {
    const displayName = row.display_name || '';
    const mapcode = getRowValue(row, 'mapcode');
    const telephone = getRowValue(row, 'telephone');
    const address = getRowValue(row, 'address');
    return [displayName, mapcode, telephone, address];
}


const CSV_HEADER = ['place_name', 'mapcode', 'telephone', 'address'];

export function generateTsv(rows: Row[]): string {
    const header = CSV_HEADER.join('\t');
    const body = rows.map(rowToTsv).join('\n');
    return `${header}\n${body}`;
}


function toCsvRow(items: string[]): string {
  return items.map(item => {
    // Add quotes if item contains comma, double quote or newline
    if (/[",\n]/.test(item)) {
      return `"${item.replace(/"/g, '""')}"`;
    }
    return item;
  }).join(',');
}

export function exportCsv(rows: Row[]) {
    const csvContent = [
        toCsvRow(CSV_HEADER),
        ...rows.map(row => toCsvRow(rowToCsvArray(row)))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "japan_places.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}