export function delay(waitTimeInMs: number) {
  return new Promise(resolve => {
    setTimeout(resolve, waitTimeInMs);
  });
}
