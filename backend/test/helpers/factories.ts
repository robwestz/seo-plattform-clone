import { User } from '../../src/database/entities/user.entity';
import { Tenant } from '../../src/database/entities/tenant.entity';
import { Project, ProjectStatus } from '../../src/database/entities/project.entity';
import { UserTenant, UserRole } from '../../src/database/entities/user-tenant.entity';
import * as bcrypt from 'bcrypt';

/**
 * Test Data Factories
 * Factory pattern for creating test data
 */

let userCounter = 0;
let tenantCounter = 0;
let projectCounter = 0;

/**
 * Create a test user
 */
export async function createTestUser(overrides: Partial<User> = {}): Promise<User> {
  userCounter++;
  const user = new User();
  user.id = overrides.id || `test-user-${userCounter}`;
  user.email = overrides.email || `test${userCounter}@example.com`;
  user.password = overrides.password || await bcrypt.hash('Password123!', 10);
  user.firstName = overrides.firstName || `First${userCounter}`;
  user.lastName = overrides.lastName || `Last${userCounter}`;
  user.active = overrides.active !== undefined ? overrides.active : true;
  user.emailVerified = overrides.emailVerified !== undefined ? overrides.emailVerified : true;
  user.createdAt = overrides.createdAt || new Date();
  user.updatedAt = overrides.updatedAt || new Date();

  return Object.assign(user, overrides);
}

/**
 * Create a test tenant
 */
export function createTestTenant(overrides: Partial<Tenant> = {}): Tenant {
  tenantCounter++;
  const tenant = new Tenant();
  tenant.id = overrides.id || `test-tenant-${tenantCounter}`;
  tenant.name = overrides.name || `Test Tenant ${tenantCounter}`;
  tenant.slug = overrides.slug || `test-tenant-${tenantCounter}`;
  tenant.active = overrides.active !== undefined ? overrides.active : true;
  tenant.subscriptionTier = overrides.subscriptionTier || 'professional';
  tenant.maxUsers = overrides.maxUsers || 10;
  tenant.maxProjects = overrides.maxProjects || 5;
  tenant.maxKeywords = overrides.maxKeywords || 100;
  tenant.settings = overrides.settings || {};
  tenant.createdAt = overrides.createdAt || new Date();
  tenant.updatedAt = overrides.updatedAt || new Date();

  return Object.assign(tenant, overrides);
}

/**
 * Create a test project
 */
export function createTestProject(tenantId: string, overrides: Partial<Project> = {}): Project {
  projectCounter++;
  const project = new Project();
  project.id = overrides.id || `test-project-${projectCounter}`;
  project.tenantId = tenantId;
  project.name = overrides.name || `Test Project ${projectCounter}`;
  project.slug = overrides.slug || `test-project-${projectCounter}`;
  project.domain = overrides.domain || `example${projectCounter}.com`;
  project.protocol = overrides.protocol || 'https';
  project.status = overrides.status || ProjectStatus.ACTIVE;
  project.targetKeywords = overrides.targetKeywords || [];
  project.competitorDomains = overrides.competitorDomains || [];
  project.targetCountries = overrides.targetCountries || ['US'];
  project.targetLanguages = overrides.targetLanguages || ['en'];
  project.createdAt = overrides.createdAt || new Date();
  project.updatedAt = overrides.updatedAt || new Date();

  return Object.assign(project, overrides);
}

/**
 * Create a test user-tenant relationship
 */
export function createTestUserTenant(
  userId: string,
  tenantId: string,
  role: UserRole = UserRole.OWNER,
  overrides: Partial<UserTenant> = {},
): UserTenant {
  const userTenant = new UserTenant();
  userTenant.userId = userId;
  userTenant.tenantId = tenantId;
  userTenant.role = role;
  userTenant.active = overrides.active !== undefined ? overrides.active : true;
  userTenant.joinedAt = overrides.joinedAt || new Date();
  userTenant.createdAt = overrides.createdAt || new Date();
  userTenant.updatedAt = overrides.updatedAt || new Date();

  return Object.assign(userTenant, overrides);
}

/**
 * Create a complete test setup (user, tenant, project)
 */
export async function createTestSetup() {
  const user = await createTestUser();
  const tenant = createTestTenant();
  const userTenant = createTestUserTenant(user.id, tenant.id, UserRole.OWNER);
  const project = createTestProject(tenant.id);

  return {
    user,
    tenant,
    userTenant,
    project,
  };
}

/**
 * Reset factory counters (use in beforeEach)
 */
export function resetFactoryCounters() {
  userCounter = 0;
  tenantCounter = 0;
  projectCounter = 0;
}

/**
 * Create test JWT payload
 */
export function createTestJwtPayload(
  userId: string,
  tenantId: string,
  role: UserRole = UserRole.OWNER,
) {
  return {
    sub: userId,
    email: `user${userId}@example.com`,
    tenantId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
}
