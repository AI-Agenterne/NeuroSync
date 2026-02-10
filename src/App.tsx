import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from 'react';
import {
  Shield,
  Zap,
  Activity,
  Heart,
  AlertTriangle,
  Lock,
  Sparkles,
  Brain,
  ChevronRight,
  Volume2,
  VolumeX,
  Volume1,
  Target,
} from 'lucide-react';

/**
 * NeuroSync v2.1 — "Neural Guidance System" + Volume Control
 */

// ─── CONSTANTS ──────────────────────────────────────────────
const BASELINE_RMSSD = 45;
const POLLING_RATE_MS = 2000;
const THRESHOLDS = { GREEN: 0.7, YELLOW: 0.5, RED: 0.3, CONSECUTIVE_ORANGE: 2 };

const MODE_TIPS = {
  focus: [
    'Entraining Gamma waves (40Hz) to bind cognitive processes.',
    'Synchronizing auditory and visual cortex for peak attention.',
    'Research suggests 40Hz flicker may reduce amyloid load.',
    'Step away from distractions; let the pulse guide your focus.',
  ],
  shield: [
    'Alpha waves (8-12Hz) bridge the conscious and subconscious.',
    'Reducing cortisol levels through rhythmic entrainment.',
    'Brown noise deposits energy where speech frequencies live.',
    'Inhibitory gating strengthens — filtering out the irrelevant.',
  ],
  connect: [
    'Engaging 528Hz Solfeggio frequency for stress reduction.',
    'Oxytocin upregulation primes pro-social connection.',
    'Breathe deeply. Allow the nervous system to reset.',
    'Cortisol suppression measurable within 5 minutes of exposure.',
  ],
  recovery: [
    'Slowing cortical rhythm to Alpha for autonomic recovery.',
    'Restoring vagal tone through parasympathetic reactivation.',
    'Deep entrainment promotes cellular regeneration.',
    'Your body requested this pause. Honor the signal.',
  ],
  deep_work: [
    '15Hz Beta stimulation sustains focus and sharpens attention for ADHD-friendly concentration.',
    'Pink noise masking suppresses open-office distractions while maintaining task-positive engagement.',
    'SMR isochronic entrainment anchors motor and attentional centers, reducing hyperactivity.',
    'Task-positive networks override default mode, silencing mind-wandering and rumination.',
  ],
};

const MODE_CONFIG = {
  OVERCLOCK: {
    key: 'focus',
    label: 'OVERCLOCK',
    subtitle: 'Gamma Protocol (40Hz)',
    description: 'High-Performance Cognition',
    icon: Zap,
    color: '#00E5FF',
    colorDim: 'rgba(0,229,255,0.15)',
    glowShadow: '0 0 30px rgba(0,229,255,0.25), 0 0 60px rgba(0,229,255,0.08)',
    borderGlow: 'rgba(0,229,255,0.5)',
    bgTint: 'rgba(0,229,255,0.03)',
  },
  SHIELD: {
    key: 'shield',
    label: 'SHIELD',
    subtitle: 'Alpha Flow (10Hz)',
    description: 'Sensory Gating & Noise Isolation',
    icon: Shield,
    color: '#818CF8',
    colorDim: 'rgba(129,140,248,0.15)',
    glowShadow:
      '0 0 30px rgba(129,140,248,0.25), 0 0 60px rgba(129,140,248,0.08)',
    borderGlow: 'rgba(129,140,248,0.5)',
    bgTint: 'rgba(129,140,248,0.03)',
  },
  CONNECT: {
    key: 'connect',
    label: 'CONNECT',
    subtitle: 'Solfeggio 528Hz',
    description: 'Empathy Priming & Stress Relief',
    icon: Sparkles,
    color: '#34D399',
    colorDim: 'rgba(52,211,153,0.15)',
    glowShadow:
      '0 0 30px rgba(52,211,153,0.25), 0 0 60px rgba(52,211,153,0.08)',
    borderGlow: 'rgba(52,211,153,0.5)',
    bgTint: 'rgba(52,211,153,0.03)',
  },
  RECOVERY: {
    key: 'recovery',
    label: 'RECOVERY',
    subtitle: 'Alpha Reset (10Hz)',
    description: 'Autonomic Restoration',
    icon: Heart,
    color: '#F97316',
    colorDim: 'rgba(249,115,22,0.15)',
    glowShadow:
      '0 0 30px rgba(249,115,22,0.25), 0 0 60px rgba(249,115,22,0.08)',
    borderGlow: 'rgba(249,115,22,0.5)',
    bgTint: 'rgba(249,115,22,0.05)',
  },
  DEEP_WORK: {
    key: 'deep_work',
    label: 'DEEP WORK',
    subtitle: '15Hz Beta + Noise Block',
    description: 'ADHD Focus in Noisy Spaces',
    icon: Target,
    color: '#14B8A6',
    colorDim: 'rgba(20,184,166,0.15)',
    glowShadow:
      '0 0 30px rgba(20,184,166,0.25), 0 0 60px rgba(20,184,166,0.08)',
    borderGlow: 'rgba(20,184,166,0.5)',
    bgTint: 'rgba(20,184,166,0.03)',
  },
};

