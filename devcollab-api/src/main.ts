import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/global-exception-filter';
import * as session from 'express-session';
import * as passport from 'passport';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as pgSession from 'connect-pg-simple';
import { Pool } from 'pg';

const PgStore = pgSession(session);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Required to ensure secure cookies work behind reverse proxies (Render, Heroku, Railway)
  app.set('trust proxy', 1);

  app.use(
    session({
      store: new PgStore({
        pool,
        createTableIfMissing: true, // Automatically creates the "session" table
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

  app.useGlobalPipes(new ValidationPipe());

  app.setViewEngine('ejs');
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
