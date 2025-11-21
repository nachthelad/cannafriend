"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataCard } from "@/components/common/data-card";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { Badge } from "@/components/ui/badge";
import { Leaf, TrendingUp, Calendar, Bell, Plus } from "lucide-react";

export default function DesignSystemTestPage() {
  return (
    <div className="container mx-auto p-6 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Design System Test Page</h1>
        <p className="text-muted-foreground">
          Testing the new color system and components in light/dark modes
        </p>
      </div>

      {/* Color Swatches */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Color System</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-primary" />
            <p className="text-sm font-medium">Primary</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-secondary" />
            <p className="text-sm font-medium">Secondary</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-accent" />
            <p className="text-sm font-medium">Accent</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-muted" />
            <p className="text-sm font-medium">Muted</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-success" />
            <p className="text-sm font-medium">Success</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-warning" />
            <p className="text-sm font-medium">Warning</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-destructive" />
            <p className="text-sm font-medium">Destructive</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-info" />
            <p className="text-sm font-medium">Info</p>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><Plus /></Button>
          <Button size="icon-sm"><Plus /></Button>
          <Button size="icon-lg"><Plus /></Button>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Standard card variant</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">This is the default card style with subtle shadow.</p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>Enhanced shadow</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">This card has elevated shadow for emphasis.</p>
            </CardContent>
          </Card>

          <Card variant="interactive">
            <CardHeader>
              <CardTitle>Interactive Card</CardTitle>
              <CardDescription>Clickable with hover</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Hover over this card to see the effect.</p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>Glass Card</CardTitle>
              <CardDescription>Glassmorphism effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">This card has a glass-like appearance.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* DataCards */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">DataCards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DataCard
            label="Total Plants"
            value={24}
            icon={Leaf}
            color="success"
            trend="up"
            trendValue="+3 this week"
          />
          <DataCard
            label="Recent Logs"
            value={156}
            icon={Calendar}
            color="default"
          />
          <DataCard
            label="Active Reminders"
            value={8}
            icon={Bell}
            color="warning"
            trend="down"
            trendValue="-2 completed"
          />
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      {/* Loading States */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Loading States</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Card Skeleton</h3>
            <LoadingState variant="card" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">List Skeleton</h3>
            <LoadingState variant="list" count={3} />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Grid Skeleton</h3>
            <LoadingState variant="grid" count={3} />
          </div>
        </div>
      </section>

      {/* Empty State */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Empty State</h2>
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Leaf}
              title="No plants yet"
              description="Start your growing journey by adding your first plant"
              action={{
                label: "Add Plant",
                onClick: () => alert("Add plant clicked!"),
                icon: Plus,
              }}
            />
          </CardContent>
        </Card>
      </section>

      {/* Typography */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Typography</h2>
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <h2 className="text-3xl font-bold">Heading 2</h2>
            <h3 className="text-2xl font-semibold">Heading 3</h3>
            <h4 className="text-xl font-semibold">Heading 4</h4>
          </div>
          <div className="space-y-2">
            <p className="text-base">
              This is body text in the base size. It should be comfortable to read
              with good contrast in both light and dark modes.
            </p>
            <p className="text-sm text-muted-foreground">
              This is smaller, muted text often used for descriptions and secondary information.
            </p>
          </div>
        </div>
      </section>

      {/* Test Instructions */}
      <section className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">Testing Instructions</h2>
        <Card>
          <CardContent className="pt-6">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Toggle between light and dark mode using your system settings or theme switcher</li>
              <li>Verify all colors have proper contrast and are readable</li>
              <li>Check that the sage green theme is visible in primary elements</li>
              <li>Hover over interactive elements (buttons, cards) to see transitions</li>
              <li>Verify loading skeletons match the design system</li>
              <li>Test on different screen sizes (mobile, tablet, desktop)</li>
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
