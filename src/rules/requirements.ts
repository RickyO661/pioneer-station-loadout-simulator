import type { AttributeKey, AttributeSet, Eligibility, GameClass, ItemRequirement } from '../types/game';

const attributes: Record<string, AttributeKey> = { '12': 'strength', '13': 'vitality', '14': 'vehicle', '15': 'deftness', '16': 'technical', '17': 'leadership', '18': 'power', '19': 'commerce', '20': 'stamina' };
const title = (key: string) => key[0].toUpperCase() + key.slice(1);

export function parseRequirement(rawExpression: string): ItemRequirement {
  const raw = rawExpression ?? '';
  const minimumAttributes: Partial<AttributeSet> = {};
  for (const match of raw.matchAll(/-(12|13|14|15|16|17|18|19|20)(\d{2,3})/g)) {
    const key = attributes[match[1]]; minimumAttributes[key] = Number(match[2]);
  }
  const allowed = new Set<number>(); const blocked = new Set<number>();
  for (const match of raw.matchAll(/(!?)\(?([0-9]+(?:\|[0-9]+)*)\)?/g)) {
    if (match.index !== undefined && ['-', '%'].includes(raw[match.index - 1])) continue;
    const values = match[2].split('|').map(Number).filter(n => n > 0 && n < 100);
    for (const value of values) (match[1] === '!' ? blocked : allowed).add(value);
  }
  return { rawExpression: raw, allowedClassIds: allowed.size ? [...allowed] : undefined, blockedClassIds: blocked.size ? [...blocked] : undefined, minimumAttributes, hasUnverifiedGate: /[@#%]/.test(raw) || /[^\d|()!&\-]/.test(raw) };
}

export function evaluateRequirement(requirement: ItemRequirement, gameClass: GameClass, attrs: AttributeSet): Eligibility {
  const messages: string[] = [];
  if (requirement.allowedClassIds && !requirement.allowedClassIds.includes(gameClass.id)) messages.push(`Restricted to ${requirement.allowedClassIds.join(', ')} class IDs`);
  if (requirement.blockedClassIds?.includes(gameClass.id)) messages.push(`Not available to ${gameClass.name}`);
  for (const [key, minimum] of Object.entries(requirement.minimumAttributes)) if (attrs[key as AttributeKey] < minimum!) messages.push(`Requires ${title(key)} ${minimum}+`);
  const warnings = requirement.hasUnverifiedGate ? ['Has an additional game requirement not evaluated by the simulator'] : [];
  return { eligible: messages.length === 0, messages, warnings };
}

export function humanizeRequirement(requirement: ItemRequirement, classes: GameClass[]): string[] {
  const classNames = (ids?: number[]) => ids?.map(id => classes.find(c => c.id === id)?.name).filter(Boolean).join(' / ');
  const lines: string[] = [];
  if (requirement.allowedClassIds) lines.push(`Restricted to ${classNames(requirement.allowedClassIds)}`);
  if (requirement.blockedClassIds) lines.push(`Not available to ${classNames(requirement.blockedClassIds)}`);
  Object.entries(requirement.minimumAttributes).forEach(([key, value]) => lines.push(`Requires ${title(key)} ${value}+`));
  return lines;
}
