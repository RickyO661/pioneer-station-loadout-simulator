import type { GameClass, Item, Loadout } from '../types/game';
import { parseSharedBuild } from '../rules/sharing';
import type { SavedBuild } from './SavedBuilds';

export function BuildSharing({ loadout, classes, items, onImport }: { loadout: Loadout; classes: GameClass[]; items: Item[]; onImport: (build: SavedBuild) => void; }) {
  const exportBuild = () => {
    const name = window.prompt('Name for this shared build', 'Pioneer Station build');
    if (!name?.trim()) return;
    window.prompt('Copy this build code and send it to another player.', JSON.stringify({ version: 1, name: name.trim(), loadout }));
  };
  const importBuild = () => {
    const serialized = window.prompt('Paste a build code shared from this simulator. It will be added to your saved builds; your current build will not change.');
    if (!serialized?.trim()) return;
    const parsed = parseSharedBuild(serialized, classes, items);
    if (!parsed) { window.alert('That build code is not valid for this Pioneer Station data set.'); return; }
    onImport({ id: crypto.randomUUID(), name: parsed.name, loadout: parsed.loadout });
  };
  return <span className="sharing-tools"><button onClick={exportBuild}>Export build</button><button onClick={importBuild}>Import build</button></span>;
}
