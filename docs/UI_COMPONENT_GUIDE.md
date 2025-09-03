# Cannafriend UI Component Guide

## Overview

This guide provides comprehensive patterns and conventions for creating mobile-first, responsive UI components in the Cannafriend application. The app uses a sophisticated responsive design system that adapts seamlessly between mobile and desktop experiences.

## Core Design Principles

### 1. Mobile-First Approach

- Design and build for mobile devices first
- Progressive enhancement for larger screens
- Touch-friendly interfaces with adequate tap targets (minimum 44px)
- Thumb-zone optimization for bottom navigation

### 2. Responsive Breakpoints

```css
/* Tailwind CSS breakpoints used in the app */
sm: 640px   /* Small tablets */
md: 768px   /* Desktop/tablet threshold */
lg: 1024px  /* Large desktop */
xl: 1280px  /* Extra large screens */
2xl: 1536px /* Ultra-wide screens */
```

### 3. Layout Strategy

- **Mobile**: Single column, bottom navigation, full-width cards
- **Desktop**: Sidebar navigation, multi-column layouts, constrained content width

## Layout Components

### Main Layout Structure (`components/layout/index.tsx`)

The app uses a unified layout component that handles both mobile and desktop experiences:

```tsx
// Mobile-first layout with responsive sidebar
<div className="flex min-h-screen bg-background">
  {/* Desktop Sidebar - Hidden on mobile */}
  <aside className="hidden md:flex w-64 flex-col border-r bg-card">
    {/* Sidebar content */}
  </aside>

  {/* Main Content Area */}
  <div className="flex flex-1 flex-col">
    {/* Mobile Header - Hidden on desktop */}
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
      {/* Mobile header content */}
    </header>

    {/* Page Content */}
    <main className="flex-1 overflow-auto p-4 pb-24 md:pb-6 md:p-6">
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>

    {/* Mobile Bottom Navigation */}
    <MobileBottomNav />
  </div>
</div>
```

### Navigation Patterns

#### Mobile Bottom Navigation (`components/navigation/mobile-bottom-nav.tsx`)

- Fixed bottom position with safe area support
- 5-slot grid layout with floating center action button
- Role-based navigation items
- Elevated design with backdrop blur

```tsx
// Mobile bottom nav structure
<nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur">
  <div className="grid grid-cols-5 items-center px-4 py-2">
    {/* Navigation slots */}
    <Link className="flex h-12 flex-col items-center justify-center">
      <Home className="h-5 w-5" />
    </Link>
    {/* Center floating action button */}
    <button className="-translate-y-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary">
      <Plus className="h-7 w-7" />
    </button>
  </div>
</nav>
```

#### Desktop Sidebar Navigation

- Fixed left sidebar with logo and navigation links
- Collapsible sections based on user roles
- Premium feature highlighting with gradient styling

## Component Patterns

### Card Components

#### Base Card Structure (`components/ui/card.tsx`)

The app uses a sophisticated card system with multiple variants:

```tsx
// Base card with modern styling
function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  );
}
```

#### Plant Card (`components/plant/plant-card.tsx`)

Feature-rich card with image, metadata, and responsive layouts:

```tsx
// Responsive plant card with image and details
<Card className="group overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5">
  {/* Responsive image container */}
  <div className="relative aspect-[4/3] sm:aspect-video">
    <Image src={plant.coverPhoto} fill className="object-cover" />

    {/* Overlay with gradient */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

    {/* Content overlay */}
    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
      <h3 className="text-white text-lg font-semibold drop-shadow">
        {plant.name}
      </h3>
      <Badge className="bg-white/90 text-black backdrop-blur-sm">
        {plant.seedType}
      </Badge>
    </div>
  </div>

  {/* Card content - hidden in compact mode */}
  {!compact && (
    <>
      <CardContent className="pb-2">{/* Plant metadata */}</CardContent>
      <CardFooter className="pt-0 text-xs text-muted-foreground">
        {/* Last action details */}
      </CardFooter>
    </>
  )}
</Card>
```

### Grid Systems

#### Responsive Grid Patterns

```tsx
// Dashboard widgets - 1 column mobile, 2 columns desktop
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Widget cards */}
</div>

// Plant grid - 1 column mobile, 2 medium, 3 large
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Plant cards */}
</div>

// Journal layout - stacked mobile, sidebar + content desktop
<div className="grid gap-6 md:grid-cols-[320px_1fr]">
  <Card className="md:sticky md:top-4 h-fit">
    {/* Filters sidebar */}
  </Card>
  <Card>
    {/* Content area */}
  </Card>
</div>
```

### Form Components

#### Mobile-Optimized Forms

- Large touch targets
- Proper input types for mobile keyboards
- Floating labels and inline validation
- Responsive date pickers

```tsx
// Mobile date picker component
<MobileDatePicker
  selected={selectedDate}
  onSelect={setSelectedDate}
  locale={getCalendarLocale()}
/>
```

