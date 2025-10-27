# Plan: Reusable Logger Module for pumped-fn

Based on the pumped-fn skill, this plan outlines building a reusable logger module following Pattern 1 (Reusable Resource with Configurable Backends).

## Architecture Overview

The logger will be:
- **Generic and reusable** - Configurable via tags, multiple backends
- **Observable** - Uses pumped-fn patterns for dependency injection
- **Testable** - All backends exported for preset() testing
- **Framework-agnostic** - Works in any environment (HTTP, CLI, Lambda, React)
- **Optional dependencies** - Lazy loading via dynamic imports

## Implementation Steps

### 1. Define Logger Interface
- Create clear contract for logging operations
- Methods: `info()`, `warn()`, `error()`, `debug()`
- Support structured logging with metadata
- Type-safe message and context parameters

### 2. Create Configuration Tags
- `logConfig.backend` - Select logger implementation ('console', 'winston', 'pino')
- `logConfig.level` - Set log level ('debug', 'info', 'warn', 'error')
- `logConfig.format` - Output format ('json', 'pretty', 'simple')
- Defaults for all tags to ensure zero-config usage

### 3. Implement Console Backend
- Use `provide()` - no external dependencies
- Read config via `tag.find(scope)`
- Leverage built-in console methods
- Support structured output

### 4. Implement Winston Backend
- Use `provide()` with async factory
- Dynamic import of 'winston' package
- Read config from scope tags
- Configure transports based on format tag

### 5. Implement Pino Backend
- Use `provide()` with async factory
- Dynamic import of 'pino' package
- Read config from scope tags
- Fast JSON logging

### 6. Create Main Logger Selector
- Use `derive()` with all backends as `.lazy` dependencies
- Read `logConfig.backend` tag
- Resolve only selected backend
- Return unified Logger interface

### 7. Export Structure
- Export Logger interface (contract)
- Export logConfig tags (consumer control)
- Export main logger executor (primary API)
- Export individual backends (REQUIRED for preset() testing)
- Follow Pattern 3 composition requirements

### 8. Create Test Suite
- Test each backend independently
- Test tag-based configuration
- Test preset() mocking for consumers
- Test lazy loading (verify only selected backend loads)
- Test default values

### 9. Create Usage Examples
- Basic console logging
- Production setup with winston
- High-performance setup with pino
- Testing with preset()
- Integration with flows

### 10. Documentation
- Only if explicitly requested by user
- API reference
- Configuration guide
- Testing patterns
- Migration examples

## Key Design Decisions

**Component Type**: Resource (Decision Tree 1)
- External system integration (console, winston, pino backends)

**API Selection**: provide() for backends, derive() for selector (Decision Tree 2)
- Backends are standalone (provide)
- Main logger depends on backends (derive)

**Configuration**: Tags (Decision Tree 6)
- Runtime configuration (environment-dependent)
- Varies between deployments

**Testing**: preset() for mocking (Decision Tree 8)
- All backends exported for consumer testing
- Mock at resource boundary

## File Structure

```
logger/
├── index.ts              # Main exports
├── interface.ts          # Logger interface + types
├── config.ts             # Configuration tags
├── backend-console.ts    # Console implementation
├── backend-winston.ts    # Winston implementation
├── backend-pino.ts       # Pino implementation
├── logger.ts             # Main selector
└── logger.test.ts        # Test suite
```

## Validation Checklist

- [ ] All code typechecks with zero errors
- [ ] Interface exported (contract)
- [ ] Config tags exported (consumer control)
- [ ] Backends read config via `tag.find(scope)`
- [ ] Main executor exported (primary API)
- [ ] Individual backends exported (for preset())
- [ ] No `any`, `unknown`, or casting
- [ ] No comments in code
- [ ] Dynamic imports for optional deps
- [ ] `.lazy` + `resolve()` pattern used
- [ ] Complete, runnable examples
- [ ] All tests pass
