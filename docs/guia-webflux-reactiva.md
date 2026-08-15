# Guía de estudio: Programación Reactiva con Spring WebFlux y R2DBC

> Notas de estudio de la migración de la API de Arcane Emporium de Spring MVC (servlet + JPA)
> a WebFlux (reactivo + R2DBC). Cada concepto está ligado a un error real que encontramos
> en el camino, para que la teoría tenga ancla en la práctica.

---

## 1. ¿Por qué reactivo? El problema que resuelve

Un servidor web clásico (servlet) usa **un hilo (thread) por petición**. Mientras la petición
espera una base de datos o una API externa, ese hilo queda **bloqueado**, sin hacer nada.

- Cada hilo ocupa memoria (típicamente ~1 MB de pila).
- Si tienes 200 peticiones concurrentes que esperan a la BD, usas 200 hilos.
- Con mucha concurrencia, el servidor se queda sin hilos → latencia que se dispara o rechazos.

La programación reactiva es **no bloqueante**: en lugar de "me quedo esperando", dices
"cuando la respuesta esté lista, haz esto". Un número pequeño de hilos puede atender miles
de peticiones porque ninguno se queda dormido esperando.

```
Servlet (bloqueante):          WebFlux (no bloqueante):
  hilo A → espera BD → responde    hilo A → lanza consulta → atiende otra cosa
  hilo B → espera BD → responde    hilo B → lanza consulta → atiende otra cosa
  ...                             cuando la BD responde → se continúa
```

En nuestro proyecto, la prueba visible de este cambio fue pasar de JPA (`spring-boot-starter-data-jpa`)
a `spring-boot-starter-data-r2dbc` (driver reactivo de PostgreSQL).

---

## 2. Mono y Flux: la caja y la tubería

Reactor trabaja con dos tipos principales, que vienen de `reactor.core.publisher`:

| Tipo | Emite | Analogía |
| --- | --- | --- |
| `Mono<T>` | **0 o 1** valor | Una **caja** que puede estar vacía o contener UN objeto. |
| `Flux<T>` | **0 o más** valores | Una **tubería** por la que pasan varios objetos (o ninguno). |

Piensa en las consultas de base de datos:

- Buscar UN artefacto por id → `Mono<Artifact>` (existe o no).
- Buscar TODOS los artefactos → `Flux<Artifact>` (muchos).
- Agrupar traducciones de un artefacto → `Flux<ArtifactTranslation>`.

En el proyecto (antes de la migración) había métodos que devolvían `Optional<UserEntity>`
o `List<Artifact>`. Ahora devuelven `Mono<UserEntity>` y `Flux<Artifact>`. El cambio de
tipo de retorno es la señal externa de que "esto ahora es reactivo".

---

## 3. La regla de oro: nada ocurre hasta que te suscribes

Un `Mono` o `Flux` es una **receta**, no el resultado.

```java
Mono<UserEntity> user = userRepository.findByUsername("admin");
```

Esta línea **no consulta la base de datos todavía**. Solo describe lo que se hará. La consulta
se ejecuta cuando algo se **suscribe** (Spring WebFlux se suscribe por ti al devolver el Mono
desde un controlador; el framework es quien "enciende el motor").

Consecuencias prácticas:

- Puedes construir cadenas largas sin ejecutar nada: `map` → `flatMap` → `switchIfEmpty` se
  encadenan y solo se ejecutan al suscribirse.
- Si llamas `.block()` en un hilo no bloqueante, estás rompiendo el modelo (forzando espera).
- Si te suscribes dos veces (por ejemplo `.blockOptional()` sobre un `Mono` que ya se usó),
  la operación se **ejecuta dos veces** — vimos este bug en `getArtifact` con la doble
  suscripción que duplicaba la consulta a la BD.

---

## 4. Operadores esenciales

### 4.1 `map`: transformación síncrona 1:1

Convierte cada valor emitido en otro valor. La función es **síncrona y no devuelve un Mono**.

```java
// IArtifactService del proyecto
return artifactRepository.findAllByOrderByIdAsc(pageable)
        .map(artifact -> ArtifactMapper.toResponse(
                artifact, translations, locale,
                priceFormatted.format(artifact.getPrice(), displayCurrency, locale),
                displayCurrency));
```

`Flux<Artifact>` → `map` → `Flux<ArtifactResponse>`.

**Pregunta clave:** si dentro del `map` tienes que llamar a algo que devuelve `Mono` o `Flux`,
**no uses `map`**, usa `flatMap`.

### 4.2 `flatMap`: transformación que devuelve otro Mono/Flux (asíncrona)

