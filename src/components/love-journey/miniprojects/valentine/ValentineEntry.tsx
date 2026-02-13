"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Analytics } from "@vercel/analytics/react"
import { useExperienceStore } from './store/useExperienceStore';
import { useAudioStore } from './store/useAudioStore';
import { getValentineImages } from '@/app/actions/valentine';
import { Environment } from '@react-three/drei';
import { SceneManager } from './components/managers/SceneManager';
import { RenderLoopActivator } from './components/managers/RenderLoopActivator';
import { CameraManager } from './components/managers/CameraManager';
import { LayerManager } from './components/managers/LayerManager';
import { TransitionController } from './components/managers/TransitionController';
import { IntroSequenceManager } from './components/managers/IntroSequenceManager';
import { GlobalAudioElement } from './components/managers/GlobalAudioElement';
import { BackgroundGradient } from './components/3d/assets/BackgroundGradient';
import { LetterOverlay } from './components/ui/overlay/LetterOverlay';
import { StoryOverlay } from './components/ui/overlay/StoryOverlay';
import { DebugPanel } from './components/ui/feedback/DebugPanel';
import { Settings } from 'lucide-react';
import { ScreenshotButton } from './components/ui/controls/ScreenshotButton';
import { FrameSelector } from './components/ui/controls/FrameSelector';
import { ScreenshotPreview } from './components/ui/modals/ScreenshotPreview';
import { MiniMusicPlayer } from './components/ui/controls/MiniMusicPlayer';
import { CameraOverlay } from './components/ui/overlay/CameraOverlay';
import { FrameOverlay } from './components/ui/overlay/FrameOverlay';
import { FpsCounter } from './components/ui/feedback/FpsCounter';
import { GiftRevealPrompt } from './components/ui/GiftRevealPrompt';
import { SceneTransitionOverlay } from './components/ui/overlay/SceneTransitionOverlay';
import { MemoryModal } from './components/ui/modals/MemoryModal';
import { CursorSparkles } from './components/ui/overlay/CursorSparkles';
import { StarDrawingOverlay } from './components/ui/overlay/StarDrawingOverlay';
import { PhoneIntro } from './components/ui/overlay/PhoneIntro';

import { PromiseModal } from './components/ui/modals/PromiseModal';
import { TimelineBar } from './components/ui/TimelineBar';
import { ConfettiBurst } from './components/3d/ConfettiBurst';
import { FireworksEffect } from './components/3d/FireworksEffect';
import { ValentineErrorBoundary } from './components/ui/feedback/ValentineErrorBoundary';

