import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/auth.service';
import { User } from '../../src/database/entities/user.entity';
import { Tenant } from '../../src/database/entities/tenant.entity';
import { UserTenant, UserRole } from '../../src/database/entities/user-tenant.entity';
import {
  createMockRepository,
  createMockJwtService,
} from '../helpers/test-helpers';
import {
  createTestUser,
  createTestTenant,
  createTestUserTenant,
} from '../helpers/factories';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let tenantRepository: any;
  let userTenantRepository: any;
  let jwtService: any;
  let configService: any;

  beforeEach(async () => {
    userRepository = createMockRepository<User>();
    tenantRepository = createMockRepository<Tenant>();
    userTenantRepository = createMockRepository<UserTenant>();
    jwtService = createMockJwtService();

    configService = {
      get: jest.fn((key: string) => {
        const config = {
          'jwt.secret': 'test-secret',
          'jwt.expiresIn': '1h',
          'jwt.refreshSecret': 'test-refresh-secret',
          'jwt.refreshExpiresIn': '7d',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Tenant), useValue: tenantRepository },
        { provide: getRepositoryToken(UserTenant), useValue: userTenantRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and create tenant', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        tenantName: 'Acme Corp',
      };

      userRepository.findOne.mockResolvedValue(null);
      tenantRepository.findOne.mockResolvedValue(null);

      const tenant = createTestTenant({ name: registerDto.tenantName });
      const user = await createTestUser({
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });

      tenantRepository.create.mockReturnValue(tenant);
      tenantRepository.save.mockResolvedValue(tenant);
      userRepository.create.mockReturnValue(user);
      userRepository.save.mockResolvedValue(user);
      userTenantRepository.create.mockReturnValue({});
      userTenantRepository.save.mockResolvedValue({});

      user.setRefreshToken = jest.fn().mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tenant');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(tenantRepository.save).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(userTenantRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        tenantName: 'Acme Corp',
      };

      const existingUser = await createTestUser({ email: registerDto.email });
      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if tenant slug already exists', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        tenantName: 'Existing Tenant',
      };

      userRepository.findOne.mockResolvedValue(null);
      const existingTenant = createTestTenant({ name: registerDto.tenantName });
      tenantRepository.findOne.mockResolvedValue(existingTenant);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login user and return tokens', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const user = await createTestUser({ email: loginDto.email });
      const tenant = createTestTenant();
      const userTenant = createTestUserTenant(user.id, tenant.id);
      userTenant.tenant = tenant;

      user.validatePassword = jest.fn().mockResolvedValue(true);
      user.setRefreshToken = jest.fn().mockResolvedValue(undefined);

      userRepository.findOne.mockResolvedValue(user);
      userTenantRepository.findOne.mockResolvedValue(userTenant);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tenant');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user has no active tenant', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const user = await createTestUser({ email: loginDto.email });
      user.validatePassword = jest.fn().mockResolvedValue(true);

      userRepository.findOne.mockResolvedValue(user);
      userTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'Password123!';

      const user = await createTestUser({ email });
      user.validatePassword = jest.fn().mockResolvedValue(true);

      userRepository.findOne.mockResolvedValue(user);

      const result = await service.validateUser(email, password);

      expect(result).toBeDefined();
      expect(result.email).toBe(email);
    });

    it('should return null for invalid password', async () => {
      const email = 'test@example.com';
      const password = 'WrongPassword';

      const user = await createTestUser({ email });
      user.validatePassword = jest.fn().mockResolvedValue(false);

      userRepository.findOne.mockResolvedValue(user);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const email = 'test@example.com';
      const password = 'Password123!';

      const user = await createTestUser({ email, active: false });

      userRepository.findOne.mockResolvedValue(user);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const email = 'nonexistent@example.com';
      const password = 'Password123!';

      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const userId = 'test-user-id';
      const refreshToken = 'valid-refresh-token';

      const user = await createTestUser({ id: userId });
      const tenant = createTestTenant();
      const userTenant = createTestUserTenant(user.id, tenant.id);

      user.validateRefreshToken = jest.fn().mockResolvedValue(true);
      user.setRefreshToken = jest.fn().mockResolvedValue(undefined);

      userRepository.findOne.mockResolvedValue(user);
      userTenantRepository.findOne.mockResolvedValue(userTenant);

      const result = await service.refreshTokens(userId, refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const userId = 'test-user-id';
      const refreshToken = 'invalid-refresh-token';

      const user = await createTestUser({ id: userId });
      user.validateRefreshToken = jest.fn().mockResolvedValue(false);

      userRepository.findOne.mockResolvedValue(user);

      await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout user by removing refresh token', async () => {
      const userId = 'test-user-id';

      await service.logout(userId);

      expect(userRepository.update).toHaveBeenCalledWith(userId, { refreshToken: null });
    });
  });
});
