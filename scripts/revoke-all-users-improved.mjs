// scripts/revoke-all-users-improved.mjs
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
  process.env;

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  throw new Error("Missing Firebase Admin env vars");
}

initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const auth = getAuth();

async function revokeAll() {
  let nextPageToken = undefined;
  let count = 0;
  
  console.log('🔄 Starting token revocation for all users...');
  
  do {
    const { users, pageToken } = await auth.listUsers(1000, nextPageToken);
    
    // Process users in batches to avoid overwhelming the API
    const batchSize = 50;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (u) => {
          try {
            // Revoke refresh tokens
            await auth.revokeRefreshTokens(u.uid);
            count++;
            
            if (count % 100 === 0) {
              console.log(`✅ Processed ${count} users...`);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to revoke tokens for user ${u.uid}:`, error.message);
          }
        })
      );
    }
    
    nextPageToken = pageToken;
  } while (nextPageToken);
  
  console.log(`🎉 Successfully revoked refresh tokens for ${count} users.`);
  console.log(`
📝 Next steps for users:
- Users will need to log in again
- If they get auth/internal-error, they should refresh the page
- The updated Google login button should handle this automatically
  `);
}

revokeAll().catch((e) => {
  console.error('❌ Error during token revocation:', e);
  process.exit(1);
});