export default function ValentineEntry() {
  // ALL hooks must be called unconditionally before any conditional return
  const [isClient, setIsClient] = useState(false);

  // Granular selectors
  const envIntensity = useExperienceStore((s) => s.layerParams.envIntensity);
  const envRotation = useExperienceStore((s) => s.layerParams.envRotation);
  const ambientIntensity = useExperienceStore((s) => s.layerParams.ambientIntensity);
  const debugPanelVisible = useExperienceStore((s) => s.debugPanelVisible);
  const toggleDebugPanel = useExperienceStore((s) => s.toggleDebugPanel);
  const screenshotMode = useExperienceStore((s) => s.screenshotMode);
  const capturedImage = useExperienceStore((s) => s.capturedImage);
  const currentScene = useExperienceStore((s) => s.currentScene);
  const performanceLevel = useExperienceStore((s) => s.performanceLevel);
  const setIsAnimating = useExperienceStore((s) => s.setIsAnimating);

  const introPhase = useExperienceStore((s) => s.introPhase);

  const isStarted = currentScene !== 'prelude';

  const [dpr, setDpr] = useState<[number, number]>([1, 2]);

  const audioContext = useAudioStore((s) => s.audioContext);

  const handlePointerDown = useCallback(() => {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    setIsAnimating(true);
    window.setTimeout(() => setIsAnimating(false), 1000);
  }, [setIsAnimating, audioContext]);

  const setValentinePhotos = useExperienceStore(s => s.setValentinePhotos);

  // Client-side hydration check and data initialization
  useEffect(() => {
    setIsClient(true); // eslint-disable-line
    getValentineImages().then(setValentinePhotos);
  }, [setValentinePhotos]);

  // Set DPR based on device width (client-side only)
  useEffect(() => {
    if (!isClient) return;
    const clientDpr: [number, number] = window.innerWidth < 768 ? [0.5, 1] : [1, 2];
    setDpr(clientDpr); // eslint-disable-line
  }, [isClient]);

  // Loading state - rendered AFTER all hooks
  if (!isClient) {
    return (
      <div className="fixed inset-0 w-full h-full bg-valentine-dark overflow-hidden flex items-center justify-center" suppressHydrationWarning>
        <div className="text-white text-center" suppressHydrationWarning>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4" suppressHydrationWarning />
          <p>Loading 3D Experience...</p>
        </div>
      </div>
    );
  }

  return (
    <>

      <GlobalAudioElement />
      <TransitionController />
      <Analytics />
      <div className="fixed inset-0 w-full h-full bg-valentine-dark overflow-hidden" suppressHydrationWarning>
        <ValentineErrorBoundary area="Valentine 3D Canvas">
          <div className="absolute inset-0 z-0">
            <Canvas
              frameloop="always"
              onPointerDown={handlePointerDown}
              shadows={performanceLevel !== 'low'}
              gl={{
                antialias: false,
                powerPreference: "high-performance",
                stencil: false,
                depth: true,
                toneMappingExposure: 1.0,
                preserveDrawingBuffer: true // Prevent canvas clear during re-render
              }}
              dpr={dpr}
            >
              <color attach="background" args={['#1a0e30']} />
              <BackgroundGradient />

              <CameraManager />
              <RenderLoopActivator />

              <Environment
                preset="sunset"
                environmentIntensity={envIntensity ?? 0.8}
                environmentRotation={[0, envRotation ?? 0, 0]}
              />
              <directionalLight
                position={[5, 10, 5]}
                intensity={(envIntensity ?? 0.8) * 1.2}
                castShadow={performanceLevel === 'high' && currentScene !== 'prelude'}
                shadow-mapSize={performanceLevel === 'high' ? [512, 512] : [256, 256]}
                shadow-bias={-0.004}
              />

              <ambientLight intensity={ambientIntensity ?? 0.15} color="#F8C8DC" />

              <SceneManager />
              <IntroSequenceManager />
              <LayerManager />
              <ConfettiBurst />
              <FireworksEffect />
            </Canvas>
          </div>

          <PhoneIntro />

          <div className="absolute inset-0 z-10 pointer-events-none">
            {!screenshotMode && !capturedImage && introPhase === 'completed' && (
              <>
                <StoryOverlay />
                <LetterOverlay />
                <MemoryModal />

                <PromiseModal />
                {isStarted && (
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-50 flex flex-col gap-2 sm:gap-4 items-start pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-1 sm:gap-2">
                      <ScreenshotButton />
                      <FrameSelector />
                    </div>
                  </div>
                )}

                {isStarted && <FrameOverlay />}
                {isStarted && <TimelineBar />}

                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 pointer-events-auto z-50">
                  <button
                    onClick={toggleDebugPanel}
                    className="p-2 sm:p-3 bg-white/10 backdrop-blur-md rounded-full text-white/90 hover:bg-white/20 transition-all shadow-lg border border-white/10"
                    title="Open Debug Panel"
                    aria-label="Mở bảng điều khiển debug"
                    aria-expanded={debugPanelVisible}
                  >
                    <Settings size={18} className="sm:w-6 sm:h-6" />
                  </button>
                </div>

                {debugPanelVisible && <DebugPanel />}

                <MiniMusicPlayer />
                {isStarted && <CameraOverlay />}
                {isStarted && <GiftRevealPrompt />}
                <CursorSparkles />
                <StarDrawingOverlay />
              </>
            )}

            <ScreenshotPreview />
            {/* <PhotoGalleryModal /> */}
            <SceneTransitionOverlay />
            <FpsCounter />
          </div>
        </ValentineErrorBoundary>
      </div>
    </>
  );
}
