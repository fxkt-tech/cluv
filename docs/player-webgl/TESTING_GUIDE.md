# WebGL Player - Testing Guide

## Overview

This guide provides instructions for running tests for the WebGL Player implementation.

---

## Quick Start

### Run All Tests

```bash
cd frontend
pnpm test:run
```

### Run Tests in Watch Mode

```bash
cd frontend
pnpm test
```

### Run Tests with UI

```bash
cd frontend
pnpm test:ui
```

### Run Tests with Coverage

```bash
cd frontend
pnpm test:coverage
```

---

## Test Structure

```
frontend/app/webgl/
├── __tests__/
│   ├── math.test.ts              # Math utilities (31 tests)
│   └── geometry/
│       └── QuadGeometry.test.ts  # Quad geometry (22 tests)
```

---

## Current Test Coverage

### ✅ Completed

- **Math Utilities** (31 tests)
  - Mat4 matrix operations
  - Vec3 vector operations
  - Utility functions

- **QuadGeometry** (22 tests)
  - Constructor and configuration
  - Vertex data generation
  - Buffer management
  - Attribute binding
  - Draw operations
  - Dynamic updates
  - Resource cleanup

### 🚧 TODO

- **ShaderProgram Tests**
  - Requires WebGL mock or headless-gl
  - Compilation and linking
  - Uniform/attribute handling
  - Error handling

- **TextureManager Tests**
  - Image texture loading
  - Video texture playback
  - Cache management
  - Memory estimation

- **Integration Tests**
  - Resource lifecycle
  - Scene rendering
  - Performance benchmarks

---

## Test Configuration

### vitest.config.ts

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

## Writing Tests

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YourClass } from '../path/to/module';

describe('YourClass', () => {
  let instance: YourClass;

  beforeEach(() => {
    // Setup before each test
    instance = new YourClass();
  });

  describe('method name', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = instance.method(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Mocking WebGL Context

For WebGL-related tests, use mock contexts:

```typescript
const createMockWebGLContext = () => {
  return {
    createBuffer: vi.fn(() => ({ id: 1 })),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    // ... other methods
  } as unknown as WebGL2RenderingContext;
};

const createMockContextManager = (gl: WebGL2RenderingContext) => {
  return {
    getContext: () => gl,
    isWebGL2: () => true,
  } as WebGLContextManager;
};
```

---

## Test Results

### Latest Run (2024-12-15)

```
✅ Test Files  2 passed (2)
✅ Tests       53 passed (53)
⏱️  Duration   720ms
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: cd frontend && pnpm install
      - run: cd frontend && pnpm test:run
      - run: cd frontend && pnpm test:coverage
```

---

## Troubleshooting

### Issue: WebGL Context Not Available

**Problem:** Tests fail because WebGL is not available in jsdom.

**Solution:** Use mocked WebGL contexts for unit tests, or use headless-gl for integration tests.

### Issue: Import Errors

**Problem:** Module import errors in tests.

**Solution:** 
- Check path aliases in `vitest.config.ts`
- Verify all dependencies are installed
- Run `pnpm install` to update dependencies

### Issue: Test Timeouts

**Problem:** Tests timeout, especially for async operations.

**Solution:**
```typescript
it('should complete async operation', async () => {
  // Increase timeout if needed
  await someAsyncOperation();
}, 10000); // 10 second timeout
```

---

## Best Practices

1. **Test Isolation**
   - Each test should be independent
   - Use `beforeEach` for setup
   - Clean up resources in `afterEach`

2. **Descriptive Names**
   - Use clear test descriptions
   - Follow "should do X when Y" pattern

3. **Mock External Dependencies**
   - Mock WebGL contexts
   - Mock file system operations
   - Mock network requests

4. **Test Edge Cases**
   - Null/undefined inputs
   - Empty arrays
   - Invalid parameters
   - Error conditions

5. **Keep Tests Fast**
   - Avoid unnecessary delays
   - Mock slow operations
   - Use minimal test data

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [WebGL Testing Best Practices](https://webglfundamentals.org/webgl/lessons/webgl-testing.html)

---

## Next Steps

1. Add WebGL mock library for shader tests
2. Implement texture manager tests
3. Add integration tests for rendering pipeline
4. Set up CI/CD with test automation
5. Add performance benchmarks