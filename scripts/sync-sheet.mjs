// Sync the participants Google Sheet -> Supabase.
// Runs on a schedule (GitHub Actions, every 5h) and on manual dispatch.
//
// Reconciles by NATURAL keys (group name, lab name, participant email):
//   - inserts new groups / labs / participants
//   - updates changed fields on existing ones
//   - NEVER deletes (removed people are logged as "orphans" so their
//     selections are never cascade-wiped). Set ALLOW_DELETE=true to opt in.
//
// Env:
//   SUPABASE_URL          (or VITE_SUPABASE_URL)          — required
//   SUPABASE_SERVICE_ROLE (or VITE_SUPABASE_ANON_KEY)     — required (write access)
//   SHEET_ID              — optional, defaults to the summit sheet
//   SHEET_GID             — optional, defaults to 1069324629
//   ALLOW_DELETE          — optional, "true" to hard-delete orphaned participants
import { createClient } from '@supabase/supabase-js';
import { parseSheet } from './lib/parse-sheet.mjs';

const SHEET_ID = process.env.SHEET_ID || '17e90sIy0RtwrzCdn0lCnWsLQWP8ObmBARwLPFqDhcHc';
const SHEET_GID = process.env.SHEET_GID || '1069324629';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_ANON_KEY;
const ALLOW_DELETE = process.env.ALLOW_DELETE === 'true';

function fail(msg) {
  console.error('✗ ' + msg);
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  fail(
    'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE ' +
      '(or VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) as repo secrets.',
  );
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function getAll(table) {
  const { data, error } = await sb.from(table).select('*');
  if (error) fail(`read ${table}: ${error.message}`);
  return data ?? [];
}

// Fields we manage from the sheet. org_logo_url is intentionally excluded so
// logos uploaded via the CMS are preserved.
const PARTICIPANT_FIELDS = ['stt', 'title', 'name', 'country', 'org', 'role', 'coordinator', 'group_id'];

function diff(existing, desired, fields) {
  const patch = {};
  for (const f of fields) {
    const a = existing[f] ?? null;
    const b = desired[f] ?? null;
    if (a !== b) patch[f] = b;
  }
  return patch;
}

async function main() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`;
  console.log('→ Fetching sheet:', url);
  const res = await fetch(url);
  if (!res.ok) fail(`sheet fetch failed: HTTP ${res.status}`);
  const csv = await res.text();
  const desired = parseSheet(csv);
  console.log(
    `→ Sheet parsed: ${desired.groups.length} groups, ${desired.labs.length} labs, ${desired.participants.length} participants.`,
  );

  const stats = { groupsAdded: 0, groupsUpdated: 0, labsAdded: 0, labsUpdated: 0, partsAdded: 0, partsUpdated: 0, orphans: [] };

  // ---- Groups (key: name) ----
  const existingGroups = await getAll('groups');
  const groupIdByName = new Map(existingGroups.map((g) => [g.name, g.id]));
  for (const g of desired.groups) {
    const cur = existingGroups.find((x) => x.name === g.name);
    if (!cur) {
      const { data, error } = await sb.from('groups').insert({ name: g.name, color: g.color, sort_order: g.sort_order }).select().single();
      if (error) fail(`insert group "${g.name}": ${error.message}`);
      groupIdByName.set(g.name, data.id);
      stats.groupsAdded++;
    } else {
      const patch = diff(cur, { color: g.color, sort_order: g.sort_order }, ['sort_order']); // keep CMS colors
      if (Object.keys(patch).length) {
        const { error } = await sb.from('groups').update(patch).eq('id', cur.id);
        if (error) fail(`update group "${g.name}": ${error.message}`);
        stats.groupsUpdated++;
      }
    }
  }

  // ---- Labs (key: group_id + name) ----
  const existingLabs = await getAll('labs');
  for (const l of desired.labs) {
    const gid = groupIdByName.get(l.group_name);
    if (gid == null) continue;
    const cur = existingLabs.find((x) => x.group_id === gid && x.name === l.name);
    if (!cur) {
      const { error } = await sb.from('labs').insert({ group_id: gid, name: l.name, sort_order: l.sort_order });
      if (error) fail(`insert lab "${l.name}": ${error.message}`);
      stats.labsAdded++;
    } else if (cur.sort_order !== l.sort_order) {
      const { error } = await sb.from('labs').update({ sort_order: l.sort_order }).eq('id', cur.id);
      if (error) fail(`update lab "${l.name}": ${error.message}`);
      stats.labsUpdated++;
    }
  }

  // ---- Participants (key: email) ----
  const existingParts = await getAll('participants');
  const byEmail = new Map(existingParts.map((p) => [String(p.email).toLowerCase(), p]));
  const desiredEmails = new Set();
  for (const p of desired.participants) {
    if (!p.email) continue;
    desiredEmails.add(p.email);
    const row = {
      stt: p.stt, title: p.title, name: p.name, country: p.country,
      org: p.org, role: p.role, coordinator: p.coordinator,
      group_id: p.topic ? (groupIdByName.get(p.topic) ?? null) : null,
    };
    const cur = byEmail.get(p.email);
    if (!cur) {
      const { error } = await sb.from('participants').insert({ email: p.email, ...row });
      if (error) fail(`insert participant "${p.email}": ${error.message}`);
      stats.partsAdded++;
    } else {
      const patch = diff(cur, row, PARTICIPANT_FIELDS);
      if (Object.keys(patch).length) {
        const { error } = await sb.from('participants').update(patch).eq('id', cur.id);
        if (error) fail(`update participant "${p.email}": ${error.message}`);
        stats.partsUpdated++;
      }
    }
  }

  // ---- Orphans (in DB but no longer in sheet) ----
  // Self-registered guests are never in the sheet — exclude them from orphan
  // handling so they are never flagged or deleted.
  for (const p of existingParts) {
    const email = String(p.email).toLowerCase();
    if (!desiredEmails.has(email) && !p.self_registered) stats.orphans.push(p.name || email);
  }
  if (ALLOW_DELETE && stats.orphans.length) {
    for (const p of existingParts) {
      if (!desiredEmails.has(String(p.email).toLowerCase()) && !p.self_registered) {
        const { error } = await sb.from('participants').delete().eq('id', p.id);
        if (error) fail(`delete orphan "${p.email}": ${error.message}`);
      }
    }
  }

  console.log('\n=== Sync summary ===');
  console.log(`Groups:       +${stats.groupsAdded} added, ${stats.groupsUpdated} updated`);
  console.log(`Units (labs): +${stats.labsAdded} added, ${stats.labsUpdated} updated`);
  console.log(`Participants: +${stats.partsAdded} added, ${stats.partsUpdated} updated`);
  console.log(
    `Orphans (in DB, not in sheet): ${stats.orphans.length}` +
      (stats.orphans.length ? ` — ${stats.orphans.join(', ')}` : '') +
      (ALLOW_DELETE ? ' [DELETED]' : ' [kept — set ALLOW_DELETE=true to remove]'),
  );
  console.log('✓ Sync complete.');
}

main().catch((e) => fail(e.message));
