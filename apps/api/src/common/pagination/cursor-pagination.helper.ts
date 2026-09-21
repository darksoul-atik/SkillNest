import { Types } from 'mongoose';
import { CursorPaginationMeta } from '@skillnest/shared';

export interface DecodedCursor {
  sortValue: string;
  id: string;
}

export class CursorPaginationHelper {
  static encode(sortValue: string | number | Date, id: string | Types.ObjectId): string {
    const val = sortValue instanceof Date ? sortValue.toISOString() : String(sortValue);
    const idStr = id.toString();
    const payload: DecodedCursor = { sortValue: val, id: idStr };
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  static decode(cursor?: string): DecodedCursor | null {
    if (!cursor) return null;
    try {
      const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded) as DecodedCursor;
      if (parsed && parsed.sortValue !== undefined && parsed.id) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  static buildFilter(
    decodedCursor: DecodedCursor | null,
    sortField: string = 'createdAt',
    sortOrder: 1 | -1 = -1,
    isDate: boolean = true,
  ): Record<string, unknown> {
    if (!decodedCursor) return {};

    const rawVal = isDate ? new Date(decodedCursor.sortValue) : decodedCursor.sortValue;
    const rawId = Types.ObjectId.isValid(decodedCursor.id)
      ? new Types.ObjectId(decodedCursor.id)
      : decodedCursor.id;

    if (sortOrder === -1) {
      return {
        $or: [
          { [sortField]: { $lt: rawVal } },
          { [sortField]: rawVal, _id: { $lt: rawId } },
        ],
      };
    } else {
      return {
        $or: [
          { [sortField]: { $gt: rawVal } },
          { [sortField]: rawVal, _id: { $gt: rawId } },
        ],
      };
    }
  }

  static paginate<T extends { _id: Types.ObjectId | string }>(
    docs: T[],
    limit: number,
    getSortValue: (item: T) => string | number | Date,
    total?: number,
  ): { data: T[]; meta: CursorPaginationMeta } {
    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1]!;
      nextCursor = this.encode(getSortValue(lastItem), lastItem._id);
    }

    return {
      data: items,
      meta: {
        nextCursor,
        hasMore,
        limit,
        total,
      },
    };
  }
}
