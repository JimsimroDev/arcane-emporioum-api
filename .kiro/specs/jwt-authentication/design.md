# JWT Authentication Design Document

## Overview

This document specifies the technical design for implementing JWT (JSON Web Token) authentication in the Arcane Emporium API using a **Test-Driven Development (TDD)** approach. The implementation replaces session-based authentication with stateless JWT authentication while maintaining full compatibility with existing endpoints and role-based access control.

### Design Philosophy

This design follows strict TDD principles:

1. **Red Phase**: Write failing tests that define expected behavior
2. **Green Phase**: Implement minimal code to make tests pass
3. **Refactor Phase**: Improve code quality while keeping tests green

All components are designed test-first, with comprehensive test suites specified before implementation details.

### Key Design Decisions

- **Stateless Authentication**: JWT tokens eliminate server-side session storage
- **Dual Token Strategy**: Short-lived access tokens (15 min) with long-lived refresh tokens (7 days)
- **Reactive Architecture**: Full WebFlux integration using Mono/Flux for non-blocking operations
- **Token Blacklist**: In-memory cache for invalidated tokens before expiration
- **Minimal Dependencies**: Use JJWT library (0.12.5+) for JWT operations
- **Package by Domain**: Follow existing architecture standard with infra layer for cross-cutting concerns

### Technology Stack

- **JWT Library**: io.jsonwebtoken:jjwt (0.12.5+)
- **Testing**: JUnit 5, Mockito, StepVerifier, WebTestClient
- **Security**: Spring Security WebFlux with reactive authentication
- **Signature Algorithm**: HS512 (HMAC with SHA-512)

---

## Architecture

### High-Level Architecture

```mermaid
graph TB
    Client[Client Application]

    subgraph "API Gateway Layer"
        JWTFilter[JwtAuthenticationFilter<br/>WebFilter]
    end

    subgraph "Security Services"
        JWTService[IJwtService<br/>Token Operations]
        Blacklist[TokenBlacklistService<br/>Invalidation Cache]
    end

    subgraph "Authentication Flow"
        Login[LoginController<br/>/login]
        Refresh[LoginController<br/>/refresh-token]
        Logout[LoginController<br/>/logout]
    end

    subgraph "Protected Resources"
        UserEndpoint[User Endpoints]
        AdminEndpoint[Admin Endpoints]
    end

    subgraph "Data Layer"
        UserRepo[IUserRepository<br/>R2DBC]
        UserService[UserService]
    end

    Client -->|1. POST /login| Login
    Login -->|2. Authenticate| UserService
    UserService -->|3. Query| UserRepo
    UserService -->|4. Generate Tokens| JWTService
    JWTService -->|5. Return Tokens| Client

    Client -->|6. Request + Token| JWTFilter
    JWTFilter -->|7. Validate| JWTService
    JWTFilter -->|8. Check Blacklist| Blacklist
    JWTFilter -->|9. Populate Context| UserEndpoint

    Client -->|10. Refresh| Refresh
    Refresh -->|11. Generate New| JWTService

    Client -->|12. Logout| Logout
    Logout -->|13. Blacklist Token| Blacklist
```

### Component Interaction Flow

#### Authentication Flow (Login)

```
Client → LoginController.login()
   ↓
UserService.login()
   ↓
ReactiveAuthenticationManager.authenticate()
   ↓
JwtService.generateAccessToken() + generateRefreshToken()
   ↓
Return LoginResponse(accessToken, refreshToken, userInfo)
```

#### Request Authorization Flow

```
Client Request → JwtAuthenticationFilter
   ↓
Extract Bearer Token from Authorization header
   ↓
JwtService.validateToken()
   ↓
TokenBlacklistService.isBlacklisted()
   ↓
ReactiveSecurityContextHolder.withAuthentication()
   ↓
Controller Method (with @PreAuthorize)
```

#### Token Refresh Flow

```
Client → LoginController.refreshToken()
   ↓
JwtService.validateToken(refreshToken)
   ↓
UserRepository.findByEmail()
   ↓
JwtService.generateAccessToken() + generateRefreshToken()
   ↓
Return new token pair
```

#### Logout Flow

```
Client → LoginController.logout()
   ↓
TokenBlacklistService.blacklist(token, expirationTime)
   ↓
Store in ConcurrentHashMap
   ↓
Return success response
```

---

## Components and Interfaces

### 1. JwtService (Core Token Operations)

#### Interface Definition

```java
package uk.jimsimrodev.arcanemporiumapi.infra.security;

import io.jsonwebtoken.Claims;
import reactor.core.publisher.Mono;

public interface IJwtService {

    /**
     * Generate access token with 15-minute expiration
     * @param email User email (subject)
     * @param role User role
     * @return Mono containing signed JWT string
     */
    Mono<String> generateAccessToken(String email, String role);

    /**
     * Generate refresh token with 7-day expiration
     * @param email User email (subject)
     * @return Mono containing signed JWT string
     */
    Mono<String> generateRefreshToken(String email);

    /**
     * Validate token signature and expiration
     * @param token JWT string
     * @return Mono<Claims> if valid, error signal if invalid
     */
    Mono<Claims> validateToken(String token);

    /**
     * Extract email from validated token
     * @param claims Parsed token claims
     * @return User email
     */
    String extractEmail(Claims claims);

    /**
     * Extract role from validated token
     * @param claims Parsed token claims
     * @return User role string
     */
    String extractRole(Claims claims);

    /**
     * Extract expiration time from token
     * @param claims Parsed token claims
     * @return Expiration time in milliseconds since epoch
     */
    long extractExpiration(Claims claims);
}
```

#### TDD Test Specification: JwtServiceTest

**Test Suite 1: Token Generation (Write FIRST)**

