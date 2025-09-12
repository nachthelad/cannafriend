"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ROUTE_DASHBOARD } from "@/lib/routes";
import { DEV_EMAIL } from "@/lib/constants";

export default function TermsPage() {
  const { t, i18n } = useTranslation(["common"]);
  const isEs = (i18n.language || "en").toLowerCase().startsWith("es");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={ROUTE_DASHBOARD}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t("terms.title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("terms.lastUpdated")}: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg p-8 backdrop-blur-sm">
          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("terms.acceptance")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("terms.acceptanceDesc")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t("terms.use")}</h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("terms.useDesc")}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mt-3 space-y-2">
                <li>{isEs ? "Prohibida toda actividad o contenido ilegal. Respeta las leyes de cannabis aplicables a ti." : "No illegal activity or content. Respect the cannabis laws applicable to you."}</li>
                <li>{isEs ? "Prohibido el acoso, spam o conducta abusiva." : "No harassment, spam, or abusive behavior."}</li>
                <li>{isEs ? "Prohibidos los intentos de vulnerar o probar la seguridad del servicio." : "No attempts to breach or probe the service or its security."}</li>
                <li>{isEs ? "Prohibido el scraping automatizado sin consentimiento previo por escrito." : "No automated scraping without prior written consent."}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{isEs ? "Elegibilidad y cumplimiento legal" : "Eligibility and legal compliance"}</h2>
              <p className="text-gray-700 dark:text-gray-300">{isEs ? "Debes tener la edad legal y estar permitido por la ley local para cultivar o consumir cannabis. Eres responsable de cumplir las leyes de tu jurisdicción." : "You must be of legal age and permitted by local law to cultivate or consume cannabis. You are responsible for complying with the laws of your jurisdiction."}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{isEs ? "Sin asesoramiento médico o legal" : "No medical or legal advice"}</h2>
              <p className="text-gray-700 dark:text-gray-300">{isEs ? "La información en la app (incluidas respuestas de IA) es solo informativa y no constituye asesoramiento médico ni legal. Consulta profesionales habilitados." : "Information in the app (including AI outputs) is for informational purposes only and is not medical or legal advice. Consult licensed professionals for guidance."}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("terms.account")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("terms.accountDesc")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{isEs ? "Tu contenido" : "Your content"}</h2>
              <p className="text-gray-700 dark:text-gray-300">{isEs ? "Conservas la propiedad del contenido que envíes (plantas, registros, imágenes, inventario). Nos otorgas una licencia limitada para alojar, almacenar, procesar y mostrar tu contenido solo para operar y mejorar el servicio." : "You retain ownership of content you submit (plants, logs, images, stash). You grant us a limited license to host, store, process, and display your content solely to operate and improve the service."}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{isEs ? "Suscripciones premium y pagos" : "Premium subscriptions and payments"}</h2>
              <p className="text-gray-700 dark:text-gray-300">{isEs ? "Las funciones premium pueden ofrecerse mediante suscripciones recurrentes gestionadas por procesadores de pago (por ejemplo, Stripe, MercadoPago). Puedes cancelar en cualquier momento según lo indique el procesador. Los reembolsos se manejan según los términos del procesador y la ley aplicable." : "Premium features may be offered via recurring subscriptions handled by payment processors (e.g., Stripe, MercadoPago). You can cancel at any time as described by the processor. Refunds are handled per the processor's terms and applicable law."}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("terms.privacy")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("terms.privacyDesc")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{isEs ? "Propiedad intelectual" : "Intellectual property"}</h2>
              <p className="text-gray-700 dark:text-gray-300">{isEs ? "La app, logotipos y contenido (excepto tu contenido) nos pertenecen o a nuestros licenciantes y están protegidos por la ley." : "The app, logos, and content (other than your content) are owned by us or our licensors and are protected by law."}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{isEs ? "Descargos de responsabilidad" : "Disclaimers"}</h2>
              <p className="text-gray-700 dark:text-gray-300">{isEs ? "El servicio se proporciona \"tal cual\" sin garantías de ningún tipo. Úsalo bajo tu propio riesgo." : "The service is provided \"as is\" without warranties of any kind. Use at your own risk."}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{isEs ? "Límite de responsabilidad" : "Limitation of liability"}</h2>
              <p className="text-gray-700 dark:text-gray-300">{isEs ? "En la máxima medida permitida por la ley, no somos responsables por daños indirectos, incidentales, especiales o consecuentes derivados de tu uso de la app." : "To the maximum extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages arising from your use of the app."}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("terms.termination")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("terms.terminationDesc")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("terms.changes")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("terms.changesDesc")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("terms.contact")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("terms.contactDesc")} {" "}
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
