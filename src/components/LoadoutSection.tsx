import { useMemo, useState } from 'react';
import type { AttributeSet, GameClass, Item, ItemCategory, LoadoutEntry } from '../types/game';
import { RULES } from '../rules/config';
import { evaluateRequirement, humanizeRequirement } from '../rules/requirements';

interface Props { title: string; category: ItemCategory; items: Item[]; entries: Array<LoadoutEntry & { item: Item; stackKg: number; stackPrice: number; eligibility: { eligible: boolean; messages: string[] } }>; gameClass: GameClass; attributes: AttributeSet; classes: GameClass[]; onAdd: (id: number) => void; onQuantity: (entryId: string, quantity: number) => void; onRemove: (entryId: string) => void; }

const formatSigned = (value: number) => `${value > 0 ? '+' : ''}${value}`;

function ItemEffects({ item }: { item: Item }) {
  const armorEffects = item.armor?.channels.flatMap((channel, index) => {
    const ignore = channel.ignoreRaw / RULES.armor.ignoreScale;
    const protection = channel.protectionRaw / RULES.armor.protectionScale;
    if (!ignore && !protection) return [];
    return [{ label: RULES.armor.damageChannels[index], value: `${ignore ? `Ignore ${formatSigned(ignore)}` : ''}${ignore && protection ? ' · ' : ''}${protection ? `Protection ${formatSigned(protection)}%` : ''}` }];
  }) ?? [];
  const energyRate = (item.suitModifiers?.energyRateRaw ?? 0) / RULES.suitEffects.rawScale;
  const projectileEffects = item.projectile?.channels.flatMap((channel, index) => {
    const inner = channel.innerRaw / RULES.projectile.damageScale;
    const outer = channel.outerRaw / RULES.projectile.damageScale;
    const blastRadius = channel.blastRadiusRaw * RULES.projectile.blastRadiusMetersPerRaw;
    if (!inner && !outer && !blastRadius) return [];
    return [{ label: RULES.armor.damageChannels[index], value: `Inner ${inner.toFixed(2)} · Outer ${outer.toFixed(2)} · Blast ${blastRadius.toFixed(2)} m` }];
  }) ?? [];
  const effects = [
    ...armorEffects,
    ...(energyRate ? [{ label: 'Energy rate', value: `${formatSigned(energyRate)} kJ/s` }] : []),
    ...projectileEffects,
    ...(item.consumable?.energyRestored ? [{ label: 'Restores energy', value: `${item.consumable.energyRestored}` }] : []),
    ...(item.consumable?.healthRestoredPercent ? [{ label: 'Restores HP', value: `${item.consumable.healthRestoredPercent}% max HP` }] : [])
  ];
  if (!effects.length) return null;
  return <div className="item-effects" aria-label={`${item.name} effects`}>
    {effects.map(effect => <span className="item-effect" key={`${effect.label}-${effect.value}`}><b>{effect.label}</b>{effect.value}</span>)}
  </div>;
}

export function LoadoutSection({ title, category, items, entries, gameClass, attributes, classes, onAdd, onQuantity, onRemove }: Props) {
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'name' | 'price' | 'weight'>('name');
  const available = useMemo(() => items.filter(item => item.category === category && `${item.name} ${item.sourceCategory} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b) => sort === 'price' ? a.price - b.price || a.name.localeCompare(b.name) : sort === 'weight' ? a.weightKg - b.weightKg || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)), [items, category, query, sort]);
  const selectedItem = items.find(item => item.id === Number(selected));
  const selectedEligibility = selectedItem && evaluateRequirement(selectedItem.requirement, gameClass, attributes);
  const selectedRules = selectedItem ? humanizeRequirement(selectedItem.requirement, classes) : [];
  return <section className="loadout-section"><div className="section-heading"><h2>{title}</h2><div className="item-browser"><input aria-label={`Search ${title}`} value={query} placeholder={`Search ${title.toLowerCase()}...`} onChange={event => setQuery(event.target.value)}/><select aria-label={`Sort ${title}`} value={sort} onChange={event => setSort(event.target.value as typeof sort)}><option value="name">Sort: name</option><option value="price">Sort: lowest price</option><option value="weight">Sort: lightest</option></select><div className="add-row"><select aria-label={`Add ${title}`} value={selected} onChange={e => setSelected(e.target.value)}><option value="">Select {title}</option>{available.map(item => <option key={item.id} value={item.id}>{item.name} · {item.weightKg.toFixed(3)} kg · Price {item.price.toLocaleString()}</option>)}</select><button disabled={!selected} onClick={() => { onAdd(Number(selected)); setSelected(''); }}>Add</button></div></div></div>
    {selectedItem && <div className={`add-requirements ${selectedEligibility?.eligible ? 'ready' : 'blocked'}`}><b>{selectedEligibility?.eligible ? 'READY TO ADD' : 'REQUIREMENTS NEEDED'}</b>{selectedRules.length ? selectedRules.map(rule => <span key={rule}>{rule}</span>) : <span>No class or attribute requirement.</span>}{selectedEligibility?.messages.map(message => <span key={message}>{message} — adjust Class or Attributes above.</span>)}</div>}
    {entries.length === 0 ? <p className="empty">No {title.toLowerCase()} selected.</p> : <div className="entries">{entries.map(entry => { const rules = humanizeRequirement(entry.item.requirement, classes); return <article className={`entry ${entry.eligibility.eligible ? 'ready' : 'blocked'}`} key={entry.entryId}><div className="entry-name"><strong>{entry.item.name}</strong><span>{entry.item.sourceCategory}</span>{entry.item.description && <small>{entry.item.description}</small>}<ItemEffects item={entry.item}/></div><label>Qty<input aria-label={`Quantity for ${entry.item.name}`} type="number" min="1" value={entry.quantity} onChange={e => onQuantity(entry.entryId, Math.max(1, Number(e.target.value) || 1))}/></label><dl><div><dt>Unit</dt><dd>{entry.item.weightKg.toFixed(3)} kg</dd></div><div><dt>Stack</dt><dd>{entry.stackKg.toFixed(3)} kg</dd></div><div><dt>Unit price</dt><dd>{entry.item.price.toLocaleString()}</dd></div><div><dt>Total price</dt><dd>{entry.stackPrice.toLocaleString()}</dd></div></dl><div className="eligibility"><b>{entry.eligibility.eligible ? 'ELIGIBLE' : 'BLOCKED'}</b>{entry.eligibility.messages.map(m => <span key={m}>{m}</span>)}{rules.map(rule => <span key={rule}>{rule}</span>)}</div><button className="remove" onClick={() => onRemove(entry.entryId)}>Remove</button></article>; })}</div>}
  </section>;
}
