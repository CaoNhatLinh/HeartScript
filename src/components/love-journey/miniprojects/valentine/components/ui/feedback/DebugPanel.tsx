import React, { useState } from 'react';
import { useExperienceStore, SceneType } from '../../../store/useExperienceStore';
import { X, ChevronDown, Monitor, Box, Layers, Film, Cloud, Palette, Sparkles, Heart, Star, Music, Settings, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- STYLING HELPERS ---
const clsx = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');



// --- UI COMPONENTS ---

const KawaiiSectionTitle = ({ children, icon: Icon }: { children: React.ReactNode, icon?: React.ElementType }) => (
    <div className="flex items-center gap-2 mb-3 mt-1 text-slate-600 font-bold text-xs uppercase tracking-wider">
        {Icon && React.createElement(Icon, { size: 14, className: "text-pink-400" })}
        <span>{children}</span>
        <div className="h-0.5 flex-1 bg-pink-200/50 rounded-full ml-2"></div>
    </div>
);

const KawaiiSlider = ({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }) => (
    <div className="mb-4 group">
        <div className="flex justify-between items-center text-xs mb-1.5 px-1">
            <span className="text-slate-600 font-semibold group-hover:text-pink-500 transition-colors">{label}</span>
            <span className="font-mono text-pink-500 bg-white/50 px-2 py-0.5 rounded-full text-[10px] min-w-[30px] text-center shadow-sm border border-white/50">
                {value.toFixed(step < 1 ? 2 : 0)}
            </span>
        </div>
        <div className="relative h-4 flex items-center">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/50 rounded-full appearance-none cursor-pointer border border-white/60 shadow-inner
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-pink-400 
                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white 
                [&::-webkit-slider-thumb]:shadow-md 
                [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
            />
        </div>
    </div>
);

const KawaiiSwitch = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (checked: boolean) => void }) => (
    <div className="flex items-center justify-between py-2 px-1 hover:bg-white/30 rounded-lg transition-colors cursor-pointer" onClick={() => onChange(!checked)}>
        <span className="text-xs text-slate-700 font-semibold">{label}</span>
        <div className={clsx(
            "w-10 h-6 rounded-full relative transition-all duration-300 shadow-inner border border-white/50",
            checked ? "bg-pink-400" : "bg-slate-200"
        )}>
            <div
                className={clsx(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 flex items-center justify-center text-[10px]",
                    checked ? "translate-x-4 rotate-12" : "translate-x-0"
                )}
            >
                {checked ? <Heart size={10} className="text-pink-400 fill-pink-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
            </div>
        </div>
    </div>
);

// --- TABS (Kawaii Style) ---

const KawaiiPerformance = () => {
    const performanceLevel = useExperienceStore(s => s.performanceLevel);
    const setPerformanceLevel = useExperienceStore(s => s.setPerformanceLevel);
    const showFps = useExperienceStore(s => s.showFps);
    const setShowFps = useExperienceStore(s => s.setShowFps);

    return (
        <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm space-y-4">
            <div className="flex gap-2 p-1 bg-white/40 rounded-xl border border-white/40">
                {(['low', 'medium', 'high'] as const).map(level => (
                    <button
                        key={level}
                        onClick={() => setPerformanceLevel(level)}
                        className={clsx(
                            "flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all",
                            performanceLevel === level
                                ? "bg-pink-400 text-white shadow-md transform scale-105"
                                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                        )}
                    >
                        {level}
                    </button>
                ))}
            </div>
            <KawaiiSwitch label="Show FPS Bubbles" checked={showFps} onChange={setShowFps} />
        </div>
    );
};

const KawaiiLayers = () => {
    const activeLayers = useExperienceStore(s => s.activeLayers);
    const toggleLayer = useExperienceStore(s => s.toggleLayer);
    const params = useExperienceStore(s => s.layerParams) || {};
    const setParams = useExperienceStore(s => s.setLayerParams);

    return (
        <div className="space-y-4">
            {/* Layer Toggles */}
            <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.keys(activeLayers).map(key => (
                        <KawaiiSwitch
                            key={key}
                            label={key.replace(/([A-Z])/g, ' $1').trim()}
                            checked={activeLayers[key as keyof typeof activeLayers]}
                            onChange={() => toggleLayer(key as keyof typeof activeLayers)}
                        />
                    ))}
                </div>
            </div>

            {/* Starfield Controls */}
            {activeLayers.starfield && (
                <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                    <KawaiiSectionTitle icon={Star}>Starry Sky</KawaiiSectionTitle>
                    <KawaiiSlider label="Count" value={params.starfieldCount ?? 1500} min={100} max={5000} step={100} onChange={(v) => setParams({ ...params, starfieldCount: v })} />
                    <KawaiiSlider label="Radius" value={params.starfieldRadius ?? 60} min={10} max={200} step={5} onChange={(v) => setParams({ ...params, starfieldRadius: v })} />
                </div>
            )}

            {/* Meteor Controls */}
            {activeLayers.meteor && (
                <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                    <KawaiiSectionTitle icon={Zap}>Meteor Shower</KawaiiSectionTitle>
                    <KawaiiSlider label="Count" value={params.meteorCount ?? 20} min={0} max={500} step={5} onChange={(v) => setParams({ ...params, meteorCount: v })} />
                    <KawaiiSlider label="Speed" value={params.meteorSpeed ?? 3} min={0.1} max={30} step={0.5} onChange={(v) => setParams({ ...params, meteorSpeed: v })} />
                    <KawaiiSlider label="Angle" value={params.meteorAngle ?? -0.6} min={-Math.PI} max={Math.PI} step={0.1} onChange={(v) => setParams({ ...params, meteorAngle: v })} />
                </div>
            )}

            {/* Rain Controls */}
            {activeLayers.rain && (
                <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                    <KawaiiSectionTitle icon={Cloud}>Rainy Mood</KawaiiSectionTitle>
                    <KawaiiSlider label="Drops" value={params.rainCount ?? 1000} min={0} max={2000} step={10} onChange={(v) => setParams({ ...params, rainCount: v })} />
                    <KawaiiSlider label="Wind" value={params.windSpeed ?? 2} min={0} max={10} step={0.1} onChange={(v) => setParams({ ...params, windSpeed: v })} />
                </div>
            )}

            {/* Hearts Controls */}
            {activeLayers.hearts && (
                <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                    <KawaiiSectionTitle icon={Heart}>Floating Hearts</KawaiiSectionTitle>
                    <KawaiiSlider label="Count" value={params.heartCount ?? 50} min={10} max={200} step={5} onChange={(v) => setParams({ ...params, heartCount: v })} />
                    <KawaiiSlider label="Speed" value={params.heartSpeed ?? 1.5} min={0.1} max={5} step={0.1} onChange={(v) => setParams({ ...params, heartSpeed: v })} />
                    <KawaiiSlider label="Scale" value={params.heartScale ?? 3.0} min={0.5} max={10} step={0.5} onChange={(v) => setParams({ ...params, heartScale: v })} />
                </div>
            )}

            {/* Floating Words Controls */}
            {activeLayers.floatingWords && (
                <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                    <KawaiiSectionTitle icon={Music}>Floating Words</KawaiiSectionTitle>
                    <KawaiiSlider label="Amount" value={params.floatingWordsCount ?? 15} min={1} max={50} step={1} onChange={(v) => setParams({ ...params, floatingWordsCount: v })} />
                    <KawaiiSlider label="Speed" value={params.floatingWordsSpeed ?? 1} min={0.1} max={5} step={0.1} onChange={(v) => setParams({ ...params, floatingWordsSpeed: v })} />
                </div>
            )}
        </div>
    );
};

