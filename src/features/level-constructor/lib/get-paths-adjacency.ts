type ErrorResult<E extends Error> = {
  error: E;
};

type SuccessResult<T> = {
  error?: undefined;
  value: T;
};

type Result<T, E extends Error> = ErrorResult<E> | SuccessResult<T>;

function distance(path: paper.PathItem, point: paper.Point): number {
  return path.getNearestPoint(point).getDistance(point);
}

export function getArePathsNeighbors(
  p1: paper.Path,
  p2: paper.Path,
  distEps: number,
  eps: number
): boolean {
  if (!p1.bounds.intersects(p2.bounds, distEps)) {
    return false;
  }

  for (let k = 0; k < p1.curves.length; k += 1) {
    const curve1 = p1.curves[k];

    if (!curve1.bounds.intersects(p2.bounds, distEps)) {
      continue;
    }

    const pointsCount = 2;

    for (let l = 0; l < pointsCount; l += 1) {
      const center1 = curve1.getPointAt((l * curve1.length) / pointsCount);
      const center2 = p2.getNearestPoint(center1);

      if (center1.getDistance(center2) >= distEps) {
        continue;
      }

      const center1Offset = p1.getOffsetOf(center1);
      const pt1Left = p1.getPointAt(center1Offset - eps);
      const pt1Right = p1.getPointAt(center1Offset + eps);

      const center2Offset = p2.getOffsetOf(center2);
      const pt2Left = p2.getPointAt(center2Offset - eps);
      const pt2Right = p2.getPointAt(center2Offset + eps);

      if (
        (distance(p2, pt1Left) < distEps || distance(p2, pt1Right) < distEps) &&
        (distance(p1, pt2Left) < distEps || distance(p1, pt2Right) < distEps)
      ) {
        return true;
      }
    }
  }

  return false;
}

export function getPathsAdjacencyList(
  paths: paper.PathItem[],
  distEps: number,
  eps = 10
): Result<Record<string, string[]>, Error> {
  try {
    const adjacencyList: Record<string, string[]> = {};

    for (let i = 0; i < paths.length; i += 1) {
      const p1 = paths[i] as paper.Path;

      adjacencyList[p1.name] ??= [];

      for (let j = 0; j < paths.length; j += 1) {
        const p2 = paths[j] as paper.Path;

        if (
          p1 !== p2 &&
          !adjacencyList[p1.name]?.includes(p2.name) &&
          !adjacencyList[p2.name]?.includes(p1.name) &&
          getArePathsNeighbors(p1, p2, distEps, eps)
        ) {
          adjacencyList[p1.name].push(p2.name);
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