```java
@Test
void generateAccessToken_shouldReturnValidJwt_whenValidInputProvided() {
    // RED: This test will fail - IJwtService doesn't exist yet
    // Expectation: Returns JWT string in format "header.payload.signature"

    StepVerifier.create(jwtService.generateAccessToken("user@example.com", "USER"))
        .assertNext(token -> {
            assertNotNull(token);
            assertEquals(3, token.split("\\.").length); // JWT has 3 parts
            assertTrue(token.length() > 50); // Reasonable JWT length
        })
        .verifyComplete();
}

@Test
void generateAccessToken_shouldIncludeEmailInSubject_whenTokenGenerated() {
    // RED: Validates email is in token payload

    StepVerifier.create(jwtService.generateAccessToken("test@example.com", "ADMIN"))
        .flatMap(token -> jwtService.validateToken(token))
        .assertNext(claims -> {
            assertEquals("test@example.com", claims.getSubject());
        })
        .verifyComplete();
}

@Test
void generateAccessToken_shouldIncludeRoleInClaims_whenTokenGenerated() {
    // RED: Validates role is stored in custom claim

    StepVerifier.create(jwtService.generateAccessToken("admin@example.com", "ADMIN"))
        .flatMap(token -> jwtService.validateToken(token))
        .assertNext(claims -> {
            assertEquals("ADMIN", claims.get("role", String.class));
        })
        .verifyComplete();
}

@Test
void generateAccessToken_shouldExpireIn15Minutes_whenTokenGenerated() {
    // RED: Validates expiration time

    long now = System.currentTimeMillis();
    long expectedExpiration = now + (15 * 60 * 1000); // 15 minutes

    StepVerifier.create(jwtService.generateAccessToken("user@example.com", "USER"))
        .flatMap(token -> jwtService.validateToken(token))
        .assertNext(claims -> {
            long expiration = claims.getExpiration().getTime();
            assertTrue(Math.abs(expiration - expectedExpiration) < 5000); // Within 5 seconds tolerance
        })
        .verifyComplete();
}

@Test
void generateRefreshToken_shouldExpireIn7Days_whenTokenGenerated() {
    // RED: Validates refresh token expiration

    long now = System.currentTimeMillis();
    long expectedExpiration = now + (7 * 24 * 60 * 60 * 1000L); // 7 days

    StepVerifier.create(jwtService.generateRefreshToken("user@example.com"))
        .flatMap(token -> jwtService.validateToken(token))
        .assertNext(claims -> {
            long expiration = claims.getExpiration().getTime();
            assertTrue(Math.abs(expiration - expectedExpiration) < 5000);
        })
        .verifyComplete();
}

@Test
void generateRefreshToken_shouldNotIncludeRole_whenTokenGenerated() {
    // RED: Refresh tokens should not contain role information

    StepVerifier.create(jwtService.generateRefreshToken("user@example.com"))
        .flatMap(token -> jwtService.validateToken(token))
        .assertNext(claims -> {
            assertNull(claims.get("role"));
        })
        .verifyComplete();
}
```

**Test Suite 2: Token Validation (Write FIRST)**

```java
@Test
void validateToken_shouldReturnClaims_whenValidTokenProvided() {
    // RED: Validates successful token parsing

    Mono<String> tokenMono = jwtService.generateAccessToken("user@example.com", "USER");

    StepVerifier.create(
        tokenMono.flatMap(token -> jwtService.validateToken(token))
    )
    .assertNext(claims -> {
        assertNotNull(claims);
        assertEquals("user@example.com", claims.getSubject());
    })
    .verifyComplete();
}

@Test
void validateToken_shouldRejectToken_whenSignatureInvalid() {
    // RED: Invalid signature should throw SecurityException

    String tamperedToken = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIn0.invalid_signature";

    StepVerifier.create(jwtService.validateToken(tamperedToken))
        .expectErrorMatches(throwable ->
            throwable instanceof SecurityException &&
            throwable.getMessage().contains("Invalid JWT signature")
        )
        .verify();
}

@Test
void validateToken_shouldRejectToken_whenExpired() {
    // RED: Expired token should throw ExpiredJwtException

    // This requires a token generator that can create expired tokens for testing
    String expiredToken = createExpiredToken(); // Helper method

    StepVerifier.create(jwtService.validateToken(expiredToken))
        .expectErrorMatches(throwable ->
            throwable instanceof SecurityException &&
            throwable.getMessage().contains("JWT token has expired")
        )
        .verify();
}

@Test
void validateToken_shouldRejectToken_whenMalformed() {
    // RED: Malformed token should throw MalformedJwtException

    String malformedToken = "not.a.valid.jwt.token";

    StepVerifier.create(jwtService.validateToken(malformedToken))
        .expectErrorMatches(throwable ->
            throwable instanceof SecurityException &&
            throwable.getMessage().contains("Invalid JWT token")
        )
        .verify();
}

@Test
void validateToken_shouldRejectToken_whenNull() {
    // RED: Null token should throw IllegalArgumentException

    StepVerifier.create(jwtService.validateToken(null))
        .expectError(IllegalArgumentException.class)
        .verify();
}

@Test
void validateToken_shouldRejectToken_whenEmpty() {
    // RED: Empty token should throw IllegalArgumentException

    StepVerifier.create(jwtService.validateToken(""))
        .expectError(IllegalArgumentException.class)
        .verify();
}
```

**Test Suite 3: Claims Extraction (Write FIRST)**

```java
@Test
void extractEmail_shouldReturnEmail_whenValidClaimsProvided() {
    // RED: Extract subject from claims

    StepVerifier.create(jwtService.generateAccessToken("test@example.com", "USER"))
        .flatMap(token -> jwtService.validateToken(token))
        .assertNext(claims -> {
            String email = jwtService.extractEmail(claims);
            assertEquals("test@example.com", email);
        })
        .verifyComplete();
}

@Test
void extractRole_shouldReturnRole_whenAccessTokenClaims() {
    // RED: Extract role from access token claims

    StepVerifier.create(jwtService.generateAccessToken("admin@example.com", "ADMIN"))
        .flatMap(token -> jwtService.validateToken(token))
        .assertNext(claims -> {
            String role = jwtService.extractRole(claims);
            assertEquals("ADMIN", role);
        })
        .verifyComplete();
}

@Test
void extractRole_shouldReturnNull_whenRefreshTokenClaims() {
    // RED: Refresh tokens don't have role claim

    StepVerifier.create(jwtService.generateRefreshToken("user@example.com"))
        .flatMap(token -> jwtService.validateToken(token))
        .assertNext(claims -> {
            String role = jwtService.extractRole(claims);
            assertNull(role);
        })
        .verifyComplete();
}

@Test
void extractExpiration_shouldReturnMilliseconds_whenValidClaims() {
    // RED: Extract expiration timestamp

    long beforeGeneration = System.currentTimeMillis();

    StepVerifier.create(jwtService.generateAccessToken("user@example.com", "USER"))
        .flatMap(token -> jwtService.validateToken(token))
        .assertNext(claims -> {
            long expiration = jwtService.extractExpiration(claims);
            assertTrue(expiration > beforeGeneration);
            assertTrue(expiration < beforeGeneration + (20 * 60 * 1000)); // Within 20 minutes
        })
        .verifyComplete();
}
```