Cuando dentro de la transformación haces **otra llamada reactiva**, necesitas `flatMap`,
que "aplanará" el Mono/Flux interno.

Este es el ejemplo real de `getArtifact`:

```java
return artifactRepository.findById(id)
        .flatMap(artifact -> artifactTranslationRepository
                .findAllByArtifactId(artifact.getId())   // ← devuelve Flux
                .collectList()                            // ← Flux → Mono<List>
                .map(translations -> ArtifactMapper.toResponse(
                        artifact, translations, locale,
                        priceFormatted.format(artifact.getPrice(), displayCurrency, locale),
                        displayCurrency)))
        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Artefacto no encontrado")));
```

Cadena real: `Mono<Artifact>` → `flatMap` → (consulta traducciones → `Flux` → `collectList`
→ `Mono<List<ArtifactTranslation>>` → `map` → `Mono<ArtifactResponse>`) → `switchIfEmpty`.

Si hubiéramos usado `map` aquí, el resultado habría sido `Mono<Mono<ArtifactResponse>>`,
una caja dentro de otra caja — y nadie quiere eso.

### 4.3 `switchIfEmpty`: "si la caja viene vacía, usa esta otra"

Este operador fue el responsable del primer error importante de la migración.

En el código servlet típico hacías:

```java
UserEntity user = userRepository.findByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("..."));
```

Con Reactor no hay `orElseThrow` sobre un `Mono` (no es un `Optional`). La traducción directa es:

```java
return userRepository.findByUsername(username)
        .switchIfEmpty(Mono.error(new UsernameNotFoundException("...")))
        ...
```

- `Mono.empty()` → caja vacía.
- `switchIfEmpty(Mono.error(...))` → "si vino vacío, emite este error".
- `switchIfEmpty(Mono.just(valorPorDefecto))` → "si vino vacío, usa este valor por defecto".

Distinción importante:

| Operador | Significado |
| --- | --- |
| `Mono.empty()` | Caja vacía, el flujo termina sin valor. |
| `Mono.error(Throwable)` | Caja con error; el flujo falla. |
| `switchIfEmpty(Mono.error(...))` | Si está vacío → lanza el error. |
| `switchIfEmpty(Mono.just(x))` | Si está vacío → emite x. |

### 4.4 `thenReturn` / `then`: "cuando termine, devuelve esto"

Útiles para operaciones que solo tienen efecto lateral (guardar, borrar) y quieres responder
algo al final.

```java
// Esquema típico de un delete reactivo
return favoriteRepository.deleteByUserIdAndArtifactId(userId, artifactId)
        .thenReturn("Favorito eliminado");   // Mono<String>
```

`then()` (sin argumentos) devuelve `Mono<Void>` cuando el flujo anterior termina. Útil cuando
el método no tiene nada que devolver.

### 4.5 `flatMapMany`: de un Mono a un Flux

Cuando un Mono produce el "gatillo" para emitir muchos valores.

```java
return userRepository.findByUsername(username)   // Mono<UserEntity>
        .flatMapMany(user -> favoriteRepository.findAllByUserId(user.getId()))  // Flux<Favorite>
```

### 4.6 `collectList`: de Flux a Mono<List>

Une todos los valores de un Flux en una lista. Lo usamos para las traducciones:

```java
Flux<ArtifactTranslation> flux   →   Mono<List<ArtifactTranslation>>
```

### 4.7 Creación: `Mono.just`, `Mono.fromRunnable`, `Mono<Void>`

- `Mono.just(valor)` → caja ya llena (valor conocido, sin trabajo async).
- `Mono.fromRunnable(() -> {...})` → caja que ejecuta un efecto lateral cuando se suscriben.
- `Mono<Void>` → caja que "no trae nada" pero termina (como un `void` reactivo).

### 4.8 `.block()`: el anti-patrón (y nuestro impuesto temporal)

`.block()` **espera** a que el Mono/Flux termine y devuelve el valor. Es la forma de "salirse"
del mundo reactivo. En un `ReactiveUserDetailsService` es un error grave: bloqueas el hilo
del event loop.

Lo usamos temporalmente en `AutenticationService` durante la migración como puente, y luego
lo eliminamos al convertir la clase a `ReactiveUserDetailsService`. Regla: en un servidor
WebFlux, el código de tu cadena **no debe llamar a `.block()`**. Si lo ves en un servicio,
huele a que todavía hay lógica "pensando en servlet".

---

## 5. Repositorios R2DBC: las trampas que encontramos

### 5.1 Las consultas derivadas se validan en RUNTIME, no al compilar

