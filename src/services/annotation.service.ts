import { Bookmark, IAnnotationService, PageNote } from './rulebook-types';
import { rulebookRepository, RulebookRepository } from '@/db/repositories/rulebook.repository';

export class AnnotationService implements IAnnotationService {
  constructor(private readonly repo: RulebookRepository = rulebookRepository) {}

  private validatePage(page: number): number {
    const p = Math.floor(page);
    if (!Number.isFinite(p) || p < 1) {
      throw new Error('O número da página deve ser maior ou igual a 1.');
    }
    return p;
  }

  private validateBookmarkTitle(title: string): string {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new Error('O título do marcador não pode ser vazio.');
    }
    return trimmed.slice(0, 80);
  }

  private validateNoteBody(body: string): string {
    const trimmed = body.trim();
    if (!trimmed) {
      throw new Error('O texto da anotação não pode ser vazio.');
    }
    return trimmed.slice(0, 2000);
  }

  private isPageWithinDocument(page: number, pageCount: number | null): boolean {
    if (pageCount === null || pageCount === undefined || pageCount <= 0) {
      return true;
    }
    return page <= pageCount;
  }

  async listBookmarks(rulebookId: number): Promise<Bookmark[]> {
    const [rulebook, rows] = await Promise.all([
      this.repo.findById(rulebookId),
      this.repo.listBookmarks(rulebookId),
    ]);
    const pageCount = rulebook?.pageCount ?? null;

    return rows.map((row) => ({
      id: row.id,
      rulebookId: row.rulebookId,
      page: row.page,
      title: row.title,
      isPageAvailable: this.isPageWithinDocument(row.page, pageCount),
    }));
  }

  async addBookmark(rulebookId: number, page: number, title: string): Promise<Bookmark> {
    const validPage = this.validatePage(page);
    const validTitle = this.validateBookmarkTitle(title);
    const now = Date.now();
    const rulebook = await this.repo.findById(rulebookId);
    const inserted = await this.repo.insertBookmark({
      rulebookId,
      page: validPage,
      title: validTitle,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: inserted.id,
      rulebookId: inserted.rulebookId,
      page: inserted.page,
      title: inserted.title,
      isPageAvailable: this.isPageWithinDocument(inserted.page, rulebook?.pageCount ?? null),
    };
  }

  async updateBookmark(id: number, title: string): Promise<void> {
    const validTitle = this.validateBookmarkTitle(title);
    await this.repo.updateBookmark(id, validTitle);
  }

  async deleteBookmark(id: number): Promise<void> {
    await this.repo.deleteBookmark(id);
  }

  async listNotes(rulebookId: number): Promise<PageNote[]> {
    const [rulebook, rows] = await Promise.all([
      this.repo.findById(rulebookId),
      this.repo.listNotes(rulebookId),
    ]);
    const pageCount = rulebook?.pageCount ?? null;

    return rows.map((row) => ({
      id: row.id,
      rulebookId: row.rulebookId,
      page: row.page,
      body: row.body,
      isPageAvailable: this.isPageWithinDocument(row.page, pageCount),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async addNote(rulebookId: number, page: number, body: string): Promise<PageNote> {
    const validPage = this.validatePage(page);
    const validBody = this.validateNoteBody(body);
    const now = Date.now();
    const rulebook = await this.repo.findById(rulebookId);
    const inserted = await this.repo.insertNote({
      rulebookId,
      page: validPage,
      body: validBody,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: inserted.id,
      rulebookId: inserted.rulebookId,
      page: inserted.page,
      body: inserted.body,
      isPageAvailable: this.isPageWithinDocument(inserted.page, rulebook?.pageCount ?? null),
      createdAt: inserted.createdAt,
      updatedAt: inserted.updatedAt,
    };
  }

  async updateNote(id: number, body: string): Promise<void> {
    const validBody = this.validateNoteBody(body);
    await this.repo.updateNote(id, validBody);
  }

  async deleteNote(id: number): Promise<void> {
    await this.repo.deleteNote(id);
  }

  async annotatedPages(
    rulebookId: number
  ): Promise<{ bookmarked: Set<number>; noted: Set<number> }> {
    const [bookmarks, notes] = await Promise.all([
      this.repo.listBookmarks(rulebookId),
      this.repo.listNotes(rulebookId),
    ]);

    return {
      bookmarked: new Set(bookmarks.map((b) => b.page)),
      noted: new Set(notes.map((n) => n.page)),
    };
  }
}

export const annotationService = new AnnotationService();

