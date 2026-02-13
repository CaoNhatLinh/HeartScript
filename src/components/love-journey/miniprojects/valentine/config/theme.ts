// Theme configuration for Valentine experience
export const THEME_CONFIG = {
  // Color palette
  COLORS: {
    VALENTINE_DARK: '#1a0e30',
    BACKGROUNDS: {
      GRADIENT_FROM: '#1f1535',
      GRADIENT_VIA: '#2d1b69', 
      GRADIENT_TO: '#1a0e30'
    },
    PINK: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843'
    },
    AMBIENT_LIGHT: '#F8C8DC',
    WHITE_OPACITY: {
      10: 'rgba(255, 255, 255, 0.1)',
      20: 'rgba(255, 255, 255, 0.2)',
      50: 'rgba(255, 255, 255, 0.5)',
      90: 'rgba(255, 255, 255, 0.9)'
    }
  },
  
  // Animation durations
  ANIMATIONS: {
    FAST: 0.2,
    NORMAL: 0.5,
    SLOW: 1.0,
    
    // Spring animations
    SPRING: {
      STIFFNESS: 200,
      DAMPING: 25
    },
    
    // Modal animations
    MODAL: {
      ENTER: 0.6,
      EXIT: 0.4,
      SCALE_INITIAL: 0.8
    }
  },
  
  // Typography
  FONTS: {
    DANCING_SCRIPT: "'Dancing Script', cursive",
    SERIF: 'serif',
    DEFAULT: 'system-ui, sans-serif'
  },
  
  // Spacing scale
  SPACING: {
    XS: '0.25rem', // 4px
    SM: '0.5rem',  // 8px  
    MD: '1rem',    // 16px
    LG: '1.5rem',  // 24px
    XL: '2rem',    // 32px
    XXL: '3rem'    // 48px
  },
  
  // Border radius
  RADIUS: {
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    FULL: '9999px'
  },
  
  // Z-index layers
  Z_INDEX: {
    CANVAS: 0,
    OVERLAY: 10,
    MODAL: 50,
    TOOLTIP: 80,
    MODAL_HIGH: 100
  },
  
  // Responsive breakpoints
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px', 
    LG: '1024px',
    XL: '1280px'
  }
} as const;

// Helper function to get responsive values
export const getResponsiveValue = <T>(mobile: T, desktop: T): T => {
  if (typeof window === 'undefined') return desktop;
  return window.innerWidth < 768 ? mobile : desktop;
};

// Helper for rgba colors with opacity
export const withOpacity = (color: string, opacity: number): string => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};