import { sleep } from "./sleep.helper";

export const fetchWithRetry = async (
  url: string,
  init: RequestInit,
  retryDelays: number[],
  retryableStatuses: Set<number>,
  overloadError: string
): Promise<Response> => {
  for (const delay of retryDelays) {
    const response = await fetch(url, init);
    if (!retryableStatuses.has(response.status)) return response;
    await sleep(delay);
  }

  const response = await fetch(url, init);
  if (!retryableStatuses.has(response.status)) return response;

  throw new Error(overloadError);
};
