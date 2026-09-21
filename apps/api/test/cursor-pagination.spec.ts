import { Types } from 'mongoose';
import { CursorPaginationHelper } from '../src/common/pagination/cursor-pagination.helper';

describe('CursorPaginationHelper', () => {
  it('should encode and decode cursor properly', () => {
    const id = new Types.ObjectId();
    const date = new Date('2026-05-01T12:00:00.000Z');

    const cursor = CursorPaginationHelper.encode(date, id);
    expect(typeof cursor).toBe('string');

    const decoded = CursorPaginationHelper.decode(cursor);
    expect(decoded).not.toBeNull();
    expect(decoded?.sortValue).toBe(date.toISOString());
    expect(decoded?.id).toBe(id.toString());
  });

  it('should return null on invalid or malformed cursor', () => {
    expect(CursorPaginationHelper.decode(undefined)).toBeNull();
    expect(CursorPaginationHelper.decode('')).toBeNull();
    expect(CursorPaginationHelper.decode('invalid-base64-{}')).toBeNull();
  });

  it('should build filter for descending sort (-1)', () => {
    const id = new Types.ObjectId();
    const date = new Date('2026-05-01T12:00:00.000Z');
    const decoded = { sortValue: date.toISOString(), id: id.toString() };

    const filter = CursorPaginationHelper.buildFilter(decoded, 'createdAt', -1, true);
    expect(filter).toHaveProperty('$or');
    const orArr = (filter as { $or: unknown[] }).$or;
    expect(orArr).toHaveLength(2);
  });

  it('should build filter for ascending sort (1)', () => {
    const id = new Types.ObjectId();
    const decoded = { sortValue: '100', id: id.toString() };

    const filter = CursorPaginationHelper.buildFilter(decoded, 'count', 1, false);
    expect(filter).toHaveProperty('$or');
  });

  it('should slice data and generate nextCursor when hasMore is true', () => {
    const items = [
      { _id: new Types.ObjectId(), createdAt: new Date('2026-05-01') },
      { _id: new Types.ObjectId(), createdAt: new Date('2026-05-02') },
      { _id: new Types.ObjectId(), createdAt: new Date('2026-05-03') },
    ];

    const result = CursorPaginationHelper.paginate(
      items,
      2,
      (item) => item.createdAt,
      10,
    );

    expect(result.data).toHaveLength(2);
    expect(result.meta.hasMore).toBe(true);
    expect(result.meta.nextCursor).not.toBeNull();
    expect(result.meta.total).toBe(10);
  });

  it('should not return nextCursor when no more items exist', () => {
    const items = [
      { _id: new Types.ObjectId(), createdAt: new Date('2026-05-01') },
    ];

    const result = CursorPaginationHelper.paginate(
      items,
      2,
      (item) => item.createdAt,
    );

    expect(result.data).toHaveLength(1);
    expect(result.meta.hasMore).toBe(false);
    expect(result.meta.nextCursor).toBeNull();
  });
});
