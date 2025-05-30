import * as admin from 'firebase-admin';
import { App, getApps, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

// Only initialize if not already initialized
let app: App;
if (!getApps().length) {
    app = initializeApp(); // Credentials are picked up from env or cloud environment
} else {
    app = getApps()[0];
}

const db: Firestore = getFirestore(app);

console.log('Firestore has been initialized and is ready to use.');

export { admin, db };
