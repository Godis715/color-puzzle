/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useEffect, useState } from 'react';
import SVG from 'react-inlinesvg';
import paper from 'paper';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import { useSelector } from 'react-redux';

import { useActions } from 'shared/hooks';

import {
  actions,
  selectFragments,
  selectDecorations,
  selectGroups,
  selectIsActiveGroupReady,
  selectIsSingleSelection,
} from 'features/level-constructor';
import {
  Decorations,
  Fragment,
  selectCanBreakActiveGroup,
  selectChromaticNumber,
  selectFragmentsDtos,
  selectGraphColoring,
  selectHasSelection,
  selectIsMultiSelection,
} from 'features/level-constructor/model';

import { getFragmentColor } from './get-fragment-color';

import './style.scss';
import { Typography } from '@mui/material';

const CANVAS_ID = 'paper-canvas';

function getFileContentAsText(file: File): Promise<string> {
  const reader = new FileReader();

  return new Promise((resolve) => {
    reader.addEventListener('load', (event) => {
      resolve(event.target?.result?.toString() ?? '');
    });

    reader.readAsText(file);
  });
}

function flattenChildren(item: paper.Item): paper.Item[] {
  const stack = [item];
  const result: paper.Item[] = [];

  while (stack.length > 0) {
    const currItem = stack.pop();

    if (!currItem) break;

    if (currItem.className === 'Layer' || currItem.className === 'Group') {
      stack.push(...currItem.children);
    } else {
      result.push(currItem);
    }
  }

  return result;
}

function isPathLike(item: paper.Item): boolean {
  return item.className === 'Path' || item.className === 'CompoundPath';
}

function parseSvg(svg: string): {
  fragments: Fragment[];
  decorations: Decorations;
} {
  const g = new paper.Group();
  const fragmentsGroup = new paper.Group().addTo(g);
  const decorationsGroups = new paper.Group().addTo(g);

  const svgRoot = paper.project.importSVG(svg, {
    applyMatrix: true,
    expandShapes: true,
    insert: false,
  });

  const [fragments, decorations] = svgRoot.children.slice(1);

  console.log(svgRoot, fragments, decorations);

  const paths = flattenChildren(fragments)
    .filter(isPathLike)
    .reverse()
    .map((p) => p.addTo(fragmentsGroup)) as paper.PathItem[];

  decorations.addTo(decorationsGroups);

  g.fitBounds(new paper.Rectangle(0, 0, 100, 100));

  return {
    fragments: paths.map((path) => ({
      id: path.name,
      data: path.pathData,
    })),
    decorations: decorations.exportSVG({ asString: true }) as string,
  };
}

