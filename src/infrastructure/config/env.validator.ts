import { environmentSchema, EnvironmentConfig } from './env.schema';

export const validateEnvironment = (config: Record<string, unknown>): EnvironmentConfig => {
  const result = environmentSchema.safeParse(config);

  if (result.success) {
    return result.data;
  }

  const formatted = result.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');

  throw new Error(`Environment validation failed:\n${formatted}`);
};
