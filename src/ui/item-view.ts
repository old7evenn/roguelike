import type { ItemType } from '../world/items';

/** The item's name with what it does, e.g. «чашка чаю (+6 HP)». */
export function describeItem(item: ItemType): string {
  switch (item.kind) {
    case 'potion':
      return `${item.name} (+${item.heal} HP)`;
    case 'weapon':
      return `${item.name} (+${item.attackBonus} до атаки)`;
    case 'armor':
      return `${item.name} (+${item.defenseBonus} до захисту)`;
  }
}
