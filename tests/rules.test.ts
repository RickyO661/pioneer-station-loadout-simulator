import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateArmorChannelTotals, calculateAttributePurchaseCost, calculateBuild, calculateExperiencePlan, calculateHP, calculateSuitEffects, EMPTY_ATTRIBUTES } from '../src/rules/build.ts';
import { evaluateRequirement } from '../src/rules/requirements.ts';
import { gameData } from '../src/data/index.ts';
import type { GameClass, Item } from '../src/types/game.ts';
import { parseSharedBuild, serializeSharedBuild } from '../src/rules/sharing.ts';

const jt: GameClass = { id: 2, name: 'Jump Trooper', group: 'Combat', baseHp: 80, baseCarryKg: 30, requiredXp: 0, minimumAttributes: {} };
const drop: GameClass = { id: 24, name: 'Drop Trooper', group: 'Specialist', baseHp: 80, baseCarryKg: 30, requiredXp: 0, minimumAttributes: {} };
const greaves: Item = { id: 73, name: 'Greaves - Alloy', category: 'armor', sourceCategory: 'Armor-Boots/Greaves', description: '', weightKg: 6.5, price: 6000, requirement: { rawExpression: '(2|3|5|6|7|9|26|10|19|20|22)&!30', allowedClassIds:[2,3,5,6,7,9,26,10,19,20,22], blockedClassIds:[30], minimumAttributes:{},hasUnverifiedGate:false }, rawFields:[] };
test('Jump Trooper strength 18 has 48 kg maximum carry', () => { const result=calculateBuild({classId:2,attributes:{...EMPTY_ATTRIBUTES,strength:18},entries:[]},[jt],[greaves]); assert.equal(result.maxCarryKg,48); });
test('build price totals use the zone item vendor price and selected quantity', () => {
  const result = calculateBuild({ classId: 2, attributes: { ...EMPTY_ATTRIBUTES }, entries: [{ entryId: 'greaves', itemId: 73, quantity: 2 }] }, [jt], [greaves]);
  assert.equal(result.entries[0].stackPrice, 12000);
  assert.equal(result.totalPrice, 12000);
});
test('Drop Trooper cannot use Greaves - Alloy', () => { assert.equal(evaluateRequirement(greaves.requirement,drop,EMPTY_ATTRIBUTES).eligible,false); });
test('each Vitality point adds one HP to the class base', () => { assert.equal(calculateHP(80, 18), 98); });
test('attribute costs match the observed Pioneer Station purchase prices and floor rounding', () => {
  const deftness = gameData.attributes.find(attribute => attribute.key === 'deftness')!;
  const strength = gameData.attributes.find(attribute => attribute.key === 'strength')!;
  const vitality = gameData.attributes.find(attribute => attribute.key === 'vitality')!;
  assert.deepEqual([1, 2, 3, 4].map(level => calculateAttributePurchaseCost(deftness, level, gameData.attributeCostRules)), [250, 1729, 5359, 11958]);
  assert.deepEqual([1, 2, 3, 4, 5].map(level => calculateAttributePurchaseCost(strength, level, gameData.attributeCostRules)), [150, 1037, 3215, 7175, 13372]);
  assert.deepEqual([1, 2, 3].map(level => calculateAttributePurchaseCost(vitality, level, gameData.attributeCostRules)), [125, 864, 2679]);
});
test('experience plan charges each attribute independently from its current level', () => {
  const plan = calculateExperiencePlan({ ...EMPTY_ATTRIBUTES, strength: 1, vitality: 1 }, { ...EMPTY_ATTRIBUTES, strength: 3, vitality: 3 }, gameData.attributes, gameData.attributeCostRules);
  assert.equal(plan.costs.find(cost => cost.key === 'strength')?.cost, 4252);
  assert.equal(plan.costs.find(cost => cost.key === 'vitality')?.cost, 3543);
  assert.equal(plan.totalCost, 7795);
});
test('regular ammo exactly matches the current Pioneer Station vendor set', () => {
  const expected = ['Ammo - Blast Energy', 'Ammo - Flak', 'Ammo - HE', 'Ammo - MG', 'Ammo - MG DPU', 'Ammo - Micro Missile', 'Ammo - Pistol', 'Ammo - Razor Disks', 'Ammo - Rifle', 'Ammo - Rocket', 'Ammo - Shotgun', 'Ceramax Shards', 'Fuel Charge - Hydrogen', 'Fuel Charge - Methane', 'Gas Charge - Acid', 'Gas Charge - Toxin'];
  const actual = gameData.items.filter(item => item.sourceCategory === 'Ammo-Regular' && item.category === 'ammo').map(item => item.name).sort();
  assert.deepEqual(actual, expected.sort());
});
test('regular ammo is filtered, Recall Token is an item, and special ammunition remains ammo', () => {
  assert.equal(gameData.items.some(item => item.name === 'Ammo - Rifle 4mm'), false);
  assert.equal(gameData.items.find(item => item.name === 'Recall Token')?.category, 'items');
  assert.equal(gameData.items.find(item => item.name === 'Stim Dart')?.category, 'ammo');
});
test('item prices are imported from the Pioneer Station item price field', () => {
  assert.equal(gameData.items.find(item => item.name === 'Ammo - Rifle')?.price, 4);
  assert.equal(gameData.items.find(item => item.name === 'Maklov PP08')?.price, 4800);
  assert.equal(gameData.items.find(item => item.name === 'Ceramax Combat Armor')?.price, 6000);
});
test('attribute ceilings are imported from Pioneer Station descriptions', () => {
  assert.equal(gameData.attributes.find(attribute => attribute.key === 'strength')?.maxLevel, 20);
  assert.equal(gameData.attributes.find(attribute => attribute.key === 'vitality')?.maxLevel, 50);
  assert.equal(gameData.attributes.find(attribute => attribute.key === 'deftness')?.maxLevel, 10);
  assert.equal(gameData.attributes.find(attribute => attribute.key === 'technical')?.maxLevel, 10);
  assert.equal(gameData.attributes.find(attribute => attribute.key === 'commerce')?.maxLevel, 3);
  assert.equal(gameData.attributes.find(attribute => attribute.key === 'stamina')?.maxLevel, 5);
});
test('class experience gates are imported from Pioneer Station class requirements', () => {
  assert.equal(gameData.classes.find(gameClass => gameClass.name === 'Squad Leader')?.requiredXp, 25000);
  assert.equal(gameData.classes.find(gameClass => gameClass.name === 'Captain')?.requiredXp, 700000);
  assert.equal(gameData.classes.find(gameClass => gameClass.name === 'Jump Trooper')?.requiredXp, 0);
});
test('class attribute gates are imported from Pioneer Station class requirements', () => {
  assert.deepEqual(gameData.classes.find(gameClass => gameClass.name === 'Jump Trooper')?.minimumAttributes, { strength: 2, vehicle: 3, deftness: 4, technical: 2 });
  assert.deepEqual(gameData.classes.find(gameClass => gameClass.name === 'Squad Leader')?.minimumAttributes, { leadership: 1 });
});
test('shared builds accept only known zone classes and items', () => {
  const source = { version: 1, name: 'Player build', loadout: { classId: gameData.classes[0].id, attributes: { ...EMPTY_ATTRIBUTES }, entries: [{ entryId: 'example', itemId: gameData.items[0].id, quantity: 1 }] } };
  assert.equal(parseSharedBuild(JSON.stringify(source), gameData.classes, gameData.items)?.name, 'Player build');
  source.loadout.entries[0].itemId = -1;
  assert.equal(parseSharedBuild(JSON.stringify(source), gameData.classes, gameData.items), null);
});
test('shared build text files round-trip through the validated portable format', () => {
  const loadout = { classId: gameData.classes[0].id, attributes: { ...EMPTY_ATTRIBUTES, vitality: 4 }, entries: [] };
  const textFileContents = serializeSharedBuild('My saved build', loadout);
  assert.match(textFileContents, /\n  "loadout":/);
  assert.equal(parseSharedBuild(textFileContents, gameData.classes, gameData.items)?.name, 'My saved build');
});
test('suit effects use the named Pioneer Station energy and movement fields', () => {
  const byName = (name: string) => gameData.items.find(item => item.name === name)!;
  const effects = calculateSuitEffects(['Suit SuperCharger', 'PF Generator', 'Energy Sensors', 'Carapace'].map(name => ({ suitModifiers: byName(name).suitModifiers, quantity: 1 })));
  assert.deepEqual(effects, { energyRateRaw: -7.5, speedRaw: -15, hyperSpeedRaw: -15, thrustRaw: -7.5, rotationRaw: 0 });
});
test('armor totals include all six named protection channels', () => {
  const pfGenerator = gameData.items.find(item => item.name === 'PF Generator')!;
  const totals = calculateArmorChannelTotals([{ armor: pfGenerator.armor, quantity: 1 }]);
  assert.deepEqual(totals.map(total => [total.name, total.ignore, total.protection]), [
    ['Kinetic / Impact', 0, 15], ['Explosive / Shock', 0, 15], ['Plasma / Heat', 0, 15],
    ['Chemical / Toxin', 0, 0], ['Psychic / Mental', 0, 0], ['Shield Drain', 0, 22.5]
  ]);
});
