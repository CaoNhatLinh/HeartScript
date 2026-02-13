// Config for Valentine experience performance settings
export const PERFORMANCE_CONFIG = {
  // Render settings by performance level
  PERFORMANCE_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium', 
    HIGH: 'high'
  },
  
  // Shadow map sizes by performance
  SHADOW_MAP_SIZE: {
    LOW: [256, 256],
    MEDIUM: [512, 512],
    HIGH: [1024, 1024]
  },
  
  // DPR (Device Pixel Ratio) settings
  DPR_SETTINGS: {
    MOBILE: [0.5, 1],
    DESKTOP: [1, 2]
  },
  
  // Effects quality
  EFFECTS: {
    ENABLE_POST_PROCESSING: {
      LOW: false,
      MEDIUM: true,
      HIGH: true
    },
    MULTISAMPLING: {
      LOW: 0,
      MEDIUM: 2,
      HIGH: 4
    }
  },
  
  // Camera settings
  CAMERA: {
    DEFAULT_SIZE: {
      MOBILE: { width: 160, height: 120 },
      DESKTOP: { width: 240, height: 180 }
    },
    EXPANDED_SIZE: {
      MOBILE: { width: 240, height: 180 },
      DESKTOP: { width: 320, height: 240 }
    },
    MIN_SIZE: { width: 160, height: 120 },
    MAX_SIZE: { width: 640, height: 480 }
  }
} as const;

// Auto detect performance level based on device
export const detectPerformanceLevel = (): keyof typeof PERFORMANCE_CONFIG.PERFORMANCE_LEVELS => {
  if (typeof window === 'undefined') return 'MEDIUM';
  
  const { deviceMemory, hardwareConcurrency } = navigator as any;
  const isMobile = window.innerWidth < 768;
  
  // Low-end device detection
  if (isMobile && (deviceMemory < 4 || hardwareConcurrency < 4)) return 'LOW';
  
  // High-end device detection  
  if (!isMobile && deviceMemory >= 8 && hardwareConcurrency >= 8) return 'HIGH';
  
  // Default to medium
  return 'MEDIUM';
};