**TDD Implementation Order for JwtService:**

1. **RED**: Write all test suites above (they will fail)
2. **GREEN**: Implement JwtServiceImpl:
   - Configure secret key from application.yml
   - Implement generateAccessToken() with 15-minute expiration
   - Implement generateRefreshToken() with 7-day expiration
   - Implement validateToken() with JJWT parser
   - Implement extraction methods
3. **REFACTOR**: Extract constants, improve error messages, optimize Mono chains

---

### 2. TokenBlacklistService (Token Invalidation)

#### Interface Definition

```java
package uk.jimsimrodev.arcanemporiumapi.infra.security;

import reactor.core.publisher.Mono;

public interface ITokenBlacklistService {

    /**
     * Add token to blacklist with expiration time
     * @param token JWT string
     * @param expirationTimeMillis Token expiration time
     * @return Mono<Void> completing when blacklisted
     */
    Mono<Void> blacklistToken(String token, long expirationTimeMillis);

    /**
     * Check if token is blacklisted
     * @param token JWT string
     * @return Mono<Boolean> true if blacklisted
     */
    Mono<Boolean> isBlacklisted(String token);

    /**
     * Remove expired tokens from blacklist
     * @return Mono<Integer> count of removed entries
     */
    Mono<Integer> cleanupExpiredTokens();
}
```

#### TDD Test Specification: TokenBlacklistServiceTest

**Test Suite 1: Blacklisting Operations (Write FIRST)**

```java
@Test
void blacklistToken_shouldStoreToken_whenValidTokenProvided() {
    // RED: Token should be retrievable after blacklisting

    String token = "sample.jwt.token";
    long expiration = System.currentTimeMillis() + 60000; // 1 minute

    StepVerifier.create(
        blacklistService.blacklistToken(token, expiration)
            .then(blacklistService.isBlacklisted(token))
    )
    .expectNext(true)
    .verifyComplete();
}

@Test
void blacklistToken_shouldHandleMultipleTokens_whenConcurrentRequests() {
    // RED: Thread-safe storage for concurrent blacklisting

    String token1 = "token.one";
    String token2 = "token.two";
    long expiration = System.currentTimeMillis() + 60000;

    Mono<Boolean> check1 = blacklistService.blacklistToken(token1, expiration)
        .then(blacklistService.isBlacklisted(token1));
    Mono<Boolean> check2 = blacklistService.blacklistToken(token2, expiration)
        .then(blacklistService.isBlacklisted(token2));

    StepVerifier.create(Mono.zip(check1, check2))
        .assertNext(tuple -> {
            assertTrue(tuple.getT1());
            assertTrue(tuple.getT2());
        })
        .verifyComplete();
}

@Test
void isBlacklisted_shouldReturnFalse_whenTokenNotBlacklisted() {
    // RED: Non-blacklisted tokens return false

    StepVerifier.create(blacklistService.isBlacklisted("not.blacklisted.token"))
        .expectNext(false)
        .verifyComplete();
}

@Test
void isBlacklisted_shouldReturnFalse_whenNullToken() {
    // RED: Handle null gracefully

    StepVerifier.create(blacklistService.isBlacklisted(null))
        .expectNext(false)
        .verifyComplete();
}
```

**Test Suite 2: Cleanup Operations (Write FIRST)**

```java
@Test
void cleanupExpiredTokens_shouldRemoveExpiredTokens_whenCleanupTriggered() {
    // RED: Expired tokens should be removed from storage

    String expiredToken = "expired.token";
    String validToken = "valid.token";
    long pastExpiration = System.currentTimeMillis() - 1000; // Already expired
    long futureExpiration = System.currentTimeMillis() + 60000; // Valid

    StepVerifier.create(
        blacklistService.blacklistToken(expiredToken, pastExpiration)
            .then(blacklistService.blacklistToken(validToken, futureExpiration))
            .then(blacklistService.cleanupExpiredTokens())
    )
    .assertNext(count -> assertEquals(1, count)) // One expired removed
    .then(blacklistService.isBlacklisted(expiredToken))
    .expectNext(false) // Expired token removed
    .then(blacklistService.isBlacklisted(validToken))
    .expectNext(true) // Valid token still present
    .verifyComplete();
}

@Test
void cleanupExpiredTokens_shouldReturnZero_whenNoExpiredTokens() {
    // RED: No cleanup needed when all tokens valid

    StepVerifier.create(blacklistService.cleanupExpiredTokens())
        .expectNext(0)
        .verifyComplete();
}
```

**TDD Implementation Order for TokenBlacklistService:**

1. **RED**: Write all test suites above
2. **GREEN**: Implement TokenBlacklistServiceImpl:
   - Use ConcurrentHashMap<String, Long> for thread-safe storage
   - Store token as key, expiration time as value
   - Implement cleanup with stream filtering
3. **REFACTOR**: Consider scheduled cleanup task, optimize lookup performance

---

### 3. JwtAuthenticationFilter (Request Interception)

#### Class Definition

```java
package uk.jimsimrodev.arcanemporiumapi.infra.security;

import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

public class JwtAuthenticationFilter implements WebFilter {

    private final IJwtService jwtService;
    private final ITokenBlacklistService blacklistService;
    private final List<String> publicPaths;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        // Implementation will be driven by tests
        return null;
    }

    private boolean isPublicPath(String path) {
        // Check if path is in public list
        return false;
    }

    private Mono<String> extractToken(ServerWebExchange exchange) {
        // Extract Bearer token from Authorization header
        return null;
    }
}
```

#### TDD Test Specification: JwtAuthenticationFilterTest

**Test Suite 1: Token Extraction (Write FIRST)**

