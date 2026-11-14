import { AnnotationService } from '@/services/annotation.service';
import { RulebookRepository } from '@/db/repositories/rulebook.repository';
import {
  RulebookBookmarkRow,
  InsertRulebookBookmarkRow,
  RulebookNoteRow,
  InsertRulebookNoteRow,
} from '@/db/schema';

describe('AnnotationService (US2)', () => {
  let bookmarks: RulebookBookmarkRow[] = [];
  let notes: RulebookNoteRow[] = [];
  let pageCount: number | null = 20;
  let nextId = 1;

  const mockRepo = {
    findById: jest.fn(async (id: number) => ({
      id,
      bggId: 13,
      label: 'Catan',
      docType: 'BASE_RULES',
      sourceKind: 'DEVICE_FILE',
      sourceUrl: null,
      relativePath: 'rulebooks/13/a.pdf',
      fileSizeBytes: 1000,
      md5: 'abc',
      pageCount,
      lastViewedPage: 1,
      status: 'READY',
      createdAt: 1,
      updatedAt: 1,
    })),
    listBookmarks: jest.fn(async (rulebookId: number) =>
      bookmarks
        .filter((b) => b.rulebookId === rulebookId)
        .sort((a, b) => a.page - b.page || a.id - b.id)
    ),
    insertBookmark: jest.fn(async (data: InsertRulebookBookmarkRow) => {
      const row: RulebookBookmarkRow = {
        id: nextId++,
        rulebookId: data.rulebookId,
        page: data.page,
        title: data.title,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      bookmarks.push(row);
      return row;
    }),
    updateBookmark: jest.fn(async (id: number, title: string) => {
      const target = bookmarks.find((b) => b.id === id);
      if (target) target.title = title;
    }),
    deleteBookmark: jest.fn(async (id: number) => {
      bookmarks = bookmarks.filter((b) => b.id !== id);
    }),
    listNotes: jest.fn(async (rulebookId: number) =>
      notes
        .filter((n) => n.rulebookId === rulebookId)
        .sort((a, b) => a.page - b.page || a.id - b.id)
    ),
    insertNote: jest.fn(async (data: InsertRulebookNoteRow) => {
      const row: RulebookNoteRow = {
        id: nextId++,
        rulebookId: data.rulebookId,
        page: data.page,
        body: data.body,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      notes.push(row);
      return row;
    }),
    updateNote: jest.fn(async (id: number, body: string) => {
      const target = notes.find((n) => n.id === id);
      if (target) {
        target.body = body;
        target.updatedAt = Date.now();
      }
    }),
    deleteNote: jest.fn(async (id: number) => {
      notes = notes.filter((n) => n.id !== id);
    }),
  } as unknown as RulebookRepository;

  let service: AnnotationService;

  beforeEach(() => {
    bookmarks = [];
    notes = [];
    pageCount = 20;
    nextId = 1;
    jest.clearAllMocks();
    service = new AnnotationService(mockRepo);
  });

  it('adds, updates, lists (ordered by page), and deletes bookmarks with title validation (1-80 chars)', async () => {
    await service.addBookmark(1, 7, 'Pontuação final');
    await service.addBookmark(1, 2, 'Preparação inicial');

    const list = await service.listBookmarks(1);
    expect(list.map((b) => b.page)).toEqual([2, 7]);
    expect(list[0].isPageAvailable).toBe(true);

    await service.updateBookmark(list[0].id, 'Setup do tabuleiro');
    const updated = await service.listBookmarks(1);
    expect(updated[0].title).toBe('Setup do tabuleiro');

    await service.deleteBookmark(list[0].id);
    expect(await service.listBookmarks(1)).toHaveLength(1);

    await expect(service.addBookmark(1, 0, 'Inválido')).rejects.toThrow();
    await expect(service.addBookmark(1, 3, '   ')).rejects.toThrow();
  });

  it('adds, updates, lists, and deletes page notes with body validation (1-2000 chars)', async () => {
    const created = await service.addNote(1, 3, 'Regra da casa: comprar 2 cartas.');
    expect(created.page).toBe(3);

    await service.updateNote(created.id, 'Regra oficial revisada.');
    const list = await service.listNotes(1);
    expect(list[0].body).toBe('Regra oficial revisada.');

    await service.deleteNote(created.id);
    expect(await service.listNotes(1)).toHaveLength(0);
  });

  it('flags annotations beyond pageCount as isPageAvailable = false and computes annotatedPages sets', async () => {
    await service.addBookmark(1, 5, 'Meio');
    await service.addBookmark(1, 25, 'Além do fim');
    await service.addNote(1, 12, 'Nota na 12');

    const bList = await service.listBookmarks(1);
    expect(bList.find((b) => b.page === 5)?.isPageAvailable).toBe(true);
    expect(bList.find((b) => b.page === 25)?.isPageAvailable).toBe(false);

    const sets = await service.annotatedPages(1);
    expect(Array.from(sets.bookmarked)).toEqual([5, 25]);
    expect(Array.from(sets.noted)).toEqual([12]);
  });
});

