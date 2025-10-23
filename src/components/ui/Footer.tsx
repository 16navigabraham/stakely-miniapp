// components/ui/Footer.tsx
"use client";
import { Tab } from "~/types/navigation";

interface FooterProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  showWallet: boolean;
}

const NAV_ITEMS = [
  {
    tab: Tab.Market,
    label: 'Market',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    tab: Tab.Create,
    label: 'Create',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    tab: Tab.Leaderboard,
    label: 'Ranks',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    tab: Tab.Rewards,
    label: 'Rewards',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-500',
  },
];

export function Footer({ activeTab, setActiveTab, showWallet }: FooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 safe-area-padding-bottom">
      {/* Backdrop with gradient fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-xl border-t border-[#7C3AED]/20"></div>
      
      {/* Navigation */}
      <nav className="relative px-2 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`
                  group relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                  transition-all duration-200 min-w-[70px] active:scale-95
                  ${isActive ? 'scale-105' : 'opacity-70'}
                `}
              >
                {/* Active indicator background */}
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} blur-lg opacity-30 rounded-xl`}></div>
                )}
                
                {/* Icon container */}
                <div className={`
                  relative z-10 p-2 rounded-lg transition-all duration-200
                  ${isActive 
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg` 
                    : 'bg-gray-800/50 text-gray-400'
                  }
                `}>
                  {item.icon(isActive)}
                </div>
                
                {/* Label */}
                <span className={`
                  relative z-10 text-[10px] font-bold uppercase tracking-wider transition-colors
                  ${isActive ? 'text-white' : 'text-gray-500'}
                `}>
                  {item.label}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r ${item.gradient} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 bg-gradient-to-r ${item.gradient}`}></span>
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </footer>
  );
}