import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
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
  X,
  Loader2,
  Check
} from 'lucide-react';
import { ADMIN_CREDENTIALS } from '../data/mockData';
import { UserRole } from '../types';

interface AuthPageProps {
  onSuccess: (role: UserRole) => void;
  onBrowseLanding: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBrowseLanding }) => {
  const { login, loginWithGoogle, registerUser } = usePortal();

  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  // Only public roles: 'freelancer' or 'client'
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

  // Google Real-Time Auth State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleStep, setGoogleStep] = useState<'picker' | 'authenticating' | 'success'>('picker');
  const [googleProgressText, setGoogleProgressText] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  // Trigger Google Sign-In Flow
  const openGoogleAuth = () => {
    setErrorMessage(null);
    setGoogleStep('picker');
    setIsGoogleModalOpen(true);
  };

  const executeGoogleLogin = (email: string, name: string) => {
    setGoogleStep('authenticating');
    setGoogleProgressText('Connecting to accounts.google.com OAuth 2.0 service...');

    setTimeout(() => {
      setGoogleProgressText(`Verifying Google identity token for ${email}...`);
      
      setTimeout(() => {
        setGoogleProgressText('Generating authenticated session & security credentials...');

        setTimeout(() => {
          const res = loginWithGoogle(email, name, selectedRole);
          if (res.success && res.user) {
            setGoogleStep('success');
            setGoogleProgressText(`Signed in successfully as ${res.user.name}!`);
            
            setTimeout(() => {
              setIsGoogleModalOpen(false);
              onSuccess(selectedRole);
            }, 700);
          } else {
            setGoogleStep('picker');
            setErrorMessage('Unable to complete Google sign-in. Please try again.');
          }
        }, 600);
      }, 700);
    }, 700);
  };

  // Sign In Form Handler
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // If owner enters admin credentials 'abdary'
    if (
      usernameInput.trim().toLowerCase() === ADMIN_CREDENTIALS.username.toLowerCase() &&
      passwordInput === ADMIN_CREDENTIALS.password
    ) {
      const result = login(usernameInput, passwordInput, 'admin');
      if (result.success) {
        onSuccess('admin');
        return;
      }
    }

    const result = login(usernameInput, passwordInput, selectedRole);
    if (result.success) {
      if (usernameInput.trim().toLowerCase() === ADMIN_CREDENTIALS.username.toLowerCase()) {
        onSuccess('admin');
      } else {
        onSuccess(selectedRole);
      }
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

  // Discrete Admin Quick Access for Abdullah
  const handleAdminAccess = () => {
    setUsernameInput(ADMIN_CREDENTIALS.username);
    setPasswordInput(ADMIN_CREDENTIALS.password);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
        
        {/* Left Branding Panel (Desktop) */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 sm:p-10 flex flex-col justify-between text-white border-b md:border-b-0 md:border-r border-slate-800 relative">
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                  FreelancePort<span className="text-indigo-400">.pk</span>
                </span>
                <p className="text-[11px] text-slate-400">Freelancer &amp; Client SaaS Platform</p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Portal Access Gate
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-white leading-snug">
                Client relationships, projects, and invoices — unified.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log in to monitor assigned projects, download source deliverables, manage payments, and converse directly in real-time.
              </p>
            </div>

            <div className="space-y-2.5 pt-4 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dedicated Freelancer Workspace</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Isolated Client Self-Service Portal</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-Time Google ID One-Click Sign In</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 mt-8">
            <button
              onClick={onBrowseLanding}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Browse Public Website &amp; Pricing First</span>
            </button>
          </div>

        </div>

        {/* Right Authentication Form */}
        <div className="md:col-span-7 bg-white p-8 sm:p-10 flex flex-col justify-between space-y-6">
          
          <div className="space-y-5">
            
            {/* Header & Tabs */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl">
                  {authMode === 'signin' ? 'Sign In to Portal' : 'Create Your Account'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {authMode === 'signin'
                    ? 'Enter your credentials or use Google ID to continue'
                    : 'Register as a Freelancer or Client in seconds'}
                </p>
              </div>

              {/* Mode Toggle Switch */}
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

            {/* Real-time Google Authentication Button */}
            <div>
              <button
                type="button"
                onClick={openGoogleAuth}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs transition flex items-center justify-center gap-3 group cursor-pointer"
              >
                {/* Official Google SVG G-Icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-slate-700 font-bold group-hover:text-indigo-600">
                  Continue with Google
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full ml-auto">
                  Instant
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                or sign in with password
              </span>
            </div>

            {/* Role Select Bar - strictly only Freelancer & Client */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Choose Portal Account Type
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
                  <Briefcase className="w-4 h-4 text-indigo-600" />
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
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Client</span>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form 1: Sign In */}
            {authMode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
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
                  <label className="block font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
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
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                    selectedRole === 'freelancer'
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  <span>Sign In as {selectedRole === 'freelancer' ? 'Freelancer' : 'Client'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* Form 2: Register */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abdullah Khan"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Username</label>
                    <input
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
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
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
                    <label className="block font-semibold text-slate-700 mb-1">Company / Studio</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Studio"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+92 300 1234567"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Set Password</label>
                  <input
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
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

          </div>

          {/* Security and discrete owner admin access */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Protected by Role-Based Encryption</span>
            </span>
            <button
              type="button"
              onClick={handleAdminAccess}
              className="text-slate-400 hover:text-slate-600 text-[10px] underline cursor-pointer"
              title="Super Admin Credentials Gateway"
            >
              Executive Login
            </button>
          </div>

        </div>

      </div>

      {/* Real-Time Google OAuth / Identity Chooser Modal */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-6 sm:py-8">
            <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Google Brand Sticky Header */}
              <div className="sticky top-0 z-30 px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Sign in with Google</h4>
                    <p className="text-[11px] text-slate-500">to continue to FreelancePort.pk</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGoogleModalOpen(false)}
                  aria-label="Close"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer shrink-0 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
              
              {/* Step 1: Account Picker */}
              {googleStep === 'picker' && (
                <>
                  <div className="text-xs text-slate-600 font-medium">
                    Choose an account or proceed with your active Google profile:
                  </div>

                  {/* Primary Google Profile (Abdullah) */}
                  <button
                    type="button"
                    onClick={() => executeGoogleLogin('abdullahhgg09@gmail.com', 'Abdullah')}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 flex items-center gap-3.5 transition text-left cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                      A
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Abdullah</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-medium">
                          Active Account
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate">
                        abdullahhgg09@gmail.com
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition shrink-0" />
                  </button>

                  {/* Toggle Custom Google Account */}
                  {!showCustomGoogleInput ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomGoogleInput(true)}
                      className="w-full py-2 px-3 text-xs text-indigo-600 font-semibold hover:bg-indigo-50/50 rounded-lg text-left transition cursor-pointer flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Use another Google account</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs animate-in fade-in">
                      <div className="font-semibold text-slate-700">Enter Google Account Info:</div>
                      <input
                        type="text"
                        placeholder="Your Name (e.g. Asad Client)"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowCustomGoogleInput(false)}
                          className="px-3 py-1 text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (customGoogleEmail.trim()) {
                              executeGoogleLogin(
                                customGoogleEmail.trim(),
                                customGoogleName.trim() || 'Google User'
                              );
                            }
                          }}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer"
                        >
                          Sign In with this Email
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Role Confirmation within Google Auth */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Signing in as:</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('freelancer')}
                        className={`px-2.5 py-1 rounded-md font-semibold text-[11px] cursor-pointer ${
                          selectedRole === 'freelancer'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Freelancer
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('client')}
                        className={`px-2.5 py-1 rounded-md font-semibold text-[11px] cursor-pointer ${
                          selectedRole === 'client'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Client
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 text-center pt-2">
                    Google will securely share your verified name, email address, and language preference with FreelancePort.pk.
                  </div>
                </>
              )}

              {/* Step 2: Live Real-Time OAuth Handshake */}
              {googleStep === 'authenticating' && (
                <div className="py-8 text-center space-y-4">
                  <div className="relative inline-flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Authenticating via Google...</h5>
                    <p className="text-xs text-slate-500 mt-1 font-mono">{googleProgressText}</p>
                  </div>
                  <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full animate-pulse w-3/4"></div>
                  </div>
                </div>
              )}

              {/* Step 3: Success */}
              {googleStep === 'success' && (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Verified &amp; Authenticated!</h5>
                    <p className="text-xs text-emerald-600 font-medium mt-1">{googleProgressText}</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    )}

  </div>
  );
};