### Modal and Dialog Patterns

#### Responsive Modals

```tsx
// Dialog that adapts to screen size
<Dialog>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle>{t("journal.addLog")}</DialogTitle>
    </DialogHeader>
    {/* Form content */}
  </DialogContent>
</Dialog>
```

## Mobile-Specific Patterns

### Touch Interactions

- Minimum 44px tap targets
- Hover states that work on touch devices
- Swipe gestures for navigation (where applicable)
- Long press for context actions

### Mobile Header Pattern

```tsx
<header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
  <Link href={homeHref} className="flex items-center gap-2 font-semibold">
    <Logo size={20} className="text-primary" />
    <span className="text-xl">{t("app.name")}</span>
  </Link>
  <div className="ml-auto flex items-center gap-2">
    <ThemeToggle />
    <LanguageSwitcher />
  </div>
</header>
```

### Safe Area Handling

```tsx
// Bottom navigation with safe area support
<nav style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
  {/* Navigation content */}
</nav>
```

## Desktop-Specific Patterns

### Sidebar Navigation

- Fixed width (256px) with logo and full navigation
- Persistent across all pages
- Role-based menu items
- Sign out action at bottom

### Multi-Column Layouts

```tsx
// Desktop dashboard with responsive columns
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Widgets arranged in columns on large screens */}
</div>
```

### Hover States and Transitions

```tsx
// Card with desktop hover effects
<Card className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5">
  {/* Card content */}
</Card>
```

## Styling Conventions

### Color System

- Uses CSS custom properties for theming
- Dark/light mode support via `next-themes`
- Semantic color names (`primary`, `secondary`, `muted-foreground`)

### Typography Scale

- Consistent heading hierarchy (`text-3xl font-bold` for page titles)
- Responsive font sizes
- Proper contrast ratios

### Spacing System

- Consistent gap and padding using Tailwind's spacing scale
- Responsive spacing (`p-4 md:p-6`)

### Border Radius

- Consistent rounding (`rounded-xl` for cards, `rounded-md` for buttons)
- More rounded corners on mobile for better touch interaction

## Animation and Transitions

### Micro-Interactions

```tsx
// Subtle animations for better UX
<Card className="transition-all hover:shadow-lg hover:-translate-y-0.5">
```

### Loading States

```tsx
// Animated logo for loading states
<AnimatedLogo size={32} className="text-primary" duration={1.5} />
```

### Page Transitions

- Smooth transitions between routes
- Skeleton screens for loading states

## Accessibility

### Touch Targets

- Minimum 44px touch targets on mobile
- Adequate spacing between interactive elements

### Focus Management

- Visible focus indicators
- Proper tab order
- Screen reader friendly labels

### Color Contrast

- WCAG AA compliance
- Works in both light and dark themes

## Performance Considerations

### Image Optimization

```tsx
// Optimized image loading with Next.js
<Image
  src={plant.coverPhoto}
  alt={`${plant.name} - ${t("plantCard.coverPhoto")}`}
  fill
  className="object-cover"
  loading="lazy"
/>
```

### Code Splitting

- Route-based code splitting with Next.js App Router
- Dynamic imports for heavy components

### Responsive Images

- Different aspect ratios for mobile vs desktop
- Proper image sizing and lazy loading

## Implementation Guidelines

### Creating New Components

1. **Start Mobile-First**

   ```tsx
   // Base mobile styles first
   <div className="p-4 md:p-6">{/* Content */}</div>
   ```

2. **Add Responsive Behavior**

   ```tsx
   // Progressive enhancement for larger screens
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
     {/* Items */}
   </div>
   ```

3. **Handle Navigation Context**

   ```tsx
   // Consider both mobile and desktop navigation
   const { roles } = useUserRoles();
   // Render appropriate navigation items
   ```

4. **Optimize Touch Interactions**
   ```tsx
   // Ensure touch targets are large enough
   <button className="h-12 px-4 text-sm">{/* Button content */}</button>
   ```

### Testing Responsive Design

1. **Mobile Testing**

   - Test on actual devices
   - Use browser dev tools for various screen sizes
   - Check touch interactions and scrolling

2. **Desktop Testing**

   - Verify sidebar navigation works
   - Test hover states
   - Check multi-column layouts

3. **Cross-Device Testing**
   - Ensure consistent experience
   - Test state persistence across device switches

## Component Library Structure

### Base UI Components (`components/ui/`)

- Built on Radix UI primitives
- Consistent styling with shadcn/ui
- Fully responsive and accessible

### Feature Components

- `components/plant/` - Plant-specific components
- `components/auth/` - Authentication components
- `components/journal/` - Journal and logging components
- `components/navigation/` - Navigation components

### Layout Components

- `components/layout/` - Main layout wrapper
- `components/marketing/` - Landing page components

This guide provides a comprehensive foundation for building consistent, responsive UI components that work seamlessly across all devices in the Cannafriend application.
