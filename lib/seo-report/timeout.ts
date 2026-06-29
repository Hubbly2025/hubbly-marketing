export class SignalTimeoutError extends Error {
  constructor(
    message: string,
    readonly step: string,
    readonly timeoutMs: number
  ) {
    super(message);
    this.name = "SignalTimeoutError";
  }
}

export async function withTimeout<T>(promise: Promise<T>, step: string, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new SignalTimeoutError(`${step} timed out after ${timeoutMs}ms`, step, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function isSignalTimeoutError(error: unknown): error is SignalTimeoutError {
  return error instanceof SignalTimeoutError;
}
