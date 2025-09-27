'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import Image from 'next/image';
import { levels, Level } from '@/data/levels';
import { useAuth } from './AuthProvider';
import { ClientAuth } from '@/lib/auth/auth';

export default function ChallengeTimeline() {
  const router = useRouter();
  const { accessKey } = useAuth();
  const [currentChallenge, setCurrentChallenge] = useState<Level>(levels[0]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [timerValue, setTimerValue] = useState('00:00'); // Placeholder timer
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // GSAP animations for UI elements - only run after loading is complete
    if (!isLoading) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        gsap.from('.challenge-card', { y: 50, opacity: 0, duration: 0.8, ease: 'power2.out' });
        gsap.from('.progress-grid', { scale: 0.8, opacity: 0, duration: 0.6, delay: 0.2, ease: 'back.out(1.7)' });
        gsap.from('.status-bar', { y: -30, opacity: 0, duration: 0.5, ease: 'power2.out' });
      }, 100);
    }
  }, [isLoading]);

  // Load user data from database
  useEffect(() => {
    const loadUserData = async () => {
      if (!accessKey) return;

      try {
        const response = await fetch('/api/user/data', {
          headers: ClientAuth.getAuthHeaders(),
        });

        if (response.ok) {
          const result = await response.json();
          const userData = result.data;

          setCompletedLevels(userData.completedLevels);
          setUserCoins(userData.totalCoins);
          setUserLevel(userData.currentLevel);
          setUserStreak(userData.currentStreak);

          // Update current challenge to next incomplete level
          const lastCompleted = Math.max(...userData.completedLevels, 0);
          const nextLevel = levels.find(l => l.id === lastCompleted + 1) || levels[0];
          setCurrentChallenge(nextLevel);
        } else {
          console.error('Failed to load user data:', response.statusText);
          // Fallback to defaults
          setCompletedLevels([]);
          setUserCoins(0);
          setUserLevel(1);
          setUserStreak(0);
          setCurrentChallenge(levels[0]);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to defaults
        setCompletedLevels([]);
        setUserCoins(0);
        setUserLevel(1);
        setUserStreak(0);
        setCurrentChallenge(levels[0]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();

    // Reload data when window regains focus (for when returning from level pages)
    const handleFocus = () => {
      loadUserData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [accessKey]);

  // Simulate timer for placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTimerValue(now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLevelClick = (level: Level) => {
    setCurrentChallenge(level);
    setSelectedLevel(level);
    setShowFeedback(false);
    setRecordingProgress(0);

    // Smooth scroll to bottom of page to show level details
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);

    gsap.from('.challenge-card', { scale: 0.9, duration: 0.3, ease: 'power2.out' });
  };

  const handleRecord = () => {
    setIsRecording(true);
    setRecordingProgress(0);

    // Simulate recording progress
    const interval = setInterval(() => {
      setRecordingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRecording(false);
          setShowFeedback(true);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const handlePause = () => {
    setIsRecording(false);
  };

  const handlePlay = () => {
    // Play back recording
  };

  const handleStartChallenge = (level: Level) => {
    router.push(`/level/${level.id}`);
  };


  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Green';
      case 'medium': return 'Yellow';
      case 'hard': return 'Red';
      default: return 'Grey';
    }
  };

  const getDifficultyShort = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Easy';
      case 'medium': return 'Med';
      case 'hard': return 'Hard';
      default: return 'Med';
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mb-4"></div>
          <div className="text-black font-black text-xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
            LOADING QUESTS...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-100 p-4 relative">
      {/* Kenny UI Background Assets */}
      <div className="absolute inset-0 opacity-15">
        {/* Scattered Kenny UI elements as background decorations */}
        <div className="absolute top-20 left-10 w-12 h-12">
          <Image
            src="/kenny-assets/ui/PNG/Green/Default/star.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-40 right-20 w-10 h-10">
          <Image
            src="/kenny-assets/ui/PNG/Yellow/Default/star.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-32 left-1/4 w-14 h-14">
          <Image
            src="/kenny-assets/ui/PNG/Blue/Default/icon_circle.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-1/3 right-10 w-8 h-8">
          <Image
            src="/kenny-assets/ui/PNG/Red/Default/icon_square.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-20 right-1/4 w-16 h-16">
          <Image
            src="/kenny-assets/ui/PNG/Green/Default/star_outline.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-3/4 left-20 w-12 h-12">
          <Image
            src="/kenny-assets/ui/PNG/Yellow/Default/icon_checkmark.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-1/2 left-1/3 w-10 h-10">
          <Image
            src="/kenny-assets/ui/PNG/Blue/Default/icon_circle.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-40 right-10 w-8 h-8">
          <Image
            src="/kenny-assets/ui/PNG/Red/Default/star.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Additional Kenny UI Elements */}
        <div className="absolute top-16 right-1/3 w-14 h-14">
          <Image
            src="/kenny-assets/ui/PNG/Blue/Default/star_outline.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-60 left-1/2 w-10 h-10">
          <Image
            src="/kenny-assets/ui/PNG/Red/Default/icon_circle.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-60 left-10 w-12 h-12">
          <Image
            src="/kenny-assets/ui/PNG/Yellow/Default/icon_square.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-80 right-40 w-8 h-8">
          <Image
            src="/kenny-assets/ui/PNG/Green/Default/icon_checkmark.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-80 right-1/3 w-16 h-16">
          <Image
            src="/kenny-assets/ui/PNG/Blue/Default/star.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-1/4 left-40 w-10 h-10">
          <Image
            src="/kenny-assets/ui/PNG/Red/Default/star_outline.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-1/4 right-60 w-12 h-12">
          <Image
            src="/kenny-assets/ui/PNG/Yellow/Default/star.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-2/3 left-60 w-8 h-8">
          <Image
            src="/kenny-assets/ui/PNG/Green/Default/icon_square.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Kenny Character Elements */}
      <div className="absolute inset-0 opacity-10">
        {/* Colorful character bodies scattered around */}
        <div className="absolute top-32 left-16 w-16 h-16">
          <Image
            src="/kenny-assets/characters/PNG/Default/blue_body_circle.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-48 right-32 w-14 h-14">
          <Image
            src="/kenny-assets/characters/PNG/Default/green_body_square.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-48 left-32 w-18 h-18">
          <Image
            src="/kenny-assets/characters/PNG/Default/pink_body_squircle.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-1/2 right-16 w-12 h-12">
          <Image
            src="/kenny-assets/characters/PNG/Default/yellow_body_rhombus.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-32 right-48 w-16 h-16">
          <Image
            src="/kenny-assets/characters/PNG/Default/purple_body_circle.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-64 left-48 w-14 h-14">
          <Image
            src="/kenny-assets/characters/PNG/Default/red_body_square.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Character hands for variety */}
        <div className="absolute top-40 left-1/2 w-8 h-8">
          <Image
            src="/kenny-assets/characters/PNG/Default/blue_hand_thumb.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-40 left-1/4 w-10 h-10">
          <Image
            src="/kenny-assets/characters/PNG/Default/green_hand_peace.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-3/4 right-1/4 w-8 h-8">
          <Image
            src="/kenny-assets/characters/PNG/Default/yellow_hand_open.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Character faces */}
        <div className="absolute top-56 right-64 w-12 h-12">
          <Image
            src="/kenny-assets/characters/PNG/Default/face_a.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-56 left-64 w-10 h-10">
          <Image
            src="/kenny-assets/characters/PNG/Default/face_c.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Kenny Background Elements */}
      <div className="absolute inset-0 opacity-8">
        {/* Cloud layers for depth */}
        <div className="absolute top-10 left-1/4 w-32 h-16">
          <Image
            src="/kenny-assets/backgrounds/Backgrounds/Elements/cloudLayer1.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-20 right-1/4 w-28 h-14">
          <Image
            src="/kenny-assets/backgrounds/Backgrounds/Elements/cloudLayer2.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-32 left-1/3 w-24 h-12">
          <Image
            src="/kenny-assets/backgrounds/Backgrounds/Elements/cloudLayerB1.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Mountain silhouettes */}
        <div className="absolute bottom-0 left-0 w-48 h-24">
          <Image
            src="/kenny-assets/backgrounds/Backgrounds/Elements/mountainA.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-0 right-0 w-40 h-20">
          <Image
            src="/kenny-assets/backgrounds/Backgrounds/Elements/mountainB.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-0 left-1/3 w-36 h-18">
          <Image
            src="/kenny-assets/backgrounds/Backgrounds/Elements/hills.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Kenny Car-Kit Elements for Fun */}
      <div className="absolute inset-0 opacity-12">
        {/* Coins scattered around */}
        <div className="absolute top-72 left-24 w-8 h-8">
          <Image
            src="/kenny-assets/car-kit/Previews/item-coin-gold.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute top-96 right-24 w-6 h-6">
          <Image
            src="/kenny-assets/car-kit/Previews/item-coin-silver.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-72 left-1/2 w-8 h-8">
          <Image
            src="/kenny-assets/car-kit/Previews/item-coin-bronze.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Trees for natural elements */}
        <div className="absolute bottom-16 left-8 w-20 h-32">
          <Image
            src="/kenny-assets/car-kit/Previews/tree.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-20 right-8 w-16 h-28">
          <Image
            src="/kenny-assets/car-kit/Previews/tree-pine.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Small decorative items */}
        <div className="absolute top-88 left-1/3 w-6 h-6">
          <Image
            src="/kenny-assets/car-kit/Previews/item-box.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute bottom-88 right-1/3 w-8 h-8">
          <Image
            src="/kenny-assets/car-kit/Previews/item-banana.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Comic Book Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-200 rounded-full blur-xl"></div>
        <div className="absolute top-32 right-20 w-24 h-24 bg-emerald-300 rounded-full blur-lg"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-green-200 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Neo-brutalism Status Bar with Timer, Score, and Streaks */}
        <div className="status-bar sticky top-0 z-30 bg-black border-4 border-emerald-400 rounded-none shadow-[12px_12px_0px_0px_#10b981] p-6 mb-8 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Avatar with Neo-brutalism styling */}
              <div className="relative">
                <div className="w-16 h-16 bg-emerald-400 border-4 border-black rounded-none shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center">
                  <span className="text-black font-black text-2xl" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}></span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 border-2 border-black rounded-none"></div>
              </div>

              <div className="flex items-center space-x-8">
                {/* Timer - Top Left */}
                <div className="bg-white border-4 border-black rounded-none p-3 shadow-[4px_4px_0px_0px_#000000]">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-black text-lg" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>TIMER</span>
                    <div className="bg-red-400 border-2 border-black px-3 py-1 rounded-none">
                      <span className="font-black text-black font-mono">{timerValue}</span>
                    </div>
                  </div>
                </div>

                {/* Score - Right of Timer */}
                <div className="bg-white border-4 border-black rounded-none p-3 shadow-[4px_4px_0px_0px_#000000]">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-black text-lg" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>SCORE</span>
                    <div className="bg-yellow-400 border-2 border-black px-3 py-1 rounded-none">
                      <span className="font-black text-black">{userCoins.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Streaks */}
                <div className="bg-white border-4 border-black rounded-none p-3 shadow-[4px_4px_0px_0px_#000000]">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-black text-lg" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>STREAK</span>
                    <div className="bg-orange-400 border-2 border-black px-2 py-1 rounded-none">
                      <span className="font-black text-black">{userStreak}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Analytics Button */}
              <button
                onClick={() => router.push('/analytics')}
                className="bg-blue-500 hover:bg-blue-600 border-2 border-black px-4 py-2 rounded-none shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_0px_#000000] text-white font-black text-sm"
                style={{ fontFamily: 'Kenney Future Narrow, monospace' }}
              >
                ANALYTICS
              </button>

              {/* Comic book style title */}
              <div className="bg-red-500 border-4 border-black rounded-none px-6 py-3 shadow-[6px_6px_0px_0px_#000000]">
                <h1 className="text-white font-black text-2xl tracking-wider" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                  VOCALIZER
                </h1>
                <div className="text-white font-bold text-sm -mt-1">By SPASHT</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2D Level Grid - Candy Crush Style */}
        <div className="progress-grid bg-gradient-to-br from-emerald-100 to-green-200 border-4 border-black rounded-none shadow-[12px_12px_0px_0px_#000000] p-8 mb-8 relative overflow-visible">

          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black text-black mb-2 tracking-wider" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                SPEECH QUEST BECOME A SPEECHER
              </h2>
              <div className="bg-yellow-400 border-2 border-black rounded-none px-4 py-2 inline-block shadow-[4px_4px_0px_0px_#000000]">
                <span className="font-black text-black text-lg">LEVELS 1-21 • BOSS BATTLES EVERY 7TH QUEST</span>
              </div>
            </div>

            {/* Level Grid - 7x3 layout like Candy Crush */}
            <div className="grid grid-cols-7 gap-4 max-w-4xl mx-auto relative overflow-visible">
              {levels.slice(0, 21).map((level, index) => {
                const row = Math.floor(index / 7);
                const col = index % 7;
                const isBoss = level.isBossLevel;

                const isCompleted = completedLevels.includes(level.id);

                return (
                  <div key={level.id} className="relative group">
                    {/* Completion Checkmark */}
                    {isCompleted && (
                      <div className="absolute -top-2 -right-2 z-40">
                        <div className="bg-green-500 border-2 border-black rounded-full w-6 h-6 flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
                          <span className="text-white font-black text-xs">✓</span>
                        </div>
                      </div>
                    )}

                    {/* Comic Book Speech Bubble for Boss Levels (positioned at grid level to avoid clipping) */}
                    {isBoss && (
                      <div
                        className={`absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                        style={{
                          zIndex: 9999 + row * 100,
                          left: `${(col + 0.5) * (100 / 7)}%`, // Center horizontally in grid column
                          top: row === 0 ? '100%' : 'auto', // For top row, position below
                          bottom: row !== 0 ? '100%' : 'auto', // For other rows, position above
                          transform: 'translateX(-50%)',
                          marginTop: row === 0 ? '0.5rem' : 'auto',
                          marginBottom: row !== 0 ? '0.5rem' : 'auto'
                        }}
                      >
                        <div className="relative">
                          <div className="bg-red-500 border-4 border-black rounded-2xl px-4 py-2 shadow-[6px_6px_0px_0px_#000000] max-w-xs">
                            <div className="text-white font-black text-sm text-center" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                              {level.speechBubbleText}
                            </div>
                          </div>
                          {/* Speech bubble pointer */}
                          {row === 0 ? (
                            // Pointer pointing up for top row (tooltip below button)
                            <>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-b-6 border-transparent border-b-red-500"></div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black mb-1"></div>
                            </>
                          ) : (
                            // Pointer pointing down for other rows (tooltip above button)
                            <>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-red-500"></div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black mt-1"></div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Level Button with Neo-brutalism */}
                    <button
                      onClick={() => handleLevelClick(level)}
                      className={`relative mb-3 transform transition-all duration-300 z-30 ${isBoss
                        ? 'hover:scale-110 hover:rotate-3'
                        : 'hover:scale-105 group-hover:-translate-y-1'
                        }`}
                    >
                      {/* Background Image */}
                      <div className="relative w-16 h-16 md:w-20 md:h-20 overflow-hidden border-4 border-black rounded-none shadow-[4px_4px_0px_0px_#000000]">
                        <Image
                          src={level.backgroundImage}
                          alt={`Level ${level.level} background`}
                          fill
                          className="object-cover"
                        />
                        {/* Level overlay - all levels accessible */}
                        <div className="absolute inset-0 bg-gray-600 bg-opacity-80"></div>

                        {/* Level Number */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {isBoss ? (
                            <div className="text-center">
                              <div className="text-red-600 font-black text-xl md:text-2xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                BOSS
                              </div>
                              <div className="text-white font-black text-sm" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                {level.level}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="text-black font-black text-lg md:text-xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                                {level.level}
                              </div>
                              <div className="text-black font-bold text-xs" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                {getDifficultyShort(level.difficulty).toUpperCase()}
                              </div>
                            </div>
                          )}
                        </div>


                      </div>
                    </button>

                    {/* Level Name */}
                    <div className="text-center">
                      <div className={`text-xs font-black text-black max-w-16 md:max-w-20 truncate mx-auto ${isBoss ? 'text-red-600' : ''
                        }`} style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                        {isBoss ? level.name.toUpperCase() : level.name.toUpperCase()}
                      </div>
                    </div>

                    {/* Comic Book Speech Bubble for Regular Levels (on hover) */}
                    {!isBoss && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ zIndex: 9999 + row * 100 }}>
                        <div className="relative">
                          <div className="bg-emerald-400 border-3 border-black rounded-xl px-3 py-2 shadow-[4px_4px_0px_0px_#000000] max-w-xs">
                            <div className="text-black font-black text-xs text-center" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                              {level.speechBubbleText}
                            </div>
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-emerald-400"></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress Indicator */}
            <div className="mt-8 text-center">
              <div className="bg-black border-2 border-emerald-400 rounded-none px-6 py-3 inline-block shadow-[4px_4px_0px_0px_#10b981]">
                <span className="text-emerald-400 font-black text-lg" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                  CHOOSE YOUR CHALLENGE FROM {levels.length} AVAILABLE LEVELS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Details Panel */}
        {selectedLevel && (
          <div className={`border-4 rounded-none shadow-[12px_12px_0px_0px_#000000] p-8 mt-8 ${selectedLevel.isBossLevel
            ? 'bg-red-50 border-red-600 shadow-[12px_12px_0px_0px_#dc2626] shadow-red-600/50'
            : 'bg-white border-black'
            }`}>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Level Info */}
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-red-500 border-2 border-black px-4 py-2 rounded-none">
                    <span className="text-white font-black text-xl" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                      LEVEL {selectedLevel.level}
                    </span>
                  </div>
                  {selectedLevel.isBossLevel ? (
                    <div className="bg-red-600 border-2 border-black px-4 py-2 rounded-none shadow-[0_0_20px_rgba(220,38,38,0.8)]">
                      <span className="text-white font-black text-lg" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                        BOSS DIFFICULTY
                      </span>
                    </div>
                  ) : (
                    <div className={`bg-${getDifficultyColor(selectedLevel.difficulty).toLowerCase()}-400 border-2 border-black px-4 py-2 rounded-none`}>
                      <span className="text-black font-black text-lg" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                        {selectedLevel.difficulty.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className={`text-2xl font-black mb-4 ${selectedLevel.isBossLevel
                  ? 'text-red-700'
                  : 'text-black'
                  }`} style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                  {selectedLevel.name}
                </h3>

                <p className={`font-medium mb-6 leading-relaxed ${selectedLevel.isBossLevel
                  ? 'text-red-900'
                  : 'text-black'
                  }`}>
                  {selectedLevel.description}
                </p>

                {/* Skills Developed */}
                <div className="mb-6">
                  <h4 className={`text-lg font-black mb-3 ${selectedLevel.isBossLevel ? 'text-red-800' : 'text-black'
                    }`} style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                    SKILLS DEVELOPED:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLevel.skills.map((skill, index) => (
                      <span
                        key={index}
                        className={`border-2 border-black px-3 py-1 rounded-none text-black font-black text-sm ${selectedLevel.isBossLevel
                          ? 'bg-red-400 border-red-600'
                          : 'bg-emerald-400'
                          }`}
                        style={{ fontFamily: 'Kenney Future Narrow, monospace' }}
                      >
                        {skill.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Challenge Prompt */}
                <div className="mb-6">
                  <h4 className={`text-lg font-black mb-3 ${selectedLevel.isBossLevel ? 'text-red-800' : 'text-black'
                    }`} style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                    CHALLENGE PROMPT:
                  </h4>
                  <div className={`border-2 p-4 rounded-none ${selectedLevel.isBossLevel
                    ? 'bg-red-100 border-red-600'
                    : 'bg-gray-100 border-black'
                    }`}>
                    <p className={`font-medium italic ${selectedLevel.isBossLevel ? 'text-red-900' : 'text-black'
                      }`}>
                      "{selectedLevel.prompt}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Rewards and Stats */}
              <div>
                <h4 className={`text-xl font-black mb-4 ${selectedLevel.isBossLevel ? 'text-red-800 animate-pulse' : 'text-black'
                  }`} style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                  {selectedLevel.isBossLevel ? 'EPIC REWARDS & STATS' : 'REWARDS & STATS'}
                </h4>

                <div className="space-y-4 mb-6">
                  <div className={`flex items-center justify-between border-2 border-black p-3 rounded-none ${selectedLevel.isBossLevel
                    ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]'
                    : 'bg-yellow-400'
                    }`}>
                    <span className="font-black text-black" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                      {selectedLevel.isBossLevel ? 'EPIC COINS:' : 'COINS REWARD:'}
                    </span>
                    <span className={`font-black text-xl ${selectedLevel.isBossLevel ? 'text-white animate-pulse' : 'text-black'
                      }`}>
                      {selectedLevel.rewardCoins}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between border-2 border-black p-3 rounded-none ${selectedLevel.isBossLevel
                    ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)]'
                    : 'bg-blue-400'
                    }`}>
                    <span className="font-black text-black" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                      {selectedLevel.isBossLevel ? 'EPIC XP:' : 'XP REWARD:'}
                    </span>
                    <span className={`font-black text-xl ${selectedLevel.isBossLevel ? 'text-white animate-pulse' : 'text-black'
                      }`}>
                      {selectedLevel.rewardXP}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between border-2 border-black p-3 rounded-none ${selectedLevel.isBossLevel
                    ? 'bg-red-700 shadow-[0_0_15px_rgba(185,28,28,0.6)]'
                    : 'bg-red-400'
                    }`}>
                    <span className="font-black text-black" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                      {selectedLevel.isBossLevel ? 'BOSS TIME:' : 'TIME LIMIT:'}
                    </span>
                    <span className={`font-black text-xl ${selectedLevel.isBossLevel ? 'text-white animate-pulse' : 'text-black'
                      }`}>
                      {selectedLevel.timeLimit ? `${Math.floor(selectedLevel.timeLimit / 60)}:${(selectedLevel.timeLimit % 60).toString().padStart(2, '0')}` : 'UNLIMITED'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => selectedLevel && handleStartChallenge(selectedLevel)}
                    className={`w-full border-2 border-black py-3 rounded-none shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_0px_#000000] ${selectedLevel.isBossLevel
                      ? 'bg-red-600 hover:bg-red-700 shadow-[0_0_25px_rgba(220,38,38,0.8)] hover:shadow-[0_0_35px_rgba(220,38,38,1)] animate-pulse'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                      }`}
                  >
                    <span className="text-white font-black text-lg" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                      {selectedLevel.isBossLevel ? '⚔️ FACE THE BOSS ⚔️' : 'START CHALLENGE'}
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedLevel(null)}
                    className="w-full bg-gray-500 hover:bg-gray-600 border-2 border-black py-2 rounded-none shadow-[2px_2px_0px_0px_#000000] transition-all hover:shadow-[4px_4px_0px_0px_#000000]"
                  >
                    <span className="text-white font-black text-sm" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                      CLOSE DETAILS
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