const KawaiiEffects = () => {
    const params = useExperienceStore(s => s.layerParams);
    const setParams = useExperienceStore(s => s.setLayerParams);

    return (
        <div className="space-y-4">
            <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                <KawaiiSectionTitle icon={Sparkles}>Sparkle & Glow</KawaiiSectionTitle>
                <KawaiiSlider label="Bloom Power" value={params.bloomIntensity} min={0} max={3} step={0.1} onChange={(v) => setParams({ ...params, bloomIntensity: v })} />
                <KawaiiSlider label="Vignette" value={params.vignetteDarkness} min={0} max={1} step={0.05} onChange={(v) => setParams({ ...params, vignetteDarkness: v })} />
                <KawaiiSlider label="Grain" value={params.filmGrainIntensity} min={0} max={0.2} step={0.01} onChange={(v) => setParams({ ...params, filmGrainIntensity: v })} />
            </div>
            <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                <KawaiiSectionTitle icon={Layers}>Blurry Background</KawaiiSectionTitle>
                <KawaiiSlider label="Blur Focus" value={params.dofFocus} min={0} max={10} step={0.1} onChange={(v) => setParams({ ...params, dofFocus: v })} />
                <KawaiiSlider label="Bokeh Size" value={params.dofBokehScale} min={0} max={5} step={0.1} onChange={(v) => setParams({ ...params, dofBokehScale: v })} />
            </div>
        </div>
    );
};

