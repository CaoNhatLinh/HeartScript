// React import and hooks below
import { Canvas } from '@react-three/fiber';
import { Analytics } from "@vercel/analytics/react"
import { useExperienceStore } from './store/useExperienceStore';
import { Environment } from '@react-three/drei';
import { SceneManager } from './components/managers/SceneManager';
import { RenderLoopActivator } from './components/managers/RenderLoopActivator';
import { CameraManager } from './components/managers/CameraManager';
import { AudioController } from './components/managers/AudioController';
import { LayerManager } from './components/managers/LayerManager';
import { TransitionController } from './components/managers/TransitionController';
import { EffectComposer, Bloom, Vignette, Noise, DepthOfField, ChromaticAberration, BrightnessContrast, HueSaturation } from '@react-three/postprocessing';
// Dynamic imports for optional/dev-only components
// They are dynamically loaded at runtime to avoid compile-time dependency issues and to keep the tree-shakeable bundle small
import React, { useEffect, useState } from 'react';
import { BackgroundGradient } from './components/3d/assets/BackgroundGradient';
import { LetterOverlay } from './components/ui/LetterOverlay';
import { StoryOverlay } from './components/ui/StoryOverlay';
import { DebugPanel } from './components/ui/DebugPanel';
import { Settings } from 'lucide-react';
// import { MusicControl } from './components/ui/MusicControl';
import { ScreenshotButton } from './components/ui/ScreenshotButton';
import { FrameSelector } from './components/ui/FrameSelector';
import { ScreenshotPreview } from './components/ui/ScreenshotPreview';
import { MiniMusicPlayer } from './components/ui/MiniMusicPlayer';
import { CameraOverlay } from './components/ui/CameraOverlay';
import { FrameOverlay } from './components/ui/FrameOverlay';
import { FpsCounter } from './components/ui/FpsCounter';
import { GiftRevealPrompt } from './components/ui/GiftRevealPrompt';

import type { LayerParams, LayerKey } from './store/useExperienceStore';

// Stable component for Post Processing effects
const ComposerEffects: React.FC<{
  layerParams: LayerParams;
  activeLayers: Record<LayerKey, boolean>;
  performanceLevel: string;
  currentScene: string;
  FilmGrainComponent: React.ComponentType | null;
}> = React.memo(({ layerParams, activeLayers, performanceLevel, currentScene, FilmGrainComponent }) => {
  return (
    <>
      <Bloom luminanceThreshold={0.7} mipmapBlur={false} intensity={layerParams.bloomIntensity * 0.4} radius={0.4} />
      <Vignette eskil={false} offset={0.1} darkness={layerParams.vignetteDarkness} />

      <BrightnessContrast brightness={layerParams.brightness ?? 0} contrast={layerParams.contrast ?? 0} />
      <HueSaturation saturation={layerParams.saturation ?? 0} hue={0} />

      {performanceLevel === 'high' && currentScene !== 'prelude' ? (
        <>
          <DepthOfField target={[0, 0, 0]} focalLength={0.02} bokehScale={layerParams.dofBokehScale * 0.3} height={480} />
          <ChromaticAberration offset={[layerParams.chromaOffset * 0.2, layerParams.chromaOffset * 0.2]} />
          <Noise opacity={activeLayers.filmGrain ? layerParams.filmGrainIntensity * 0.1 : 0.0} />
        </>
      ) : null}

      {FilmGrainComponent && <FilmGrainComponent />}
    </>
  );
});

