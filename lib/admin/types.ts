/**
 * Admin Dashboard & Learning Analytics — Domain Types
 * Kannada Kaliri — Milestone 10
 */

export type AdminRole = 'super_admin' | 'admin' | 'analyst';

export interface AdminUser {
  id: string;
  userId: string;
  role: AdminRole;
  isActive: boolean;
  assignedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  email?: string;
  fullName?: string;
}

export interface AdminAuthResult {
  isAdmin: boolean;
  role: AdminRole | null;
  userId: string | null;
  adminRecord?: AdminUser | null;
  error?: string;
}

export interface MetricComparison {
  current: number;
  previous: number;
  percentageChange: number | null; // null if previous === 0
}

export interface PlatformKPIs {
  totalLearners: MetricComparison;
  newRegistrations: MetricComparison;
  dailyActiveLearners: MetricComparison;
  weeklyActiveLearners: MetricComparison;
  monthlyActiveLearners: MetricComparison;
  completedLessons: MetricComparison;
  assessmentAttempts: MetricComparison;
  completedScenarios: MetricComparison;
  totalXPAwarded: MetricComparison;
  averageMasteryScore: MetricComparison;
  activeStreakAverage: MetricComparison;
  longestStreakRecord: number;
}

export interface TrendDataPoint {
  date: string;
  label: string;
  count: number;
  secondaryCount?: number;
}

export interface LearnerAdminSummary {
  id: string;
  userId: string;
  fullName: string;
  nativeLanguage: string;
  proficiencyLevel: string;
  learningGoals: string[];
  registrationDate: string;
  lastActiveDate: string | null;
  completedLessonsCount: number;
  assessmentCount: number;
  averageScore: number | null;
  masteryScore: number;
  currentStreak: number;
  totalXP: number;
}

export interface CurriculumLessonStat {
  lessonId: string;
  title: string;
  kannadaTitle: string;
  moduleNumber: number;
  completionCount: number;
  completionRate: number; // percentage of registered users
  avgAssessmentScore: number | null;
  sampleSize: number;
  dropoffCount: number;
  isDropoffPoint: boolean;
}

export interface ExerciseFailureStat {
  exerciseId: string;
  lessonId: string;
  prompt: string;
  type: string;
  failureCount: number;
  totalAttempts: number;
  failureRate: number;
  sampleSize: number;
}

export interface LearningOutcomeMetrics {
  vocabularyRetentionRate: number;
  totalVocabPractised: number;
  grammarAccuracy: number;
  listeningAccuracy: number | null;
  scenarioConfidenceAvg: number | null;
  overallImprovementRate: number | null;
  measuredMetrics: string[];
  derivedMetrics: string[];
  unavailableMetrics: string[];
}

export interface EngagementMetrics {
  dauWauRatio: number; // Stickiness index %
  dauMauRatio: number;
  activityDistribution: {
    lessons: number;
    assessments: number;
    scenarios: number;
    dailyChallenges: number;
  };
  levelDistribution: Array<{
    level: number;
    title: string;
    kannadaTitle: string;
    learnerCount: number;
  }>;
  streakRetention: {
    threeDayPlus: number;
    sevenDayPlus: number;
    thirtyDayPlus: number;
  };
  returningLearnerRate: number;
}

export interface ServiceHealthStatus {
  serviceId: 'guru' | 'gnani_stt' | 'gnani_tts';
  serviceName: string;
  status: 'configured' | 'unconfigured' | 'unavailable' | 'verified_live';
  provider: string;
  modelOrVoice: string;
  endpoint: string;
  recentSuccessCount: number;
  recentFailureCount: number;
  lastUsedAt?: string | null;
  statusDetails: string;
}

export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

export interface DateRangeFilter {
  preset: DateRangePreset;
  startDate: string; // ISO string 'YYYY-MM-DD'
  endDate: string;
}

