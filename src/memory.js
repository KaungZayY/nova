const memory = new Map();

export const MAX_HISTORY = 10;
export const SUMMARY_TRIGGER = 14;

export function getMemory(userId) {
  if (!memory.has(userId)) {
    memory.set(userId, {
      summary: "",
      history: [],
    });
  }
  return memory.get(userId);
}

export function resetMemory(userId) {
  const mem = getMemory(userId);

  mem.summary = "";
  mem.history = [];
}
