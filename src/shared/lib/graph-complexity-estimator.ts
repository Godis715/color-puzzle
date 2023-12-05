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

function removeNode(graph: Graph, n: number): Graph {
  return graph
    .filter((_, i) => i !== n)
    .map((neighbors) =>
      neighbors.filter((i) => i !== n).map((i) => (i < n ? i : i - 1))
    );
}

function removeDangling(graph: Graph): Graph {
  const dangling = graph.map((_, i) => i).filter((i) => graph[i].length < 2);

  return dangling.reduce((acc, n) => removeNode(acc, n), graph);
}

export function estimateComplexity(
  graph: Graph,
  optimalSolution: number,
  iter: number,
  seed = 0
): number {
  let correctResultsCount = 0;
  const random = seedrandom(seed.toString());
  const cleared = removeDangling(graph);

  for (let i = 0; i < iter; i += 1) {
    const shuffledGraph = shuffleGraph(cleared, random);
    const coloring = getGraphColoringGreedy(shuffledGraph);
    const greedySolution = Math.max(...coloring) + 1;

    if (optimalSolution === greedySolution) {
      correctResultsCount += 1;
    }
  }

  return 1 - correctResultsCount / iter;
}

export function generateGraph(n: number, m: number): Graph {
  if (m > (n * (n - 1)) / 2) throw Error('m is too big');

  const graph = new Array(n).fill(null).map(() => [] as number[]);
  const generated = new Set();

  let i = 0;

  while (i < m) {
    const randIdx = Math.floor(n * n * Math.random());

    let n1 = randIdx % n;
    let n2 = Math.floor(randIdx / n);

    if (n1 === n2) continue;

    if (n1 > n2) [n1, n2] = [n2, n1];

    const key = `${n1},${n2}`;

    if (generated.has(key)) continue;

    generated.add(key);
    graph[n1].push(n2);
    graph[n2].push(n1);

    i += 1;
  }

  return graph;
}
