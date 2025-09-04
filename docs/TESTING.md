# Testing Guide

This guide covers how to write and run tests in the Cannafriend project using Jest and React Testing Library.

## Overview

The project uses a modern testing stack:
- **Jest 30.x** - Testing framework and test runner
- **React Testing Library** - React component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM elements
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - DOM environment for Node.js testing

## Quick Start

```bash
# Run all tests
npm run test

# Run tests in watch mode (great for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are located in the `__tests__` directory and follow this structure:

```
__tests__/
├── components/           # Component tests
├── utils.test.ts        # Utility function tests
├── hooks/               # Custom hook tests (when created)
└── pages/               # Page component tests (when created)
```

## Writing Tests

### 1. Utility Function Tests

For testing pure functions and utilities:

```typescript
// __tests__/utils.test.ts
import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should combine class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional')
      expect(cn('base', false && 'conditional')).toBe('base')
    })
  })
})
```

### 2. React Component Tests

For testing React components:

```typescript
// __tests__/components/my-component.test.tsx
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/my-component'

describe('MyComponent', () => {
  it('renders with default props', () => {
    render(<MyComponent />)
    
    const element = screen.getByRole('button')
    expect(element).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    const { user } = render(<MyComponent onClick={mockFn} />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})
```

### 3. Testing Components with Props

```typescript
it('renders with custom props', () => {
  render(<AnimatedLogo size={32} className="custom-class" />)
  
  const logo = screen.getByRole('img')
  expect(logo).toHaveAttribute('width', '32')
  expect(logo).toHaveClass('custom-class')
})
```

### 4. Testing User Interactions

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('handles form submission', async () => {
  const user = userEvent.setup()
  const mockSubmit = jest.fn()
  
  render(<MyForm onSubmit={mockSubmit} />)
  
  const input = screen.getByRole('textbox')
  const button = screen.getByRole('button', { name: /submit/i })
  
  await user.type(input, 'test value')
  await user.click(button)
  
  expect(mockSubmit).toHaveBeenCalledWith('test value')
})
```

## Common Testing Patterns

### Finding Elements

```typescript
// By role (preferred)
screen.getByRole('button', { name: /submit/i })
screen.getByRole('textbox', { name: /email/i })

// By label text
screen.getByLabelText(/email address/i)

// By placeholder
screen.getByPlaceholderText(/enter your email/i)

// By test ID (when other methods don't work)
screen.getByTestId('custom-element')

// By text content
screen.getByText(/welcome to cannafriend/i)
```

### Async Testing

```typescript
// Wait for element to appear
await screen.findByText(/loading complete/i)

// Wait for element to disappear
await waitForElementToBeRemoved(screen.getByText(/loading/i))

// Wait for assertion
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument()
})
```

### Mocking Functions

```typescript
// Mock a function
const mockFunction = jest.fn()

// Mock with return value
const mockFunction = jest.fn().mockReturnValue('mocked result')

// Mock with resolved promise
const mockAsyncFunction = jest.fn().mockResolvedValue({ data: 'test' })

// Check if function was called
expect(mockFunction).toHaveBeenCalled()
expect(mockFunction).toHaveBeenCalledTimes(2)
expect(mockFunction).toHaveBeenCalledWith('expected argument')
```

## Pre-configured Mocks

The testing environment includes several pre-configured mocks:

### Next.js Navigation
```typescript
// useRouter and useSearchParams are automatically mocked
// No additional setup needed in individual tests
```

### Firebase
```typescript
// Firebase auth and database are mocked
// auth.currentUser returns null by default
// You can override in individual tests if needed
```

### react-i18next
```typescript
// Translation function returns the key by default
// t('hello.world') returns 'hello.world'
```

### Browser APIs
```typescript
// IntersectionObserver, ResizeObserver, and matchMedia are mocked
// No setup needed for components that use these APIs
```

## Testing Best Practices

### 1. Test Behavior, Not Implementation
```typescript
// ❌ Bad - testing implementation details
expect(component.state.isVisible).toBe(true)

// ✅ Good - testing user-observable behavior
expect(screen.getByText('Welcome')).toBeVisible()
```

### 2. Use Semantic Queries
```typescript
// ❌ Bad - fragile and not accessible
screen.getByTestId('submit-button')

// ✅ Good - semantic and accessible
screen.getByRole('button', { name: /submit/i })
```

### 3. Test User Interactions
```typescript
// ❌ Bad - calling component methods directly
component.handleClick()

// ✅ Good - simulating user interactions
await user.click(screen.getByRole('button'))
```

### 4. Use Descriptive Test Names
```typescript
// ❌ Bad
it('should work', () => {})

// ✅ Good
it('displays error message when form validation fails', () => {})
```

### 5. Arrange, Act, Assert Pattern
```typescript
it('calculates total price correctly', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }]
  
  // Act
  const total = calculateTotal(items)
  
  // Assert
  expect(total).toBe(30)
})
```

## Testing Components with Context

For components that use React context (themes, i18n, etc.):

```typescript
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { MyComponent } from '@/components/my-component'

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light">
      {ui}
    </ThemeProvider>
  )
}

describe('MyComponent', () => {
  it('renders with theme context', () => {
    renderWithTheme(<MyComponent />)
    expect(screen.getByText('Themed content')).toBeInTheDocument()
  })
})
```

## Coverage Reports

Generate coverage reports to see what code is tested:

```bash
npm run test:coverage
```

This creates a `coverage/` directory with detailed HTML reports showing:
- Line coverage
- Branch coverage  
- Function coverage
- Statement coverage

## Configuration

### Jest Configuration (`jest.config.js`)
- **Next.js integration** - Uses `next/jest` for seamless Next.js support
- **Path mapping** - `@/` alias works in tests
- **Test environment** - jsdom for DOM testing
- **Coverage collection** - From app, components, lib, and hooks directories

### Test Setup (`jest.setup.js`)
- **Global test utilities** - @testing-library/jest-dom matchers
- **Mocks** - Pre-configured mocks for Next.js, Firebase, and browser APIs
- **Environment setup** - DOM polyfills and global objects

## Debugging Tests

### Running Specific Tests
```bash
# Run tests matching a pattern
npm run test -- --testNamePattern="AnimatedLogo"

# Run tests in a specific file
npm run test -- __tests__/components/animated-logo.test.tsx

# Run tests in watch mode with coverage
npm run test:watch -- --coverage
```

### Using Console Logs
```typescript
it('debugs component state', () => {
  render(<MyComponent />)
  
  // Debug what's rendered
  screen.debug()
  
  // Debug specific element
  screen.debug(screen.getByRole('button'))
})
```

### VS Code Integration
Install the "Jest" VS Code extension for:
- Inline test results
- Run/debug individual tests
- Coverage highlighting

## Common Testing Scenarios

### Testing Forms
```typescript
it('submits form with valid data', async () => {
  const user = userEvent.setup()
  const mockSubmit = jest.fn()
  
  render(<ContactForm onSubmit={mockSubmit} />)
  
  await user.type(screen.getByLabelText(/name/i), 'John Doe')
  await user.type(screen.getByLabelText(/email/i), 'john@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(mockSubmit).toHaveBeenCalledWith({
    name: 'John Doe',
    email: 'john@example.com'
  })
})
```

### Testing API Calls
```typescript
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.get('/api/plants', (req, res, ctx) => {
    return res(ctx.json({ plants: [] }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Testing Error States
```typescript
it('displays error message when API fails', async () => {
  const mockFetch = jest.fn().mockRejectedValue(new Error('API Error'))
  
  render(<PlantsList fetchPlants={mockFetch} />)
  
  await waitFor(() => {
    expect(screen.getByText(/error loading plants/i)).toBeInTheDocument()
  })
})
```

## Tips for Success

1. **Start simple** - Begin with basic component rendering tests
2. **Test user flows** - Focus on what users actually do
3. **Mock external dependencies** - Keep tests isolated and fast
4. **Use meaningful assertions** - Test the right things
5. **Keep tests maintainable** - Avoid testing implementation details
6. **Run tests frequently** - Use watch mode during development

## Resources

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [User Event API](https://testing-library.com/docs/user-event/intro)

## Getting Help

If you're stuck with testing:
1. Check the existing test examples in `__tests__/`
2. Review this documentation
3. Check the Jest/React Testing Library docs
4. Look for similar patterns in the codebase

Remember: Good tests give you confidence to refactor and add new features! 🧪✅