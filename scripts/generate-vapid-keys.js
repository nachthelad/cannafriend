const webpush = require('web-push');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('Generated VAPID Keys:');
console.log('==================');
console.log('');
console.log('Add these to your .env.local file:');
console.log('');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=your-email@cannafriend.com`);
console.log('');
console.log('Public Key (for client-side):');
console.log(vapidKeys.publicKey);
console.log('');
console.log('Private Key (for server-side):');
console.log(vapidKeys.privateKey);
console.log('');
console.log('IMPORTANT: Keep the private key secret and never expose it to the client!');