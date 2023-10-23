import levelData1 from './data/abstract-1.json';
import levelData2 from './data/abstract-2.json';
import levelData3 from './data/abstract-3.json';

export const levelsData = [
  {
    id: '1',
    fragments: levelData1.fragments,
    decorations: levelData1.decorations,
    neighborsGraph: levelData1.neighborsGraph as [string, string][],
    grouping: levelData1.grouping,
    colorsNumber: 4,
  },
  {
    id: '2',
    fragments: levelData2.fragments,
    decorations: levelData2.decorations,
    neighborsGraph: levelData2.neighborsGraph as [string, string][],
    grouping: levelData2.grouping,
    colorsNumber: levelData2.chromaticNumber,
  },
  {
    id: '3',
    fragments: levelData3.fragments,
    decorations: levelData3.decorations,
    neighborsGraph: levelData3.neighborsGraph as [string, string][],
    grouping: levelData3.grouping,
    colorsNumber: 4,
  },
];
