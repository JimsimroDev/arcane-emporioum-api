# Implementation Plan: JWT Authentication (TDD Approach)

## Overview

This task list implements JWT authentication following strict Test-Driven Development (TDD) principles. Each task follows the Red-Green-Refactor cycle: write failing tests first, implement minimal code to pass tests, then refactor for quality. All test specifications are defined in design.md.

**Implementation Language:** Java (Spring Boot WebFlux)

**Testing Tools:** JUnit 5, Mockito, StepVerifier, WebTestClient

**Timeline:** 3 weeks (15 working days)

## Tasks

- [ ] 1. Setup: Maven dependencies and configuration
  - Add JJWT dependencies to pom.xml (io.jsonwebtoken:jjwt-api:0.12.5, jjwt-impl, jjwt-jackson)
  - Add JWT configuration properties to application.yml (jwt.secret, jwt.access-token-expiration-ms, jwt.refresh-token-expiration-ms)
  - Create JwtProperties.java configuration class in infra.security package
  - _Requirements: 5.1, 5.2, 5.3, 11.1, 11.2, 11.3, 11.4_

- [ ] 2. Phase 1 - Core JWT Service: Token Generation (TDD Red-Green-Refactor)
  - [ ] 2.1 RED: Write JwtServiceTest - Token Generation Suite
    - Create test file: backend/src/test/java/uk/jimsimrodev/arcanemporiumapi/infra/security/JwtServiceTest.java
    - Write test: `generateAccessToken_shouldReturnValidJwt_whenValidInputProvided()`
    - Write test: `generateAccessToken_shouldIncludeEmailInSubject_whenTokenGenerated()`
    - Write test: `generateAccessToken_shouldIncludeRoleInClaims_whenTokenGenerated()`
    - Write test: `generateAccessToken_shouldExpireIn15Minutes_whenTokenGenerated()`
    - Write test: `generateRefreshToken_shouldExpireIn7Days_whenTokenGenerated()`
    - Write test: `generateRefreshToken_shouldNotIncludeRole_whenTokenGenerated()`
    - Run tests - they should FAIL (Red phase)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [ ] 2.2 GREEN: Implement IJwtService interface and JwtServiceImpl
    - Create interface: infra/security/IJwtService.java with methods: generateAccessToken(), generateRefreshToken(), validateToken(), extractEmail(), extractRole(), extractExpiration()
    - Create implementation: infra/security/impl/JwtServiceImpl.java
    - Implement token generation using JJWT library with HS512 algorithm
    - Configure secret key loading from JwtProperties
    - Run tests - they should PASS (Green phase)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 12.1, 12.5_

  - [ ]* 2.3 REFACTOR: Optimize JwtServiceImpl
    - Extract constants (ROLE_CLAIM, algorithm)
    - Cache signing key in constructor
    - Add logging with SLF4J (debug for generation, error for failures)
    - Extract buildToken() helper method
    - Run tests - they should still PASS
    - _Requirements: 8.4_

- [ ] 3. Phase 1 - Core JWT Service: Token Validation (TDD Red-Green-Refactor)
  - [ ] 3.1 RED: Write JwtServiceTest - Token Validation Suite
    - Write test: `validateToken_shouldReturnClaims_whenValidTokenProvided()`
    - Write test: `validateToken_shouldRejectToken_whenSignatureInvalid()`
    - Write test: `validateToken_shouldRejectToken_whenExpired()`
    - Write test: `validateToken_shouldRejectToken_whenMalformed()`
    - Write test: `validateToken_shouldRejectToken_whenNull()`
    - Write test: `validateToken_shouldRejectToken_whenEmpty()`
    - Create helper method: `createExpiredToken()` for testing
    - Run tests - they should FAIL (Red phase)
    - _Requirements: 2.4, 2.5, 2.6, 2.7_

  - [ ] 3.2 GREEN: Implement token validation in JwtServiceImpl
    - Implement validateToken() using Jwts.parserBuilder()
    - Add signature verification with signing key
    - Handle ExpiredJwtException, MalformedJwtException, SignatureException
    - Return Mono.error(SecurityException) for invalid tokens
    - Run tests - they should PASS (Green phase)
    - _Requirements: 2.4, 2.5, 2.6, 2.7_

  - [ ]* 3.3 REFACTOR: Improve error handling in validation
    - Wrap exceptions with meaningful error messages
    - Add specific SecurityException messages for each failure type
    - Avoid exposing stack traces
    - Run tests - they should still PASS
    - _Requirements: 8.2, 8.3, 8.7_

