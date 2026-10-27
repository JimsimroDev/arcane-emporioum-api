# Requirements Document

## Introduction

This document specifies the requirements for implementing JWT (JSON Web Token) authentication in the Arcane Emporium API, a Spring Boot WebFlux reactive application. The implementation will replace the current session-based authentication with stateless JWT authentication while maintaining compatibility with existing endpoints and role-based access control.

## Glossary

- **JWT_Service**: The service component responsible for generating, validating, and parsing JSON Web Tokens
- **Authentication_Filter**: The reactive filter that intercepts HTTP requests and validates JWT tokens
- **Token_Payload**: The JSON structure containing user identity (email), role, and expiration metadata within a JWT
- **Access_Token**: A short-lived JWT that grants access to protected endpoints
- **Refresh_Token**: A long-lived token used to obtain new access tokens without re-authentication
- **Token_Blacklist**: A storage mechanism that tracks invalidated tokens before their natural expiration
- **Security_Context**: Spring Security's reactive context that holds the authenticated principal
- **Bearer_Token**: The HTTP Authorization header format for transmitting JWTs (Authorization: Bearer {token})
- **Token_Secret**: The cryptographic key used to sign and verify JWT signatures
- **Login_Response**: The DTO returned after successful authentication containing tokens and user information
- **Protected_Endpoint**: Any API endpoint that requires authentication and authorization
- **Token_Expiration**: The timestamp after which a token is no longer valid
- **Role_Claim**: The JWT claim field containing the user's role (USER or ADMIN)

## Requirements

### Requirement 1: JWT Generation on Successful Login

**User Story:** As a user, I want to receive JWT tokens upon successful login, so that I can access protected endpoints without maintaining server-side sessions.

#### Acceptance Criteria

1. WHEN a user successfully authenticates via /api/v1/login, THE JWT_Service SHALL generate an Access_Token with a 15-minute expiration
2. WHEN a user successfully authenticates via /api/v1/login, THE JWT_Service SHALL generate a Refresh_Token with a 7-day expiration
3. WHEN generating an Access_Token, THE JWT_Service SHALL include the user email, role, and expiration timestamp in the Token_Payload
4. WHEN generating a Refresh_Token, THE JWT_Service SHALL include the user email and expiration timestamp in the Token_Payload
5. WHEN token generation completes, THE Login_Response SHALL return both Access_Token and Refresh_Token along with user information
6. THE JWT_Service SHALL sign all tokens using HS512 algorithm with the Token_Secret

### Requirement 2: JWT Token Validation

**User Story:** As a system, I want to validate JWT tokens on protected endpoints, so that only authenticated users with valid tokens can access resources.

#### Acceptance Criteria

1. WHEN a request is received for a Protected_Endpoint, THE Authentication_Filter SHALL extract the Bearer_Token from the Authorization header
2. WHEN the Authorization header is missing, THE Authentication_Filter SHALL reject the request with HTTP 401 Unauthorized
3. WHEN the Bearer_Token format is invalid, THE Authentication_Filter SHALL reject the request with HTTP 401 Unauthorized
4. WHEN validating a token, THE JWT_Service SHALL verify the token signature using the Token_Secret
5. IF the token signature is invalid, THEN THE JWT_Service SHALL reject the token and THE Authentication_Filter SHALL return HTTP 401 Unauthorized
6. WHEN the token signature is valid, THE JWT_Service SHALL verify the Token_Expiration has not passed
7. IF the Token_Expiration has passed, THEN THE JWT_Service SHALL reject the token and THE Authentication_Filter SHALL return HTTP 401 Unauthorized
8. WHEN the token is valid and not expired, THE JWT_Service SHALL extract the user email and Role_Claim from the Token_Payload
9. WHEN token validation succeeds, THE Authentication_Filter SHALL populate the Security_Context with the authenticated user and role

### Requirement 3: Token Refresh Mechanism

**User Story:** As a user, I want to refresh my access token using a refresh token, so that I can maintain access without re-entering credentials.

