import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBuild, calculateHP, EMPTY_ATTRIBUTES } from '../src/rules/build.ts';
import { evaluateRequirement } from '../src/rules/requirements.ts';
import { gameData } from '../src/data/index.ts';
import type { GameClass, Item } from '../src/types/game.ts';

const jt: GameClass = { id: 2, name: 'Jump Trooper', group: 'Combat', baseHp: 80, baseCarryKg: 30 };
const drop: GameClass = { id: 24, name: 'Drop Trooper', group: 'Specialist', baseHp: 80, baseCarryKg: 30 };
const greaves: Item = { id: 73, name: 'Greaves - Alloy', category: 'armor', sourceCategory: 'Armor-Boots/Greaves', description: '', weightKg: 6.5, requirement: { rawExpression: '(2|3|5|6|7|9|26|10|19|20|22)&!30', allowedClassIds:[2,3,5,6,7,9,26,10,19,20,22], blockedClassIds:[30], minimumAttributes:{},hasUnverifiedGate:false }, rawFields:[] };
test('Jump Trooper strength 18 has 48 kg maximum carry', () => { const result=calculateBuild({classId:2,attributes:{...EMPTY_ATTRIBUTES,strength:18},entries:[]},[jt],[greaves]); assert.equal(result.maxCarryKg,48); });
test('Drop Trooper cannot use Greaves - Alloy', () => { assert.equal(evaluateRequirement(greaves.requirement,drop,EMPTY_ATTRIBUTES).eligible,false); });
test('each Vitality point adds one HP to the class base', () => { assert.equal(calculateHP(80, 18), 98); });
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
