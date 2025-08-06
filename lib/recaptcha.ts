// reCAPTCHA configuration
export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
  "6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

// For development, you can use the test keys from Google
// https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do
export const RECAPTCHA_TEST_SITE_KEY =
  "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
export const RECAPTCHA_TEST_SECRET_KEY =
  "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

// Configuration flag to enable/disable reCAPTCHA
export const ENABLE_RECAPTCHA =
  process.env.NEXT_PUBLIC_ENABLE_RECAPTCHA === "true";

// Use test keys in development, real keys in production
export const getRecaptchaSiteKey = () => {
  if (process.env.NODE_ENV === "development") {
    return RECAPTCHA_TEST_SITE_KEY;
  }
  return RECAPTCHA_SITE_KEY;
};

// Check if reCAPTCHA should be enabled
export const isRecaptchaEnabled = () => {
  return ENABLE_RECAPTCHA;
};
