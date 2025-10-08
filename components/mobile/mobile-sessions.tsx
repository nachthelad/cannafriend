"use client";

import type {
  MobileSessionsProps,
  SessionDetailViewProps,
  SessionListItemProps,
} from "@/types/mobile";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowLeft,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Eye,
  Calendar,
  Clock,
  Pill,
  Edit,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { Session, SessionEditFormValues } from "@/types";
import { TimeField } from "@/components/sessions/time-field";
import { cn } from "@/lib/utils";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";

function formatDate(iso?: string | null) {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    // Simple consistent formatting that works on both server and client
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}/${year}`;
  } catch {
    return "";
  }
}

function formatTime(iso?: string | null) {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    // Simple consistent formatting that works on both server and client
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "";
  }
}

function SessionListItem({ session, t, onView }: SessionListItemProps) {
  const mainPhoto =
    session.photos && session.photos.length > 0 ? session.photos[0] : null;
  const sessionDate = formatDate(session.date);
  const startTime = formatTime(session.startTime);
  const endTime = formatTime(session.endTime);
  const timeRange =
    startTime && endTime
      ? `${startTime} – ${endTime}`
      : startTime || endTime || "";
  const methodAndAmount = [session.method, session.amount]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        {/* Just the session name */}
        <h3 className="font-semibold text-white text-lg min-w-0 flex-1">
          {session.strain}
        </h3>

        {/* Single View Action */}
        <Button
          variant="outline"
          size="sm"
          onClick={onView}
          className="bg-purple-600 border-purple-500 text-white flex-shrink-0"
        >
          <Eye className="h-4 w-4 mr-2" />
          {t("view", { ns: "common" })}
        </Button>
      </div>
    </div>
  );
}

export function SessionDetailView({
  session,
  t,
  onBack,
  onEdit,
  onDelete,
}: SessionDetailViewProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editValues, setEditValues] = useState(() => {
    const parseIsoToHHMM = (value?: string | null) => {
      if (!value) return "";
      try {
        const date = new Date(value);
        const hh = String(date.getHours()).padStart(2, "0");
        const mm = String(date.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
      } catch {
        return "";
      }
    };

    return {
      strain: session.strain,
      notes: session.notes || "",
      startTime: parseIsoToHHMM(session.startTime),
      endTime: parseIsoToHHMM(session.endTime),
      method: session.method || "",
      amount: session.amount || "",
    };
  });
  // Helper function to safely format time strings
  const safeFormatTime = (timeString: string) => {
    if (!timeString) return "";

    // Check if it's a valid HH:MM format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (timeRegex.test(timeString)) {
      try {
        return formatTime(
          new Date(`1970-01-01T${timeString}:00`).toISOString()
        );
      } catch {
        return timeString; // Return as-is if conversion fails
      }
    }
    return timeString; // Return partial input as-is while user is typing
  };

  const sessionDate = formatDate(session.date);
  const startTime = editValues.startTime
    ? safeFormatTime(editValues.startTime)
    : formatTime(session.startTime);
  const endTime = editValues.endTime
    ? safeFormatTime(editValues.endTime)
    : formatTime(session.endTime);
  const timeRange =
    startTime && endTime
      ? `${startTime} – ${endTime}`
      : startTime || endTime || "";
  const methodAndAmount = [editValues.method, editValues.amount]
    .filter(Boolean)
    .join(" • ");

  const hasMultiplePhotos = session.photos && session.photos.length > 1;

  const nextPhoto = () => {
    if (hasMultiplePhotos) {
      setCurrentPhotoIndex((prev) =>
        prev === session.photos!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (hasMultiplePhotos) {
      setCurrentPhotoIndex((prev) =>
        prev === 0 ? session.photos!.length - 1 : prev - 1
      );
    }
  };

  // Touch handlers for swipe navigation (only when multiple photos)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (!hasMultiplePhotos) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!hasMultiplePhotos) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!hasMultiplePhotos || !touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextPhoto();
    }
    if (isRightSwipe) {
      prevPhoto();
    }
  };

  const handleToggleEditMode = () => {
    if (isEditMode) {
      // Exit edit mode - reset any unsaved changes
      handleCancelEdit();
      setIsEditMode(false);
    } else {
      // Enter edit mode
      setIsEditMode(true);
    }
  };

  const handleEditField = (field: string) => {
    if (isEditMode) {
      setEditingField(field);
    }
  };

  const handleSaveField = async (field: string) => {
    setIsEditing(true);
    try {
      const formValues: SessionEditFormValues = {
        strain: editValues.strain,
        notes: editValues.notes,
        date: new Date(session.date), // Keep original date, no editing
        startTime: editValues.startTime,
        endTime: editValues.endTime,
        photos: session.photos || [],
        method: editValues.method,
        amount: editValues.amount,
      };

      await onEdit({ ...formValues, id: session.id });
      setEditingField(null);
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset values to original
    const parseIsoToHHMM = (value?: string | null) => {
      if (!value) return "";
      try {
        const date = new Date(value);
        const hh = String(date.getHours()).padStart(2, "0");
        const mm = String(date.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
      } catch {
        return "";
      }
    };

    setEditValues({
      strain: session.strain,
      notes: session.notes || "",
      startTime: parseIsoToHHMM(session.startTime),
      endTime: parseIsoToHHMM(session.endTime),
      method: session.method || "",
      amount: session.amount || "",
    });
    setEditingField(null);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(session.id);
    setShowDeleteDialog(false);
    onBack(); // Go back to list after delete
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header with Image */}
      <div className="relative">
        {/* Session Image */}
        <div
          className="relative rounded-2xl h-96 w-full overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {session.photos && session.photos.length > 0 ? (
            <>
              <Image
                src={session.photos[currentPhotoIndex]}
                alt={`${session.strain} session`}
                fill
                className="object-cover"
                loading="lazy"
              />
              {/* Photo Navigation - only show if multiple photos */}
              {hasMultiplePhotos && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm border border-white/20 rounded-full p-2"
                  >
                    <ArrowLeft className="h-5 w-5 text-white" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm border border-white/20 rounded-full p-2 rotate-180"
                  >
                    <ArrowLeft className="h-5 w-5 text-white" />
                  </button>
                  {/* Photo Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full">
                    <span className="text-white text-sm font-medium">
                      {currentPhotoIndex + 1} {t("of", { ns: "common" })}{" "}
                      {session.photos.length}
                    </span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="h-full bg-gradient-to-br from-purple-600/30 to-pink-700/40 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Pill className="h-24 w-24 text-purple-400/60" />
              </div>
            </div>
          )}

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Navigation Header */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/20 p-0"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleEditMode}
                className={`h-10 w-10 rounded-full backdrop-blur-sm border border-white/20 p-0 ${
                  isEditMode
                    ? "bg-blue-600/80 hover:bg-blue-700/80"
                    : "bg-black/20 hover:bg-black/40"
                }`}
              >
                {isEditMode ? (
                  <X className="h-5 w-5 text-white" />
                ) : (
                  <Edit className="h-5 w-5 text-white" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/20 p-0"
              >
                <Trash2 className="h-5 w-5 text-red-400" />
              </Button>
            </div>
          </div>

          {/* Session Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Strain Name - Inline Editable */}
            <div className="mb-2">
              {editingField === "strain" ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editValues.strain}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        strain: e.target.value,
                      }))
                    }
                    className="text-2xl font-bold bg-black/40 border-white/30 text-white placeholder-white/60"
                    placeholder={t("strainPlaceholder", { ns: "sessions" })}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSaveField("strain")}
                    disabled={isEditing}
                    className="bg-green-600 hover:bg-green-700 text-white h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-white/30 text-white hover:bg-white/10 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <h1
                  className={`text-3xl font-bold text-white drop-shadow-lg transition-colors ${
                    isEditMode
                      ? "cursor-pointer hover:text-slate-200 ring-2 ring-blue-400/50 rounded px-2 py-1"
                      : ""
                  }`}
                  onClick={() => handleEditField("strain")}
                >
                  {editValues.strain}
                  {isEditMode && (
                    <Edit className="inline ml-2 h-5 w-5 opacity-60" />
                  )}
                </h1>
              )}
            </div>

            {/* Date and Time */}
            <div className="flex items-center gap-4 text-slate-300">
              {/* Date - Read Only */}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{sessionDate}</span>
              </div>

              {/* Time Range */}
              {(timeRange ||
                (!endTime && startTime && isEditMode) ||
                (!startTime && isEditMode) ||
                editingField === "endTime" ||
                editingField === "startTime") && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />

                  {/* Show existing time range */}
                  {timeRange &&
                    editingField !== "endTime" &&
                    editingField !== "startTime" && <span>{timeRange}</span>}

                  {/* Show only start time when no end time exists */}
                  {startTime &&
                    !endTime &&
                    editingField !== "endTime" &&
                    editingField !== "startTime" &&
                    !timeRange && <span>{startTime}</span>}

                  {/* Add Start Time - Only show if no start time exists */}
                  {!startTime && isEditMode && editingField !== "startTime" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditField("startTime")}
                      className="border-blue-400/50 text-blue-300 hover:bg-blue-900/30 h-7 text-xs px-3"
                    >
                      + Add Start Time
                    </Button>
                  )}

                  {/* Add End Time - Only show if start time exists but no end time */}
                  {startTime &&
                    !endTime &&
                    isEditMode &&
                    editingField !== "endTime" &&
                    editingField !== "startTime" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditField("endTime")}
                        className="border-blue-400/50 text-blue-300 hover:bg-blue-900/30 h-7 text-xs px-3 ml-2"
                      >
                        + Add End Time
                      </Button>
                    )}

                  {/* Start Time Editor */}
                  {editingField === "startTime" && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        Start time:
                      </span>
                      <TimeField
                        value={editValues.startTime}
                        onChange={(value) =>
                          setEditValues((prev) => ({
                            ...prev,
                            startTime: value,
                          }))
                        }
                        className="bg-black/40 border-white/30 text-white text-sm w-20"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveField("startTime")}
                        disabled={isEditing}
                        className="bg-green-600 hover:bg-green-700 text-white h-7 px-3"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="border-white/30 text-white hover:bg-white/10 h-7 px-3"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* End Time Editor */}
                  {editingField === "endTime" && (
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-xs text-slate-400">End time:</span>
                      <TimeField
                        value={editValues.endTime}
                        onChange={(value) =>
                          setEditValues((prev) => ({
                            ...prev,
                            endTime: value,
                          }))
                        }
                        className="bg-black/40 border-white/30 text-white text-sm w-20"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveField("endTime")}
                        disabled={isEditing}
                        className="bg-green-600 hover:bg-green-700 text-white h-7 px-3"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="border-white/30 text-white hover:bg-white/10 h-7 px-3"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Edit Mode Banner */}
        {isEditMode && (
          <div className="bg-blue-600/20 border border-blue-400/50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">
                {t("editMode", {
                  ns: "sessions",
                  defaultValue: "Edit mode active - click on fields to edit",
                })}
              </span>
            </div>
          </div>
        )}
        {/* Method and Amount - Inline Editable */}
        {(methodAndAmount || isEditMode) && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400 tracking-wide uppercase">
              {t("method", { ns: "sessions" })} &{" "}
              {t("amount", { ns: "sessions" })}
            </h3>

            {editingField === "method" || editingField === "amount" ? (
              <div className="space-y-3">
                {/* Method Input */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">
                    {t("method", { ns: "sessions" })}
                  </label>
                  <Input
                    value={editValues.method}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        method: e.target.value,
                      }))
                    }
                    className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                    placeholder={t("methodPlaceholder", { ns: "sessions" })}
                    autoFocus={editingField === "method"}
                  />
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">
                    {t("amount", { ns: "sessions" })}
                  </label>
                  <Input
                    value={editValues.amount}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                    placeholder={t("amountPlaceholder", { ns: "sessions" })}
                    autoFocus={editingField === "amount"}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveField(editingField)}
                    disabled={isEditing}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {t("save", { ns: "common" })}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t("cancel", { ns: "common" })}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-purple-400" />

                {/* Display Method and Amount */}
                {methodAndAmount ? (
                  <span
                    className={`text-white font-medium text-lg transition-colors ${
                      isEditMode
                        ? "cursor-pointer hover:text-slate-200 ring-1 ring-blue-400/50 rounded px-2 py-1"
                        : ""
                    }`}
                    onClick={() => handleEditField("method")}
                  >
                    {methodAndAmount}
                    {isEditMode && (
                      <Edit className="inline ml-2 h-4 w-4 opacity-60" />
                    )}
                  </span>
                ) : isEditMode ? (
                  <Button
                    variant="outline"
                    onClick={() => handleEditField("method")}
                    className="border-blue-400/50 text-blue-300 hover:bg-blue-900/30 ring-1 ring-blue-400/50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("addMethodAmount", {
                      ns: "sessions",
                      defaultValue: "Add method & amount",
                    })}
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Notes - Inline Editable */}
        {(editValues.notes || editingField === "notes") && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400 tracking-wide uppercase">
              {t("notes", { ns: "common" })}
            </h3>
            {editingField === "notes" ? (
              <div className="space-y-2">
                <Textarea
                  value={editValues.notes}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 min-h-[80px]"
                  placeholder={t("notesPlaceholder", { ns: "sessions" })}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveField("notes")}
                    disabled={isEditing}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {t("save", { ns: "common" })}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t("cancel", { ns: "common" })}
                  </Button>
                </div>
              </div>
            ) : (
              <p
                className={`text-white leading-relaxed transition-colors p-2 rounded ${
                  isEditMode
                    ? "cursor-pointer hover:text-slate-200 hover:bg-slate-800/30 ring-1 ring-blue-400/50"
                    : ""
                }`}
                onClick={() => handleEditField("notes")}
              >
                {editValues.notes}
                {isEditMode && (
                  <Edit className="inline ml-2 h-4 w-4 opacity-60" />
                )}
              </p>
            )}
          </div>
        )}

        {/* Add Notes Button - Show when no notes exist and in edit mode */}
        {!editValues.notes && isEditMode && !editingField && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400 tracking-wide uppercase">
              {t("notes", { ns: "common" })}
            </h3>
            <Button
              variant="outline"
              onClick={() => handleEditField("notes")}
              className="border-blue-400/50 text-blue-300 hover:bg-blue-900/30 w-full justify-start ring-1 ring-blue-400/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("addNotes", { ns: "sessions" })}
            </Button>
          </div>
        )}

        {/* Additional Photos Thumbnails */}
        {hasMultiplePhotos && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400 tracking-wide uppercase">
              {t("photos", { ns: "sessions" })}
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {session.photos!.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition-colors ${
                    currentPhotoIndex === index
                      ? "border-purple-400"
                      : "border-slate-600"
                  }`}
                >
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("delete", { ns: "sessions" })}
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
    </div>
  );
}