#### Acceptance Criteria

1. THE System SHALL provide a /api/v1/refresh-token endpoint
2. WHEN a request is received at /api/v1/refresh-token with a valid Refresh_Token, THE JWT_Service SHALL generate a new Access_Token
3. WHEN a request is received at /api/v1/refresh-token with a valid Refresh_Token, THE JWT_Service SHALL generate a new Refresh_Token
4. WHEN generating new tokens via refresh, THE JWT_Service SHALL use the same expiration durations as initial login
5. IF the Refresh_Token is expired or invalid, THEN THE System SHALL return HTTP 401 Unauthorized
6. WHEN token refresh succeeds, THE System SHALL return both new Access_Token and Refresh_Token
7. THE System SHALL validate the user still exists and is active before issuing new tokens

### Requirement 4: Role-Based Authorization

**User Story:** As an administrator, I want JWT tokens to enforce role-based access control, so that users can only access endpoints appropriate to their role.

#### Acceptance Criteria

1. WHEN validating a token for an endpoint with @PreAuthorize("hasRole('ADMIN')"), THE Authentication_Filter SHALL verify the Role_Claim equals ADMIN
2. WHEN validating a token for an endpoint with @PreAuthorize("hasAnyRole('USER','ADMIN')"), THE Authentication_Filter SHALL verify the Role_Claim is either USER or ADMIN
3. IF the Role_Claim does not match the required role, THEN THE System SHALL return HTTP 403 Forbidden
4. WHEN a user's role is updated in the database, THE System SHALL require new token generation for the role change to take effect
5. THE JWT_Service SHALL preserve the existing Erole enum values (USER, ADMIN) in the Role_Claim

### Requirement 5: Secure Token Configuration

**User Story:** As a developer, I want JWT configuration to be externalized and secure, so that sensitive cryptographic keys are not hardcoded.

#### Acceptance Criteria

1. THE System SHALL load the Token_Secret from Spring configuration properties
2. THE System SHALL load token expiration durations from Spring configuration properties
3. THE Token_Secret SHALL have a minimum length of 256 bits for HS512 algorithm
4. THE System SHALL provide example configuration in application.yml with placeholder values
5. THE System SHALL document that Token_Secret must be changed in production environments
6. WHERE environment variables are set, THE System SHALL override application.yml values with environment variables

### Requirement 6: Token Invalidation (Logout)

**User Story:** As a user, I want to invalidate my tokens when logging out, so that they cannot be used after I explicitly end my session.

#### Acceptance Criteria

1. THE System SHALL provide a /api/v1/logout endpoint
2. WHEN a user invokes /api/v1/logout with a valid Access_Token, THE System SHALL add the token to the Token_Blacklist
3. WHEN validating a token, THE Authentication_Filter SHALL check if the token exists in the Token_Blacklist
4. IF a token is found in the Token_Blacklist, THEN THE Authentication_Filter SHALL reject the request with HTTP 401 Unauthorized
5. THE Token_Blacklist SHALL automatically remove entries after their Token_Expiration has passed
6. THE Token_Blacklist SHALL use an in-memory store for blacklisted tokens

### Requirement 7: Integration with Existing Endpoints

**User Story:** As a developer, I want existing authentication endpoints to remain functional, so that the JWT implementation does not break existing functionality.

#### Acceptance Criteria

1. THE System SHALL maintain the existing /api/v1/register endpoint functionality
2. THE System SHALL maintain the existing /api/v1/forgot-password endpoint functionality
3. THE System SHALL maintain the existing /api/v1/reset-password endpoint functionality
4. THE System SHALL maintain the existing /api/v1/change-password endpoint functionality
5. WHEN the /api/v1/change-password endpoint is invoked, THE System SHALL require a valid Access_Token
6. THE System SHALL remove session-based authentication dependencies (WebSessionServerSecurityContextRepository)
7. THE System SHALL maintain the existing UserEntity model without schema changes

### Requirement 8: Error Handling and Security

