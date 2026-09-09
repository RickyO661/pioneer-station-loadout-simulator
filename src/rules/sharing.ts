import type { AttributeSet, GameClass, Item, Loadout } from '../types/game';

export interface SharedBuild {
  version: 1;
  name: string;
  loadout: Loadout;
}

const attributeKeys = ['deftness', 'power', 'stamina', 'strength', 'vitality', 'commerce', 'leadership', 'technical', 'vehicle'] as const;

function isAttributeSet(value: unknown): value is AttributeSet {
  if (!value || typeof value !== 'object') return false;
  return attributeKeys.every(key => typeof (value as Record<string, unknown>)[key] === 'number' && Number.isFinite((value as Record<string, number>)[key]) && (value as Record<string, number>)[key] >= 0);
}

export function isUsableLoadout(value: unknown, classes: GameClass[], items: Item[]): value is Loadout {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Loadout>;
  return typeof candidate.classId === 'number'
    && classes.some(gameClass => gameClass.id === candidate.classId)
    && isAttributeSet(candidate.attributes)
    && Array.isArray(candidate.entries)
    && candidate.entries.every(entry => entry && typeof entry.entryId === 'string' && typeof entry.itemId === 'number' && items.some(item => item.id === entry.itemId) && typeof entry.quantity === 'number' && Number.isFinite(entry.quantity) && entry.quantity > 0);
}

/** Creates the portable text-file format used by the download/import controls. */
export function serializeSharedBuild(name: string, loadout: Loadout): string {
  return JSON.stringify({ version: 1, name: name.trim() || 'Pioneer Station build', loadout }, null, 2);
}

/** Parses an exported build only when every referenced class, item, and stat is known locally. */
export function parseSharedBuild(serialized: string, classes: GameClass[], items: Item[]): SharedBuild | null {
  try {
    const candidate = JSON.parse(serialized) as Partial<SharedBuild> | Loadout;
    const envelope = 'loadout' in candidate ? candidate as Partial<SharedBuild> : { version: 1 as const, name: 'Imported build', loadout: candidate as Loadout };
    if (envelope.version !== 1 || typeof envelope.name !== 'string' || !isUsableLoadout(envelope.loadout, classes, items)) return null;
    return { version: 1, name: envelope.name.trim() || 'Imported build', loadout: structuredClone(envelope.loadout) };
  } catch {
    return null;
  }
}
