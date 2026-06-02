import { NextFunction, Request, Response } from 'express';
import { ParseQueryMiddleware } from './parse-query.middleware';

describe('ParseQueryMiddleware', () => {
  const middleware = new ParseQueryMiddleware();
  const res = {} as Response;

  function run(url: string): Request {
    const req = { originalUrl: url, url } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;
    middleware.use(req, res, next);
    return req;
  }

  it('parses a flat query string into req.query', () => {
    const req = run('/api/v1/users?page=2&limit=10');
    expect(req.query).toMatchObject({ page: '2', limit: '10' });
  });

  it('parses nested bracket and dotted syntax', () => {
    const req = run('/api/v1/items?filter[status]=active&sort.by=name');
    expect(req.query).toMatchObject({
      filter: { status: 'active' },
      sort: { by: 'name' },
    });
  });

  it('leaves the request untouched when there is no query string', () => {
    const req = { originalUrl: '/api/v1/users', url: '/api/v1/users' } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('combines duplicate keys into an array', () => {
    const req = run('/api/v1/items?id=1&id=2');
    expect(req.query.id).toEqual(['1', '2']);
  });
});
