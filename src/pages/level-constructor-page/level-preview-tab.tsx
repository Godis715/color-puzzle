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
  selectGraphComplexity,
} from 'src/features/level-constructor';

import { LevelRenderer } from './level-renderer';

const DEFAULT_COLOR = '#ededed';

const COLORS = [
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
  const groups = useSelector(selectGroups);
  const defaultColoring = Object.fromEntries(groups.map(({ id }) => [id, -1]));
  const [coloring, setColoring] = useState(defaultColoring);

  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);

  const fragments = useSelector(selectFragments);
  const decorations = useSelector(selectDecorations);
  const colorsNum = useSelector(selectChromaticNumber);
  const solutionColoring = useSelector(selectGraphColoring);
  const mapFragmentIdToGroupId = useSelector(selectMapFragmentIdToGroupId);
  const levelComplexity = useSelector(selectGraphComplexity);

  const maxColor = colorsNum - 1;

  const getFragmentGroupId = (fragmentId: string) =>
    mapFragmentIdToGroupId[fragmentId];

  const resetProgress = (): void => setColoring(defaultColoring);

  const errorGroups = useMemo(
    () =>
      groups.filter(({ id, neighbors }) =>
        neighbors.some(
          (neighborId) =>
            coloring[id] !== -1 && coloring[neighborId] === coloring[id]
        )
      ),
    [coloring, groups]
  );

  const getGroupColorById = (groupId: string): string => {
    const colorIdx = coloring[groupId] ?? -1;

    const color = colorIdx === -1 ? DEFAULT_COLOR : COLORS[colorIdx];

    const paperColor = new paper.Color(color);

    if (hoveredGroupId === groupId) {
      paperColor.red -= 0.07;
      paperColor.green -= 0.07;
      paperColor.blue -= 0.03;
    }

    return paperColor.toCSS(true);
  };

  const getGroupClassName = (groupId: string): string => {
    const isError = errorGroups.some(({ id }) => groupId === id);
    return cnLevelPreviewTab('Fragment', { isError });
  };

  const handleGroupClick = (groupId: string): void => {
    const currColor = coloring[groupId];
    const newColor = currColor === maxColor ? -1 : currColor + 1;

    setColoring({ ...coloring, [groupId]: newColor });
  };

  const handleGroupRightClick = (groupId: string): void => {
    const currColor = coloring[groupId];
    const newColor = currColor === -1 ? maxColor : currColor - 1;

    setColoring({ ...coloring, [groupId]: newColor });
  };

  const handleShowSolutionClick = (): void => setColoring(solutionColoring);

  const levelComplexityFormatted = `${Math.round(100 * levelComplexity)}/100`;

  return (
    <>
      <Grid item xs={8}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <LevelRenderer
            fragments={fragments}
            decorations={decorations}
            getFragmentGroupId={getFragmentGroupId}
            getGroupClassName={getGroupClassName}
            getGroupColor={getGroupColorById}
            onGroupHover={setHoveredGroupId}
            onGroupClick={handleGroupClick}
            onGroupContextMenu={handleGroupRightClick}
          />
        </Box>
      </Grid>

      <Grid item xs={4}>
        <Typography>Total colors: {colorsNum}</Typography>
        <Typography>Complexity: {levelComplexityFormatted}</Typography>
        <Typography>Total fragments: {groups.length}</Typography>
        <Typography>Errors count: {errorGroups.length}</Typography>

        <Button variant="contained" onClick={handleShowSolutionClick}>
          Show solution
        </Button>

        <Button variant="outlined" color="warning" onClick={resetProgress}>
          Reset
        </Button>
      </Grid>
    </>
  );
}