Este fue un error que costó encontrar:

```
No property 'findAll' found for type Artifact
```

La firma `findAll(Pageable)` **no existe** en `R2dbcRepository`. A diferencia de JPA, donde
`findAll(Pageable)` viene de fábrica, aquí hay que declararla con un nombre que Spring pueda
derivar. La solución real del proyecto:

```java
public interface IArtifactRepository extends R2dbcRepository<Artifact, Long> {

    Flux<Artifact> findAllByOrderByIdAsc(Pageable pageable);          // ordenado
    Flux<Artifact> findAllByCategory(ECategory category, Pageable pageable);
}
```

**Lección:** un error de derivación no aparece en `mvn compile`. Aparece la primera vez que
se ejecuta la consulta. Siempre prueba el endpoint después de tocar un repositorio.

### 5.2 `Pageable` va al final de la firma derivada

```java
Flux<Artifact> findAllByCategory(ECategory category, Pageable pageable);   // ✓
Flux<Artifact> findAllByCategory(Pageable pageable, ECategory category);   // ✗ no deriva
```

### 5.3 `@Query` nativa con `ILIKE` para búsqueda

El método `searchByTitleOrDescription` con consulta derivada esperaba dos parámetros
(`title` y `description` por separado), lo que no funcionaba para una búsqueda única.
Lo resolvimos con SQL nativo y `ILIKE`:

```java
@Query("SELECT * FROM artifacts WHERE title ILIKE :keyword OR description ILIKE :keyword")
Flux<Artifact> searchByTitleOrDescription(String keyword);
```

Detalles que importan:

- `ILIKE` es de PostgreSQL (no es SQL estándar).
- El nombre de tabla y columnas es el **snake_case real** (`artifacts`, `title`, `description`),
  no el camelCase de Java.
- `@Query` nativa no valida nombres en compilación; un typo aparece en runtime.

### 5.4 camelCase vs snake_case

R2DBC mapea propiedades Java a columnas por convención, pero para tablas/columnas con
nombres distintos usamos `@Table` y `@Column`:

```java
@Table(name = "artifact_translations")
public class ArtifactTranslation {
    @Id
    private Long id;

    @Column("id_artifact")
    private Long artifactId;
    private String locale;
    private String title;
    private String description;
}
```

---

## 6. Controllers WebFlux: devuelve Mono/Flux, no bloquees

### 6.1 El error `Pageable`

```
No primary or single unique constructor found for interface Pageable
```

`@PageableDefault Pageable pageable` (o `Pageable` como parámetro directo) es un mecanismo de
**Spring MVC** (spring-data-web), pensado para servlet. En WebFlux no hay resolución automática:
Spring intenta tratar `Pageable` como un objeto a construir desde los parámetros HTTP y falla.

La solución en el proyecto fue recibir `page` y `size` explícitos y construir el `PageRequest`:

```java
@GetMapping
public Flux<ArtifactResponse> getAllArtifacts(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size,
                                              Locale locale,
                                              @RequestParam(required = false) String currency) {
    return artifactService.getAllArtifact(PageRequest.of(page, size), locale, currency);
}
```

### 6.2 Devolver el Mono/Flux directamente

En WebFlux el controlador devuelve `Mono<T>` o `Flux<T>`; el framework se encarga de
suscribirse y escribir la respuesta. No es necesario envolver en `ResponseEntity`
(se puede, pero no es obligatorio), y **no** se debe llamar `.block()` dentro.

### 6.3 El bug de la doble suscripción

```java
// MAL: se suscribe y ejecuta la consulta dos veces
return artifactService.getArtifact(id, locale, currency).blockOptional().orElse(null);
```

- `.blockOptional()` ya fuerza la ejecución y extrae el valor.
- Después devolvías ese valor envuelto de nuevo, y al suscribirse el framework volvía a ejecutar.

Correcto:

```java
return artifactService.getArtifact(id, locale, currency);
```

---

## 7. Seguridad servlet → reactiva (tabla de traducción)

| Servlet (Spring Security clásica) | WebFlux reactivo |
| --- | --- |
| `SecurityFilterChain` | `SecurityWebFilterChain` |
| `HttpSecurity` | `ServerHttpSecurity` |
| `authorizeHttpRequests()` | `authorizeExchange()` |
| `antMatchers("/x")` | `pathMatchers("/x")` |
| `anyRequest()` | `anyExchange()` |
| `UserDetailsService` | `ReactiveUserDetailsService` |
| `AuthenticationManager` | `ReactiveAuthenticationManager` |
| `@EnableMethodSecurity` | `@EnableReactiveMethodSecurity` |
| CORS `org.springframework.web.cors.*` | CORS `org.springframework.web.cors.reactive.*` |

