# KANNADA FOR EVERYONE (ಕನ್ನಡ ಕಲಿರಿ)
> *"Learn the language. Experience the culture."*
> *"Kannada is more than a language. It's a connection."*

An AI-powered multilingual EdTech platform engineered specifically for non-Kannada speakers living, working, and travelling in Karnataka to learn, understand, and speak Kannada with authentic cultural confidence.

---

## 🏛️ Milestone 01: Premium Landing Page + Supabase Google Authentication

### 1. Technology Architecture
- **Framework:** Next.js (App Router, Turbopack, React 19)
- **Language:** Strict TypeScript
- **Styling:** Tailwind CSS v4 with custom Mysore Royal theme design tokens
- **Typography:** 
  - `Cinzel` (Royal Mysore Serif headlines)
  - `Manrope` (Clean editorial body typography)
  - `Noto Sans Kannada` (Authentic Kannada font rendering)
- **Motion & Micro-interactions:** Framer Motion (respects `prefers-reduced-motion`)
- **Icons:** Lucide React
- **Authentication Engine:** Supabase Authentication (`@supabase/supabase-js`, `@supabase/ssr`)
- **Route Session Management:** Next.js Server-side code exchange callback and edge proxy session validation

---

## 🎨 Visual Identity & Color Palette

- **Royal Navy:** `#101D36` (Primary canvas & luxury backdrop)
- **Royal Navy Dark:** `#0A1222` (Deep contrast layers)
- **Mysore Gold:** `#D5A64A` (Primary cultural accent & illuminated borders)
- **Warm Ivory:** `#F8F5EE` (Primary readable typography)
- **Heritage Cream:** `#EDE5D6` (Secondary text & editorial metadata)
- **Charcoal:** `#242424` (Deep neutral)

---

## 🚀 Key Features Implemented

### 1. Cinematic Hero Section
- High-resolution Sony A7 IV photograph of **Mysore Palace illuminated at night** (`public/images/mysore-palace.jpg`).
- Slow cinematic background zoom animation.
- Floating golden ambient particles and decorative Kannada characters (`ಅ`, `ಆ`, `ಕ`, `ಸ್ವಾಗತ`, `ನಮಸ್ಕಾರ`, `ಳ`, `ಜ್ಞ`).
- Primary CTA: **"Start Learning Kannada"** (Navigates to `/signup`).
- Secondary CTA: **"Explore the Experience"** (Smooth scrolls to features).
- Subtle animated scroll indicator.

### 2. Sticky Glassmorphism Navigation Bar
- Transparent over hero, transitions to royal navy blur on scroll (`scrollY > 40`).
- Responsive mobile drawer menu with touch-friendly navigation.
- Dynamic session detection showing "Sign In / Get Started" for guests and "Dashboard / Sign Out" for authenticated learners.

### 3. Editorial Landing Page Sections
- **Section A — Why Learn Kannada?**: "Belong wherever you go." Explaining community communication, daily errand navigation, workplace relationships, and cultural grounding, with classical antiquity statistics (2,000+ years, 50M+ speakers, 8 Jnanpith awards).
- **Section B — Three Learning Pillars**: 
  1. *Learn Kannada* (Foundational phonetics, vocabulary & syntax)
  2. *Speak Kannada* (AI-powered voice tutor with pronunciation feedback)
  3. *Experience Kannada* (Real-world Bangalore simulations: auto rickshaws, Darshini restaurants, hospitals, office conversations)
  Interactive interactive tabs with real spoken Kannada phrase breakdowns.
- **Section C — Cultural Heritage**: Highlighting Mysore Palace (Amba Vilas), Hampi (Vijayanagara Empire, UNESCO World Heritage), and Classical Kannada linguistic heritage (Halmidi 450 CE, Vachana literature).
- **Section D — How It Works**: 4-step progressive pathway from native language selection to fluent everyday conversations.
- **Section E — Final CTA**: "Your first Kannada conversation starts here."
- **Section F — Comprehensive Footer**: Brand identity, quick navigation, legal links, and Bangalore craftsmanship attribution.

### 4. Supabase Authentication System
- **Real Supabase Client & Server Architecture**:
  - `lib/supabase/client.ts` (Browser client with configuration check)
  - `lib/supabase/server.ts` (Server client with cookie storage handling)
  - `lib/supabase/middleware.ts` (Session validation and route protection)
  - `proxy.ts` (Next.js proxy matcher)
