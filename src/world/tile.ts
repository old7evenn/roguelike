export type TileName = 'wall' | 'floor' | 'stairsDown';

/**
 * Type Object pattern: each cell references a shared, immutable tile type
 * instead of a magic number. New tiles (doors, water) are new entries, not new branches.
 */
export interface TileType {
  readonly name: TileName;
  readonly isWalkable: boolean;
  readonly isExit: boolean;
}

export const Tiles: Readonly<Record<TileName, TileType>> = {
  wall: { name: 'wall', isWalkable: false, isExit: false },
  floor: { name: 'floor', isWalkable: true, isExit: false },
  stairsDown: { name: 'stairsDown', isWalkable: true, isExit: true },
};