Ejemplo real del proyecto (`SecurityConfig`):

```java
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(Customizer.withDefaults())
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers("/api/v1/artifacts/**", "/api/v1/labels", "/api/v1/register").permitAll()
                        .anyExchange().authenticated())
                .httpBasic(Customizer.withDefaults())
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .build();
    }
}
```

Y el `ReactiveUserDetailsService` (nota: sin `.block()`):

```java
@Service
public class AutenticationService implements ReactiveUserDetailsService {

    @Override
    public Mono<UserDetails> findByUsername(String username) {
        return userRepository.findByUsername(username)
                .switchIfEmpty(Mono.error(new UsernameNotFoundException("Usuario no encontrado")))
                .map(UserMapper::toUserDetails);
    }
}
```

---

## 8. El driver R2DBC: `Available drivers: [ pool ]`

```
Failed to create a driver for URL: r2dbc:postgresql://localhost:5432/...
Available drivers: [ pool ]
```

**Causa:** el POM declaraba `io.r2dbc:r2dbc-postgresql:1.2.0`, que **no existe**. El driver
de PostgreSQL cambió de `io.r2dbc` a `org.postgresql` (ahora vive en el grupo de PostgreSQL),
y además el Spring Boot BOM ya lo gestiona: **no hay que poner versión**.

```xml
<!-- ANTES (roto) -->
<dependency>
    <groupId>io.r2dbc</groupId>
    <artifactId>r2dbc-postgresql</artifactId>
    <version>1.2.0</version>
</dependency>

<!-- DESPUÉS (correcto) -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>r2dbc-postgresql</artifactId>
</dependency>
```

Los drivers R2DBC se descubren por `ServiceLoader` (archivos `META-INF/services`); si el
artifact no está, el pool no sabe qué driver usar y reporta esa lista vacía.

---

## 9. Tabla de errores reales del proyecto

| Error | Causa raíz | Lección |
| --- | --- | --- |
| `FavoriteService.java:41,33` — "not a statement"/tipo incorrecto | Método duplicado `Mono<UserEntity> existsByUserIdAndArifactId` (typo `ArifactId`) que coincidía con la llamada del servicio; `exists` era un `UserEntity`, no `boolean` | Los typos en nombres de métodos derivados se convierten en errores de tipos extraños. Nombra con cuidado: `existsByUserIdAndArtifactId` |
| `NoClassDefFoundError: jakarta.servlet.Filter` | `WebSecurityConfiguration` (security servlet) dentro de una app WebFlux | En WebFlux se usa la variante reactiva de cada componente |
| `Available drivers: [ pool ]` | Coordenada Maven `io.r2dbc:r2dbc-postgresql:1.2.0` inexistente | Driver en `org.postgresql`, versión gestionada por el BOM |
| `No property 'findAll' found` | `findAll(Pageable)` no existe en `R2dbcRepository` | Derivar con nombre propio: `findAllByOrderByIdAsc` |
| `No primary or single unique constructor found for interface Pageable` | `@PageableDefault`/`Pageable` es mecanismo MVC, no WebFlux | Usar `@RequestParam int page/size` + `PageRequest.of(...)` |
| Doble suscripción en `getArtifact` | `.blockOptional().orElse(null)` ejecuta la cadena y luego el framework la ejecuta otra vez | Devolver el `Mono` directamente |
| `orElseThrow` sobre `Mono` | Confundir `Mono` con `Optional` | `switchIfEmpty(Mono.error(...))` |
| Traducciones no aparecen en el listado | `getAllArtifact` pasa `List.of()` como traducciones | Cargar y agrupar traducciones por artefacto |
| El idioma del frontend no cambia nada en el backend | El backend ignora `?lang=`; resuelve `Locale` solo desde `Accept-Language` | Configurar un `LocaleContextResolver` propio (ver sección 10) — ✅ aplicado |
| Apóstrofes "comidos" en mensajes en inglés | `always-use-message-format: true` + `we'll` / `Don't` | Desactivar `always-use-message-format` o escapar `''` |
| "Cargar más" en la búsqueda duplica artefactos | `searchByKeyword` recibe `Pageable` y no lo usa; la `@Query` nativa no tiene `LIMIT/OFFSET` | Pasar `pageable.getPageSize()/getOffset()` a la consulta y paginarla (sección 11.1) |
| Buscar en español no arroja resultados | La búsqueda solo mira títulos base en inglés; `ILIKE` distingue acentos | Decidir si buscar también en `artifact_translations` y usar `unaccent()` (sección 11.1) |
| El cambio de moneda no hace nada | El frontend nunca envía `currency` y el backend solo cambia el código sin convertir (`CurrencyConverter` sin usar) | Conectar `CurrencyConverter` en `ArtifactService` + selector en el frontend (sección 11.2) |
| `POST /forgot-password` → 500 | `RestClient` bloqueante dentro de `Mono.fromRunnable`; el fallo de Brevo se propaga como error | `WebClient` reactivo + responder 200 siempre y loguear (sección 11.3) |

