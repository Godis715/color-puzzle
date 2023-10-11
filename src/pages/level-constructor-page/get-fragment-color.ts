import paper from 'paper';

export const FRAG_DEFAULT_COLOR = new paper.Color('#ECECEC');

function getFragmentColorWhenSelection({
  isActive,
  isHovered,
  isActiveNeighbor,
}: {
  isActive: boolean;
  isHovered: boolean;
  isActiveNeighbor: boolean;
}): paper.Color {
  const color = new paper.Color(FRAG_DEFAULT_COLOR);

  if (isActive) {
    color.red -= 0.5;
    color.green -= 0.4;
  }

  if (isHovered) {
    color.red -= 0.07;
    color.green -= 0.07;
    color.blue -= 0.03;
  }

  if (isActiveNeighbor && !isActive) {
    color.red -= 0.25;
    color.green -= 0.25;
    color.blue -= 0.15;
  }

  return color;
}

function getFragmentColorWhenNoSelection({
  isHovered,
  isReady,
}: {
  isHovered: boolean;
  isReady: boolean;
}): paper.Color {
  const color = new paper.Color(FRAG_DEFAULT_COLOR);

  if (isHovered) {
    color.red -= 0.07;
    color.green -= 0.07;
    color.blue -= 0.03;
  }

  if (isReady) {
    color.red -= 0.05;
    color.blue -= 0.05;
  } else {
    color.green -= 0.05;
    color.blue -= 0.05;
  }

  return color;
}

export function getFragmentColor({
  isActive,
  isHovered,
  isActiveNeighbor,
  isReady,
  hasActive,
}: {
  isActive: boolean;
  isHovered: boolean;
  isActiveNeighbor: boolean;
  isReady: boolean;
  hasActive: boolean;
}): paper.Color {
  return hasActive
    ? getFragmentColorWhenSelection({ isActive, isHovered, isActiveNeighbor })
    : getFragmentColorWhenNoSelection({ isHovered, isReady });
}
