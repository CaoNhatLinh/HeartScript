// Debug component để phát hiện flash trắng
import React, { useEffect } from 'react';
import { useExperienceStore } from '../../../store/useExperienceStore';

export const FlashDebugger: React.FC = () => {
    const currentScene = useExperienceStore(s => s.currentScene);
    const bloomProgress = useExperienceStore(s => s.bloomProgress);
    const showMemoryModal = useExperienceStore(s => s.showMemoryModal);
    const transitionState = useExperienceStore(s => s.transitionState);
    const isReadingLetter = useExperienceStore(s => s.isReadingLetter);

    useEffect(() => {
        console.log('🔍 DEBUG STATE CHANGE:', {
            currentScene,
            bloomProgress: bloomProgress.toFixed(2),
            showMemoryModal,
            transitionState,
            isReadingLetter,
            timestamp: Date.now()
        });
    }, [currentScene, bloomProgress, showMemoryModal, transitionState, isReadingLetter]);

    // Detect any white/bright elements
    useEffect(() => {
        const checkInterval = setInterval(() => {
            // Check if there's any full-screen white element
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const computed = window.getComputedStyle(el);
                const bgColor = computed.backgroundColor;

                // Check for white/bright backgrounds
                if (bgColor.includes('255, 255, 255') || bgColor.includes('rgb(255, 255, 255)')) {
                    const rect = el.getBoundingClientRect();
                    // If element covers most of the screen
                    if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8) {
                        console.warn('⚠️ WHITE ELEMENT DETECTED:', {
                            element: el.tagName,
                            className: el.className,
                            id: el.id,
                            bgColor,
                            zIndex: computed.zIndex,
                            position: computed.position
                        });
                    }
                }
            });
        }, 100);

        return () => clearInterval(checkInterval);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 10,
            right: 10,
            background: 'rgba(0,0,0,0.8)',
            color: '#0f0',
            padding: '10px',
            fontSize: '10px',
            fontFamily: 'monospace',
            zIndex: 99999,
            pointerEvents: 'none',
            maxWidth: '300px'
        }}>
            <div>Scene: {currentScene}</div>
            <div>Bloom: {(bloomProgress * 100).toFixed(0)}%</div>
            <div>Modal: {showMemoryModal ? 'OPEN' : 'closed'}</div>
            <div>Transition: {transitionState}</div>
            <div>Reading: {isReadingLetter ? 'YES' : 'no'}</div>
        </div>
    );
};
