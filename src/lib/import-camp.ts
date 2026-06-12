export type ImportGroupRow = {
  name: string;
  username: string;
  sortOrder: number;
  active: boolean;
};

export type ImportTaskRow = {
  title: string;
  sortOrder: number;
  active: boolean;
};

export type ImportCampData = {
  groups: ImportGroupRow[];
  tasks: ImportTaskRow[];
};

export type ImportParseResult =
  | { ok: true; data: ImportCampData }
  | { ok: false; error: string };

function parseBoolean(value: string) {
  const v = value.trim().toLowerCase();
  return v === "ja" || v === "true" || v === "1" || v === "yes";
}

function detectDelimiter(headerLine: string) {
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return semicolons >= commas ? ";" : ",";
}

function splitCsvLine(line: string, delimiter: string) {
  return line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

function normalizeHeader(cell: string) {
  return cell
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

export function parseImportCsv(text: string): ImportParseResult {
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  if (!cleaned) {
    return { ok: false, error: "Filen er tom." };
  }

  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (lines.length < 2) {
    return { ok: false, error: "Skabelonen skal have overskrift og mindst én række." };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map(normalizeHeader);

  const typeIdx = headers.findIndex((h) => h === "type");
  const nameIdx = headers.findIndex((h) => h === "navn" || h === "name");
  const usernameIdx = headers.findIndex((h) => h === "brugernavn" || h === "username");
  const titleIdx = headers.findIndex((h) => h === "titel" || h === "title");
  const sortIdx = headers.findIndex((h) => h === "sortering" || h === "sortorder");
  const activeIdx = headers.findIndex((h) => h === "aktiv" || h === "active");

  if (typeIdx === -1) {
    return { ok: false, error: 'Mangler kolonnen "type" i overskriften.' };
  }

  const groups: ImportGroupRow[] = [];
  const tasks: ImportTaskRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter);
    const type = (cells[typeIdx] ?? "").toLowerCase();

    if (type === "gruppe" || type === "group") {
      const name = cells[nameIdx] ?? "";
      const username = cells[usernameIdx] ?? "";
      if (!name || !username) {
        return {
          ok: false,
          error: `Række ${i + 1}: gruppe skal have navn og brugernavn.`,
        };
      }
      groups.push({
        name,
        username,
        sortOrder: Number(cells[sortIdx] ?? groups.length + 1) || groups.length + 1,
        active: activeIdx === -1 ? true : parseBoolean(cells[activeIdx] ?? "ja"),
      });
      continue;
    }

    if (type === "opgave" || type === "task" || type === "poster") {
      const title = cells[titleIdx] ?? "";
      if (!title) {
        return {
          ok: false,
          error: `Række ${i + 1}: opgave skal have titel.`,
        };
      }
      tasks.push({
        title,
        sortOrder: Number(cells[sortIdx] ?? tasks.length + 1) || tasks.length + 1,
        active: activeIdx === -1 ? true : parseBoolean(cells[activeIdx] ?? "ja"),
      });
      continue;
    }

    return {
      ok: false,
      error: `Række ${i + 1}: ukendt type "${type}". Brug "gruppe" eller "opgave".`,
    };
  }

  if (groups.length === 0 && tasks.length === 0) {
    return { ok: false, error: "Ingen grupper eller opgaver fundet i filen." };
  }

  return { ok: true, data: { groups, tasks } };
}

export function parseImportJson(text: string): ImportParseResult {
  try {
    const raw = JSON.parse(text) as {
      groups?: Array<{
        name?: string;
        username?: string;
        sortOrder?: number;
        active?: boolean;
      }>;
      tasks?: Array<{
        title?: string;
        sortOrder?: number;
        active?: boolean;
      }>;
    };

    const groups: ImportGroupRow[] = (raw.groups ?? [])
      .map((g, index) => ({
        name: String(g.name ?? "").trim(),
        username: String(g.username ?? "").trim(),
        sortOrder: Number(g.sortOrder ?? index + 1) || index + 1,
        active: g.active !== false,
      }))
      .filter((g) => g.name && g.username);

    const tasks: ImportTaskRow[] = (raw.tasks ?? [])
      .map((t, index) => ({
        title: String(t.title ?? "").trim(),
        sortOrder: Number(t.sortOrder ?? index + 1) || index + 1,
        active: t.active !== false,
      }))
      .filter((t) => t.title);

    if (groups.length === 0 && tasks.length === 0) {
      return { ok: false, error: "JSON skal indeholde grupper og/eller opgaver." };
    }

    return { ok: true, data: { groups, tasks } };
  } catch {
    return { ok: false, error: "Ugyldig JSON-fil." };
  }
}

export function parseImportFile(filename: string, text: string): ImportParseResult {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".json")) return parseImportJson(text);
  return parseImportCsv(text);
}

export const IMPORT_CSV_TEMPLATE = `type;navn;brugernavn;titel;sortering;aktiv
gruppe;Gruppe 1;Grp. 1;;1;ja
gruppe;Gruppe 2;Grp. 2;;2;ja
gruppe;Gruppe 3;Grp. 3;;3;ja
opgave;;;Opgave 1 — Velkommen;1;ja
opgave;;;Opgave 2 — Aktivitet;2;ja
opgave;;;Opgave 3 — Aftensmad;3;ja
`;
