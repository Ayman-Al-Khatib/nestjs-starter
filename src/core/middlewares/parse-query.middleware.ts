import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import qs from 'qs';

const QS_OPTIONS = {
  allowDots: true,
  allowPrototypes: false,
  depth: 10,
  arrayLimit: 100,
  duplicates: 'combine' as const,
  decoder: (str: string): string => {
    try {
      return decodeURIComponent(str.replace(/\+/g, '%20'));
    } catch {
      return str;
    }
  },
};

@Injectable()
export class ParseQueryMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    try {
      const url = req.originalUrl || req.url;
      const queryIndex = url?.indexOf('?') ?? -1;

      if (queryIndex < 0) {
        return next();
      }

      const queryString = url.slice(queryIndex + 1);
      if (!queryString) {
        return next();
      }

      const parsedQuery = qs.parse(queryString, QS_OPTIONS);
      if (parsedQuery && Object.keys(parsedQuery).length > 0) {
        assignQuery(req, parsedQuery);
      }

      next();
    } catch {
      assignQuery(req, {});
      next();
    }
  }
}

function assignQuery(req: Request, value: object): void {
  Object.defineProperty(req, 'query', {
    value,
    writable: false,
    configurable: true,
    enumerable: true,
  });
}
