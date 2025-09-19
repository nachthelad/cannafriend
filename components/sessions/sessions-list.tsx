"use client";

import type { TFunction } from "i18next";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Trash2, Calendar, Clock, Pill, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session } from "./types";
import Image from "next/image";

interface SessionsListProps {
  sessions: Session[];
  t: TFunction<["sessions", "common"]>;
  onAddSession: () => void;
  onEdit: (session: Session) => void;
  onDelete: (sessionId: string) => void;
  onToggleFavorite: (session: Session) => void;
  isFavorite: (session: Session) => boolean;
  hasActiveFilter: boolean;
  onView?: (session: Session) => void;
}

interface SessionCardProps {
  session: Session;
  t: TFunction<["sessions", "common"]>;
  onEdit: (session: Session) => void;
  onDelete: (sessionId: string) => void;
  onToggleFavorite: (session: Session) => void;
  isFavorite: (session: Session) => boolean;
  onView?: (session: Session) => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
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

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mainPhoto) {
      setCurrentPhotoIndex(0);
      setShowImageModal(true);
    }
  };

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
      <Card className="overflow-hidden transition-all hover:shadow-sm">
        <CardContent className="p-4">
          {/* List View */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Small thumbnail */}
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border">
                {mainPhoto ? (
                  <Image
                    src={mainPhoto}
                    alt={`${session.strain} session`}
                    fill
                    className="object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                    <Pill className="h-5 w-5 text-white opacity-50" />
                  </div>
                )}
              </div>

              {/* Session info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base truncate">
                    {session.strain}
                  </h3>
                  {session.photos && session.photos.length > 1 && (
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      +{session.photos.length - 1}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{sessionDate}</span>
                  </div>
                  {hasTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{timeRange}</span>
                    </div>
                  )}
                  {methodAndAmount && (
                    <div className="flex items-center gap-1">
                      <Pill className="h-3 w-3" />
                      <span className="truncate">{methodAndAmount}</span>
                    </div>
                  )}
                </div>

                {session.notes && (
                  <p className="text-sm text-muted-foreground truncate">
                    {session.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewClick}
                className="hidden sm:inline-flex"
              >
                <Eye className="h-4 w-4 mr-2" />
                {t("view", { ns: "common" })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewClick}
                className="sm:hidden"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPhoto}
                    >
                      {t("previous", { ns: "common" })}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentPhotoIndex + 1} {t("of", { ns: "common" })} {session.photos.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPhoto}
                    >
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
                      <h4 className="font-medium mb-1">{t("notes", { ns: "common" })}:</h4>
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
              className="bg-red-600 hover:bg-red-700"
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
  onEdit,
  onDelete,
  onToggleFavorite,
  isFavorite,
  hasActiveFilter,
  onView,
}: SessionsListProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("noSessions", { ns: "sessions" })}</CardTitle>
          <CardDescription>
            {t("noSessionsDesc", { ns: "sessions" })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button onClick={onAddSession}>
            {t("addSession", { ns: "sessions" })}
          </Button>
          {hasActiveFilter ? (
            <span className="text-xs text-muted-foreground">
              {t("favorites.filter", { ns: "sessions" })}
            </span>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
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
