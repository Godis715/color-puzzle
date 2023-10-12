/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { cn } from '@bem-react/classname';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import paper from 'paper';

import {
  selectFragments,
  selectDecorations,
  selectGroups,
  selectChromaticNumber,
  selectGraphColoring,
  selectMapFragmentIdToGroupId,
} from 'src/features/level-constructor';

import { LevelRenderer } from './level-renderer';

export const colors = [
  '#ff99cc',
  '#ccff99',
  '#99ccff',
  '#ffcc99',
  '#cc99ff',
  '#99ffcc',
  '#ffffcc',
  '#ffcccc',
  '#ccccff',
  '#ccffff',
  '#ccffcc',
  '#ffccff',
];

const cnLevelPreviewTab = cn('LevelPreviewTab');

export function LevelPreviewTab(): JSX.Element {
  const [coloring, setColoring] = useState<Record<string, number>>({});
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);

  const fragments = useSelector(selectFragments);
  const decorations = useSelector(selectDecorations);
  const groups = useSelector(selectGroups);
  const colorsNum = useSelector(selectChromaticNumber);
  const solutionColoring = useSelector(selectGraphColoring);
  const mapFragmentIdToGroupId = useSelector(selectMapFragmentIdToGroupId);

  const reset = (): void => {
    setColoring(Object.fromEntries(groups.map(({ id }) => [id, -1])));
  };

  useEffect(reset, [groups]);

  const errorGroups = useMemo(
    () =>
      groups.filter((group) =>
        group.neighbors.some(
          (id) =>
            coloring[id] !== -1 &&
            coloring[group.id] !== -1 &&
            coloring[id] === coloring[group.id]
        )
      ),
    [coloring, groups]
  );

  const getGroupId = (fragmentId: string) => mapFragmentIdToGroupId[fragmentId];

  const getFragmentColorById = (fragmentId: string): string => {
    const groupId = getGroupId(fragmentId);

    if (!groupId) return '';

    const colorIdx = coloring[groupId] ?? -1;

    const color = colorIdx === -1 ? 'rgb(237,237,237)' : colors[colorIdx];

    const paperColor = new paper.Color(color);

    if (hoveredGroupId === groupId) {
      paperColor.red -= 0.07;
      paperColor.green -= 0.07;
      paperColor.blue -= 0.03;
    }

    const { red, green, blue } = paperColor;

    return `rgb(${256 * red},${256 * green},${256 * blue})`;
  };

  return (
    <>
      <Grid item xs={8}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <LevelRenderer
            fragments={fragments}
            decorations={decorations}
            getFragmentGroupId={getGroupId}
            onGroupHover={setHoveredGroupId}
            getGroupClassName={(groupId) => {
              const group = groups.find((g) => g.id === groupId);

              if (!group) return '';

              const isError = group.neighbors.some(
                (nid) =>
                  coloring[nid] !== -1 &&
                  coloring[group.id] !== -1 &&
                  coloring[nid] === coloring[group.id]
              );

              return cnLevelPreviewTab('Fragment', { isError });
            }}
            onGroupClick={(groupId) => {
              setColoring({
                ...coloring,
                [groupId]: ((coloring[groupId] + 2) % (colorsNum + 1)) - 1,
              });
            }}
            onGroupContextMenu={(groupId) => {
              setColoring({
                ...coloring,
                [groupId]:
                  coloring[groupId] === -1
                    ? colorsNum - 1
                    : coloring[groupId] - 1,
              });
            }}
            getGroupColor={getFragmentColorById}
          />
        </Box>
      </Grid>

      <Grid item xs={4}>
        <Typography>Total colors: {colorsNum}</Typography>
        <Typography>Total fragments: {groups.length}</Typography>
        <Typography>Errors count: {errorGroups.length}</Typography>

        <Button
          variant="contained"
          onClick={() => setColoring({ ...solutionColoring })}
        >
          Show solution
        </Button>
        <Button variant="outlined" color="warning" onClick={reset}>
          Reset
        </Button>
      </Grid>
    </>
  );
}
