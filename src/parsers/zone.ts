/** CSV parser used by the importer; rows may contain quoted commas. */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = []; let value = ''; let quoted = false;
  for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { if (quoted && line[i + 1] === '"') { value += ch; i++; } else quoted = !quoted; } else if (ch === ',' && !quoted) { fields.push(value); value = ''; } else value += ch; }
  fields.push(value); return fields;
}
