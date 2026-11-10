import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// These files define the SECURITY DEFINER RPCs that the app depends on.
// PostgreSQL rejects a PL/pgSQL statement when an output column name of a
// `RETURNS TABLE` function is also used unqualified inside the body, because it
// cannot tell the column from the output parameter. That broke `add_item`
// (RETURNING id) and `join_group` (WHERE group_id) in production, so this test
// keeps the SQL files free of the same pattern.
const SQL_FILES = [
  'supabase/migrations/20261109010000_group_logic.sql',
  'supabase/migrations/20261109020000_fix_add_item_returning.sql',
  'supabase/migrations/20261109030000_fix_join_group_ambiguity.sql',
  'supabase/migrations/20261110010000_suggestions_and_members.sql',
  'supabase/migrations/20261110020000_delete_and_notifications.sql',
  'supabase/migrations/20261110030000_bulk_import_and_capabilities.sql',
  'supabase/migrations/20261110040000_edit_and_hidden_items.sql',
  'supabase/migrations/20261110050000_preapproved_members.sql',
  'supabase/migrations/20261110060000_one_time_invites.sql',
  'supabase/migrations/20261110070000_fix_invite_token.sql',
  'supabase_schema.sql',
];

function parseTableFunctions(sql) {
  const pattern =
    /create or replace function public\.(\w+)\s*\([\s\S]*?\)\s*returns\s+(table\s*\(([\s\S]*?)\)|boolean|integer|jsonb)\s*language\s+(?:plpgsql|sql)[\s\S]*?as \$\$([\s\S]*?)\$\$;/gi;

  const functions = [];
  let match = pattern.exec(sql);

  while (match) {
    const isTable = /^table/i.test(match[2]);
    const columns = isTable
      ? match[3]
          .split(',')
          .map((line) => line.trim().split(/\s+/)[0])
          .filter(Boolean)
      : [];

    functions.push({ name: match[1], columns, body: match[4] });
    match = pattern.exec(sql);
  }

  return functions;
}

describe.each(SQL_FILES)('%s', (file) => {
  const functions = parseTableFunctions(readFileSync(file, 'utf8'));

  it('contains parseable table-returning functions', () => {
    expect(functions.length).toBeGreaterThan(0);
  });

  it('does not use output column names in RETURNING ... INTO', () => {
    const offenders = [];

    for (const fn of functions) {
      for (const column of fn.columns) {
        if (new RegExp(`returning\\s+${column}\\s+into`, 'i').test(fn.body)) {
          offenders.push(`${fn.name}: ${column}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('does not use output column names unqualified in WHERE/AND/ON', () => {
    const offenders = [];

    for (const fn of functions) {
      for (const column of fn.columns) {
        if (new RegExp(`(?:where|and|on)\\s+${column}\\s*=`, 'i').test(fn.body)) {
          offenders.push(`${fn.name}: ${column}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