// ─── GLOBAL STYLES ──────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* Custom Range Slider Styling */
    input[type=range] {
      -webkit-appearance: none;
      width: 100%;
      background: transparent;
      height: 24px;
      cursor: pointer;
    }
    input[type=range]:focus { outline: none; }
    
    /* Thumb */
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 12px;
      width: 12px;
      border-radius: 50%;
      background: #fff;
      margin-top: -5px; /* Centers thumb on track */
      box-shadow: 0 0 10px rgba(255,255,255,0.5);
      transition: transform 0.1s;
    }
    input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.2); }
    
    /* Track */
    input[type=range]::-webkit-slider-runnable-track {
      width: 100%;
      height: 2px;
      cursor: pointer;
      background: rgba(255,255,255,0.15);
      border-radius: 1px;
    }

    @keyframes breathe {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.08); opacity: 1; }
    }
    @keyframes glowPulse {
      0%, 100% { opacity: 0.03; }
      50% { opacity: 0.07; }
    }
    @keyframes glowPulseSlow {
      0%, 100% { opacity: 0.02; }
      50% { opacity: 0.10; }
    }
    @keyframes breatheGlow {
      0% { opacity: 0.02; transform: scale(1); }
      40% { opacity: 0.12; transform: scale(1.01); }
      100% { opacity: 0.02; transform: scale(1); }
    }
    @keyframes lockBreathe {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(255,23,68,0.3)); }
      50% { transform: scale(1.1); filter: drop-shadow(0 0 20px rgba(255,23,68,0.6)); }
    }
    @keyframes cursorBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes statusPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .font-sans { font-family: 'Inter', -apple-system, sans-serif; }
  `}</style>
);

// ─── AUDIO ENGINE ───────────────────────────────────────────
class NeuroAudioEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  activeNodes: AudioNode[] = [];
  activeSessionGain: GainNode | null = null;
  _pendingRecovery: ReturnType<typeof setTimeout> | null = null;
  currentVolume = 0.8; // Default

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.currentVolume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMasterVolume(val: number) {
    this.currentVolume = val;
    if (this.ctx && this.masterGain) {
      // Use exponential ramp for smooth volume changes (prevents clicking)
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(val, now, 0.1);
    }
  }

  playBlip(freq = 880) {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08 * this.currentVolume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  stopCurrent(fadeOutDuration = 0.5) {
    if (this._pendingRecovery) {
      clearTimeout(this._pendingRecovery);
      this._pendingRecovery = null;
    }
    if (!this.ctx || !this.activeSessionGain) return;
    const nodesToStop = [...this.activeNodes];
    const gainToFade = this.activeSessionGain;
    this.activeNodes = [];
    this.activeSessionGain = null;
    const now = this.ctx.currentTime;
    gainToFade.gain.cancelScheduledValues(now);
    gainToFade.gain.setValueAtTime(gainToFade.gain.value, now);
    gainToFade.gain.exponentialRampToValueAtTime(0.001, now + fadeOutDuration);
    setTimeout(() => {
      nodesToStop.forEach((n) => {
        try {
          if ('stop' in n && typeof (n as any).stop === 'function') (n as any).stop();
          n.disconnect();
        } catch (e) {}
      });
      try {
        gainToFade.disconnect();
      } catch (e) {}
    }, fadeOutDuration * 1000 + 50);
  }

  createSession() {
    this.init();
    this.stopCurrent(0.5);
    if (!this.ctx || !this.masterGain) return null;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.connect(this.masterGain);
    this.activeSessionGain = g;
    return g;
  }

  playOverclock() {
    const sg = this.createSession();
    if (!sg || !this.ctx) return;
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = 200;
    const lfo = this.ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 40;
    const pg = this.ctx.createGain();
    pg.gain.setValueAtTime(0, this.ctx.currentTime);
    const lg = this.ctx.createGain();
    lg.gain.value = 0.5;
    lfo.connect(lg);
    lg.connect(pg.gain);
    carrier.connect(pg);
    pg.connect(sg);
    lfo.start();
    carrier.start();
    this.activeNodes.push(lfo, carrier, pg, lg);
    const now = this.ctx.currentTime;
    sg.gain.setValueAtTime(0, now);
    sg.gain.linearRampToValueAtTime(0.2, now + 0.5);
  }

  playShield() {
    const sg = this.createSession();
    if (!sg || !this.ctx) return;
    const bs = 2 * this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, bs, this.ctx.sampleRate);
    const o = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bs; i++) {
      const w = Math.random() * 2 - 1;
      o[i] = (last + 0.02 * w) / 1.02;
      last = o[i];
      o[i] *= 3.5;
    }
    const nn = this.ctx.createBufferSource();
    nn.buffer = buf;
    nn.loop = true;
    const notch = this.ctx.createBiquadFilter();
    notch.type = 'notch';
    notch.frequency.value = 200;
    notch.Q.value = 1;
    nn.connect(notch);
    notch.connect(sg);
    nn.start();
    const oL = this.ctx.createOscillator();
    oL.frequency.value = 200;
    const pL = this.ctx.createStereoPanner();
    pL.pan.value = -1;
    const oR = this.ctx.createOscillator();
    oR.frequency.value = 210;
    const pR = this.ctx.createStereoPanner();
    pR.pan.value = 1;
    const bg = this.ctx.createGain();
    bg.gain.value = 0.15;
    oL.connect(pL);
    pL.connect(bg);
    oR.connect(pR);
    pR.connect(bg);
    bg.connect(sg);
    oL.start();
    oR.start();
    this.activeNodes.push(nn, notch, oL, pL, oR, pR, bg);
    const now = this.ctx.currentTime;
    sg.gain.setValueAtTime(0, now);
    sg.gain.linearRampToValueAtTime(0.8, now + 1.0);
  }

  playConnect() {
    const sg = this.createSession();
    if (!sg || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.frequency.value = 528;
    const og = this.ctx.createGain();
    og.gain.value = 0.15;
    osc.connect(og);
    og.connect(sg);
    osc.start();
    const ov = this.ctx.createOscillator();
    ov.frequency.value = 1056;
    const ovg = this.ctx.createGain();
    ovg.gain.value = 0.03;
    ov.connect(ovg);
    ovg.connect(sg);
    ov.start();
    this.activeNodes.push(osc, og, ov, ovg);
    const now = this.ctx.currentTime;
    sg.gain.setValueAtTime(0, now);
    sg.gain.linearRampToValueAtTime(1.0, now + 2.0);
  }

  playRecovery() {
    this.init();
    const fade = 2.0;
    this.stopCurrent(fade);
    if (!this.ctx || !this.masterGain) return;
    this._pendingRecovery = setTimeout(() => {
      this._pendingRecovery = null;
      if (!this.ctx || !this.masterGain) return;
      const sg = this.ctx.createGain();
      const now = this.ctx.currentTime;
      sg.gain.setValueAtTime(0, now);
      sg.connect(this.masterGain);
      this.activeSessionGain = sg;
      const c = this.ctx.createOscillator();
      c.frequency.value = 150;
      const l = this.ctx.createOscillator();
      l.frequency.value = 10;
      const ag = this.ctx.createGain();
      ag.gain.setValueAtTime(0, now);
      l.connect(ag.gain);
      c.connect(ag);
      ag.connect(sg);
      l.start();
      c.start();
      this.activeNodes.push(l, c, ag);
      sg.gain.setValueAtTime(0, now);
      sg.gain.linearRampToValueAtTime(0.3, now + 2.0);
    }, fade * 1000 + 100);
  }

  playDeepWork() {
    const sg = this.createSession();
    if (!sg || !this.ctx) return;

    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = 150;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 15;

    const pg = this.ctx.createGain();
    pg.gain.setValueAtTime(0, this.ctx.currentTime);
    const lg = this.ctx.createGain();
    lg.gain.value = 0.4;

    lfo.connect(lg);
    lg.connect(pg.gain);
    carrier.connect(pg);
    pg.connect(sg);

    lfo.start();
    carrier.start();

    const bs = 2 * this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, bs, this.ctx.sampleRate);
    const o = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bs; i++) {
      const w = Math.random() * 2 - 1;
      o[i] = (last + 0.02 * w) / 1.02;
      last = o[i];
      o[i] *= 3.5;
    }

    const nn = this.ctx.createBufferSource();
    nn.buffer = buf;
    nn.loop = true;
    const bg = this.ctx.createGain();
    bg.gain.value = 0.15;
    nn.connect(bg);
    bg.connect(sg);
    nn.start();

    this.activeNodes.push(lfo, carrier, pg, lg, nn, bg);
    const now = this.ctx.currentTime;
    sg.gain.setValueAtTime(0, now);
    sg.gain.linearRampToValueAtTime(0.6, now + 1.0);
  }
}
const audioEngine = new NeuroAudioEngine();

// ─── APP CONTEXT ────────────────────────────────────────────
interface AppContextType {
  initialized: boolean;
  setInitialized: (val: boolean) => void;
  mode: string;
  setMode: (mode: string) => void;
  hrv: number;
  hr: number;
  safetyStatus: string;
  sessionDuration: number;
  setHrv: (val: number) => void;
  setHr: (val: number) => void;
  resetSession: () => void;
  volume: number;
  setVolume: (val: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [initialized, setInitialized] = useState(false);
  const [mode, setMode] = useState('IDLE');
  const [hrv, setHrv] = useState(48);
  const [hr, setHr] = useState(62);
  const [safetyStatus, setSafetyStatus] = useState('GREEN');
  const [sessionDuration, setSessionDuration] = useState(0);

  // Volume state (0.0 - 1.0)
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const hrvRef = useRef(hrv);
  const modeRef = useRef(mode);
  const orangeCountRef = useRef(0);

  useEffect(() => {
    hrvRef.current = hrv;
  }, [hrv]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Handle Volume Updates
  useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volume;
    audioEngine.setMasterVolume(effectiveVolume);
  }, [volume, isMuted]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (mode !== 'IDLE' && mode !== 'LOCKOUT') {
      interval = setInterval(() => setSessionDuration((d) => d + 1), 1000);
    } else {
      setSessionDuration(0);
    }
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    if (mode === 'IDLE' || mode === 'LOCKOUT') {
      orangeCountRef.current = 0;
      return;
    }
    const check = () => {
      const h = hrvRef.current;
      const m = modeRef.current;
      if (m === 'IDLE' || m === 'LOCKOUT') return;
      const ratio = h / BASELINE_RMSSD;
      if (ratio >= THRESHOLDS.GREEN) {
        setSafetyStatus('GREEN');
        orangeCountRef.current = 0;
      } else if (ratio >= THRESHOLDS.YELLOW) {
        setSafetyStatus('YELLOW');
        orangeCountRef.current = 0;
      } else if (ratio < THRESHOLDS.RED) {
        setSafetyStatus('RED');
        setMode('LOCKOUT');
        audioEngine.stopCurrent(0.1);
        orangeCountRef.current = 0;
      } else {
        orangeCountRef.current += 1;
        setSafetyStatus('ORANGE');
        if (
          orangeCountRef.current >= THRESHOLDS.CONSECUTIVE_ORANGE &&
          m !== 'RECOVERY'
        ) {
          setMode('RECOVERY');
          audioEngine.playRecovery();
        }
      }
    };
    const p = setInterval(check, POLLING_RATE_MS);
    check();
    return () => clearInterval(p);
  }, [mode]);

  const resetSession = useCallback(() => {
    audioEngine.stopCurrent(0.5);
    setMode('IDLE');
    setSessionDuration(0);
    orangeCountRef.current = 0;
  }, []);

  return (
    <AppContext.Provider
      value={{
        initialized,
        setInitialized,
        mode,
        setMode,
        hrv,
        hr,
        safetyStatus,
        sessionDuration,
        setHrv,
        setHr,
        resetSession,
        volume,
        setVolume,
        isMuted,
        toggleMute,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// ─── UI COMPONENTS ──────────────────────────────────────────

const TypewriterText = ({ text, speed = 30, color = '#00E5FF' }: { text: string; speed?: number; color?: string }) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current > text.length) {
        setDone(true);
        clearInterval(interval);
        return;
      }
      setDisplayed(text.slice(0, indexRef.current));
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span style={{ color }}>
      {displayed}
      {!done && (
        <span
          style={{
            animation: 'cursorBlink 0.8s step-end infinite',
            marginLeft: 1,
          }}
        >
          ▌
        </span>
      )}
    </span>
  );
};

const NeuralGuidanceTicker = ({ modeKey, color }: { modeKey: keyof typeof MODE_TIPS; color: string }) => {
  const tips = MODE_TIPS[modeKey] || MODE_TIPS.focus;
  const [tipIndex, setTipIndex] = useState(0);
  const [phase, setPhase] = useState('typing');

  useEffect(() => {
    setTipIndex(0);
    setPhase('typing');
  }, [modeKey]);

  useEffect(() => {
    if (phase === 'typing') {
      const charTime = tips[tipIndex].length * 30 + 200;
      const timer = setTimeout(() => setPhase('display'), charTime);
      return () => clearTimeout(timer);
    }
    if (phase === 'display') {
      const timer = setTimeout(() => setPhase('fading'), 4000);
      return () => clearTimeout(timer);
    }
    if (phase === 'fading') {
      const timer = setTimeout(() => {
        setTipIndex((i) => (i + 1) % tips.length);
        setPhase('typing');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, tipIndex, tips]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 240,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 16px',
        zIndex: 20,
      }}
    >
      <div
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 999,
          padding: '10px 20px',
          maxWidth: 380,
          width: '100%',
          textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          lineHeight: 1.5,
          boxShadow: `0 0 20px ${color}15, 0 4px 20px rgba(0,0,0,0.4)`,
          opacity: phase === 'fading' ? 0 : 1,
          transition: 'opacity 0.5s ease',
          minHeight: 38,
        }}
      >
        <span style={{ opacity: 0.4, color: '#9ca3af', marginRight: 6 }}>
          SYS:
        </span>
        <TypewriterText
          key={`${modeKey}-${tipIndex}`}
          text={tips[tipIndex]}
          color={color}
        />
      </div>
    </div>
  );
};

// ─── VOLUME CONTROL COMPONENT ──────────────────────────────
const VolumeControl = ({ color }: { color: string }) => {
  const { volume, setVolume, isMuted, toggleMute } = useContext(AppContext);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        maxWidth: 300,
        marginBottom: 16,
        zIndex: 10,
      }}
    >
      <button
        onClick={toggleMute}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: isMuted ? '#6b7280' : color,
          transition: 'color 0.3s',
        }}
      >
        {isMuted ? (
          <VolumeX size={16} />
        ) : volume < 0.5 ? (
          <Volume1 size={16} />
        ) : (
          <Volume2 size={16} />
        )}
      </button>

      <div
        style={{
          position: 'relative',
          flex: 1,
          height: 24,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            if (isMuted) toggleMute();
            setVolume(parseFloat(e.target.value));
          }}
          style={{ position: 'relative', zIndex: 2 }}
        />
        {/* Custom Track Highlight */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            marginTop: -1,
            height: 2,
            background: isMuted ? '#374151' : color,
            width: `${isMuted ? 0 : volume * 100}%`,
            borderRadius: 1,
            pointerEvents: 'none',
            zIndex: 1,
            boxShadow: isMuted ? 'none' : `0 0 10px ${color}`,
          }}
        />
      </div>

      <span
        style={{
          width: 32,
          textAlign: 'right',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: '#6b7280',
        }}
      >
        {isMuted ? 0 : Math.round(volume * 100)}%
      </span>
    </div>
  );
};

const BioFeedbackBar = () => {
  const { hr, hrv, safetyStatus } = useContext(AppContext);

  const statusConfig: Record<string, { label: string; icon: typeof Shield; color: string }> = {
    GREEN: { label: 'Coherent State', icon: Shield, color: '#10B981' },
    YELLOW: { label: 'Mild Stress', icon: AlertTriangle, color: '#FBBF24' },
    ORANGE: { label: 'High Stress', icon: AlertTriangle, color: '#F97316' },
    RED: { label: 'Critical Overload', icon: AlertTriangle, color: '#FF1744' },
  };
  const status = statusConfig[safetyStatus];
  const StatusIcon = status.icon;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(5,5,15,0.9)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 448,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Heart size={13} color="#6b7280" />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: '#fff',
              }}
            >
              {hr}
            </span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 9,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              bpm
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={13} color="#6b7280" />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: '#fff',
              }}
            >
              {hrv}
            </span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 9,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              rmssd
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: `${status.color}10`,
            border: `1px solid ${status.color}25`,
          }}
        >
          <StatusIcon size={11} color={status.color} />
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 9,
              fontWeight: 600,
              color: status.color,
              letterSpacing: '0.03em',
            }}
          >
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
};

const DevControls = () => {
  const { setHrv, setHr, hrv, hr } = useContext(AppContext);
  const [open, setOpen] = useState(false);

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          top: 8,
          right: 8,
          zIndex: 100,
          fontSize: 9,
          color: '#374151',
          border: '1px solid #1f2937',
          background: 'rgba(0,0,0,0.5)',
          padding: '4px 8px',
          borderRadius: 4,
          cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        DEV
      </button>
    );

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        zIndex: 100,
        background: 'rgba(17,24,39,0.95)',
        border: '1px solid #374151',
        padding: 12,
        borderRadius: 8,
        width: 200,
        fontSize: 10,
        color: '#fff',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
          fontWeight: 700,
          color: '#6b7280',
        }}
      >
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          SIMULATOR
        </span>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label
          style={{
            display: 'block',
            color: '#6b7280',
            marginBottom: 2,
            fontFamily: "'Inter', sans-serif",
            fontSize: 9,
          }}
        >
          HRV (Baseline: {BASELINE_RMSSD})
        </label>
        <input
          type="range"
          min="10"
          max="100"
          value={hrv}
          onChange={(e) => setHrv(+e.target.value)}
          style={{ width: '100%', accentColor: '#00E5FF' }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: '#6b7280',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span>10</span>
          <span style={{ color: '#00E5FF', fontWeight: 700 }}>{hrv}ms</span>
          <span>100</span>
        </div>
      </div>
      <div>
        <label
          style={{
            display: 'block',
            color: '#6b7280',
            marginBottom: 2,
            fontFamily: "'Inter', sans-serif",
            fontSize: 9,
          }}
        >
          Heart Rate
        </label>
        <input
          type="range"
          min="40"
          max="120"
          value={hr}
          onChange={(e) => setHr(+e.target.value)}
          style={{ width: '100%', accentColor: '#FF1744' }}
        />
        <div
          style={{
            textAlign: 'center',
            color: '#ef4444',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {hr} bpm
        </div>
      </div>
    </div>
  );
};

const InitializeGate = () => {
  const { setInitialized } = useContext(AppContext);

  const handleInit = () => {
    audioEngine.init();
    audioEngine.playBlip(660);
    setTimeout(() => audioEngine.playBlip(880), 80);
    setTimeout(() => audioEngine.playBlip(1100), 160);
    setTimeout(() => setInitialized(true), 600);
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        animation: 'fadeIn 0.8s ease-out',
      }}
    >
      <div style={{ position: 'relative', marginBottom: 48 }}>
        <Brain
          size={48}
          color="#00E5FF"
          style={{ animation: 'breathe 4s ease-in-out infinite' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: -20,
            borderRadius: '50%',
            border: '1px solid rgba(0,229,255,0.1)',
            animation: 'breathe 4s ease-in-out infinite',
          }}
        />
      </div>

      <h1
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '0.3em',
          color: '#fff',
          marginBottom: 8,
        }}
      >
        NEUROSYNC
      </h1>

      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: '#6b7280',
          marginBottom: 48,
          letterSpacing: '0.05em',
        }}
      >
        Digital Nootropic Interface
      </p>

      <button
        onClick={handleInit}
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '16px 48px',
          borderRadius: 8,
          background: 'rgba(0,229,255,0.08)',
          border: '1px solid rgba(0,229,255,0.3)',
          color: '#00E5FF',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.15em',
          cursor: 'pointer',
          transition: 'all 0.3s',
          boxShadow: '0 0 30px rgba(0,229,255,0.1)',
        }}
        onMouseEnter={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.background = 'rgba(0,229,255,0.15)';
          target.style.boxShadow = '0 0 40px rgba(0,229,255,0.2)';
        }}
        onMouseLeave={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.background = 'rgba(0,229,255,0.08)';
          target.style.boxShadow = '0 0 30px rgba(0,229,255,0.1)';
        }}
      >
        INITIALIZE SESSION
      </button>

      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 9,
          color: '#374151',
          marginTop: 24,
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        Audio context requires user interaction to activate.
        <br />
        Headphones recommended for binaural entrainment.
      </p>
    </div>
  );
};

const ModeCard = ({ modeKey, active, onSelect, disabled }: { modeKey: keyof typeof MODE_CONFIG; active: keyof typeof MODE_CONFIG | null; onSelect: (key: keyof typeof MODE_CONFIG) => void; disabled?: boolean }) => {
  const [hovered, setHovered] = useState(false);
  const config = MODE_CONFIG[modeKey];
  const Icon = config.icon;
  const isActive = active === modeKey;
  const showGlow = isActive || hovered;

  return (
    <button
      onClick={() => !disabled && onSelect(modeKey)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        position: 'relative',
        width: '100%',
        padding: '18px 20px',
        background: isActive
          ? `${config.color}08`
          : hovered
          ? 'rgba(255,255,255,0.02)'
          : 'rgba(17,24,39,0.6)',
        border: `1px solid ${
          showGlow ? config.borderGlow : 'rgba(255,255,255,0.06)'
        }`,
        borderRadius: 12,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.4s ease',
        boxShadow: showGlow ? config.glowShadow : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        opacity: disabled ? 0.4 : 1,
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: showGlow ? config.colorDim : 'rgba(255,255,255,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s',
          flexShrink: 0,
        }}
      >
        <Icon
          size={20}
          color={showGlow ? config.color : '#6b7280'}
          style={{ transition: 'color 0.3s' }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.1em',
            }}
          >
            {config.label}
          </span>
          {isActive && (
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: config.color,
                background: `${config.color}15`,
                padding: '2px 8px',
                borderRadius: 999,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              ACTIVE
            </span>
          )}
        </div>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            color: '#6b7280',
            marginTop: 3,
            lineHeight: 1.3,
          }}
        >
          <span
            style={{
              color: showGlow ? config.color : '#9ca3af',
              fontWeight: 500,
              transition: 'color 0.3s',
            }}
          >
            {config.subtitle}
          </span>
          <span style={{ margin: '0 6px', color: '#374151' }}>·</span>
          {config.description}
        </p>
      </div>

      <ChevronRight
        size={16}
        color={showGlow ? config.color : '#374151'}
        style={{ flexShrink: 0, transition: 'color 0.3s' }}
      />
    </button>
  );
};

const HomeScreen = () => {
  const { setMode, hrv, isMuted } = useContext(AppContext);
  const [showWarning, setShowWarning] = useState(false);

  const activateMode = (modeKey: keyof typeof MODE_CONFIG) => {
    if (modeKey === 'OVERCLOCK' && hrv < BASELINE_RMSSD * THRESHOLDS.YELLOW) {
      setShowWarning(true);
      return;
    }
    if (!isMuted)
      audioEngine.playBlip(
        modeKey === 'OVERCLOCK' ? 880 : modeKey === 'SHIELD' ? 660 : modeKey === 'DEEP_WORK' ? 740 : 528
      );
    setMode(modeKey);
    switch (modeKey) {
      case 'OVERCLOCK':
        audioEngine.playOverclock();
        break;
      case 'SHIELD':
        audioEngine.playShield();
        break;
      case 'CONNECT':
        audioEngine.playConnect();
        break;
      case 'DEEP_WORK':
        audioEngine.playDeepWork();
        break;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '40px 20px 80px',
        maxWidth: 448,
        margin: '0 auto',
      }}
    >
      <header
        style={{
          textAlign: 'center',
          marginBottom: 32,
          animation: 'fadeInUp 0.6s ease-out',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 6,
          }}
        >
          <Brain size={18} color="#00E5FF" />
          <h1
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.25em',
              color: '#fff',
            }}
          >
            NEUROSYNC
          </h1>
        </div>
        <div
          style={{
            height: 1,
            width: 40,
            margin: '0 auto 10px',
            background:
              'linear-gradient(90deg, transparent, #00E5FF, transparent)',
          }}
        />
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            color: '#4b5563',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Select Neural Protocol
        </p>
      </header>

      {showWarning && (
        <div
          style={{
            background: 'rgba(255,179,0,0.06)',
            border: '1px solid rgba(255,179,0,0.2)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            textAlign: 'center',
            animation: 'fadeInUp 0.3s ease-out',
          }}
        >
          <AlertTriangle
            size={18}
            color="#FFB300"
            style={{ marginBottom: 8 }}
          />
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              color: '#FFB300',
              fontSize: 11,
              margin: '0 0 12px',
              lineHeight: 1.5,
            }}
          >
            Biological battery depleted — sympathetic dominance detected.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              onClick={() => {
                setShowWarning(false);
                activateMode('SHIELD');
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.05em',
              }}
            >
              SHIELD INSTEAD
            </button>
            <button
              onClick={() => {
                setShowWarning(false);
                setMode('OVERCLOCK');
                audioEngine.playOverclock();
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                background: 'transparent',
                border: '1px solid rgba(255,179,0,0.3)',
                color: '#FFB300',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.05em',
              }}
            >
              OVERRIDE
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {(['OVERCLOCK', 'SHIELD', 'CONNECT', 'DEEP_WORK'] as const).map((m, i) => (
          <div
            key={m}
            style={{
              animation: `fadeInUp 0.5s ease-out ${0.1 + i * 0.1}s both`,
            }}
          >
            <ModeCard modeKey={m} active={null} onSelect={activateMode} />
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', paddingTop: 16 }}>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            color: '#1f2937',
            letterSpacing: '0.1em',
          }}
        >
          NEUROSYNC v2.1 — INTERNAL BUILD
        </p>
      </div>
    </div>
  );
};

const ActiveSession = () => {
  const { mode, sessionDuration, safetyStatus, resetSession, isMuted } =
    useContext(AppContext);
  const config = MODE_CONFIG[mode as keyof typeof MODE_CONFIG] || MODE_CONFIG.OVERCLOCK;
  const mins = Math.floor(sessionDuration / 60)
    .toString()
    .padStart(2, '0');
  const secs = (sessionDuration % 60).toString().padStart(2, '0');
  const isRecovery = mode === 'RECOVERY';
  const Icon = config.icon;

  const animMap: Record<string, string> = {
    OVERCLOCK: 'glowPulse 3s ease-in-out infinite',
    SHIELD: 'glowPulseSlow 5s ease-in-out infinite',
    CONNECT: 'breatheGlow 10s ease-in-out infinite',
    RECOVERY: 'breatheGlow 8s ease-in-out infinite',
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '48px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: config.bgTint,
          animation: animMap[mode] || 'none',
          transition: 'background 0.5s ease',
        }}
      />

      <div
        style={{
          textAlign: 'center',
          zIndex: 1,
          marginTop: 24,
          animation: 'fadeInUp 0.5s ease-out',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            padding: 22,
            borderRadius: '50%',
            background: 'rgba(17,24,39,0.8)',
            border: `1px solid ${config.borderGlow}`,
            color: config.color,
            boxShadow: config.glowShadow,
            animation: 'breathe 4s ease-in-out infinite',
          }}
        >
          <Icon size={32} />
        </div>
        <h2
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.2em',
            marginTop: 16,
          }}
        >
          {config.label}
        </h2>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            color: config.color,
            marginTop: 6,
            letterSpacing: '0.05em',
            opacity: 0.8,
          }}
        >
          {config.subtitle} · {config.description}
        </p>
      </div>

      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 56,
            color: '#fff',
            fontWeight: 300,
            letterSpacing: '-0.02em',
          }}
        >
          {mins}:{secs}
        </div>

        {safetyStatus !== 'GREEN' && (
          <div
            style={{
              marginTop: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.08em',
              fontFamily: "'JetBrains Mono', monospace",
              background: `${isRecovery ? '#F97316' : '#FFB300'}10`,
              border: `1px solid ${isRecovery ? '#F97316' : '#FFB300'}30`,
              color: isRecovery ? '#F97316' : '#FFB300',
              animation:
                safetyStatus === 'ORANGE' || safetyStatus === 'RED'
                  ? 'statusPulse 1.5s infinite'
                  : 'none',
            }}
          >
            <AlertTriangle size={11} />
            {isRecovery ? 'SAFETY VALVE — RECOVERY' : `STATUS: ${safetyStatus}`}
          </div>
        )}
      </div>

      <NeuralGuidanceTicker modeKey={config.key as keyof typeof MODE_TIPS} color={config.color} />

      {/* Volume & End Session Controls */}
      <div
        style={{
          zIndex: 10,
          width: '100%',
          maxWidth: 300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <VolumeControl color={config.color} />

        <button
          onClick={() => {
            if (!isMuted) audioEngine.playBlip(440);
            resetSession();
          }}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 8,
            background: 'rgba(17,24,39,0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#6b7280',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.color = '#fff';
            target.style.borderColor = 'rgba(255,255,255,0.15)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.color = '#6b7280';
            target.style.borderColor = 'rgba(255,255,255,0.06)';
          }}
        >
          End Session
        </button>
      </div>
    </div>
  );
};

const LockoutScreen = () => {
  const { resetSession } = useContext(AppContext);
  const [countdown, setCountdown] = useState(15 * 60);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const m = Math.floor(countdown / 60)
    .toString()
    .padStart(2, '0');
  const s = (countdown % 60).toString().padStart(2, '0');

  return (
    <div
      style={{
        height: '100%',
        background: 'linear-gradient(180deg, #0d0505 0%, #000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          marginBottom: 32,
          animation: 'lockBreathe 3s ease-in-out infinite',
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'rgba(255,23,68,0.06)',
            border: '1px solid rgba(255,23,68,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Lock size={36} color="#FF1744" />
        </div>
      </div>

      <h2
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 16,
          fontWeight: 700,
          color: '#FF1744',
          letterSpacing: '0.15em',
          marginBottom: 12,
        }}
      >
        NEURAL RECOVERY REQUIRED
      </h2>

      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          color: '#9ca3af',
          fontSize: 12,
          lineHeight: 1.7,
          maxWidth: 300,
          marginBottom: 32,
        }}
      >
        Your autonomic system needs time to restore balance. RMSSD dropped below{' '}
        {Math.round(THRESHOLDS.RED * 100)}% of baseline.
      </p>

      <div
        style={{
          padding: '20px 32px',
          borderRadius: 12,
          background: 'rgba(255,23,68,0.04)',
          border: '1px solid rgba(255,23,68,0.1)',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 32,
            fontWeight: 300,
            color: countdown > 0 ? '#ef4444' : '#10B981',
            letterSpacing: '0.05em',
          }}
        >
          {countdown > 0 ? `${m}:${s}` : 'READY'}
        </div>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 9,
            color: '#6b7280',
            marginTop: 6,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {countdown > 0
            ? 'Recovery cooldown remaining'
            : 'Lockout expired — you may return'}
        </p>
      </div>

      {countdown > 0 && (
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            color: '#4b5563',
            lineHeight: 1.6,
            maxWidth: 260,
          }}
        >
          Step away from screens. Hydrate. Breathe through the nose — 4 seconds
          in, 6 seconds out.
        </p>
      )}

      {countdown === 0 && (
        <button
          onClick={resetSession}
          style={{
            padding: '14px 40px',
            borderRadius: 8,
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: '#10B981',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(16,185,129,0.15)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(16,185,129,0.08)';
          }}
        >
          RETURN TO HOME
        </button>
      )}
    </div>
  );
};

// ─── MAIN LAYOUT ────────────────────────────────────────────
const MainLayout = () => {
  const { mode, initialized } = useContext(AppContext);

  return (
    <div
      style={{
        background: '#000',
        minHeight: '100vh',
        color: '#fff',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <DevControls />
      <main
        style={{
          height: '100vh',
          width: '100%',
          maxWidth: 448,
          margin: '0 auto',
          position: 'relative',
          background: '#000',
          overflow: 'hidden',
          borderLeft: '1px solid rgba(255,255,255,0.03)',
          borderRight: '1px solid rgba(255,255,255,0.03)',
        }}
      >
        {!initialized && <InitializeGate />}
        {initialized && mode === 'IDLE' && <HomeScreen />}
        {initialized &&
          ['OVERCLOCK', 'SHIELD', 'CONNECT', 'RECOVERY'].includes(mode) && (
            <ActiveSession />
          )}
        {initialized && mode === 'LOCKOUT' && <LockoutScreen />}
        {initialized && mode !== 'LOCKOUT' && <BioFeedbackBar />}
      </main>
    </div>
  );
};

export default function NeuroSyncApp() {
  return (
    <>
      <GlobalStyles />
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </>
  );
}
