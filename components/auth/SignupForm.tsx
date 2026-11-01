'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import GoogleSignIn from './GoogleSignIn';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function SignupForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password strength calculation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore = [hasMinLength, hasNumber, hasMixedCase, hasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (!password) return '';
    if (strengthScore <= 1) return 'Weak';
    if (strengthScore === 2 || strengthScore === 3) return 'Moderate';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (strengthScore <= 1) return 'bg-red-500';
    if (strengthScore === 2 || strengthScore === 3) return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError(
        'Supabase is not configured yet. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file to enable registration.'
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // If Supabase has email confirmation enabled, data.session might be null
      if (data.user && !data.session) {
        setSuccessMsg(
          'Registration successful! Please check your email inbox to confirm your account, then log in.'
        );
      } else if (data.session) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register account.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Heading */}
      <div className="space-y-2">
        <h2 className="font-serif text-3xl font-bold tracking-tight text-[#F8F5EE]">
          Create Account
        </h2>
        <p className="text-sm text-[#EDE5D6]/70">
          Begin speaking Kannada with warmth, clarity and cultural respect.
        </p>
      </div>

      {/* Google Sign-in */}
      <div>
        <GoogleSignIn text="Sign up with Google" onError={(msg) => setError(msg)} />
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-[#D5A64A]/20 w-full" />
        <span className="bg-[#101D36] px-3 text-[11px] uppercase tracking-wider text-[#EDE5D6]/60">
          or register with email
        </span>
        <div className="border-t border-[#D5A64A]/20 w-full" />
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-3 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {/* Success alert */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-start gap-3 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{successMsg}</div>
        </div>
      )}

      <form onSubmit={handleSignUp} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="fullName" className="block text-xs font-semibold text-[#EDE5D6]">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#EDE5D6]/50">
              <User className="w-4 h-4" />
            </div>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
              required
              autoComplete="name"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0A1222]/80 border border-[#D5A64A]/30 text-sm text-[#F8F5EE] placeholder-[#EDE5D6]/40 focus:outline-none focus:border-[#D5A64A] focus:ring-1 focus:ring-[#D5A64A] transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="block text-xs font-semibold text-[#EDE5D6]">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#EDE5D6]/50">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="signup-email"
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
          <label htmlFor="signup-password" className="block text-xs font-semibold text-[#EDE5D6]">
            Password (min 8 characters)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#EDE5D6]/50">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="new-password"
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

          {/* Password strength bar */}
          {password && (
            <div className="pt-1.5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#EDE5D6]/60">Strength:</span>
                <span className="font-semibold text-[#EDE5D6]">{getStrengthLabel()}</span>
              </div>
              <div className="w-full bg-[#0A1222] h-1.5 rounded-full overflow-hidden flex gap-1">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getStrengthColor()}`}
                  style={{ width: `${(strengthScore / 4) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="block text-xs font-semibold text-[#EDE5D6]">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#EDE5D6]/50">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="new-password"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0A1222]/80 border border-[#D5A64A]/30 text-sm text-[#F8F5EE] placeholder-[#EDE5D6]/40 focus:outline-none focus:border-[#D5A64A] focus:ring-1 focus:ring-[#D5A64A] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#EDE5D6]/50 hover:text-[#D5A64A] focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Terms Acknowledgement */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            id="terms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            required
            className="mt-1 w-4 h-4 rounded border-[#D5A64A]/40 bg-[#0A1222] text-[#D5A64A] focus:ring-[#D5A64A]"
          />
          <label htmlFor="terms" className="text-xs text-[#EDE5D6]/80 leading-snug">
            I agree to the{' '}
            <span className="text-[#D5A64A] hover:underline cursor-pointer">
              Terms of Service
            </span>{' '}
            and acknowledge the{' '}
            <span className="text-[#D5A64A] hover:underline cursor-pointer">
              Privacy Policy
            </span>
            .
          </label>
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
            <span>Create Free Account</span>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="text-center text-xs text-[#EDE5D6]/70">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[#D5A64A] hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
