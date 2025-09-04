# Error Handling Standards

This document outlines the standardized error handling patterns used throughout the CannaFriend application.

## Overview

The application uses a centralized error handling approach through the `useErrorHandler` hook, which provides consistent error messaging, logging, and user notifications.

## Error Handler Hook

### Import
```typescript
import { useErrorHandler } from "@/hooks/use-error-handler";
```

### Usage
```typescript
const { handleError, handleFirebaseError, handleValidationError } = useErrorHandler();
```

## Error Handling Methods

### 1. General Error Handler
For generic errors or API errors:

```typescript
try {
  // Some operation
} catch (error: any) {
  handleError(error, {
    showToast: true, // default
    fallbackMessage: "Custom fallback message" // optional
  });
}
```

### 2. Firebase Error Handler
For Firebase Authentication and Firestore errors:

```typescript
try {
  // Firebase operation
} catch (error: any) {
  handleFirebaseError(error, "context description"); // context is optional
}
```

### 3. Validation Error Handler
For form validation errors:

```typescript
try {
  // Validation operation
} catch (errors: any[]) {
  handleValidationError(errors, "form context"); // context is optional
}
```

## Supported Firebase Error Codes

The `handleFirebaseError` method automatically handles these error codes with appropriate user-friendly messages:

### Authentication Errors
- `auth/user-not-found` - User account doesn't exist
- `auth/wrong-password` - Incorrect password
- `auth/email-already-in-use` - Email already registered
- `auth/weak-password` - Password doesn't meet requirements
- `auth/invalid-email` - Invalid email format
- `auth/too-many-requests` - Rate limit exceeded
- `auth/network-request-failed` - Network connectivity issue

### Firestore Errors
- `permission-denied` - User lacks required permissions
- `unavailable` - Service temporarily unavailable
- `not-found` - Document or collection not found

## Standard Patterns

### Pattern 1: Basic Operation with Error Handling
```typescript
const handleSomeOperation = async () => {
  try {
    setIsLoading(true);
    const result = await someFirebaseOperation();
    // Handle success
  } catch (error: any) {
    handleFirebaseError(error, "operation context");
  } finally {
    setIsLoading(false);
  }
};
```

### Pattern 2: Form Submission with Field Clearing
```typescript
const onSubmit = async (data: FormData) => {
  try {
    setIsLoading(true);
    const result = await submitForm(data);
    onSuccess?.();
  } catch (error: any) {
    // Handle specific field clearing for certain errors
    if (error?.code === "auth/wrong-password") {
      setValue("password", "");
    } else if (error?.code === "auth/user-not-found") {
      setValue("email", "");
    }
    
    handleFirebaseError(error, "form submission");
  } finally {
    setIsLoading(false);
  }
};
```

### Pattern 3: Silent Error Handling (No Toast)
```typescript
try {
  // Operation that might fail silently
  const result = await optionalOperation();
} catch (error: any) {
  // Log error but don't show toast
  handleError(error, { showToast: false });
  // Handle gracefully
}
```

## Migration Guidelines

When updating existing error handling code:

1. **Import the hook**: Add `useErrorHandler` import
2. **Initialize the hook**: Extract the handler functions in the component
3. **Replace manual toast calls**: Replace manual error toasts with handler calls
4. **Preserve specific behavior**: Keep any specific error handling logic (like field clearing)
5. **Add context**: Provide meaningful context strings for better debugging

### Before (Manual Error Handling)
```typescript
} catch (error: any) {
  toast({
    variant: "destructive",
    title: "Error",
    description: error.message || "Something went wrong",
  });
}
```

### After (Standardized Error Handling)
```typescript
} catch (error: any) {
  handleFirebaseError(error, "specific context");
}
```

## Translation Keys

Error messages use these translation namespaces and keys:

- `common.error` - Generic error title
- `common.unknownError` - Fallback error message
- `auth.*` - Authentication-related errors
- `firebase.*` - Firebase service errors
- `validation.*` - Form validation errors

## Benefits

1. **Consistency**: All error messages follow the same format and styling
2. **Maintainability**: Central location for error handling logic
3. **Debugging**: Automatic error logging with context information
4. **Internationalization**: Automatic translation support
5. **User Experience**: User-friendly error messages instead of technical errors

## Best Practices

1. Always provide context when calling error handlers
2. Use specific error handlers (Firebase, Validation) when applicable
3. Preserve important business logic (like field clearing) alongside error handling
4. Don't catch and re-throw errors unless necessary
5. Test error scenarios to ensure proper user experience

## Error Logging

All errors are automatically logged to the console with:
- Original error object
- Context information
- Timestamp (implicit in console.error)

For production applications, consider integrating with error tracking services like Sentry or LogRocket.