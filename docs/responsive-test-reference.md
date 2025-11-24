# Responsive Test Page - Reference

## Purpose

This page was used during development to test responsive breakpoints and ensure the application adapts correctly across different screen sizes.

## Breakpoints Reference

### Tailwind CSS Breakpoints

- **Mobile**: `0 - 639px` (default, no prefix)
- **Small Tablet**: `sm: 640px - 767px`
- **Tablet**: `md: 768px - 1023px`
- **Desktop**: `lg: 1024px - 1279px`
- **Large Desktop**: `xl: 1280px - 1535px`
- **XL Desktop**: `2xl: ≥ 1536px`

## Key Features Tested

### 1. Live Window Size Detection

```tsx
const [windowWidth, setWindowWidth] = useState(0);
const [breakpoint, setBreakpoint] = useState("");

useEffect(() => {
  const handleResize = () => {
    const width = window.innerWidth;
    setWindowWidth(width);

    if (width < 640) setBreakpoint("Mobile (< 640px)");
    else if (width < 768) setBreakpoint("Small Tablet (640-767px)");
    else if (width < 1024) setBreakpoint("Tablet (768-1023px)");
    else if (width < 1280) setBreakpoint("Desktop (1024-1279px)");
    else if (width < 1536) setBreakpoint("Large Desktop (1280-1535px)");
    else setBreakpoint("XL Desktop (≥ 1536px)");
  };

  handleResize();
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

### 2. Responsive Grid Test

Demonstrates how grids adapt across breakpoints:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {/* Grid items */}
</div>
```

- **Mobile**: 1 column
- **Small**: 2 columns
- **Medium**: 3 columns
- **Large**: 4 columns

### 3. Visibility Testing

Shows/hides elements based on screen size:

```tsx
{
  /* Mobile only */
}
<p className="sm:hidden">✓ Visible on mobile</p>;

{
  /* Desktop and up */
}
<p className="hidden md:block">✓ Visible on desktop and up</p>;
```

## Testing Instructions

1. **Browser DevTools**: Use responsive mode to test different sizes
2. **Contrast Check**: Verify all colors have proper contrast in both themes
3. **Grid Layouts**: Check grid layouts adapt correctly at each breakpoint
4. **Visibility**: Test visibility badges show/hide at correct widths

## Common Responsive Patterns

### Hide on Mobile

```tsx
<div className="hidden md:block">Desktop only</div>
```

### Hide on Desktop

```tsx
<div className="md:hidden">Mobile only</div>
```

### Responsive Padding

```tsx
<div className="p-4 md:p-6 lg:p-8">Adaptive padding</div>
```

### Responsive Text Size

```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">Responsive heading</h1>
```

## Why This Page Was Removed

This page was useful during development but should not be accessible in production as it:

- Exposes internal design system details
- Provides no value to end users
- Could be accessed by anyone without authentication

## Recreating for Development

If you need to test responsive behavior again, you can:

1. Create a temporary page in `/app/dev-test/responsive/page.tsx`
2. Add middleware to protect it with authentication
3. Use browser DevTools responsive mode
4. Delete after testing is complete
