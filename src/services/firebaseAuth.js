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
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber, false);
      return { success: true, confirmation };
    } catch (error) {
      return { success: false, error: error.message, code: error.code };
    }
  },

  confirmOTP: async (confirmation, otp) => {
    try {
      const result = await confirmation.confirm(otp);
      const idToken = await result.user.getIdToken();
      return { success: true, user: result.user, idToken };
    } catch (error) {
      return { success: false, error: error.message, code: error.code };
    }
  },

  signInWithGoogle: async () => {
    try {
      await GoogleSignin.signOut();
      await GoogleSignin.signIn();
      const googleIdToken = await GoogleSignin.getTokens();
      const credential = auth.GoogleAuthProvider.credential(googleIdToken.idToken);
      const result = await auth().signInWithCredential(credential);
      const firebaseIdToken = await result.user.getIdToken();
      const firebaseUser = result.user;
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
      return { success: false, error: error.message, code: error.code };
    }
  },

  signInWithEmail: async (email, password) => {
    try {
      const result = await auth().signInWithEmailAndPassword(email, password);
      const idToken = await result.user.getIdToken();
      return { success: true, user: result.user, idToken };
    } catch (error) {
      return { success: false, error: error.message, code: error.code };
    }
  },

  createUserWithEmail: async (email, password) => {
    try {
      const result = await auth().createUserWithEmailAndPassword(email, password);
      const idToken = await result.user.getIdToken();
      return { success: true, user: result.user, idToken };
    } catch (error) {
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
