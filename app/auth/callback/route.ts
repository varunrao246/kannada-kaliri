import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isOnboardingCompleted } from '@/lib/services/profile';
import { sanitizeDestination } from '@/lib/security/url-sanitizer';

export { sanitizeDestination };

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const rawNext = requestUrl.searchParams.get('next');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';

  const baseOrigin = !isLocalEnv && forwardedHost
    ? `https://${forwardedHost}`
    : requestUrl.origin;

  const errorParam = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');
  if (errorParam) {
    console.error('OAuth provider error in callback:', errorParam);
    return NextResponse.redirect(`${baseOrigin}/login?error=${encodeURIComponent(errorParam)}`);
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let completed = false;
        if (user) {
          completed = await isOnboardingCompleted(user.id, supabase);
        }

        if (completed) {
          const destination = sanitizeDestination(rawNext, '/dashboard');
          // If completed user had destination pointing to /onboarding, route to /dashboard
          const finalPath = destination.startsWith('/onboarding') ? '/dashboard' : destination;
          return NextResponse.redirect(`${baseOrigin}${finalPath}`);
        } else {
          return NextResponse.redirect(`${baseOrigin}/onboarding`);
        }
      }
      console.error('Supabase auth callback error:', error.message);
      return NextResponse.redirect(`${baseOrigin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  return NextResponse.redirect(`${baseOrigin}/login?error=Invalid+or+missing+authorization+code`);
}
