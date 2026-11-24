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

export const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => googleProvider.addScope(scope));
// Force Google account chooser so ALL signed-in Google accounts appear for selection
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Strictly in-memory OAuth access token cache (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initFirebaseAuthListener = (
  onSignedOut?: () => void
) => {
  return onAuthStateChanged(firebaseAuth, (user: FirebaseUser | null) => {
    if (!user && !isSigningIn) {
      cachedAccessToken = null;
      if (onSignedOut) onSignedOut();
    }
  });
};

export const getInMemoryAccessToken = (): string | null => cachedAccessToken;

export interface GoogleSignInResult {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  accessToken: string | null;
}

export const signInWithGoogleAccounts = async (): Promise<GoogleSignInResult> => {
  isSigningIn = true;
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }

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
      accessToken: cachedAccessToken,
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
  cachedAccessToken = null;
  try {
    await firebaseAuth.signOut();
  } catch {
    // Ignore if no active Firebase session
  }
};

function encodeBase64UrlUtf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeMimeHeaderUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

export interface SendGmailConfirmationParams {
  toEmail: string;
  userName: string;
  role: UserRole;
  portalUrl: string;
  signedInAt: string;
}

export const sendLoginConfirmationEmail = async (
  params: SendGmailConfirmationParams
): Promise<{ messageId: string }> => {
  if (!cachedAccessToken) {
    throw new Error(
      'Gmail sending token expired or unavailable. Please click "Sign in with Google" again to grant permission.'
    );
  }

  const roleLabel =
    params.role === 'freelancer'
      ? 'Freelancer Workspace'
      : params.role === 'client'
      ? 'Client Portal'
      : 'Owner Console';

  const formattedTime = new Date(params.signedInAt).toLocaleString();
  const subject = `Sign-In Confirmed — FreelancePort.pk (${roleLabel})`;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
      <div style="background: #0f172a; color: #ffffff; padding: 24px;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #a5b4fc; font-weight: 700;">FreelancePort.pk</div>
        <h2 style="margin: 8px 0 0; font-size: 20px; font-weight: 700;">Login Confirmation</h2>
      </div>
      <div style="padding: 24px; color: #334155; font-size: 14px; line-height: 1.6;">
        <p>Assalam-o-Alaikum <strong>${params.userName}</strong>,</p>
        <p>Aap ka Gmail account (<strong>${params.toEmail}</strong>) kamyabi se <strong>FreelancePort.pk</strong> par sign in ho chuka hai.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 18px 0; font-size: 13px;">
          <div><strong>Account Role:</strong> ${roleLabel}</div>
          <div><strong>Email:</strong> ${params.toEmail}</div>
          <div><strong>Sign-In Time:</strong> ${formattedTime}</div>
        </div>
        <p>Ab aap apna workspace, project discussion rooms, files aur invoices directly access kar sakte hain.</p>
        <p style="margin-top: 20px;">
          <a href="${params.portalUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 10px; font-weight: 600; font-size: 13px;">
            Open Your Workspace
          </a>
        </p>
      </div>
    </div>
  `.trim();

  const rawMime = [
    `To: ${params.toEmail}`,
    `From: ${params.toEmail}`,
    `Subject: ${encodeMimeHeaderUtf8(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody,
  ].join('\r\n');

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodeBase64UrlUtf8(rawMime),
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const errMsg =
      errBody?.error?.message || `Gmail API error (HTTP ${response.status})`;
    throw new Error(errMsg);
  }

  const data = await response.json();
  return { messageId: data.id || 'sent' };
};
