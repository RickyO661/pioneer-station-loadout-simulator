import type { ArmorStats, AttributeCostRules, AttributeDefinition, AttributeSet, BuildResult, GameClass, Item, Loadout, SuitModifiers } from '../types/game';
import { RULES } from './config.ts';
import { evaluateRequirement } from './requirements.ts';

export const EMPTY_ATTRIBUTES: AttributeSet = { deftness: 0, power: 0, stamina: 0, strength: 0, vitality: 0, commerce: 0, leadership: 0, technical: 0, vehicle: 0 };
/** Configurable Vitality hook. Current zone files describe the effect but do not define its formula. */
export function calculateHP(classBaseHp: number, vitality: number): number {
  return classBaseHp + vitality * RULES.hp.vitalityHpPerPoint;
}
/** Pioneer Station AttributeCostMethod=1, confirmed against in-game purchase costs. */
export function calculateAttributePurchaseCost(attribute: AttributeDefinition, nextLevel: number, rules: AttributeCostRules): number {
  if (rules.method !== 1 || nextLevel < 1) return 0;
  return Math.floor((attribute.baseCost + rules.baseCost) * Math.pow(nextLevel, rules.countPower));
}
export function calculateExperiencePlan(current: AttributeSet, target: AttributeSet, attributes: AttributeDefinition[], rules: AttributeCostRules) {
  const byKey = new Map(attributes.map(attribute => [attribute.key, attribute]));
  const costs = (Object.keys(target) as Array<keyof AttributeSet>).map(key => {
    const attribute = byKey.get(key);
    const from = Math.max(0, current[key]);
    const to = Math.max(0, target[key]);
    const cost = attribute && to > from ? Array.from({ length: to - from }, (_, index) => calculateAttributePurchaseCost(attribute, from + index + 1, rules)).reduce((sum, value) => sum + value, 0) : 0;
    return { key, name: attribute?.name ?? key, from, to, cost };
  });
  return { costs, totalCost: costs.reduce((sum, entry) => sum + entry.cost, 0) };
}
export function calculateBuild(loadout: Loadout, classes: GameClass[], items: Item[]): BuildResult {
  const gameClass = classes.find(c => c.id === loadout.classId) ?? classes[0];
  const entries = loadout.entries.flatMap(entry => { const item = items.find(i => i.id === entry.itemId); return item ? [{ ...entry, item, stackKg: entry.quantity * item.weightKg, eligibility: evaluateRequirement(item.requirement, gameClass, loadout.attributes) }] : []; });
  const loadKg = entries.reduce((sum, entry) => sum + entry.stackKg, 0);
  const maxCarryKg = gameClass.baseCarryKg + loadout.attributes.strength * RULES.carry.strengthKgPerPoint;
  return { classBaseHp: gameClass.baseHp, finalHp: calculateHP(gameClass.baseHp, loadout.attributes.vitality), maxCarryKg, loadKg, remainingKg: maxCarryKg - loadKg, percentUsed: maxCarryKg ? loadKg / maxCarryKg * 100 : 0, entries };
}
export function calculateArmorChannelTotals(entries: Array<{ armor?: ArmorStats; quantity: number }>) {
  return RULES.armor.damageChannels.map((name, index) => {
    const raw = entries.reduce((total, entry) => {
      const channel = entry.armor?.channels[index];
      return { ignoreRaw: total.ignoreRaw + (channel?.ignoreRaw ?? 0) * entry.quantity, protectionRaw: total.protectionRaw + (channel?.protectionRaw ?? 0) * entry.quantity };
    }, { ignoreRaw: 0, protectionRaw: 0 });
    return { name, ignore: raw.ignoreRaw / RULES.armor.ignoreScale, protection: raw.protectionRaw / RULES.armor.protectionScale };
  });
}
export function calculateSuitEffects(entries: Array<{ suitModifiers?: SuitModifiers; quantity: number }>) {
  const initial: SuitModifiers = { energyRateRaw: 0, speedRaw: 0, hyperSpeedRaw: 0, thrustRaw: 0, rotationRaw: 0 };
  const raw = entries.reduce((total, entry) => {
    const modifiers = entry.suitModifiers;
    if (!modifiers) return total;
    (Object.keys(total) as Array<keyof SuitModifiers>).forEach(key => { total[key] += modifiers[key] * entry.quantity; });
    return total;
  }, initial);
  return Object.fromEntries((Object.keys(raw) as Array<keyof SuitModifiers>).map(key => [key, raw[key] / RULES.suitEffects.rawScale])) as Record<keyof SuitModifiers, number>;
}
