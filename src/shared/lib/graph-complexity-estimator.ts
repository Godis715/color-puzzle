import seedrandom from 'seedrandom';

import { Graph, getGraphColoringGreedy } from './graph-coloring-solver';

function renameNodes(graph: Graph, mapping: number[]): Graph {
  const newGraph = graph.map(() => [] as number[]);

  graph.forEach((neighbors, i) =>
    neighbors.forEach((n) => {
      newGraph[mapping[i]].push(mapping[n]);
    })
  );

  return newGraph;
}

function shuffleArray<T>(array: T[], random: () => number): T[] {
  const result = array;
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function shuffleGraph(graph: Graph, random: () => number): Graph {
  const nodesMapping = shuffleArray(
    graph.map((_, i) => i),
    random
  );

  return renameNodes(graph, nodesMapping);
}

export function estimateComplexity(
  graph: Graph,
  optimalSolution: number,
  iter: number,
  seed = 0
): number {
  let correctResultsCount = 0;
  const random = seedrandom(seed.toString());

  for (let i = 0; i < iter; i += 1) {
    const shuffledGraph = shuffleGraph(graph, random);
    const coloring = getGraphColoringGreedy(shuffledGraph);
    const greedySolution = Math.max(...coloring) + 1;

    if (optimalSolution === greedySolution) {
      correctResultsCount += 1;
    }
  }

  return 1 - correctResultsCount / iter;
}
