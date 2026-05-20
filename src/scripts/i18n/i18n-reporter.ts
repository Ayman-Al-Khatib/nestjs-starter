import { ANSI_COLORS, ConsoleFormatter, StatusType } from '../shared';
import { COVERAGE_THRESHOLDS } from './i18n.constants';
import { TranslationStats, ValidationResult } from './i18n.types';

export class I18nReporter {
  print(result: ValidationResult): void {
    console.log(`\n${ANSI_COLORS.bold}📊 Translation Validation Report${ANSI_COLORS.reset}\n`);

    this.printLanguage(result.referenceLanguage, result, true);
    for (const lang of result.availableLanguages) {
      if (lang !== result.referenceLanguage) {
        this.printLanguage(lang, result, false);
      }
    }

    console.log(
      ConsoleFormatter.createBox('📈 Overall Status', [
        ConsoleFormatter.formatStatus(
          result.isFullyCovered ? 'success' : 'warning',
          result.isFullyCovered ? 'All translations complete!' : 'Some translations need attention',
        ),
      ]),
    );
  }

  reportGenerated(outputPath: string): void {
    console.log(
      ConsoleFormatter.createBox('📝 Type Generation', [
        ConsoleFormatter.formatStatus('success', `Types generated at: ${outputPath}`),
      ]),
    );
  }

  private printLanguage(lang: string, result: ValidationResult, isReference: boolean): void {
    const stats = result.languageStats[lang];
    if (!stats) return;

    const coverageStatus = this.coverageToStatus(stats.coverage);
    const summary = [
      ConsoleFormatter.formatStatus(
        coverageStatus,
        `Coverage: ${ConsoleFormatter.createProgressBar(stats.coverage)}`,
      ),
      '',
      ConsoleFormatter.formatStatus(
        stats.missingKeys.length === 0 ? 'success' : 'error',
        `Missing Keys: ${stats.missingKeys.length}`,
      ),
      ConsoleFormatter.formatStatus(
        stats.extraKeys.length === 0 ? 'success' : 'warning',
        `Extra Keys: ${stats.extraKeys.length}`,
      ),
      ConsoleFormatter.formatStatus(
        stats.emptyValues.length === 0 ? 'success' : 'error',
        `Empty Values: ${stats.emptyValues.length}`,
      ),
    ];

    console.log(
      ConsoleFormatter.createBox(
        `🌐 Language: ${lang}${isReference ? ' (reference)' : ''}`,
        summary,
      ),
    );

    this.printKeyList('❌ Missing Keys', stats.missingKeys, ANSI_COLORS.red);
    this.printKeyList('⚠️ Extra Keys', stats.extraKeys, ANSI_COLORS.yellow);
    this.printKeyList('❌ Empty Values', stats.emptyValues, ANSI_COLORS.red);

    console.log('');
  }

  private printKeyList(title: string, keys: string[], color: string): void {
    if (keys.length === 0) return;
    console.log(
      ConsoleFormatter.createBox(
        title,
        keys.map((key) => `${color}${key}${ANSI_COLORS.reset}`),
      ),
    );
  }

  private coverageToStatus(coverage: number): StatusType {
    if (coverage >= COVERAGE_THRESHOLDS.success) return 'success';
    if (coverage >= COVERAGE_THRESHOLDS.warning) return 'warning';
    return 'error';
  }

  static hasBlockingErrors(stats: TranslationStats): boolean {
    return stats.missingKeys.length > 0 || stats.emptyValues.length > 0;
  }
}
