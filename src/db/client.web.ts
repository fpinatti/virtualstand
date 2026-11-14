import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as schema from './schema';

export const DATABASE_NAME = 'virtualstand.db';
const STORAGE_KEY = 'virtualstand_web_db_v1';

type RowRecord = Record<string, unknown>;

interface TableStore {
  autoIncrement: Record<string, number>;
  tables: Record<string, RowRecord[]>;
}

const TABLE_DEFAULTS: Record<string, RowRecord> = {
  games: {},
  box_dimensions: { is_estimated: 0 },
  collection_items: { status_own: 1, status_wishlist: 0, status_played: 0 },
  sync_logs: { total_items: 0, items_inserted: 0, items_updated: 0 },
  game_sleeves: { card_set_name: 'Baralho Principal', is_sleeved: 0 },
  sleeve_inventory: { pack_size: 100, packs_owned: 0, loose_sleeves: 0 },
  rulebooks: {
    doc_type: 'BASE_RULES',
    last_viewed_page: 1,
    status: 'PENDING_VERIFICATION',
  },
  rulebook_bookmarks: {},
  rulebook_notes: {},
  players: { is_hidden: 0 },
  play_sessions: {},
  play_participants: { is_winner: 0 },
  personal_ratings: {},
};

const AUTO_INCREMENT_TABLES = new Set([
  'box_dimensions',
  'collection_items',
  'sync_logs',
  'game_sleeves',
  'sleeve_inventory',
  'rulebooks',
  'rulebook_bookmarks',
  'rulebook_notes',
  'players',
  'play_sessions',
  'play_participants',
]);

