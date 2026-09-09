import { useMemo, useState } from 'react';
import type { GameClass, Item, Loadout } from '../types/game';
import { calculateBuild } from '../rules/build';
import type { SavedBuild } from './SavedBuilds';

const labels: Array<[keyof Loadout['attributes'], string]> = [['deftness', 'Deftness'], ['power', 'Power'], ['stamina', 'Stamina'], ['strength', 'Strength'], ['vitality', 'Vitality'], ['commerce', 'Commerce'], ['leadership', 'Leadership'], ['technical', 'Technical'], ['vehicle', 'Vehicle']];
const itemCounts = (loadout: Loadout, items: Item[]) => new Map(loadout.entries.map(entry => [items.find(item => item.id === entry.itemId)?.name ?? `Unknown item ${entry.itemId}`, entry.quantity]));

export function BuildComparison({ current, saved, classes, items }: { current: Loadout; saved: SavedBuild[]; classes: GameClass[]; items: Item[]; }) {
  const [selectedId, setSelectedId] = useState('');
  const other = saved.find(build => build.id === selectedId);
  const currentResult = useMemo(() => calculateBuild(current, classes, items), [current, classes, items]);
  const otherResult = useMemo(() => other && calculateBuild(other.loadout, classes, items), [other, classes, items]);
  const currentClass = classes.find(gameClass => gameClass.id === current.classId)?.name ?? 'Current build';
  const otherClass = other && classes.find(gameClass => gameClass.id === other.loadout.classId)?.name;
  const currentItems = itemCounts(current, items);
  const otherItems = other ? itemCounts(other.loadout, items) : new Map<string, number>();
  return <details className="build-comparison"><summary>Compare builds</summary><p>Choose an imported or saved build. Nothing is changed while you compare.</p>{saved.length === 0 ? <p className="empty">Save your build or import a player’s build code first.</p> : <label>Compare current build with <select value={selectedId} onChange={event => setSelectedId(event.target.value)}><option value="">Choose a build…</option>{saved.map(build => <option key={build.id} value={build.id}>{build.name}</option>)}</select></label>}{other && otherResult && <div className="comparison-result"><div className="comparison-head"><b>Current: {currentClass}</b><b>{other.name}: {otherClass}</b></div><div className="comparison-grid"><span>HP <b>{currentResult.finalHp}</b> <em>{otherResult.finalHp - currentResult.finalHp >= 0 ? '+' : ''}{otherResult.finalHp - currentResult.finalHp}</em> <b>{otherResult.finalHp}</b></span><span>Carry capacity <b>{currentResult.maxCarryKg.toFixed(2)} kg</b> <em>{(otherResult.maxCarryKg - currentResult.maxCarryKg >= 0 ? '+' : '') + (otherResult.maxCarryKg - currentResult.maxCarryKg).toFixed(2)}</em> <b>{otherResult.maxCarryKg.toFixed(2)} kg</b></span><span>Load weight <b>{currentResult.loadKg.toFixed(3)} kg</b> <em>{(otherResult.loadKg - currentResult.loadKg >= 0 ? '+' : '') + (otherResult.loadKg - currentResult.loadKg).toFixed(3)}</em> <b>{otherResult.loadKg.toFixed(3)} kg</b></span>{labels.filter(([key]) => current.attributes[key] !== other.loadout.attributes[key]).map(([key, label]) => <span key={key}>{label} <b>{current.attributes[key]}</b> <em>{other.loadout.attributes[key] - current.attributes[key] >= 0 ? '+' : ''}{other.loadout.attributes[key] - current.attributes[key]}</em> <b>{other.loadout.attributes[key]}</b></span>)}</div><div className="comparison-items"><b>Build differences</b>{[...new Set([...currentItems.keys(), ...otherItems.keys()])].filter(name => currentItems.get(name) !== otherItems.get(name)).map(name => <span key={name}>{name}: <b>Current ({currentItems.get(name) ?? 0})</b> · <b>{other.name} ({otherItems.get(name) ?? 0})</b></span>)}</div></div>}</details>;
}
