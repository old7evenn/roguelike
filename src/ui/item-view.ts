import type { ItemType } from '../world/items';

/** The item's name with what it does, e.g. «чашка чаю (+6 HP)». */
export function describeItem(item: ItemType): string {
  return item.kind === 'potion'
    ? `${item.name} (+${item.heal} HP)`
    : `${item.name} (+${item.attackBonus} до атаки)`;
}
