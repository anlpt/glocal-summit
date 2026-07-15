// Shared parser: participants CSV -> { groups, labs, participants } using
// NATURAL keys (group name, lab name, participant email). Used by both
// build-seed.mjs (assigns ids for the static seed) and sync-sheet.mjs
// (reconciles into Supabase by natural key).

// 7 group colors (kept in sync with tokens.css --group-1..7).
export const GROUP_COLORS = [
  '#cc2027', '#e8710a', '#1f9e6e', '#2f6fd6', '#7b4bd0', '#128a9c', '#c0327a',
];

// Minimal RFC-4180 CSV parser (handles quotes + embedded newlines).
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

export function splitLabs(topic) {
  if (!topic || !topic.trim()) return [];
  return topic.split(/\s*[-;]\s*/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/**
 * Parse the participants CSV text into natural-key data.
 * @returns {{ groups: {name,color,sort_order}[],
 *             labs: {group_name,name,sort_order}[],
 *             participants: {stt,title,name,country,org,role,email,coordinator,topic}[] }}
 */
export function parseSheet(csvText) {
  const rows = parseCSV(csvText).filter((r) => r.some((c) => c && c.trim()));
  const header = rows[0];
  const col = (name) => header.indexOf(name);
  const iSTT = col('STT'), iTitle = col('Danh xưng'), iName = col('Họ tên');
  const iCountry = col('Quốc gia'), iOrg = col('Đơn vị Logo'), iRole = col('Chức vụ');
  const iEmail = col('Email'), iCoord = col('Coordinator'), iTopic = col('Topic');

  const data = rows.slice(1).filter((r) => clean(r[iName]));

  // Groups: distinct non-empty Topic, verbatim, in first-seen order.
  const groups = [];
  const seen = new Set();
  for (const r of data) {
    const topic = clean(r[iTopic]);
    if (!topic || seen.has(topic)) continue;
    seen.add(topic);
    groups.push({ name: topic, color: GROUP_COLORS[groups.length % GROUP_COLORS.length], sort_order: groups.length + 1 });
  }

  // Labs: split each group's Topic string.
  const labs = [];
  for (const g of groups) {
    splitLabs(g.name).forEach((name, idx) => {
      labs.push({ group_name: g.name, name, sort_order: idx + 1 });
    });
  }

  // Participants (email lowercased; topic = group name or '').
  const participants = data.map((r) => ({
    stt: clean(r[iSTT]),
    title: clean(r[iTitle]),
    name: clean(r[iName]),
    country: clean(r[iCountry]),
    org: clean(r[iOrg]),
    role: clean(r[iRole]),
    email: clean(r[iEmail]).toLowerCase(),
    coordinator: clean(r[iCoord]),
    topic: clean(r[iTopic]),
  }));

  return { groups, labs, participants };
}
