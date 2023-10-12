import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useSelector } from 'react-redux';

import {
  actions,
  selectGroups,
  selectHasSelection,
  selectIsMultiSelection,
  selectIsSingleSelection,
} from 'src/features/level-constructor';
import { useActions } from 'src/shared/hooks';

type Props = {
  groupId: string;
  anchorPosition: { top: number; left: number } | null;
  onClose: VoidFunction;
};

export function ContextMenu(props: Props): JSX.Element {
  const { groupId, anchorPosition, onClose: handleClose } = props;

  const groups = useSelector(selectGroups);
  const hasSelection = useSelector(selectHasSelection);
  const isSingleSelection = useSelector(selectIsSingleSelection);
  const isMultiSelection = useSelector(selectIsMultiSelection);

  const {
    toggleActiveGroupId,
    uniteActive,
    breakActive,
    toggleNeighbor,
    toggleGroupReady,
  } = useActions(actions);

  const group = groups.find(({ id }) => id === groupId);

  if (!group) return <></>;

  const { isActive, isActiveNeighbor, isReady } = group;

  const shouldShowDeselect = isMultiSelection && isActive;

  const shouldShowAddToSelection = hasSelection && !isActive;

  const shouldShowBreak =
    isSingleSelection && isActive && group.fragmentIds.length > 1;

  const shouldShowToggleNeighbor = isSingleSelection && !isActive;

  const shouldShowToggleIsReady =
    !hasSelection || (isSingleSelection && isActive);

  const shouldShowUnite = isMultiSelection && isActive;

  return (
    <Menu
      open={anchorPosition !== null}
      onClose={handleClose}
      onClick={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ?? undefined}
      onContextMenu={(ev) => {
        ev.preventDefault();
        handleClose();
      }}
    >
      {shouldShowAddToSelection && (
        <MenuItem onClick={() => toggleActiveGroupId(groupId)}>
          Add to selection
        </MenuItem>
      )}

      {shouldShowDeselect && (
        <MenuItem onClick={() => toggleActiveGroupId(groupId)}>
          Deselect
        </MenuItem>
      )}

      {shouldShowBreak && (
        <MenuItem onClick={() => breakActive()}>Break</MenuItem>
      )}

      {shouldShowToggleNeighbor && (
        <MenuItem onClick={() => toggleNeighbor(groupId)}>
          {isActiveNeighbor ? 'Mark as not neighbor' : 'Mark as neighbor'}
        </MenuItem>
      )}

      {shouldShowToggleIsReady && (
        <MenuItem onClick={() => toggleGroupReady(groupId)}>
          {isReady ? 'Mark as not ready' : 'Mark as ready'}
        </MenuItem>
      )}

      {shouldShowUnite && (
        <MenuItem onClick={() => uniteActive()}>Unite</MenuItem>
      )}
    </Menu>
  );
}
