# Authentication Guide

## Overview

The SEO Intelligence Platform API uses JWT (JSON Web Tokens) for authentication. All API requests must include a valid JWT token in the Authorization header.

## Getting Started

### 1. Register a New Account

```bash
curl -X POST https://api.seo-platform.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### 2. Login

```bash
curl -X POST https://api.seo-platform.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### 3. Use Access Token

Include the access token in the Authorization header of all API requests:

```bash
curl -X GET https://api.seo-platform.com/api/v1/projects \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Token Management

### Access Token
- **Lifetime**: 15 minutes
- **Purpose**: Authenticate API requests
- **Storage**: Memory (never localStorage for security)

### Refresh Token
- **Lifetime**: 7 days
- **Purpose**: Obtain new access tokens
- **Storage**: HttpOnly cookie (recommended) or secure storage

### Refreshing Tokens

When your access token expires, use the refresh token to get a new one:

```bash
curl -X POST https://api.seo-platform.com/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Best Practices

1. **Store tokens securely**
   - Never commit tokens to version control
   - Use environment variables for server-side applications
   - Use secure storage for client applications

2. **Handle token expiration**
   - Implement automatic token refresh
   - Handle 401 Unauthorized responses gracefully

3. **Rotate refresh tokens**
   - Obtain new refresh tokens when refreshing access tokens
   - Invalidate old refresh tokens

4. **Use HTTPS**
   - Always use HTTPS in production
   - Never send tokens over unsecured connections

## Error Handling

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

**Solution**: Refresh your access token or re-authenticate

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

**Solution**: Check your user role and permissions

## Multi-Tenant Authentication

The API supports multi-tenant architecture. After authentication:

1. Select a tenant context
2. All subsequent requests operate within that tenant's scope

```bash
curl -X POST https://api.seo-platform.com/api/v1/tenant/select \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-uuid"
  }'
```

## Security Considerations

- **Password Requirements**: Minimum 8 characters, must include uppercase, lowercase, and numbers
- **Rate Limiting**: Failed login attempts are rate-limited to prevent brute force attacks
- **Token Invalidation**: Logout invalidates both access and refresh tokens
- **IP Whitelisting**: Available for Enterprise tier
- **2FA**: Two-factor authentication available (contact support to enable)
