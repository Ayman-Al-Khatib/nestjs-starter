import { Global, Module } from '@nestjs/common';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { Environment } from '../config/env.constant';
import { DEFAULT_LANGUAGE } from './i18n.constants';
import { Translator } from './i18n.service';

@Global()
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: DEFAULT_LANGUAGE,
      loaderOptions: {
        path: path.join(__dirname, '/translations/'),
        watch: process.env.NODE_ENV !== Environment.PRODUCTION,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
  ],
  providers: [Translator],
  exports: [Translator],
})
export class AppI18nModule {}
