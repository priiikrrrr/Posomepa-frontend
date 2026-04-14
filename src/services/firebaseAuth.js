import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '536198966274-eduhm7s0loadkmgn2qmada319tf9s8qa.apps.googleusercontent.com',
  offlineAccess: true,
  scopes: ['profile', 'email'],
});

const firebaseAuth = {
  signInWithPhone: async (phoneNumber) => {
    try {
      console.log('signInWithPhone called with:', phoneNumber);
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber, false);
      console.log('Confirmation object received:', confirmation);
      return { success: true, confirmation };
    } catch (error) {
      console.log('Firebase Phone Sign In Error:', error);
      return { success: false, error: error.message, code: error.code };
    }
  },

  confirmOTP: async (confirmation, otp) => {
    try {
      console.log('confirmOTP called with OTP:', otp);
      const result = await confirmation.confirm(otp);
      console.log('Confirm result:', result);
      const idToken = await result.user.getIdToken();
      return { success: true, user: result.user, idToken };
    } catch (error) {
      console.log('Firebase Confirm OTP Error:', error);
      return { success: false, error: error.message, code: error.code };
    }
  },

  signInWithGoogle: async () => {
    try {
      console.log('Google Sign-In: Starting...');
      
      // Step 0: Clear any existing Google session to force account picker
      await GoogleSignin.signOut();
      
      // Step 1: Sign in with Google and get ID token
      await GoogleSignin.signIn();
      const googleIdToken = await GoogleSignin.getTokens();
      
      console.log('Google Sign-In: Got ID token');
      
      // Step 2: Create Firebase credential with Google ID token
      const credential = auth.GoogleAuthProvider.credential(googleIdToken.idToken);
      
      // Step 3: Sign into Firebase with the credential
      const result = await auth().signInWithCredential(credential);
      const firebaseIdToken = await result.user.getIdToken();
      
      // Get user data from Firebase user object (has displayName, photoURL, etc.)
      const firebaseUser = result.user;
      
      console.log('Firebase Sign-In: Success, displayName:', firebaseUser.displayName);
      
      return {
        success: true,
        user: firebaseUser,
        idToken: firebaseIdToken,
        googleUser: {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          photo: firebaseUser.photoURL
        }
      };
    } catch (error) {
      console.log('Google Sign-In Error:', error.code);
      console.log('Error message:', error.message);
      console.log('Full error:', error);
      return { success: false, error: error.message, code: error.code };
    }
  },

  signInWithEmail: async (email, password) => {
    try {
      console.log('Email Sign-In started');
      const result = await auth().signInWithEmailAndPassword(email, password);
      const idToken = await result.user.getIdToken();
      return { success: true, user: result.user, idToken };
    } catch (error) {
      console.log('Email Sign-In Error:', error);
      return { success: false, error: error.message, code: error.code };
    }
  },

  createUserWithEmail: async (email, password) => {
    try {
      console.log('Creating user with email:', email);
      const result = await auth().createUserWithEmailAndPassword(email, password);
      const idToken = await result.user.getIdToken();
      return { success: true, user: result.user, idToken };
    } catch (error) {
      console.log('Create User Error:', error);
      return { success: false, error: error.message, code: error.code };
    }
  },

  getCurrentUser: () => {
    return auth().currentUser;
  },

  getIdToken: async () => {
    const user = auth().currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  },

  signOut: async () => {
    try {
      await auth().signOut();
      await GoogleSignin.signOut();
      return { success: true };
    } catch (error) {
      console.log('Firebase Sign Out Error:', error);
      return { success: false, error: error.message };
    }
  },

  onAuthStateChanged: (callback) => {
    return auth().onAuthStateChanged(callback);
  }
};

const firebaseMessaging = {
  requestPermission: async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      if (enabled) {
        return { success: true };
      }
      return { success: false, error: 'Permission denied' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getToken: async () => {
    try {
      const token = await messaging().getToken();
      return { success: true, token };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  onMessage: (callback) => {
    return messaging().onMessage(callback);
  },

  onTokenRefresh: (callback) => {
    return messaging().onTokenRefresh(callback);
  }
};

export { firebaseAuth, firebaseMessaging };
export default firebaseAuth;
