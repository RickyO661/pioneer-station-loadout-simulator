export const RULES = {
  carry: { strengthKgPerPoint: 1 },
  // Server-validated rule: each Vitality point adds one HP to the selected class's base HP.
  hp: { vitalityHpPerPoint: 1 },
  armor: {
    ignoreScale: 1000,
    protectionScale: 10,
    damageChannels: ['Kinetic / Impact', 'Explosive / Shock', 'Plasma / Heat', 'Chemical / Toxin', 'Psychic / Mental', 'Shield Drain']
  },
  projectile: {
    damageScale: 1000,
    blastRadiusMetersPerRaw: 0.075
  },
  suitEffects: {
    rawScale: 10,
    labels: {
      energyRateRaw: { label: 'Energy rate', unit: 'kJ/s' },
      speedRaw: { label: 'Speed', unit: '%' },
      hyperSpeedRaw: { label: 'Hyper-Speed', unit: '%' },
      rotationRaw: { label: 'Rotation', unit: '%' },
      thrustRaw: { label: 'Thrust', unit: '%' }
    }
  }
} as const;
