/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import paper from 'paper';

import {
  selectFragments,
  selectDecorations,
  selectGroups,
} from 'features/level-constructor';
import {
  colors,
  selectChromaticNumber,
  selectFragmentsDtos,
} from 'features/level-constructor/model';

import { LevelRenderer } from './level-renderer';

export function LevelPreviewTab(): JSX.Element {
  const [coloring, setColoring] = useState<Record<string, number>>({});
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);

  const fragments = useSelector(selectFragments);
  const decorations = useSelector(selectDecorations);
  const groups = useSelector(selectGroups);
  const fragmentsDtos = useSelector(selectFragmentsDtos);
  const colorsNum = useSelector(selectChromaticNumber);

  useEffect(() => {
    setColoring(Object.fromEntries(groups.map(({ id }) => [id, -1])));
  }, [groups]);

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

  const getGroupId = (fragmentId: string | null) =>
    fragmentsDtos.find(({ id }) => fragmentId === id)?.groupId ?? null;

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
            onFragmentHover={(id) => setHoveredGroupId(getGroupId(id))}
            onFragmentClick={(id) => {
              const groupId = getGroupId(id);

              if (!groupId) return;

              setColoring({
                ...coloring,
                [groupId]: ((coloring[groupId] + 2) % (colorsNum + 1)) - 1,
              });
            }}
            onFragmentContextMenu={(id) => {
              const groupId = getGroupId(id);

              if (!groupId) return;

              setColoring({
                ...coloring,
                [groupId]:
                  coloring[groupId] === -1
                    ? colorsNum - 1
                    : coloring[groupId] - 1,
              });
            }}
            getFragmentColor={getFragmentColorById}
          />
        </Box>
      </Grid>

      <Grid item xs={4}>
        <Typography>Total colors: {colorsNum}</Typography>
        <Typography>Total fragments: {groups.length}</Typography>
        <Typography>Errors count: {errorGroups.length}</Typography>
      </Grid>
    </>
  );
}
