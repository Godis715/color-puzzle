/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import paper from 'paper';
import { saveAs } from 'file-saver';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

import { useActions } from 'src/shared/hooks';
import {
  actions,
  selectFragments,
  selectDecorations,
  selectGroups,
  Decorations,
  Fragment,
  selectMapFragmentIdToGroupId,
  selectLevelJson,
  selectGrouping,
} from 'src/features/level-constructor';

import { getFragmentColor } from './get-fragment-color';
import { LevelRenderer } from './level-renderer';
import { ContextMenu } from './context-menu';
import { EditorInfoPanel } from './editor-info-panel';

import './style.scss';
import { getPathsAdjacencyList } from 'src/features/level-constructor/lib/get-paths-adjacency';
import { UndirectedGraph } from 'src/features/level-constructor/lib/undirected-graph';

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
    setNeighbors,
    restoreState,
    reset: resetState,
  } = useActions(actions);

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    id: string;
    position: { top: number; left: number };
  } | null>(null);

  const fragments = useSelector(selectFragments);
  const decorations = useSelector(selectDecorations);
  const groups = useSelector(selectGroups);
  const mapFragmentIdToGroupId = useSelector(selectMapFragmentIdToGroupId);
  const levelJson = useSelector(selectLevelJson);
  const grouping = Object.fromEntries(useSelector(selectGrouping));

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

    resetState();
    setFragments(res.fragments);
    setDecorations(res.decorations);
  };

  const getGroupColorById = (groupId: string): string => {
    const group = groups.find(({ id }) => id === groupId);

    if (!group) return '';

    return getFragmentColor({
      isActive: group.isActive,
      isHovered: group.isHovered || groupId === contextMenu?.id,
      isActiveNeighbor: group.isActiveNeighbor,
      isReady: group.isReady,
      hasActive,
    });
  };

  const handleDownloadLevelClick = (): void => {
    const blob = new Blob([levelJson], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'level.json');
  };

  const handleUploadLevelClick = async (
    ev: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = ev.target.files?.item(0) ?? null;

    if (!file) return;

    const newLevelJson = await getFileContentAsText(file);

    if (!newLevelJson) return;

    const level = JSON.parse(newLevelJson);

    resetState();
    restoreState(level);
  };

  const handleAutogenClick = (): void => {
    if (!fragments) return;

    const paths = fragments.map((fragment) => {
      const path = paper.project.importSVG(`<path d="${fragment.data}" />`, {
        insert: false,
      }) as paper.PathItem;

      path.name = fragment.id;

      return path;
    });

    const pathsAdjacency = getPathsAdjacencyList(paths, 0.5, 0.6);

    if (pathsAdjacency.error) {
      console.error(pathsAdjacency.error);
      return;
    }

    const groupNeighbors: UndirectedGraph = [];

    Object.entries(pathsAdjacency.value).map(([pathName, adjacentPaths]) =>
      adjacentPaths.forEach((adjPathName) => {
        const groupId = grouping[pathName];
        const adjGroupId = grouping[adjPathName];
        groupNeighbors.push([groupId, adjGroupId]);
      })
    );

    setNeighbors(groupNeighbors);
  };

  return (
    <>
      <canvas id={CANVAS_ID} style={{ display: 'none' }} />

      <Dialog
        open={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
      >
        <DialogTitle>Reset progress?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            If you upload new file, current progress will be discarded
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button component="label">
            Continue
            <input
              id="upload-fragments"
              type="file"
              onChange={(ev) => {
                handleUploadFragmentsChange(ev);
                setIsUploadDialogOpen(false);
              }}
              hidden
            />
          </Button>
          <Button onClick={() => setIsUploadDialogOpen(false)} autoFocus>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
      >
        <DialogTitle>Reset progress?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            This action cannot be undone
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            component="label"
            onClick={() => {
              resetState();
              setIsResetDialogOpen(false);
            }}
          >
            Reset
          </Button>
          <Button onClick={() => setIsResetDialogOpen(false)} autoFocus>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

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
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              Upload fragments
            </Button>

            <Button color="warning" onClick={() => setIsResetDialogOpen(true)}>
              Reset
            </Button>

            <Button onClick={handleDownloadLevelClick}>Download level</Button>

            <Button component="label">
              Upload level
              <input
                id="upload-level"
                type="file"
                onChange={handleUploadLevelClick}
                hidden
              />
            </Button>

            <Button onClick={handleAutogenClick}>Autogen</Button>
          </Box>
        </Box>
      </Grid>

      <Grid item xs={4}>
        <EditorInfoPanel />
      </Grid>
    </>
  );
}
