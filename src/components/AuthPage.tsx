import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Mail,
  Lock,
  KeyRound,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile } from '../types/builder';
import { useTheme } from '../context/ThemeContext';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { StudioImage } from './StudioImage';
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
        onToast(`Welcome back, ${userProfile.name}!`, 'success');
        onLoginSuccess(userProfile);
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (!EXPECTED_AUTH_CODES.has(code)) {
        console.warn('Unexpected Firebase Auth notice:', code, err?.message);
      }
      if (code === 'auth/email-already-in-use') {
        const msg =
          'This email is already registered. Switched to Log In — enter your password or continue with Google.';
        setAuthError(msg);
        onToast(msg, 'info');
        setMode('login');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        const msg =
          'Incorrect email or password. Double-check your credentials, reset your password, or use Google Sign-In.';
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
      email: 'alex.builder@studio.io',
      name: 'Elena Rostova',
      avatar: STUDIO_IMAGES.creatorAvatar,
      role: 'Pro Creator',
    };
    onToast('Signed in to Sandbox Mode as Elena Rostova', 'info');
    onLoginSuccess(demoUser);
  };

  return (
    <div className="flex-grow flex flex-col relative z-10 px-6 py-8 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <button
          type="button"
          onClick={onBackToHome}
          className="px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-700 dark:text-zinc-300 font-medium text-xs inline-flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Showcase</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Left Column: Studio Visual & Sandbox */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-zinc-800 aspect-[16/10] bg-stone-900">
            <StudioImage
              src={STUDIO_IMAGES.heroWorkspace}
              alt="BlockCraft Studio workstation preview"
              className="w-full h-full object-cover"
              fallbackLabel="BlockCraft Studio"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
              <img
                src={STUDIO_IMAGES.creatorAvatar}
                alt="Elena Rostova"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-white/30"
              />
              <div>
                <p className="text-xs font-semibold text-white">
                  Visual wiring & multi-target export in one canvas
                </p>
                <p className="text-[11px] text-zinc-300">
                  Elena Rostova · Studio Workspace
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
              Access your studio workspace
            </h1>
            <div className="space-y-2.5 text-sm text-stone-600 dark:text-zinc-400">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Sync projects across sessions with Firebase</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Export clean HTML, React TSX, and Flask code</span>
              </div>
            </div>
          </div>

          {allowDemoLogin && (
            <div className="atelier-surface rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-white">
                  Instant Sandbox Mode
                </p>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Test the full studio without creating an account
                </p>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="px-4 py-2 rounded-lg text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: themeConfig.accentHex }}
              >
                Demo Login
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Form Card */}
        <div className="lg:col-span-6 flex items-center">
          <div className="w-full atelier-surface rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center bg-stone-100 dark:bg-zinc-900 p-1 rounded-xl mb-6 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-colors text-center cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-white font-semibold shadow-xs'
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
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
                className={`flex-1 py-2 rounded-lg transition-colors text-center cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-white font-semibold shadow-xs'
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Log In
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{authError}</p>
              </div>
            )}

            {mode === 'signup' && !allowSignups && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  New account signups are currently paused by the administrator.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 dark:text-zinc-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 pl-9 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-600 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block font-medium text-stone-700 dark:text-zinc-300 mb-1.5">
                    Confirm Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 pl-9 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-600 transition-colors"
                    />
                    <Mail className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-medium text-stone-700 dark:text-zinc-300">
                    {mode === 'signup' ? 'Password (6+ characters)' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="font-medium hover:underline cursor-pointer"
                      style={{ color: themeConfig.accentHex }}
                    >
                      Forgot password?
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
                    className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 pl-9 pr-9 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-600 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block font-medium text-stone-700 dark:text-zinc-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 pl-9 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-600 transition-colors"
                    />
                    <KeyRound className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (mode === 'signup' && !allowSignups)}
                className="w-full py-2.5 rounded-xl text-white font-semibold text-xs transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: themeConfig.accentHex }}
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{mode === 'signup' ? 'Create Account & Launch' : 'Log In & Continue'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200 dark:border-zinc-800" />
                <span className="shrink-0 mx-3 text-stone-400 dark:text-zinc-500 text-[11px]">
                  or
                </span>
                <div className="flex-grow border-t border-stone-200 dark:border-zinc-800" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-900 hover:bg-stone-100 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-stone-800 dark:text-zinc-200 font-medium flex items-center justify-center gap-2 transition-colors text-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="atelier-surface rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-stone-900 dark:text-white mb-1">
              Reset Password
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mb-4 leading-relaxed">
              Enter your account email to receive a password recovery link.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-blue-600"
              />
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white font-semibold cursor-pointer"
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
