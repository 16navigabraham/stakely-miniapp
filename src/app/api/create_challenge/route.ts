// app/api/create_challenge/route.ts (App Router)
import { NextRequest, NextResponse } from 'next/server';
import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';

// ============================================
// TYPES
// ============================================

interface CreateChallengeRequest {
  // Frontend form data
  farcasterUsername: string;
  title: string;
  category: string;
  description: string;
  winCondition: string;
  startDate: string; // DD/MM/YYYY
  startTime: string; // HH:MM:SS
  endDate: string;
  endTime: string;
  stakeAmount: number;
  votingDurationHours: number;
  banner: {
    filename: string;
    contentType: string;
    data: string; // base64
  };
  
  // Blockchain data
  Id: string;
  onchainChallengeId: number;
  txHash: string;
  votingDeadline?: string; // ISO string
}

interface CreateChallengeResponse {
  success: boolean;
  data?: {
    id: string;
    onchainChallengeId: number;
    title: string;
    status: string;
    votingDeadline: string;
    createdAt: string;
    txHash: string;
  };
  message?: string;
  errors?: string[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseDateTime(date: string, time: string): Date {
  const [day, month, year] = date.split('/').map(Number);
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function validateRequest(body: any): string[] {
  const errors: string[] = [];

  // Required fields
  if (!body.farcasterUsername) errors.push('farcasterUsername is required');
  if (!body.title) errors.push('title is required');
  if (!body.category) errors.push('category is required');
  if (!body.description) errors.push('description is required');
  if (!body.winCondition) errors.push('winCondition is required');
  if (!body.startDate) errors.push('startDate is required');
  if (!body.startTime) errors.push('startTime is required');
  if (!body.endDate) errors.push('endDate is required');
  if (!body.endTime) errors.push('endTime is required');
  if (!body.stakeAmount || body.stakeAmount <= 0) errors.push('stakeAmount must be greater than 0');
  if (!body.votingDurationHours || body.votingDurationHours < 1) errors.push('votingDurationHours must be at least 1');
  if (!body.onchainChallengeId) errors.push('onchainChallengeId is required');
  if (!body.txHash) errors.push('txHash is required');

  // Banner validation
  if (!body.banner || !body.banner.data) {
    errors.push('Banner image is required');
  } else {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(body.banner.contentType)) {
      errors.push('Banner must be JPEG or PNG');
    }
  }

  // Date format validation
  if (body.startDate && !body.startDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    errors.push('startDate must be in DD/MM/YYYY format');
  }
  if (body.endDate && !body.endDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    errors.push('endDate must be in DD/MM/YYYY format');
  }
  if (body.startTime && !body.startTime.match(/^\d{2}:\d{2}:\d{2}$/)) {
    errors.push('startTime must be in HH:MM:SS format');
  }
  if (body.endTime && !body.endTime.match(/^\d{2}:\d{2}:\d{2}$/)) {
    errors.push('endTime must be in HH:MM:SS format');
  }

  // Date logic validation
  if (body.startDate && body.startTime) {
    const startDateTime = parseDateTime(body.startDate, body.startTime);
    const now = new Date();
    
    if (startDateTime <= now) {
      errors.push('Start date/time must be in the future');
    }
  }

  if (body.startDate && body.startTime && body.endDate && body.endTime) {
    const startDateTime = parseDateTime(body.startDate, body.startTime);
    const endDateTime = parseDateTime(body.endDate, body.endTime);
    
    if (endDateTime <= startDateTime) {
      errors.push('End date/time must be after start date/time');
    }
  }

  return errors;
}

// ============================================
// MAIN HANDLER (App Router)
// ============================================

export async function POST(req: NextRequest) {
  try {
    const body: CreateChallengeRequest = await req.json();

    // Validate request
    const validationErrors = validateRequest(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        } as CreateChallengeResponse,
        { status: 400 }
      );
    }

    // Parse dates
    const startDateTime = parseDateTime(body.startDate, body.startTime);
    const endDateTime = parseDateTime(body.endDate, body.endTime);
    
    // Calculate voting deadline (if not provided)
    let votingDeadline: Date;
    if (body.votingDeadline) {
      votingDeadline = new Date(body.votingDeadline);
    } else {
      votingDeadline = new Date(
        endDateTime.getTime() + body.votingDurationHours * 3600000
      );
    }

    // Prepare challenge data for database
    const challengeData = {
      id: body.Id,
      onchainChallengeId: body.onchainChallengeId,
      farcasterUsername: body.farcasterUsername,
      title: body.title,
      category: body.category,
      description: body.description,
      winCondition: body.winCondition,
      socialPlatform: 'farcaster',
      startDate: body.startDate,
      startTime: body.startTime,
      endDate: body.endDate,
      endTime: body.endTime,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      votingDeadline: votingDeadline.toISOString(),
      votingDurationHours: body.votingDurationHours,
      stakeAmount: body.stakeAmount,
      banner: body.banner,
      txHash: body.txHash,
      status: 'active',
      createdAt: new Date().toISOString(),
      
      // Initialize counters
      totalStaked: body.stakeAmount,
      stakesFor: body.stakeAmount, // Creator stakes FOR by default
      stakesAgainst: 0,
      participants: 1,
      
      // Voting results (empty initially)
      communityVotesFor: 0,
      communityVotesAgainst: 0,
      
      // Finalization
      isFinalized: false,
      finalOutcome: null,
    };

    // ============================================
    // SAVE TO DATABASE
    // ============================================
    
    // TODO: Replace with your actual database call
    // Examples for different databases:
    
    // MongoDB
    // const db = await connectToDatabase();
    // await db.collection('challenges').insertOne(challengeData);
    
    // PostgreSQL (Prisma)
    // await prisma.challenge.create({ data: challengeData });
    
    // Supabase
    // const { error } = await supabase.from('challenges').insert(challengeData);
    // if (error) throw error;
    
    // For now, just log it
    console.log('📝 Challenge data to save:', challengeData);

    // ============================================
    // OPTIONAL: INTEGRATE WITH NEYNAR
    // ============================================
    
    // If you want to post to Farcaster or get user data
    if (process.env.NEYNAR_API_KEY) {
      try {
        const neynarConfig = new Configuration({
          apiKey: process.env.NEYNAR_API_KEY,
        });
        const _neynarClient = new NeynarAPIClient(neynarConfig);

        // Example: Get user data
        // const userData = await neynarClient.lookupUserByUsername(body.farcasterUsername);
        
        // Example: Post cast about the challenge
        // const cast = await neynarClient.publishCast({
        //   text: `New challenge created: ${body.title}`,
        //   embeds: [{ url: `https://yourapp.com/challenge/${body.onchainChallengeId}` }]
        // });
        
      } catch (_neynarError) {
        console.error('Neynar error:', _neynarError);
        // Don't fail the whole request if Neynar fails
      }
    }

    // ============================================
    // RETURN SUCCESS RESPONSE
    // ============================================

    return NextResponse.json(
      {
        success: true,
        data: {
          id: challengeData.id,
          onchainChallengeId: challengeData.onchainChallengeId,
          title: challengeData.title,
          status: challengeData.status,
          votingDeadline: challengeData.votingDeadline,
          createdAt: challengeData.createdAt,
          txHash: challengeData.txHash,
        },
      } as CreateChallengeResponse,
      { status: 201 }
    );

  } catch (error: any) {
    console.error('❌ Error creating challenge:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        errors: [error.message || 'Unknown error occurred'],
      } as CreateChallengeResponse,
      { status: 500 }
    );
  }
}