const KawaiiEnvironment = () => {
    const params = useExperienceStore(s => s.layerParams);
    const setParams = useExperienceStore(s => s.setLayerParams);
    const bgConfig = useExperienceStore(s => s.backgroundConfig);
    const setBgConfig = useExperienceStore(s => s.setBackgroundConfig);

    const presets = [
        { name: 'Aurora', start: '#1a0a1e', mid: '#2d1b4e', end: '#0f0a1e', style: 'aurora' as const },
        { name: 'Sunset', start: '#1a0a1e', mid: '#4a1942', end: '#2d1b3d', style: 'aurora' as const },
        { name: 'Pinky', start: '#4a1a3a', mid: '#6b2a5a', end: '#2d0f2d', style: 'radial' as const },
        { name: 'Ocean', start: '#0a1628', mid: '#1a2b4a', end: '#0f1a2e', style: 'linear' as const },
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                <KawaiiSectionTitle icon={Palette}>Sky Colors</KawaiiSectionTitle>
                <div className="flex flex-wrap gap-2 mb-4">
                    {presets.map(p => (
                        <button
                            key={p.name}
                            onClick={() => setBgConfig({ gradientStart: p.start, gradientMid: p.mid, gradientEnd: p.end, style: p.style })}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:scale-105 transition-all outline outline-2 outline-white/50 shadow-sm"
                            style={{
                                background: `linear-gradient(135deg, ${p.start}, ${p.mid}, ${p.end})`,
                                color: 'white',
                                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                            }}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <div className="h-8 flex-1 rounded-lg border-2 border-white shadow-sm overflow-hidden relative group">
                        <input type="color" value={bgConfig.gradientStart} onChange={(e) => setBgConfig({ ...bgConfig, gradientStart: e.target.value })} className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer p-0 m-0 border-0" />
                    </div>
                    <div className="h-8 flex-1 rounded-lg border-2 border-white shadow-sm overflow-hidden relative group">
                        <input type="color" value={bgConfig.gradientMid} onChange={(e) => setBgConfig({ ...bgConfig, gradientMid: e.target.value })} className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer p-0 m-0 border-0" />
                    </div>
                    <div className="h-8 flex-1 rounded-lg border-2 border-white shadow-sm overflow-hidden relative group">
                        <input type="color" value={bgConfig.gradientEnd} onChange={(e) => setBgConfig({ ...bgConfig, gradientEnd: e.target.value })} className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer p-0 m-0 border-0" />
                    </div>
                </div>
            </div>

            <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                <KawaiiSectionTitle icon={Zap}>Lighting & Mood</KawaiiSectionTitle>
                <KawaiiSlider label="Ambient Light" value={params.ambientIntensity} min={0} max={2} step={0.05} onChange={(v) => setParams({ ...params, ambientIntensity: v })} />
                <KawaiiSlider label="Reflection" value={params.envIntensity} min={0} max={2} step={0.05} onChange={(v) => setParams({ ...params, envIntensity: v })} />
                <KawaiiSlider label="Brightness" value={params.brightness} min={-0.2} max={0.2} step={0.01} onChange={(v) => setParams({ ...params, brightness: v })} />
            </div>
        </div>
    );
};

// --- TRANSFORM GROUP (Updated Style) ---
type ModelKey = 'rose' | 'envelope' | 'photo' | 'chocolate' | 'mascot' | 'candles' | 'lanterns' | 'petals' | 'balloons' | 'giftBox' | 'ring';

const KawaiiTransformGroup = ({ label, modelKey }: { label: string, modelKey: ModelKey }) => {
    const transforms = useExperienceStore(s => s.modelTransforms);
    const setTransform = useExperienceStore(s => s.setModelTransform);
    const visibleModels = useExperienceStore(s => s.visibleModels);
    const toggleVisibility = useExperienceStore(s => s.toggleModelVisibility);
    const isVisible = visibleModels[modelKey] ?? true;

    const [expanded, setExpanded] = useState(false);
    const data = transforms[modelKey];
    if (!data) return null;

    return (
        <div className={clsx(
            "rounded-xl overflow-hidden transition-all duration-300 border mb-2",
            expanded ? "bg-white/60 border-pink-300 shadow-md" : "bg-white/30 border-white/50 hover:bg-white/50"
        )}>
            <div className="w-full flex justify-between items-center p-3 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleVisibility(modelKey); }}
                        className={clsx(
                            "w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all shadow-sm",
                            isVisible
                                ? "bg-pink-400 border-pink-400 text-white"
                                : "bg-white border-slate-200 text-slate-300 hover:border-pink-200"
                        )}
                    >
                        {isVisible && <Heart size={12} fill="currentColor" />}
                    </button>
                    <span className={clsx("text-xs font-bold transition-colors", expanded ? "text-pink-600" : "text-slate-600")}>
                        {label}
                    </span>
                </div>
                <ChevronDown size={14} className={clsx("text-slate-400 transition-transform duration-300", expanded ? "rotate-180 text-pink-500" : "")} />
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-3 space-y-3 border-t border-pink-100 bg-white/40">
                            <div>
                                <div className="text-[9px] bg-pink-100/50 inline-block px-2 py-0.5 rounded-full text-pink-600 mb-1 font-bold">POSITION</div>
                                <div className="grid grid-cols-3 gap-2">
                                    <KawaiiSlider label="X" value={data.position[0]} min={-10} max={10} step={0.1} onChange={(v) => { const n = [...data.position]; n[0] = v; setTransform(modelKey, 'position', n); }} />
                                    <KawaiiSlider label="Y" value={data.position[1]} min={-10} max={10} step={0.1} onChange={(v) => { const n = [...data.position]; n[1] = v; setTransform(modelKey, 'position', n); }} />
                                    <KawaiiSlider label="Z" value={data.position[2]} min={-10} max={10} step={0.1} onChange={(v) => { const n = [...data.position]; n[2] = v; setTransform(modelKey, 'position', n); }} />
                                </div>
                            </div>
                            <div>
                                <div className="text-[9px] bg-pink-100/50 inline-block px-2 py-0.5 rounded-full text-pink-600 mb-1 font-bold">SIZE</div>
                                <KawaiiSlider label="Uniform" value={data.scale} min={0.1} max={5} step={0.1} onChange={(v) => setTransform(modelKey, 'scale', v)} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const KawaiiModels = () => {
    const showMemoryModal = useExperienceStore(s => s.showMemoryModal);
    const setShowMemoryModal = useExperienceStore(s => s.setShowMemoryModal);
    const showPromiseModal = useExperienceStore(s => s.showPromiseModal);
    const setShowPromiseModal = useExperienceStore(s => s.setShowPromiseModal);

    return (
        <div className="space-y-4">
            <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                <KawaiiSectionTitle icon={Star}>Characters</KawaiiSectionTitle>
                <KawaiiTransformGroup label="Cute Mascot" modelKey="mascot" />
                <KawaiiTransformGroup label="Crystal Rose" modelKey="rose" />
                <KawaiiTransformGroup label="Love Letter" modelKey="envelope" />
                <KawaiiTransformGroup label="Shiny Ring" modelKey="ring" />
            </div>

            <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                <KawaiiSectionTitle icon={Box}>Decorations</KawaiiSectionTitle>
                <KawaiiTransformGroup label="Chocolate Cluster" modelKey="chocolate" />
                <KawaiiTransformGroup label="Photo Gallery" modelKey="photo" />
                <KawaiiTransformGroup label="Candles" modelKey="candles" />
                <KawaiiTransformGroup label="Falling Petals" modelKey="petals" />
                <KawaiiTransformGroup label="Balloons" modelKey="balloons" />
                <KawaiiTransformGroup label="Gift Box" modelKey="giftBox" />
            </div>

            <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                <KawaiiSectionTitle icon={Monitor}>Show Modals</KawaiiSectionTitle>
                <KawaiiSwitch label="Memory Modal" checked={showMemoryModal} onChange={setShowMemoryModal} />
                <KawaiiSwitch label="Promise Modal" checked={showPromiseModal} onChange={setShowPromiseModal} />
            </div>
        </div>
    );
};

// Extended Scene List including Modals/States
const SCENES = [
    { key: 'phone', label: 'Điện Thoại' },
    { key: 'intro', label: 'Bắt Đầu' },
    { key: 'flower', label: 'Hoa Nở' },
    { key: 'memory', label: 'Kỷ Niệm' },
    { key: 'letter', label: 'Lá Thư' },
    { key: 'chocolate', label: 'Socola' },
    { key: 'promise', label: 'Lời Hứa' },
    { key: 'ending', label: 'Kết Thúc' },
];

const KawaiiSceneTab = () => {
    const requestSceneTransition = useExperienceStore(s => s.requestSceneTransition);
    const currentScene = useExperienceStore(s => s.currentScene);
    const resetGiftReveal = useExperienceStore(s => s.resetGiftReveal);

    // Reactive State Values
    const showMemoryModal = useExperienceStore(s => s.showMemoryModal);
    const isReadingLetter = useExperienceStore(s => s.isReadingLetter);
    const showPromiseModal = useExperienceStore(s => s.showPromiseModal);

    // Setters
    const setShowMemoryModal = useExperienceStore(s => s.setShowMemoryModal);
    const setReadingLetter = useExperienceStore(s => s.setReadingLetter);
    const setShowPromiseModal = useExperienceStore(s => s.setShowPromiseModal);
    const setScreenshotMode = useExperienceStore(s => s.setScreenshotMode);
    const setIntroPhase = useExperienceStore(s => s.setIntroPhase);

    const clearUI = () => {
        setShowMemoryModal(false);
        setReadingLetter(false);
        setShowPromiseModal(false);
        setScreenshotMode(false);
    };

    const handleSceneChange = (key: string) => {
        clearUI();

        switch (key) {
            case 'phone':
                setIntroPhase('phone-lock');
                requestSceneTransition('prelude');
                break;
            case 'intro':
                setIntroPhase('completed');
                resetGiftReveal();
                requestSceneTransition('intro');
                break;
            case 'flower':
                requestSceneTransition('flower');
                break;
            case 'memory':
                requestSceneTransition('flower');
                setTimeout(() => setShowMemoryModal(true), 1000);
                break;
            case 'letter':
                requestSceneTransition('flower');
                setTimeout(() => setReadingLetter(true), 1000);
                break;
            case 'chocolate':
                requestSceneTransition('chocolate');
                break;
            case 'promise':
                requestSceneTransition('chocolate');
                setTimeout(() => setShowPromiseModal(true), 1000);
                break;
            case 'ending':
                requestSceneTransition('ending');
                break;
            default:
                if (['prelude', 'climax'].includes(key)) {
                    requestSceneTransition(key as SceneType);
                }
                break;
        }
    };

    return (
        <div className="space-y-5">
            <div className="bg-white/40 rounded-2xl p-4 border border-white/60 shadow-sm">
                <KawaiiSectionTitle icon={Film}>Chương Câu Chuyện</KawaiiSectionTitle>
                <div className="grid grid-cols-2 gap-2">
                    {SCENES.map(s => {
                        let isActive = false;
                        if (s.key === 'phone') isActive = useExperienceStore.getState().introPhase !== 'completed';
                        else if (s.key === 'memory') isActive = showMemoryModal;
                        else if (s.key === 'letter') isActive = isReadingLetter;
                        else if (s.key === 'promise') isActive = showPromiseModal;
                        else isActive = currentScene === s.key && !showMemoryModal && !isReadingLetter && !showPromiseModal && useExperienceStore.getState().introPhase === 'completed';

                        return (
                            <button
                                key={s.key}
                                onClick={() => handleSceneChange(s.key)}
                                className={clsx(
                                    "py-3 px-4 rounded-xl text-xs font-bold capitalize transition-all border shadow-sm flex items-center justify-between group",
                                    isActive
                                        ? "bg-gradient-to-r from-pink-500 to-rose-400 border-transparent text-white shadow-pink-200 shadow-lg transform -translate-y-0.5"
                                        : "bg-white/60 border-white text-slate-500 hover:bg-white hover:text-pink-500 hover:border-pink-200 hover:shadow-md"
                                )}
                            >
                                <span>{s.label}</span>
                                {isActive && <Heart size={10} fill="currentColor" className="animate-pulse" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            <KawaiiEnvironment />
        </div>
    );
};

// --- MAIN PANEL ---

const TABS = [
    { key: 'scene', label: 'Scene', icon: Film },
    { key: 'models', label: 'Items', icon: Box },
    { key: 'layers', label: 'Layers', icon: Layers },
    { key: 'effects', label: 'FX', icon: Sparkles },
    { key: 'perf', label: 'Perf', icon: Settings },
];

export const DebugPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState('scene');
    const toggleDebugPanel = useExperienceStore(s => s.toggleDebugPanel);

    return (
        <div
            onPointerDown={(e) => e.stopPropagation()}
            className="fixed left-4 top-4 z-[9999] w-[350px] max-h-[90vh] flex flex-col font-sans transition-all duration-300 ease-out shadow-2xl rounded-[32px] overflow-hidden border-4 border-white/40 ring-4 ring-pink-100/50 pointer-events-auto"
        >
            {/* Glass Background */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-3xl z-0" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-pink-100/50 to-transparent z-0 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-6 py-5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl shadow-md text-pink-500">
                        <Settings size={20} className="animate-spin-slow" />
                    </div>
                    <div>
                        <h2 className="font-extrabold text-lg text-slate-700 leading-none">Control Panel</h2>
                        <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mt-1">Debug Mode</p>
                    </div>
                </div>
                <button
                    onClick={toggleDebugPanel}
                    className="w-8 h-8 rounded-full bg-white/50 hover:bg-white text-slate-400 hover:text-pink-500 flex items-center justify-center transition-all shadow-sm hover:rotate-90"
                >
                    <X size={20} className="stroke-[3px]" />
                </button>
            </div>

            {/* Tab Bar */}
            <div className="relative z-10 px-4 pb-2 shrink-0">
                <div className="flex gap-2 overflow-x-auto scrollbar-none p-1 bg-slate-100/50 rounded-2xl border border-white/50">
                    {TABS.map(tab => {
                        const TabIcon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={clsx(
                                    "flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-bold transition-all min-w-[50px]",
                                    isActive
                                        ? "bg-white text-pink-500 shadow-md transform scale-105"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-white/40"
                                )}
                            >
                                <TabIcon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent">
                <div className="min-h-full pb-8 animate-in fade-in zoom-in-95 duration-300">
                    {activeTab === 'scene' && <KawaiiSceneTab />}
                    {activeTab === 'models' && <KawaiiModels />}
                    {activeTab === 'layers' && <KawaiiLayers />}
                    {activeTab === 'effects' && <KawaiiEffects />}
                    {activeTab === 'perf' && <KawaiiPerformance />}
                </div>
            </div>

            {/* Cute decorative elements */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl pointer-events-none z-0"></div>
            <div className="absolute top-20 -left-10 w-32 h-32 bg-purple-300/20 rounded-full blur-3xl pointer-events-none z-0"></div>
        </div>
    );
};
