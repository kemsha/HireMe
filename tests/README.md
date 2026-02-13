# HireMe Test Suite

This directory contains unit, integration, and system tests for the HireMe mobile application.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components/services
│   ├── services/           # Service layer tests
│   │   ├── postService.test.ts
│   │   └── userService.test.ts
│   └── context/            # Context tests
│       └── AuthContext.test.tsx
├── integration/            # Integration tests for feature flows
│   ├── authFlow.test.tsx
│   └── postFlow.test.tsx
├── system/                 # System/E2E tests
│   └── appFlow.test.tsx
├── setup.ts               # Test setup and mocks
├── jest.config.js         # Jest configuration
└── README.md              # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# System tests only
npm run test:system
```

## Test Types

### Unit Tests
- **Location**: `tests/unit/`
- **Purpose**: Test individual functions, services, and components in isolation
- **Examples**:
  - `postService.test.ts`: Tests for post creation, fetching, likes, applications
  - `userService.test.ts`: Tests for user profile retrieval and search
  - `AuthContext.test.tsx`: Tests for authentication context and hooks

### Integration Tests
- **Location**: `tests/integration/`
- **Purpose**: Test interactions between multiple components/services
- **Examples**:
  - `authFlow.test.tsx`: Complete authentication flow (register → sign in → sign out)
  - `postFlow.test.tsx`: Post creation and interaction flow (create → like → comment → apply)

### System Tests
- **Location**: `tests/system/`
- **Purpose**: Test complete end-to-end user journeys
- **Examples**:
  - `appFlow.test.tsx`: Complete user flows like onboarding, job application, employer management

## Test Configuration

### Jest Configuration
The Jest configuration is located in `tests/jest.config.js` and includes:
- Expo preset for React Native testing
- Setup files for mocks and test environment
- Coverage collection settings
- Module name mapping

### Setup Files
`tests/setup.ts` contains:
- Firebase mocks
- Expo module mocks
- Global test utilities
- Console error suppression for cleaner test output

## Mocking Strategy

### Firebase Mocks
All Firebase services (Auth, Firestore, Storage) are mocked to:
- Avoid actual network calls during tests
- Provide predictable test data
- Test error scenarios easily

### Component Mocks
React Navigation and Expo modules are mocked to:
- Isolate component logic
- Speed up test execution
- Avoid platform-specific dependencies

## Writing New Tests

### Unit Test Example
```typescript
import { createPost } from '../../src/services/postService';

describe('createPost', () => {
  it('should create a post with correct structure', async () => {
    // Arrange
    const postData = { /* ... */ };
    
    // Act
    const result = await createPost(postData);
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

### Integration Test Example
```typescript
describe('Authentication Flow', () => {
  it('should complete registration and sign-in', async () => {
    // Test complete flow
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock external dependencies (Firebase, Expo modules)
3. **Coverage**: Aim for good coverage of critical paths (auth, posts, user management)
4. **Naming**: Use descriptive test names that explain what is being tested
5. **Arrange-Act-Assert**: Structure tests clearly with setup, execution, and verification

## Coverage Goals

- **Unit Tests**: 80%+ coverage for services and utilities
- **Integration Tests**: Cover all major user flows
- **System Tests**: Cover critical end-to-end journeys

## Troubleshooting

### Tests not running
- Ensure all dependencies are installed: `npm install`
- Check that Jest is configured correctly in `tests/jest.config.js`

### Mock errors
- Verify mocks are set up correctly in `tests/setup.ts`
- Check that Firebase mocks match the actual Firebase API usage

### Type errors
- Ensure TypeScript types are properly imported
- Check that `@types/jest` is installed
