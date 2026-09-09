import type { Item, SuitModifiers } from '../types/game';
import { calculateArmorChannelTotals, calculateSuitEffects } from '../rules/build';
import { RULES } from '../rules/config';

const effectKeys = ['energyRateRaw', 'speedRaw', 'hyperSpeedRaw', 'rotationRaw', 'thrustRaw'] as const satisfies Array<keyof SuitModifiers>;
const formatSigned = (value: number) => `${value > 0 ? '+' : ''}${Number.isInteger(value) ? value : value.toFixed(1)}`;
const displayEffect = (key: keyof SuitModifiers, value: number) => RULES.suitEffects.labels[key].unit === '%' ? Math.trunc(value) : value;

export function ArmorAnalysis({ entries }: { entries: Array<{ item: Item; quantity: number }> }) {
  const armor = entries.filter(entry => entry.item.armor);
  const suitGear = entries.filter(entry => entry.item.suitModifiers);
  const totalWeight = armor.reduce((sum, entry) => sum + entry.item.weightKg * entry.quantity, 0);
  const effects = calculateSuitEffects(suitGear.map(({ item, quantity }) => ({ suitModifiers: item.suitModifiers, quantity })));
  const channels = calculateArmorChannelTotals(armor.map(({ item, quantity }) => ({ armor: item.armor, quantity })));

  return <section className="armor-analysis">
    <div className="section-heading"><h2>Armor / suit effects</h2><span className="model">Zone-data totals <button className="info-button" type="button" aria-label="About armor and suit-effect totals" title="Energy rate and movement changes are added from the selected armor and equipment. Protection and Ignore remain separate because the server's final damage stacking order is not verified.">ⓘ</button></span></div>
    {armor.length === 0 && suitGear.length === 0 ? <p className="empty">Select armor or suit equipment to see your combined effects.</p> : <>
      <div className="armor-summary suit-effects-summary">
        <span>Total armor weight <b>{totalWeight.toFixed(3)} kg</b></span>
        {effectKeys.map(key => { const meta = RULES.suitEffects.labels[key]; return <span key={key}>{meta.label} <b>{formatSigned(displayEffect(key, effects[key]))}{meta.unit === '%' ? '%' : ` ${meta.unit}`}</b></span>; })}
      </div>
      {armor.length > 0 && <div className="armor-protection-summary">
        <h3>Combined armor protection</h3>
        <p>Protection and Ignore are shown separately from the Pioneer Station item data.</p>
        <div className="defense-grid">
          {channels.map(channel => <div key={channel.name}><b>{channel.name}</b><span>Protection {formatSigned(channel.protection)}%</span><span>Ignore {formatSigned(channel.ignore)}</span></div>)}
        </div>
      </div>}
      <details className="armor-sources"><summary>Selected armor and suit equipment</summary>{suitGear.map(({ item, quantity }) => <article className="armor-card" key={item.id}>
        <h3>{item.name}{quantity > 1 ? ` × ${quantity}` : ''}</h3>
        <p>{item.sourceCategory} · {item.weightKg.toFixed(3)} kg · Energy rate {formatSigned(displayEffect('energyRateRaw', (item.suitModifiers?.energyRateRaw ?? 0) / RULES.suitEffects.rawScale))} kJ/s · Speed {formatSigned(displayEffect('speedRaw', (item.suitModifiers?.speedRaw ?? 0) / RULES.suitEffects.rawScale))}% · Hyper-Speed {formatSigned(displayEffect('hyperSpeedRaw', (item.suitModifiers?.hyperSpeedRaw ?? 0) / RULES.suitEffects.rawScale))}% · Rotation {formatSigned(displayEffect('rotationRaw', (item.suitModifiers?.rotationRaw ?? 0) / RULES.suitEffects.rawScale))}% · Thrust {formatSigned(displayEffect('thrustRaw', (item.suitModifiers?.thrustRaw ?? 0) / RULES.suitEffects.rawScale))}%</p>
      </article>)}</details>
    </>}
  </section>;
}
