// =============================================================================
// index.js — Public API barrel export (Orbit-adjusted paths)
// =============================================================================

export { PixelAvatar, default as PixelAvatarDefault } from './PixelAvatar.jsx';
export { PixelAvatarBadge } from './PixelAvatarBadge.jsx';
export { useAvatarState } from './useAvatarState.js';
export {
  AvatarProvider,
  useAvatarRegistry,
  useUserAvatar,
} from '../../../context/AvatarContext.jsx';
export { PAL, DOG, CAT, BUNNY, FRAME_SETS, ANIMAL_TYPES, AVATAR_STATES } from './sprites.js';
export { getFrame }    from './animation.js';
export { renderFrame } from './renderer.js';
