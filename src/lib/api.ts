// lib/api.ts
const BASE_URL = 'https://stakely-backend.onrender.com';

export interface CreateUserPayload {
  farcasterUsername: string;
  interests: string[];
  farcasterWalletAddress: string;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    farcasterUsername: string;
    interests: string[];
    farcasterWalletAddress: string;
    createdAt: string;
  };
  errors?: string[];
}

export interface UserProfileResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    farcasterUsername: string;
    interests: string[];
    farcasterWalletAddress: string;
    createdAt: string;
  };
  error?: string;
}

/**
 * Check if a user exists in the database
 */
export async function checkUserExists(farcasterUsername: string): Promise<UserProfileResponse> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/user_profile?farcasterUsername=${encodeURIComponent(farcasterUsername)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return {
      success: false,
      error: 'Failed to check user existence',
    };
  }
}

/**
 * Create a new user
 */
export async function createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/create_user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      message: 'Failed to create user',
      errors: ['Network error occurred. Please try again.'],
    };
  }
}