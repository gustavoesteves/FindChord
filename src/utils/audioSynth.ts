import { Note as TonalNote } from "tonal";

let audioCtx: AudioContext | null = null;

/**
 * Lazy initializer for AudioContext to satisfy browser security policies (requires user interaction)
 */
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Converte um nome de nota (ex: "C4", "E2") para sua frequência em Hz
 */
export function noteToFrequency(noteName: string): number {
  const note = TonalNote.get(noteName);
  if (note.empty || note.midi === undefined || note.midi === null) return 440;
  // Fórmula padrão de frequência MIDI: 440 * 2^((midi - 69)/12)
  return 440 * Math.pow(2, (note.midi - 69) / 12);
}

/**
 * Gera um AudioBuffer com o som sintetizado de uma corda de guitarra (Karplus-Strong)
 */
function createStringBuffer(ctx: AudioContext, frequency: number, duration: number = 1.5): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const numSamples = sampleRate * duration;
  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const channelData = buffer.getChannelData(0);

  // O período de delay é o tamanho da "linha de retardo" em amostras
  const period = Math.round(sampleRate / frequency);
  
  // 1. Alimentar o início com ruído branco de alta densidade (simulando a palhetada)
  for (let i = 0; i < period; i++) {
    channelData[i] = Math.random() * 2 - 1;
  }

  // 2. Loop de feedback Karplus-Strong
  // decayFactor controla quão rápido a corda para de vibrar (notas graves sustentam mais que agudas)
  const baseDecay = 0.993;
  // Notas mais altas decaem um pouco mais rápido de forma natural
  const decayFactor = Math.min(0.996, baseDecay - (frequency / 25000));

  for (let i = period; i < numSamples; i++) {
    // Filtro passa-baixas de 1 polo: média do valor atual e anterior na linha de retardo
    const val = (channelData[i - period] + channelData[i - period - 1]) * 0.5 * decayFactor;
    channelData[i] = val;
  }

  // 3. Suavizar o final do buffer (fade-out rápido nas últimas 1000 amostras) para evitar cliques
  const fadeSize = Math.min(2000, numSamples * 0.1);
  for (let i = 0; i < fadeSize; i++) {
    const idx = numSamples - 1 - i;
    const ratio = i / fadeSize;
    channelData[idx] *= ratio;
  }

  return buffer;
}

/**
 * Toca uma única nota física após um delay em milissegundos
 */
export function playGuitarNote(noteName: string, delayMs: number = 0): void {
  try {
    const ctx = getAudioContext();
    const frequency = noteToFrequency(noteName);
    
    // Evita tentar sintetizar frequências absurdas ou inaudíveis
    if (frequency < 20 || frequency > 4000) return;

    const duration = 1.8; // Duração da nota
    const stringBuffer = createStringBuffer(ctx, frequency, duration);

    const source = ctx.createBufferSource();
    source.buffer = stringBuffer;

    // Criar um nó de Ganho (Volume) para controlar a dinâmica e fadeout
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime + delayMs / 1000);
    
    // Dinâmica de decaimento natural secundário
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delayMs / 1000 + duration);

    // Conectar e tocar
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    source.start(ctx.currentTime + delayMs / 1000);
  } catch (error) {
    console.warn("Erro ao reproduzir áudio (Web Audio API):", error);
  }
}

/**
 * Toca um conjunto de notas simulando um arpejo dedilhado ou palhetada (strumming)
 * @param notes Array de notas ordenado da mais grave para a mais aguda
 * @param strumSpeed Atraso em ms entre cordas (ex: 45ms para strum rápido, 150ms para arpejo lento)
 */
export function playGuitarChord(notes: string[], strumSpeed: number = 40): void {
  if (notes.length === 0) return;

  // Filtrar notas repetidas adjacentes se necessário, mantendo ordem física
  const activeNotes = notes.filter(n => n !== "x" && n !== "");

  activeNotes.forEach((note, index) => {
    // Strumming: atrasa a execução de cada nota progressivamente para simular a palheta passando pelas cordas
    playGuitarNote(note, index * strumSpeed);
  });
}
