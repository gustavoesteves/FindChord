import type { SessionBundle } from "./models/SessionBundle";
import type { HarmonyDecision } from "../models/HarmonyDecision";
import type { VoicedProgression } from "../realization/models/VoicedProgression";
import type { PerformanceTimeline } from "../runtime/models/PerformanceTimeline";

const ENGINE_VERSION = "0.10.0";

/**
 * Calcula o checksum FNV-1a (32-bit) de um array de bytes para detecção de corrupções.
 */
export function calculateMidiChecksum(bytes: Uint8Array): string {
  let hash = 2166136261;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Converte um Uint8Array em uma string Base64 em conformidade cross-platform.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converte uma string Base64 em um Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const sessionSerializer = {
  /**
   * Serializa todo o estado da cadeia musical e os bytes MIDI correspondentes
   * em um SessionBundle estruturado, versionado e com metadados opcionais.
   */
  serializeSession(
    decision: HarmonyDecision,
    voiced: VoicedProgression,
    timeline: PerformanceTimeline,
    midiBytes: Uint8Array,
    bpm: number,
    timeSignature: { numerator: number; denominator: number },
    optional?: {
      sessionName?: string;
      notes?: string;
      tags?: string[];
    }
  ): SessionBundle {
    const midiBase64 = uint8ArrayToBase64(midiBytes);
    const midiChecksum = calculateMidiChecksum(midiBytes);
    return {
      bundleType: "HarmonySessionBundle",
      version: "1.0.0",
      engineVersion: ENGINE_VERSION,
      createdAtUtc: new Date().toISOString(), // Rigorosamente ISO-8601 UTC ('Z')
      harmonyDecision: decision,
      voicedProgression: voiced,
      performanceTimeline: timeline,
      midiBase64,
      midiChecksum,
      bpm,
      timeSignature,
      sessionName: optional?.sessionName,
      notes: optional?.notes,
      tags: optional?.tags
    };
  },

  /**
   * Desserializa uma string JSON carregada em um SessionBundle genérico.
   */
  deserializeSession(jsonStr: string): SessionBundle {
    return JSON.parse(jsonStr) as SessionBundle;
  },

  /**
   * Decodifica a string Base64 de um SessionBundle de volta para Uint8Array.
   */
  decodeMidi(bundle: SessionBundle): Uint8Array {
    return base64ToUint8Array(bundle.midiBase64);
  },

  /**
   * Auditoria estrutural profunda: assevera chaves obrigatórias, decodifica Base64 e valida checksums.
   */
  validateSession(bundle: any): bundle is SessionBundle {
    if (!bundle || typeof bundle !== "object") return false;

    // 1. Validação de Assinatura e Versões
    if (bundle.bundleType !== "HarmonySessionBundle") return false;
    if (bundle.version !== "1.0.0") return false;
    if (typeof bundle.engineVersion !== "string") return false;
    if (typeof bundle.createdAtUtc !== "string") return false;

    // 2. Validação de Propriedades Tipo String Críticas
    if (typeof bundle.midiBase64 !== "string") return false;
    if (typeof bundle.midiChecksum !== "string") return false;

    // 3. Validação de Configuração Global de Tempo
    if (typeof bundle.bpm !== "number") return false;
    if (!bundle.timeSignature || typeof bundle.timeSignature !== "object") return false;
    if (typeof bundle.timeSignature.numerator !== "number") return false;
    if (typeof bundle.timeSignature.denominator !== "number") return false;

    // 4. Validação de Existência dos Componentes Puros do Engine
    if (!bundle.harmonyDecision || typeof bundle.harmonyDecision !== "object") return false;
    if (!bundle.voicedProgression || typeof bundle.voicedProgression !== "object") return false;
    if (!bundle.performanceTimeline || typeof bundle.performanceTimeline !== "object") return false;

    // 5. Validação da decodificação de Base64
    let decoded: Uint8Array;
    try {
      decoded = base64ToUint8Array(bundle.midiBase64);
    } catch (e) {
      return false; // Falha se atob() lançar uma exceção de formato inválido
    }

    // 6. Validação de Checksum
    const calculatedHash = calculateMidiChecksum(decoded);
    if (calculatedHash !== bundle.midiChecksum) {
      return false; // Falha se os bytes decodificados divergirem do checksum original
    }

    return true;
  },

  /**
   * Migra e sanitiza um bundle desconhecido para o formato de versão canônica 1.0.0.
   */
  migrateSession(bundle: any): SessionBundle {
    if (!bundle || typeof bundle !== "object") {
      throw new Error("Invalid session bundle format.");
    }

    // Sanitizar e preencher com fallbacks compatíveis
    const migrated: any = {
      bundleType: "HarmonySessionBundle",
      version: "1.0.0",
      engineVersion: bundle.engineVersion || ENGINE_VERSION,
      createdAtUtc: bundle.createdAtUtc || new Date().toISOString(),
      harmonyDecision: bundle.harmonyDecision || null,
      voicedProgression: bundle.voicedProgression || null,
      performanceTimeline: bundle.performanceTimeline || null,
      midiBase64: bundle.midiBase64 || "",
      midiChecksum: bundle.midiChecksum || "",
      bpm: bundle.bpm || 120,
      timeSignature: bundle.timeSignature || { numerator: 4, denominator: 4 },
      sessionName: bundle.sessionName,
      notes: bundle.notes,
      tags: bundle.tags
    };

    if (!migrated.harmonyDecision || !migrated.voicedProgression || !migrated.performanceTimeline) {
      throw new Error("Cannot migrate session: Critical musical components are missing.");
    }

    // Se o checksum estiver em branco e houver midiBase64, recalcula
    if (!migrated.midiChecksum && migrated.midiBase64) {
      try {
        const decoded = base64ToUint8Array(migrated.midiBase64);
        migrated.midiChecksum = calculateMidiChecksum(decoded);
      } catch (e) {
        // Ignora falhas de decodificação no fallback
      }
    }

    return migrated as SessionBundle;
  }
};
