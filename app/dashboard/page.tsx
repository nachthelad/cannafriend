"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { auth, db } from "@/lib/firebase"
import { collection, query, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Layout } from "@/components/layout"
import { PlantCard } from "@/components/plant-card"
import { Plus, Loader2 } from "lucide-react"
import type { Plant } from "@/types"

export default function DashboardPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [plants, setPlants] = useState<Plant[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
      } else {
        // Check if we're in demo mode (no auth required)
        const isDemoMode =
          typeof window !== "undefined" && (window.location.search.includes("demo=true") || !auth.currentUser)
        if (isDemoMode) {
          // Use a demo user ID for testing
          setUserId("demo-user-123")
        } else {
          router.push("/login")
        }
      }
    })

    return () => unsubscribe()
  }, [router, isClient])

  useEffect(() => {
    const fetchPlants = async () => {
      if (!userId || !isClient) return

      try {
        // In demo mode, return mock data
        if (userId === "demo-user-123") {
          const mockPlants: Plant[] = [
            {
              id: "demo-plant-1",
              name: "Blue Dream",
              strain: "Blue Dream",
              seedType: "feminized",
              growType: "indoor",
              plantingDate: new Date("2025-01-15").toISOString(),
              stage: "vegetative",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "demo-plant-2",
              name: "Northern Lights",
              strain: "Northern Lights",
              seedType: "autoflower",
              growType: "outdoor",
              plantingDate: new Date("2025-01-20").toISOString(),
              stage: "flowering",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]
          setPlants(mockPlants)
          setIsLoading(false)
          return
        }

        const plantsRef = collection(db, "users", userId, "plants")
        const q = query(plantsRef)
        const querySnapshot = await getDocs(q)

        const plantsData: Plant[] = []
        querySnapshot.forEach((doc) => {
          plantsData.push({ id: doc.id, ...doc.data() } as Plant)
        })

        setPlants(plantsData)
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: t("dashboard.error"),
          description: error.message,
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (userId && isClient) {
      fetchPlants()
    }
  }, [userId, toast, t, isClient])

  // Don't render anything until we're on the client
  if (!isClient) {
    return null
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
        <Button onClick={() => router.push("/plants/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("dashboard.addPlant")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : plants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.noPlants")}</CardTitle>
            <CardDescription>{t("dashboard.noPlantDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push("/plants/new")}>
              <Plus className="mr-2 h-4 w-4" />
              {t("dashboard.addPlant")}
            </Button>
          </CardContent>
        </Card>
      )}
    </Layout>
  )
}
