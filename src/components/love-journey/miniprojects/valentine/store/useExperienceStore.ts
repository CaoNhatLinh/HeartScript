import { create } from 'zustand';

export type SceneType = 'prelude' | 'intro' | 'flower' | 'climax' | 'chocolate' | 'ending';
export type FocusTarget = 'rose' | 'envelope' | 'photo' | 'chocolate' | 'center' | 'intro_start';

export type LayerKey = 'starfield' | 'filmGrain' | 'lightPulse' | 'meteor' | 'rain' | 'letter' | 'hearts' | 'floatingWords';

interface PendingTransition { scene: SceneType; opts?: Record<string, unknown> }

export interface LayerParams {
    heartCount: number;
    heartSpeed: number;
    meteorCount: number;
    meteorSpeed: number;
    meteorAngle: number;
    rainCount: number;
    rainOpacity: number;
    filmGrainIntensity: number;
    vignetteDarkness: number;
    bloomIntensity: number;
    chromaOffset: number;
    dofFocus: number;
    dofBokehScale: number;
    ambientIntensity: number;
    envIntensity: number;
    envRotation: number;
    brightness: number;
    contrast: number;
    saturation: number;
    // Floating Words
    floatingWordsCount: number;
    floatingWordsSpeed: number;
    floatingWordsOpacity: number;
    floatingWordsSize: number;
    floatingWordsColor: string;
    // Wind Effect
    windSpeed: number;
    windAngle: number;
    windIntensity: number;
    // Sunset Lighting
    sunsetIntensity: number;
    sunsetAngle: number;
    warmth: number;
}

interface ExperienceState {
    currentScene: SceneType;
    focusTarget: FocusTarget; // SINGLE SOURCE OF TRUTH FOR CAMERA
    bloomProgress: number;
    openCount: number;
    bloomComplete: boolean;
    audioPlaying: boolean;
    audioVolume: number;

    // Story State
    storyStep: number;
    isFrozen: boolean;

    // Layer control
    activeLayers: Record<LayerKey, boolean>;
    setLayer: (layer: LayerKey, active: boolean) => void;
    toggleLayer: (layer: LayerKey) => void;
    enableLayersForScene: (scene: SceneType) => void;

    // Layer runtime parameters
    layerParams: LayerParams;
    setLayerParam: (key: string, value: unknown) => void;
    setLayerParams: (patch: Partial<ExperienceState['layerParams']>) => void;

    // Transition Requests
    pendingTransition?: PendingTransition | null;
    requestSceneTransition: (scene: SceneType, opts?: Record<string, unknown>) => void;
    clearPendingTransition: () => void;

    // Screenshot State
    screenshotMode: boolean;
    setScreenshotMode: (mode: boolean) => void;

    // Debug panel visibility
    debugPanelVisible: boolean;
    toggleDebugPanel: () => void;

    // Performance controls (quality presets to drive budgets)
    performanceLevel: 'low' | 'medium' | 'high';
    setPerformanceLevel: (level: 'low' | 'medium' | 'high') => void;
    showFps: boolean;
    setShowFps: (show: boolean) => void;

    frameVisible: boolean;
    setFrameVisible: (visible: boolean) => void;

    selectedFrame: 'classic' | 'cute' | 'cinematic' | 'rose' | 'crystal' | 'floral';
    setSelectedFrame: (frame: 'classic' | 'cute' | 'cinematic' | 'rose' | 'crystal' | 'floral') => void;
    isFrameSelectorOpen: boolean;
    setFrameSelectorOpen: (open: boolean) => void;

    capturedImage: string | null;
    setCapturedImage: (img: string | null) => void;

    // Camera Overlay State (để ScreenshotButton có thể truy cập)
    isCameraEnabled: boolean;
    setCameraEnabled: (enabled: boolean) => void;
    cameraVideoRef: HTMLVideoElement | null;
    setCameraVideoRef: (ref: HTMLVideoElement | null) => void;
    cameraPosition: { x: number; y: number };
    setCameraPosition: (pos: { x: number; y: number }) => void;
    cameraSize: { width: number; height: number };
    setCameraSize: (size: { width: number; height: number }) => void;

    // Background Config
    backgroundConfig: {
        gradientStart: string;
        gradientMid: string;
        gradientEnd: string;
        style: 'radial' | 'linear' | 'aurora';
    };
    setBackgroundConfig: (config: Partial<ExperienceState['backgroundConfig']>) => void;

