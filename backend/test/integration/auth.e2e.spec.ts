import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { User } from '../../src/database/entities/user.entity';
import { Tenant } from '../../src/database/entities/tenant.entity';
import { UserTenant } from '../../src/database/entities/user-tenant.entity';
import { getTestDatabaseConfig } from '../setup';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Auth E2E', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let tenantRepository: Repository<Tenant>;
  let userTenantRepository: Repository<UserTenant>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: './test/.env.test',
        }),
        TypeOrmModule.forRoot(getTestDatabaseConfig()),
        TypeOrmModule.forFeature([User, Tenant, UserTenant]),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    tenantRepository = moduleFixture.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    userTenantRepository = moduleFixture.get<Repository<UserTenant>>(
      getRepositoryToken(UserTenant),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await userTenantRepository.query('DELETE FROM user_tenants');
    await userRepository.query('DELETE FROM users');
    await tenantRepository.query('DELETE FROM tenants');
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user and create tenant', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        tenantName: 'Acme Corp',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tenant');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.tenant.name).toBe(registerDto.tenantName);

      // Verify user was created in database
      const user = await userRepository.findOne({
        where: { email: registerDto.email },
      });
      expect(user).toBeDefined();
      expect(user.firstName).toBe(registerDto.firstName);

      // Verify tenant was created
      const tenant = await tenantRepository.findOne({
        where: { id: response.body.tenant.id },
      });
      expect(tenant).toBeDefined();
      expect(tenant.name).toBe(registerDto.tenantName);
    });

    it('should return 409 if user already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        tenantName: 'Acme Corp',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 for invalid email', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        tenantName: 'Acme Corp',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should return 400 for weak password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
        tenantName: 'Acme Corp',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    let registeredUser: any;

    beforeEach(async () => {
      // Register a user for login tests
      const registerDto = {
        email: 'logintest@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        tenantName: 'Test Tenant',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      registeredUser = response.body;
    });

    it('should login user with valid credentials', async () => {
      const loginDto = {
        email: 'logintest@example.com',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tenant');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(loginDto.email);
    });

    it('should return 401 for invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should return 401 for invalid password', async () => {
      const loginDto = {
        email: 'logintest@example.com',
        password: 'WrongPassword123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should update lastLoginAt timestamp on login', async () => {
      const loginDto = {
        email: 'logintest@example.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      const user = await userRepository.findOne({
        where: { email: loginDto.email },
      });

      expect(user.lastLoginAt).toBeDefined();
    });
  });

  describe('/auth/refresh (POST)', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login a user
      const registerDto = {
        email: 'refreshtest@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        tenantName: 'Test Tenant',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).not.toBe(accessToken);
    });

    it('should return 401 for invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register a user
      const registerDto = {
        email: 'logouttest@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        tenantName: 'Test Tenant',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      accessToken = response.body.accessToken;
      userId = response.body.user.id;
    });

    it('should logout user and clear refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const user = await userRepository.findOne({ where: { id: userId } });
      expect(user.refreshToken).toBeNull();
    });

    it('should return 401 without valid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register a user
      const registerDto = {
        email: 'metest@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        tenantName: 'Test Tenant',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      accessToken = response.body.accessToken;
      userId = response.body.user.id;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('sub', userId);
      expect(response.body).toHaveProperty('email');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });
});
