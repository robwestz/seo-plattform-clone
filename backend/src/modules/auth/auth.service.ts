import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { UserTenant, UserRole } from '../../database/entities/user-tenant.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/**
 * Authentication Service
 * Handles user registration, login, token generation, and validation
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(UserTenant)
    private userTenantRepository: Repository<UserTenant>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user and create their tenant
   * @param registerDto - Registration data
   * @returns User, tenant, and access tokens
   */
  async register(registerDto: RegisterDto) {
    this.logger.log(`Registering new user: ${registerDto.email}`);

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create tenant
    const tenantSlug = this.generateSlug(registerDto.tenantName);
    const existingTenant = await this.tenantRepository.findOne({
      where: { slug: tenantSlug },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant with this name already exists');
    }

    const tenant = this.tenantRepository.create({
      name: registerDto.tenantName,
      slug: tenantSlug,
      active: true,
    });

    await this.tenantRepository.save(tenant);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      active: true,
    });

    await this.userRepository.save(user);

    // Associate user with tenant as owner
    const userTenant = this.userTenantRepository.create({
      userId: user.id,
      tenantId: tenant.id,
      role: UserRole.OWNER,
      active: true,
      joinedAt: new Date(),
    });

    await this.userTenantRepository.save(userTenant);

    // Generate tokens
    const tokens = await this.generateTokens(user, tenant.id, UserRole.OWNER);

    // Save refresh token
    await user.setRefreshToken(tokens.refreshToken);
    await this.userRepository.save(user);

    this.logger.log(`User registered successfully: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      ...tokens,
    };
  }

  /**
   * Login user and generate tokens
   * @param loginDto - Login credentials
   * @returns User, tenant, and access tokens
   */
  async login(loginDto: LoginDto) {
    this.logger.log(`User login attempt: ${loginDto.email}`);

    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user's primary tenant (first one)
    const userTenant = await this.userTenantRepository.findOne({
      where: { userId: user.id, active: true },
      relations: ['tenant'],
      order: { createdAt: 'ASC' },
    });

    if (!userTenant) {
      throw new UnauthorizedException('User has no active tenant');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user, userTenant.tenantId, userTenant.role);

    // Save refresh token
    await user.setRefreshToken(tokens.refreshToken);
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    this.logger.log(`User logged in successfully: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tenant: {
        id: userTenant.tenant.id,
        name: userTenant.tenant.name,
        slug: userTenant.tenant.slug,
      },
      role: userTenant.role,
      ...tokens,
    };
  }

  /**
   * Validate user credentials
   * @param email - User email
   * @param password - User password
   * @returns User object if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'active'],
    });

    if (!user || !user.active) {
      return null;
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Refresh access token using refresh token
   * @param userId - User ID
   * @param refreshToken - Refresh token
   * @returns New access and refresh tokens
   */
  async refreshTokens(userId: string, refreshToken: string) {
    this.logger.log(`Refreshing tokens for user: ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName', 'lastName', 'refreshToken', 'active'],
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const isRefreshTokenValid = await user.validateRefreshToken(refreshToken);

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user's primary tenant
    const userTenant = await this.userTenantRepository.findOne({
      where: { userId: user.id, active: true },
      order: { createdAt: 'ASC' },
    });

    if (!userTenant) {
      throw new UnauthorizedException('User has no active tenant');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user, userTenant.tenantId, userTenant.role);

    // Save new refresh token
    await user.setRefreshToken(tokens.refreshToken);
    await this.userRepository.save(user);

    return tokens;
  }

  /**
   * Logout user by removing refresh token
   * @param userId - User ID
   */
  async logout(userId: string) {
    this.logger.log(`User logout: ${userId}`);

    await this.userRepository.update(userId, { refreshToken: null });
  }

  /**
   * Generate access and refresh tokens
   * @param user - User object
   * @param tenantId - Tenant ID
   * @param role - User role
   * @returns Access and refresh tokens
   */
  private async generateTokens(user: User, tenantId: string, role: UserRole) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId,
      role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    };
  }

  /**
   * Generate URL-friendly slug from string
   * @param text - Text to convert to slug
   * @returns URL-friendly slug
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
