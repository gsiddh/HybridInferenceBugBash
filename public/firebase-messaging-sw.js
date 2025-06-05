// Import the Firebase app and messaging modules
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'; // Note: using firebase/messaging/sw

// Your web app's Firebase configuration (taken from src/app.ts)
// IMPORTANT: Make sure this config is identical to the one in src/app.ts
const firebaseConfig = {
    apiKey: "*", // Replace with your actual apiKey if not using a placeholder
    authDomain: "vertexaiinfirebase-test.firebaseapp.com",
    projectId: "vertexaiinfirebase-test",
    storageBucket: "vertexaiinfirebase-test.firebasestorage.app",
    messagingSenderId: "857620473716",
    appId: "1:857620473716:web:8c803ada68ede9b2bb6e21"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Customize notification here
    const notificationTitle = payload.notification?.title || 'Background Message';
    const notificationOptions = {
        body: payload.notification?.body || 'Something happened in the background',
        icon: payload.notification?.icon || '/images/dog.jpg' // Default icon
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: Add event listeners for notification click
self.addEventListener('notificationclick', function(event) {
    console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification);
    event.notification.close();

    // Example: Focus or open a window
    // event.waitUntil(
    //     clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
    //         if (clientList.length > 0) {
    //             let client = clientList[0];
    //             for (let i = 0; i < clientList.length; i++) {
    //                 if (clientList[i].focused) {
    //                     client = clientList[i];
    //                 }
    //             }
    //             return client.focus();
    //         }
    //         return clients.openWindow('/'); // Open your app's root page
    //     })
    // );
});

console.log('[firebase-messaging-sw.js] Service worker registered and listening for background messages.');