```java
@Test
void filter_shouldExtractToken_whenAuthorizationHeaderPresent() {
    // RED: Extract token from "Bearer <token>" format

    ServerWebExchange exchange = MockServerWebExchange.from(
        MockServerHttpRequest.get("/api/v1/user")
            .header("Authorization", "Bearer valid.jwt.token")
    );

    String token = "valid.jwt.token";
    when(jwtService.validateToken(token))
        .thenReturn(Mono.just(mockClaims("user@example.com", "USER")));
    when(blacklistService.isBlacklisted(token))
        .thenReturn(Mono.just(false));

    StepVerifier.create(filter.filter(exchange, chain))
        .verifyComplete();

    verify(jwtService).validateToken(token);
}

@Test
void filter_shouldReject_whenAuthorizationHeaderMissing() {
    // RED: Return 401 when no Authorization header

    ServerWebExchange exchange = MockServerWebExchange.from(
        MockServerHttpRequest.get("/api/v1/user")
    );

    StepVerifier.create(filter.filter(exchange, chain))
        .verifyComplete();

    assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
}

@Test
void filter_shouldReject_whenBearerPrefixMissing() {
    // RED: Reject tokens without "Bearer " prefix

    ServerWebExchange exchange = MockServerWebExchange.from(
        MockServerHttpRequest.get("/api/v1/user")
            .header("Authorization", "invalid.format")
    );

    StepVerifier.create(filter.filter(exchange, chain))
        .verifyComplete();

    assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
}
```

**Test Suite 2: Token Validation (Write FIRST)**

```java
@Test
void filter_shouldPopulateSecurityContext_whenValidToken() {
    // RED: Valid token should set authenticated user in context

    String token = "valid.jwt.token";
    ServerWebExchange exchange = MockServerWebExchange.from(
        MockServerHttpRequest.get("/api/v1/user")
            .header("Authorization", "Bearer " + token)
    );

    Claims claims = mockClaims("user@example.com", "USER");
    when(jwtService.validateToken(token)).thenReturn(Mono.just(claims));
    when(jwtService.extractEmail(claims)).thenReturn("user@example.com");
    when(jwtService.extractRole(claims)).thenReturn("USER");
    when(blacklistService.isBlacklisted(token)).thenReturn(Mono.just(false));

    StepVerifier.create(filter.filter(exchange, chain))
        .verifyComplete();

    // Verify security context was populated
    verify(jwtService).validateToken(token);
}

@Test
void filter_shouldReject_whenTokenInvalid() {
    // RED: Invalid token should return 401

    String token = "invalid.token";
    ServerWebExchange exchange = MockServerWebExchange.from(
        MockServerHttpRequest.get("/api/v1/user")
            .header("Authorization", "Bearer " + token)
    );

    when(jwtService.validateToken(token))
        .thenReturn(Mono.error(new SecurityException("Invalid token")));

    StepVerifier.create(filter.filter(exchange, chain))
        .verifyComplete();

    assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
}

@Test
void filter_shouldReject_whenTokenBlacklisted() {
    // RED: Blacklisted token should return 401

    String token = "blacklisted.token";
    ServerWebExchange exchange = MockServerWebExchange.from(
        MockServerHttpRequest.get("/api/v1/user")
            .header("Authorization", "Bearer " + token)
    );

    Claims claims = mockClaims("user@example.com", "USER");
    when(jwtService.validateToken(token)).thenReturn(Mono.just(claims));
    when(blacklistService.isBlacklisted(token)).thenReturn(Mono.just(true));

    StepVerifier.create(filter.filter(exchange, chain))
        .verifyComplete();

    assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
}

@Test
void filter_shouldReject_whenTokenExpired() {
    // RED: Expired token should return 401

    String token = "expired.token";
    ServerWebExchange exchange = MockServerWebExchange.from(
        MockServerHttpRequest.get("/api/v1/user")
            .header("Authorization", "Bearer " + token)
    );

    when(jwtService.validateToken(token))
        .thenReturn(Mono.error(new SecurityException("JWT token has expired")));

    StepVerifier.create(filter.filter(exchange, chain))
        .verifyComplete();

    assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
}
```

**Test Suite 3: Public Path Handling (Write FIRST)**

```java
@Test
void filter_shouldBypassAuthentication_whenPublicPathAccessed() {
    // RED: Public paths should skip token validation

    List<String> publicPaths = List.of(
        "/api/v1/login",
        "/api/v1/register",
        "/api/v1/forgot-password",
        "/api/v1/reset-password",
        "/api/v1/public",
        "/api/v1/artifacts"
    );

    for (String path : publicPaths) {
        ServerWebExchange exchange = MockServerWebExchange.from(
            MockServerHttpRequest.get(path)
        );

        StepVerifier.create(filter.filter(exchange, chain))
            .verifyComplete();

        verifyNoInteractions(jwtService);
    }
}

@Test
void filter_shouldBypassAuthentication_whenStaticResourceAccessed() {
    // RED: Static resources (js, css, ico) should skip validation

    List<String> staticPaths = List.of(
        "/app.js",
        "/styles.css",
        "/favicon.ico"
    );

    for (String path : staticPaths) {
        ServerWebExchange exchange = MockServerWebExchange.from(
            MockServerHttpRequest.get(path)
        );

        StepVerifier.create(filter.filter(exchange, chain))
            .verifyComplete();

        verifyNoInteractions(jwtService);
    }
}

@Test
void filter_shouldRequireAuthentication_whenProtectedPathAccessed() {
    // RED: Non-public paths require token

    ServerWebExchange exchange = MockServerWebExchange.from(
        MockServerHttpRequest.get("/api/v1/admin")
    );

    StepVerifier.create(filter.filter(exchange, chain))
        .verifyComplete();

    assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
}
```

**TDD Implementation Order for JwtAuthenticationFilter:**

1. **RED**: Write all test suites above
2. **GREEN**: Implement JwtAuthenticationFilter:
   - Implement public path checking
   - Extract token from Authorization header
   - Validate token using JwtService
   - Check blacklist
   - Populate ReactiveSecurityContextHolder
3. **REFACTOR**: Extract methods, improve error handling

---

### 4. LoginController Updates (JWT Token Response)

#### Updated DTOs

```java
package uk.jimsimrodev.arcanemporiumapi.domain.auth.dto;

public record LoginResponse(
    String accessToken,
    String refreshToken,
    UserResponse user
) {}

public record RefreshTokenRequest(
    String refreshToken
) {}

public record LogoutRequest(
    String accessToken
) {}
```

