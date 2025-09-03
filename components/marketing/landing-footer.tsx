"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ROUTE_PRIVACY, ROUTE_TERMS } from "@/lib/routes";
import Logo from "@/components/common/logo";

export function LandingFooter() {
  const { t } = useTranslation(["common"]);

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <Logo size={32} className="text-primary mr-3" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("app.name")}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
              {t("landing.hero")}
            </p>
          </div>

          {/* Features Column */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              {t("footer.features")}
            </h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li>{t("features.management.title")}</li>
              <li>{t("features.journal.title")}</li>
              <li>{t("features.gallery.title")}</li>
              <li>{t("analyzePlant.title")}</li>
              <li>{t("features.reminders.title")}</li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              {t("footer.support")}
            </h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li>
                <Link 
                  href={ROUTE_PRIVACY}
                  className="hover:text-primary transition-colors"
                >
                  {t("privacy.title")}
                </Link>
              </li>
              <li>
                <Link 
                  href={ROUTE_TERMS}
                  className="hover:text-primary transition-colors"
                >
                  {t("terms.title")}
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:nachthelad.dev@gmail.com"
                  className="hover:text-primary transition-colors flex items-center"
                >
                  {t("footer.contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-0">
            {t("footer.copyright")}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t("footer.version")}
          </div>
        </div>
      </div>
    </footer>
  );
}