import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import {
  Layers,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Lock,
  Mail,
  User,
  Building,
  Phone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Globe
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
  const [selectedRole, setSelectedRole] = useState<UserRole>('freelancer');
  
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

  // Google Sign-In Handler
  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    // Simulate Google account chooser / OAuth handshake
    setTimeout(() => {
      const res = loginWithGoogle('abdullahhgg09@gmail.com', 'Abdullah (Google User)', selectedRole);
      setIsGoogleLoading(false);
      if (res.success && res.user) {
        onSuccess(res.user.role);
      } else {
        setErrorMessage('Unable to complete Google sign-in. Please try again.');
      }
    }, 600);
  };

  // Sign In Form Handler
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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

  // Quick Demo Pre-fill helpers
  const handlePreFillAdmin = () => {
    setAuthMode('signin');
    setSelectedRole('admin');
    setUsernameInput(ADMIN_CREDENTIALS.username);
    setPasswordInput(ADMIN_CREDENTIALS.password);
    setErrorMessage(null);
  };

  const handlePreFillFreelancer = () => {
    setAuthMode('signin');
    setSelectedRole('freelancer');
    setUsernameInput('hamza_dev');
    setPasswordInput('password123');
    setErrorMessage(null);
  };

  const handlePreFillClient = () => {
    setAuthMode('signin');
    setSelectedRole('client');
    setUsernameInput('sarah_technova');
    setPasswordInput('password123');
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
                <span>Executive Super Admin Monitoring</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Isolated Client Self-Service Dashboard</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>One-Click Google ID Authentication</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 mt-8">
            <button
              onClick={onBrowseLanding}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center gap-2 transition"
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
                  className={`px-3 py-1 rounded-lg transition ${
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
                  className={`px-3 py-1 rounded-lg transition ${
                    authMode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Google Authentication Button */}
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs transition flex items-center justify-center gap-3 group"
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
                <span>
                  {isGoogleLoading
                    ? 'Connecting Google Account...'
                    : 'Continue with Google Account'}
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                or with credentials
              </span>
            </div>

            {/* Role Select Bar */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedRole('freelancer')}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                    selectedRole === 'freelancer'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Freelancer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('client')}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                    selectedRole === 'client'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Client</span>
                </button>

                <button
                  type="button"
                  onClick={handlePreFillAdmin}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                    selectedRole === 'admin'
                      ? 'border-rose-600 bg-rose-50 text-rose-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
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
                {selectedRole === 'admin' && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[11px] space-y-0.5">
                    <div className="font-bold">Super Admin Credentials (Pre-filled):</div>
                    <div>Username: <strong className="font-mono text-rose-950">abdary</strong></div>
                    <div>Password: <strong className="font-mono text-rose-950">abdary123!@#</strong></div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. abdary or your email"
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
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center gap-2 ${
                    selectedRole === 'admin'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                      : selectedRole === 'freelancer'
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  <span>Sign In as {selectedRole === 'admin' ? 'Super Admin' : selectedRole === 'freelancer' ? 'Freelancer' : 'Client'}</span>
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
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center gap-2 ${
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

          {/* Security and privacy guarantee footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Protected by Role-Based Encryption</span>
            </span>
            <span>FreelancePort SaaS Security</span>
          </div>

        </div>

      </div>

    </div>
  );
};
