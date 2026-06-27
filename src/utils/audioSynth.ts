import { Note as TonalNote } from "tonal";

let audioCtx: AudioContext | null = null;

/**
 * Lazy initializer for AudioContext
 */
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const MyWindow = window as unknown as Window & { webkitAudioContext: typeof AudioContext };
    const AudioContextClass = window.AudioContext || MyWindow.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Converte nome de nota para frequência
 */
function noteToFrequency(noteName: string): number {
  const note = TonalNote.get(noteName);
  if (note.empty || note.midi === undefined || note.midi === null) return 440;
  return 440 * Math.pow(2, (note.midi - 69) / 12);
}

/**
 * Sintetizador subtrativo de guitarra elétrica limpa.
 * Utiliza osciladores combinados e varredura de filtro passa-baixas para som quente e amadeirado.
 */
export function playGuitarNote(noteName: string, delayMs: number = 0): void {
  try {
    const ctx = getAudioContext();
    const frequency = noteToFrequency(noteName);
    
    if (frequency < 20 || frequency > 4000) return;

    const startTime = ctx.currentTime + delayMs / 1000;
    const duration = 2.0;

    // 1. Oscilador Primário: Onda triangular para ressonância do corpo (fundamental)
    const osc1 = ctx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(frequency, startTime);

    // 2. Oscilador Secundário: Onda senoidal uma oitava acima para brilho e clareza das cordas de aço
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(frequency * 2, startTime);

    // Nó de mesclagem de ganho para os osciladores (70% corpo, 30% brilho)
    const osc1Gain = ctx.createGain();
    const osc2Gain = ctx.createGain();
    
    osc1Gain.gain.setValueAtTime(0.65, startTime);
    osc2Gain.gain.setValueAtTime(0.20, startTime);

    // 3. Filtro Passa-Baixas Dinâmico (BiquadFilter)
    // Isso simula o amortecimento físico da corda, onde agudos decaem muito rápido
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    
    // Inicia brilhante no ataque (2500Hz) e cai rapidamente para um som aveludado e amadeirado (180Hz)
    filter.frequency.setValueAtTime(2800, startTime);
    filter.frequency.exponentialRampToValueAtTime(140, startTime + 1.2);

    // 4. Envelope de Ganho Principal (Volume)
    const gainNode = ctx.createGain();
    
    // Silêncio inicial absoluto
    gainNode.gain.setValueAtTime(0, startTime);
    
    // Ataque ultra rápido de 8ms para simular a palhetada sem cliques digitais
    gainNode.gain.linearRampToValueAtTime(0.35, startTime + 0.008);
    
    // Decaimento natural lento e exponencial
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Conexões
    osc1.connect(osc1Gain);
    osc2.connect(osc2Gain);
    
    osc1Gain.connect(filter);
    osc2Gain.connect(filter);
    
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Disparar
    osc1.start(startTime);
    osc2.start(startTime);
    
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
  } catch (error) {
    console.warn("Erro ao sintetizar áudio (Web Audio API):", error);
  }
}
