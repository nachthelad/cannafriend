"use client";

import { Plus, Search, Filter, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SessionsHeaderProps } from "@/types";

export function SessionsHeader({
  t,
  onAddSession,
  addSessionHref,
  searchQuery,
  onSearchChange,
  filterMethod,
  onFilterMethodChange,
  sortBy,
  onSortByChange,
  availableMethods,
}: SessionsHeaderProps) {
  return (
    <header className="space-y-4">
      {/* Title */}
      <div className="min-w-0 space-y-1">
        <h1 className="text-3xl font-bold text-balance">
          {t("title", { ns: "sessions" })}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          {t("description", { ns: "sessions" })}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search.placeholder", { ns: "sessions" })}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters and Add Button */}
        <div className="flex items-center gap-2">
          {/* Method Filter */}
          <Select value={filterMethod} onValueChange={onFilterMethodChange}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue
                placeholder={t("filter.method", { ns: "sessions" })}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("filter.allMethods", { ns: "sessions" })}
              </SelectItem>
              {availableMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t("sort.label", { ns: "sessions" })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">
                {t("sort.dateDesc", { ns: "sessions" })}
              </SelectItem>
              <SelectItem value="date-asc">
                {t("sort.dateAsc", { ns: "sessions" })}
              </SelectItem>
              <SelectItem value="strain-asc">
                {t("sort.strainAsc", { ns: "sessions" })}
              </SelectItem>
              <SelectItem value="strain-desc">
                {t("sort.strainDesc", { ns: "sessions" })}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Add Session Button */}
          {addSessionHref ? (
            <>
              <Button asChild className="hidden sm:inline-flex">
                <Link href={addSessionHref}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addSession", { ns: "sessions" })}
                </Link>
              </Button>
              <Button
                asChild
                aria-label={t("addSession", { ns: "sessions" })}
                className="h-9 w-9 p-0 sm:hidden"
              >
                <Link href={addSessionHref}>
                  <Plus className="h-5 w-5" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onAddSession} className="hidden sm:inline-flex">
                <Plus className="mr-2 h-4 w-4" />
                {t("addSession", { ns: "sessions" })}
              </Button>
              <Button
                onClick={onAddSession}
                aria-label={t("addSession", { ns: "sessions" })}
                className="h-9 w-9 p-0 sm:hidden"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
