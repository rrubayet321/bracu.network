/**
 * Reject if the async work does not finish within `ms` (clears the timer on completion).
 * Accepts a real Promise or a thenable (e.g. Supabase `PostgrestBuilder`).
 */
export function withTimeout<T>(
  asyncLike: Promise<T> | PromiseLike<T>,
  ms: number,
  onTimeout: () => void
): Promise<T> {
  const promise = Promise.resolve(asyncLike);
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      onTimeout();
      reject(new Error('__TIMEOUT__'));
    }, ms);
    promise
      .then(
        (v) => { clearTimeout(t); resolve(v); },
        (e) => { clearTimeout(t); reject(e); }
      );
  });
}
