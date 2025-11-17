const cache = new Map();

export async function memoiFn(key: string, fn: () => Promise<any>) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const promise = Promise.resolve(fn())
    .finally(() => {
      cache.delete(key);
    });

  cache.set(key, promise);
  return promise;
}