#### TDD Test Specification: LoginControllerTest

**Test Suite 1: Login Endpoint (Write FIRST)**

```java
@Test
void login_shouldReturnTokens_whenCredentialsValid() {
    // RED: Successful login returns access + refresh tokens

    UserRequest request = new UserRequest("user@example.com", "password123");
    UserEntity user = new UserEntity(1L, "user@example.com", "encoded", Erole.USER);

    when(authenticationManager.authenticate(any()))
        .thenReturn(Mono.just(mockAuthentication("user@example.com")));
    when(userRepository.findByEmail("user@example.com"))
        .thenReturn(Mono.just(user));
    when(jwtService.generateAccessToken("user@example.com", "USER"))
        .thenReturn(Mono.just("access.token.jwt"));
    when(jwtService.generateRefreshToken("user@example.com"))
        .thenReturn(Mono.just("refresh.token.jwt"));

    webTestClient.post()
        .uri("/api/v1/login")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .exchange()
        .expectStatus().isOk()
        .expectBody(LoginResponse.class)
        .value(response -> {
            assertNotNull(response.accessToken());
            assertNotNull(response.refreshToken());
            assertEquals("user@example.com", response.user().email());
        });
}

@Test
void login_shouldReturn401_whenCredentialsInvalid() {
    // RED: Invalid credentials return 401

    UserRequest request = new UserRequest("user@example.com", "wrongpassword");

    when(authenticationManager.authenticate(any()))
        .thenReturn(Mono.error(new BadCredentialsException("Invalid credentials")));

    webTestClient.post()
        .uri("/api/v1/login")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .exchange()
        .expectStatus().isUnauthorized();
}

@Test
void login_shouldReturn401_whenUserNotFound() {
    // RED: Non-existent user returns 401

    UserRequest request = new UserRequest("notfound@example.com", "password123");

    when(authenticationManager.authenticate(any()))
        .thenReturn(Mono.error(new UsernameNotFoundException("User not found")));

    webTestClient.post()
        .uri("/api/v1/login")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .exchange()
        .expectStatus().isUnauthorized();
}
```

**Test Suite 2: Token Refresh Endpoint (Write FIRST)**

```java
@Test
void refreshToken_shouldReturnNewTokens_whenValidRefreshToken() {
    // RED: Valid refresh token returns new token pair

    String refreshToken = "valid.refresh.token";
    RefreshTokenRequest request = new RefreshTokenRequest(refreshToken);
    Claims claims = mockClaims("user@example.com", null);

    when(jwtService.validateToken(refreshToken))
        .thenReturn(Mono.just(claims));
    when(jwtService.extractEmail(claims))
        .thenReturn("user@example.com");
    when(userRepository.findByEmail("user@example.com"))
        .thenReturn(Mono.just(new UserEntity(1L, "user@example.com", "pass", Erole.USER)));
    when(jwtService.generateAccessToken("user@example.com", "USER"))
        .thenReturn(Mono.just("new.access.token"));
    when(jwtService.generateRefreshToken("user@example.com"))
        .thenReturn(Mono.just("new.refresh.token"));

    webTestClient.post()
        .uri("/api/v1/refresh-token")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .exchange()
        .expectStatus().isOk()
        .expectBody(LoginResponse.class)
        .value(response -> {
            assertNotEquals(refreshToken, response.refreshToken());
            assertNotNull(response.accessToken());
        });
}

@Test
void refreshToken_shouldReturn401_whenTokenExpired() {
    // RED: Expired refresh token returns 401

    String expiredToken = "expired.refresh.token";
    RefreshTokenRequest request = new RefreshTokenRequest(expiredToken);

    when(jwtService.validateToken(expiredToken))
        .thenReturn(Mono.error(new SecurityException("JWT token has expired")));

    webTestClient.post()
        .uri("/api/v1/refresh-token")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .exchange()
        .expectStatus().isUnauthorized();
}

@Test
void refreshToken_shouldReturn401_whenTokenInvalid() {
    // RED: Invalid refresh token returns 401

    String invalidToken = "invalid.token";
    RefreshTokenRequest request = new RefreshTokenRequest(invalidToken);

    when(jwtService.validateToken(invalidToken))
        .thenReturn(Mono.error(new SecurityException("Invalid JWT token")));

    webTestClient.post()
        .uri("/api/v1/refresh-token")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .exchange()
        .expectStatus().isUnauthorized();
}

@Test
void refreshToken_shouldReturn401_whenUserNoLongerExists() {
    // RED: User deleted after token issued

    String validToken = "valid.refresh.token";
    RefreshTokenRequest request = new RefreshTokenRequest(validToken);
    Claims claims = mockClaims("deleted@example.com", null);

    when(jwtService.validateToken(validToken))
        .thenReturn(Mono.just(claims));
    when(jwtService.extractEmail(claims))
        .thenReturn("deleted@example.com");
    when(userRepository.findByEmail("deleted@example.com"))
        .thenReturn(Mono.empty());

    webTestClient.post()
        .uri("/api/v1/refresh-token")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .exchange()
        .expectStatus().isUnauthorized();
}
```

**Test Suite 3: Logout Endpoint (Write FIRST)**

```java
@Test
void logout_shouldBlacklistToken_whenValidTokenProvided() {
    // RED: Successful logout blacklists the token

    String accessToken = "valid.access.token";
    LogoutRequest request = new LogoutRequest(accessToken);
    Claims claims = mockClaims("user@example.com", "USER");
    long expiration = System.currentTimeMillis() + 60000;

    when(jwtService.validateToken(accessToken))
        .thenReturn(Mono.just(claims));
    when(jwtService.extractExpiration(claims))
        .thenReturn(expiration);
    when(blacklistService.blacklistToken(accessToken, expiration))
        .thenReturn(Mono.empty());

    webTestClient.post()
        .uri("/api/v1/logout")
        .header("Authorization", "Bearer " + accessToken)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .exchange()
        .expectStatus().isOk();

    verify(blacklistService).blacklistToken(accessToken, expiration);
}

@Test
void logout_shouldReturn401_whenTokenInvalid() {
    // RED: Invalid token cannot be logged out

    String invalidToken = "invalid.token";
    LogoutRequest request = new LogoutRequest(invalidToken);

    when(jwtService.validateToken(invalidToken))
        .thenReturn(Mono.error(new SecurityException("Invalid token")));

    webTestClient.post()
        .uri("/api/v1/logout")
        .header("Authorization", "Bearer " + invalidToken)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .exchange()
        .expectStatus().isUnauthorized();
}

@Test
void logout_shouldWork_whenTokenAlreadyBlacklisted() {
    // RED: Idempotent logout - already blacklisted is ok

    String token = "already.blacklisted.token";
    LogoutRequest request = new LogoutRequest(token);
    Claims claims = mockClaims("user@example.com", "USER");
    long expiration = System.currentTimeMillis() + 60000;

    when(jwtService.validateToken(token))
        .thenReturn(Mono.just(claims));
    when(jwtService.extractExpiration(claims))
        .thenReturn(expiration);
    when(blacklistService.blacklistToken(token, expiration))
        .thenReturn(Mono.empty());

    webTestClient.post()
        .uri("/api/v1/logout")
        .header("Authorization", "Bearer " + token)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .exchange()
        .expectStatus().isOk();
}
```

