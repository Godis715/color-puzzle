import { useSelector } from 'react-redux';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import {
  selectGroups,
  selectIsActiveGroupReady,
  selectIsSingleSelection,
  selectHasSelection,
  selectIsMultiSelection,
  selectActiveGroupsIds,
} from 'src/features/level-constructor';

export function EditorInfoPanel(): JSX.Element {
  const groups = useSelector(selectGroups);
  const isActiveGroupReady = useSelector(selectIsActiveGroupReady);
  const isSingleSelection = useSelector(selectIsSingleSelection);
  const isMultiSelection = useSelector(selectIsMultiSelection);
  const hasSelection = useSelector(selectHasSelection);
  const activeGroupsIds = useSelector(selectActiveGroupsIds);

  const activeNeighborsIds = groups.filter((group) => group.isActiveNeighbor);

  const readyCount = groups.filter((group) => group.isReady).length;
  const notReadyCount = groups.length - readyCount;

  return (
    <Stack spacing={2}>
      {!hasSelection && (
        <Typography>
          {groups.length} fragments in total
          <br />
          {readyCount} <code className="ready-fragment">ready</code> fragments
          <br />
          {notReadyCount} <code className="not-ready-fragment">not ready</code>{' '}
          fragments
        </Typography>
      )}

      {hasSelection && (
        <Typography>
          Selected {activeGroupsIds.length}&nbsp;
          <code className="selected-fragment">fragments</code> with{' '}
          {activeNeighborsIds.length}{' '}
          <code className="neighbors">neighbor</code>
        </Typography>
      )}

      {!hasSelection && (
        <Typography>
          <code>Click</code> &mdash; select fragment
        </Typography>
      )}

      {!isMultiSelection && (
        <Typography>
          <code>Ctrl+Click</code> &mdash; select multiple fragments
        </Typography>
      )}

      {isSingleSelection && (
        <Typography>
          <code>Alt+Left Click</code> &mdash; mark fragment as neighbor
        </Typography>
      )}

      {isSingleSelection && !isActiveGroupReady && (
        <Typography>
          Fragment is <code className="not-ready-fragment">not ready</code>.
          When done, mark it as ready in context menu &mdash;{' '}
          <code>Right Click</code>
        </Typography>
      )}

      {isSingleSelection && isActiveGroupReady && (
        <Typography>
          Fragment is <code className="ready-fragment"> ready</code>
        </Typography>
      )}

      {isMultiSelection && (
        <Typography>
          <code>Ctrl+G</code> &mdash; unite selected fragments
        </Typography>
      )}

      {hasSelection && (
        <Typography>
          <code>Esc</code> &mdash; drop selection
        </Typography>
      )}
    </Stack>
  );
}
