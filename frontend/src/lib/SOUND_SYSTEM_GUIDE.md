/\*\*

- SOUND SYSTEM IMPLEMENTATION GUIDE
-
- Centralized, low-latency audio system for Orbit Chat Application
-
- ============================================================================
- OVERVIEW
- ============================================================================
-
- The sound system provides a consistent, responsive auditory feedback layer
- across the application. It uses preloaded audio assets for instant playback
- with minimal latency.
-
- Core Components:
- 1.  SoundManager (/lib/SoundManager.js) - Core logic
- 2.  useSoundManager (/hooks/useSoundManager.js) - React integration
- 3.  SoundSettings (/components/SoundSettings.jsx) - User controls
-
- ============================================================================
- ARCHITECTURE
- ============================================================================
-
- ┌─────────────────────────────────────────────────────────────────────┐
- │ SoundManager (Singleton) │
- ├─────────────────────────────────────────────────────────────────────┤
- │ │
- │ • Preloaded Audio Assets: click.wav, notification.wav │
- │ • Global Volume Control: 0.0 - 1.0 (default: 0.3) │
- │ • Debounce System: 100ms to prevent overlapping │
- │ • localStorage Persistence: Remembers user preferences │
- │ │
- │ Public Methods: │
- │ - play(soundName, options) - Trigger sound playback │
- │ - toggle() - Enable/disable all sounds │
- │ - setVolume(volume) - Set global volume level │
- │ - stopAll() - Stop all currently playing sounds │
- │ │
- └─────────────────────────────────────────────────────────────────────┘
-
- ============================================================================
- USAGE
- ============================================================================
-
- ### Basic Usage in Components
-
- ```jsx

  ```
- import { useSoundManager } from '../hooks/useSoundManager';
-
- export function MyComponent() {
- const { play, toggle, isEnabled } = useSoundManager();
-
- const handleClick = () => {
-     play('click');
- };
-
- const handleNotification = () => {
-     play('notification');
- };
-
- return (
-     <>
-       <button onClick={handleClick}>Click Me</button>
-       <button onClick={handleNotification}>Get Notified</button>
-       <button onClick={toggle}>
-         {isEnabled ? 'Mute' : 'Unmute'}
-       </button>
-     </>
- );
- }
- ```

  ```
-
- ### Direct SoundManager Access
-
- For direct access without React:
-
- ```javascript

  ```
- import { soundManager } from '../lib/SoundManager';
-
- soundManager.play('click');
- soundManager.setVolume(0.5);
- soundManager.toggle();
- ```

  ```
