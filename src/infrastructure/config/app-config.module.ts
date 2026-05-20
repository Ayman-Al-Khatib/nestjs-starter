import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ENV_FILES, Environment } from './env.constant';
import { validateEnvironment } from './env.validator';

const resolveEnvFile = (): string => {
  const nodeEnv = process.env.NODE_ENV as Environment | undefined;
  const file = (nodeEnv && ENV_FILES[nodeEnv]) ?? ENV_FILES[Environment.DEVELOPMENT];
  return `env/${file}`;
};

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validate: validateEnvironment,
      envFilePath: [resolveEnvFile()],
    }),
  ],
})
export class AppConfigModule {}
