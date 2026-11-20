import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Sparkles, Mail, Lock, KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types/builder';
import { useTheme } from '../context/ThemeContext';
import {
  auth,
  googleProvider,
  mapFirebaseUser,
  syncUserProfile,
} from '../lib/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';

interface AuthPageProps {
  onBackToHome: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  allowSignups?: boolean;
  allowDemoLogin?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onBackToHome,
  onLoginSuccess,
  onToast,
  allowSignups = true,
  allowDemoLogin = true,
}) => {
  const { themeConfig } = useTheme();
  const [mode, setMode] = useState<'signup' | 'login'>(allowSignups ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const EXPECTED_AUTH_CODES = new Set([
    'auth/invalid-credential',
    'auth/wrong-password',
    'auth/user-not-found',
    'auth/email-already-in-use',
    'auth/popup-closed-by-user',
    'auth/cancelled-popup-request',
    'auth/too-many-requests',
    'auth/weak-password',
    'auth/invalid-email',
    'auth/operation-not-allowed',
  ]);

  useEffect(() => {
    if (!allowSignups && mode === 'signup') {
      setMode('login');
    }
    setAuthError(null);
  }, [allowSignups]);

  // REAL FIREBASE EMAIL/PASSWORD AUTH
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (mode === 'signup' && !allowSignups) {
      const msg = 'New user registrations are currently paused by the administrator.';
      setAuthError(msg);
      onToast(msg, 'error');
      return;
    }

    if (!email || !email.includes('@')) {
      const msg = 'Please enter a valid email address.';
      setAuthError(msg);
      onToast(msg, 'error');
      return;
    }

    if (mode === 'signup') {
      if (email !== confirmEmail) {
        const msg = 'Emails do not match.';
        setAuthError(msg);
        onToast(msg, 'error');
        return;
      }
      if (password.length < 6) {
        const msg = 'Password must be at least 6 characters.';
        setAuthError(msg);
        onToast(msg, 'error');
        return;
      }
      if (password !== confirmPassword) {
        const msg = 'Passwords do not match.';
        setAuthError(msg);
        onToast(msg, 'error');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const username = email.split('@')[0] || 'Developer';
        const displayName = username.charAt(0).toUpperCase() + username.slice(1);
        await updateProfile(cred.user, { displayName });

        const userProfile = mapFirebaseUser({
          ...cred.user,
          displayName,
        });

        await syncUserProfile(userProfile).catch((err) => console.warn('Profile sync notice:', err));
        onToast(`Firebase account created! Welcome ${displayName}.`, 'success');
        onLoginSuccess(userProfile);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userProfile = mapFirebaseUser(cred.user);
        await syncUserProfile(userProfile).catch((err) => console.warn('Profile sync notice:', err));
        onToast(`Welcome back, ${userProfile.name}! (Firebase Auth)`, 'success');
        onLoginSuccess(userProfile);
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (!EXPECTED_AUTH_CODES.has(code)) {
        console.warn('Unexpected Firebase Auth notice:', code, err?.message);
      }
      if (code === 'auth/email-already-in-use') {
        const msg = 'This email is already registered. Switched to Log In — enter your password or continue with Google.';
        setAuthError(msg);
        onToast(msg, 'info');
        setMode('login');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        const msg = 'Incorrect email or password. Double-check your credentials, reset your password, or use Google Sign-In.';
        setAuthError(msg);
        onToast('Invalid email or password.', 'error');
      } else if (code === 'auth/user-not-found') {
        const msg = 'No account found for this email. Please create an account first.';
        setAuthError(msg);
        onToast(msg, 'error');
      } else if (code === 'auth/too-many-requests') {
        const msg = 'Too many attempts. Wait a moment or reset your password.';
        setAuthError(msg);
        onToast(msg, 'error');
      } else if (code === 'auth/operation-not-allowed') {
        const msg = 'Email/Password sign-in is not enabled. Please continue with Google!';
        setAuthError(msg);
        onToast(msg, 'info');
      } else {
        const msg = err?.message || 'Authentication failed. Please try again.';
        setAuthError(msg);
        onToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // REAL FIREBASE GOOGLE SIGN-IN
  const handleGoogleLogin = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const userProfile = mapFirebaseUser(cred.user);
      await syncUserProfile(userProfile).catch((err) => console.warn('Profile sync notice:', err));
      onToast(`Signed in with Google as ${userProfile.name}!`, 'success');
      onLoginSuccess(userProfile);
    } catch (err: any) {
      const code = err?.code || '';
      if (!EXPECTED_AUTH_CODES.has(code)) {
        console.warn('Unexpected Google Sign-In notice:', code, err?.message);
      }
      if (code === 'auth/popup-closed-by-user') {
        onToast('Google Sign-In popup was closed before completing sign-in.', 'info');
      } else if (code === 'auth/cancelled-popup-request') {
        onToast('Sign-In request cancelled.', 'info');
      } else {
        const msg = err?.message || 'Google authentication failed.';
        setAuthError(msg);
        onToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // REAL FIREBASE PASSWORD RESET
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setShowForgotModal(false);
      onToast(`Password reset link sent to ${forgotEmail}. Please check your inbox.`, 'success');
      setForgotEmail('');
    } catch (err: any) {
      if (!EXPECTED_AUTH_CODES.has(err?.code || '')) {
        console.warn('Password Reset notice:', err?.code, err?.message);
      }
      onToast(err?.message || 'Failed to send reset email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUser: UserProfile = {
      id: 'demo_user',
      email: 'alex.builder@universe.io',
      name: 'Alex Sterling',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      role: 'Pro Creator',
    };
    onToast('Logged in as Offline Demo Explorer (Alex Sterling)', 'info');
    onLoginSuccess(demoUser);
  };

  return (
    <div className="flex-grow flex flex-col relative z-10 px-6 py-8 max-w-5xl mx-auto w-full">
      {/* Top back button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={onBackToHome}
          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium text-xs flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center py-2">
        {/* Left Column: Info */}
        <div className="lg:col-span-6 space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
            <span>SL BUILDER AUTH</span>
            <span aria-hidden="true">·</span>
            <span>DEVELOPER GATEWAY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Sign in to your <br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${themeConfig.gradientText}`}>
              studio workspace.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
            Create an account or log in to manage your canvases, auto-sync reactive logic states, and compile code.
          </p>

          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>One unified profile for every workspace & canvas</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant local-first offline activation</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Unlimited export to HTML, React, and Python</span>
            </div>
          </div>

          {/* Quick Demo Access */}
          {allowDemoLogin && (
            <div className="pt-2">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Instant Sandbox Mode</p>
                  <p className="text-[11px] text-slate-400">Test without creating an account</p>
                </div>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: themeConfig.accentHex }}
                >
                  Demo Login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Form Card */}
        <div className="lg:col-span-6">
          <div className="studio-card rounded-2xl p-6 sm:p-7 border border-white/10 shadow-2xl relative">
            {/* Mode Switch Tabs */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5 mb-5 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                  mode === 'signup' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                  mode === 'login' ? 'bg-white/15 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Log In
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-300">Authentication Notice</p>
                  <p className="text-[11px] text-rose-200/85 mt-0.5 leading-relaxed">{authError}</p>
                </div>
              </div>
            )}

            {mode === 'signup' && !allowSignups && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-300">Registrations Temporarily Paused</p>
                  <p className="text-[11px] text-amber-200/80 mt-0.5">
                    New account signups are disabled by the platform administrator. Existing members and admins can still log in.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#080b13] border border-white/10 rounded-xl px-3 py-2.5 pl-8 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Confirm Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-[#080b13] border border-white/10 rounded-xl px-3 py-2.5 pl-8 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-300">
                    {mode === 'signup' ? 'Password (6+ characters)' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-indigo-400 hover:underline text-[11px]"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#080b13] border border-white/10 rounded-xl px-3 py-2.5 pl-8 pr-8 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#080b13] border border-white/10 rounded-xl px-3 py-2.5 pl-8 pr-8 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (mode === 'signup' && !allowSignups)}
                className="w-full py-2.5 rounded-xl text-white font-semibold text-xs shadow-lg transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: themeConfig.accentHex }}
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{mode === 'signup' ? 'Create Account & Launch' : 'Log In & Continue'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="shrink-0 mx-3 text-slate-600 text-[10px]">or</span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              {/* Google Login button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium flex items-center justify-center gap-2 transition-colors text-xs disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-1">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Enter your account email to receive a password recovery link.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-3.5 text-xs">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#080b13] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 text-slate-300 font-semibold text-xs hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-white font-semibold text-xs shadow-md"
                  style={{ backgroundColor: themeConfig.accentHex }}
                >
                  Send Recovery Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