- [ ] 4. Phase 1 - Core JWT Service: Claims Extraction (TDD Red-Green-Refactor)
  - [ ] 4.1 RED: Write JwtServiceTest - Claims Extraction Suite
    - Write test: `extractEmail_shouldReturnEmail_whenValidClaimsProvided()`
    - Write test: `extractRole_shouldReturnRole_whenAccessTokenClaims()`
    - Write test: `extractRole_shouldReturnNull_whenRefreshTokenClaims()`
    - Write test: `extractExpiration_shouldReturnMilliseconds_whenValidClaims()`
    - Run tests - they should FAIL (Red phase)
    - _Requirements: 2.8_

  - [ ] 4.2 GREEN: Implement claims extraction methods
    - Implement extractEmail() - return claims.getSubject()
    - Implement extractRole() - return claims.get("role", String.class)
    - Implement extractExpiration() - return claims.getExpiration().getTime()
    - Run tests - they should PASS (Green phase)
    - _Requirements: 2.8_

  - [ ]* 4.3 REFACTOR: Add null safety to extraction methods
    - Add null checks for claims parameter
    - Handle missing role claim gracefully
    - Run tests - they should still PASS

- [ ] 5. Checkpoint - Ensure all JwtService tests pass
  - Run all JwtServiceTest tests and verify 100% pass rate
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Phase 1 - Token Blacklist Service (TDD Red-Green-Refactor)
  - [ ] 6.1 RED: Write TokenBlacklistServiceTest - Blacklisting Operations
    - Create test file: backend/src/test/java/uk/jimsimrodev/arcanemporiumapi/infra/security/TokenBlacklistServiceTest.java
    - Write test: `blacklistToken_shouldStoreToken_whenValidTokenProvided()`
    - Write test: `blacklistToken_shouldHandleMultipleTokens_whenConcurrentRequests()`
    - Write test: `isBlacklisted_shouldReturnFalse_whenTokenNotBlacklisted()`
    - Write test: `isBlacklisted_shouldReturnFalse_whenNullToken()`
    - Run tests - they should FAIL (Red phase)
    - _Requirements: 6.2, 6.3_

  - [ ] 6.2 GREEN: Implement ITokenBlacklistService and TokenBlacklistServiceImpl
    - Create interface: infra/security/ITokenBlacklistService.java with methods: blacklistToken(), isBlacklisted(), cleanupExpiredTokens()
    - Create implementation: infra/security/impl/TokenBlacklistServiceImpl.java
    - Use ConcurrentHashMap<String, Long> for thread-safe storage
    - Store token as key, expiration time as value
    - Run tests - they should PASS (Green phase)
    - _Requirements: 6.2, 6.3, 6.6, 12.4, 12.5_

  - [ ]* 6.3 REFACTOR: Optimize blacklist lookup performance
    - Add logging for blacklist operations
    - Consider map initialization capacity
    - Run tests - they should still PASS

- [ ] 7. Phase 1 - Token Blacklist Cleanup (TDD Red-Green-Refactor)
  - [ ] 7.1 RED: Write TokenBlacklistServiceTest - Cleanup Operations
    - Write test: `cleanupExpiredTokens_shouldRemoveExpiredTokens_whenCleanupTriggered()`
    - Write test: `cleanupExpiredTokens_shouldReturnZero_whenNoExpiredTokens()`
    - Run tests - they should FAIL (Red phase)
    - _Requirements: 6.5_

  - [ ] 7.2 GREEN: Implement cleanup logic in TokenBlacklistServiceImpl
    - Implement cleanupExpiredTokens() using stream filtering
    - Compare expiration time with current time
    - Remove expired entries from ConcurrentHashMap
    - Return count of removed entries
    - Run tests - they should PASS (Green phase)
    - _Requirements: 6.5_

  - [ ]* 7.3 REFACTOR: Add scheduled cleanup task
    - Create @Scheduled method to run cleanup every hour
    - Add @EnableScheduling to configuration
    - Add logging for cleanup operations
    - Run tests - they should still PASS

