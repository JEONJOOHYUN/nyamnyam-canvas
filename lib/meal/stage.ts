// Default stage thresholds in % (spec §4-2). Stage k is shown once progress reaches thresholds[k-1].
export const DEFAULT_STAGE_THRESHOLDS = [10, 25, 40, 55, 70, 85, 95];
export const STAGE_COUNT = DEFAULT_STAGE_THRESHOLDS.length;

// 0 = nothing grown yet, 1..7 = stages.
export function stageFor(
  progress: number,
  thresholds: number[] = DEFAULT_STAGE_THRESHOLDS,
): number {
  return thresholds.filter((t) => progress * 100 >= t).length;
}

export const DEFAULT_IDLE_SECONDS = 30;
export const DEFAULT_IDLE_MAX_PROMPTS = 3;

// True when the child has gone quiet long enough for another gentle prompt.
export function shouldPromptIdle(
  lastChangeAt: number,
  lastPromptAt: number,
  promptsSent: number,
  now: number,
  idleSeconds = DEFAULT_IDLE_SECONDS,
  maxPrompts = DEFAULT_IDLE_MAX_PROMPTS,
): boolean {
  const since = Math.max(lastChangeAt, lastPromptAt);
  return promptsSent < maxPrompts && now - since >= idleSeconds * 1000;
}
