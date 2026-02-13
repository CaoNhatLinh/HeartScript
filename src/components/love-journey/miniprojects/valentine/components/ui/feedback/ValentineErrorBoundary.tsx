'use client';

import React, { Component, type ReactNode } from 'react';
import { Heart, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    /** What area this boundary protects (for error messages) */
    area?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    isWebGLError: boolean;
}

/**
 * ValentineErrorBoundary — Phase 16
 * Catches Canvas/WebGL/R3F errors and displays a graceful fallback
 * instead of crashing the whole page.
 */
export class ValentineErrorBoundary extends Component<Props, State> {
    state: State = {
        hasError: false,
        error: null,
        isWebGLError: false,
    };

    static getDerivedStateFromError(error: Error): Partial<State> {
        const msg = error.message?.toLowerCase() ?? '';
        const isWebGL = msg.includes('webgl') || msg.includes('canvas') || msg.includes('three')
            || msg.includes('gl_') || msg.includes('context lost');
        return { hasError: true, error, isWebGLError: isWebGL };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error(`[ValentineErrorBoundary] ${this.props.area ?? 'Unknown'}:`, error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, isWebGLError: false });
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950"
                role="alert"
                aria-live="assertive"
            >
                <div className="text-center max-w-md mx-4 p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
                    <div className="flex justify-center mb-6">
                        {this.state.isWebGLError ? (
                            <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20">
                                <AlertTriangle className="w-10 h-10 text-amber-400" />
                            </div>
                        ) : (
                            <div className="p-4 rounded-full bg-pink-500/10 border border-pink-500/20">
                                <Heart className="w-10 h-10 text-pink-400" />
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl font-serif text-white/90 mb-2">
                        {this.state.isWebGLError
                            ? 'Trình duyệt chưa hỗ trợ 3D'
                            : 'Có lỗi xảy ra rồi'}
                    </h2>

                    <p className="text-white/60 text-sm mb-6 leading-relaxed">
                        {this.state.isWebGLError
                            ? 'Thiết bị hoặc trình duyệt của bạn chưa hỗ trợ WebGL. Hãy thử dùng Chrome hoặc Safari phiên bản mới nhất nhé.'
                            : 'Đừng lo lắng, đây chỉ là lỗi kỹ thuật nhỏ. Bạn có thể thử tải lại để tiếp tục trải nghiệm.'}
                    </p>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre className="text-left text-xs text-red-300/60 bg-red-500/5 border border-red-500/10 rounded-lg p-3 mb-6 overflow-auto max-h-32">
                            {this.state.error.message}
                        </pre>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={this.handleRetry}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full text-white/90 text-sm hover:from-pink-500/30 hover:to-purple-500/30 transition-all"
                            aria-label="Thử lại"
                        >
                            <RefreshCw size={16} />
                            <span>Tải lại</span>
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white/60 text-sm hover:bg-white/10 transition-all"
                            aria-label="Tải lại toàn trang"
                        >
                            <span>Tải lại trang</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
