'use client';

import { useAuth } from "@/components/AuthProvider";
import AuthScreen from "@/components/AuthScreen";
import ChallengeTimeline from "@/components/ChallengeTimeline";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mb-4"></div>
          <div className="text-black font-black text-xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
            LOADING...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => { /* Auth state will be updated by AuthProvider */ }} />;
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <ChallengeTimeline />
    </main>
  );
}