export function LevelConstructorPage(): JSX.Element {
  const {
    setActiveGroupId,
    toggleActiveGroupId,
    uniteActive,
    breakActive,
    toggleNeighbor,
    setFragments,
    setDecorations,
    setHoveredGroupId,
    toggleIsActiveGroupReady,
    reset: resetState,
  } = useActions(actions);

  const [tab, setTab] = useState(0);

  const fragments = useSelector(selectFragments);
  const decorations = useSelector(selectDecorations);
  const groups = useSelector(selectGroups);
  const isActiveGroupReady = useSelector(selectIsActiveGroupReady);
  const isSingleSelection = useSelector(selectIsSingleSelection);
  const chromaticNumber = useSelector(selectChromaticNumber);
  const coloring = useSelector(selectGraphColoring);
  const isMultiSelection = useSelector(selectIsMultiSelection);
  const hasSelection = useSelector(selectHasSelection);
  const canBreakActiveGroup = useSelector(selectCanBreakActiveGroup);
  const fragmentsDtos = useSelector(selectFragmentsDtos);

  useEffect(() => {
    paper.setup(CANVAS_ID);
  }, []);

  const hasActive = groups.some(({ isActive }) => isActive);

  const handleUploadFragmentsChange = async (
    ev: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = ev.target.files?.item(0) ?? null;

    if (!file) return;

    const svgText = await getFileContentAsText(file);

    if (!svgText) return;

    const res = parseSvg(svgText);

    setFragments(res.fragments);
    setDecorations(res.decorations);
  };

  const handleUploadFragmentsClick = (
    ev: React.MouseEvent<HTMLInputElement, MouseEvent>
  ) => {
    if (!fragments.length) return;

    const isConfirmed = confirm(
      'If you upload new fragment file, current fragments will be deleted. Continue?'
    );

    if (!isConfirmed) {
      ev.stopPropagation();
      ev.preventDefault();
    }
  };

  const handleUnite = (): void => {
    uniteActive();
  };

  const handleBreak = (): void => {
    breakActive();
  };

  const shouldShowColoring = tab === 1;

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <canvas id={CANVAS_ID} style={{ display: 'none' }} />

      <Grid
        container
        columnSpacing={2}
        sx={{ maxWidth: '600px', marginTop: 3 }}
      >
        <Grid item xs={8}>
          <Tabs value={tab} centered onChange={(_, index) => setTab(index)}>
            <Tab label="Constructor" />
            <Tab label="Coloring" />
            <Tab label="Try out" />
          </Tabs>
        </Grid>

        <Grid item xs={4} />

        <Grid item xs={8}>
          <Box display="flex" justifyContent="center" sx={{ marginTop: 3 }}>
            <Button component="label">
              Upload fragments
              <input
                id="upload-fragments"
                type="file"
                onClick={handleUploadFragmentsClick}
                onChange={handleUploadFragmentsChange}
                hidden
              />
            </Button>

            <Button
              color="warning"
              onClick={() => {
                const isConfirmed = confirm(
                  'Current progress will be deleted. Continue?'
                );

                if (isConfirmed) resetState();
              }}
            >
              Reset
            </Button>
          </Box>
        </Grid>

        <Grid item xs={4} />

        <Grid item xs={8}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <div className="viewport">
              <svg
                viewBox="0 0 100 100"
                onContextMenu={(ev) => ev.preventDefault()}
              >
                {fragmentsDtos.map((fragment) => {
                  const { red, green, blue } = shouldShowColoring
                    ? new paper.Color(coloring[fragment.groupId])
                    : getFragmentColor({
                        isActive: fragment.isActive,
                        isHovered: fragment.isHovered,
                        isActiveNeighbor: fragment.isActiveNeighbor,
                        isReady: fragment.isReady,
                        hasActive,
                      });

                  return (
                    <path
                      d={fragment.data}
                      key={fragment.id}
                      fill={`rgb(${256 * red},${256 * green},${256 * blue})`}
                      onMouseEnter={() => setHoveredGroupId(fragment.groupId)}
                      onMouseLeave={() => setHoveredGroupId(null)}
                      onContextMenu={() => toggleNeighbor(fragment.groupId)}
                      onClick={(event) => {
                        if (event.ctrlKey) {
                          toggleActiveGroupId(fragment.groupId);
                        } else {
                          setActiveGroupId(fragment.groupId);
                        }
                      }}
                    />
                  );
                })}
              </svg>

              {decorations && (
                /** @ts-ignore */
                <SVG
                  src={`<svg>${decorations}</svg>`}
                  style={{ pointerEvents: 'none' }}
                  viewBox="0 0 100 100"
                />
              )}
            </div>

            <div>
              {isSingleSelection && isActiveGroupReady && (
                <Button
                  sx={{ marginRight: 1 }}
                  variant="outlined"
                  onClick={() => toggleIsActiveGroupReady()}
                >
                  Mark as NOT ready
                </Button>
              )}

              {isSingleSelection && !isActiveGroupReady && (
                <Button
                  sx={{ marginRight: 1 }}
                  variant="contained"
                  onClick={() => {
                    toggleIsActiveGroupReady();
                    setActiveGroupId(null);
                  }}
                >
                  Mark as ready
                </Button>
              )}

              {isMultiSelection && (
                <Button
                  sx={{ marginRight: 1 }}
                  onClick={handleUnite}
                  variant="contained"
                >
                  Unite
                </Button>
              )}

              {canBreakActiveGroup && (
                <Button
                  sx={{ marginRight: 1 }}
                  onClick={handleBreak}
                  variant="outlined"
                >
                  Break
                </Button>
              )}
            </div>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Typography>Chromatic number: {chromaticNumber}</Typography>
          <Typography>Groups: {groups.length}</Typography>
        </Grid>
      </Grid>
    </Box>
  );
}
