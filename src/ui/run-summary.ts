import { Boss, Breeds } from '../world/breeds';
import type { Game } from '../world/game';
import { MEMENTO_TOTAL } from '../world/items';

const BREEDS_PER_LINE = 3;

/** Monster counts in a stable breed order, split into lines that fit the end screens. */
export function defeatedMonsterLines(game: Game): string[] {
  const breeds = [...Object.values(Breeds), Boss];
  const entries = breeds.flatMap((breed) => {
    const count = game.defeatedMonsters.get(breed.id) ?? 0;
    return count > 0 ? [`${breed.name} ×${count}`] : [];
  });
  if (entries.length === 0) return ['нікого'];

  const lines: string[] = [];
  for (let i = 0; i < entries.length; i += BREEDS_PER_LINE) {
    lines.push(entries.slice(i, i + BREEDS_PER_LINE).join(' · '));
  }
  return lines;
}

export function mementoSummary(game: Game): string {
  const count = game.hero.mementos.length;
  return `якорі ${count}/${MEMENTO_TOTAL}${game.hero.mementoDefenseBonus ? ' · спокій знайдено' : ''}`;
}