---

## 10. Internacionalización (i18n): el diagnóstico completo

El frontend envía `?lang=es` en todas las peticiones:

```js
// frontend/src/api/labels.js
const params = new URLSearchParams({ lang })
return apiFetch(`/api/v1/labels?${params.toString()}`)
```

Pero el backend recibe `Locale locale` en los controladores, y en WebFlux ese parámetro se
resuelve **exclusivamente desde el header `Accept-Language`** mediante
`AcceptHeaderLocaleContextResolver` (la configuración por defecto). El parámetro `lang`
**se ignora por completo** → cambiar el idioma en la UI no produce ningún cambio.

**La solución correcta (una sola pieza):** un `LocaleContextResolver` personalizado que lea
`?lang=` con respaldo al header. Cuando existe un bean de tipo `LocaleContextResolver`,
WebFlux usa ese en lugar del default.

> ✅ **Estado: aplicado en el proyecto.** Se debatió entre esta solución y mandar el header
> `Accept-Language` desde el frontend. Decisión: `LocaleContextResolver`, porque el frontend
> ya envía `?lang=` en todas las peticiones (cero cambios en el cliente), las URLs quedan
> auto-descriptivas (se comparten y se prueban en Postman), y el resolver conserva
> `Accept-Language` como respaldo para clientes estándar. La lección: los dos enfoques son
> válidos; el error real era que el frontend mandaba `?lang=` y el backend lo ignoraba.

```java
package uk.jimsimrodev.arcanemporiumapi.infra.i18n;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.i18n.AcceptHeaderLocaleContextResolver;
import org.springframework.web.server.i18n.LocaleContextResolver;
import org.springframework.web.server.i18n.SimpleLocaleContext;

import java.util.List;
import java.util.Locale;

@Configuration
public class LocaleConfig {

    @Bean
    public LocaleContextResolver localeContextResolver() {
        return new QueryParamLocaleContextResolver();
    }

    static class QueryParamLocaleContextResolver implements LocaleContextResolver {

        private static final List<String> SUPPORTED = List.of("es", "en", "pt");

        private final AcceptHeaderLocaleContextResolver fallback = new AcceptHeaderLocaleContextResolver();

        @Override
        public LocaleContext resolveLocaleContext(ServerWebExchange exchange) {
            String lang = exchange.getRequest().getQueryParams().getFirst("lang");
            if (lang != null && SUPPORTED.contains(lang)) {
                return new SimpleLocaleContext(Locale.forLanguageTag(lang));
            }
            return fallback.resolveLocaleContext(exchange);
        }

        @Override
        public void setLocaleContext(ServerWebExchange exchange, LocaleContext localeContext) {
            fallback.setLocaleContext(exchange, localeContext);
        }
    }
}
```

Con esto, **todos** los endpoints que reciben `Locale locale` (labels, artefactos, favoritos)
responden al `lang` del frontend. La API sigue funcionando para clientes que solo envían
`Accept-Language`.

### Otro bug de i18n: apóstrofes con `MessageFormat`

`application.yml` tiene:

```yaml
spring:
  messages:
    always-use-message-format: true
```

Con `always-use-message-format: true`, TODOS los mensajes pasan por `MessageFormat`, incluso
sin argumentos. En `MessageFormat`, el apóstrofe `'` es el carácter de escape/entrecomillado.
Resultado en el bundle inglés:

- `we'll send` → `well send`
- `Don't have an account?` → `Dont have an account?`

**Solución recomendada:** quitar esa línea (el valor por defecto es `false`). Si algún día un
mensaje usa `{0}` con texto que lleva apóstrofe, se escapa como `''`.

```yaml
spring:
  messages:
    basename: messages
    encoding: UTF-8
    fallback-to-system-locale: false
    use-code-as-default-message: true
```

### Cómo funciona el resto del i18n del proyecto

- **Labels de la UI:** `LabelController` (`GET /api/v1/labels`) resuelve cada clave con
  `MessageService` → `MessageSource` → `messages.properties` (es), `messages_en.properties`,
  `messages_pt.properties`. El frontend las guarda y usa `t('clave')`.