-
- ============================================================================
- INTEGRATED LOCATIONS
- ============================================================================
-
- Click Sounds (\"click\"):
- ✓ LoginPage - Sign In button & Password visibility toggle
- ✓ SignUpPage - Create Account button & Password visibility toggle
- ✓ ConstellationSignupPage - Pattern completion
- ✓ ConstellationLoginPage - Pattern verification
- ✓ OrbitalHeader - Settings, Profile, Logout buttons
-
- Notification Sounds (\"notification\"):
- ⚠ TODO: Integrate with incoming message detection
- ⚠ TODO: Integrate with system alerts
- ⚠ TODO: Integrate with user notifications
-
- ============================================================================
- SOUND ASSET REQUIREMENTS
- ============================================================================
-
- Audio files must be placed in: /public/sounds/
-
- Required Files:
- 1.  click.wav
- - Duration: <150ms
- - Format: WAV or MP3 for broad compatibility
- - Volume: Subtle feedback (-20dB to -12dB recommended)
- - Characteristics: Short, crisp, non-intrusive
-
- 2.  notification.wav
- - Duration: <300ms
- - Format: WAV or MP3
- - Volume: Noticeable but not alarming (-15dB to -8dB recommended)
- - Characteristics: Melodic, distinctly different from click
-
- ============================================================================
- BROWSER COMPATIBILITY & RESTRICTIONS
- ============================================================================
-
- Autoplay Policy:
- - Modern browsers (Chrome, Firefox, Safari, Edge) restrict autoplay
- - Sounds require user interaction to trigger on first load
- - SoundManager handles promise rejection gracefully
- - Subsequent plays after first user interaction work without restriction
-
- Supported Formats:
- - Chrome/Edge: MP3, WAV, WebM, Opus
- - Firefox: MP3, WAV, Opus, WebM
- - Safari: MP3, WAV, AAC
- - Recommendation: Use MP3 for maximum compatibility
-
- ============================================================================
- PERFORMANCE CONSIDERATIONS
- ============================================================================
-
- Memory:
- - All sounds preloaded at app initialization (~200KB typical)
- - Single instance pattern prevents memory leaks
- - HTML5 Audio API manages playback efficiently
-
- CPU:
- - Minimal CPU overhead (native browser audio handling)
- - No additional libraries or polyfills required
- - Debounce system prevents excessive redraws or processing
-
- Network:
- - Sounds cached in browser after first load
- - PNG/WebP may be precompressed (check server headers)
- - No additional network calls during playback
-
- ============================================================================
- CONFIGURATION & CUSTOMIZATION
- ============================================================================
-
- ### Global Volume
-
- Update in SoundManager.js:
- ```javascript

  ```
- this.globalVolume = 0.3; // Range: 0.0 - 1.0 (default: 0.3)
- ```

  ```
-
- ### Debounce Delay
-
- Prevent rapid overlapping sounds:
- ```javascript

  ```
- this.debounceDelay = 100; // milliseconds (default: 100ms)
- ```

  ```
-
- ### Adding New Sounds
-
- 1.  Add audio file to /public/sounds/
- 2.  Register in init() method:
- ```javascript

  ```
- const soundAssets = [
-      { name: \"click\", path: \"/sounds/click.wav\" },
-      { name: \"notification\", path: \"/sounds/notification.wav\" },
-      { name: \"success\", path: \"/sounds/success.wav\" }, // NEW
- ];
- ```

  ```
- 3.  Use in components:
- ```javascript

  ```
- play('success');
- ```

  ```
-
- ============================================================================
- BEST PRACTICES
- ============================================================================
-
- ✓ DO:
- - Play on button clicks, form submissions, important actions
- - Provide user toggle to enable/disable sounds
- - Keep sounds short and subtle
- - Debounce rapid actions to prevent sound spam
- - Test with accessibility tools (hearing-impaired users)
-
- ✗ DON'T:
- - Play on mouse hover
- - Play on passive events (scrolling, resizing)
- - Autoplay sounds without user interaction
- - Create custom Audio instances (use SoundManager)
- - Play long or looping sounds
-
- ============================================================================
- DEBUGGING
- ============================================================================
-
- Check if sounds are enabled:
- ```javascript

  ```
- soundManager.isEnabledGlobally()
- ```

  ```
-
- Manually test sounds:
- ```javascript

  ```
- import { soundManager } from './lib/SoundManager';
- soundManager.play('click');
- soundManager.play('notification');
- ```

  ```
-
- View localStorage preference:
- ```javascript

  ```
- localStorage.getItem('soundManagerEnabled')
- ```

  ```
-
- Check preloaded sounds:
- ```javascript

  ```
- soundManager.sounds // Object with all preloaded Audio elements
- ```

  ```
-
- ============================================================================
- FUTURE ENHANCEMENTS
- ============================================================================
-
- - [ ] Sound settings integrated into SettingsPage
- - [ ] Per-sound volume controls
- - [ ] Sound effect presets (minimal, standard, immersive)
- - [ ] Analytics tracking for sound interaction
- - [ ] Haptic feedback integration (mobile)
- - [ ] A/B testing different sound assets
- - [ ] Context-aware volume normalization
- - [ ] Sound for user mention notifications
- - [ ] Success/error sound variations
- - [ ] Background music/ambient sound option\n _ \n _/\n\nexport const SOUND_SYSTEM_DOCS = {};\n
