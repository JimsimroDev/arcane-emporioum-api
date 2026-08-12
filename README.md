# ⬡ Arcane Emporium

API de e-commerce de artefactos mágicos: catálogo multilingüe, favoritos, autenticación por sesión y roles de usuario.

> Menos es más: este README documenta lo esencial para levantar y probar la API.

---

## 🧰 Tecnologías

| Capa | Stack |
| --- | --- |
| **Backend** | [Java 25](https://www.oracle.com/java/technologies/downloads/) · [Spring Boot 4.1](https://spring.io/projects/spring-boot) · [Spring Security](https://spring.io/projects/spring-security) · [Spring Data JPA](https://spring.io/projects/spring-data-jpa) |
| **Base de datos** | [PostgreSQL](https://www.postgresql.org/) · [Flyway](https://flywaydb.org/) |
| **Frontend** | [React 19](https://react.dev/) · [Vite 6](https://vite.dev/) · [Tailwind CSS 4](https://tailwindcss.com/) · [React Router 7](https://reactrouter.com/) |
| **Email** | [Brevo](https://www.brevo.com/) — envío de correos de recuperación de contraseña |

---

## 📋 Requisitos previos

- **Java 25+** y **Maven**
- **Node.js 20+** (para el frontend)
- **PostgreSQL** corriendo en `localhost:5432`
- Una **API key de Brevo** (solo para probar el flujo de recuperación de contraseña)

---

## 🔑 Configuración del entorno

Copia `.env.properties` en la raíz del backend con estas variables:

| Variable | Descripción |
| --- | --- |
| `NAME_DB` | Nombre de la base de datos |
| `DB_USERNAME` | Usuario de PostgreSQL |
| `DB_PASSWORD` | Contraseña de PostgreSQL |
| `BREVO_API_KEY` | **API key de Brevo** (crear en el panel de Brevo → *SMTP & API* → *API Keys*) |
| `BREVO_SENDER_EMAIL` | Email remitente verificado en Brevo |
| `BREVO_SENDER_NAME` | Nombre del remitente (ej. `Arcane Emporium`) |
| `CORS_PERMISSION` | Orígenes permitidos (ej. `http://localhost:5173`) |

> **Brevo:** el flujo de recuperación de contraseña (`POST /api/v1/forgot-password`) envía el correo con el token de reseteo a través de la API de Brevo. Sin una API key válida, ese endpoint fallará. El resto de la API funciona sin Brevo.

---

## 🚀 Ejecución

**Backend** (puerto `8080`):

```bash
cd backend
mvn spring-boot:run
```

**Frontend** (puerto `5173`):

```bash
cd frontend
npm install
npm run dev
```

Las migraciones de base de datos corren automáticamente con Flyway al arrancar el backend.

---

## 🔌 Endpoints

Base URL: `http://localhost:8080` · Idiomas: `?lang=es|en|pt` (default `es`)

### Públicos

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/v1/artifacts` | Listar artefactos (paginado) |
| `GET` | `/api/v1/artifacts/{id}` | Detalle de un artefacto |
| `GET` | `/api/v1/artifacts/category/{category}` | Artefactos por categoría (`weapon`, `scroll`, `relic`, `armor`, `potion`) |
| `GET` | `/api/v1/artifacts/search?q=` | Buscar por término |
| `GET` | `/api/v1/labels` | Etiquetas de traducción |
| `POST` | `/api/v1/register` | Registrar usuario |
| `POST` | `/api/v1/login` | Iniciar sesión |
| `POST` | `/api/v1/forgot-password` | Solicitar reset de contraseña (Brevo) |
| `POST` | `/api/v1/reset-password` | Confirmar reset con token |

### Autenticados (requieren sesión)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/v1/user` | Perfil del usuario |
| `POST` | `/api/v1/change-password` | Cambiar contraseña |
| `POST` | `/api/v1/favorites/{artifactId}` | Añadir favorito |
| `GET` | `/api/v1/favorites` | Listar favoritos (paginado) |
| `DELETE` | `/api/v1/favorites/{artifactId}` | Quitar favorito |

### Solo ADMIN

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/v1/users` | Listar usuarios (paginado) |
| `PATCH` | `/api/v1/users/{id}/role` | Actualizar rol |
| `DELETE` | `/api/v1/users/{id}` | Eliminar usuario |

> **Autenticación:** por **cookie de sesión** (`JSESSIONID`). Haz `POST /login` primero; los endpoints protegidos usan la cookie de la sesión.

---

## 🧪 Probar con Postman

Importa la colección lista para usar:

```
postman/arcane-emporium.postman_collection.json
```

Incluye los 19 endpoints agrupados (públicos, autenticados, admin) con bodies JSON y query params precargados.

---

## 📁 Estructura

```
arcane-emporium-api/
├── backend/    # Spring Boot API
├── frontend/   # React SPA
└── postman/    # Colección Postman
```
