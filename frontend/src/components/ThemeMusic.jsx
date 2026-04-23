/**
 * ThemeMusic – Singleton Engine
 *
 * Features:
 * 1. Theme switching with instant crossfade (old fades out, new fades in)
 * 2. Global presence tracking (stays alive across pages)
 * 3. Fade out/resume for Orbit Mode and Spotify Sync
 * 4. Proper play/pause state broadcasting for NowPlayingWidget
 */

import { memo, useEffect } from "react";

const FADE_IN_DURATION = 800;   // Fast fade-in when theme switches
const CROSSFADE_DURATION = 600; // Quick crossfade between themes
const FADE_OUT_DURATION = 600;  // Fade out for Orbit/Spotify

function shuffleCopy(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function parseTrackInfo(filename) {
    const base = filename.replace(/\.[^.]+$/, "");
    const parts = base.split(" - ");
    if (parts.length >= 2) {
        return { title: parts[0].trim(), artist: parts.slice(1).join(" - ").trim() };
    }
    const humanized = base.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");
    return { title: humanized, artist: "Orbit Ambience" };
}

function broadcastState(playing, folder, filename) {
    const { title, artist } = parseTrackInfo(filename);
    window.dispatchEvent(new CustomEvent("orbit:track-change", {
        detail: { folder, filename, title, artist, playing }
    }));
}

function fadeTo(audio, targetVol, durationMs, onComplete) {
    if (!audio) return null;
    const start = audio.volume;
    const diff = targetVol - start;
    const steps = Math.max(1, durationMs / 16);
    let current = 0;
    const id = setInterval(() => {
        current++;
        audio.volume = Math.min(1, Math.max(0, start + diff * (current / steps)));
        if (current >= steps) {
            audio.volume = targetVol;
            clearInterval(id);
            onComplete?.();
        }
    }, 16);
    return id;
}

// ── Singleton Engine ───────────────────────────────────────────────────────
class OrbitMusicEngine {
    constructor() {
        this.folder         = null;
        this.tracks        = [];
        this.queue         = [];
        this.index         = 0;
        this.audio         = null;
        this.vol           = 0.55;
        this.playing       = true;
        this.isMuted       = false; // For Orbit/Spotify fade-out
        this.fadeId        = null;
        this.xfadeTimer    = null;
        this.presenceCount = 0;
        this.inactiveTimer = null;
        this.currentFilename = "";

        document.addEventListener("visibilitychange", () => {
            if (!this.audio || !this.playing || this.isMuted) return;
            if (document.hidden) {
                clearInterval(this.fadeId);
                this.fadeId = fadeTo(this.audio, 0, 1000, () => this.audio?.pause());
            } else {
                this.audio.play().catch(() => {});
                this.fadeId = fadeTo(this.audio, this.vol, 1000);
            }
        });

        window.addEventListener("orbit:toggle-playback", () => {
            if (this.playing) this.pause();
            else this.resume();
        });

        window.addEventListener("orbit:fade-out-for-overlay", () => {
            this.fadeOutForOverlay();
        });

        window.addEventListener("orbit:resume-from-overlay", () => {
            this.resumeFromOverlay();
        });
    }

    load(folder, tracks, vol) {
        this.vol = vol;
        clearTimeout(this.inactiveTimer);

        if (this.folder === folder && this.audio) {
            this._applyVol();
            if (this.audio.paused && this.playing) {
                this.audio.play().catch(() => {});
                fadeTo(this.audio, this.vol, FADE_IN_DURATION);
            }
            return;
        }

        if (this.audio) {
            clearInterval(this.fadeId);
            const oldAudio = this.audio;
            fadeTo(oldAudio, 0, CROSSFADE_DURATION, () => {
                oldAudio.pause();
                oldAudio.src = "";
            });
        }

        this.folder = folder;
        this.tracks = tracks;
        this.queue  = shuffleCopy(tracks);
        this.index  = 0;
        this.isMuted = false;
        this.playing = true;
        this._startTrack(true);
    }

    _startTrack(isInitial = false) {
        const filename = this.queue[this.index % this.queue.length];
        this.currentFilename = filename;

        const audio = new Audio(`/sounds/${this.folder}/${filename}`);
        audio.volume = 0;
        this.audio = audio;

        broadcastState(this.playing && !this.isMuted, this.folder, filename);

        audio.addEventListener("ended", () => this.next());

        audio.addEventListener("loadedmetadata", () => {
            if (!isNaN(audio.duration)) {
                const delay = Math.max(0, (audio.duration - 1.5) * 1000);
                clearTimeout(this.xfadeTimer);
                this.xfadeTimer = setTimeout(() => this.next(), delay);
            }
        });

        const playDelay = isInitial ? 1500 : 0;

        setTimeout(() => {
            if (this.playing && !this.isMuted && this.audio === audio) {
                audio.play()
                    .then(() => {
                        this.fadeId = fadeTo(audio, this.vol, FADE_IN_DURATION);
                    })
                    .catch(() => {
                        const resume = () => {
                            if (this.audio === audio) {
                                audio.play().then(() => {
                                    this.fadeId = fadeTo(audio, this.vol, FADE_IN_DURATION);
                                });
                            }
                            window.removeEventListener("click", resume);
                        };
                        window.addEventListener("click", resume, { once: true });
                    });
            }
        }, playDelay);
    }

    next() {
        this.index++;
        if (this.index >= this.queue.length) {
            this.queue = shuffleCopy(this.tracks);
            this.index = 0;
        }

        const old = this.audio;
        clearInterval(this.fadeId);
        fadeTo(old, 0, CROSSFADE_DURATION, () => { old.pause(); old.src = ""; });

        this._startTrack();
    }

    stop() {
        this.playing = false;
        this.isMuted = false;
        clearInterval(this.fadeId);
        clearTimeout(this.xfadeTimer);
        const audio = this.audio;
        if (audio) {
            fadeTo(audio, 0, 1000, () => {
                audio.pause();
                audio.src = "";
                this.audio = null;
                this.folder = null;
                broadcastState(false, null, "");
            });
        }
    }

    pause() {
        this.playing = false;
        if (this.audio) {
            fadeTo(this.audio, 0, FADE_OUT_DURATION, () => this.audio?.pause());
            broadcastState(false, this.folder, this.currentFilename);
        }
    }

    resume() {
        this.playing = true;
        if (this.audio) {
            this.audio.play().catch(() => {});
            fadeTo(this.audio, this.vol, FADE_IN_DURATION);
            broadcastState(true, this.folder, this.currentFilename);
        }
    }

    fadeOutForOverlay() {
        if (this.isMuted || !this.audio || this.audio.paused) return;
        this.isMuted = true;
        clearInterval(this.fadeId);
        this.fadeId = fadeTo(this.audio, 0, FADE_OUT_DURATION, () => {
            this.audio?.pause();
        });
        broadcastState(false, this.folder, this.currentFilename);
    }

    resumeFromOverlay() {
        if (!this.isMuted || !this.audio) return;
        this.isMuted = false;
        this.playing = true;
        this.audio.play().catch(() => {});
        this.fadeId = fadeTo(this.audio, this.vol, FADE_IN_DURATION);
        broadcastState(true, this.folder, this.currentFilename);
    }

    isCurrentlyPlaying() {
        return this.playing && !this.isMuted && this.audio && !this.audio.paused;
    }

    setVolume(v) {
        this.vol = v;
        this._applyVol();
    }

    _applyVol() {
        if (this.audio && !this.audio.paused) {
            clearInterval(this.fadeId);
            this.fadeId = fadeTo(this.audio, this.vol, 600);
        }
    }

    registerPresence() {
        this.presenceCount++;
        clearTimeout(this.inactiveTimer);
    }

    unregisterPresence() {
        this.presenceCount = Math.max(0, this.presenceCount - 1);
        if (this.presenceCount === 0) {
            this.inactiveTimer = setTimeout(() => {
                this.stop();
            }, 1000);
        }
    }
}

if (!window.__orbitMusicEngine__) {
    window.__orbitMusicEngine__ = new OrbitMusicEngine();
}

const ThemeMusic = memo(({ folder, tracks, isPlaying = true, volume = 55 }) => {
    const engine = window.__orbitMusicEngine__;
    const v = Math.min(1, Math.max(0, volume / 100));

    useEffect(() => {
        engine.registerPresence();
        engine.load(folder, tracks, v);
        return () => engine.unregisterPresence();
    }, [folder]);

    useEffect(() => {
        if (isPlaying) engine.resume();
        else engine.pause();
    }, [isPlaying]);

    useEffect(() => {
        engine.setVolume(v);
    }, [volume]);

    return null;
});

ThemeMusic.displayName = "ThemeMusic";
export default ThemeMusic;
