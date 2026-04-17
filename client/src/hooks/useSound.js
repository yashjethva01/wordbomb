import { useState, useCallback, useEffect } from 'react';

// ── Module-level shared state ─────────────────────────────────────────────────
// All useSound instances share the same _muted flag and AudioContext so
// toggling mute in any component instantly silences all sounds everywhere.
let _muted    = localStorage.getItem('wb_muted') === 'true';
let _audioCtx = null;

function getCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function playTone(freq, type, gainVal, duration, startDelay = 0) {
  if (_muted) return;
  try {
    const ctx  = getCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type            = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime + startDelay;
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    // Track active oscillator so mute can cut sound immediately.
    _activeOscillators.add(osc);
    const cleanup = () => { _activeOscillators.delete(osc); };
    osc.onended = cleanup;

    osc.start(t);
    osc.stop(t + duration + 0.02);

    // fallback cleanup in case oscillator does not fire onended
    setTimeout(cleanup, (startDelay + duration + 0.1) * 1000);
  } catch (_) { /* AudioContext blocked — safe to ignore */ }
}

// Registry of setter functions so all mounted components re-render on toggle
const _setters = new Set();
const _activeOscillators = new Set();

// ─────────────────────────────────────────────────────────────────────────────

export function useSound() {
  const [muted, _setMuted] = useState(_muted);

  // Register this component's setter so global toggle reaches it;
  // cleanup on unmount to avoid stale sets leaking and causing noise.
  useEffect(() => {
    _setters.add(_setMuted);
    return () => { _setters.delete(_setMuted); };
  }, [_setMuted]);

  const play = useCallback((sound) => {
    // _muted is checked at call time (module-level), never stale
    switch (sound) {
      case 'tick':        playTone(680, 'square',   0.08, 0.07); break;
      case 'tick_urgent': playTone(900, 'square',   0.13, 0.06); break;
      case 'success':
        playTone(523, 'sine', 0.12, 0.12);
        playTone(659, 'sine', 0.10, 0.12, 0.1);
        playTone(784, 'sine', 0.09, 0.20, 0.2);
        break;
      case 'explosion':
        playTone(80,  'sawtooth', 0.35, 0.4);
        playTone(55,  'square',   0.20, 0.6, 0.05);
        playTone(40,  'sine',     0.15, 0.8, 0.1);
        break;
      case 'elimination':
        playTone(440, 'sine', 0.12, 0.2);
        playTone(330, 'sine', 0.10, 0.2, 0.2);
        playTone(220, 'sine', 0.09, 0.35, 0.4);
        break;
      case 'join':
        playTone(440, 'sine', 0.08, 0.1);
        playTone(550, 'sine', 0.07, 0.15, 0.12);
        break;
      case 'error':
        playTone(200, 'square', 0.1, 0.18);
        playTone(160, 'square', 0.1, 0.18, 0.2);
        break;
      default: break;
    }
  }, []);

  const toggleMute = useCallback(() => {
    _muted = !_muted;
    localStorage.setItem('wb_muted', String(_muted));

    // Immediately stop any in-flight tones when muting.
    if (_muted) {
      _activeOscillators.forEach(osc => {
        try { osc.stop(); } catch (_) {}
      });
      _activeOscillators.clear();
      if (_audioCtx && _audioCtx.state === 'running') {
        _audioCtx.suspend().catch(() => {});
      }
    } else {
      if (_audioCtx && _audioCtx.state === 'suspended') {
        _audioCtx.resume().catch(() => {});
      }
    }

    // Update all mounted instances
    _setters.forEach(set => { try { set(_muted); } catch (_) {} });
    return _muted;
  }, []);

  return { play, toggleMute, muted };
}
