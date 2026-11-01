'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import GoogleSignIn from './GoogleSignIn';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError ? decodeURIComponent(urlError) : null);
  const [resetSent, setResetSent] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError(
        'Supabase is not configured yet. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file to activate real authentication.'
      );
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError('Unable to initialize Supabase client.');
      return;
    }

    try {
      setLoading(true);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        router.push(redirectPath);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid login credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email above to receive a password reset link.');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured yet. Please add your credentials in .env.local.');
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });

      if (resetError) throw resetError;
      setResetSent(true);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset email.';
      setError(msg);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Heading */}
      <div className="space-y-2">
        <h2 className="font-serif text-3xl font-bold tracking-tight text-[#F8F5EE]">
          Welcome Back
        </h2>
        <p className="text-sm text-[#EDE5D6]/70">
          Continue your Kannada learning journey where you left off.
        </p>
      </div>

      {/* Google Sign-in */}
      <div>
        <GoogleSignIn text="Sign in with Google" onError={(msg) => setError(msg)} />
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-[#D5A64A]/20 w-full" />
        <span className="bg-[#101D36] px-3 text-[11px] uppercase tracking-wider text-[#EDE5D6]/60">
          or sign in with email
        </span>
        <div className="border-t border-[#D5A64A]/20 w-full" />
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-3 text-xs text-red-200 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {/* Success alert for password reset */}
      {resetSent && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-start gap-3 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>Password reset link sent to {email}. Check your inbox.</div>
        </div>
      )}

      {/* Email / Password Form */}
      <form onSubmit={handleSignIn} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-semibold text-[#EDE5D6]">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#EDE5D6]/50">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              autoComplete="email"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0A1222]/80 border border-[#D5A64A]/30 text-sm text-[#F8F5EE] placeholder-[#EDE5D6]/40 focus:outline-none focus:border-[#D5A64A] focus:ring-1 focus:ring-[#D5A64A] transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-semibold text-[#EDE5D6]">
              Password
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-[#D5A64A] hover:underline focus:outline-none"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#EDE5D6]/50">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0A1222]/80 border border-[#D5A64A]/30 text-sm text-[#F8F5EE] placeholder-[#EDE5D6]/40 focus:outline-none focus:border-[#D5A64A] focus:ring-1 focus:ring-[#D5A64A] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#EDE5D6]/50 hover:text-[#D5A64A] focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D5A64A] text-[#101D36] font-bold text-xs uppercase tracking-wider hover:bg-[#E8C77F] transition-all duration-200 shadow-lg shadow-[#D5A64A]/20 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#D5A64A]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#101D36]" />
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="text-center text-xs text-[#EDE5D6]/70">
        Don&apos;t have an account yet?{' '}
        <Link href="/signup" className="font-semibold text-[#D5A64A] hover:underline">
          Create Account
        </Link>
      </div>
    </div>
  );
}