function createInitialDemoStore(): TableStore {
  const now = Date.now();
  return {
    autoIncrement: {
      box_dimensions: 7,
      collection_items: 7,
      sync_logs: 2,
      game_sleeves: 6,
      sleeve_inventory: 3,
      rulebooks: 2,
      rulebook_bookmarks: 3,
      rulebook_notes: 2,
      players: 4,
      play_sessions: 3,
      play_participants: 6,
    },
    tables: {
      games: [
        {
          bgg_id: 13,
          title: 'Catan',
          year_published: 1995,
          min_players: 3,
          max_players: 4,
          min_playtime: 60,
          max_playtime: 120,
          thumbnail_url: null,
          image_url: null,
          local_thumbnail_uri: null,
          local_image_uri: null,
          created_at: now,
          updated_at: now,
        },
        {
          bgg_id: 822,
          title: 'Carcassonne',
          year_published: 2000,
          min_players: 2,
          max_players: 5,
          min_playtime: 30,
          max_playtime: 45,
          thumbnail_url: null,
          image_url: null,
          local_thumbnail_uri: null,
          local_image_uri: null,
          created_at: now,
          updated_at: now,
        },
        {
          bgg_id: 9209,
          title: 'Ticket to Ride',
          year_published: 2004,
          min_players: 2,
          max_players: 5,
          min_playtime: 30,
          max_playtime: 60,
          thumbnail_url: null,
          image_url: null,
          local_thumbnail_uri: null,
          local_image_uri: null,
          created_at: now,
          updated_at: now,
        },
        {
          bgg_id: 230802,
          title: 'Azul',
          year_published: 2017,
          min_players: 2,
          max_players: 4,
          min_playtime: 30,
          max_playtime: 45,
          thumbnail_url: null,
          image_url: null,
          local_thumbnail_uri: null,
          local_image_uri: null,
          created_at: now,
          updated_at: now,
        },
        {
          bgg_id: 266192,
          title: 'Wingspan',
          year_published: 2019,
          min_players: 1,
          max_players: 5,
          min_playtime: 40,
          max_playtime: 70,
          thumbnail_url: null,
          image_url: null,
          local_thumbnail_uri: null,
          local_image_uri: null,
          created_at: now,
          updated_at: now,
        },
        {
          bgg_id: 167791,
          title: 'Terraforming Mars',
          year_published: 2016,
          min_players: 1,
          max_players: 5,
          min_playtime: 120,
          max_playtime: 120,
          thumbnail_url: null,
          image_url: null,
          local_thumbnail_uri: null,
          local_image_uri: null,
          created_at: now,
          updated_at: now,
        },
      ],
      box_dimensions: [
        { id: 1, bgg_id: 13, width_cm: 29.5, height_cm: 29.5, depth_cm: 7.5, weight_kg: 1.2, version_id: 1, version_name: 'Edição Padrão', is_estimated: 0, updated_at: now },
        { id: 2, bgg_id: 822, width_cm: 27.5, height_cm: 19.0, depth_cm: 6.8, weight_kg: 0.8, version_id: 2, version_name: 'Edição Padrão', is_estimated: 0, updated_at: now },
        { id: 3, bgg_id: 9209, width_cm: 29.7, height_cm: 29.7, depth_cm: 7.6, weight_kg: 1.3, version_id: 3, version_name: 'Edição Padrão', is_estimated: 0, updated_at: now },
        { id: 4, bgg_id: 230802, width_cm: 26.0, height_cm: 26.0, depth_cm: 7.0, weight_kg: 1.1, version_id: 4, version_name: 'Edição Padrão', is_estimated: 0, updated_at: now },
        { id: 5, bgg_id: 266192, width_cm: 29.6, height_cm: 29.6, depth_cm: 7.5, weight_kg: 1.5, version_id: 5, version_name: 'Edição Padrão', is_estimated: 0, updated_at: now },
        { id: 6, bgg_id: 167791, width_cm: 29.8, height_cm: 29.8, depth_cm: 7.2, weight_kg: 1.6, version_id: 6, version_name: 'Edição Padrão', is_estimated: 0, updated_at: now },
      ],
      collection_items: [
        { id: 1, coll_id: 1001, bgg_id: 13, status_own: 1, status_wishlist: 0, status_played: 1, bgg_rating: 8.5, bgg_comment: 'Clássico de negociação e rotas', local_notes: 'Caixa com insert organizador', custom_tags: '["Familia","Estrategia"]', acquisition_date: '2024-03-10', created_at: now, updated_at: now },
        { id: 2, coll_id: 1002, bgg_id: 822, status_own: 1, status_wishlist: 0, status_played: 1, bgg_rating: 8.0, bgg_comment: 'Ótimo para 2 jogadores', local_notes: null, custom_tags: null, acquisition_date: '2024-04-15', created_at: now, updated_at: now },
        { id: 3, coll_id: 1003, bgg_id: 9209, status_own: 1, status_wishlist: 0, status_played: 1, bgg_rating: 8.2, bgg_comment: null, local_notes: null, custom_tags: null, acquisition_date: '2024-05-20', created_at: now, updated_at: now },
        { id: 4, coll_id: 1004, bgg_id: 230802, status_own: 1, status_wishlist: 0, status_played: 1, bgg_rating: 8.7, bgg_comment: null, local_notes: null, custom_tags: null, acquisition_date: '2024-06-01', created_at: now, updated_at: now },
        { id: 5, coll_id: 1005, bgg_id: 266192, status_own: 1, status_wishlist: 0, status_played: 1, bgg_rating: 9.0, bgg_comment: null, local_notes: null, custom_tags: null, acquisition_date: '2024-07-12', created_at: now, updated_at: now },
        { id: 6, coll_id: 1006, bgg_id: 167791, status_own: 1, status_wishlist: 0, status_played: 1, bgg_rating: 9.2, bgg_comment: null, local_notes: null, custom_tags: null, acquisition_date: '2024-08-19', created_at: now, updated_at: now },
      ],
      sync_logs: [
        { id: 1, username: 'demo_web', status: 'COMPLETED', total_items: 6, items_inserted: 6, items_updated: 0, error_message: null, started_at: now - 5000, completed_at: now },
      ],
      game_sleeves: [
        { id: 1, bgg_id: 13, card_set_name: 'Recursos e Desenvolvimento', format_name: 'Chimera (57.5x89mm)', width_mm: 57.5, height_mm: 89, card_count: 120, is_sleeved: 1, created_at: now, updated_at: now },
        { id: 2, bgg_id: 9209, card_set_name: 'Vagões e Bilhetes', format_name: 'Mini USA (41x63mm)', width_mm: 41, height_mm: 63, card_count: 144, is_sleeved: 0, created_at: now, updated_at: now },
        { id: 3, bgg_id: 266192, card_set_name: 'Cartas de Pássaros e Bônus', format_name: 'Chimera (57.5x89mm)', width_mm: 57.5, height_mm: 89, card_count: 196, is_sleeved: 0, created_at: now, updated_at: now },
        { id: 4, bgg_id: 167791, card_set_name: 'Projetos e Corporações', format_name: 'Padrão / Standard (63.5x88mm)', width_mm: 63.5, height_mm: 88, card_count: 233, is_sleeved: 0, created_at: now, updated_at: now },
      ],
      sleeve_inventory: [
        { id: 1, format_name: 'Padrão / Standard (63.5x88mm)', width_mm: 63.5, height_mm: 88, brand: 'Bucaneiros', pack_size: 100, packs_owned: 2, loose_sleeves: 15, notes: 'Espessura tradicional', created_at: now, updated_at: now },
        { id: 2, format_name: 'Chimera (57.5x89mm)', width_mm: 57.5, height_mm: 89, brand: 'Meeple Virus', pack_size: 100, packs_owned: 1, loose_sleeves: 0, notes: null, created_at: now, updated_at: now },
      ],
      rulebooks: [
        {
          id: 1,
          bgg_id: 13,
          label: 'Manual Base & Almanaque — Catan',
          doc_type: 'BASE_RULES',
          source_kind: 'LOCAL_PICKER',
          source_url: null,
          relative_path: 'rulebooks/13/demo-catan-manual.pdf',
          file_size_bytes: 2450120,
          md5: 'd41d8cd98f00b204e9800998ecf8427e',
          page_count: 16,
          last_viewed_page: 4,
          status: 'READY',
          created_at: now,
          updated_at: now,
        },
      ],
      rulebook_bookmarks: [
        { id: 1, rulebook_id: 1, page: 3, title: 'Preparação do Tabuleiro (Setup)', created_at: now, updated_at: now },
        { id: 2, rulebook_id: 1, page: 7, title: 'Regras do Ladrão e Descarte', created_at: now, updated_at: now },
      ],
      rulebook_notes: [
        { id: 1, rulebook_id: 1, page: 4, body: 'Em 4 jogadores usar sempre a distribuição variável de números nas matérias-primas.', created_at: now, updated_at: now },
      ],
      players: [
        { id: 1, name: 'Você', is_hidden: 0, created_at: now, updated_at: now },
        { id: 2, name: 'Mariana', is_hidden: 0, created_at: now, updated_at: now },
        { id: 3, name: 'Lucas', is_hidden: 0, created_at: now, updated_at: now },
      ],
      play_sessions: [
        { id: 1, bgg_id: 13, played_on: '2026-11-10', duration_minutes: 85, outcome: 'WIN', comments: 'Vitória fechando a Maior Estrada na última rodada!', created_at: now - 86400000, updated_at: now - 86400000 },
        { id: 2, bgg_id: 13, played_on: '2026-11-12', duration_minutes: 75, outcome: 'LOSS', comments: 'Mariana dominou os portos de trigo.', created_at: now, updated_at: now },
      ],
      play_participants: [
        { id: 1, session_id: 1, player_id: 1, score: 10, is_winner: 1 },
        { id: 2, session_id: 1, player_id: 2, score: 8, is_winner: 0 },
        { id: 3, session_id: 1, player_id: 3, score: 7, is_winner: 0 },
        { id: 4, session_id: 2, player_id: 1, score: 8, is_winner: 0 },
        { id: 5, session_id: 2, player_id: 2, score: 10, is_winner: 1 },
      ],
      personal_ratings: [
        { bgg_id: 13, rating: 9, updated_at: now },
        { bgg_id: 266192, rating: 10, updated_at: now },
        { bgg_id: 167791, rating: 9, updated_at: now },
      ],
    },
  };
}

