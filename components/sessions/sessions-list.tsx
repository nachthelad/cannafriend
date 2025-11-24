"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  Calendar,
  Clock,
  Pill,
  Eye,
  Leaf,
  Beaker,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session, SessionCardProps, SessionsListProps } from "@/types";
import Image from "next/image";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return "";
  }
}

function formatTime(iso?: string | null) {
  if (!iso) return "";
  try {
    return timeFormatter.format(new Date(iso));
  } catch {
    return "";
  }
}

function SessionCard({
  session,
  t,
  onEdit,
  onDelete,
  onToggleFavorite,
  isFavorite,
  onView,
}: SessionCardProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const methodAndAmount = useMemo(() => {
    const parts = [session.method, session.amount].filter(Boolean);
    return parts.join(" • ");
  }, [session.amount, session.method]);

  const sessionDate = useMemo(() => formatDate(session.date), [session.date]);
  const startTime = formatTime(session.startTime);
  const endTime = formatTime(session.endTime);
  const timeRange =
    startTime && endTime
      ? `${startTime} – ${endTime}`
      : startTime || endTime || "";
  const hasTime = Boolean(timeRange);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(session.id);
    setShowDeleteDialog(false);
  };

  const mainPhoto =
    session.photos && session.photos.length > 0 ? session.photos[0] : null;

  const handleViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onView) {
      onView(session);
    }
  };

  const nextPhoto = () => {
    if (session.photos && session.photos.length > 1) {
      setCurrentPhotoIndex((prev) =>
        prev === session.photos!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (session.photos && session.photos.length > 1) {
      setCurrentPhotoIndex((prev) =>
        prev === 0 ? session.photos!.length - 1 : prev - 1
      );
    }
  };

  return (
    <>
      <Card
        variant="interactive"
        className="group relative overflow-hidden transition-all hover:border-primary/50"
        onClick={handleViewClick}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-muted/30">
              {mainPhoto ? (
                <Image
                  src={mainPhoto}
                  alt={`${session.strain} session`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                  <Leaf className="h-6 w-6" />
                </div>
              )}
              {session.photos && session.photos.length > 1 && (
                <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md">
                  +{session.photos.length - 1}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg leading-tight truncate text-foreground group-hover:text-primary transition-colors">
                  {session.strain}
                </h3>

                {/* Desktop Actions */}
                <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView?.(session);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{sessionDate}</span>
                </div>
                {hasTime && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{timeRange}</span>
                  </div>
                )}
              </div>

              {methodAndAmount && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className="text-xs font-normal bg-muted/50 text-muted-foreground hover:bg-muted"
                  >
                    {methodAndAmount}
                  </Badge>
                </div>
              )}

              {session.notes && (
                <p className="text-sm text-muted-foreground/80 line-clamp-1 mt-1">
                  {session.notes}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-lg font-semibold">
              {session.strain}
            </DialogTitle>
          </DialogHeader>
          <div className="relative p-6 pt-0">
            {session.photos && session.photos.length > 0 && (
              <>
                <div className="relative aspect-video w-full mb-4">
                  <Image
                    src={session.photos[currentPhotoIndex]}
                    alt={`${session.strain} - Photo ${currentPhotoIndex + 1}`}
                    fill
                    className="object-contain rounded-lg"
                    loading="lazy"
                  />
                </div>

                {/* Photo Navigation */}
                {session.photos.length > 1 && (
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="outline" size="sm" onClick={prevPhoto}>
                      {t("previous", { ns: "common" })}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentPhotoIndex + 1} {t("of", { ns: "common" })}{" "}
                      {session.photos.length}
                    </span>
                    <Button variant="outline" size="sm" onClick={nextPhoto}>
                      {t("next", { ns: "common" })}
                    </Button>
                  </div>
                )}

                {/* Thumbnails */}
                {session.photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {session.photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={cn(
                          "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition-colors",
                          currentPhotoIndex === index
                            ? "border-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Image
                          src={photo}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Session Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{sessionDate}</span>
                    {hasTime && (
                      <>
                        <Clock className="h-4 w-4 text-muted-foreground ml-4" />
                        <span>{timeRange}</span>
                      </>
                    )}
                  </div>
                  {methodAndAmount && (
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-muted-foreground" />
                      <span>{methodAndAmount}</span>
                    </div>
                  )}
                  {session.notes && (
                    <div className="mt-3">
                      <h4 className="font-medium mb-1">
                        {t("notes", { ns: "common" })}:
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {session.notes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteConfirmTitle", { ns: "sessions" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDesc", { ns: "sessions" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("cancel", { ns: "common" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("delete", { ns: "common" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function SessionsList({
  sessions,
  t,
  onAddSession,
  addSessionHref,
  onEdit,
  onDelete,
  onToggleFavorite,
  isFavorite,
  hasActiveFilter,
  onView,
}: SessionsListProps) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={Beaker}
        title={
          hasActiveFilter
            ? t("noSessionsFound", {
                ns: "sessions",
                defaultValue: "No sessions found",
              })
            : t("noSessions", { ns: "sessions" })
        }
        description={
          hasActiveFilter
            ? t("noSessionsFoundDesc", {
                ns: "sessions",
                defaultValue: "Try adjusting your filters",
              })
            : t("noSessionsDesc", { ns: "sessions" })
        }
        action={
          !hasActiveFilter
            ? {
                label: t("addSession", { ns: "sessions" }),
                onClick: onAddSession,
                href: addSessionHref,
                icon: Plus,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          t={t}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite}
          onView={onView}
        />
      ))}
    </div>
  );
}
