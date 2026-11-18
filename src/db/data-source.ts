import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { getEnvFilePaths } from '../config/helpers/get-env-file-paths.helper.js';
import { join } from 'path';

config({
  path: getEnvFilePaths(),
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  synchronize: false,

  entities: [join(process.cwd(), 'src/**/*.entity.ts')],

  migrations: [join(process.cwd(), 'src/db/migrations/*.ts')],
});
