const toTimestampFromInput = (value?: Date | number): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return Date.now();
};

export function toEpochMilliseconds(value?: Date | number): number {
  return toTimestampFromInput(value);
}

export function toEpochSeconds(value?: Date | number): number {
  return Math.floor(toTimestampFromInput(value) / 1000);
}

export function now(): number {
  return Date.now();
}
