export type Grouping = [string, string][];

export function generateGroupName() {
  return Math.random().toString();
}

export function uniteGroups(
  grouping: Grouping,
  groups: string[],
  newGroupName: string
): [string, string][] {
  return grouping.map(([id, group]) =>
    groups.includes(group) ? [id, newGroupName] : [id, group]
  );
}

export function breakGroup(
  grouping: Grouping,
  group: string
): [string, string][] {
  return grouping.map(([id, g]) => (g === group ? [id, id] : [id, g]));
}

export function createGrouping(ids: string[]): Grouping {
  return ids.map((id) => [id, id]);
}
