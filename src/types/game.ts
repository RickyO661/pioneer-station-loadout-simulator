export type AttributeKey = 'deftness' | 'power' | 'stamina' | 'strength' | 'vitality' | 'commerce' | 'leadership' | 'technical' | 'vehicle';
export type ItemCategory = 'items' | 'equipment' | 'armor' | 'weapons' | 'ammo';
export interface AttributeSet { deftness: number; power: number; stamina: number; strength: number; vitality: number; commerce: number; leadership: number; technical: number; vehicle: number; }
export interface AttributeDefinition { key: AttributeKey; name: string; baseCost: number; maxLevel: number; }
export interface AttributeCostRules { method: number; baseCost: number; countPower: number; }
export interface GameClass { id: number; name: string; group: string; baseHp: number; baseCarryKg: number; }
export interface ItemRequirement { rawExpression: string; allowedClassIds?: number[]; blockedClassIds?: number[]; minimumAttributes: Partial<AttributeSet>; hasUnverifiedGate: boolean; }
export interface ArmorStats { mobilityRaw: number[]; channels: { ignoreRaw: number; protectionRaw: number }[]; }
export interface Item { id: number; name: string; category: ItemCategory; sourceCategory: string; description: string; weightKg: number; requirement: ItemRequirement; armor?: ArmorStats; rawFields: string[]; }
export interface GameDatabase { source: { importedAt: string; files: Record<string, string> }; classes: GameClass[]; attributes: AttributeDefinition[]; attributeCostRules: AttributeCostRules; items: Item[]; }
export interface LoadoutEntry { entryId: string; itemId: number; quantity: number; }
export interface Loadout { classId: number; attributes: AttributeSet; entries: LoadoutEntry[]; }
export interface Eligibility { eligible: boolean; messages: string[]; warnings: string[]; }
export interface BuildResult { classBaseHp: number; finalHp: number; maxCarryKg: number; loadKg: number; remainingKg: number; percentUsed: number; entries: Array<LoadoutEntry & { item: Item; eligibility: Eligibility; stackKg: number }>; }
