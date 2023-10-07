export function toggleArrayElement<T>(array: T[], element: T): T[] {
  return array.includes(element)
    ? array.filter((elem) => elem !== element)
    : array.concat(element);
}