- **Contenido de artefactos:** tabla `artifact_translations` (id_artifact, locale, title,
  description), sembrada en `V4__inser_into_artifacts.sql`. `ArtifactMapper.toResponse` elige
  la traducción por `locale.getLanguage()`; si no existe, cae al título base.
- **Precio:** `PriceFormatted` formatea según locale (es-CO, en-US, pt-BR) y `ArtifactService`
  resuelve la moneda por idioma (COP/USD/BRL) si no viene `currency` en la petición.

### Pendiente de i18n: las vistas de listado no traducen contenido

`getAllArtifact`, `getArtifactCategorList` y `searchByKeyword` pasan `List.of()` como
traducciones, así que el catálogo muestra los títulos base aunque existan filas en
`artifact_translations`. Solo `getArtifact` (detalle) carga traducciones.

La forma correcta (y eficiente) de arreglarlo: cargar todas las traducciones de la página en
una sola consulta y agruparlas en memoria. Ejemplo para el listado:

```java
public Flux<ArtifactResponse> getAllArtifact(Pageable pageable, Locale locale, String currency) {
    String displayCurrency = resolveCurrency(locale, currency);

    return artifactTranslationRepository.findAll()          // todas las traducciones (tabla pequeña)
            .collectList()
            .flatMapMany(translations -> artifactRepository.findAllByOrderByIdAsc(pageable)
                    .map(artifact -> ArtifactMapper.toResponse(
                            artifact,
                            translationsFor(artifact.getId(), translations),
                            locale,
                            priceFormatted.format(artifact.getPrice(), displayCurrency, locale),
                            displayCurrency)));
}

private static List<ArtifactTranslation> translationsFor(Long artifactId,
                                                         List<ArtifactTranslation> all) {
    return all.stream().filter(t -> artifactId.equals(t.getArtifactId())).toList();
}
```

---

## 11. Los tres bugs de la siguiente prueba (búsqueda, moneda, email)

Después de arreglar el idioma, aparecieron tres bugs nuevos. Los tres tienen la misma
raíz conceptual: **cosas que parecían hechas pero estaban a medias**.

### 11.1 Búsqueda: "cargar más" duplica los mismos artefactos

**Síntoma:** al buscar por title/description, a veces no hay resultados; cuando los hay,
"cargar más" vuelve a mostrar los mismos artefactos, una y otra vez.

**Causa raíz (dónde está el error):** `ArtifactService.searchByKeyword` recibe el
`Pageable` pero **no lo usa**:

```java
// ArtifactService.java (ANTES — roto)
return artifactRepository.searchByTitleOrDescription(keyword);   // ← sin pageable
```

Y la `@Query` nativa no tiene paginación ni orden:

```java
// IArtifactRepository.java (ANTES — roto)
@Query("SELECT * FROM artifacts WHERE title ILIKE :keyword OR description ILIKE :keyword")
Flux<Artifact> searchByTitleOrDescription(String keyword);
```

Resultado: el backend devuelve **TODOS los resultados en cada página**. El frontend pide
página 0 (recibe todo), luego página 1 (recibe lo mismo) → duplica. Como la longitud de
cada respuesta es idéntica, el frontend cree que "hay más" para siempre.

**La lección:** `Pageable` no se aplica solo porque lo declares en la firma del servicio.
Tienes que pasarlo hasta la consulta. Y una `@Query` nativa **no pagina sola**: hay que
escribir `LIMIT`/`OFFSET`.

**¿Por qué las derivadas sí aceptan `Pageable` y la `@Query` nativa no?** Porque en las
consultas derivadas (`findAllByOrderByIdAsc(Pageable)`) Spring Data **genera el SQL** y sabe
dónde inyectar `LIMIT/OFFSET`. En una `@Query` el SQL lo escribes tú y Spring Data **no lo
reescribe**: es una decisión oficial del equipo (issue spring-data-r2dbc #276, mp911de:
"Spring Data no es una librería de transformación de SQL"). Con `Pageable` en una `@Query`,
el código **compila pero revienta en runtime** al intentar enlazar `:size`/`:offset` que no
existen. Por eso la firma correcta pasa `int size` y `long offset` explícitos.

**Corrección:**

```java
// IArtifactRepository.java (DESPUÉS — correcto)
@Query("""
        SELECT * FROM artifacts
        WHERE title ILIKE :keyword OR description ILIKE :keyword
        ORDER BY id ASC
        LIMIT :size OFFSET :offset
        """)
Flux<Artifact> searchByTitleOrDescription(String keyword, int size, long offset);
```

