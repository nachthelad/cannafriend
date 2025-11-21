"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";

export default function ResponsiveTestPage() {
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

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Responsive Breakpoint Test</h1>
        <p className="text-muted-foreground">
          Resize your browser window to test responsive breakpoints
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Current Breakpoint</CardTitle>
          <CardDescription>Live window size detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold mb-2">{windowWidth}px</p>
              <p className="text-lg text-muted-foreground">{breakpoint}</p>
            </div>
            <div className="text-primary">
              {windowWidth < 640 && <Smartphone className="h-16 w-16" />}
              {windowWidth >= 640 && windowWidth < 1024 && <Tablet className="h-16 w-16" />}
              {windowWidth >= 1024 && <Monitor className="h-16 w-16" />}
            </div>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Breakpoint Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Default (0px)</p>
              <p className="font-mono text-xs">0 - 639px</p>
              <Badge variant="outline" className="mt-2">sm: hidden</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tablet className="h-5 w-5" />
                Tablet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">md breakpoint</p>
              <p className="font-mono text-xs">768px - 1023px</p>
              <Badge variant="outline" className="mt-2">md: block</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Desktop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">lg breakpoint</p>
              <p className="font-mono text-xs">1024px+</p>
              <Badge variant="outline" className="mt-2">lg: block</Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Responsive Grid Test</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This grid adapts: 1 col (mobile) → 2 cols (sm) → 3 cols (md) → 4 cols (lg)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} variant="interactive">
              <CardContent className="pt-6">
                <div className="aspect-square flex items-center justify-center bg-primary/10 rounded-lg">
                  <span className="text-4xl font-bold text-primary">{i}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Visibility Test</h2>
        <div className="space-y-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Badge variant="destructive">Mobile Only</Badge>
                <p className="text-sm sm:hidden">✓ Visible on mobile</p>
                <p className="text-sm hidden sm:block text-muted-foreground">Hidden on larger screens</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500 hover:bg-green-600">Tablet+</Badge>
                <p className="text-sm hidden md:block">✓ Visible on desktop and up</p>
                <p className="text-sm md:hidden text-muted-foreground">Hidden on mobile/tablet</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">Testing Instructions</h2>
        <Card>
          <CardContent className="pt-6">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Use browser DevTools responsive mode to test different sizes</li>
              <li>Verify all colors have proper contrast in both themes</li>
              <li>Check grid layouts adapt correctly at each breakpoint</li>
              <li>Test visibility badges show/hide at correct widths</li>
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
