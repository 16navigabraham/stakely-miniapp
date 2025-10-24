// hooks/useUserProfile.ts
import { useState, useEffect } from 'react';
import { checkUserExists, UserProfileResponse } from '~/lib/api';

interface UserProfile {
  id: string;
  farcasterUsername: string;
  interests: string[];
  farcasterWalletAddress: string;
  createdAt: string;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage user profile data
 * @param farcasterUsername - The Farcaster username to fetch profile for
 */
export function useUserProfile(farcasterUsername?: string): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!farcasterUsername) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await checkUserExists(farcasterUsername);
      
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        setProfile(null);
        setError(response.error || 'User not found');
      }
    } catch (err) {
      setError('Failed to fetch user profile');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [farcasterUsername]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}