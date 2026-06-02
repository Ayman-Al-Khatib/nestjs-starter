import { NextFunction, Request, Response } from 'express';
import { RequestIdMiddleware } from './request-id.middleware';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('RequestIdMiddleware', () => {
  const middleware = new RequestIdMiddleware();

  function run(headers: Record<string, unknown>) {
    const req = { headers } as unknown as Request;
    const setHeader = jest.fn();
    const res = { setHeader } as unknown as Response;
    const next = jest.fn() as unknown as NextFunction;
    middleware.use(req, res, next);
    return { req, setHeader, next };
  }

  it('honors a valid inbound UUID v4 and echoes it on the response', () => {
    const id = '3f8b1c2a-1234-4abc-89ef-0123456789ab';
    const { req, setHeader } = run({ 'x-request-id': id });
    expect(req.requestId).toBe(id);
    expect(setHeader).toHaveBeenCalledWith('x-request-id', id);
  });

  it('replaces a non-UUID inbound id with a fresh server UUID (log injection guard)', () => {
    const { req } = run({ 'x-request-id': 'evil\ninjected' });
    expect(req.requestId).toMatch(UUID_V4);
  });

  it('generates a fresh UUID when no inbound id is present', () => {
    const { req, next } = run({});
    expect(req.requestId).toMatch(UUID_V4);
    expect(next).toHaveBeenCalled();
  });

  it('uses the first value when the header arrives as an array', () => {
    const id = '3f8b1c2a-1234-4abc-89ef-0123456789ab';
    const { req } = run({ 'x-request-id': [id, 'second'] });
    expect(req.requestId).toBe(id);
  });
});
