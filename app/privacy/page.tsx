"use client";

import { useTranslation } from "react-i18next";
import { ROUTE_DASHBOARD } from "@/lib/routes";
import { DEV_EMAIL } from "@/lib/constants";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";

export default function PrivacyPage() {
  const { t, i18n } = useTranslation(["common"]);
  const isEs = (i18n.language || "en").toLowerCase().startsWith("es");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8">
        <ResponsivePageHeader
          title={t("privacy.title")}
          description={`${t("privacy.lastUpdated")}: ${new Date().toLocaleDateString()}`}
          backHref={ROUTE_DASHBOARD}
          className="mb-6"
        />

        {/* Content */}
        <div className="max-w-4xl mx-auto bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg p-8 backdrop-blur-sm">
          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("privacy.intro")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("privacy.introDesc")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("privacy.collection")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("privacy.collectionDesc")}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mt-3 space-y-2">
                <li>
                  {isEs
                    ? "Datos de la cuenta: correo e identificadores de autenticación (Firebase Authentication)."
                    : "Account data: email and authentication identifiers (Firebase Authentication)."}
                </li>
                <li>
                  {isEs
                    ? "Perfil y roles (cultivador/consumidor), preferencias (idioma, zona horaria)."
                    : "Profile and roles (grower/consumer), preferences (language, timezone)."}
                </li>
                <li>
                  {isEs
                    ? "Contenido que agregas: plantas, diarios, nutrientes, recordatorios, inventario y notas."
                    : "Content you add: plants, journals, nutrients, reminders, stash items, and notes."}
                </li>
                <li>
                  {isEs
                    ? "Imágenes que subes (almacenadas en Firebase Storage)."
                    : "Images you upload (stored in Firebase Storage)."}
                </li>
                <li>
                  {isEs
                    ? "Datos técnicos mínimos: dispositivo/navegador y uso necesarios para operar y asegurar la app."
                    : "Minimal technical data: device/browser and usage needed to operate and secure the app."}
                </li>
                <li>
                  {isEs
                    ? "Metadatos de suscripción gestionados por procesadores de pago (Stripe/MercadoPago). No almacenamos datos completos de pago."
                    : "Subscription metadata handled by payment processors (Stripe/MercadoPago). We do not store full payment details."}
                </li>
                <li>
                  {isEs
                    ? "Almacenamiento local y cachés PWA en tu dispositivo para uso sin conexión."
                    : "Local storage and PWA caches on your device for offline use."}
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("privacy.usage")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("privacy.usageDesc")}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mt-3 space-y-2">
                <li>
                  {isEs
                    ? "Proveer y mantener el servicio (sincronización, almacenamiento, inicio de sesión)."
                    : "Provide and maintain the service (sync, storage, login)."}
                </li>
                <li>{isEs ? "Mejorar funciones y rendimiento." : "Improve features and performance."}</li>
                <li>{isEs ? "Brindar soporte y responder solicitudes." : "Provide support and respond to requests."}</li>
                <li>{isEs ? "Proteger contra fraude, abuso y problemas técnicos." : "Protect against fraud, abuse, and technical issues."}</li>
                <li>
                  {isEs
                    ? "Enviar comunicaciones relacionadas al servicio (por ejemplo, suscripción o avisos importantes)."
                    : "Send service-related communications (e.g., subscription or critical notices)."}
                </li>
                <li>{isEs ? "Cumplir obligaciones legales." : "Comply with legal obligations."}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-2">{isEs ? "Bases legales (EEE/RU)" : "Legal bases (EEA/UK)"}</h2>
              <p className="text-gray-700 dark:text-gray-300">{isEs ? "Cuando aplique, tratamos datos bajo estas bases:" : "Where applicable, we process data under these legal bases:"}</p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mt-3 space-y-2">
                <li>{isEs ? "Ejecución de un contrato (brindar la app solicitada)." : "Performance of a contract (providing the app you requested)."}</li>
                <li>{isEs ? "Tu consentimiento (por ejemplo, notificaciones push)." : "Your consent (e.g., push notifications)."}</li>
                <li>{isEs ? "Interés legítimo (seguridad y mejora de la app)." : "Legitimate interests (app security and improvement)."}</li>
                <li>{isEs ? "Cumplimiento de obligaciones legales." : "Compliance with legal obligations."}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("privacy.sharing")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("privacy.sharingDesc")}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mt-3 space-y-2">
                <li>{isEs ? "Firebase (Authentication, Firestore, Storage) para iniciar sesión, almacenar tus datos y alojar contenido." : "Firebase (Authentication, Firestore, Storage) to sign in, store your data, and host content."}</li>
                <li>{isEs ? "Procesadores de pago (Stripe, MercadoPago) para suscripciones. Aplican sus políticas de privacidad." : "Payment processors (Stripe, MercadoPago) for subscriptions. Their privacy policies apply."}</li>
                <li>{isEs ? "Proveedores OAuth (p. ej., Google) si eliges inicio de sesión con redes sociales." : "OAuth providers (e.g., Google) when you choose social sign-in."}</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                {isEs
                  ? "Los datos pueden procesarse y almacenarse en países distintos al tuyo (por ejemplo, Estados Unidos) según la infraestructura del proveedor."
                  : "Data may be processed and stored in countries outside your own (e.g., the United States) depending on provider infrastructure."}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("privacy.security")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("privacy.securityDesc")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("privacy.cookies")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("privacy.cookiesDesc")}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mt-3 space-y-2">
                <li>{isEs ? "Tokens de autenticación para mantener tu sesión." : "Authentication tokens to maintain your session."}</li>
                <li>{isEs ? "Preferencias como idioma, tema y roles." : "Preferences such as language, theme, and roles."}</li>
                <li>{isEs ? "Cachés PWA para carga rápida y funcionalidad sin conexión." : "PWA caches for faster loading and offline functionality."}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{isEs ? "Notificaciones push" : "Push notifications"}</h2>
              <p className="text-gray-700 dark:text-gray-300">{isEs ? "Si las habilitas, podemos enviar recordatorios o avisos del servicio. Puedes desactivarlas en la configuración del dispositivo." : "If enabled, we may send reminders or service updates. You can disable notifications in your device settings."}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{isEs ? "Funciones de IA" : "AI features"}</h2>
              <p className="text-gray-700 dark:text-gray-300">{isEs ? "Al usar el asistente de IA, tus consultas y contexto pueden procesarse para generar respuestas. Evita compartir datos personales sensibles." : "When you use AI assistant features, your prompts and context may be processed to generate responses. Avoid sharing sensitive personal data."}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{isEs ? "Retención de datos" : "Data retention"}</h2>
              <p className="text-gray-700 dark:text-gray-300">{isEs ? "Conservamos tus datos mientras tu cuenta esté activa. Puedes eliminar contenido o tu cuenta en cualquier momento; las copias de seguridad residuales pueden persistir por un período limitado." : "We retain your data while your account is active. You can delete content or your account at any time; residual backups may persist for a limited period."}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("privacy.advertising")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("privacy.advertisingDesc")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("privacy.rights")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("privacy.rightsDesc")}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mt-3 space-y-2">
                <li>{isEs ? "Acceder a tus datos." : "Access the data we hold about you."}</li>
                <li>{isEs ? "Corregir información inexacta." : "Correct inaccurate information."}</li>
                <li>{isEs ? "Solicitar la eliminación de tus datos." : "Request deletion of your data."}</li>
                <li>{isEs ? "Recibir una copia portable de tus datos." : "Receive a portable copy of your data."}</li>
                <li>{isEs ? "Restringir u oponerte a ciertos tratamientos." : "Restrict or object to certain processing."}</li>
                <li>{isEs ? "Ejercer estos derechos contactándonos." : "Exercise these rights by contacting us."}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{isEs ? "Menores de edad y límites de edad" : "Children and age limits"}</h2>
              <p className="text-gray-700 dark:text-gray-300">{isEs ? "La app es para personas con edad legal para consumir o cultivar cannabis en su jurisdicción. No la uses si es ilegal para ti." : "This app is intended only for individuals of legal age to consume or cultivate cannabis in their jurisdiction. Do not use the app if it is illegal for you to do so."}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("privacy.changes")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("privacy.changesDesc")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("privacy.contact")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("privacy.contactDesc")} {" "}
                <a
                  href={`mailto:${DEV_EMAIL}`}
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  {DEV_EMAIL}
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
