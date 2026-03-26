# Copilot Instructions for fruit-faces

## Overview

Fruit Faces is a photo gallery app with a Java Dropwizard backend and React Flux frontend, deployed on AWS.

## Build and Test Commands

### Backend (Java/Maven)

From `server/` directory:

```bash
# Build the application (creates executable JAR)
mvn clean package

# Run the application locally
java -jar target/ff-1.0.0.jar server development.yaml

# Run with daemonization
./daemon.sh start development.yaml

# Apply database migrations
java -jar target/ff-1.0.0.jar db migrate development.yaml

# Run a single test (Maven)
mvn test -Dtest=ClassName#methodName
```

### Frontend (React/Webpack)

From `web/` directory:

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm start

# Build for production
npm run build
```

## Architecture

### Backend: Dropwizard REST API

**Key Components:**

- **Resources** (`server/src/main/java/com/moonspider/ff/*Resource.java`): JAX-RS endpoints
  - All extend `BaseResource` for shared auth, caching, and Facebook integration
  - `@Path` annotations define REST endpoints
  - EntityManager injected via constructor

- **JPA Entities** (`server/ejb-src/com/moonspider/ff/ejb/*EJB.java`): Database models
  - Named `*EJB.java` for legacy reasons (these are JPA `@Entity` classes, NOT actual EJBs)
  - Auto-scanned from `com.moonspider.ff.ejb` package
  - Use `@GeneratedValue(strategy=GenerationType.SEQUENCE)` for IDs

- **Configuration**: YAML-based (`development.yaml`, `docker.yaml`, `production.yaml`)
  - Environment variable substitution supported: `${HOME}`, `${SOME_VAR}`
  - Contains database config, Facebook app ID, file paths, etc.

**Database Access:**
- Uses JPA/OpenJPA 2.4.1 with PostgreSQL
- EntityManager obtained from `ScanningEntityManagerBundle`
- Migrations managed via Dropwizard migrations bundle
- SQL migration files run with `db migrate` command

**Build System:**
- Maven shade plugin bundles everything into single executable JAR
- Git commit info embedded in `build-info.json` at build time
- `ejb-src/` directory added as additional source root via build-helper-maven-plugin

### Frontend: React + Flux

**Flux Pattern Implementation:**

1. **Actions** (`web/src/actions/FFActions.js`): Action creators that dispatch events
2. **Dispatcher** (`web/src/dispatcher/AppDispatcher.js`): Central event bus (singleton)
3. **Stores** (`web/src/stores/*Store.js`): EventEmitter-based state containers
   - Register with dispatcher using `dispatchToken = AppDispatcher.register(callback)`
   - Emit `change` events when state updates
   - Components call `Store.addChangeListener()` in `componentDidMount()`
4. **Components** (`web/src/components/*.jsx`): React views that listen to stores

**Data Flow:**
```
User Action → FFActions.methodName() → AppDispatcher.dispatch({actionType, data})
→ Store._onChange() → Store.emitChange() → Component listener
→ Component.setState() + re-render → API call via browser-request
```

**API Communication:**
- Uses `browser-request` library (not fetch/axios)
- Backend REST API called from action creators or components
- Base URL configured via `assetUrlPrefix` in backend config

## Key Conventions

### Backend

- **Resource naming**: `*Resource.java` for REST endpoints
- **Entity naming**: `*EJB.java` in `ejb-src/` (despite name, these are JPA entities)
- **Configuration**: Store env-specific config in YAML files (`development.yaml`, `production.yaml`)
- **User caching**: BaseResource caches Facebook user lookups for 5 minutes (Guava Cache)
- **Facebook integration**: Uses Retrofit2 client in BaseResource

### Frontend

- **File extensions**: `.jsx` for React components, `.js` for utilities/stores
- **Flux stores**: Extend EventEmitter pattern, not Redux
- **Component structure**: Functional components in `web/src/components/`
- **No test framework**: Tests directory exists but no testing framework is configured

### General

- **Image processing**: Multiple resize strategies in `server/src/main/java/com/moonspider/ff/util/*Resizer.java`
- **Thumbnails**: Stored in `web/thumbs/` directory (configurable via `thumbDir` in YAML)
- **Deployment**: Docker-based with single-stage build (see `server/Dockerfile`)

## File Structure Notes

- `server/ejb-src/`: JPA entities (confusing name for historical reasons)
- `server/src/main/java/`: Application code (Resources, services, utilities)
- `web/src/`: React application source
- `scripts/`: Deployment and utility scripts (Python/Bash)
- `tagger/`: Python ML service for image tagging (separate microservice)

## Configuration Files

- `server/development.yaml`: Local development config (uses localhost DB)
- `server/production.yaml`: Production config (uses prod DB, secrets)
- `server/docker.yaml`: Docker container config
- `web/webpack.config.js`: Frontend build configuration
