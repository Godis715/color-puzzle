import { ListItemText, Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import LockIcon from '@mui/icons-material/Lock';
import DoneIcon from '@mui/icons-material/Done';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { selectLevels } from 'src/features/levels';

export function LevelsListPage(): JSX.Element {
  const levels = useSelector(selectLevels);

  return (
    <div>
      <Typography variant="h2">Levels</Typography>
      <List>
        {levels.map((level) => (
          <ListItemButton
            disabled={!level.isAvailable}
            component={Link}
            to={level.id}
          >
            <ListItemIcon>
              {!level.isAvailable && <LockIcon />}
              {level.isPassed && <DoneIcon color="success" />}
            </ListItemIcon>

            <ListItemText
              primary={`Level ${level.id}`}
              secondary={level.hasProgress ? 'Continue' : null}
            />
          </ListItemButton>
        ))}
      </List>
    </div>
  );
}
