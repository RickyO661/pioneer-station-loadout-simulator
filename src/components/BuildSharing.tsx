import { useRef } from 'react';
import type { GameClass, Item, Loadout } from '../types/game';
import { createSharedBuildLink, parseSharedBuild, serializeSharedBuild } from '../rules/sharing';
import type { SavedBuild } from './SavedBuilds';

export function BuildSharing({ loadout, classes, items, onImport }: { loadout: Loadout; classes: GameClass[]; items: Item[]; onImport: (build: SavedBuild) => void; }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const addImportedBuild = (serialized: string) => {
    const parsed = parseSharedBuild(serialized, classes, items);
    if (!parsed) { window.alert('That build file or code is not valid for this Pioneer Station data set.'); return; }
    onImport({ id: crypto.randomUUID(), name: parsed.name, loadout: parsed.loadout });
  };
  const downloadBuild = () => {
    const name = window.prompt('Name for this build file', 'Pioneer Station build');
    if (!name?.trim()) return;
    const fileName = name.trim().replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, '-').slice(0, 80) || 'pioneer-station-build';
    const blob = new Blob([serializeSharedBuild(name, loadout)], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1_000_000) { window.alert('That file is too large to be a build export.'); return; }
    addImportedBuild(await file.text());
  };
  const copyShareLink = async () => {
    const name = window.prompt('Name for this shared build', 'Pioneer Station build');
    if (!name?.trim()) return;
    const link = createSharedBuildLink(name, loadout);
    try { await navigator.clipboard.writeText(link); window.alert('Share link copied. Anyone opening it will load this build in the simulator.'); }
    catch { window.prompt('Copy this share link', link); }
  };
  return <span className="sharing-tools"><button onClick={downloadBuild}>Export Build</button><button onClick={() => fileInput.current?.click()}>Import Build</button><button onClick={copyShareLink}>Share link</button><input ref={fileInput} className="file-import" type="file" accept=".txt,text/plain,application/json" onChange={importFile} /></span>;
}
