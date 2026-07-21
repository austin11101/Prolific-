import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('Core API bootstrap (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('starts without exposing product routes', async () => {
    await request(app.getHttpServer()).get('/api/v1').expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
