import React from 'react';
import { useExperienceStore } from '../../store/useExperienceStore';
import type { LayerKey } from '../../store/useExperienceStore';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PerformanceControls } from './PerformanceControls';

// Type declaration for Vite's import.meta.glob
declare global {
  interface ImportMeta {
    glob: (pattern: string, options?: { eager?: boolean; import?: string }) => Record<string, any>;
  }
}

// NOTE: DebugPanel uses Vite import.meta.glob; ensure new images in /src/assets/img are picked up in dev.

// Helper Slider Component
const Slider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
    <div className="mb-1">
        <div className="flex justify-between text-xs text-white/70 mb-0.5">
            <span>{label}</span>
            <span>{value?.toFixed(3) ?? value}</span>
        </div>
        <input
            type="range"
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            min={min} max={max} step={step}
            value={value || 0}
            onChange={(e) => onChange(Number(e.target.value))}
        />
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; color?: string }> = ({ title, children, color = "text-white/90" }) => (
    <div className="mb-4 bg-black/20 p-3 rounded-lg border border-white/5">
        <h3 className={`font-semibold text-xs uppercase tracking-wider mb-2 ${color} border-b border-white/5 pb-1`}>{title}</h3>
        {children}
    </div>
);

// Background Section Component
const BackgroundSection: React.FC = () => {
    const bgConfig = useExperienceStore(s => s.backgroundConfig);
    const setBgConfig = useExperienceStore(s => s.setBackgroundConfig);

    const presets = [
        { name: 'Aurora', start: '#1a0a2e', mid: '#2d1b4e', end: '#0f0a1e', style: 'aurora' as const },
        { name: 'Sunset', start: '#1a0a1e', mid: '#4a1942', end: '#2d1b3d', style: 'radial' as const },
        { name: 'Ocean', start: '#0a1628', mid: '#1a2b4a', end: '#0f1a2e', style: 'linear' as const },
        { name: 'Rose', start: '#2a0a1e', mid: '#3d1a2d', end: '#1a0a12', style: 'radial' as const },
        { name: 'Midnight', start: '#0a0a1a', mid: '#1a1a2e', end: '#050510', style: 'aurora' as const },
    ];

    return (
        <Section title="Background" color="text-cyan-300">
            {/* Presets */}
            <div className="mb-3">
                <div className="text-[10px] text-white/50 mb-1.5 uppercase">Presets</div>
                <div className="flex flex-wrap gap-1.5">
                    {presets.map(p => (
                        <button
                            key={p.name}
                            onClick={() => setBgConfig({ gradientStart: p.start, gradientMid: p.mid, gradientEnd: p.end, style: p.style })}
                            className="px-2 py-1 text-[10px] rounded bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                            style={{
                                background: `linear-gradient(135deg, ${p.start}, ${p.mid}, ${p.end})`,
                                color: 'white'
                            }}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Style */}
            <div className="mb-3">
                <div className="text-[10px] text-white/50 mb-1.5 uppercase">Style</div>
                <div className="flex gap-1">
                    {(['radial', 'linear', 'aurora'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setBgConfig({ style: s })}
                            className={`px-2 py-1 text-xs rounded capitalize ${bgConfig.style === s ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/5 text-white/60'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <div className="text-[10px] text-white/50 mb-1">Start</div>
                    <input
                        type="color"
                        value={bgConfig.gradientStart}
                        onChange={(e) => setBgConfig({ gradientStart: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer border border-white/10"
                    />
                </div>
                <div>
                    <div className="text-[10px] text-white/50 mb-1">Mid</div>
                    <input
                        type="color"
                        value={bgConfig.gradientMid}
                        onChange={(e) => setBgConfig({ gradientMid: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer border border-white/10"
                    />
                </div>
                <div>
                    <div className="text-[10px] text-white/50 mb-1">End</div>
                    <input
                        type="color"
                        value={bgConfig.gradientEnd}
                        onChange={(e) => setBgConfig({ gradientEnd: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer border border-white/10"
                    />
                </div>
            </div>
        </Section>
    );
};

// --- HELPERS ---
type ModelKey = 'rose' | 'envelope' | 'photo' | 'chocolate' | 'mascot';
const TransformGroup = ({ label, modelKey }: { label: string, modelKey: ModelKey }) => {
    const transforms = useExperienceStore(s => s.modelTransforms);
    const setTransform = useExperienceStore(s => s.setModelTransform);

    // Visibility integration
    const visibleModels = useExperienceStore(s => s.visibleModels);
    const toggleVisibility = useExperienceStore(s => s.toggleModelVisibility);
    const isVisible = visibleModels[modelKey] ?? true;

    const [expanded, setExpanded] = React.useState(false);

    // Safe access
    const data = transforms[modelKey];
    if (!data) return null;

    return (
        <div className={`mb-2 rounded border overflow-hidden transition-colors ${isVisible ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-70 hover:opacity-100'}`}>
            <div className="w-full flex justify-between items-center p-2">
                {/* VISIBILITY TOGGLE (INTEGRATED) */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        className="accent-pink-500 w-4 h-4 cursor-pointer"
                        checked={isVisible}
                        onChange={() => toggleVisibility(modelKey)}
                    />
                    <button onClick={() => setExpanded(!expanded)} className="text-xs uppercase tracking-wider font-semibold text-pink-300 text-left hover:text-pink-200 transition-colors">
                        {label}
                    </button>
                </div>

                {/* EXPAND BUTTON */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white"
                >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {expanded && (
                <div className="p-2 space-y-3 border-t border-white/5 bg-black/20">
                    {/* POSITION */}
                    <div>
                        <div className="text-[10px] text-white/50 mb-1 uppercase">Position</div>
                        <Slider label="X" value={data.position[0]} min={-5} max={5} step={0.1} onChange={(v) => { const n = [...data.position]; n[0] = v; setTransform(modelKey, 'position', n); }} />
                        <Slider label="Y" value={data.position[1]} min={-5} max={5} step={0.1} onChange={(v) => { const n = [...data.position]; n[1] = v; setTransform(modelKey, 'position', n); }} />
                        <Slider label="Z" value={data.position[2]} min={-5} max={5} step={0.1} onChange={(v) => { const n = [...data.position]; n[2] = v; setTransform(modelKey, 'position', n); }} />
                    </div>

                    {/* ROTATION */}
                    <div>
                        <div className="text-[10px] text-white/50 mb-1 uppercase">Rotation</div>
                        <Slider label="X" value={data.rotation[0]} min={-Math.PI} max={Math.PI} step={0.1} onChange={(v) => { const n = [...data.rotation]; n[0] = v; setTransform(modelKey, 'rotation', n); }} />
                        <Slider label="Y" value={data.rotation[1]} min={-Math.PI} max={Math.PI} step={0.1} onChange={(v) => { const n = [...data.rotation]; n[1] = v; setTransform(modelKey, 'rotation', n); }} />
                        <Slider label="Z" value={data.rotation[2]} min={-Math.PI} max={Math.PI} step={0.1} onChange={(v) => { const n = [...data.rotation]; n[2] = v; setTransform(modelKey, 'rotation', n); }} />
                    </div>

                    {/* SCALE */}
                    <div>
                        <div className="text-[10px] text-white/50 mb-1 uppercase">Scale</div>
                        <Slider label="S" value={data.scale} min={0.1} max={5} step={0.1} onChange={(v) => setTransform(modelKey, 'scale', v)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export const DebugPanel: React.FC = () => {
    const layers = useExperienceStore((s) => s.activeLayers);
    const toggle = useExperienceStore((s) => s.toggleLayer);
    const requestSceneTransition = useExperienceStore((s) => s.requestSceneTransition);

    const params = useExperienceStore((s) => s.layerParams);
    const setParam = useExperienceStore((s) => s.setLayerParam);

    // Gather image list for memory photo info
    const imageList = ['/valentine/img/anh1.png', '/valentine/img/anh2.png', '/valentine/img/anh3.png', '/valentine/img/anh4.png', '/valentine/img/anh5.png'];
    const refreshImages = () => window.location.reload();

    return (
        <div className="pointer-events-auto absolute left-6 top-6 z-60 bg-black/60 backdrop-blur-md rounded-xl p-4 text-sm text-white/90 max-h-[85vh] overflow-y-auto w-80 shadow-2xl border border-white/10 scrollbar-thin scrollbar-thumb-white/20">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg text-pink-400">Debug Panel</h2>
                <div className="text-xs text-white/50">v1.1</div>
            </div>

            {/* --- SCENE --- */}
            <Section title="Scene Transition">
                <div className="grid grid-cols-3 gap-2">
                    {(['intro', 'flower', 'climax'] as const).map(s => (
                        <button key={s} onClick={() => requestSceneTransition(s)} className="px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs capitalize transition-colors">
                            {s}
                        </button>
                    ))}
                    {(['chocolate', 'ending'] as const).map(s => (
                        <button key={s} onClick={() => requestSceneTransition(s)} className="px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs capitalize transition-colors">
                            {s}
                        </button>
                    ))}
                </div>
            </Section>

            {/* --- PERFORMANCE --- */}
            <Section title="Performance">
                <PerformanceControls />
            </Section>

            {/* --- MODELS & TRANSFORMS --- */}
            <Section title="Models & Layout">
                <div className="text-[10px] text-white/50 mb-2 uppercase pt-2">Fine Tuning</div>
                <TransformGroup label="Mascot (Cam & Dâu)" modelKey="mascot" />
                <TransformGroup label="Rose (Hoa)" modelKey="rose" />
                <TransformGroup label="Envelope (Thư)" modelKey="envelope" />
                <TransformGroup label="Chocolate (Kẹo)" modelKey="chocolate" />
                <TransformGroup label="Photos (Ảnh)" modelKey="photo" />
            </Section>

            {/* --- LAYERS --- */}
            <Section title="Active Layers">
                <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(layers) as LayerKey[]).map((k) => (
                        <label key={k} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                            <input
                                type="checkbox"
                                className="accent-cyan-500"
                                checked={layers[k]}
                                onChange={() => toggle(k)}
                            />
                            <span className="capitalize text-xs">
                                {k === 'letter' ? 'Gift Letter' : k === 'floatingWords' ? 'Flying Letters' : k}
                            </span>
                        </label>
                    ))}
                </div>
            </Section>

            {/* --- FLOATING WORDS --- */}
            <Section title="Flying Letters" color="text-pink-300">
                <div className="space-y-2">
                    <Slider label="Max Count" value={params.floatingWordsCount} min={1} max={50} step={1} onChange={(v) => setParam('floatingWordsCount', v)} />
                    <Slider label="Speed" value={params.floatingWordsSpeed} min={0.1} max={3} step={0.1} onChange={(v) => setParam('floatingWordsSpeed', v)} />
                    <Slider label="Opacity" value={params.floatingWordsOpacity} min={0.1} max={1} step={0.05} onChange={(v) => setParam('floatingWordsOpacity', v)} />
                    <Slider label="Size Scale" value={params.floatingWordsSize} min={0.5} max={3} step={0.1} onChange={(v) => setParam('floatingWordsSize', v)} />

                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/70">Text Color</span>
                        <input
                            type="color"
                            className="w-12 h-6 bg-transparent border-none cursor-pointer"
                            value={params.floatingWordsColor}
                            onChange={(e) => setParam('floatingWordsColor', e.target.value)}
                        />
                    </div>

                    <div className="mt-2">
                        <div className="text-[10px] text-white/50 mb-1 uppercase">Word List (Comma separated)</div>
                        <textarea
                            className="w-full bg-black/40 border border-white/10 rounded p-1 text-[10px] text-white/80 h-20 focus:outline-none focus:border-pink-500/50"
                            value={useExperienceStore.getState().floatingWordsList.join(', ')}
                            onChange={(e) => useExperienceStore.getState().setFloatingWordsList(e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0))}
                        />
                    </div>
                </div>
            </Section>

            {/* --- FLOATING HEARTS --- */}
            <Section title="Floating Hearts" color="text-red-400">
                <Slider label="Count" value={params.heartCount || 50} min={0} max={200} step={10} onChange={(v) => setParam('heartCount', v)} />
                <Slider label="Speed Multiplier" value={params.heartSpeed || 1} min={0.1} max={5} step={0.1} onChange={(v) => setParam('heartSpeed', v)} />
            </Section>

            {/* --- WEATHER Environment --- */}
            <Section title="Environment & Weather">
                <div className="space-y-3">
                    <div>
                        <div className="text-xs text-blue-300 mb-1">Rain</div>
                        <Slider label="Count" value={params.rainCount} min={0} max={1000} step={50} onChange={(v) => setParam('rainCount', v)} />
                        <Slider label="Opacity" value={params.rainOpacity} min={0} max={1} step={0.1} onChange={(v) => setParam('rainOpacity', v)} />
                    </div>
                    <div>
                        <div className="text-xs text-yellow-300 mb-1">Meteors</div>
                        <Slider label="Count" value={params.meteorCount} min={0} max={100} step={5} onChange={(v) => setParam('meteorCount', v)} />
                        <Slider label="Speed" value={params.meteorSpeed} min={0.001} max={0.05} step={0.001} onChange={(v) => setParam('meteorSpeed', v)} />
                        <Slider label="Angle" value={params.meteorAngle} min={-1.5} max={1.5} step={0.1} onChange={(v) => setParam('meteorAngle', v)} />
                    </div>
                    <div>
                        <div className="text-xs text-green-300 mb-1">Wind</div>
                        <Slider label="Speed" value={params.windSpeed} min={0} max={5} step={0.1} onChange={(v) => setParam('windSpeed', v)} />
                        <Slider label="Angle" value={params.windAngle} min={0} max={360} step={5} onChange={(v) => setParam('windAngle', v)} />
                        <Slider label="Intensity" value={params.windIntensity} min={0} max={2} step={0.1} onChange={(v) => setParam('windIntensity', v)} />
                    </div>
                </div>
            </Section>

            {/* --- POST PROCESS --- */}
            <Section title="Post Processing" color="text-purple-400">
                <Slider label="Bloom Intensity" value={params.bloomIntensity} min={0} max={3} step={0.1} onChange={(v) => setParam('bloomIntensity', v)} />
                <Slider label="Film Grain" value={params.filmGrainIntensity} min={0} max={0.15} step={0.005} onChange={(v) => setParam('filmGrainIntensity', v)} />
                <Slider label="Vignette" value={params.vignetteDarkness} min={0.5} max={1.5} step={0.05} onChange={(v) => setParam('vignetteDarkness', v)} />
                <Slider label="Chroma Offset" value={params.chromaOffset} min={0} max={0.02} step={0.001} onChange={(v) => setParam('chromaOffset', v)} />
            </Section>

            {/* --- LIGHTING --- */}
            <Section title="Lighting & Color" color="text-amber-400">
                <Slider label="Ambient" value={params.ambientIntensity} min={0} max={2} step={0.05} onChange={(v) => setParam('ambientIntensity', v)} />
                <Slider label="Environment" value={params.envIntensity} min={0} max={5} step={0.1} onChange={(v) => setParam('envIntensity', v)} />
                <Slider label="Env Rotation" value={params.envRotation} min={0} max={6.28} step={0.1} onChange={(v) => setParam('envRotation', v)} />
                <div className="border-t border-white/10 my-2 pt-2">
                    <div className="text-[10px] text-orange-300 mb-1 uppercase">Sunset / Golden Hour</div>
                    <Slider label="Intensity" value={params.sunsetIntensity} min={0} max={2} step={0.1} onChange={(v) => setParam('sunsetIntensity', v)} />
                    <Slider label="Angle" value={params.sunsetAngle} min={0} max={90} step={5} onChange={(v) => setParam('sunsetAngle', v)} />
                    <Slider label="Warmth" value={params.warmth} min={0} max={1} step={0.1} onChange={(v) => setParam('warmth', v)} />
                </div>
                <div className="border-t border-white/10 my-2"></div>
                <Slider label="Brightness" value={params.brightness} min={-0.5} max={0.5} step={0.01} onChange={(v) => setParam('brightness', v)} />
                <Slider label="Contrast" value={params.contrast} min={-0.5} max={0.5} step={0.01} onChange={(v) => setParam('contrast', v)} />
                <Slider label="Saturation" value={params.saturation} min={-1} max={1} step={0.05} onChange={(v) => setParam('saturation', v)} />
            </Section>

            {/* --- BACKGROUND --- */}
            <BackgroundSection />

            {/* --- PHOTOS --- */}
            <Section title="Assets info">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-white/60">Photos loaded: {imageList.length}</span>
                    <button onClick={refreshImages} className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20">Refresh</button>
                </div>
            </Section>

            <div className="h-6"></div>
        </div>
    );
};