**TDD Implementation Order for LoginController:**

1. **RED**: Write all test suites above
2. **GREEN**: Update LoginController:
   - Modify login() to return LoginResponse with tokens
   - Add refreshToken() endpoint
   - Add logout() endpoint
3. **REFACTOR**: Extract token generation logic, improve error responses

---

## Correctness Properties

### PBT Applicability Assessment

This JWT authentication implementation does **NOT primarily use property-based testing (PBT)**. Here's why:

#### Why PBT is Limited Here

1. **External Dependencies**: JWT authentication heavily relies on external systems (database, authentication manager, security context) that cannot be purely tested with property-based approaches.

2. **Side-Effect Heavy Operations**: Most operations (login, logout, token blacklisting) involve side effects like database writes, session management, and state mutations.

3. **Cryptographic Operations**: Token signing and validation use cryptographic libraries (JJWT) that are already thoroughly tested. Testing "for any secret key, signing works" doesn't add value beyond what the library provides.

4. **Integration-Focused**: The feature's correctness depends on proper integration between Spring Security, filters, controllers, and services rather than algorithmic properties.

5. **Configuration-Driven**: Much of the behavior (expiration times, public paths, CORS settings) is configuration-based, not logic-driven.

#### Where PBT Could Apply (Limited Scope)

While full PBT is not appropriate, there are a few specific properties that could be tested:

### Property 1: Token Round-Trip Identity for Valid Claims

_For any_ valid email string and role enum value, generating a token and then validating it should recover the same email and role.

**Validates: Requirements 1.1, 1.3, 2.8**

### Property 2: Expiration Time Ordering

_For any_ token generated at time T1, the token's expiration time should always be greater than T1 and equal to T1 plus the configured expiration duration (within clock skew tolerance).

**Validates: Requirements 1.1, 1.2**

### Property 3: Blacklist Idempotence

_For any_ token and expiration time, blacklisting the token multiple times should produce the same result as blacklisting it once.

**Validates: Requirements 6.2**

### Testing Strategy Emphasis

Given the PBT limitations, the testing strategy prioritizes:

1. **Example-Based Unit Tests** (75%): Testing specific scenarios with concrete examples
2. **Integration Tests** (20%): Testing component interactions with real Spring context
3. **End-to-End Tests** (5%): Complete user authentication flows
4. **Limited PBT** (<1%): Only for the three properties above using small input generators

**Property Test Configuration**:

- Use **fast-check** or **jqwik** for Java property-based testing
- Minimum 100 iterations per property test
- Focus on the three identified properties only
- All other testing uses example-based approach

### Why Example-Based Testing is Primary

JWT authentication testing is better served by:

- **Concrete examples**: "When user logs in with valid credentials, expect tokens"
- **Error scenarios**: "When token is expired, expect 401"
- **Integration verification**: "When filter validates token, security context is populated"
- **Mock-based isolation**: Testing each component with mocked dependencies

These concrete scenarios provide better coverage and are more maintainable than trying to force PBT onto integration-heavy, side-effect-driven code.

---

## Data Models

### JWT Configuration Properties

```java
package uk.jimsimrodev.arcanemporiumapi.infra.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    private String secret;
    private long accessTokenExpirationMs = 900000; // 15 minutes
    private long refreshTokenExpirationMs = 604800000; // 7 days

    // Getters and setters
}
```

### Updated application.yml

```yaml
jwt:
  secret: ${JWT_SECRET:your-256-bit-secret-key-change-in-production}
  access-token-expiration-ms: 900000 # 15 minutes
  refresh-token-expiration-ms: 604800000 # 7 days
```

### Token Payload Structure

**Access Token Payload:**

```json
{
  "sub": "user@example.com",
  "role": "USER",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Refresh Token Payload:**

```json
{
  "sub": "user@example.com",
  "iat": 1234567890,
  "exp": 1235172690
}
```

---

## Error Handling

### Custom Exception Classes

```java
package uk.jimsimrodev.arcanemporiumapi.infra.security;

public class JwtAuthenticationException extends RuntimeException {
    public JwtAuthenticationException(String message) {
        super(message);
    }

