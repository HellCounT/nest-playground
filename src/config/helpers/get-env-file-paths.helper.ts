import { join } from 'path';

export function getEnvFilePaths(): string[] {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  return [
    process.env.ENV_FILE_PATH?.trim() || '',
    join(process.cwd(), `src/env/.env.${nodeEnv}.local`),
    join(process.cwd(), `src/env/.env.${nodeEnv}`), // и могут быть переопределены вышестоящими файлами
    join(process.cwd(), `src/env/.env.production`),
  ].filter(Boolean);
}
