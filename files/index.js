// =============================================================================
// index.js — Public API barrel export
//
// Import anything from 'pixel-avatar-system' in your project:
//   import { PixelAvatar, PixelAvatarBadge, useAvatarState, AvatarProvider } from './components/PixelAvatar'
// =============================================================================

// Core component
export { PixelAvatar, default as PixelAvatarDefault } from './PixelAvatar/PixelAvatar.jsx';

// Badge (avatar + presence dot + label)
export { PixelAvatarBadge } from './PixelAvatar/PixelAvatarBadge.jsx';

// State machine hook (single-avatar, self-contained)
export { useAvatarState } from './PixelAvatar/useAvatarState.js';

// Global registry context (multi-user)
export {
  AvatarProvider,
  useAvatarRegistry,
  useUserAvatar,
} from '../context/AvatarContext.jsx';

// Chat input pre-wired to avatar state
export { ChatInput } from './ChatInput.jsx';

// Sprite / animation data (if you need to extend)
export { PAL, DOG, CAT, BUNNY, FRAME_SETS, ANIMAL_TYPES, AVATAR_STATES } from './PixelAvatar/sprites.js';
export { getFrame }    from './PixelAvatar/animation.js';
export { renderFrame } from './PixelAvatar/renderer.js';
