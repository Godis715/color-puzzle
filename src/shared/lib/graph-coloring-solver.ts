import * as MiniZinc from 'minizinc';

const initPromise = MiniZinc.init({
  workerURL: 'http://localhost:3000/minizinc-worker.js',
});

export async function getGraphColoringBySat(
  edges: [string, string][]
): Promise<Record<string, number> | null> {
  try {
    await initPromise;

    const model = new MiniZinc.Model();

    model.addFile(
      'test.mzn',
      `
      % Input Parameters (values for these specified in .dzn data file)
      int: NUM_NODES; 
      int: NUM_EDGES;
      array[1..NUM_EDGES,1..2] of int: edges;
    
      % Decision Variable: the solver will find the values of these
      array[0..NUM_NODES-1] of var 1..NUM_NODES: color;
    
      % Our Constraints 
      constraint forall(e in 1..NUM_EDGES)(color[edges[e,1]] != color[edges[e,2]]);
    
      % Our Objective Function
      solve minimize max(color);
    
      % formatted output
      output[show(color)];
      `
    );

    const nodes = Array.from(new Set(edges.flat()));

    const mapNodeToIdx = Object.fromEntries(nodes.map((n, i) => [n, i]));

    const encodedEdges = edges.map(([n1, n2]) => [
      mapNodeToIdx[n1],
      mapNodeToIdx[n2],
    ]);

    model.addJson({
      NUM_NODES: edges.length,
      NUM_EDGES: edges.length,
      edges: encodedEdges,
    });

    const result = await model.solve({
      options: {
        solver: 'gecode',
        'all-solutions': true,
      },
    });

    const coloring = result.solution?.output.json?.color;

    if (!coloring || !Array.isArray(coloring)) return null;

    return (coloring as Coloring)
      .map((c) => c - 1)
      .reduce(
        (acc, color, i) => {
          acc[nodes[i]] = color;
          return acc;
        },
        {} as Record<string, number>
      );
  } catch (err) {
    console.error(err);
    return null;
  }
}

export type Graph = number[][];

export type Coloring = number[];

function getColoringForNum(graph: Graph, colorsNum: number): Coloring | null {
  const coloring = new Array(graph.length).fill(-1);
  let node = 0;

  while (node >= 0 && node < graph.length) {
    let color = coloring[node] + 1;

    for (color; color <= colorsNum; color += 1)
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      if (graph[node].every((n) => coloring[n] !== color)) break;

    if (color < colorsNum) {
      coloring[node] = color;
      node += 1;
    } else {
      coloring[node] = -1;
      node -= 1;
    }
  }

  return node === -1 ? null : coloring;
}

export function getGraphColoring(graph: Graph): Coloring {
  if (!graph.length) return [];

  for (let colNum = 1; colNum <= graph.length; colNum += 1) {
    const coloring = getColoringForNum(graph, colNum);
    if (coloring) return coloring;
  }

  throw new Error("Couldn't calculate graph coloring");
}

export function getGraphColoringGreedy(graph: Graph): Coloring {
  const coloring = new Array(graph.length).fill(-1);
  for (let i = 0; i < graph.length; i += 1) {
    do {
      coloring[i] += 1;
    } while (graph[i].some((n) => coloring[n] === coloring[i]));
  }

  return coloring;
}
