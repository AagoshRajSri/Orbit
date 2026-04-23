/**
 * StarWeave v4 — barrel export.
 * Orbit imports only from here.
 *
 *   import { StarWeaveAuth } from '@/starweave';
 */
export { StarWeaveAuth }        from './components/StarWeaveAuth';
export { audioEngine }          from './audio/audioEngine';
export { useStarWeaveStore }    from './store/useStarWeaveStore';
export { buildCanonicalPattern, buildSecurePattern, MAX_AUTH_STARS, MIN_AUTH_STARS, STAR_EMOJIS } from './engines/gestureEngine';
