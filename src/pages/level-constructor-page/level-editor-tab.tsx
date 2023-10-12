/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import paper from 'paper';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import { useActions } from 'src/shared/hooks';
import {
  actions,
  selectFragments,
  selectDecorations,
  selectGroups,
  Decorations,
  Fragment,
  selectMapFragmentIdToGroupId,
} from 'src/features/level-constructor';

import { getFragmentColor } from './get-fragment-color';
import { LevelRenderer } from './level-renderer';
import { ContextMenu } from './context-menu';
import { InfoPanel } from './info-panel';
import './style.scss';

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

export function LevelEditorTab(): JSX.Element {
  const {
    setActiveGroupId,
    toggleActiveGroupId,
    toggleNeighbor,
    setFragments,
    setDecorations,
    setHoveredGroupId,
    uniteActive,
    reset: resetState,
  } = useActions(actions);

  const [contextMenu, setContextMenu] = useState<{
    id: string;
    position: { top: number; left: number };
  } | null>(null);

  const fragments = useSelector(selectFragments);
  const decorations = useSelector(selectDecorations);
  const groups = useSelector(selectGroups);
  const mapFragmentIdToGroupId = useSelector(selectMapFragmentIdToGroupId);

  useEffect(() => {
    const listener = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') setActiveGroupId(null);
      else if (ev.key === 'g' && ev.ctrlKey) {
        ev.preventDefault();
        ev.stopPropagation();
        uniteActive();
      }
    };

    document.addEventListener('keydown', listener);

    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, []);

  const getGroupId = (fragmentId: string) => mapFragmentIdToGroupId[fragmentId];

  useEffect(() => {
    paper.setup(CANVAS_ID);
    return () => paper.project.clear();
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

  const handleReset = (): void => {
    const isConfirmed = confirm('Current progress will be deleted. Continue?');

    if (isConfirmed) resetState();
  };

  const getGroupColorById = (groupId: string): string => {
    const group = groups.find(({ id }) => id === groupId);

    if (!group) return '';

    const { red, green, blue } = getFragmentColor({
      isActive: group.isActive,
      isHovered: group.isHovered || groupId === contextMenu?.id,
      isActiveNeighbor: group.isActiveNeighbor,
      isReady: group.isReady,
      hasActive,
    });

    return `rgb(${256 * red},${256 * green},${256 * blue})`;
  };

  return (
    <>
      <canvas id={CANVAS_ID} style={{ display: 'none' }} />

      <Grid item xs={8}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <ContextMenu
            groupId={contextMenu?.id ?? ''}
            anchorPosition={contextMenu?.position ?? null}
            onClose={() => setContextMenu(null)}
          />

          <LevelRenderer
            fragments={fragments}
            decorations={decorations}
            getFragmentGroupId={getGroupId}
            onGroupHover={setHoveredGroupId}
            onGroupClick={(groupId, event) => {
              if (event.ctrlKey) toggleActiveGroupId(groupId);
              else if (event.altKey) toggleNeighbor(groupId);
              else setActiveGroupId(groupId);
            }}
            onGroupContextMenu={(groupId, position) => {
              setContextMenu({ id: groupId, position });
            }}
            getGroupColor={getGroupColorById}
          />

          <Box
            display="flex"
            justifyContent="center"
            flexWrap="wrap"
            sx={{ marginTop: 2 }}
          >
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

            <Button color="warning" onClick={handleReset}>
              Reset
            </Button>
          </Box>
        </Box>
      </Grid>

      <Grid item xs={4}>
        <InfoPanel />
      </Grid>
    </>
  );
}
