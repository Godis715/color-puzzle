import { PaperOffset } from 'paperjs-offset';

type ErrorResult<E extends Error> = {
  error: E;
};

type SuccessResult<T> = {
  error?: undefined;
  value: T;
};

type Result<T, E extends Error> = ErrorResult<E> | SuccessResult<T>;

export function getPathsAdjacencyList(
  paths: paper.PathItem[],
  offset: number,
  eps = 10
): Result<Record<string, string[]>, Error> {
  try {
    const adjacencyList: Record<string, string[]> = {};

    for (let i = 0; i < paths.length; i += 1) {
      const p1 = paths[i] as paper.Path;
      const p1Ext = PaperOffset.offset(p1, offset, { insert: false });

      adjacencyList[p1.name] ??= [];

      for (let j = i + 1; j < paths.length; j += 1) {
        const p2 = paths[j];
        const intersection = p1Ext.intersect(p2, {
          insert: false,
        }) as paper.Path;

        if (intersection.area > eps) {
          adjacencyList[p1.name].push(p2.name.toString());
        }
      }
    }

    return { value: adjacencyList };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Unexpected error'),
    };
  }
}
