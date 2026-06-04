import { SelectQueryBuilder } from 'typeorm';
import { mapPaginated, mapPaginatedAsync, paginate } from './paginate.util';
import { IPaginatedResponse } from './interfaces/paginated-response.interface';

interface Row {
  id: number;
}

function mockQueryBuilder(data: Row[], total: number) {
  const qb = {
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([data, total]),
  };
  return qb as unknown as SelectQueryBuilder<Row> & typeof qb;
}

describe('paginate', () => {
  it('applies skip/take from page+limit and returns the standard envelope', async () => {
    const qb = mockQueryBuilder([{ id: 1 }, { id: 2 }], 25);

    const result = await paginate(qb, { page: 2, limit: 10 });

    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.pagination).toEqual({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
      nextPage: 3,
      prevPage: 1,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it('clamps page below 1 up to page 1 (skip 0)', async () => {
    const qb = mockQueryBuilder([], 0);
    const result = await paginate(qb, { page: -5, limit: 10 });
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(result.pagination.page).toBe(1);
  });

  it('clamps limit above MAX_LIMIT down to 50', async () => {
    const qb = mockQueryBuilder([], 0);
    await paginate(qb, { page: 1, limit: 9999 });
    expect(qb.take).toHaveBeenCalledWith(50);
  });

  it('clamps limit below 1 up to 1', async () => {
    const qb = mockQueryBuilder([], 0);
    await paginate(qb, { page: 1, limit: 0 });
    expect(qb.take).toHaveBeenCalledWith(1);
  });

  it('falls back to defaults when page/limit are omitted', async () => {
    const qb = mockQueryBuilder([], 0);
    const result = await paginate(qb, {});
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
  });

  it('reports no next/prev pages on a single full page', async () => {
    const qb = mockQueryBuilder([{ id: 1 }], 1);
    const { pagination } = await paginate(qb, { page: 1, limit: 10 });
    expect(pagination).toMatchObject({
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
      nextPage: null,
      prevPage: null,
    });
  });

  it('reports totalPages 0 for an empty result set', async () => {
    const qb = mockQueryBuilder([], 0);
    const { pagination } = await paginate(qb, { page: 1, limit: 10 });
    expect(pagination.totalPages).toBe(0);
    expect(pagination.hasNextPage).toBe(false);
  });
});

describe('mapPaginated', () => {
  it('transforms data while preserving the pagination block', () => {
    const source: IPaginatedResponse<Row> = {
      data: [{ id: 1 }, { id: 2 }],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        nextPage: null,
        prevPage: null,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    const mapped = mapPaginated(source, (row) => row.id);

    expect(mapped.data).toEqual([1, 2]);
    expect(mapped.pagination).toBe(source.pagination);
  });

  it('passes the index to the mapper', () => {
    const source: IPaginatedResponse<Row> = {
      data: [{ id: 10 }, { id: 20 }],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        nextPage: null,
        prevPage: null,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
    const mapped = mapPaginated(source, (_row, index) => index);
    expect(mapped.data).toEqual([0, 1]);
  });
});

describe('mapPaginatedAsync', () => {
  it('awaits each mapper and preserves order + pagination', async () => {
    const source: IPaginatedResponse<Row> = {
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      pagination: {
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
        nextPage: null,
        prevPage: null,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    const mapped = await mapPaginatedAsync(source, (row) => Promise.resolve(row.id * 2));

    expect(mapped.data).toEqual([2, 4, 6]);
    expect(mapped.pagination).toBe(source.pagination);
  });
});