- [ ] 8. Checkpoint - Ensure all TokenBlacklistService tests pass
  - Run all TokenBlacklistServiceTest tests and verify 100% pass rate
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Phase 2 - JWT Authentication Filter: Token Extraction (TDD Red-Green-Refactor)
  - [ ] 9.1 RED: Write JwtAuthenticationFilterTest - Token Extraction Suite
    - Create test file: backend/src/test/java/uk/jimsimrodev/arcanemporiumapi/infra/security/JwtAuthenticationFilterTest.java
    - Setup: Create mock WebFilterChain, IJwtService, ITokenBlacklistService
    - Write test: `filter_shouldExtractToken_whenAuthorizationHeaderPresent()`
    - Write test: `filter_shouldReject_whenAuthorizationHeaderMissing()`
    - Write test: `filter_shouldReject_whenBearerPrefixMissing()`
    - Run tests - they should FAIL (Red phase)
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 9.2 GREEN: Implement JwtAuthenticationFilter token extraction
    - Create class: infra/security/JwtAuthenticationFilter.java implementing WebFilter
    - Add constructor with IJwtService, ITokenBlacklistService, List<String> publicPaths
    - Implement filter() method with extractToken() helper
    - Extract "Bearer " prefix from Authorization header
    - Return Mono.error() or set HTTP 401 for missing/invalid headers
    - Run tests - they should PASS (Green phase)
    - _Requirements: 2.1, 2.2, 2.3, 12.2_

  - [ ]* 9.3 REFACTOR: Extract helper methods
    - Create extractToken(ServerWebExchange) helper method
    - Add null-safe header access
    - Run tests - they should still PASS

- [ ] 10. Phase 2 - JWT Authentication Filter: Token Validation (TDD Red-Green-Refactor)
  - [ ] 10.1 RED: Write JwtAuthenticationFilterTest - Token Validation Suite
    - Write test: `filter_shouldPopulateSecurityContext_whenValidToken()`
    - Write test: `filter_shouldReject_whenTokenInvalid()`
    - Write test: `filter_shouldReject_whenTokenBlacklisted()`
    - Write test: `filter_shouldReject_whenTokenExpired()`
    - Create helper: `mockClaims(String email, String role)` for testing
    - Run tests - they should FAIL (Red phase)
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.9, 6.3_

  - [ ] 10.2 GREEN: Implement token validation in filter
    - Call jwtService.validateToken() in reactive chain
    - Call blacklistService.isBlacklisted() after validation
    - Extract email and role from claims
    - Create UsernamePasswordAuthenticationToken with authorities
    - Populate ReactiveSecurityContextHolder with authentication
    - Handle errors by returning HTTP 401
    - Run tests - they should PASS (Green phase)
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.9, 6.3_

  - [ ]* 10.3 REFACTOR: Improve authentication object creation
    - Extract createAuthentication(Claims) helper method
    - Map role to GrantedAuthority
    - Add error logging
    - Run tests - they should still PASS

