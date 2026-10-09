// Efectos de sonido sintetizados (Web Audio) + voz (Web Speech API).
// Sin archivos externos: todo funciona offline en el aula.

let audioCtx: AudioContext | null = null;

function audio(): AudioContext | null {
    try {
        if (!audioCtx) {
            const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!Ctor) return null;
            audioCtx = new Ctor();
        }
        if (audioCtx.state === 'suspended') void audioCtx.resume();
        return audioCtx;
    } catch {
        return null;
    }
}

function beep(freq: number, duration = 0.18, type: OscillatorType = 'sine', volume = 0.2, delay = 0) {
    const ctx = audio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
}

/** Sonido al tocar una letra / ficha. */
export function playTap() {
    beep(880, 0.08, 'triangle', 0.12);
}

/** Fanfarria de acierto. */
export function playCorrect() {
    beep(523.25, 0.14, 'sine', 0.18);
    beep(659.25, 0.14, 'sine', 0.18, 0.1);
    beep(783.99, 0.22, 'sine', 0.2, 0.2);
}

/** Tono de error suave (no asusta a los niños). */
export function playWrong() {
    beep(220, 0.16, 'sawtooth', 0.08);
    beep(180, 0.2, 'sawtooth', 0.08, 0.12);
}

/** Celebración al terminar el nivel. */
export function playVictory() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => beep(f, 0.24, 'triangle', 0.16, i * 0.13));
}

let voice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
    if (voice) return voice;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    voice =
        voices.find((v) => /es[-_]MX/i.test(v.lang)) ??
        voices.find((v) => /es[-_]ES/i.test(v.lang)) ??
        voices.find((v) => v.lang.startsWith('es')) ??
        null;
    return voice;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Las voces cargan de forma asíncrona en Chrome.
    window.speechSynthesis.onvoiceschanged = () => {
        voice = null;
        pickVoice();
    };
}

/** Habla texto en español (fonética: vocales, consonantes, palabras). */
export function speak(text: string, rate = 0.85) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-MX';
    utter.rate = rate;
    utter.pitch = 1.05;
    const v = pickVoice();
    if (v) utter.voice = v;
    window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
