import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import {
  signInWithGoogleAccounts,
  signInWithAppleId,
} from '../services/firebaseAuth';
import {
  Layers,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Mail
} from 'lucide-react';
import { UserRole } from '../types';

interface AuthPageProps {
  onSuccess: (role: UserRole) => void;
  onBrowseLanding: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBrowseLanding }) => {
  const {
    login,
    loginAdmin,
    claimAdminPassword,
    loginWithGoogle,
    loginWithApple,
    registerUser,
  } = usePortal();

  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [selectedRole, setSelectedRole] = useState<'freelancer' | 'client'>('freelancer');

  // Sign In inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Status/Error feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsAdminClaim, setNeedsAdminClaim] = useState(false);

  // Real Multi-Account Google OAuth Sign-In (shows ALL Google accounts via prompt=select_account)
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const googleResult = await signInWithGoogleAccounts();
      const res = loginWithGoogle(
        googleResult.email,
        googleResult.displayName,
        selectedRole,
        googleResult.photoURL,
        true
      );
      if (res.success) {
        onSuccess(selectedRole);
      } else {
        setErrorMessage('This Google account has been suspended by the platform administrator.');
      }
    } catch (err: any) {
      const code = err?.code || '';
      const rawMessage = String(err?.message || '');
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMessage('Google sign-in popup was closed before selecting an account. Please try again.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage('Browser popup was blocked. Please allow popups for this site to choose your Google account.');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMessage(
          `Domain "${window.location.hostname}" is not authorized yet. Add it in Firebase Console -> Authentication -> Settings -> Authorized domains.`
        );
      } else if (
        code === 'auth/operation-not-allowed' ||
        code === 'auth/admin-restricted-operation' ||
        rawMessage.toLowerCase().includes('verification') ||
        rawMessage.toLowerCase().includes('testing')
      ) {
        setErrorMessage(
          'Google OAuth is still in Testing mode on project quaint-osprey-0v9wh. Open Google Cloud Console -> Google Auth Platform -> Audience and click "Publish App" (or add the email under Test users).'
        );
      } else {
        setErrorMessage(rawMessage || 'Unable to complete Google sign-in. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Real Apple ID OAuth Sign-In
  const handleAppleLogin = async () => {
    setErrorMessage(null);
    setIsAppleLoading(true);
    try {
      const appleResult = await signInWithAppleId();
      const res = loginWithApple(
        appleResult.email,
        appleResult.displayName,
        selectedRole,
        appleResult.photoURL
      );
      if (res.success) {
        onSuccess(selectedRole);
      } else {
        setErrorMessage('This Apple ID account has been suspended by the platform administrator.');
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMessage('Apple ID sign-in window was closed before completing login.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage('Browser popup was blocked. Please allow popups for this site to sign in with Apple ID.');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMessage(
          `Domain "${window.location.hostname}" is not authorized yet. Add it in Firebase Console -> Authentication -> Settings -> Authorized domains.`
        );
      } else if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
        setErrorMessage(
          'Apple ID Sign-In requires enabling the Apple provider (with your Apple Developer Services ID) inside Firebase Console -> Authentication -> Sign-in method.'
        );
      } else {
        setErrorMessage(err?.message || 'Unable to complete Apple ID sign-in.');
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  // Sign In Form Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanInput = usernameInput.trim().toLowerCase();

    // Admin authentication goes strictly through server-side verification
    if (cleanInput === 'abdullahhgg09@gmail.com') {
      setIsSubmitting(true);
      try {
        if (needsAdminClaim) {
          const claimRes = await claimAdminPassword(cleanInput, passwordInput);
          if (claimRes.success) {
            setNeedsAdminClaim(false);
            onSuccess('admin');
          } else {
            setErrorMessage(claimRes.message || 'Unable to set admin password.');
          }
          return;
        }

        const adminRes = await loginAdmin(cleanInput, passwordInput);
        if (adminRes.success) {
          onSuccess('admin');
        } else if (adminRes.needsClaim) {
          setNeedsAdminClaim(true);
          setErrorMessage(
            'First-time Admin setup: Submit again with your chosen Admin password (min 8 characters) to lock and activate Admin access.'
          );
        } else {
          setErrorMessage(adminRes.message || 'Invalid admin email or password.');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const result = login(usernameInput, passwordInput, selectedRole);
    if (result.success) {
      onSuccess(selectedRole);
    } else {
      setErrorMessage(result.message || 'Invalid credentials. Please verify your username and password.');
    }
  };

  // Register Form Handler
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (regPassword && regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    const res = registerUser({
      name: regName,
      email: regEmail,
      username: regUsername || regName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      role: selectedRole,
      company: regCompany,
      phone: regPhone,
    });

    if (res.success) {
      onSuccess(selectedRole);
    } else {
      setErrorMessage(res.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
        {/* Left Branding Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 sm:p-10 flex flex-col justify-between text-white border-b md:border-b-0 md:border-r border-slate-800 relative">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                <Layers className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                  FreelancePort<span className="text-indigo-400">.pk</span>
                </span>
                <p className="text-[11px] text-slate-400">Freelancer &amp; Client SaaS Platform</p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Portal Access Gate
              </span>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-white leading-snug">
                Client relationships, projects, and invoices — unified.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Apne kisi bhi Google account ya Apple ID se sign in karein, real-time chat rooms join karein, aur Gmail login confirmation receive karein.
              </p>
            </div>

            <div className="space-y-2.5 pt-4 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>All Device Google Accounts Chooser</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>Sign in with Apple ID Support</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
                <span>Instant Gmail Confirmation on Sign-In</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 mt-8">
            <button
              type="button"
              onClick={onBrowseLanding}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
              <span>Back to Landing Page</span>
            </button>
          </div>
        </div>

        {/* Right Authentication Form */}
        <div className="md:col-span-7 bg-white p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Header & Tabs */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-xl">
                  {authMode === 'signin' ? 'Sign In to Portal' : 'Create Your Account'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {authMode === 'signin'
                    ? 'Choose Freelancer or Client, then pick your Google or Apple account'
                    : 'Register as a Freelancer or Client in seconds'}
                </p>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage(null);
                  }}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    authMode === 'signin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage(null);
                  }}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    authMode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Role Select Bar - strictly only Freelancer & Client */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                1. Choose Portal Account Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('freelancer')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition cursor-pointer ${
                    selectedRole === 'freelancer'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 font-bold shadow-xs ring-1 ring-indigo-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  <span>Freelancer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('client')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition cursor-pointer ${
                    selectedRole === 'client'
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-700 font-bold shadow-xs ring-1 ring-emerald-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>Client</span>
                </button>
              </div>
            </div>

            {/* Google Multi-Account & Apple ID Sign In Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isAppleLoading}
                className="gsi-material-button w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs transition flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" aria-hidden="true" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                )}
                <span className="font-semibold text-slate-800">
                  {isGoogleLoading ? 'Opening Google Accounts...' : 'Sign in with Google (All Accounts)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleAppleLogin}
                disabled={isGoogleLoading || isAppleLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
              >
                {isAppleLoading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin shrink-0" aria-hidden="true" />
                ) : (
                  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                )}
                <span>{isAppleLoading ? 'Connecting to Apple ID...' : 'Continue with Apple'}</span>
              </button>

              <p className="text-[11px] text-slate-500 text-center">
                Google par click karne par aap ke browser ke tamam Google accounts show honge aur sign-in par Gmail confirmation bheji ja sakegi.
              </p>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                or sign in with password
              </span>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form 1: Sign In */}
            {authMode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-3.5 text-xs">
                <div>
                  <label htmlFor="authpage-signin-username" className="block font-semibold text-slate-700 mb-1">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" aria-hidden="true" />
                    <input
                      id="authpage-signin-username"
                      type="text"
                      required
                      placeholder="e.g. your username or email"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="authpage-signin-password" className="block font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" aria-hidden="true" />
                    <input
                      id="authpage-signin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter password..."
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer ${
                    selectedRole === 'freelancer'
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  <span>
                    {isSubmitting
                      ? 'Verifying...'
                      : needsAdminClaim
                      ? 'Set Password & Open Admin Panel'
                      : `Sign In as ${selectedRole === 'freelancer' ? 'Freelancer' : 'Client'}`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </form>
            )}

            {/* Form 2: Register */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="reg-fullname" className="block font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      id="reg-fullname"
                      type="text"
                      required
                      placeholder="e.g. Abdullah Khan"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-username" className="block font-semibold text-slate-700 mb-1">Username</label>
                    <input
                      id="reg-username"
                      type="text"
                      required
                      placeholder="e.g. abdullah_dev"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="reg-company" className="block font-semibold text-slate-700 mb-1">Company / Studio</label>
                    <input
                      id="reg-company"
                      type="text"
                      placeholder="e.g. Apex Studio"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-phone" className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      id="reg-phone"
                      type="text"
                      placeholder="+92 300 1234567"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className="block font-semibold text-slate-700 mb-1">Set Password</label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    placeholder="Create a password (min 6 characters)"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                    selectedRole === 'freelancer'
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  <span>Create {selectedRole === 'freelancer' ? 'Freelancer' : 'Client'} Account</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </form>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>Protected by Role-Based Encryption</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
