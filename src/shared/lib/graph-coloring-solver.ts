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
