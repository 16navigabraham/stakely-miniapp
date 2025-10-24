// components/ui/UserProfileBadge.tsx
"use client";
import { useUserProfile } from '~/hooks/useUserProfile';

interface UserProfileBadgeProps {
  farcasterUsername?: string;
}

/**
 * Example component showing how to use user profile data
 * Displays user's selected interests as badges
 */
export function UserProfileBadge({ farcasterUsername }: UserProfileBadgeProps) {
  const { profile, isLoading, error } = useUserProfile(farcasterUsername);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <div className="w-4 h-4 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
        <span>Loading profile...</span>
      </div>
    );
  }

  if (error || !profile) {
    return null;
  }

  const interestIcons: Record<string, string> = {
    sports: '⚽',
    food: '🍕',
    entertainment: '🎬',
    gaming: '🎮',
    crypto: '₿',
    fitness: '💪',
    travel: '✈️',
    music: '🎵',
    tech: '💻',
    art: '🎨',
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs font-medium">Your Interests:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {profile.interests.map((interest) => (
          <div
            key={interest}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7C3AED]/20 border border-[#7C3AED]/40 rounded-full"
          >
            <span className="text-sm">{interestIcons[interest] || '✨'}</span>
            <span className="text-white text-xs font-medium capitalize">
              {interest}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}