**User Story:** As a security engineer, I want proper error handling for token-related failures, so that security issues are logged without exposing sensitive information.

#### Acceptance Criteria

1. WHEN token validation fails, THE System SHALL log the failure reason with the token identifier but not the full token value
2. WHEN token validation fails, THE System SHALL return a generic error message to the client
3. IF token parsing throws an exception, THEN THE Authentication_Filter SHALL catch the exception and return HTTP 401 Unauthorized
4. THE System SHALL log all token generation events with user email and timestamp
5. THE System SHALL log all token validation failures with reason codes
6. WHEN multiple rapid token validation failures occur from the same IP, THE System SHALL log a security warning
7. THE JWT_Service SHALL not expose internal exception stack traces in HTTP responses

### Requirement 9: Public Endpoint Access

**User Story:** As an API consumer, I want to access public endpoints without authentication, so that I can use public features without logging in.

#### Acceptance Criteria

1. THE Authentication_Filter SHALL bypass token validation for paths matching /api/v1/login
2. THE Authentication_Filter SHALL bypass token validation for paths matching /api/v1/register
3. THE Authentication_Filter SHALL bypass token validation for paths matching /api/v1/forgot-password
4. THE Authentication_Filter SHALL bypass token validation for paths matching /api/v1/reset-password
5. THE Authentication_Filter SHALL bypass token validation for paths matching /api/v1/public
6. THE Authentication_Filter SHALL bypass token validation for paths matching /api/v1/artifacts/**
7. THE Authentication_Filter SHALL bypass token validation for static resources (/*.js, /*.css, /*.ico, /favicon.ico)
8. THE Authentication_Filter SHALL maintain the existing CORS configuration from SecurityConfig

### Requirement 10: Reactive Implementation

**User Story:** As a developer, I want JWT implementation to be fully reactive, so that it integrates seamlessly with the existing WebFlux architecture.

#### Acceptance Criteria

1. THE JWT_Service SHALL return Mono<String> for token generation operations
2. THE JWT_Service SHALL return Mono<Claims> for token validation operations
3. THE Authentication_Filter SHALL extend WebFilter for reactive request processing
4. THE Authentication_Filter SHALL use Mono and Flux types for all asynchronous operations
5. THE Authentication_Filter SHALL not block reactive streams during token validation
6. WHEN populating the Security_Context, THE Authentication_Filter SHALL use ReactiveSecurityContextHolder
7. THE Token_Blacklist SHALL use reactive data structures or repositories

### Requirement 11: Maven Dependency Management

**User Story:** As a developer, I want JWT dependencies to be properly managed, so that the implementation has the necessary libraries.

#### Acceptance Criteria

1. THE System SHALL include io.jsonwebtoken:jjwt-api dependency in pom.xml
2. THE System SHALL include io.jsonwebtoken:jjwt-impl dependency in pom.xml with runtime scope
3. THE System SHALL include io.jsonwebtoken:jjwt-jackson dependency in pom.xml with runtime scope
4. THE System SHALL use version 0.12.5 or higher for all JJWT dependencies
5. THE System SHALL maintain all existing Spring Security dependencies

### Requirement 12: Package Structure Compliance

**User Story:** As a developer, I want JWT implementation to follow the domain architecture standard, so that code organization remains consistent.

#### Acceptance Criteria

1. THE JWT_Service SHALL be located in uk.jimsimrodev.arcanemporiumapi.infra.security package
2. THE Authentication_Filter SHALL be located in uk.jimsimrodev.arcanemporiumapi.infra.security package
3. THE Login_Response DTO SHALL be located in uk.jimsimrodev.arcanemporiumapi.domain.auth.dto package
4. THE Token_Blacklist SHALL be located in uk.jimsimrodev.arcanemporiumapi.infra.security package
5. THE System SHALL follow the naming convention of interface I<Service>Service and implementation <Service>ServiceImpl
6. WHERE new DTOs are created, THE System SHALL use Java record types
