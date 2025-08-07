"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/login">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t("privacy.title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("privacy.lastUpdated")}: {new Date().toLocaleDateString()}
          </p>
        </div>

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
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("privacy.usage")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("privacy.usageDesc")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("privacy.sharing")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("privacy.sharingDesc")}
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
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("privacy.rights")}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t("privacy.rightsDesc")}
              </p>
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
                {t("privacy.contactDesc")
                  .split("nachthelad.dev@gmail.com")
                  .map((part, index, array) => {
                    if (index === array.length - 1) return part;
                    return (
                      <span key={index}>
                        {part}
                        <a
                          href="mailto:nachthelad.dev@gmail.com"
                          className="text-green-600 dark:text-green-400 hover:underline"
                        >
                          nachthelad.dev@gmail.com
                        </a>
                      </span>
                    );
                  })}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
