import { join } from 'path';
import { ConfigModule } from '@nestjs/config';

const nodeEnv = process.env.NODE_ENV ?? 'development';

// you must import this const in the head of your app.module.ts
export const configModule = ConfigModule.forRoot({
  envFilePath: [
    process.env.ENV_FILE_PATH?.trim() || '',
    join(process.cwd(), `src/env/.env.${nodeEnv}.local`),
    join(process.cwd(), `src/env/.env.${nodeEnv}`), // и могут быть переопределены выше стоящими файлами
    join(process.cwd(), `src/env/.env.production`),
  ],
  isGlobal: true,
});