export function MobileSessions({
  sessions,
  onAddSession,
  onEdit,
  onDelete,
  onToggleFavorite,
  isFavorite,
  searchQuery,
  onSearchChange,
  filterMethod,
  onFilterMethodChange,
  sortBy,
  onSortByChange,
  availableMethods,
  backHref,
}: MobileSessionsProps) {
  const { t } = useTranslation(["sessions", "common"]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const handleSessionView = (session: Session) => {
    setSelectedSession(session);
  };

  const handleBackToList = () => {
    setSelectedSession(null);
  };

  const handleSessionEdit = async (
    editedSession: SessionEditFormValues & { id: string }
  ) => {
    await onEdit(editedSession);
    // Update the selected session if still viewing it
    if (selectedSession && selectedSession.id === editedSession.id) {
      setSelectedSession({
        ...selectedSession,
        strain: editedSession.strain,
        notes: editedSession.notes,
        date: editedSession.date.toISOString(),
        startTime: editedSession.startTime
          ? new Date(`1970-01-01T${editedSession.startTime}:00`).toISOString()
          : selectedSession.startTime,
        endTime: editedSession.endTime
          ? new Date(`1970-01-01T${editedSession.endTime}:00`).toISOString()
          : selectedSession.endTime,
        method: editedSession.method || selectedSession.method,
        amount: editedSession.amount || selectedSession.amount,
        photos: editedSession.photos,
      });
    }
  };

  const handleSessionDelete = (sessionId: string) => {
    onDelete(sessionId);
    setSelectedSession(null); // Go back to list after delete
  };

  // Show detail view if session selected
  if (selectedSession) {
    return (
      <SessionDetailView
        session={selectedSession}
        t={t}
        onBack={handleBackToList}
        onEdit={handleSessionEdit}
        onDelete={handleSessionDelete}
      />
    );
  }

  // Show list view
  return (
    <div className="min-h-screen text-white">
      <ResponsivePageHeader
        title={t("title", { ns: "sessions" })}
        description={t("description", { ns: "sessions" })}
        backHref={backHref}
        showMobileBackButton={false}
        mobileControls={
          <>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("search.placeholder", { ns: "sessions" })}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterMethod} onValueChange={onFilterMethodChange}>
                <SelectTrigger className="flex-1">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue
                      placeholder={t("filter.method", { ns: "sessions" })}
                    />
                  </div>
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

              <Select value={sortBy} onValueChange={onSortByChange}>
                <SelectTrigger className="flex-1">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <SelectValue
                      placeholder={t("sort.label", { ns: "sessions" })}
                    />
                  </div>
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

              <Button
                onClick={onAddSession}
                className="bg-white text-black border"
                aria-label={t("addSession", { ns: "sessions" })}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </>
        }
        desktopActions={
          <div className="flex w-full items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("search.placeholder", { ns: "sessions" })}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterMethod} onValueChange={onFilterMethodChange}>
              <SelectTrigger className="w-[160px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue
                    placeholder={t("filter.method", { ns: "sessions" })}
                  />
                </div>
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

            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="w-[160px]">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <SelectValue
                    placeholder={t("sort.label", { ns: "sessions" })}
                  />
                </div>
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

            <Button
              onClick={onAddSession}
              className="bg-white text-black border"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("addSession", { ns: "sessions" })}
            </Button>
          </div>
        }
      />

      {/* Sessions List */}
      <div className="p-4 space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <Pill className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              {t("noSessions", { ns: "sessions" })}
            </h3>
            <p className="text-slate-400 mb-6">
              {t("noSessionsDesc", { ns: "sessions" })}
            </p>
            <Button onClick={onAddSession} className="bg-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              {t("addSession", { ns: "sessions" })}
            </Button>
          </div>
        ) : (
          sessions.map((session) => (
            <SessionListItem
              key={session.id}
              session={session}
              t={t}
              onView={() => handleSessionView(session)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export type { SessionDetailViewProps } from "@/types/mobile";

