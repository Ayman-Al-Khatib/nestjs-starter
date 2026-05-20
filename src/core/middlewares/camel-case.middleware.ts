import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CASE_FORMAT_HEADER, CaseConverterUtils, SNAKE_CASE } from 'shared/utils/case-converter.utils';

@Injectable()
export class CamelCaseMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const caseFormat = (req.headers[CASE_FORMAT_HEADER] as string | undefined)?.toLowerCase();

    if (caseFormat !== SNAKE_CASE) {
      return next();
    }

    if (req.body) {
      req.body = CaseConverterUtils.toCamelCase(req.body);
    }

    if (req.query && Object.keys(req.query).length > 0) {
      redefineRequestProp(req, 'query', CaseConverterUtils.toCamelCase(req.query));
    }

    if (req.params && Object.keys(req.params).length > 0) {
      redefineRequestProp(req, 'params', CaseConverterUtils.toCamelCase(req.params));
    }

    next();
  }
}

function redefineRequestProp(req: Request, prop: 'query' | 'params', value: unknown): void {
  Object.defineProperty(req, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}