    // Actions
    setScene: (scene: SceneType) => void;
    setFocusTarget: (target: FocusTarget) => void;
    setBloomProgress: (progress: number) => void;
    toggleAudio: () => void;
    setAudioPlaying: (playing: boolean) => void;
    setAudioVolume: (volume: number) => void;

    // Rose Interaction State
    roseHover: boolean;
    setRoseHover: (hover: boolean) => void;
    setOpenCount: (count: number) => void;

    // Letter Interaction
    isReadingLetter: boolean;
    setReadingLetter: (reading: boolean) => void;
    hasReadLetter: boolean;
    markReadLetter: () => void;

    // Chocolate Interaction
    hasTastedChocolate: boolean;
    markTastedChocolate: () => void;

    // Gift Reveal Stage - Quản lý thứ tự xuất hiện khi click nhận quà
    // 0: chưa reveal, 1: mascot hiện, 2: photo hiện, 3: chocolate hiện
    giftRevealStage: number;
    advanceGiftReveal: () => void;
    resetGiftReveal: () => void;

    nextStoryStep: () => void;
    setStoryStep: (step: number) => void;
    setIsFrozen: (frozen: boolean) => void;

    setFloatingWordsList: (words: string[]) => void;
    floatingWordsList: string[];

    // Interaction lock
    isInspecting: boolean;
    setIsInspecting: (inspecting: boolean) => void;
    isTransitioning: boolean;
    setIsTransitioning: (transitioning: boolean) => void;

    // Animation control: when true, keep render active (used by TransitionController or user interaction)
    isAnimating: boolean;
    setIsAnimating: (animating: boolean) => void;

    // Debug
    visibleModels: {
        rose: boolean;
        envelope: boolean;
        photo: boolean;
        chocolate: boolean;
        mascot: boolean;
    };
    toggleModelVisibility: (model: 'rose' | 'envelope' | 'photo' | 'chocolate' | 'mascot') => void;

    // Advanced Transform Control
    modelTransforms: Record<'rose' | 'envelope' | 'photo' | 'chocolate' | 'mascot', { position: number[], rotation: number[], scale: number }>;
    setModelTransform: (model: 'rose' | 'envelope' | 'photo' | 'chocolate' | 'mascot', key: 'position' | 'rotation' | 'scale', value: number | number[]) => void;
}

