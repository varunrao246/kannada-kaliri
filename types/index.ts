export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  nativeLanguage?: string;
  learningGoal?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  createdAt?: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface LearningPillar {
  id: string;
  tag: string;
  title: string;
  kannadaTitle: string;
  description: string;
  features: string[];
  badgeColor: string;
}

export interface CulturalFeature {
  title: string;
  kannadaTitle: string;
  period: string;
  location: string;
  description: string;
  significance: string;
  imageUrl?: string;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  kannadaPhrase: string;
  phraseMeaning: string;
}

// Milestone 02 Learner Profile & Database Types
export * from './profile';
export * from './database';
