"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTranslation } from "@/hooks/use-translation"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Search } from "lucide-react"

interface PhotoGalleryProps {
  photos: string[]
  plantId: string
}

export function PhotoGallery({ photos, plantId }: PhotoGalleryProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyzePhoto = async () => {
    if (!selectedPhoto || !auth.currentUser) return

    setIsAnalyzing(true)

    try {
      // This is a placeholder for the OpenAI API integration
      // In a real implementation, you would send the photo to the API
      // and process the response

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update photo metadata in Firestore
      await setDoc(
        doc(db, "users", auth.currentUser.uid, "plants", plantId, "photos", "analysis"),
        {
          url: selectedPhoto,
          analyzed: true,
          analysisResult: "No issues detected",
          analyzedAt: new Date().toISOString(),
        },
        { merge: true },
      )

      toast({
        title: t("plantPage.analyzeSuccess"),
        description: t("plantPage.analyzeSuccessDesc"),
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("plantPage.analyzeError"),
        description: error.message,
      })
    } finally {
      setIsAnalyzing(false)
      setSelectedPhoto(null)
    }
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t("plantPage.noPhotos")}</p>
        <p className="text-sm">{t("plantPage.noPhotosDesc")}</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="aspect-square relative rounded-md overflow-hidden cursor-pointer border"
            onClick={() => setSelectedPhoto(photo)}
          >
            <Image src={photo || "/placeholder.svg"} alt={`Plant photo ${index + 1}`} fill className="object-cover" />
          </div>
        ))}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("plantPage.photoDetail")}</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video w-full">
            {selectedPhoto && (
              <Image src={selectedPhoto || "/placeholder.svg"} alt="Plant photo" fill className="object-contain" />
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAnalyzePhoto} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("plantPage.analyzing")}
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {t("plantPage.analyzePhoto")}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