    public JwtAuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

### Error Response DTOs

```java
package uk.jimsimrodev.arcanemporiumapi.domain.auth.dto;

import java.time.LocalDateTime;

public record ErrorResponse(
    String message,
    int status,
    LocalDateTime timestamp
) {
    public ErrorResponse(String message, int status) {
        this(message, status, LocalDateTime.now());
    }
}
```

### TDD Test Specification: Error Handling

```java
@Test
void filter_shouldReturn401_withErrorResponse_whenTokenInvalid() {
    // RED: Error responses should be consistent

    ServerWebExchange exchange = MockServerWebExchange.from(
        MockServerHttpRequest.get("/api/v1/user")
            .header("Authorization", "Bearer invalid.token")
    );

    when(jwtService.validateToken("invalid.token"))
        .thenReturn(Mono.error(new SecurityException("Invalid JWT signature")));

    StepVerifier.create(filter.filter(exchange, chain))
        .verifyComplete();

    assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
}

@Test
void globalExceptionHandler_shouldLogError_whenJwtExceptionThrown() {
    // RED: Security exceptions should be logged but not expose details

    // Verify logging behavior without exposing token values
    // This requires logging verification in tests
}
```

---

## Testing Strategy

### Test Pyramid

```
                    /\
                   /  \
                  / E2E \          ← Integration tests (5%)
                 /______\
                /        \
               / Service  \        ← Service tests (20%)
              /____________\
             /              \
            /  Unit Tests    \     ← Unit tests (75%)
           /__________________\
```

### Testing Approach

#### Unit Tests (75% of tests)

- **JwtServiceTest**: Token generation, validation, extraction
- **TokenBlacklistServiceTest**: Blacklisting, cleanup operations
- **JwtAuthenticationFilterTest**: Token extraction, validation flow
- **LoginControllerTest**: Endpoint behavior with mocked services

#### Integration Tests (20% of tests)

- **JwtIntegrationTest**: Full authentication flow with real database
- **SecurityIntegrationTest**: End-to-end authorization with roles
- **RefreshTokenIntegrationTest**: Token refresh with database verification

#### End-to-End Tests (5% of tests)

- **AuthenticationE2ETest**: Complete user journey (register, login, access protected resource, refresh, logout)
- **RoleBasedAccessE2ETest**: Verify ADMIN and USER access patterns

### Reactive Testing Tools

#### StepVerifier (Primary tool for reactive tests)

```java
// Verify successful Mono completion
StepVerifier.create(jwtService.generateAccessToken("user@example.com", "USER"))
    .assertNext(token -> assertNotNull(token))
    .verifyComplete();

// Verify error signal
StepVerifier.create(jwtService.validateToken("invalid"))
    .expectError(SecurityException.class)
    .verify();

// Verify multiple emissions
StepVerifier.create(someFlux)
    .expectNext("first")
    .expectNext("second")
    .verifyComplete();
```

#### WebTestClient (For controller tests)

```java
@Test
void testLoginEndpoint() {
    webTestClient.post()
        .uri("/api/v1/login")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(new UserRequest("user@example.com", "password"))
        .exchange()
        .expectStatus().isOk()
        .expectBody(LoginResponse.class)
        .value(response -> {
            assertNotNull(response.accessToken());
            assertNotNull(response.refreshToken());
        });
}
```

#### Mockito with Reactor

```java
// Mock Mono return
when(jwtService.generateAccessToken(anyString(), anyString()))
    .thenReturn(Mono.just("mock.token"));

// Mock error
when(jwtService.validateToken(anyString()))
    .thenReturn(Mono.error(new SecurityException("Invalid")));

// Verify reactive call
verify(jwtService).generateAccessToken("user@example.com", "USER");
```

### Test Data Builders

```java
public class TestDataBuilder {

    public static UserEntity createUser(String email, Erole role) {
        return new UserEntity(1L, email, "encoded_password", role);
    }

    public static Claims createClaims(String email, String role) {
        Claims claims = Jwts.claims().setSubject(email);
        if (role != null) {
            claims.put("role", role);
        }
        claims.setExpiration(new Date(System.currentTimeMillis() + 60000));
        return claims;
    }

    public static String createExpiredToken(IJwtService jwtService) {
        // Helper to create expired token for testing
        return "expired.token"; // Implementation details
    }
}
```

### Integration Test Configuration

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@TestPropertySource(properties = {
    "jwt.secret=test-secret-key-for-integration-tests-minimum-256-bits",
    "jwt.access-token-expiration-ms=60000",
    "jwt.refresh-token-expiration-ms=120000"
})
public class JwtIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private IUserRepository userRepository;

    // Integration tests
}
```

---

## TDD Workflow Summary

### Phase 1: Core JWT Service (Week 1)

**Day 1-2: Token Generation**

1. RED: Write JwtServiceTest - token generation tests (fail)
2. GREEN: Implement JwtServiceImpl - basic token generation
3. REFACTOR: Extract configuration, optimize Mono chains

**Day 3-4: Token Validation**

1. RED: Write JwtServiceTest - validation tests (fail)
2. GREEN: Implement validation logic with JJWT parser
3. REFACTOR: Improve error handling, add logging

**Day 5: Claims Extraction**

1. RED: Write extraction tests (fail)
2. GREEN: Implement extraction methods
3. REFACTOR: Add null checks, optimize

### Phase 2: Token Blacklist (Week 1)

**Day 1: Blacklist Operations**

1. RED: Write TokenBlacklistServiceTest - blacklisting tests (fail)
2. GREEN: Implement with ConcurrentHashMap
3. REFACTOR: Thread-safety verification

**Day 2: Cleanup Operations**

1. RED: Write cleanup tests (fail)
2. GREEN: Implement cleanup logic
3. REFACTOR: Add scheduled cleanup task

### Phase 3: Authentication Filter (Week 2)

**Day 1-2: Token Extraction and Validation**

1. RED: Write JwtAuthenticationFilterTest - extraction tests (fail)
2. GREEN: Implement token extraction from headers
3. REFACTOR: Extract helper methods

**Day 3-4: Public Path Handling**

1. RED: Write public path tests (fail)
2. GREEN: Implement path matching logic
3. REFACTOR: Optimize path matching performance

**Day 5: Security Context Population**

1. RED: Write context population tests (fail)
2. GREEN: Implement ReactiveSecurityContextHolder usage
3. REFACTOR: Clean up authentication object creation

### Phase 4: Controller Integration (Week 2)

**Day 1-2: Login Endpoint**

1. RED: Write LoginControllerTest - login tests (fail)
2. GREEN: Update login endpoint to return tokens
3. REFACTOR: Extract token generation to service layer

**Day 3: Refresh Token Endpoint**

1. RED: Write refresh token tests (fail)
2. GREEN: Implement refresh endpoint
3. REFACTOR: Add user validation

**Day 4: Logout Endpoint**

1. RED: Write logout tests (fail)
2. GREEN: Implement logout with blacklisting
3. REFACTOR: Improve error responses

**Day 5: Integration Testing**

1. Write end-to-end integration tests
2. Verify all components work together
3. Fix any integration issues

### Phase 5: Security Configuration (Week 3)

**Day 1-2: Security Config Updates**

1. Update SecurityConfig to use JWT filter
2. Remove session-based authentication
3. Test role-based authorization

**Day 3-4: Error Handling**

1. Implement global exception handler
2. Test error scenarios
3. Verify logging behavior

**Day 5: Performance and Cleanup**

1. Load testing for concurrent requests
2. Memory profiling for blacklist
3. Documentation updates

---

## Security Considerations

### Token Security

1. **Secret Key Management**
   - Minimum 256-bit key for HS512
   - Store in environment variables, not in code
   - Rotate keys periodically

2. **Token Expiration**
   - Short-lived access tokens (15 minutes)
   - Longer refresh tokens (7 days)
   - Automatic cleanup of expired blacklist entries

3. **Signature Validation**
   - Always verify signature before trusting claims
   - Reject tokens with invalid signatures
   - Log signature validation failures

### Transport Security

1. **HTTPS Only**
   - Tokens must be transmitted over HTTPS
   - Set Secure flag on cookies if used

2. **Authorization Header**
   - Use Authorization: Bearer {token} format
   - Never send tokens in URL parameters

### Blacklist Management

1. **Memory Considerations**
   - ConcurrentHashMap for thread-safe access
   - Scheduled cleanup every 1 hour
   - Monitor memory usage

2. **Scalability**
   - Consider Redis for distributed deployments
   - Current implementation suitable for single instance

### Logging Security

1. **What to Log**
   - Token generation events (email, timestamp)
   - Validation failures (reason code, IP address)
   - Blacklist operations

2. **What NOT to Log**
   - Full token values
   - User passwords
   - Sensitive claims data

---

## Performance Considerations

### Expected Throughput

- Token generation: ~1000 ops/sec per core
- Token validation: ~2000 ops/sec per core
- Blacklist lookup: O(1) average

### Optimization Strategies

1. **Token Validation Caching**
   - Consider caching validated tokens for 1-2 minutes
   - Reduces repeated validation overhead
   - Must check blacklist on each request

2. **Async Blacklist Cleanup**
   - Run cleanup as scheduled task
   - Don't block request threads

3. **Connection Pooling**
   - R2DBC connection pool properly configured
   - Monitor reactive stream backpressure

### Load Testing Scenarios

```java
@Test
void loadTest_tokenGeneration_should Handle1000ConcurrentRequests() {
    // Generate 1000 tokens concurrently
    Flux<String> tokens = Flux.range(1, 1000)
        .flatMap(i -> jwtService.generateAccessToken("user" + i + "@example.com", "USER"));

    StepVerifier.create(tokens)
        .expectNextCount(1000)
        .verifyComplete();
}

