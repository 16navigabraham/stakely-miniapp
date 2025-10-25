// app/App.tsx
"use client";
import { useState, useEffect } from "react";
import { useMiniApp } from "@neynar/react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Header } from "~/components/ui/Header";
import { Footer } from "~/components/ui/Footer";
import { MarketTab, CreateTab, LeaderboardTab, RewardsTab } from "~/components/ui/tabs";
import { USE_WALLET } from "~/lib/constants";
import { useNeynarUser } from "../hooks/useNeynarUser";
import InterestSelection from "~/components/onboarding/InterestSelection";
import { checkUserExists } from "~/lib/api";
import { getNeynarUsername, getNeynarWalletAddress } from "~/lib/neynarUtils";
import { Tab } from "~/types/navigation"; 

export interface AppProps {
  title?: string;
}

export default function App(
  { title }: AppProps = { title: "Stakely" }
) {
  const {
    isSDKLoaded,
    context,
    setInitialTab,
    setActiveTab,
    currentTab,
  } = useMiniApp();

  // Wagmi hooks for wallet connection
  const { address, isConnected, isConnecting } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const { user: neynarUser } = useNeynarUser(context || undefined);
  
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [hasAttemptedConnect, setHasAttemptedConnect] = useState(false);

  // Auto-connect wallet when SDK loads
  useEffect(() => {
    async function autoConnectWallet() {
      if (!isSDKLoaded || isConnected || isConnecting || hasAttemptedConnect || isPending) {
        return;
      }

      try {
        setHasAttemptedConnect(true);
        
        // Try to find Coinbase Wallet first (best for Farcaster)
        const coinbaseConnector = connectors.find(
          connector => connector.name.toLowerCase().includes('coinbase')
        );
        
        // Fallback to first available connector
        const connectorToUse = coinbaseConnector || connectors[0];
        
        if (connectorToUse) {
          console.log('🔌 Auto-connecting wallet:', connectorToUse.name);
          await connect({ connector: connectorToUse });
        }
      } catch (error) {
        console.error('Auto-connect failed:', error);
        // Continue without wallet - user can connect manually later
      }
    }

    autoConnectWallet();
  }, [isSDKLoaded, isConnected, isConnecting, connectors, connect, hasAttemptedConnect, isPending]);

  // Log wallet connection status
  useEffect(() => {
    if (isConnected && address) {
      console.log('✅ Wallet connected:', address);
    }
  }, [isConnected, address]);

  // Check if user exists in backend when component mounts
  useEffect(() => {
    async function checkUser() {
      // Get username using utility function
      const username = getNeynarUsername(neynarUser);
      
      if (!isSDKLoaded || !username) {
        setIsCheckingUser(false);
        return;
      }

      try {
        setIsCheckingUser(true);
        const response = await checkUserExists(username);
        
        if (response.success && response.data) {
          // User exists - skip onboarding
          console.log('User found:', response.data);
          setHasCompletedOnboarding(true);
          setSelectedInterests(response.data.interests || []);
          setInitialTab(Tab.Market);
          setActiveTab(Tab.Market);
        } else {
          // User doesn't exist - show onboarding
          console.log('User not found, showing onboarding');
          setHasCompletedOnboarding(false);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        // On error, show onboarding to be safe
        setHasCompletedOnboarding(false);
      } finally {
        setIsCheckingUser(false);
      }
    }

    checkUser();
  }, [isSDKLoaded, neynarUser, setInitialTab, setActiveTab]);

  const handleOnboardingComplete = (interests: string[]) => {
    setSelectedInterests(interests);
    setIsTransitioning(true);
    setRegistrationError(null);
    
    setTimeout(() => {
      setHasCompletedOnboarding(true);
      setIsTransitioning(false);
      setInitialTab(Tab.Market);
      setActiveTab(Tab.Market);
    }, 1200);
  };

  const handleRegistrationError = (error: string) => {
    setRegistrationError(error);
    console.error('Registration error:', error);
  };

  // Manual wallet connect (if auto-connect fails)
  const handleManualConnect = async () => {
    try {
      const coinbaseConnector = connectors.find(
        connector => connector.name.toLowerCase().includes('coinbase')
      );
      const connectorToUse = coinbaseConnector || connectors[0];
      
      if (connectorToUse) {
        await connect({ connector: connectorToUse });
      }
    } catch (error) {
      console.error('Manual connect failed:', error);
    }
  };

  // Loading state while SDK initializes
  if (!isSDKLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118]">
        <div className="text-center px-4">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[#7C3AED]/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#7C3AED] animate-spin"></div>
          </div>
          <p className="text-white font-bold text-sm">Loading Arena...</p>
        </div>
      </div>
    );
  }

  // Loading state while connecting wallet (first time only)
  if (isConnecting && !hasCompletedOnboarding) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118]">
        <div className="text-center px-4">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[#7C3AED]/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#7C3AED] animate-spin"></div>
            <div className="absolute inset-0 bg-[#7C3AED] rounded-full blur-xl opacity-50 animate-pulse"></div>
          </div>
          <p className="text-white font-bold text-sm">Connecting wallet...</p>
          {!isConnected && hasAttemptedConnect && (
            <button
              onClick={handleManualConnect}
              className="mt-4 px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-sm hover:bg-[#6B2FD6] transition-colors"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
    );
  }

  // Loading state while checking user existence
  if (isCheckingUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118]">
        <div className="text-center px-4">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[#7C3AED]/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#7C3AED] animate-spin"></div>
            <div className="absolute inset-0 bg-[#7C3AED] rounded-full blur-xl opacity-50 animate-pulse"></div>
          </div>
          <p className="text-white font-bold text-sm">Checking your profile...</p>
        </div>
      </div>
    );
  }

  // Transition animation when completing onboarding
  if (isTransitioning) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118] animate-fadeIn">
        <div className="text-center px-4 animate-slideUp">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#7C3AED]/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#7C3AED] animate-spin"></div>
            <div className="absolute inset-0 bg-[#7C3AED] rounded-full blur-xl opacity-50 animate-pulse"></div>
          </div>
          <h2 
            className="text-3xl font-black text-white mb-2 uppercase tracking-tight"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            Entering Arena
          </h2>
          <p className="text-[#7C3AED] font-bold text-sm animate-pulse">
            Loading your market...
          </p>
        </div>
      </div>
    );
  }

  // Show onboarding if user hasn't completed it
  if (!hasCompletedOnboarding) {
    return (
      <InterestSelection 
        onComplete={handleOnboardingComplete}
        farcasterUsername={getNeynarUsername(neynarUser)}
        farcasterWalletAddress={getNeynarWalletAddress(neynarUser)}
        onError={handleRegistrationError}
        walletAddress={address}
        isWalletConnected={isConnected}
      />
    );
  }

  // Main app interface
  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118] flex flex-col overflow-hidden"
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      {/* Header - z-10 */}
      <div className="relative z-10 flex-shrink-0">
        <Header 
          neynarUser={neynarUser} 
          walletAddress={address}
          isWalletConnected={isConnected}
          onDisconnect={disconnect}
        />
      </div>

      {/* Main Content - z-0, EXTRA bottom padding to clear footer */}
      <div className="flex-1 overflow-y-auto relative z-0">
        <div className="px-4 py-3 pb-28">
          {/* pb-28 = 112px of clearance for footer */}
          {(currentTab === Tab.Market || !currentTab) && <MarketTab />}
          {currentTab === Tab.Create && (
            <CreateTab 
              neynarUser={neynarUser}
              walletAddress={address}
              isWalletConnected={isConnected}
            />
          )}
          {currentTab === Tab.Leaderboard && <LeaderboardTab />}
          {currentTab === Tab.Rewards && <RewardsTab />}
        </div>
      </div>

      {/* Footer - z-40 (below modals at z-100, above content) */}
      <div className="relative z-40 flex-shrink-0">
        <Footer 
          activeTab={(currentTab as Tab) || Tab.Market} 
          setActiveTab={setActiveTab} 
          showWallet={USE_WALLET} 
        />
      </div>
    </div>
  );
}