class WebSQLiteEngine {
  private store: TableStore;

  constructor() {
    this.store = this.loadFromStorage();
  }

  private loadFromStorage(): TableStore {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Non-sensitive boardgame catalog cache in localStorage for Web preview
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as TableStore;
          if (parsed && parsed.tables && parsed.autoIncrement) {
            for (const table of Object.keys(TABLE_DEFAULTS)) {
              if (!Array.isArray(parsed.tables[table])) {
                parsed.tables[table] = [];
              }
            }
            return parsed;
          }
        }
      }
    } catch {
      // Ignore storage access errors in private/sandboxed browsing
    }
    const initial = createInitialDemoStore();
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(store: TableStore = this.store): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      }
    } catch {
      // Ignore quota or private mode errors
    }
  }

  execSync(_source: string): void {
    // DDL table creation is handled by TABLE_DEFAULTS initialization
  }

  prepareSync(sqlQuery: string) {
    return {
      executeSync: (params: unknown[] = []) => {
        const res = this.execute(sqlQuery, params);
        return {
          changes: res.changes,
          lastInsertRowId: res.lastInsertRowId,
          getAllSync: () => res.objectRows,
          getFirstSync: () => res.objectRows[0],
        };
      },
      executeForRawResultSync: (params: unknown[] = []) => {
        const res = this.execute(sqlQuery, params);
        return {
          getAllSync: () => res.arrayRows,
        };
      },
      finalizeSync: () => {},
    };
  }

  private execute(
    rawSql: string,
    rawParams: unknown[]
  ): {
    changes: number;
    lastInsertRowId: number;
    objectRows: RowRecord[];
    arrayRows: unknown[][];
  } {
    const params = Array.isArray(rawParams) ? [...rawParams] : [];
    const sql = rawSql.trim().replace(/\s+/g, ' ');
    const lower = sql.toLowerCase();

    if (
      lower.startsWith('begin') ||
      lower.startsWith('commit') ||
      lower.startsWith('rollback') ||
      lower.startsWith('savepoint') ||
      lower.startsWith('release')
    ) {
      return { changes: 0, lastInsertRowId: 0, objectRows: [], arrayRows: [] };
    }

    if (lower.startsWith('insert into')) {
      return this.handleInsert(sql, params);
    }
    if (lower.startsWith('update ')) {
      return this.handleUpdate(sql, params);
    }
    if (lower.startsWith('delete from')) {
      return this.handleDelete(sql, params);
    }
    if (lower.startsWith('select ')) {
      return this.handleSelect(sql, params);
    }

    return { changes: 0, lastInsertRowId: 0, objectRows: [], arrayRows: [] };
  }

  private stripQuotes(identifier: string): string {
    return identifier.trim().replace(/^"+|"+$/g, '');
  }

  private splitTopLevelComma(input: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim().length > 0) {
      parts.push(current.trim());
    }
    return parts;
  }

  private handleInsert(sql: string, params: unknown[]) {
    let paramIdx = 0;
    const match = sql.match(
      /^insert into\s+"([^"]+)"\s*\(([^)]+)\)\s*values\s*\(([^)]+)\)(.*)$/i
    );
    if (!match) {
      return { changes: 0, lastInsertRowId: 0, objectRows: [], arrayRows: [] };
    }

    const tableName = this.stripQuotes(match[1]);
    const columns = this.splitTopLevelComma(match[2]).map((c) => this.stripQuotes(c));
    const valueTokens = this.splitTopLevelComma(match[3]);
    const tail = match[4].trim();

    const defaults = TABLE_DEFAULTS[tableName] ?? {};
    const newRow: RowRecord = { ...defaults };

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const tok = valueTokens[i]?.trim().toLowerCase() ?? '?';
      let val: unknown;
      if (tok === '?') {
        val = params[paramIdx++];
      } else if (tok === 'null' || tok === 'default') {
        val = defaults[col] ?? null;
      } else if (/^-?\d+(\.\d+)?$/.test(tok)) {
        val = Number(tok);
      } else {
        val = tok.replace(/^'+|'+$/g, '');
      }
      if (val !== undefined && val !== null) {
        newRow[col] = val;
      } else if (!(col in newRow)) {
        newRow[col] = null;
      }
    }

    const tableRows = this.store.tables[tableName] ?? (this.store.tables[tableName] = []);

    // Check ON CONFLICT ("col") DO UPDATE SET ...
    const conflictMatch = tail.match(
      /on conflict\s*\("([^"]+)"\)\s*do update set\s+(.+?)(?:\s+returning\s+(.+))?$/i
    );

    let targetRow: RowRecord = newRow;
    let lastInsertRowId = 0;

    if (conflictMatch) {
      const conflictCol = this.stripQuotes(conflictMatch[1]);
      const setClause = conflictMatch[2];
      const existing = tableRows.find((r) => r[conflictCol] === newRow[conflictCol]);

      if (existing) {
        const assignments = this.splitTopLevelComma(setClause);
        for (const assign of assignments) {
          const eqIdx = assign.indexOf('=');
          if (eqIdx === -1) continue;
          const colName = this.stripQuotes(assign.slice(0, eqIdx));
          const rhs = assign.slice(eqIdx + 1).trim();
          if (rhs === '?') {
            existing[colName] = params[paramIdx++] ?? null;
          } else if (rhs.toLowerCase() === 'null') {
            existing[colName] = null;
          }
        }
        targetRow = existing;
        lastInsertRowId = Number(existing.id ?? existing[conflictCol] ?? 0);
      } else {
        if (AUTO_INCREMENT_TABLES.has(tableName) && (newRow.id === null || newRow.id === undefined)) {
          const nextId = this.store.autoIncrement[tableName] ?? 1;
          newRow.id = nextId;
          this.store.autoIncrement[tableName] = nextId + 1;
        }
        tableRows.push(newRow);
        targetRow = newRow;
        lastInsertRowId = Number(newRow.id ?? newRow.bgg_id ?? 0);
      }
    } else {
      if (AUTO_INCREMENT_TABLES.has(tableName) && (newRow.id === null || newRow.id === undefined)) {
        const nextId = this.store.autoIncrement[tableName] ?? 1;
        newRow.id = nextId;
        this.store.autoIncrement[tableName] = nextId + 1;
      }
      tableRows.push(newRow);
      targetRow = newRow;
      lastInsertRowId = Number(newRow.id ?? newRow.bgg_id ?? 0);
    }

    this.saveToStorage();

    const returningMatch = tail.match(/returning\s+(.+)$/i);
    if (returningMatch) {
      const retCols = this.splitTopLevelComma(returningMatch[1]).map((c) => {
        const parts = c.split('.');
        return this.stripQuotes(parts[parts.length - 1]);
      });
      const arrRow = retCols.map((c) => (targetRow[c] !== undefined ? targetRow[c] : null));
      return {
        changes: 1,
        lastInsertRowId,
        objectRows: [targetRow],
        arrayRows: [arrRow],
      };
    }

    return { changes: 1, lastInsertRowId, objectRows: [], arrayRows: [] };
  }

  private handleUpdate(sql: string, params: unknown[]) {
    let paramIdx = 0;
    const match = sql.match(
      /^update\s+"([^"]+)"\s+set\s+(.+?)(?:\s+where\s+(.+?))?(?:\s+returning\s+(.+))?$/i
    );
    if (!match) {
      return { changes: 0, lastInsertRowId: 0, objectRows: [], arrayRows: [] };
    }

    const tableName = this.stripQuotes(match[1]);
    const setClause = match[2];
    const whereClause = match[3];
    const returningClause = match[4];

    const assignments = this.splitTopLevelComma(setClause);
    const updates: Record<string, unknown> = {};
    for (const assign of assignments) {
      const eqIdx = assign.indexOf('=');
      if (eqIdx === -1) continue;
      const colName = this.stripQuotes(assign.slice(0, eqIdx));
      const rhs = assign.slice(eqIdx + 1).trim();
      if (rhs === '?') {
        updates[colName] = params[paramIdx++] ?? null;
      } else if (rhs.toLowerCase() === 'null') {
        updates[colName] = null;
      } else if (/^-?\d+(\.\d+)?$/.test(rhs)) {
        updates[colName] = Number(rhs);
      } else {
        updates[colName] = rhs.replace(/^'+|'+$/g, '');
      }
    }

    const whereParams = params.slice(paramIdx);
    const tableRows = this.store.tables[tableName] ?? [];
    const matchedRows = whereClause
      ? tableRows.filter((row) => this.evaluateWhere({ [tableName]: row }, tableName, whereClause, whereParams))
      : tableRows;

    for (const row of matchedRows) {
      Object.assign(row, updates);
    }

    this.saveToStorage();

    if (returningClause) {
      const retCols = this.splitTopLevelComma(returningClause).map((c) => {
        const parts = c.split('.');
        return this.stripQuotes(parts[parts.length - 1]);
      });
      const arrayRows = matchedRows.map((r) =>
        retCols.map((c) => (r[c] !== undefined ? r[c] : null))
      );
      return {
        changes: matchedRows.length,
        lastInsertRowId: 0,
        objectRows: matchedRows,
        arrayRows,
      };
    }

    return { changes: matchedRows.length, lastInsertRowId: 0, objectRows: [], arrayRows: [] };
  }

  private handleDelete(sql: string, params: unknown[]) {
    const match = sql.match(/^delete from\s+"([^"]+)"(?:\s+where\s+(.+))?$/i);
    if (!match) {
      return { changes: 0, lastInsertRowId: 0, objectRows: [], arrayRows: [] };
    }

    const tableName = this.stripQuotes(match[1]);
    const whereClause = match[2];
    const tableRows = this.store.tables[tableName] ?? [];

    if (!whereClause) {
      const count = tableRows.length;
      this.store.tables[tableName] = [];
      this.saveToStorage();
      return { changes: count, lastInsertRowId: 0, objectRows: [], arrayRows: [] };
    }

    const remaining: RowRecord[] = [];
    let deleted = 0;
    for (const row of tableRows) {
      if (this.evaluateWhere({ [tableName]: row }, tableName, whereClause, params)) {
        deleted++;
      } else {
        remaining.push(row);
      }
    }

    this.store.tables[tableName] = remaining;
    this.saveToStorage();
    return { changes: deleted, lastInsertRowId: 0, objectRows: [], arrayRows: [] };
  }

  private handleSelect(sql: string, params: unknown[]) {
    const selectFromMatch = sql.match(/^select\s+(.+?)\s+from\s+"([^"]+)"(.*)$/i);
    if (!selectFromMatch) {
      return { changes: 0, lastInsertRowId: 0, objectRows: [], arrayRows: [] };
    }

    const selectColsRaw = this.splitTopLevelComma(selectFromMatch[1]);
    const baseTable = this.stripQuotes(selectFromMatch[2]);
    let rest = selectFromMatch[3].trim();

    // Extract LIMIT
    let limitVal: number | null = null;
    let workingParams = [...params];
    const limitMatch = rest.match(/\s+limit\s+(\?|\d+)\s*$/i);
    if (limitMatch) {
      const token = limitMatch[1];
      if (token === '?') {
        const popped = workingParams.pop();
        limitVal = typeof popped === 'number' ? popped : Number(popped ?? 1);
      } else {
        limitVal = Number(token);
      }
      rest = rest.slice(0, limitMatch.index).trim();
    }

    // Extract ORDER BY
    let orderByClause: string | null = null;
    const orderMatch = rest.match(/\s+order by\s+(.+)$/i);
    if (orderMatch) {
      orderByClause = orderMatch[1].trim();
      rest = rest.slice(0, orderMatch.index).trim();
    }

    // Extract WHERE
    let whereClause: string | null = null;
    const whereMatch = rest.match(/\s+where\s+(.+)$/i);
    if (whereMatch) {
      whereClause = whereMatch[1].trim();
      rest = rest.slice(0, whereMatch.index).trim();
    } else if (/^where\s+/i.test(rest)) {
      whereClause = rest.replace(/^where\s+/i, '').trim();
      rest = '';
    }

    // Build joined dataset: each element is Record<tableName, RowRecord | null>
    const baseRows = this.store.tables[baseTable] ?? [];
    let dataset: Array<Record<string, RowRecord | null>> = baseRows.map((r) => ({
      [baseTable]: r,
    }));

    // Parse INNER JOIN / LEFT JOIN clauses in `rest`
    const joinRegex = /(inner|left)\s+join\s+"([^"]+)"\s+on\s+"([^"]+)"\."([^"]+)"\s*=\s*"([^"]+)"\."([^"]+)"/gi;
    let joinMatch: RegExpExecArray | null;
    while ((joinMatch = joinRegex.exec(rest)) !== null) {
      const joinType = joinMatch[1].toLowerCase();
      const joinTable = this.stripQuotes(joinMatch[2]);
      const leftTbl = this.stripQuotes(joinMatch[3]);
      const leftCol = this.stripQuotes(joinMatch[4]);
      const rightTbl = this.stripQuotes(joinMatch[5]);
      const rightCol = this.stripQuotes(joinMatch[6]);

      const joinRows = this.store.tables[joinTable] ?? [];
      const nextDataset: Array<Record<string, RowRecord | null>> = [];

      for (const composite of dataset) {
        const matches = joinRows.filter((jr) => {
          const tempComposite = { ...composite, [joinTable]: jr };
          const lv = tempComposite[leftTbl]?.[leftCol];
          const rv = tempComposite[rightTbl]?.[rightCol];
          return lv !== undefined && lv === rv;
        });

        if (matches.length > 0) {
          for (const m of matches) {
            nextDataset.push({ ...composite, [joinTable]: m });
          }
        } else if (joinType === 'left') {
          nextDataset.push({ ...composite, [joinTable]: null });
        }
      }
      dataset = nextDataset;
    }

    // Filter by WHERE
    if (whereClause) {
      const wc = whereClause;
      dataset = dataset.filter((composite) =>
        this.evaluateWhere(composite, baseTable, wc, workingParams)
      );
    }

    // Sort by ORDER BY
    if (orderByClause) {
      const specs = this.splitTopLevelComma(orderByClause).map((s) => {
        const parts = s.trim().split(/\s+/);
        const dir = parts[1]?.toLowerCase() === 'desc' ? -1 : 1;
        const colRef = parts[0];
        return { colRef, dir };
      });

      dataset.sort((a, b) => {
        for (const spec of specs) {
          const va = this.resolveColumnValue(a, baseTable, spec.colRef);
          const vb = this.resolveColumnValue(b, baseTable, spec.colRef);
          if (va === vb) continue;
          if (va === null || va === undefined) return 1;
          if (vb === null || vb === undefined) return -1;
          return (va < vb ? -1 : 1) * spec.dir;
        }
        return 0;
      });
    }

    if (limitVal !== null && limitVal >= 0) {
      dataset = dataset.slice(0, limitVal);
    }

    const arrayRows: unknown[][] = [];
    const objectRows: RowRecord[] = [];

    for (const composite of dataset) {
      const arrRow: unknown[] = [];
      const objRow: RowRecord = {};
      for (const colExpr of selectColsRaw) {
        const val = this.resolveColumnValue(composite, baseTable, colExpr);
        const normalized = val === undefined ? null : val;
        arrRow.push(normalized);
        const dotParts = colExpr.split('.');
        const shortCol = this.stripQuotes(dotParts[dotParts.length - 1]);
        objRow[shortCol] = normalized;
      }
      arrayRows.push(arrRow);
      objectRows.push(objRow);
    }

    return {
      changes: 0,
      lastInsertRowId: 0,
      objectRows,
      arrayRows,
    };
  }

  private resolveColumnValue(
    composite: Record<string, RowRecord | null>,
    defaultTable: string,
    colExpr: string
  ): unknown {
    const trimmed = colExpr.trim();
    if (trimmed.includes('.')) {
      const [tblRaw, colRaw] = trimmed.split('.');
      const tbl = this.stripQuotes(tblRaw);
      const col = this.stripQuotes(colRaw);
      const tblRecord = composite[tbl];
      if (!tblRecord) return null;
      return tblRecord[col] ?? null;
    }
    const col = this.stripQuotes(trimmed);
    const baseRecord = composite[defaultTable];
    if (!baseRecord) return null;
    return baseRecord[col] ?? null;
  }

  private evaluateWhere(
    composite: Record<string, RowRecord | null>,
    defaultTable: string,
    whereClause: string,
    params: unknown[]
  ): boolean {
    let clause = whereClause.trim();
    while (clause.startsWith('(') && clause.endsWith(')')) {
      clause = clause.slice(1, -1).trim();
    }

    const conditions = clause.split(/\s+and\s+/i);
    let pIdx = 0;

    for (const condRaw of conditions) {
      const cond = condRaw.trim().replace(/^\(+|\)+$/g, '');

      // Case-insensitive lower("table"."col") = lower(?)
      const lowerMatch = cond.match(/^lower\((.+?)\)\s*=\s*lower\(\?\)$/i);
      if (lowerMatch) {
        const colVal = this.resolveColumnValue(composite, defaultTable, lowerMatch[1]);
        const paramVal = params[pIdx++];
        if (String(colVal ?? '').toLowerCase() !== String(paramVal ?? '').toLowerCase()) {
          return false;
        }
        continue;
      }

      const eqMatch = cond.match(/^(.+?)\s*=\s*(\?|\d+|'[^']*')$/i);
      if (eqMatch) {
        const colVal = this.resolveColumnValue(composite, defaultTable, eqMatch[1]);
        const rhs = eqMatch[2].trim();
        let expected: unknown;
        if (rhs === '?') {
          expected = params[pIdx++];
        } else if (/^-?\d+(\.\d+)?$/.test(rhs)) {
          expected = Number(rhs);
        } else {
          expected = rhs.replace(/^'+|'+$/g, '');
        }
        if (colVal !== expected) {
          return false;
        }
      }
    }

    return true;
  }
}

let _webEngine: WebSQLiteEngine | null = null;
let _drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDatabase() {
  if (!_drizzleDb) {
    _webEngine = new WebSQLiteEngine();
    _drizzleDb = drizzle(_webEngine as unknown as SQLiteDatabase, { schema });
  }
  return _drizzleDb;
}

export function initializeTables(dbInstance?: ReturnType<typeof drizzle<typeof schema>>) {
  return dbInstance ?? getDatabase();
}

export type AppDatabase = ReturnType<typeof getDatabase>;

