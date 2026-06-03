import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Res,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import * as path from 'path';
import { Public } from 'core/decorators/public.decorator';
import { Visibility } from '../../core/enums/visibility.enum';
import { mimeFromExtension } from '../../utils/mime.util';
import { LOCAL_STORAGE_ROUTE } from './local.constants';
import { LocalStreamGuard } from './local-stream.guard';
import { LOCAL_STORAGE_BASE_PATH } from './local.tokens';

@Public()
@Controller({ path: LOCAL_STORAGE_ROUTE, version: VERSION_NEUTRAL })
export class LocalStorageController {
  constructor(@Inject(LOCAL_STORAGE_BASE_PATH) private readonly basePath: string) {}

  @Get('public/*path')
  async servePublic(
    @Param('path') segments: string | string[],
    @Res() res: Response,
  ): Promise<void> {
    return this.stream(Visibility.PUBLIC, segments, res);
  }

  @UseGuards(LocalStreamGuard)
  @Get('private/*path')
  async servePrivate(
    @Param('path') segments: string | string[],
    @Res() res: Response,
  ): Promise<void> {
    return this.stream(Visibility.PRIVATE, segments, res);
  }

  private async stream(
    visibility: Visibility,
    segments: string | string[],
    res: Response,
  ): Promise<void> {
    // Confine to the visibility root (not just basePath) so a `..` in the public
    // route can't resolve into the guard-protected private tree.
    const root = path.resolve(this.basePath, visibility);
    const fullPath = path.resolve(root, joinSegments(segments));

    if (fullPath !== root && !fullPath.startsWith(root + path.sep)) {
      throw new NotFoundException();
    }

    let info;
    try {
      info = await stat(fullPath);
    } catch {
      throw new NotFoundException();
    }
    if (!info.isFile()) {
      throw new NotFoundException();
    }

    res.setHeader('Content-Type', mimeFromExtension(fullPath));
    res.setHeader('Content-Length', info.size);

    const stream = createReadStream(fullPath);
    stream.on('error', (err) => {
      if (!res.headersSent) {
        res.status(404).end();
      } else {
        res.destroy(err);
      }
    });
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  }
}

function joinSegments(segments: string | string[]): string {
  return Array.isArray(segments) ? segments.join('/') : String(segments ?? '');
}
