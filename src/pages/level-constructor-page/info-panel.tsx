import { useSelector } from 'react-redux';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import {
  selectGroups,
  selectIsActiveGroupReady,
  selectIsSingleSelection,
} from 'src/features/level-constructor';
import {
  selectHasSelection,
  selectIsMultiSelection,
} from 'src/features/level-constructor/model';

export function InfoPanel(): JSX.Element {
  const groups = useSelector(selectGroups);
  const isActiveGroupReady = useSelector(selectIsActiveGroupReady);
  const isSingleSelection = useSelector(selectIsSingleSelection);
  const isMultiSelection = useSelector(selectIsMultiSelection);
  const hasSelection = useSelector(selectHasSelection);

  return (
    <Stack spacing={2}>
      <Typography>Fragments: {groups.length}</Typography>

      {isSingleSelection && <Typography>Selected 1 fragment</Typography>}

      {isMultiSelection && <Typography>Selected multiple fragments</Typography>}

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

      <Typography>
        <code>Right Click</code> &mdash; context menu
      </Typography>

      {isSingleSelection && (
        <Typography>
          <code>Alt+Left Click</code> &mdash; mark fragment as{' '}
          <code className="neighbors">neighbor</code> of{' '}
          <code className="selected-fragment">selected</code> fragment
        </Typography>
      )}

      {isMultiSelection && (
        <Typography>
          <code>Ctrl+G</code> &mdash; unite selected fragments
        </Typography>
      )}

      {isSingleSelection && !isActiveGroupReady && (
        <Typography>
          When done, mark fragment as ready in context menu
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
