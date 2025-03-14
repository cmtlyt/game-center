interface DiceRollOptions {
  count: number;
  duration: number;
  onBeforeRoll?: () => void;
  onFinish?: (results: number[]) => void;
}

export function useDiceRoll(options: DiceRollOptions) {
  const results = Array.from({ length: options.count }, () => 1);

  const currentRoll = shallowRef<Promise<number[]>>();

  async function roll() {
    if (currentRoll.value) {
      return currentRoll.value;
    }

    options.onBeforeRoll?.();

    for (let i = 0; i < options.count; i++) {
      results[i] = Math.floor(Math.random() * 6) + 1;
    }

    currentRoll.value = new Promise<number[]>((resolve) => {
      setTimeout(() => {
        options.onFinish?.([...results]);
        resolve([...results]);
        currentRoll.value = undefined;
      }, options.duration);
    });

    return currentRoll.value;
  }

  return {
    results,
    currentRoll,
    roll,
  };
}
