import type { WriterMaterialActionStep } from "./writerMaterialAction";

export interface WriterMaterialPlaybackVoice {
  readonly stopped?: boolean;
  stop: (releaseMs?: number) => void;
}

export interface WriterMaterialPlaybackState {
  status: "stopped" | "playing";
  stepIndex: number | null;
  loop: boolean;
  error?: "audio-unavailable";
}

export interface WriterMaterialPlaybackDependencies {
  playStep: (step: WriterMaterialActionStep) => WriterMaterialPlaybackVoice | null;
  onStateChange: (state: WriterMaterialPlaybackState) => void;
  setTimer?: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
}

export interface WriterMaterialPlaybackController {
  play: (steps: WriterMaterialActionStep[]) => void;
  stop: () => void;
  setLoop: (enabled: boolean) => void;
  dispose: () => void;
}

export function writerMaterialPlaybackCycleDuration(steps: WriterMaterialActionStep[]): number {
  return steps.reduce(
    (duration, step) => Math.max(duration, step.onsetMs + step.durationMs),
    0
  ) + (steps.length > 0 ? 260 : 0);
}

export function createWriterMaterialPlaybackController(
  dependencies: WriterMaterialPlaybackDependencies
): WriterMaterialPlaybackController {
  const setTimer = dependencies.setTimer || ((callback, delayMs) => setTimeout(callback, delayMs));
  const clearTimer = dependencies.clearTimer || (timer => clearTimeout(timer));
  let generation = 0;
  let cycleToken = 0;
  let disposed = false;
  let loop = false;
  let status: WriterMaterialPlaybackState["status"] = "stopped";
  let currentStepIndex: number | null = null;
  let error: WriterMaterialPlaybackState["error"];
  let timers: Array<ReturnType<typeof setTimeout>> = [];
  let voices: WriterMaterialPlaybackVoice[] = [];
  let currentSteps: WriterMaterialActionStep[] = [];

  const notify = () => {
    if (disposed) return;
    dependencies.onStateChange({
      status,
      stepIndex: currentStepIndex,
      loop,
      ...(error ? { error } : {})
    });
  };

  const clearScheduledWork = () => {
    timers.forEach(timer => clearTimer(timer));
    timers = [];
    voices.forEach(voice => voice.stop(24));
    voices = [];
  };

  const stopCurrent = (notifyStopped: boolean) => {
    generation += 1;
    cycleToken += 1;
    clearScheduledWork();
    currentSteps = [];
    status = "stopped";
    currentStepIndex = null;
    error = undefined;
    if (notifyStopped) notify();
  };

  const runCycle = (playbackGeneration: number) => {
    if (disposed || status !== "playing" || playbackGeneration !== generation) return;
    const activeCycleToken = ++cycleToken;
    let createdVoiceCount = 0;
    timers = [];
    voices = [];

    currentSteps.forEach((step, stepIndex) => {
      const runStep = () => {
        if (
          disposed
          || status !== "playing"
          || playbackGeneration !== generation
          || activeCycleToken !== cycleToken
        ) return;
        let voice: WriterMaterialPlaybackVoice | null;
        try {
          voice = dependencies.playStep(step);
        } catch {
          voice = null;
        }
        if (voice) {
          voices.push(voice);
          createdVoiceCount += 1;
        }
        currentStepIndex = stepIndex;
        notify();
      };

      if (step.onsetMs === 0) runStep();
      else timers.push(setTimer(runStep, step.onsetMs));
    });

    const cycleDuration = writerMaterialPlaybackCycleDuration(currentSteps);
    timers.push(setTimer(() => {
      if (
        disposed
        || status !== "playing"
        || playbackGeneration !== generation
        || activeCycleToken !== cycleToken
      ) return;
      cycleToken += 1;
      clearScheduledWork();
      if (createdVoiceCount === 0) {
        currentSteps = [];
        status = "stopped";
        currentStepIndex = null;
        error = "audio-unavailable";
        notify();
        return;
      }
      if (loop) {
        runCycle(playbackGeneration);
        return;
      }
      currentSteps = [];
      status = "stopped";
      currentStepIndex = null;
      notify();
    }, cycleDuration));
  };

  return {
    play(steps) {
      stopCurrent(false);
      if (disposed || steps.length === 0) {
        notify();
        return;
      }
      currentSteps = [...steps];
      status = "playing";
      error = undefined;
      const playbackGeneration = generation;
      runCycle(playbackGeneration);
    },
    stop() {
      stopCurrent(true);
    },
    setLoop(enabled) {
      if (disposed || loop === enabled) return;
      loop = enabled;
      notify();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stopCurrent(false);
    }
  };
}
