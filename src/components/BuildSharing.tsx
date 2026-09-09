import { useRef } from 'react';
import type { GameClass, Item, Loadout } from '../types/game';
import { parseSharedBuild, serializeSharedBuild } from '../rules/sharing';
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
  const copyBuildCode = () => {
    const name = window.prompt('Name for this shared build', 'Pioneer Station build');
    if (!name?.trim()) return;
    window.prompt('Copy this build code and send it to another player.', serializeSharedBuild(name, loadout));
  };
  const importBuild = () => {
    const serialized = window.prompt('Paste a build code shared from this simulator. It will be added to your saved builds; your current build will not change.');
    if (!serialized?.trim()) return;
    addImportedBuild(serialized);
  };
  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1_000_000) { window.alert('That file is too large to be a build export.'); return; }
    addImportedBuild(await file.text());
  };
  return <span className="sharing-tools"><button onClick={downloadBuild}>Download build (.txt)</button><button onClick={() => fileInput.current?.click()}>Import .txt</button><input ref={fileInput} className="file-import" type="file" accept=".txt,text/plain,application/json" onChange={importFile} /><details className="code-sharing"><summary>Copy/paste code</summary><span><button onClick={copyBuildCode}>Copy code</button><button onClick={importBuild}>Paste code</button></span></details></span>;
}
