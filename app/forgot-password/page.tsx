"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: "",
    },
  });

  const email = watch("email");

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      console.log("Starting email check for:", email);

      // Buscar en la colección de usuarios en Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      console.log("Query executed, empty:", querySnapshot.empty);
      console.log("Query size:", querySnapshot.size);

      // Log all documents for debugging
      querySnapshot.forEach((doc) => {
        console.log("Found document:", doc.id, doc.data());
      });

      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking email:", error);
      console.error("Error details:", error);
      return false;
    }
  };

  const onSubmit = async (data: ForgotPasswordFormData) => {
    console.log("Form submitted with email:", data.email);
    setIsLoading(true);
    setLoadingStep(t("forgotPassword.verifyingEmail"));

    try {
      // Primero verificar si el email existe en la BD
      console.log("Checking if email exists in database...");
      const emailExists = await checkEmailExists(data.email);
      console.log("Email exists:", emailExists);

      if (!emailExists) {
        console.log("Email not found, showing error toast");
        toast({
          variant: "destructive",
          title: t("forgotPassword.emailNotRegisteredTitle"),
          description: t("forgotPassword.emailNotRegisteredDescription"),
        });
        return;
      }

      // Si el email existe, enviar el email de recuperación con configuración personalizada
      setLoadingStep(t("forgotPassword.sendingEmail"));
      console.log("Email found, sending password reset email to:", data.email);
      console.log("Reset URL:", `${window.location.origin}/reset-password`);

      await sendPasswordResetEmail(auth, data.email, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      });

      console.log("Password reset email sent successfully");
      console.log("Showing success toast");
      toast({
        title: t("forgotPassword.emailSentTitle"),
        description: t("forgotPassword.emailSentDescription"),
      });

      console.log("Setting timeout to redirect to login");
      // Redirigir inmediatamente al login después de enviar el email
      setTimeout(() => {
        console.log("Redirecting to login");
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Error in password reset:", error);
      console.error("Error code:", error?.code);
      console.error("Error message:", error?.message);

      let errorMessage = t("forgotPassword.error");

      if (error?.code) {
        switch (error.code) {
          case "auth/invalid-email":
            errorMessage = t("auth.invalidEmail");
            break;
          case "auth/too-many-requests":
            errorMessage = t("auth.tooManyRequests");
            break;
          case "auth/user-not-found":
            errorMessage =
              "No se encontró una cuenta con este correo electrónico.";
            break;
          default:
            errorMessage = error.message || t("common.unknownError");
        }
      }

      console.log("Showing error toast with message:", errorMessage);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl dark:shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("forgotPassword.title")}
          </CardTitle>
          <CardDescription>{t("forgotPassword.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("forgotPassword.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400"
                {...register("email", {
                  required: "El correo electrónico es requerido",
                  validate: {
                    completeEmail: (value) => {
                      if (!value) return "El correo electrónico es requerido";
                      if (
                        value.includes("@") &&
                        (value.endsWith("@") ||
                          value.split("@")[1]?.length === 0)
                      ) {
                        return "Email incompleto";
                      }
                      if (
                        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
                      ) {
                        return "Formato de email inválido";
                      }
                      return true;
                    },
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingStep}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {t("forgotPassword.submit")}
                </>
              )}
            </Button>

            <div className="text-center">
              <Link href="/login">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("forgotPassword.backToLogin")}
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
