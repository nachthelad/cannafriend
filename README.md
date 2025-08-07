## cannafriend

Minimal, friendly cannabis plant growth tracker. Log activities, visualize environment trends, manage reminders, and keep photo timelines for each plant — all in an installable PWA with dark mode and multilingual support.

### Core features

- **Secure accounts**: Email/Password and Google sign‑in, onboarding, and password recovery. New users are guided through timezone setup.
- **Plants**: Create plants with seed type (autoflowering/photoperiodic), grow type (indoor/outdoor), optional light schedule, seed bank, planting date, and photos. Set a cover photo and delete plants when needed.
- **Journal**: Add logs for watering, feeding (NPK), training, environment (temperature/humidity/pH), and flowering. View logs in a list or calendar, filter by plant/type/date, and see localized dates.
- **Environment charts**: Temperature, humidity, and pH graphed over time for each plant.
- **Reminders**: Per‑plant reminders (watering/feeding/training/custom) with daily/weekly/custom frequencies. Activate/deactivate and delete reminders any time.
- **Photos**: Drag‑and‑drop uploads with size/type validation, gallery preview, lightbox, and cover selection. Images are stored per user for privacy.
- **Settings**: Language (ES/EN), timezone, and dark mode.

### User experience

- **Clean UI** with accessible controls, keyboard‑friendly interactions, and informative toasts.
- **Localization** in Spanish and English with instant switching.
- **Responsive** layouts for mobile and desktop.

### PWA

- Installable on desktop and mobile with app icons and manifest.
- Works offline with an offline fallback page for a graceful experience.

### Privacy & security

- Data is scoped to the authenticated user. Firestore security rules restrict read/write to the owner’s `users/{uid}` namespace.
- Storage rules limit access to each user’s own images and validate file type/size on upload.
- No public user listing or unauthenticated access to private data.

### What you can do in the app

- Add a new plant and start logging activities from day one.
- Track environment changes over time to optimize growth.
- Keep a visual history by uploading photos and setting a cover image.
- Set reminders so you never miss critical care windows.
- Switch language and theme, stay productive online or offline, and install the app to your device.

### Notes

- This application is intended for legal and responsible cultivation contexts. Please follow all applicable local laws.