export default function ValentineEntry() {
  const {
    layerParams,
  } = useExperienceStore();

  const activeLayers = useExperienceStore((state) => state.activeLayers);
  const debugPanelVisible = useExperienceStore((state) => state.debugPanelVisible);
  const toggleDebugPanel = useExperienceStore((state) => state.toggleDebugPanel);
  const screenshotMode = useExperienceStore((state) => state.screenshotMode);
  const capturedImage = useExperienceStore((state) => state.capturedImage);

  // Use a simple started check based on scene
  const currentScene = useExperienceStore((state) => state.currentScene);
  const isStarted = currentScene !== 'prelude';

  const performanceLevel = useExperienceStore((s) => s.performanceLevel);
  const setIsAnimating = useExperienceStore((s) => s.setIsAnimating);

  const [FilmGrainComponent, setFilmGrainComponent] = useState<React.ComponentType | null>(null);
  const [PerfOverlayComponent, setPerfOverlayComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import('./components/3d/layers/FilmGrainPass').then((mod) => setFilmGrainComponent(() => mod.default)).catch(() => { });
    import('./components/ui/PerfOverlay').then((mod) => setPerfOverlayComponent(() => mod.default)).catch(() => { });
  }, []);

  return (
    <>
      <AudioController />
      <TransitionController />
      <Analytics />
      <div className="fixed inset-0 w-full h-full bg-valentine-dark overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Canvas
            frameloop="always"
            onPointerDown={() => { setIsAnimating(true); window.setTimeout(() => setIsAnimating(false), 1000); }}
            shadows={performanceLevel !== 'low'} // DISABLE shadows purely on low-end
            gl={{
              antialias: false,
              powerPreference: "high-performance",
              stencil: false,
              depth: true,
              toneMappingExposure: 1.0,
              preserveDrawingBuffer: true
            }}
            dpr={performanceLevel === 'low' ? 0.8 : [1, 1.25]} // Aggressive resolution downscaling
          >
            <color attach="background" args={['#120916']} />
            <BackgroundGradient />

            {/* The single authority for camera logic (Transitions + Interaction) */}
            <CameraManager />
            <RenderLoopActivator />

            {/* Adjustable Environment & Lighting */}
            <Environment
              preset="sunset"
              environmentIntensity={layerParams.envIntensity ?? 0.8}
              environmentRotation={[0, layerParams.envRotation ?? 0, 0]}
            />
            {/* Main Light - Shadow limited by performance */}
            <directionalLight
              position={[5, 10, 5]}
              intensity={(layerParams.envIntensity ?? 0.8) * 1.2}
              castShadow={performanceLevel === 'high' && currentScene !== 'prelude'}
              shadow-mapSize={performanceLevel === 'high' ? [512, 512] : [256, 256]}
              shadow-bias={-0.004}
            >
              {performanceLevel === 'high' && currentScene !== 'prelude' && (
                <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8]} />
              )}
            </directionalLight>

            <ambientLight intensity={layerParams.ambientIntensity ?? 0.15} color="#F8C8DC" />

            <SceneManager />
            <LayerManager />

            {/* Post-Processing Gates - drastically reduce passes */}
            <EffectComposer enableNormalPass={false} multisampling={0} enabled={performanceLevel !== 'low'}>
              <ComposerEffects
                layerParams={layerParams}
                activeLayers={activeLayers}
                performanceLevel={performanceLevel}
                currentScene={currentScene}
                FilmGrainComponent={FilmGrainComponent}
              />
            </EffectComposer>
          </Canvas>
        </div>

        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Debug & Overlay Tools (Hidden during screenshot OR while viewing preview) */}
          {!screenshotMode && !capturedImage && (
            <>
              <StoryOverlay />
              <LetterOverlay />
              {/* Screenshot Components - Top Left */}
              {isStarted && (
                <div className="absolute top-4 left-4 z-50 flex flex-col gap-4 items-start pointer-events-none">
                  <div className="pointer-events-auto flex items-center gap-2">
                    <ScreenshotButton />
                    <FrameSelector />
                  </div>
                </div>
              )}

              {/* Frame Preview Overlay */}
              {isStarted && <FrameOverlay />}

              {/* Debug Tools - Bottom Left & Overlay */}
              <div className="absolute bottom-6 left-6 pointer-events-auto z-50">
                <button
                  onClick={toggleDebugPanel}
                  className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white/90 hover:bg-white/20 transition-all shadow-lg border border-white/10"
                  title="Open Debug Panel"
                >
                  <Settings size={22} />
                </button>
              </div>

              {activeLayers?.filmGrain && debugPanelVisible && PerfOverlayComponent && <PerfOverlayComponent />}
              {debugPanelVisible && <DebugPanel />}

              {/* Music Player - Bottom Right - Compact version */}
              {isStarted && <MiniMusicPlayer />}

              {/* Camera Overlay - User's webcam with beauty filters */}
              {isStarted && <CameraOverlay />}

              {/* Gift Reveal Prompt - Clickot/pho để hiện mascto/chocolate lần lượt */}
              {isStarted && <GiftRevealPrompt />}
            </>
          )}

          {/* Screenshot Preview Modal (Highest Layer) */}
          <ScreenshotPreview />

          {/* FPS Counter - Top Right */}
          <FpsCounter />
        </div>
      </div >
    </>
  );
}


