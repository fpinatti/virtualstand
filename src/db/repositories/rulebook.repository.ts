import { and, asc, eq } from 'drizzle-orm';
import { getDatabase, AppDatabase } from '../client';
import {
  rulebooks,
  rulebookBookmarks,
  rulebookNotes,
  RulebookRow,
  InsertRulebookRow,
  RulebookBookmarkRow,
  InsertRulebookBookmarkRow,
  RulebookNoteRow,
  InsertRulebookNoteRow,
} from '../schema';

export class RulebookRepository {
  private readonly db: AppDatabase;

  constructor(dbInstance?: AppDatabase) {
    this.db = dbInstance ?? getDatabase();
  }

  async insert(data: InsertRulebookRow): Promise<RulebookRow> {
    const [inserted] = await this.db.insert(rulebooks).values(data).returning();
    return inserted;
  }

  async listByBggId(bggId: number): Promise<RulebookRow[]> {
    return this.db
      .select()
      .from(rulebooks)
      .where(eq(rulebooks.bggId, bggId))
      .orderBy(asc(rulebooks.createdAt));
  }

  async findById(id: number): Promise<RulebookRow | null> {
    const rows = await this.db.select().from(rulebooks).where(eq(rulebooks.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findByBggIdAndMd5(bggId: number, md5: string): Promise<RulebookRow | null> {
    const rows = await this.db
      .select()
      .from(rulebooks)
      .where(and(eq(rulebooks.bggId, bggId), eq(rulebooks.md5, md5)))
      .limit(1);
    return rows[0] ?? null;
  }

  async updateVerification(id: number, pageCount: number): Promise<void> {
    await this.db
      .update(rulebooks)
      .set({
        status: 'READY',
        pageCount,
        updatedAt: Date.now(),
      })
      .where(eq(rulebooks.id, id));
  }

  async updateLastViewedPage(id: number, page: number): Promise<void> {
    await this.db
      .update(rulebooks)
      .set({
        lastViewedPage: Math.max(1, Math.floor(page)),
        updatedAt: Date.now(),
      })
      .where(eq(rulebooks.id, id));
  }

  async rename(id: number, label: string, docType?: string): Promise<void> {
    const updates: Partial<InsertRulebookRow> = {
      label,
      updatedAt: Date.now(),
    };
    if (docType) {
      updates.docType = docType;
    }
    await this.db.update(rulebooks).set(updates).where(eq(rulebooks.id, id));
  }

  async listPending(): Promise<RulebookRow[]> {
    return this.db
      .select()
      .from(rulebooks)
      .where(eq(rulebooks.status, 'PENDING_VERIFICATION'));
  }

  async countAnnotations(rulebookId: number): Promise<number> {
    const [bookmarks, notes] = await Promise.all([
      this.db
        .select()
        .from(rulebookBookmarks)
        .where(eq(rulebookBookmarks.rulebookId, rulebookId)),
      this.db.select().from(rulebookNotes).where(eq(rulebookNotes.rulebookId, rulebookId)),
    ]);
    return bookmarks.length + notes.length;
  }

  async deleteById(id: number): Promise<void> {
    await this.db
      .delete(rulebookBookmarks)
      .where(eq(rulebookBookmarks.rulebookId, id));
    await this.db.delete(rulebookNotes).where(eq(rulebookNotes.rulebookId, id));
    await this.db.delete(rulebooks).where(eq(rulebooks.id, id));
  }

  // --- Annotations (US2) ---

  async listBookmarks(rulebookId: number): Promise<RulebookBookmarkRow[]> {
    return this.db
      .select()
      .from(rulebookBookmarks)
      .where(eq(rulebookBookmarks.rulebookId, rulebookId))
      .orderBy(asc(rulebookBookmarks.page), asc(rulebookBookmarks.id));
  }

  async findBookmarkById(id: number): Promise<RulebookBookmarkRow | null> {
    const rows = await this.db
      .select()
      .from(rulebookBookmarks)
      .where(eq(rulebookBookmarks.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async insertBookmark(data: InsertRulebookBookmarkRow): Promise<RulebookBookmarkRow> {
    const [inserted] = await this.db.insert(rulebookBookmarks).values(data).returning();
    return inserted;
  }

  async updateBookmark(id: number, title: string): Promise<void> {
    await this.db
      .update(rulebookBookmarks)
      .set({ title, updatedAt: Date.now() })
      .where(eq(rulebookBookmarks.id, id));
  }

  async deleteBookmark(id: number): Promise<void> {
    await this.db.delete(rulebookBookmarks).where(eq(rulebookBookmarks.id, id));
  }

  async listNotes(rulebookId: number): Promise<RulebookNoteRow[]> {
    return this.db
      .select()
      .from(rulebookNotes)
      .where(eq(rulebookNotes.rulebookId, rulebookId))
      .orderBy(asc(rulebookNotes.page), asc(rulebookNotes.id));
  }

  async findNoteById(id: number): Promise<RulebookNoteRow | null> {
    const rows = await this.db
      .select()
      .from(rulebookNotes)
      .where(eq(rulebookNotes.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async insertNote(data: InsertRulebookNoteRow): Promise<RulebookNoteRow> {
    const [inserted] = await this.db.insert(rulebookNotes).values(data).returning();
    return inserted;
  }

  async updateNote(id: number, body: string): Promise<void> {
    await this.db
      .update(rulebookNotes)
      .set({ body, updatedAt: Date.now() })
      .where(eq(rulebookNotes.id, id));
  }

  async deleteNote(id: number): Promise<void> {
    await this.db.delete(rulebookNotes).where(eq(rulebookNotes.id, id));
  }
}

export const rulebookRepository = new RulebookRepository();

