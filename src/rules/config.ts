export const RULES = {
  carry: { strengthKgPerPoint: 1 },
  // Server-validated rule: each Vitality point adds one HP to the selected class's base HP.
  hp: { vitalityHpPerPoint: 1 },
  armor: { valueScale: 10000, damageChannels: ['Damage channel 1', 'Damage channel 2', 'Damage channel 3'] }
} as const;
