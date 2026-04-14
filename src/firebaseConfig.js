import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAlE-k0CB14gkPvTpriSlG6PIAnrIj9yGA",
  authDomain: "posummpaa.firebaseapp.com",
  projectId: "posummpaa",
  storageBucket: "posummpaa.firebasestorage.app",
  messagingSenderId: "536198966274",
  appId: "1:536198966274:android:208cd96a3be5af3e6f8b1b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const messaging = getMessaging(app);
export default app;
