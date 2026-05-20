import { ConsoleFormatter } from '../shared';
import { I18nReporter } from './i18n-reporter';
import { I18nTypesGenerator } from './i18n-types-generator';
import { I18nValidator } from './i18n-validator';

function main(): void {
  const validator = new I18nValidator();
  const reporter = new I18nReporter();
  const typesGenerator = new I18nTypesGenerator();

  const result = validator.validate();
  reporter.print(result);

  const outputPath = typesGenerator.write({
    allKeys: result.allKeys,
    keyParameters: result.keyParameters,
  });
  reporter.reportGenerated(outputPath);

  const hasBlockingErrors = result.availableLanguages.some((lang) => {
    const stats = result.languageStats[lang];
    return stats ? I18nReporter.hasBlockingErrors(stats) : false;
  });

  process.exit(hasBlockingErrors ? 1 : 0);
}

try {
  main();
} catch (error) {
  console.error(
    ConsoleFormatter.formatStatus('error', 'i18n validation failed'),
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