- **Split-Screen `/login` & `/signup` Layouts**:
  - Left panel: Mysore Palace backdrop with royal navy gradient overlay and cultural manifesto.
  - Right panel: Modern glassmorphic form with real validation, password visibility toggles, strength indicators, and Google OAuth buttons.
- **Genuine Google OAuth**:
  - Uses `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: ... } })`.
  - Server-side code exchange route at `app/auth/callback/route.ts`.
  - Graceful configuration alert if Supabase credentials are not yet supplied, without crashing or fake success.
- **Protected Learner Dashboard**:
  - Route: `/dashboard`
  - Retrieves authenticated user profile, avatar, email, and authentication provider.
  - Sign-out capability that clears sessions and redirects to home.
  - Preview roadmap for upcoming Milestones 02 & 03.

---

## 🛠️ Project Structure

```
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts         # Supabase OAuth server-side code exchange
│   ├── dashboard/
│   │   └── page.tsx             # Authenticated learner portal
│   ├── login/
│   │   └── page.tsx             # Split-screen login page
│   ├── signup/
│   │   └── page.tsx             # Split-screen registration page
│   ├── globals.css              # Custom design tokens, glassmorphism & gold glows
│   ├── layout.tsx               # Root layout with Cinzel, Manrope & Noto Sans Kannada fonts
│   └── page.tsx                 # Full landing page assembly
├── components/
│   ├── auth/
│   │   ├── GoogleSignIn.tsx     # Google OAuth trigger with config awareness
│   │   ├── LoginForm.tsx        # Email/password login with reset feedback
│   │   └── SignupForm.tsx       # Registration form with password strength bar
│   ├── landing/
│   │   ├── CulturalHeritage.tsx # Mysore Palace & Hampi architectural showcase
│   │   ├── FinalCTA.tsx         # Conversion section
│   │   ├── Hero.tsx             # Full-screen cinematic hero with Mysore Palace
│   │   ├── HowItWorks.tsx       # 4-step learning flow
│   │   ├── LearningPillars.tsx  # Learn, Speak, Experience interactive tabs
│   │   └── WhyKannada.tsx       # Cultural belonging and statistics
│   └── layout/
│       ├── Footer.tsx           # Cultural footer & navigation
│       └── Navbar.tsx           # Dynamic glassmorphic navbar
├── lib/
│   └── supabase/
│       ├── client.ts            # Browser Supabase client
│       ├── middleware.ts        # Session refresh & protected route logic
│       └── server.ts            # Server-side Supabase client
├── public/
│   └── images/
│       └── mysore-palace.jpg    # Authentic 2560px illuminated Mysore Palace night image
├── types/
│   └── index.ts                 # TypeScript interfaces
├── next.config.ts               # Next.js configuration & image domains
├── proxy.ts                     # Next.js proxy edge handler
└── package.json
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the project root:

```bash
# Supabase Authentication & PostgreSQL Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key-here
```

### Setting up Google OAuth in Supabase:
1. In your **Supabase Dashboard**, navigate to **Authentication** > **Providers** > **Google**.
2. Enable Google provider and paste your **Client ID** and **Client Secret** from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
3. In Google Cloud Console, add your Supabase redirect URI:
   `https://<your-project-id>.supabase.co/auth/v1/callback`
4. In Supabase Dashboard > **Authentication** > **URL Configuration**, add your local redirect URL:
   `http://localhost:3000/auth/callback`

---

## 💻 Commands to Run Locally

```bash
# Install dependencies
npm install

# Run development server (Turbopack)
npm run dev

# Run strict TypeScript verification
npx tsc --noEmit

# Run ESLint check
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

---

## 📋 Quality & Verification Summary

| Check | Result |
|---|---|
| **TypeScript Validation** (`npx tsc --noEmit`) | ✅ 0 errors |
| **ESLint Check** (`npm run lint`) | ✅ 0 errors, 0 warnings |
| **Production Build** (`npm run build`) | ✅ All routes compiled successfully |
| **Hero Background Image** (`mysore-palace.jpg`) | ✅ Authentic 2560px optimized night photo |
| **Google OAuth Integration** | ✅ Real Supabase OAuth flow implemented |
| **Responsive Design** | ✅ Desktop, Tablet, and Mobile verified |
