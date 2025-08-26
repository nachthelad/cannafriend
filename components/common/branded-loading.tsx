"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import { AnimatedLogo } from "./animated-logo";

interface BrandedLoadingProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal" | "with-text";
  text?: string;
  className?: string;
}

/**
 * Branded loading component with different variants and sizes
 * Uses the animated logo for consistent brand experience
 */
export function BrandedLoading({
  size = "md",
  variant = "default",
  text,
  className,
}: BrandedLoadingProps) {
  const sizeConfig = {
    sm: {
      logoSize: 24,
      textClass: "text-sm",
      containerClass: "gap-2 py-2",
    },
    md: {
      logoSize: 32,
      textClass: "text-base",
      containerClass: "gap-3 py-4",
    },
    lg: {
      logoSize: 48,
      textClass: "text-lg",
      containerClass: "gap-4 py-6",
    },
  };

  const config = sizeConfig[size];

  if (variant === "minimal") {
    return (
      <div className={cn("flex justify-center", className)}>
        <AnimatedLogo 
          size={config.logoSize} 
          className="text-primary" 
          duration={1.5} 
        />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center",
      config.containerClass,
      className
    )}>
      <AnimatedLogo 
        size={config.logoSize} 
        className="text-primary mb-2" 
        duration={1.5} 
      />
      {(text || variant === "with-text") && (
        <p className={cn(
          "text-muted-foreground font-medium",
          config.textClass
        )}>
          {text || "Cargando..."}
        </p>
      )}
    </div>
  );
}

interface ButtonLoadingProps {
  children: React.ReactNode;
  isLoading: boolean;
  loadingText?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
}

/**
 * Button with integrated loading state using branded animation
 */
export function ButtonWithLoading({
  children,
  isLoading,
  loadingText,
  size = "md",
  disabled,
  className,
  onClick,
  variant = "default",
  ...props
}: ButtonLoadingProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  
  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-11 px-8 text-lg",
  };

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  const logoSize = size === "sm" ? 16 : size === "lg" ? 20 : 18;

  return (
    <button
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <AnimatedLogo size={logoSize} duration={1.2} />
          {loadingText && <span>{loadingText}</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}

interface PageLoadingProps {
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Full page loading component for route transitions
 */
export function PageLoading({ 
  title = "Cargando...",
  description,
  className 
}: PageLoadingProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[50vh] text-center px-4",
      className
    )}>
      <BrandedLoading size="lg" variant="with-text" text={title} />
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
}

interface CardLoadingProps {
  lines?: number;
  showHeader?: boolean;
  className?: string;
}

/**
 * Card loading with skeleton content and branded logo
 */
export function CardLoading({ 
  lines = 3, 
  showHeader = true,
  className 
}: CardLoadingProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm p-6",
      className
    )}>
      <div className="flex items-center justify-center mb-4">
        <BrandedLoading size="sm" variant="minimal" />
      </div>
      {showHeader && (
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className="h-3 bg-muted rounded animate-pulse"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}