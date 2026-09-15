import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AppConfigService } from './config/app-config.service.js';
import { useContainer } from 'class-validator';
import { applyAppSettings } from './settings/apply-app-settings.js';
import { setupSwagger } from './settings/include-swagger.js';
import { ObserveInstrument } from './settings/observe.js';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const appConfig = appContext.get<AppConfigService>(AppConfigService);
  const DynamicAppModule = await AppModule.forRoot(appConfig);
  const app = await NestFactory.create(
    DynamicAppModule,
    appConfig.includeObserveModule
      ? {
          instrument: ObserveInstrument,
        }
      : {},
  );
  await appContext.close();

  useContainer(app.select(DynamicAppModule), { fallbackOnErrors: true });
  applyAppSettings(app);

  if (appConfig.isSwaggerEnabled) {
    setupSwagger(app);
  }

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  await app.listen(appConfig.port);

  console.log('App started at port ', appConfig.port);
}

await bootstrap();
