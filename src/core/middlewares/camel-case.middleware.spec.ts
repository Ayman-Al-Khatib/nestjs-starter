import { NextFunction, Request, Response } from 'express';
import { CamelCaseMiddleware } from './camel-case.middleware';

describe('CamelCaseMiddleware', () => {
  const middleware = new CamelCaseMiddleware();
  const res = {} as Response;

  function run(req: Partial<Request>) {
    const next = jest.fn() as unknown as NextFunction;
    middleware.use(req as Request, res, next);
    return next;
  }

  it('passes through unchanged without the snake header', () => {
    const req = { headers: {}, body: { first_name: 'a' } } as unknown as Request;
    run(req);
    expect(req.body).toEqual({ first_name: 'a' });
  });

  it('camel-cases the body when x-case-format: snake is set', () => {
    const req = {
      headers: { 'x-case-format': 'snake' },
      body: { first_name: 'a', nested_obj: { created_at: 1 } },
    } as unknown as Request;
    run(req);
    expect(req.body).toEqual({ firstName: 'a', nestedObj: { createdAt: 1 } });
  });

  it('camel-cases query and params when present', () => {
    const req = {
      headers: { 'x-case-format': 'snake' },
      query: { sort_by: 'name' },
      params: { city_id: '1' },
    } as unknown as Request;
    run(req);
    expect(req.query).toEqual({ sortBy: 'name' });
    expect(req.params).toEqual({ cityId: '1' });
  });

  it('always calls next', () => {
    const next = run({ headers: {} } as unknown as Request);
    expect(next).toHaveBeenCalled();
  });
});
