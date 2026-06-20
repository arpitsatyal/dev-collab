import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/global-exception-filter';
import session from 'express-session';
import passport from 'passport';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import cookieParser from 'cookie-parser';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';

const PgStore = connectPgSimple(session);

async function bootstrap() {
  const port = Number(process.env.PORT) || 3000;
  console.log(
    `Starting Nest (${process.env.NODE_ENV ?? 'development'}) on port ${port}...`,
  );

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  app.set('trust proxy', 1);

  app.use(
    session({
      store: new PgStore({
        pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || 'your-session-secret',
      resave: true, // Help with memory store stability
      saveUninitialized: false,
      rolling: true, // Refresh cookie on every request
      cookie: {
        secure: process.env.NODE_ENV === 'production', // Must be true if frontend and backend are on different domains
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' required for cross-origin cookies
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session({ pauseStream: true }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setViewEngine('ejs');
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: 0 }], // 0 is RequestMethod.GET
  });

  await app.listen(port);
}

bootstrap();