- [ ] 11. Phase 2 - JWT Authentication Filter: Public Path Handling (TDD Red-Green-Refactor)
  - [ ] 11.1 RED: Write JwtAuthenticationFilterTest - Public Path Suite
    - Write test: `filter_shouldBypassAuthentication_whenPublicPathAccessed()`
    - Test paths: /api/v1/login, /api/v1/register, /api/v1/forgot-password, /api/v1/reset-password, /api/v1/public, /api/v1/artifacts/**
    - Write test: `filter_shouldBypassAuthentication_whenStaticResourceAccessed()`
    - Test paths: /*.js, /*.css, /*.ico, /favicon.ico
    - Write test: `filter_shouldRequireAuthentication_whenProtectedPathAccessed()`
    - Run tests - they should FAIL (Red phase)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ] 11.2 GREEN: Implement public path checking
    - Create isPublicPath(String path) helper method
    - Add publicPaths list initialization with all public endpoints
    - Add static resource pattern matching
    - Skip token validation for public paths
    - Run tests - they should PASS (Green phase)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 11.3 REFACTOR: Optimize path matching
    - Use PathPattern or AntPathMatcher for wildcard matching
    - Extract PUBLIC_PATHS constant
    - Run tests - they should still PASS

- [ ] 12. Checkpoint - Ensure all JwtAuthenticationFilter tests pass
  - Run all JwtAuthenticationFilterTest tests and verify 100% pass rate
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Phase 2 - Update SecurityConfig for JWT
  - [ ] 13.1 Update SecurityConfig to integrate JwtAuthenticationFilter
    - Remove WebSessionServerSecurityContextRepository (session-based auth)
    - Add JwtAuthenticationFilter as @Bean
    - Configure SecurityWebFilterChain to use JWT filter
    - Add filter before authentication filter in chain
    - Maintain existing CORS configuration
    - Maintain existing role-based @PreAuthorize support
    - _Requirements: 7.6, 9.8, 4.1, 4.2, 4.3_

  - [ ]* 13.2 Write SecurityConfigTest - Integration validation
    - Test that SecurityWebFilterChain contains JWT filter
    - Test that CORS configuration is maintained
    - Test that method security is enabled for @PreAuthorize
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 14. Phase 3 - Login Endpoint DTOs (TDD Red-Green-Refactor)
  - [ ] 14.1 Create JWT-related DTOs
    - Create record: domain/auth/dto/LoginResponse.java (accessToken, refreshToken, user)
    - Create record: domain/auth/dto/RefreshTokenRequest.java (refreshToken)
    - Create record: domain/auth/dto/LogoutRequest.java (accessToken)
    - All records should follow Java record syntax
    - _Requirements: 1.5, 12.3, 12.6_

- [ ] 15. Phase 3 - Login Controller: Login Endpoint (TDD Red-Green-Refactor)
  - [ ] 15.1 RED: Write LoginControllerTest - Login Endpoint Suite
    - Create test file: backend/src/test/java/uk/jimsimrodev/arcanemporiumapi/domain/auth/controllers/LoginControllerTest.java
    - Setup: Use @WebFluxTest, mock IUserService, IJwtService
    - Write test: `login_shouldReturnTokens_whenCredentialsValid()`
    - Write test: `login_shouldReturn401_whenCredentialsInvalid()`
    - Write test: `login_shouldReturn401_whenUserNotFound()`
    - Run tests - they should FAIL (Red phase)
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 15.2 GREEN: Update LoginController.login() to return JWT tokens
    - Update login() method signature to return Mono<LoginResponse>
    - Call jwtService.generateAccessToken() after authentication
    - Call jwtService.generateRefreshToken() after authentication
    - Return LoginResponse with both tokens and user info
    - Remove ServerWebExchange and session-based context saving
    - Run tests - they should PASS (Green phase)
    - _Requirements: 1.1, 1.2, 1.5, 7.6_

  - [ ]* 15.3 REFACTOR: Extract token generation to service layer
    - Consider moving token generation logic to IUserService
    - Improve error responses with meaningful messages
    - Run tests - they should still PASS

- [ ] 16. Phase 3 - Login Controller: Refresh Token Endpoint (TDD Red-Green-Refactor)
  - [ ] 16.1 RED: Write LoginControllerTest - Refresh Token Suite
    - Write test: `refreshToken_shouldReturnNewTokens_whenValidRefreshToken()`
    - Write test: `refreshToken_shouldReturn401_whenTokenExpired()`
    - Write test: `refreshToken_shouldReturn401_whenTokenInvalid()`
    - Write test: `refreshToken_shouldReturn401_whenUserNoLongerExists()`
    - Run tests - they should FAIL (Red phase)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 16.2 GREEN: Implement refreshToken() endpoint in LoginController
    - Add @PostMapping("/refresh-token") endpoint
    - Accept RefreshTokenRequest in request body
    - Validate refresh token using jwtService.validateToken()
    - Extract email from claims
    - Verify user exists using userRepository.findByEmail()
    - Generate new access token and refresh token
    - Return LoginResponse with new tokens
    - Run tests - they should PASS (Green phase)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 16.3 REFACTOR: Extract refresh logic to UserService
    - Move refresh token logic to IUserService.refreshToken()
    - Simplify controller to delegate to service
    - Run tests - they should still PASS

- [ ] 17. Phase 3 - Login Controller: Logout Endpoint (TDD Red-Green-Refactor)
  - [ ] 17.1 RED: Write LoginControllerTest - Logout Endpoint Suite
    - Write test: `logout_shouldBlacklistToken_whenValidTokenProvided()`
    - Write test: `logout_shouldReturn401_whenTokenInvalid()`
    - Write test: `logout_shouldWork_whenTokenAlreadyBlacklisted()`
    - Run tests - they should FAIL (Red phase)
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 17.2 GREEN: Implement logout() endpoint in LoginController
    - Add @PostMapping("/logout") endpoint
    - Accept LogoutRequest in request body
    - Extract token from Authorization header
    - Validate token using jwtService.validateToken()
    - Extract expiration time using jwtService.extractExpiration()
    - Call blacklistService.blacklistToken(token, expiration)
    - Return success response
    - Run tests - they should PASS (Green phase)
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 17.3 REFACTOR: Improve logout idempotency
    - Handle already-blacklisted tokens gracefully
    - Add logging for logout events
    - Run tests - they should still PASS

- [ ] 18. Checkpoint - Ensure all LoginController tests pass
  - Run all LoginControllerTest tests and verify 100% pass rate
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Phase 3 - Update UserService for JWT compatibility
  - [ ] 19.1 Update IUserService interface
    - Update login() signature to return Mono<LoginResponse>
    - Add refreshToken(String refreshToken) method
    - Keep existing methods (register, forgotPassword, resetPassword, changePassword)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 19.2 Update UserService implementation
    - Update login() to use IJwtService for token generation
    - Remove ServerWebExchange and SecurityContextRepository from login()
    - Implement refreshToken() method
    - Ensure changePassword() requires valid token (handled by filter)
    - Run existing UserServiceTest and update as needed
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 20. Phase 3 - Integration Testing (TDD Red-Green-Refactor)
  - [ ] 20.1 RED: Write JwtIntegrationTest - Full Authentication Flow
    - Create test file: backend/src/test/java/uk/jimsimrodev/arcanemporiumapi/infra/security/JwtIntegrationTest.java
    - Use @SpringBootTest with RANDOM_PORT
    - Setup test database with R2DBC
    - Write test: `fullAuthenticationFlow_shouldWork_whenValidCredentials()`
    - Test flow: register → login → access protected endpoint → refresh → logout → verify blocked access
    - Write test: `roleBasedAccess_shouldEnforcePermissions_whenTokenProvided()`
    - Test: USER can access /api/v1/user, cannot access /api/v1/admin
    - Test: ADMIN can access both /api/v1/user and /api/v1/admin
    - Run tests - they should FAIL initially (Red phase)
    - _Requirements: All requirements integrated_

  - [ ] 20.2 GREEN: Fix integration test failures
    - Debug and fix any integration issues
    - Ensure all components work together correctly
    - Verify reactive chains don't block
    - Run tests - they should PASS (Green phase)
    - _Requirements: All requirements integrated_

  - [ ]* 20.3 REFACTOR: Add integration test helpers
    - Extract createUser(), loginUser(), getToken() test helpers
    - Create TestDataBuilder for common test data
    - Run tests - they should still PASS

- [ ] 21. Phase 3 - Error Handling and Security (TDD Red-Green-Refactor)
  - [ ] 21.1 RED: Write ErrorHandlingTest - Security Exception Handling
    - Write test: `filter_shouldReturn401_withErrorResponse_whenTokenInvalid()`
    - Write test: `globalExceptionHandler_shouldLogError_whenJwtExceptionThrown()`
    - Write test: `errorResponse_shouldNotExposeTokenValues_whenLogging()`
    - Run tests - they should FAIL (Red phase)
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6_

  - [ ] 21.2 GREEN: Implement error handling
    - Create ErrorResponse record in domain/auth/dto package
    - Update JwtAuthenticationFilter to return consistent error responses
    - Add logging to all failure points (token validation, blacklist check)
    - Ensure logs don't include full token values (only identifiers)
    - Create @RestControllerAdvice for JWT-related exceptions
    - Run tests - they should PASS (Green phase)
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6_

  - [ ]* 21.3 REFACTOR: Improve security logging
    - Add rate-limit detection for repeated failures
    - Add IP address logging for security events
    - Use structured logging format
    - Run tests - they should still PASS

- [ ] 22. Phase 3 - Limited Property-Based Testing (Optional)
  - [ ]* 22.1 Write property test for token round-trip identity
    - **Property 1: Token Round-Trip Identity for Valid Claims**
    - Use jqwik or fast-check for property-based testing
    - Generate arbitrary valid email strings and role enum values
    - Test: generating token → validating token → extracting claims returns same email/role
    - Minimum 100 iterations
    - _Requirements: 1.1, 1.3, 2.8_

  - [ ]* 22.2 Write property test for expiration time ordering
    - **Property 2: Expiration Time Ordering**
    - Generate tokens at various timestamps
    - Test: expiration time always > generation time and equals generation time + configured duration (within tolerance)
    - _Requirements: 1.1, 1.2_

  - [ ]* 22.3 Write property test for blacklist idempotence
    - **Property 3: Blacklist Idempotence**
    - Generate arbitrary tokens and expiration times
    - Test: blacklisting N times produces same result as blacklisting once
    - _Requirements: 6.2_

- [ ] 23. Final Verification and Documentation
  - [ ] 23.1 Run full test suite
    - Execute all unit tests (JwtServiceTest, TokenBlacklistServiceTest, JwtAuthenticationFilterTest)
    - Execute all integration tests (LoginControllerTest, JwtIntegrationTest)
    - Verify test coverage >90% for new code
    - _Requirements: All requirements_

  - [ ] 23.2 Update application.yml with production notes
    - Add comments about changing JWT_SECRET in production
    - Document token expiration configuration
    - Add environment variable examples
    - _Requirements: 5.4, 5.5, 5.6_

  - [ ] 23.3 Create or update README documentation
    - Document JWT authentication flow
    - Provide example curl commands for login, refresh, logout
    - Document Authorization header format
    - Add troubleshooting section
    - _Requirements: All requirements_

- [ ] 24. Final Checkpoint - Complete feature verification
  - Verify all endpoints work correctly (login, refresh, logout, protected endpoints)
  - Test with Postman or similar API client
  - Verify role-based access control works
  - Verify token expiration behavior
  - Verify blacklist functionality
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- **TDD Approach**: Every task follows Red-Green-Refactor cycle - write failing tests FIRST, then implement
- Tasks marked with `*` are optional (testing and refactoring sub-tasks)
- Core implementation tasks (non-`*`) must be completed
- Each phase builds on the previous phase - do not skip phases
- Use StepVerifier for testing reactive Mono/Flux operations
- Use WebTestClient for testing controller endpoints
- Mock external dependencies in unit tests
- Integration tests use real Spring context and test database
- Reactive streams must not block - use proper Mono/Flux operators
- Follow Spring Boot domain architecture standard for package structure
- All DTOs must be Java records
- Service interfaces follow I<Service>Service naming convention
- Service implementations follow <Service>ServiceImpl naming convention
- Property-based tests (tasks 22.1-22.3) are optional but recommended for thoroughness

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "6.1", "14.1"] },
    { "id": 2, "tasks": ["2.3", "3.1", "6.2"] },
    { "id": 3, "tasks": ["3.2", "4.1", "6.3", "7.1"] },
    { "id": 4, "tasks": ["3.3", "4.2", "7.2"] },
    { "id": 5, "tasks": ["4.3", "7.3"] },
    { "id": 6, "tasks": ["9.1", "9.2"] },
    { "id": 7, "tasks": ["9.3", "10.1"] },
    { "id": 8, "tasks": ["10.2", "11.1"] },
    { "id": 9, "tasks": ["10.3", "11.2"] },
    { "id": 10, "tasks": ["11.3", "13.1"] },
    { "id": 11, "tasks": ["13.2", "15.1", "19.1"] },
    { "id": 12, "tasks": ["15.2", "16.1", "19.2"] },
    { "id": 13, "tasks": ["15.3", "16.2", "17.1"] },
    { "id": 14, "tasks": ["16.3", "17.2"] },
    { "id": 15, "tasks": ["17.3", "20.1", "21.1"] },
    { "id": 16, "tasks": ["20.2", "21.2", "22.1"] },
    { "id": 17, "tasks": ["20.3", "21.3", "22.2"] },
    { "id": 18, "tasks": ["22.3", "23.1"] },
    { "id": 19, "tasks": ["23.2", "23.3"] }
  ]
}
```
