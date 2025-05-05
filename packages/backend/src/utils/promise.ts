// predictate function that checks if a settled is fulfilled
export const isFulfilled = <T>(
  promise: PromiseSettledResult<T>,
): promise is PromiseFulfilledResult<T> => promise.status == 'fulfilled';
