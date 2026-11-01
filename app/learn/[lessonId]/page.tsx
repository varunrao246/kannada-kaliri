import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/services/profile';
import {
  getLessonWithProgress,
  startLesson,
} from '@/lib/services/learning-progress';
import { getAllLessons } from '@/lib/curriculum';
import { getLessonExercises } from '@/lib/exercises';
import LessonViewer from '@/components/learn/LessonViewer';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const all = getAllLessons();
  const found = all.find((l) => l.id === lessonId);

  return {
    title: found ? `${found.title} | Kannada for Everyone` : 'Lesson | Kannada for Everyone',
    description: found?.description || 'Learn spoken Kannada with interactive pedagogy.',
  };
}

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const supabase = await createClient();

  if (!supabase) {
    redirect(`/login?redirect=/learn/${lessonId}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/learn/${lessonId}`);
  }

  const [profile, lesson] = await Promise.all([
    getLearnerProfile(user.id, supabase),
    getLessonWithProgress(lessonId, user.id, supabase),
  ]);

  if (!lesson) {
    notFound();
  }

  // Mark lesson in progress when opened
  if (lesson.status === 'not_started') {
    await startLesson(user.id, lesson.id, supabase);
  }

  // Determine next lesson id
  const allLessons = getAllLessons();
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const nextLessonId =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1].id
      : null;

  const exercises = getLessonExercises(lessonId);

  return (
    <div className="min-h-screen bg-[#101D36] text-[#F8F5EE] flex flex-col selection:bg-[#D5A64A]/30">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
        <LessonViewer
          lesson={lesson}
          profile={profile}
          userId={user.id}
          nextLessonId={nextLessonId}
          exercises={exercises}
        />
      </main>

      <Footer />
    </div>
  );
}
