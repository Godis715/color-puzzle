import paper from 'paper';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';

import DoneIcon from '@mui/icons-material/Done';
import { Button, Grid, Typography } from '@mui/material';

import { useActions } from 'src/shared/hooks';

import { getAdjacencyList } from 'src/features/level-constructor/lib/undirected-graph';
import { actions, selectLevels } from 'src/features/levels';

import { LevelRenderer } from '../level-constructor-page/level-renderer';

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

const DEFAULT_COLOR = '#ededed';

export function LevelPage(): JSX.Element {
  const { levelId } = useParams();

  const navigate = useNavigate();

  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);

  const { setCurrentColoring, setFoundSolutionColoring } = useActions(actions);

  const levels = useSelector(selectLevels);

  const level = levels.find((l) => l.id === levelId);

  const coloring = level?.currentColoring ?? {};

  const mapFragmentIdToGroupId = Object.fromEntries(level?.grouping ?? []);

  const groups = useMemo(
    () => level?.grouping.map(([, gid]) => gid) ?? [],
    [level]
  );

  const neighborsGraph = getAdjacencyList(level?.neighborsGraph ?? []);

  const errorGroups = useMemo(
    () =>
      groups.filter(
        (groupId) =>
          neighborsGraph[groupId]?.some(
            (neighborId) =>
              (coloring[groupId] ?? -1) !== -1 &&
              coloring[neighborId] === coloring[groupId]
          )
      ),
    [coloring, groups]
  );

  useEffect(() => {
    if (level && !level.isAvailable) {
      navigate('..');
    }
  }, [level]);

  useEffect(() => {
    if (
      level?.grouping.every(([, gid]) => (coloring[gid] ?? -1) >= 0) &&
      errorGroups.length === 0 &&
      !level.foundSolutionColoring
    ) {
      setFoundSolutionColoring({ levelId: level.id, coloring });
    }
  }, [level, errorGroups, coloring]);

  const setColoring = (newColoring: Record<string, number> | null): void => {
    if (levelId) setCurrentColoring({ levelId, coloring: newColoring });
  };

  const getFragmentGroupId = (fragmentId: string) =>
    mapFragmentIdToGroupId[fragmentId];

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

  const handleGroupClick = (groupId: string): void => {
    if (!level) return;

    const currColor = coloring[groupId] ?? -1;

    const newColor = currColor === level.colorsNumber - 1 ? -1 : currColor + 1;

    const newColoring = { ...coloring, [groupId]: newColor };

    setColoring(newColoring);
  };

  const handleGroupRightClick = (groupId: string): void => {
    setColoring({ ...coloring, [groupId]: -1 });
  };

  const handleReset = (): void => {
    setColoring(null);
  };

  const handleNextLevelClick = (): void => {
    if (level?.nextLevelId) navigate(`../${level.nextLevelId}`);
  };

  const handlePrevLevelClick = (): void => {
    if (level?.prevLevelId) navigate(`../${level.prevLevelId}`);
  };

  const handleShowSolution = (): void => {
    if (level) setColoring(level.foundSolutionColoring);
  };

  if (!level?.isAvailable) {
    return <></>;
  }

  if (!level) {
    return (
      <div>
        <Link to="..">Back to levels</Link>
        <Typography variant="h4">Level not found</Typography>
      </div>
    );
  }

  return (
    <div>
      <Link to="..">Back to levels</Link>

      <Grid display="flex" alignItems="center">
        <Typography variant="h4">{levelId}</Typography>

        {level.isPassed && (
          <DoneIcon color="success" sx={{ fontSize: 48, marginLeft: 2 }} />
        )}
      </Grid>

      <Typography>Goal: {level.colorsNumber} colors</Typography>

      <Typography>Errors count: {errorGroups.length}</Typography>

      <LevelRenderer
        fragments={level.fragments ?? []}
        decorations={level.decorations ?? ''}
        getFragmentGroupId={getFragmentGroupId}
        getGroupColor={getGroupColorById}
        onGroupHover={setHoveredGroupId}
        onGroupClick={handleGroupClick}
        onGroupContextMenu={handleGroupRightClick}
      />

      <Button onClick={handleReset}>Reset</Button>

      {level.prevLevelId && (
        <Button onClick={handlePrevLevelClick}>Previous level</Button>
      )}

      {level.foundSolutionColoring &&
        (level.nextLevelId ? (
          <Button onClick={handleNextLevelClick}>Next level</Button>
        ) : (
          <Button onClick={() => navigate('..')}>To menu</Button>
        ))}

      {level.foundSolutionColoring && (
        <Button onClick={handleShowSolution}>Show solution</Button>
      )}
    </div>
  );
}
