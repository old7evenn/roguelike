type InventoryItemId = 'tea' | 'cocoa' | 'pencil' | 'flashlight' | 'diary' | 'sweater' | 'blanket';
export type MementoId = 'paperCrane' | 'fadedPhoto' | 'homeKey';
export type ItemId = InventoryItemId | MementoId;

interface ItemTypeBase {
  readonly id: ItemId;
  /** Shown to the player, so it is Ukrainian; always used in the nominative case. */
  readonly name: string;
}

interface InventoryItemTypeBase extends ItemTypeBase {
  /** Relative chance to be picked among the items allowed at a depth. */
  readonly frequency: number;
  /** The shallowest depth where this item can appear. */
  readonly minDepth: number;
}

export type PotionType = InventoryItemTypeBase & { readonly kind: 'potion'; readonly heal: number };
export type WeaponType = InventoryItemTypeBase & { readonly kind: 'weapon'; readonly attackBonus: number };
export type ArmorType = InventoryItemTypeBase & { readonly kind: 'armor'; readonly defenseBonus: number };
export type InventoryItemType = PotionType | WeaponType | ArmorType;
export type MementoType = ItemTypeBase & {
  readonly kind: 'memento';
  readonly depth: number;
  readonly memory: string;
};

/**
 * Type Object pattern, like `Breed`: an item has no state of its own, so the
 * inventory and memento collection hold these shared objects. `kind` tells what
 * picking one up or using it does.
 */
export type ItemType = InventoryItemType | MementoType;

// `satisfies` instead of a type annotation keeps each entry's own kind, so
// `ItemTypes.pencil.attackBonus` type-checks.
export const ItemTypes = {
  tea: { id: 'tea', kind: 'potion', name: 'чашка чаю', heal: 6, frequency: 4, minDepth: 1 },
  cocoa: { id: 'cocoa', kind: 'potion', name: 'гаряче какао', heal: 14, frequency: 2, minDepth: 4 },
  pencil: { id: 'pencil', kind: 'weapon', name: 'олівець', attackBonus: 1, frequency: 1, minDepth: 1 },
  flashlight: {
    id: 'flashlight',
    kind: 'weapon',
    name: 'ліхтарик',
    attackBonus: 2,
    frequency: 1,
    minDepth: 3,
  },
  diary: { id: 'diary', kind: 'weapon', name: 'щоденник', attackBonus: 4, frequency: 1, minDepth: 6 },
  sweater: { id: 'sweater', kind: 'armor', name: 'светр', defenseBonus: 1, frequency: 1, minDepth: 5 },
  blanket: { id: 'blanket', kind: 'armor', name: 'ковдра', defenseBonus: 2, frequency: 1, minDepth: 9 },
} as const satisfies Record<InventoryItemId, InventoryItemType>;

/** Optional side quest: one personal anchor waits on each of these floors. */
export const Mementos = {
  paperCrane: {
    id: 'paperCrane',
    kind: 'memento',
    name: 'паперовий журавлик',
    depth: 3,
    memory: 'На крилі написано: «Дихай».',
  },
  fadedPhoto: {
    id: 'fadedPhoto',
    kind: 'memento',
    name: 'вицвіла світлина',
    depth: 6,
    memory: 'На звороті: «Ти не сам».',
  },
  homeKey: {
    id: 'homeKey',
    kind: 'memento',
    name: 'ключ від дому',
    depth: 9,
    memory: 'Холодний метал нагадує: тобі є куди повернутися.',
  },
} as const satisfies Record<MementoId, MementoType>;

export const MEMENTO_TOTAL = Object.keys(Mementos).length;
export const MEMENTO_DEFENSE_BONUS = 1;

export function itemsForDepth(depth: number): InventoryItemType[] {
  return Object.values(ItemTypes).filter((item) => item.minDepth <= depth);
}

export function mementoForDepth(depth: number): MementoType | undefined {
  return Object.values<MementoType>(Mementos).find((memento) => memento.depth === depth);
}
