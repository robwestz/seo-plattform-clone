import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
}

/**
 * JWT Strategy for Passport
 * Validates JWT tokens and extracts user information
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  /**
   * Validate JWT payload and load user
   * @param payload - JWT payload
   * @returns User object with tenant information
   * @throws UnauthorizedException if user not found or inactive
   */
  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['userTenants', 'userTenants.tenant'],
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Find the user's tenant from the token
    const userTenant = user.userTenants.find((ut) => ut.tenantId === payload.tenantId);

    if (!userTenant) {
      throw new UnauthorizedException('User not associated with tenant');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: payload.tenantId,
      role: userTenant.role,
      permissions: userTenant.permissions,
    };
  }
}
