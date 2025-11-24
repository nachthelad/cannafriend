# Design System Test Page - Reference

## Purpose

This page was used during development to test and showcase all design system components, ensuring consistency across light and dark themes.

## Components Tested

### 1. Color System

The application uses a comprehensive color palette:

```tsx
// Primary colors
- primary: Sage green theme color
- secondary: Secondary accent
- accent: Tertiary accent
- muted: Subtle backgrounds

// Semantic colors
- success: Green for positive actions
- warning: Yellow/orange for caution
- destructive: Red for dangerous actions
- info: Blue for informational content
```

### 2. Button Variants

```tsx
// Variants
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="success">Success</Button>
<Button variant="warning">Warning</Button>
<Button variant="destructive">Destructive</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus /></Button>
<Button size="icon-sm"><Plus /></Button>
<Button size="icon-lg"><Plus /></Button>
```

### 3. Card Variants

```tsx
// Default card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Variants
<Card variant="elevated">Elevated shadow</Card>
<Card variant="interactive">Clickable with hover</Card>
<Card variant="glass">Glassmorphism effect</Card>
```

### 4. DataCard Component

```tsx
<DataCard
  label="Total Plants"
  value={24}
  icon={Leaf}
  color="success"
  trend="up"
  trendValue="+3 this week"
/>
```

**Props:**

- `label`: Display label
- `value`: Numeric or string value
- `icon`: Lucide icon component
- `color`: "default" | "success" | "warning" | "destructive"
- `trend`: "up" | "down" (optional)
- `trendValue`: Trend description (optional)

### 5. Badge Variants

```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Destructive</Badge>
```

### 6. Loading States

```tsx
// Card skeleton
<LoadingState variant="card" />

// List skeleton
<LoadingState variant="list" count={3} />

// Grid skeleton
<LoadingState variant="grid" count={3} />
```

### 7. Empty State

```tsx
<EmptyState
  icon={Leaf}
  title="No plants yet"
  description="Start your growing journey by adding your first plant"
  action={{
    label: "Add Plant",
    onClick: () => {},
    icon: Plus,
  }}
/>
```

## Typography Scale

```tsx
<h1 className="text-4xl font-bold">Heading 1</h1>
<h2 className="text-3xl font-bold">Heading 2</h2>
<h3 className="text-2xl font-semibold">Heading 3</h3>
<h4 className="text-xl font-semibold">Heading 4</h4>
<p className="text-base">Body text</p>
<p className="text-sm text-muted-foreground">Secondary text</p>
```

## Testing Checklist

- [ ] Toggle between light and dark mode
- [ ] Verify all colors have proper contrast
- [ ] Check sage green theme is visible in primary elements
- [ ] Hover over interactive elements to see transitions
- [ ] Verify loading skeletons match design system
- [ ] Test on different screen sizes

## Design System Files

### Component Locations

- **Buttons**: `/components/ui/button.tsx`
- **Cards**: `/components/ui/card.tsx`
- **Badges**: `/components/ui/badge.tsx`
- **DataCard**: `/components/common/data-card.tsx`
- **EmptyState**: `/components/common/empty-state.tsx`
- **LoadingState**: `/components/common/loading-state.tsx`

### Theme Configuration

- **Colors**: `/app/globals.css` (CSS variables)
- **Tailwind**: `/tailwind.config.ts`

## Why This Page Was Removed

This page was useful during development but should not be accessible in production as it:

- Exposes internal design system implementation
- Provides no value to end users
- Could be accessed by anyone without authentication
- Increases bundle size unnecessarily

## Recreating for Development

If you need to test the design system again:

1. Create a protected development route
2. Add authentication middleware
3. Use Storybook or similar tool for component testing
4. Reference this documentation for component examples

## Alternative: Storybook

Consider using Storybook for component development and testing:

```bash
npx storybook@latest init
```

This provides a better isolated environment for component testing without exposing pages in production.
