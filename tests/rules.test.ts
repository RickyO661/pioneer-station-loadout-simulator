import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAttributePurchaseCost, calculateBuild, calculateExperiencePlan, calculateHP, EMPTY_ATTRIBUTES } from '../src/rules/build.ts';
import { evaluateRequirement } from '../src/rules/requirements.ts';
import { gameData } from '../src/data/index.ts';
import type { GameClass, Item } from '../src/types/game.ts';
import { parseSharedBuild } from '../src/rules/sharing.ts';

const jt: GameClass = { id: 2, name: 'Jump Trooper', group: 'Combat', baseHp: 80, baseCarryKg: 30 };
const drop: GameClass = { id: 24, name: 'Drop Trooper', group: 'Specialist', baseHp: 80, baseCarryKg: 30 };
const greaves: Item = { id: 73, name: 'Greaves - Alloy', category: 'armor', sourceCategory: 'Armor-Boots/Greaves', description: '', weightKg: 6.5, requirement: { rawExpression: '(2|3|5|6|7|9|26|10|19|20|22)&!30', allowedClassIds:[2,3,5,6,7,9,26,10,19,20,22], blockedClassIds:[30], minimumAttributes:{},hasUnverifiedGate:false }, rawFields:[] };
test('Jump Trooper strength 18 has 48 kg maximum carry', () => { const result=calculateBuild({classId:2,attributes:{...EMPTY_ATTRIBUTES,strength:18},entries:[]},[jt],[greaves]); assert.equal(result.maxCarryKg,48); });
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
test('shared builds accept only known zone classes and items', () => {
  const source = { version: 1, name: 'Player build', loadout: { classId: gameData.classes[0].id, attributes: { ...EMPTY_ATTRIBUTES }, entries: [{ entryId: 'example', itemId: gameData.items[0].id, quantity: 1 }] } };
  assert.equal(parseSharedBuild(JSON.stringify(source), gameData.classes, gameData.items)?.name, 'Player build');
  source.loadout.entries[0].itemId = -1;
  assert.equal(parseSharedBuild(JSON.stringify(source), gameData.classes, gameData.items), null);
});
