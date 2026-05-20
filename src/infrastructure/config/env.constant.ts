export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

export const ENV_FILES: Record<Environment, string> = {
  [Environment.DEVELOPMENT]: '.env.development',
  [Environment.PRODUCTION]: '.env.production',
  [Environment.TEST]: '.env.test',
};

export const ENV_BOOLEAN_TRUTHY = ['true', 'yes', '1', 'on'] as const;
export const ENV_BOOLEAN_FALSY = ['false', 'no', '0', 'off'] as const;

export type EnvBooleanTruthy = (typeof ENV_BOOLEAN_TRUTHY)[number];
export type EnvBooleanFalsy = (typeof ENV_BOOLEAN_FALSY)[number];
