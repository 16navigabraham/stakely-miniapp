// app/App.tsx
"use client";
import { useState } from "react";
import { useMiniApp } from "@neynar/react";
import { Header } from "~/components/ui/Header";
import { Footer } from "~/components/ui/Footer";
import { MarketTab, CreateTab, LeaderboardTab, RewardsTab } from "~/components/ui/tabs";
import { USE_WALLET } from "~/lib/constants";
import { useNeynarUser } from "../hooks/useNeynarUser";
import InterestSelection from "~/components/onboarding/InterestSelection";
import { Tab } from "~/types/navigation"; 

export interface AppProps {
  title?: string;
}

export default function App(
  { title }: AppProps = { title: "Stakely" }
) {
  // --- Hooks ---
  const {
    isSDKLoaded,
    context,
    setInitialTab,
    setActiveTab,
    currentTab,
  } = useMiniApp();

  const { user: neynarUser } = useNeynarUser(context || undefined);
  
  // --- State ---
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // --- Handlers ---
  const handleOnboardingComplete = (interests: string[]) => {
    // Save interests in state only (no localStorage)
    setSelectedInterests(interests);
    
    // Start transition animation
    setIsTransitioning(true);
    
    // Wait for animation then navigate to Market
    setTimeout(() => {
      setHasCompletedOnboarding(true);
      setIsTransitioning(false);
      // Navigate directly to Market tab
      setInitialTab(Tab.Market);
      setActiveTab(Tab.Market);
    }, 1200);
  };

  // --- Early Returns ---
  
  // Show loading while SDK loads
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

  // Show transition screen
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

  // Show onboarding for users who haven't completed it
  if (!hasCompletedOnboarding) {
    return <InterestSelection onComplete={handleOnboardingComplete} />;
  }

  // --- Render Main App - MARKET TAB IS DEFAULT ---
  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118] flex flex-col overflow-hidden animate-fadeIn"
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      {/* Header */}
      <Header neynarUser={neynarUser} />

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-3">
          {/* Market tab is default - shows if currentTab is Market or undefined */}
          {(currentTab === Tab.Market || !currentTab) && <MarketTab />}
          {currentTab === Tab.Create && <CreateTab />}
          {currentTab === Tab.Leaderboard && <LeaderboardTab />}
          {currentTab === Tab.Rewards && <RewardsTab />}
        </div>
      </div>

      {/* Footer Navigation - Market is default active */}
      <Footer 
        activeTab={(currentTab as Tab) || Tab.Market} 
        setActiveTab={setActiveTab} 
        showWallet={USE_WALLET} 
      />
    </div>
  );
}