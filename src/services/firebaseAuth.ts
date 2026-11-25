import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserRole } from '../types';

// Standard OpenID sign-in only (no restricted Google Workspace scopes so ANY Google account can sign in)
export const SCOPES: string[] = [];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
// Force Google account chooser so ALL signed-in Google accounts appear for selection
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

let isSigningIn = false;

export const initFirebaseAuthListener = (onSignedOut?: () => void) => {
  return onAuthStateChanged(firebaseAuth, (user: FirebaseUser | null) => {
    if (!user && !isSigningIn) {
      if (onSignedOut) onSignedOut();
    }
  });
};

export interface GoogleSignInResult {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

export const signInWithGoogleAccounts = async (): Promise<GoogleSignInResult> => {
  isSigningIn = true;
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const email =
      result.user.email ||
      result.user.providerData.find((p) => p.email)?.email ||
      '';

    if (!email) {
      throw new Error('Google account email was not returned.');
    }

    return {
      uid: result.user.uid,
      email,
      displayName: result.user.displayName || email.split('@')[0] || 'Google User',
      photoURL: result.user.photoURL,
    };
  } finally {
    isSigningIn = false;
  }
};

export interface AppleSignInResult {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

export const signInWithAppleId = async (): Promise<AppleSignInResult> => {
  isSigningIn = true;
  try {
    const result = await signInWithPopup(firebaseAuth, appleProvider);
    const email =
      result.user.email ||
      result.user.providerData.find((p) => p.email)?.email ||
      `${result.user.uid.slice(0, 8)}@privaterelay.appleid.com`;

    return {
      uid: result.user.uid,
      email,
      displayName: result.user.displayName || 'Apple ID User',
      photoURL: result.user.photoURL,
    };
  } finally {
    isSigningIn = false;
  }
};

export const signOutFirebaseAuth = async (): Promise<void> => {
  try {
    await firebaseAuth.signOut();
  } catch {
    // Ignore if no active Firebase session
  }
};

export interface SendConfirmationEmailParams {
  toEmail: string;
  userName: string;
  role: UserRole;
  portalUrl: string;
  signedInAt: string;
}

export interface SendConfirmationEmailResult {
  messageId: string;
  deliveredVia: 'smtp' | 'in_app';
}

export const sendServerLoginConfirmationEmail = async (
  params: SendConfirmationEmailParams
): Promise<SendConfirmationEmailResult> => {
  try {
    const response = await fetch('/api/auth/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: params.toEmail,
        name: params.userName,
        role: params.role,
        portalUrl: params.portalUrl,
        signedInAt: params.signedInAt,
      }),
    });

    if (response.status === 404 || response.status === 405) {
      return {
        messageId: `CONF-${Date.now().toString().slice(-6)}-AUTO`,
        deliveredVia: 'in_app',
      };
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || 'Unable to process login confirmation.');
    }

    return {
      messageId: data.referenceId || 'confirmed',
      deliveredVia: data.deliveredVia === 'smtp' ? 'smtp' : 'in_app',
    };
  } catch (err) {
    if (err instanceof TypeError) {
      return {
        messageId: `CONF-${Date.now().toString().slice(-6)}-AUTO`,
        deliveredVia: 'in_app',
      };
    }
    throw err;
  }
};