@Test
void loadTest_tokenValidation_shouldHandle2000ConcurrentRequests() {
    // Validate 2000 tokens concurrently
    // Implementation details
}
```

---

## Migration Strategy

### Backward Compatibility

1. **Dual Authentication Support** (Optional, if gradual migration needed)
   - Support both session-based and JWT authentication temporarily
   - Gradual migration of clients to JWT
   - Remove session support after migration complete

2. **Database Schema**
   - No database changes required
   - Existing UserEntity compatible with JWT

### Rollback Plan

1. **Revert SecurityConfig** to session-based authentication
2. **Remove JWT dependencies** from pom.xml
3. **Restore previous LoginController** implementation

### Testing Migration

1. **Verify existing tests still pass** with JWT implementation
2. **Test backward-compatible endpoints** (register, forgot-password)
3. **Integration test with frontend** client

---

## Deployment Checklist

### Before Deployment

- [ ] All unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] Generate secure JWT secret (256+ bits)
- [ ] Configure production token expiration times
- [ ] Update CORS configuration for production domain
- [ ] Load test with expected traffic volume
- [ ] Security audit completed
- [ ] Documentation updated

### Environment Variables

```bash
JWT_SECRET=your-production-secret-minimum-256-bits-long
JWT_ACCESS_TOKEN_EXPIRATION_MS=900000
JWT_REFRESH_TOKEN_EXPIRATION_MS=604800000
```

### Monitoring

- Monitor token generation rate
- Track validation failure rate
- Blacklist size monitoring
- Response time metrics for auth endpoints

---

## Appendix: Complete TDD Red-Green-Refactor Example

### Example: Implementing generateAccessToken()

#### RED Phase (Write failing test first)

```java
@Test
void generateAccessToken_shouldReturnValidJwt_whenValidInputProvided() {
    // This test will fail - method doesn't exist yet
    IJwtService jwtService = new JwtServiceImpl(jwtProperties);

    StepVerifier.create(jwtService.generateAccessToken("user@example.com", "USER"))
        .assertNext(token -> {
            assertNotNull(token);
            assertEquals(3, token.split("\\.").length);
        })
        .verifyComplete();
}
```

**Output**: ❌ Test fails - method returns null or doesn't exist

#### GREEN Phase (Make test pass with minimal code)

```java
@Service
public class JwtServiceImpl implements IJwtService {

    private final JwtProperties jwtProperties;

    @Override
    public Mono<String> generateAccessToken(String email, String role) {
        return Mono.fromCallable(() -> {
            long now = System.currentTimeMillis();
            long expiration = now + jwtProperties.getAccessTokenExpirationMs();

            return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
        });
    }

    private Key getSigningKey() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
```

**Output**: ✅ Test passes

#### REFACTOR Phase (Improve code quality)

```java
@Service
public class JwtServiceImpl implements IJwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtServiceImpl.class);
    private static final String ROLE_CLAIM = "role";

    private final JwtProperties jwtProperties;
    private final Key signingKey;

    public JwtServiceImpl(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.signingKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes());
    }

    @Override
    public Mono<String> generateAccessToken(String email, String role) {
        return Mono.fromCallable(() -> buildToken(email, role, jwtProperties.getAccessTokenExpirationMs()))
            .doOnSuccess(token -> logger.debug("Generated access token for user: {}", email))
            .doOnError(error -> logger.error("Failed to generate access token for user: {}", email, error));
    }

    private String buildToken(String email, String role, long expirationMs) {
        long now = System.currentTimeMillis();

        return Jwts.builder()
            .setSubject(email)
            .claim(ROLE_CLAIM, role)
            .setIssuedAt(new Date(now))
            .setExpiration(new Date(now + expirationMs))
            .signWith(signingKey, SignatureAlgorithm.HS512)
            .compact();
    }
}
```

**Output**: ✅ Test still passes + improved code quality

**Improvements made**:

- Extracted constants
- Added logging
- Optimized by caching signing key
- Extracted token building logic
- Added error handling

This is the TDD cycle repeated for every component in the design.
