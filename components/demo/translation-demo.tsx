"use client";

import { useTranslation } from "react-i18next";

/**
 * Demo component showing the migration strategy
 * This demonstrates how to gradually migrate from legacy to react-i18next
 */
export function TranslationDemo() {
  // Common namespace
  const { t: commonT, i18n: commonI18n } = useTranslation(["common"]);
  const commonLang = commonI18n.language;
  const commonSetLang = (lang: string) => commonI18n.changeLanguage(lang);
  
  // Auth namespace
  const { t: authT, i18n: authI18n } = useTranslation(["auth"]);
  const authLang = authI18n.language;
  const authSetLang = (lang: string) => authI18n.changeLanguage(lang);
  
  // Dashboard namespace
  const { t: dashboardT } = useTranslation(["dashboard"]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Translation Migration Demo</h1>
        <p className="text-muted-foreground">
          Showing legacy system vs modern react-i18next namespaces side by side
        </p>
      </div>

      {/* Language Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => {
            commonSetLang("es");
            authSetLang("es");
          }}
          className={`px-4 py-2 rounded ${
            commonLang === "es" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Español
        </button>
        <button
          onClick={() => {
            commonSetLang("en");
            authSetLang("en");
          }}
          className={`px-4 py-2 rounded ${
            commonLang === "en" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          English
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Common Namespace */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">
            🆕 Common Namespace
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            react-i18next common namespace
          </p>
          <div className="space-y-2">
            <div><strong>Language:</strong> {commonLang}</div>
            <div><strong>Save:</strong> {commonT("save")}</div>
            <div><strong>Cancel:</strong> {commonT("cancel")}</div>
            <div><strong>Loading:</strong> {commonT("loading")}</div>
            <div><strong>Delete:</strong> {commonT("delete")}</div>
          </div>
        </div>

        {/* Auth Namespace */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-600">
            🔐 Auth Namespace
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            react-i18next auth namespace
          </p>
          <div className="space-y-2">
            <div><strong>Language:</strong> {authLang}</div>
            <div><strong>Login Title:</strong> {authT("login.title")}</div>
            <div><strong>Email:</strong> {authT("login.email")}</div>
            <div><strong>Password:</strong> {authT("login.password")}</div>
            <div><strong>Submit:</strong> {authT("login.submit")}</div>
          </div>
        </div>
      </div>

      {/* Dashboard Namespace Demo */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-emerald-600">🌱 Dashboard Namespace</h3>
        <div className="space-y-2 text-sm">
          <div><strong>Your Plants:</strong> {dashboardT("yourPlants")}</div>
          <div><strong>Quick Actions:</strong> {dashboardT("quickActions")}</div>
          <div><strong>Growth:</strong> {dashboardT("growth")}</div>
          <div><strong>Active:</strong> {dashboardT("active")}</div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="bg-gray-50 dark:bg-gray-950/20 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">💻 Usage Examples</h3>
        <div className="space-y-4 text-sm">
          <div>
            <strong className="text-amber-600">Current (Legacy):</strong>
            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
{`const { t } = useTranslation();
return <button>{t("common.save")}</button>;`}
            </pre>
          </div>
          <div>
            <strong className="text-blue-600">New (Common namespace):</strong>
            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
{`const { t } = useTranslation(["common"]);
return <button>{t("save")}</button>; // Cleaner key`}
            </pre>
          </div>
          <div>
            <strong className="text-green-600">New (Auth namespace):</strong>
            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
{`const { t } = useTranslation(["auth"]);
return <input placeholder={t("email")} />; // No prefix needed`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}