// Application constants for Valentine experience
export const APP_CONSTANTS = {
  // Story phases
  STORY_PHASES: {
    PRELUDE: 'prelude',
    MEMORY: 'memory',
    PROMISE: 'promise',
    ENDING: 'ending'
  } as const,

  // Scene names
  SCENES: {
    PRELUDE: 'prelude',
    MEMORY: 'memory',
    PROMISE: 'promise',
    ENDING: 'ending'
  } as const,

  // Asset paths
  ASSETS: {
    IMAGES: {
      MEMORY_FIRST_MEET: '/memory-first-meet.png',
      MEMORY_TOGETHER: '/memory-together.png',
      PROMISE_HEART: '/promise-heart.png',
      LOADING_BG: '/loading-bg.png'
    }
  },

  // Text content
  CONTENT: {
    MEMORY_MODAL: {
      TITLE: 'Ngày đầu tiên gặp em',
      TEXT_1: 'Anh vẫn nhớ như in khoảnh khắc đầu tiên ánh mắt ta chạm nhau. Tim anh lỡ nhịp, và thế giới dường như ngừng quay.',
      TEXT_2: 'Nụ cười của em mang theo nắng ấm, xua tan mọi băng giá trong lòng anh. Từ giây phút ấy, anh biết mình đã tìm thấy một nửa yêu thương.'
    },

    PROMISE_MODAL: {
      TITLE: 'Lời Hứa Dành Cho Em',
      TEXT_1: 'Anh hứa sẽ luôn ở bên em,',
      TEXT_2: 'qua mọi mùa xuân hoa nở,\nqua mọi mùa đông giá lạnh.',
      TEXT_3: 'Anh hứa sẽ yêu em nhiều hơn mỗi ngày,',
      TEXT_4: 'và biến mỗi khoảnh khắc bên em\ntrở thành điều tuyệt vời nhất.'
    },

    GIFT_REVEAL: {
      STAGE_0: {
        TITLE: 'Một người bạn đặc biệt...',
        DESCRIPTION: 'Đang mang đến món quà cho em',
        BUTTON: 'Gặp người bạn này'
      },
      STAGE_1: {
        TITLE: 'Những kỷ niệm ngọt ngào',
        DESCRIPTION: 'Từng giây phút bên nhau',
        BUTTON: 'Tới đây nào'
      },
      STAGE_2: {
        TITLE: 'Ngọt ngào như em',
        DESCRIPTION: 'Chocolate Valentine dành cho em',
        BUTTON: 'Nhận chocolate'
      }
    }
  },

  // UI Settings
  UI: {
    PARTICLE_COUNT: 12,
    FILTER_PRESETS_COUNT: 5,
    TIMELINE_STEPS: 4,
    MAX_SCREENSHOT_RETRIES: 3
  },

  // Camera settings
  CAMERA_FILTERS: {
    DEFAULT: {
      brightness: 1.0,
      contrast: 1.0,
      saturate: 1.1,
      blur: 0,
      hueRotate: 0
    },
    PRESETS: [
      { name: 'Normal', filters: { brightness: 1.0, contrast: 1.0, saturate: 1.1, blur: 0, hueRotate: 0 } },
      { name: 'Beauty', filters: { brightness: 1.05, contrast: 0.95, saturate: 1.05, blur: 1, hueRotate: 0 } },
      { name: 'Warm', filters: { brightness: 1.05, contrast: 1.05, saturate: 1.2, blur: 0, hueRotate: -10 } },
      { name: 'Cool', filters: { brightness: 1.0, contrast: 1.05, saturate: 0.9, blur: 0, hueRotate: 20 } },
      { name: 'Vintage', filters: { brightness: 1.1, contrast: 0.9, saturate: 0.8, blur: 0.5, hueRotate: -15 } }
    ]
  }
} as const;

// Type definitions
export type StoryPhase = (typeof APP_CONSTANTS.STORY_PHASES)[keyof typeof APP_CONSTANTS.STORY_PHASES];
export type SceneName = (typeof APP_CONSTANTS.SCENES)[keyof typeof APP_CONSTANTS.SCENES];