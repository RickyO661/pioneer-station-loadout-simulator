import type { AttributeSet, BuildResult, GameClass, Item, Loadout } from '../types/game';
import { RULES } from './config.ts';
import { evaluateRequirement } from './requirements.ts';

export const EMPTY_ATTRIBUTES: AttributeSet = { deftness: 0, power: 0, stamina: 0, strength: 0, vitality: 0, commerce: 0, leadership: 0, technical: 0, vehicle: 0 };
/** Configurable Vitality hook. Current zone files describe the effect but do not define its formula. */
export function calculateHP(classBaseHp: number, vitality: number): number {
  return classBaseHp + vitality * RULES.hp.vitalityHpPerPoint;
}
export function calculateBuild(loadout: Loadout, classes: GameClass[], items: Item[]): BuildResult {
  const gameClass = classes.find(c => c.id === loadout.classId) ?? classes[0];
  const entries = loadout.entries.flatMap(entry => { const item = items.find(i => i.id === entry.itemId); return item ? [{ ...entry, item, stackKg: entry.quantity * item.weightKg, eligibility: evaluateRequirement(item.requirement, gameClass, loadout.attributes) }] : []; });
  const loadKg = entries.reduce((sum, entry) => sum + entry.stackKg, 0);
  const maxCarryKg = gameClass.baseCarryKg + loadout.attributes.strength * RULES.carry.strengthKgPerPoint;
  return { classBaseHp: gameClass.baseHp, finalHp: calculateHP(gameClass.baseHp, loadout.attributes.vitality), maxCarryKg, loadKg, remainingKg: maxCarryKg - loadKg, percentUsed: maxCarryKg ? loadKg / maxCarryKg * 100 : 0, entries };
}
export function armorDefense(ignoreRaw: number, protectionRaw: number) { const scale = RULES.armor.valueScale; const ignore = ignoreRaw / scale; const protection = protectionRaw / scale; const through = (1 - ignore) * (1 - protection); return { ignore, protection, through, reduction: 1 - through }; }
