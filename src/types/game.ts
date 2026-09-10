export type AttributeKey = 'deftness' | 'power' | 'stamina' | 'strength' | 'vitality' | 'commerce' | 'leadership' | 'technical' | 'vehicle';
export type ItemCategory = 'items' | 'equipment' | 'armor' | 'weapons' | 'ammo';
export interface AttributeSet { deftness: number; power: number; stamina: number; strength: number; vitality: number; commerce: number; leadership: number; technical: number; vehicle: number; }
export interface AttributeDefinition { key: AttributeKey; name: string; baseCost: number; maxLevel: number; }
export interface AttributeCostRules { method: number; baseCost: number; countPower: number; }
export interface GameClass { id: number; name: string; group: string; baseHp: number; baseCarryKg: number; requiredXp: number; minimumAttributes: Partial<AttributeSet>; }
export interface ItemRequirement { rawExpression: string; allowedClassIds?: number[]; blockedClassIds?: number[]; minimumAttributes: Partial<AttributeSet>; hasUnverifiedGate: boolean; }
/** Raw suit-effect fields supplied by Pioneer Station item records. */
export interface SuitModifiers { energyRateRaw: number; speedRaw: number; hyperSpeedRaw: number; thrustRaw: number; rotationRaw: number; }
export interface ArmorStats { channels: { ignoreRaw: number; protectionRaw: number }[]; }
/** Fixed energy restores and maximum-HP percentages supplied by Pioneer Station consumable records. */
export interface ConsumableStats { energyRestored?: number; healthRestoredPercent?: number; }
export interface Item { id: number; name: string; category: ItemCategory; sourceCategory: string; description: string; weightKg: number; price: number; requirement: ItemRequirement; armor?: ArmorStats; suitModifiers?: SuitModifiers; consumable?: ConsumableStats; rawFields: string[]; }
export interface GameDatabase { source: { importedAt: string; files: Record<string, string> }; classes: GameClass[]; attributes: AttributeDefinition[]; attributeCostRules: AttributeCostRules; items: Item[]; }
export interface LoadoutEntry { entryId: string; itemId: number; quantity: number; }
export interface Loadout { classId: number; attributes: AttributeSet; entries: LoadoutEntry[]; }
export interface Eligibility { eligible: boolean; messages: string[]; warnings: string[]; }
export interface BuildResult { classBaseHp: number; finalHp: number; maxCarryKg: number; loadKg: number; totalPrice: number; remainingKg: number; percentUsed: number; entries: Array<LoadoutEntry & { item: Item; eligibility: Eligibility; stackKg: number; stackPrice: number }>; }
