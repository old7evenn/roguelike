export type ItemId = 'tea' | 'cocoa' | 'pencil' | 'flashlight' | 'diary';

interface ItemTypeBase {
  readonly id: ItemId;
  /** Shown to the player, so it is Ukrainian; always used in the nominative case. */
  readonly name: string;
  /** Relative chance to be picked among the items allowed at a depth. */
  readonly frequency: number;
  /** The shallowest depth where this item can appear. */
  readonly minDepth: number;
}

export type PotionType = ItemTypeBase & { readonly kind: 'potion'; readonly heal: number };
export type WeaponType = ItemTypeBase & { readonly kind: 'weapon'; readonly attackBonus: number };

/**
 * Type Object pattern, like `Breed`: an item has no state of its own, so the
 * inventory simply holds these shared objects. `kind` tells what using it does.
 */
export type ItemType = PotionType | WeaponType;

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
} as const satisfies Record<ItemId, ItemType>;

export function itemsForDepth(depth: number): ItemType[] {
  return Object.values<ItemType>(ItemTypes).filter((item) => item.minDepth <= depth);
}
