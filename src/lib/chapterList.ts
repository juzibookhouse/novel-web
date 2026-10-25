export type ChapterSortDirection = 'asc' | 'desc';

export interface OrderedChapter {
  id: string;
  chapter_order?: number | null;
}

/** Display order only: keep both the input array and chapter objects intact. */
export function sortChaptersForDisplay<T extends OrderedChapter>(
  chapters: readonly T[],
  direction: ChapterSortDirection
): T[] {
  return [...chapters].sort((a, b) => {
    const aOrder = a.chapter_order;
    const bOrder = b.chapter_order;
    const aValid = typeof aOrder === 'number' && Number.isFinite(aOrder);
    const bValid = typeof bOrder === 'number' && Number.isFinite(bOrder);
    // Keep chapters without an order at the end in either direction.
    if (!aValid) return bValid ? 1 : 0;
    if (!bValid) return -1;
    return direction === 'asc' ? aOrder - bOrder : bOrder - aOrder;
  });
}

function positiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;
}

export function getChapterListView<T>(
  orderedChapters: readonly T[],
  expanded: boolean,
  columns: number,
  collapsedRows: number
) {
  const columnCount = positiveInteger(columns, 2);
  const collapsedCount = columnCount * positiveInteger(collapsedRows, 2);
  return {
    columns: columnCount,
    canExpand: orderedChapters.length > collapsedCount,
    visibleChapters: expanded ? orderedChapters : orderedChapters.slice(0, collapsedCount)
  };
}