// ============================================
// DATABASE SCHEMAS (Reference)
// ============================================

/*
// MongoDB Schema Example
{
  id: String (unique, indexed),
  onchainChallengeId: Number (unique, indexed),
  farcasterUsername: String (indexed),
  title: String,
  category: String (indexed),
  description: String,
  winCondition: String,
  socialPlatform: String,
  startDate: String,
  startTime: String,
  endDate: String,
  endTime: String,
  startDateTime: Date (indexed),
  endDateTime: Date (indexed),
  votingDeadline: Date (indexed),
  votingDurationHours: Number,
  stakeAmount: Number,
  banner: {
    filename: String,
    contentType: String,
    data: String (base64)
  },
  txHash: String (indexed),
  status: String (indexed), // 'active' | 'voting' | 'completed' | 'finalized'
  createdAt: Date (indexed),
  totalStaked: Number,
  stakesFor: Number,
  stakesAgainst: Number,
  participants: Number,
  communityVotesFor: Number,
  communityVotesAgainst: Number,
  isFinalized: Boolean,
  finalOutcome: Boolean | null
}

// PostgreSQL Schema (Prisma)
model Challenge {
  id                    String   @id
  onchainChallengeId    Int      @unique
  farcasterUsername     String
  title                 String
  category              String
  description           String   @db.Text
  winCondition          String   @db.Text
  socialPlatform        String
  startDate             String
  startTime             String
  endDate               String
  endTime               String
  startDateTime         DateTime
  endDateTime           DateTime
  votingDeadline        DateTime
  votingDurationHours   Int
  stakeAmount           Float
  bannerFilename        String
  bannerContentType     String
  bannerData            String   @db.Text
  txHash                String
  status                String
  createdAt             DateTime @default(now())
  totalStaked           Float    @default(0)
  stakesFor             Float    @default(0)
  stakesAgainst         Float    @default(0)
  participants          Int      @default(0)
  communityVotesFor     Int      @default(0)
  communityVotesAgainst Int      @default(0)
  isFinalized           Boolean  @default(false)
  finalOutcome          Boolean?

  @@index([farcasterUsername])
  @@index([category])
  @@index([status])
  @@index([startDateTime])
  @@index([endDateTime])
  @@index([votingDeadline])
}
*/