```java
// ArtifactService.java (DESPUÉS — correcto)
return artifactRepository.searchByTitleOrDescription(
        keyword, pageable.getPageSize(), pageable.getOffset());
```

**Por qué "a veces no arroja resultado":** dos razones, ambas en la base de datos:

1. `ILIKE` es insensible a MAYÚSCULAS/minúsculas, pero **SÍ distingue acentos**.
   `pocion` no coincide con `Poción` sin usar la extensión `unaccent` de PostgreSQL.
2. La búsqueda solo mira `artifacts.title` y `artifacts.description` (títulos base, en
   inglés según el seed V2/V4). **No busca en `artifact_translations`** — por eso buscar
   "daga" no encuentra "Daga Colmillo de Escarcha" (esa traducción vive en otra tabla).

Además, si escribes un número, el frontend cambia de modo y busca **solo por id**
(`fetchArtifact(Number(q))`), no por texto.

### 11.2 Moneda: "el cambio de moneda no hace nada"

**Síntoma:** cambiar la moneda no cambia nada.

**Causa raíz (dos capas):**

1. **El frontend nunca envía `currency`.** Un grep de `currency` en `frontend/src` da cero
   resultados: no hay selector de moneda ni parámetro en `api/artifacts.js`. El backend
   acepta `?currency=USD`, pero nadie se lo manda.
2. **Aunque lo mandaras, el backend no convierte.** `ArtifactService.resolveCurrency` solo
   elige el **código** (COP/USD/BRL) y `PriceFormatted` solo cambia el sufijo del número.
   El **importe queda en COP**: verías `15.000,00 USD`, no el equivalente convertido.

El proyecto YA tiene `CurrencyConverter.convertFromCop(amount, target)` (divide por la tasa
de `ExchangeRateStore`, que se refresca cada 6 h con USD y BRL)… pero **nadie lo usa**:
`ArtifactService` no lo inyecta. Pieza muerta.

**La lección:** una infraestructura de conversión existe solo cuando está **conectada al
flujo**. El esqueleto (client, store, converter) sin el servicio no hace nada visible.

**Corrección (backend):** inyectar `CurrencyConverter` en `ArtifactService` y convertir
antes de formatear:

```java
// ArtifactService.java (DESPUÉS)
private final CurrencyConverter currencyConverter;   // nueva dependencia

private String formatPrice(Artifact artifact, Locale locale, String currency) {
    BigDecimal amount = currencyConverter.convertFromCop(artifact.getPrice(), currency)
            .orElse(artifact.getPrice());
    return priceFormatted.format(amount, currency, locale);
}
```

Nota de diseño: si la tasa no está disponible (p. ej. una moneda no cacheada), el
`Optional` vacío cae al importe original. Degradación elegante: mejor mostrar el valor sin
convertir que romper la petición.

**Pendiente (frontend):** falta el selector de moneda + pasar `currency` en
`api/artifacts.js`. Es una feature nueva de UI, no un bug.

### 11.3 `POST /api/v1/forgot-password` → error 500

**Síntoma:** el envío del email de recuperación devuelve 500.

**Causa raíz (dónde está el error):** `BrevoEmailService.resetPassword` usa
**`RestClient` (cliente HTTP síncrono y BLOQUEANTE)** dentro de la cadena reactiva:

```java
// UserService.java (ANTES — roto)
return userRepository.save(user)
        .then(Mono.fromRunnable(() -> emailService.resetPassword(email, token)));
```

Dos problemas encadenados:

1. `Mono.fromRunnable` ejecuta la llamada al hilo de suscripción del event loop y la
   BLOQUEA mientras habla con Brevo — anti-patrón en WebFlux.
2. Cuando Brevo responde con error (401 por api-key inválida, 400 por payload, red caída),
   `RestClient.retrieve()` **lanza excepción**, esa excepción convierte el `Mono` en error
   y Spring responde **500**.

Además, el contrato de "olvidé mi contraseña" dice que la respuesta debe ser 200 **siempre**
(no revelar si el correo existe); el código actual lanza `RuntimeException` cuando el correo
no existe.

**La lección:** en WebFlux, cualquier llamada externa debe ser reactiva (`WebClient`), y un
endpoint de seguridad debe degradar con elegancia, no explotar.

**Corrección (3 archivos):**

```java
// IEmailService.java (DESPUÉS)
public interface IEmailService {
    Mono<Void> resetPassword(String recipient, String token);
}
```

