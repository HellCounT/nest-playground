import { ConfigModule } from '@nestjs/config';
import { getEnvFilePaths } from './config/helpers/get-env-file-paths.helper.js';

// you must import this const in the head of your app.module.ts
export const configModule = ConfigModule.forRoot({
  envFilePath: getEnvFilePaths(),
  isGlobal: true,
});
