import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {
  actions,
  selectGroups,
  selectHasSelection,
  selectIsMultiSelection,
  selectIsSingleSelection,
} from 'features/level-constructor/model';
import { useSelector } from 'react-redux';
import { useActions } from 'shared/hooks';

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
    toggleIsActiveGroupReady,
  } = useActions(actions);

  const group = groups.find(({ id }) => id === groupId);

  if (!group) return <></>;

  const shouldShowDeselect = isMultiSelection && group.isActive;

  const shouldShowAddToSelection = hasSelection && !group.isActive;

  const shouldShowBreak =
    isSingleSelection && group.isActive && group.fragmentIds.length > 1;

  const shouldShowMarkAsNeighbor =
    isSingleSelection && !group.isActiveNeighbor && !group.isActive;

  const shouldShowMarkAsNotNeighbor =
    isSingleSelection && group.isActiveNeighbor;

  const shouldShowMarkAsReady =
    isSingleSelection && !group.isReady && group.isActive;

  const shouldShowMarkAsNotReady =
    isSingleSelection && group.isReady && group.isActive;

  const shouldShowUnite = isMultiSelection && group.isActive;

  console.log(anchorPosition);

  return (
    <Menu
      open={anchorPosition !== null}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ?? undefined}
      onContextMenu={(ev) => {
        ev.preventDefault();
        handleClose();
      }}
    >
      {shouldShowAddToSelection && (
        <MenuItem
          onClick={() => {
            handleClose();
            toggleActiveGroupId(groupId);
          }}
        >
          Add to selection
        </MenuItem>
      )}

      {shouldShowDeselect && (
        <MenuItem
          onClick={() => {
            handleClose();
            toggleActiveGroupId(groupId);
          }}
        >
          Deselect
        </MenuItem>
      )}

      {shouldShowBreak && (
        <MenuItem
          onClick={() => {
            handleClose();
            breakActive();
          }}
        >
          Break
        </MenuItem>
      )}

      {shouldShowMarkAsNeighbor && (
        <MenuItem
          onClick={() => {
            handleClose();
            toggleNeighbor(groupId);
          }}
        >
          Mark as neighbor
        </MenuItem>
      )}

      {shouldShowMarkAsNotNeighbor && (
        <MenuItem
          onClick={() => {
            handleClose();
            toggleNeighbor(groupId);
          }}
        >
          Mark as not neighbor
        </MenuItem>
      )}

      {shouldShowMarkAsReady && (
        <MenuItem
          onClick={() => {
            handleClose();
            toggleIsActiveGroupReady();
          }}
        >
          Mark as ready
        </MenuItem>
      )}

      {shouldShowMarkAsNotReady && (
        <MenuItem
          onClick={() => {
            handleClose();
            toggleIsActiveGroupReady();
          }}
        >
          Mark as not ready
        </MenuItem>
      )}

      {shouldShowUnite && (
        <MenuItem
          onClick={() => {
            handleClose();
            uniteActive();
          }}
        >
          Unite
        </MenuItem>
      )}
    </Menu>
  );
}