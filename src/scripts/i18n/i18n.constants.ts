import { join } from 'path';

const I18N_MODULE_PATH = join(process.cwd(), 'src/infrastructure/i18n');

export const I18N_PATHS = {
  module: I18N_MODULE_PATH,
  translations: join(I18N_MODULE_PATH, 'translations'),
  generatedTypesFile: join(I18N_MODULE_PATH, 'translation-keys.ts'),
} as const;

export const DEFAULT_REFERENCE_LANGUAGE = 'en';

export const COVERAGE_THRESHOLDS = {
  success: 90,
  warning: 70,
} as const;

export const GENERATED_FILE_HEADER = `// AUTO-GENERATED — DO NOT EDIT MANUALLY.
// Run \`npm run i18n:sync\` to regenerate after modifying translation JSON files.

`;