```java
// BrevoEmailService.java (DESPUÉS — reactivo)
@Service
public class BrevoEmailService implements IEmailService {

    private static final String BASE_URL = "https://api.brevo.com/v3";

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    private final WebClient webClient;

    public BrevoEmailService() {
        this.webClient = WebClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public Mono<Void> resetPassword(String recipient, String token) {
        String resetLink = "http://localhost:5173/reset-password?token=" + token;

        MailRequesDto payload = new MailRequesDto(
                "<p>Haz clic aquí para restablecer tu contraseña:</p>"
                        + "<a href=\"" + resetLink + "\">Restablecer contraseña</a>",
                new SenderDto(senderEmail, senderName),
                "Recuperación de contraseña",
                List.of(new ToDto(recipient, recipient)));

        return webClient.post()
                .uri("/smtp/email")
                .header("api-key", apiKey)
                .bodyValue(payload)
                .retrieve()
                .toBodilessEntity()
                .then();
    }
}
```

```java
// UserService.java (DESPUÉS — siempre 200, error solo en log)
@Override
public Mono<Void> forgotPassword(RequestPasswordReset requestPasswordReset) {
    return userRepository.findByEmail(requestPasswordReset.email())
            .flatMap(user -> {
                String token = UUID.randomUUID().toString();
                user.setResetToken(token);
                user.setTokenResetPasswordExpiresAt(LocalDateTime.now().plusMinutes(15));
                return userRepository.save(user);
            })
            .flatMap(user -> emailService.resetPassword(
                            requestPasswordReset.email(), user.getResetToken())
                    .onErrorResume(err -> {
                        LOGGER.error("Correo no enviado (el token queda guardado)", err);
                        return Mono.empty();
                    }))
            .then();
}
```

Si el correo no existe → el `findByEmail` emite vacío → cadena termina → 200.
Si Brevo falla → el error se registra en el log y el flujo termina → 200.

### Otros bugs latentes detectados en la misma revisión

- `UserService.changePassword` (línea ~123): `new RuntimeException("...");` **se crea pero
  nunca se lanza** → si la contraseña actual no coincide, el código sigue y la cambia igual.
- `UserService.updateRole`: `userRepository.save(u);` sin `return` — en Reactor, si no
  devuelves el `Mono` del save, la escritura puede **no completarse nunca** (lazy).

---

## 12. Anti-patrones a vigilar (resumen rápido)

1. `.block()` / `.blockOptional()` dentro de servicios o controladores WebFlux.
2. `@Transactional` de servlet (JPA) en métodos reactivos — R2DBC tiene su propio modelo
   de transacciones reactivas.
3. Doble suscripción (bloquear y luego devolver el Mono).
4. `map` cuando la función devuelve un `Mono`/`Flux` (usar `flatMap`).
5. `orElseThrow` sobre `Mono` (no es `Optional`; usar `switchIfEmpty(Mono.error(...))`).
6. Confiar en que las consultas derivadas compilan — se validan en runtime; pruébalas.
7. Dejar `always-use-message-format: true` con mensajes que llevan apóstrofes.
8. Ignorar el `lang` del cliente y resolver el idioma solo del header `Accept-Language`.
9. Declarar `Pageable` en la firma del servicio y no pasarlo hasta la `@Query` nativa —
   la paginación NO se aplica sola.
10. Usar clientes HTTP síncronos (`RestClient`) dentro de cadenas reactivas — usar
    `WebClient`.
11. `Mono.fromRunnable` con I/O bloqueante dentro del event loop.
12. Ignorar el resultado de `repository.save(...)` (fire-and-forget reactivo): si no
    devuelves el `Mono`, la escritura puede no completarse nunca.
13. Crear una excepción con `new` y no lanzarla (bug silencioso — como el de
    `changePassword`).
14. Construir infraestructura (como `CurrencyConverter`) sin conectarla al flujo: el
    esqueleto sin uso no hace nada visible.

---

## 13. Consejos para seguir aprendiendo

- **Practica en orden:** `Mono.just` → `map` → `flatMap` → `switchIfEmpty` → `collectList`.
  Esos cinco cubren el 80 % de este proyecto.
- **Haz preguntas sobre tipos:** si un método devuelve `Mono<X>`, pregúntate qué operador
  necesitas para obtener `X`, `Mono<Y>` o `Flux<Y>`.
- **Lee el stacktrace como una cadena:** Reactor muestra el camino de suscripción completo;
  la causa suele estar en el primer "onSubscribe" después de tu repositorio.
- **Mantén un ejemplo real a la mano:** `ArtifactService.getArtifact` contiene
  `flatMap` + `collectList` + `map` + `switchIfEmpty` en 10 líneas. Es tu mejor referencia.
