import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle2, PlayCircle, Lock, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurriculumWithProgress } from '@/lib/services/learning-progress';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Curriculum & Lessons | Kannada for Everyone',
  description: 'Structured A1 Spoken Kannada curriculum for non-native speakers.',
};

export default async function LearnOverviewPage() {
  const supabase = await createClient();
  if (!supabase) {
    redirect('/login?redirect=/learn');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/learn');
  }

  const modules = await getCurriculumWithProgress(user.id, supabase);

  // Total lessons count and completed count
  const allLessons = modules.flatMap((m) => m.lessons || []);
  const completedCount = allLessons.filter((l) => l.status === 'completed').length;
  const overallPercentage = Math.round((completedCount / (allLessons.length || 1)) * 100);

  return (
    <div className="min-h-screen bg-[#101D36] text-[#F8F5EE] flex flex-col selection:bg-[#D5A64A]/30">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#EDE5D6]/70 hover:text-[#D5A64A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-xs text-[#D5A64A] font-medium uppercase tracking-wider bg-[#1A2E56] px-3 py-1 rounded-full border border-[#D5A64A]/30">
            A1 Spoken Kannada
          </span>
        </div>

        {/* Hero Header Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0A1222] via-[#101D36] to-[#0A1222] border border-[#D5A64A]/30 p-8 sm:p-10 mb-12 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D5A64A]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A2E56] border border-[#D5A64A]/30 text-xs text-[#D5A64A] mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Structured Curriculum • Level A1</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8F5EE] mb-3">
              Learn Kannada Foundations
            </h1>
            <p className="text-sm sm:text-base text-[#EDE5D6]/80 leading-relaxed mb-6">
              A step-by-step pathway from phonetics to natural daily conversations in Bengaluru and Karnataka.
              Each lesson includes vocabulary, transliterations, grammar tips, and real-world examples.
            </p>

            {/* Overall Course Progress */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#D5A64A]/20 max-w-md">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-[#EDE5D6]">
                  A1 Course Completion ({completedCount}/{allLessons.length} lessons)
                </span>
                <span className="font-bold text-[#D5A64A]">{overallPercentage}%</span>
              </div>
              <div className="w-full bg-[#0A1222] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#D5A64A] to-[#E8C77F] h-full rounded-full transition-all duration-500"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="space-y-10">
          {modules.map((module, mIdx) => {
            const lessons = module.lessons || [];
            const moduleCompleted = lessons.filter((l) => l.status === 'completed').length;
            const modulePercentage = Math.round((moduleCompleted / (lessons.length || 1)) * 100);

            return (
              <div
                key={module.id}
                className="rounded-3xl bg-[#0A1222]/80 border border-[#D5A64A]/25 p-6 sm:p-8 shadow-xl"
              >
                {/* Module Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D5A64A]/20 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#D5A64A] bg-[#D5A64A]/10 px-2.5 py-0.5 rounded border border-[#D5A64A]/20">
                        Module 0{mIdx + 1}
                      </span>
                      <span className="text-sm font-kannada text-[#EDE5D6]/80">
                        {module.kannadaTitle}
                      </span>
                    </div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#F8F5EE]">
                      {module.title}
                    </h2>
                    <p className="text-xs text-[#EDE5D6]/70 mt-1 max-w-2xl">
                      {module.description}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xs text-[#EDE5D6]/80 block mb-1">
                      {moduleCompleted} of {lessons.length} completed
                    </span>
                    <div className="w-32 bg-[#101D36] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#D5A64A] h-full rounded-full"
                        style={{ width: `${modulePercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Lessons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {lessons.map((lesson, lIdx) => {
                    const isCompleted = lesson.status === 'completed';
                    const isInProgress = lesson.status === 'in_progress';

                    return (
                      <Link
                        key={lesson.id}
                        href={`/learn/${lesson.id}`}
                        className={`group relative rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 ${
                          isCompleted
                            ? 'bg-[#101D36]/70 border-emerald-500/30 hover:border-emerald-500/60'
                            : isInProgress
                            ? 'bg-[#101D36] border-[#D5A64A]/60 shadow-lg shadow-[#D5A64A]/10'
                            : 'bg-[#0A1222]/90 border-white/10 hover:border-[#D5A64A]/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-mono text-[#EDE5D6]/50">
                              Lesson {mIdx + 1}.{lIdx + 1}
                            </span>
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Completed
                              </span>
                            ) : isInProgress ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D5A64A] bg-[#D5A64A]/10 px-2 py-0.5 rounded-full">
                                <PlayCircle className="w-3.5 h-3.5" />
                                In Progress
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#EDE5D6]/60 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#D5A64A]" />
                                {lesson.estimatedMinutes} min
                              </span>
                            )}
                          </div>

                          <h3 className="font-serif text-base font-bold text-[#F8F5EE] group-hover:text-[#D5A64A] transition-colors mb-1">
                            {lesson.title}
                          </h3>

                          {lesson.kannadaTitle && (
                            <span className="text-xs font-kannada text-[#D5A64A]/80 block mb-2">
                              {lesson.kannadaTitle}
                            </span>
                          )}

                          <p className="text-xs text-[#EDE5D6]/70 line-clamp-2 mb-4 leading-relaxed">
                            {lesson.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold">
                          <span className="text-[#D5A64A] group-hover:underline">
                            {isCompleted ? 'Review Lesson' : isInProgress ? 'Resume Lesson' : 'Start Lesson'}
                          </span>
                          <span className="text-[#EDE5D6]/50">→</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Future Levels Preview (A2 & B1) */}
        <div className="mt-16 pt-10 border-t border-[#D5A64A]/20">
          <h2 className="font-serif text-2xl font-bold text-[#F8F5EE] mb-2">
            Upcoming Curriculum Levels
          </h2>
          <p className="text-xs text-[#EDE5D6]/70 mb-6">
            Advance to everyday fluency and professional contexts upon completing Level A1.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#0A1222]/50 border border-white/10 opacity-75">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D5A64A] bg-[#D5A64A]/10 px-2.5 py-0.5 rounded">
                  Level A2 • Planned
                </span>
                <Lock className="w-4 h-4 text-[#EDE5D6]/50" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#F8F5EE] mb-1">
                Everyday Fluency &amp; Contexts
              </h3>
              <p className="text-xs text-[#EDE5D6]/70 leading-relaxed">
                Past and future tense dialogues, hospital interactions, vegetable bargaining, and weekend travel plans.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0A1222]/50 border border-white/10 opacity-75">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D5A64A] bg-[#D5A64A]/10 px-2.5 py-0.5 rounded">
                  Level B1 • Planned
                </span>
                <Lock className="w-4 h-4 text-[#EDE5D6]/50" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#F8F5EE] mb-1">
                Professional &amp; Cultural Mastery
              </h3>
              <p className="text-xs text-[#EDE5D6]/70 leading-relaxed">
                Workplace negotiations, expressing complex opinions, and understanding classical Vachanas and Kannada literature.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