export const useExperienceStore = create<ExperienceState>((set) => ({
    currentScene: 'prelude',
    focusTarget: 'intro_start', // Start FAR AWAY
    bloomProgress: 0.0,
    openCount: 0,
    bloomComplete: false,
    audioPlaying: false,
    audioVolume: 0.5,

    activeLayers: {
        starfield: true,
        filmGrain: true,
        lightPulse: false,
        meteor: false,
        rain: false,
        letter: false,
        hearts: false, // Default to FALSE (Prelude state)
        floatingWords: false, // Default to FALSE
    },

    layerParams: {
        heartCount: 50,
        heartSpeed: 1.0, // multiplier
        meteorCount: 40,
        meteorSpeed: 0.008,
        meteorAngle: -0.8,
        rainCount: 300,
        rainOpacity: 0.8,
        filmGrainIntensity: 0.04,
        vignetteDarkness: 1.1,
        bloomIntensity: 2.0, // HIGH BLOOM initially for "Glowing Rose in Dark"
        chromaOffset: 0.0025,
        dofFocus: 2.8,
        dofBokehScale: 0.6,
        // Lighting & Color Grading - START DARK
        ambientIntensity: 0.01, // Very dark ambient
        envIntensity: 0.0,      // No environment light initially
        envRotation: 0,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        // Floating Words Defaults
        floatingWordsCount: 15, // Max on screen
        floatingWordsSpeed: 1.0,
        floatingWordsOpacity: 0.4,
        floatingWordsSize: 1.0,
        floatingWordsColor: '#E8AEB7',
        // Wind Effect Defaults
        windSpeed: 1.0,
        windAngle: 45, // degrees
        windIntensity: 0.5,
        // Sunset Lighting Defaults
        sunsetIntensity: 0.6,
        sunsetAngle: 15, // degrees from horizon
        warmth: 0.5
    },

    // Debug: Model Visibility Flags
    visibleModels: {
        rose: true,
        envelope: true,
        photo: true,
        chocolate: true,
        mascot: true, // Allow mascot to show when logic met
    },
    toggleModelVisibility: (model: 'rose' | 'envelope' | 'photo' | 'chocolate' | 'mascot') => set((state) => ({
        visibleModels: { ...state.visibleModels, [model]: !state.visibleModels[model] }
    })),
    setLayerParam: (key, value) => set((state) => ({ layerParams: { ...state.layerParams, [key]: value } })),
    setLayerParams: (patch) => set((state) => ({ layerParams: { ...state.layerParams, ...patch } })),

    storyStep: 0,
    isFrozen: false,

    pendingTransition: null,
    requestSceneTransition: (scene, opts) => set({ pendingTransition: { scene, opts } }),
    clearPendingTransition: () => set({ pendingTransition: null }),

    setOpenCount: (count) => set({ openCount: count }),

    isReadingLetter: false,
    setReadingLetter: (reading) => set({ isReadingLetter: reading }),
    hasReadLetter: false,
    markReadLetter: () => set({ hasReadLetter: true }),

    hasTastedChocolate: false,
    markTastedChocolate: () => set({ hasTastedChocolate: true }),

    debugPanelVisible: false,
    toggleDebugPanel: () => set((state) => ({ debugPanelVisible: !state.debugPanelVisible })),

    // Default to low quality to avoid device heating on initial load; can be changed in DebugPanel or via auto heuristics
    performanceLevel: 'medium',
    setPerformanceLevel: (level) => set({ performanceLevel: level }),
    showFps: false,
    setShowFps: (show) => set({ showFps: show }),

    setLayer: (layer, active) => set((state) => ({ activeLayers: { ...state.activeLayers, [layer]: active } })),
    toggleLayer: (layer) => set((state) => ({ activeLayers: { ...state.activeLayers, [layer]: !state.activeLayers[layer] } })),

    enableLayersForScene: (scene) => set(() => {
        const presets: Record<SceneType, Record<LayerKey, boolean>> = {
            prelude: { starfield: true, filmGrain: true, lightPulse: false, meteor: false, rain: false, letter: false, hearts: false, floatingWords: false },
            intro: { starfield: true, filmGrain: true, lightPulse: true, meteor: false, rain: false, letter: false, hearts: true, floatingWords: true },
            flower: { starfield: true, filmGrain: true, lightPulse: true, meteor: false, rain: false, letter: true, hearts: true, floatingWords: true },
            climax: { starfield: true, filmGrain: true, lightPulse: true, meteor: true, rain: false, letter: true, hearts: true, floatingWords: true },
            chocolate: { starfield: true, filmGrain: false, lightPulse: true, meteor: false, rain: false, letter: true, hearts: true, floatingWords: true },
            ending: { starfield: true, filmGrain: false, lightPulse: false, meteor: false, rain: false, letter: false, hearts: true, floatingWords: true },
        };
        return { activeLayers: presets[scene] || presets.prelude };
    }),

    setScene: (scene) => set((state) => {
        const presets: Record<SceneType, Record<LayerKey, boolean>> = {
            prelude: { starfield: true, filmGrain: true, lightPulse: false, meteor: false, rain: false, letter: false, hearts: false, floatingWords: false },
            intro: { starfield: true, filmGrain: true, lightPulse: true, meteor: false, rain: false, letter: false, hearts: true, floatingWords: true },
            flower: { starfield: true, filmGrain: true, lightPulse: true, meteor: false, rain: false, letter: true, hearts: true, floatingWords: true },
            climax: { starfield: true, filmGrain: true, lightPulse: true, meteor: true, rain: false, letter: true, hearts: true, floatingWords: true },
            chocolate: { starfield: true, filmGrain: false, lightPulse: true, meteor: false, rain: false, letter: true, hearts: true, floatingWords: true },
            ending: { starfield: true, filmGrain: false, lightPulse: false, meteor: false, rain: false, letter: false, hearts: true, floatingWords: true },
        };

        // Determine focus target based on scene automatically if needed
        let focusTarget: FocusTarget = state.focusTarget;
        if (scene === 'chocolate') focusTarget = 'chocolate';
        if (scene === 'ending') focusTarget = 'center';

        return {
            currentScene: scene,
            focusTarget,
            activeLayers: presets[scene] || presets.prelude,
            // storyStep: state.storyStep + 1 // REMOVED: Managed by StoryOverlay based on events now
        };
    }),

    setFocusTarget: (target) => set({ focusTarget: target }),

    setBloomProgress: (progress) => set((state) => {
        const newProgress = Math.min(Math.max(progress, 0), 1);
        const base = 0.1;
        const maxExtra = 0.8;
        const bloomIntensity = Math.min(base + newProgress * maxExtra, 1.2);
        const dofFocus = 4.0 - (newProgress * 1.5);

        return {
            bloomProgress: newProgress,
            bloomComplete: newProgress >= 1,
            layerParams: { ...state.layerParams, bloomIntensity, dofFocus }
        };
    }),

    // Screenshot State
    screenshotMode: false,
    setScreenshotMode: (mode) => set({ screenshotMode: mode }),

    frameVisible: false,
    setFrameVisible: (visible) => set({ frameVisible: visible }),

    selectedFrame: 'classic',
    setSelectedFrame: (frame) => set({ selectedFrame: frame }),
    isFrameSelectorOpen: false,
    setFrameSelectorOpen: (open) => set({ isFrameSelectorOpen: open }),

    capturedImage: null,
    setCapturedImage: (img) => set({ capturedImage: img }),

    // Camera Overlay State
    isCameraEnabled: false,
    setCameraEnabled: (enabled) => set({ isCameraEnabled: enabled }),
    cameraVideoRef: null,
    setCameraVideoRef: (ref) => set({ cameraVideoRef: ref }),
    cameraPosition: { x: 16, y: 16 },
    setCameraPosition: (pos) => set({ cameraPosition: pos }),
    cameraSize: { width: 144, height: 108 },
    setCameraSize: (size) => set({ cameraSize: size }),

    // Background Config - Mặc định là Aurora đẹp
    backgroundConfig: {
        gradientStart: '#1a0a2e',  // Tím đậm
        gradientMid: '#2d1b4e',    // Tím trung
        gradientEnd: '#0f0a1e',    // Tím rất đậm
        style: 'aurora'
    },
    setBackgroundConfig: (config) => set((state) => ({
        backgroundConfig: { ...state.backgroundConfig, ...config }
    })),

    toggleAudio: () => set((state) => ({ audioPlaying: !state.audioPlaying })),
    setAudioPlaying: (playing) => set({ audioPlaying: playing }),
    setAudioVolume: (volume) => set({ audioVolume: volume }),

    roseHover: false,
    setRoseHover: (hover) => set({ roseHover: hover }),

    nextStoryStep: () => set((state) => ({ storyStep: state.storyStep + 1 })),
    setStoryStep: (step: number) => set({ storyStep: step }),
    setIsFrozen: (frozen: boolean) => set({ isFrozen: frozen }),

    // Gift Reveal Stage
    giftRevealStage: 0,
    advanceGiftReveal: () => set((state) => ({
        giftRevealStage: Math.min(state.giftRevealStage + 1, 3)
    })),
    resetGiftReveal: () => set({ giftRevealStage: 0 }),

    setFloatingWordsList: (words) => set({ floatingWordsList: words }),
    floatingWordsList: ["Sweet", "Forever", "Love", "Cherish", "Adore", "Mine", "Yours", "Always", "Heart", "Soul", "Dream", "Magic", "Kiss", "Hug", "Warmth"],

    isInspecting: false,
    setIsInspecting: (inspecting) => set({ isInspecting: inspecting }),
    isTransitioning: false,
    setIsTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

    // Model Transforms Configuration
    modelTransforms: {
        rose: { position: [-3.7, 1.6, 3.7], rotation: [0, 0, 0], scale: 1.2 },
        envelope: { position: [5.0, -0.5, 2.0], rotation: [0, -0.3, 0], scale: 1.0 },
        chocolate: { position: [-5.0, 6.0, 0.3], rotation: [-0.342, -0.4, 0.0], scale: 1.3 },
        mascot: { position: [0.5, 0.4, 1.9], rotation: [-0.042, 0.0, 0.0], scale: 2.8 },
        photo: { position: [1.1, 1.5, 0], rotation: [0, 0, 0], scale: 1 },
    },
    setModelTransform: (model, key, value) => set((state) => ({
        modelTransforms: {
            ...state.modelTransforms,
            [model]: { ...state.modelTransforms[model], [key]: value }
        }
    })),

    // Animating flag to control render loop activation
    isAnimating: false,
    setIsAnimating: (animating) => set({ isAnimating: animating }),
}));
