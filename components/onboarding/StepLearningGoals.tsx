'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  GraduationCap,
  Briefcase,
  ShoppingBag,
  Compass,
  Users,
  Sparkles,
} from 'lucide-react';

export interface StepLearningGoalsProps {
  selectedGoals: string[];
  onToggleGoal?: (goalCode: string) => void;
  onToggle?: (goalCode: string) => void;
  onContinue?: () => void;
  onBack?: () => void;
  canContinue?: boolean;
  onNext?: () => void;
}

export interface GoalOption {
  code: string;
  label: string;
  kannadaLabel: string;
  description: string;
  iconName:
    | 'MessageCircle'
    | 'GraduationCap'
    | 'Briefcase'
    | 'ShoppingBag'
    | 'Compass'
    | 'Users'
    | 'Sparkles';
}

export const LEARNING_GOAL_OPTIONS: GoalOption[] = [
  {
    code: 'everyday_conversations',
    label: 'Everyday conversations',
    kannadaLabel: 'ದಿನನಿತ್ಯದ ಸಂಭಾಷಣೆ',
    description: 'Chitchat with neighbors, house helps, taxi & auto drivers',
    iconName: 'MessageCircle',
  },
  {
    code: 'college_and_education',
    label: 'College and education',
    kannadaLabel: 'ಕಾಲೇಜು ಮತ್ತು ಶಿಕ್ಷಣ',
    description: 'Campus interactions, campus friends, and academic life in Karnataka',
    iconName: 'GraduationCap',
  },
  {
    code: 'workplace_communication',
    label: 'Workplace communication',
    kannadaLabel: 'ಕಚೇರಿ ಸಂವಹನ',
    description: 'Engaging comfortably with colleagues, clients, and office teams',
    iconName: 'Briefcase',
  },
  {
    code: 'shopping_and_daily_activities',
    label: 'Shopping and daily activities',
    kannadaLabel: 'ಮಾರುಕಟ್ಟೆ & ದೈನಂದಿನ ಚಟುವಟಿಕೆ',
    description: 'Buying groceries, bargaining, ordering food, and daily chores',
    iconName: 'ShoppingBag',
  },
  {
    code: 'travel_and_exploring_karnataka',
    label: 'Travel and exploring Karnataka',
    kannadaLabel: 'ಕರ್ನಾಟಕ ಪ್ರವಾಸ & ಅನ್ವೇಷಣೆ',
    description: 'Navigating state buses, discovering Mysore, Hampi, and coastal towns',
    iconName: 'Compass',
  },
  {
    code: 'communicating_with_local_communities',
    label: 'Communicating with local communities',
    kannadaLabel: 'ಸ್ಥಳೀಯ ಸಮುದಾಯದೊಂದಿಗೆ ಸಂವಹನ',
    description: 'Building warm relationships with elders, locals, and community groups',
    iconName: 'Users',
  },
  {
    code: 'understanding_kannada_culture',
    label: 'Understanding Kannada culture',
    kannadaLabel: 'ಕನ್ನಡ ಸಂಸ್ಕೃತಿ & ಸಾಹಿತ್ಯ',
    description: 'Appreciating Kannada literature, cinema, festivals, and music',
    iconName: 'Sparkles',
  },
];

export function StepLearningGoals({
  selectedGoals,
  onToggleGoal,
  onToggle,
  onContinue,
  onBack,
  canContinue,
  onNext,
}: StepLearningGoalsProps) {
  const shouldReduceMotion = useReducedMotion();

  const handleToggle = (code: string) => {
    if (onToggleGoal) onToggleGoal(code);
    else if (onToggle) onToggle(code);
  };

  const handleAdvance = () => {
    if (onContinue) onContinue();
    else if (onNext) onNext();
  };

  const isEnabled =
    canContinue !== undefined ? canContinue : selectedGoals.length >= 1;

  const renderIcon = (iconName: string) => {
    const props = { className: 'w-5 h-5' };
    switch (iconName) {
      case 'MessageCircle':
        return <MessageCircle {...props} />;
      case 'GraduationCap':
        return <GraduationCap {...props} />;
      case 'Briefcase':
        return <Briefcase {...props} />;
      case 'ShoppingBag':
        return <ShoppingBag {...props} />;
      case 'Compass':
        return <Compass {...props} />;
      case 'Users':
        return <Users {...props} />;
      case 'Sparkles':
      default:
        return <Sparkles {...props} />;
    }
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-2xl mx-auto px-4 sm:px-6"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D5A64A]/10 border border-[#D5A64A]/30 text-xs text-[#D5A64A] uppercase tracking-wider font-semibold mb-3">
          <Compass className="w-3.5 h-3.5" />
          <span>Step 4 of 5</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8F5EE] mb-2">
          Your Learning Goal
        </h2>
        <p className="text-[#EDE5D6]/80 text-sm sm:text-base max-w-md mx-auto mb-3">
          Where do you want to use Kannada most? Select all that apply (choose at least one).
        </p>
        <div className="inline-block px-3 py-1 rounded-full bg-[#1A2E56] border border-[#D5A64A]/30 text-xs text-[#D5A64A]">
          {selectedGoals.length} of 7 goals selected
        </div>
      </div>

      {/* 7 Learning Goals Grid (R1-F05) */}
      <div
        role="group"
        aria-label="Select your learning goals"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
      >
        {LEARNING_GOAL_OPTIONS.map((goal) => {
          const isSelected = selectedGoals.includes(goal.code);

          return (
            <motion.button
              key={goal.code}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
              onClick={() => handleToggle(goal.code)}
              className={`p-4 rounded-xl text-left border transition-all duration-200 flex items-start justify-between min-h-[84px] focus:outline-none focus:ring-2 focus:ring-[#D5A64A] cursor-pointer ${
                isSelected
                  ? 'border-[#D5A64A] bg-[#1A2E56]/80 shadow-md gold-glow-subtle'
                  : 'border-[#D5A64A]/20 bg-[#101D36]/60 hover:border-[#D5A64A]/45 hover:bg-[#101D36]/80'
              }`}
            >
              <div className="flex items-start gap-3.5 pr-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                    isSelected
                      ? 'bg-[#D5A64A] text-[#101D36]'
                      : 'bg-[#1A2E56] text-[#D5A64A]'
                  }`}
                >
                  {renderIcon(goal.iconName)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-[#F8F5EE]">
                      {goal.label}
                    </span>
                  </div>
                  <span className="font-kannada text-[11px] text-[#D5A64A] block mb-1">
                    {goal.kannadaLabel}
                  </span>
                  <p className="text-xs text-[#EDE5D6]/70 leading-snug">
                    {goal.description}
                  </p>
                </div>
              </div>

              {/* Checkbox Indicator */}
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  isSelected
                    ? 'border-[#D5A64A] bg-[#D5A64A] text-[#101D36]'
                    : 'border-[#EDE5D6]/40 bg-transparent'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#D5A64A]/20">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#D5A64A]/30 text-[#EDE5D6] hover:text-[#F8F5EE] hover:bg-[#1A2E56]/40 transition min-h-[44px] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div className="w-10" />
        )}

        <button
          type="button"
          onClick={handleAdvance}
          disabled={!isEnabled}
          className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base transition-all min-h-[48px] ${
            isEnabled
              ? 'bg-gradient-to-r from-[#D5A64A] via-[#E8C77F] to-[#D5A64A] text-[#101D36] shadow-lg hover:shadow-[#D5A64A]/25 cursor-pointer'
              : 'bg-[#1A2E56] text-[#EDE5D6]/40 cursor-not-allowed border border-white/5 opacity-50'
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default StepLearningGoals;
