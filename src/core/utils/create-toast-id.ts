let counter = 0;

export const createToastId = (): string => `toast-${(++counter).toString(36)}`;
