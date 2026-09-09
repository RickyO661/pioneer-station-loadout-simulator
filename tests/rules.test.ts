import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBuild, EMPTY_ATTRIBUTES } from '../src/rules/build';
import { evaluateRequirement } from '../src/rules/requirements';
import type { GameClass, Item } from '../src/types/game';

const jt: GameClass = { id: 2, name: 'Jump Trooper', group: 'Combat', baseHp: 80, baseCarryKg: 30 };
const drop: GameClass = { id: 24, name: 'Drop Trooper', group: 'Specialist', baseHp: 80, baseCarryKg: 30 };
const greaves: Item = { id: 73, name: 'Greaves - Alloy', category: 'armor', sourceCategory: 'Armor-Boots/Greaves', description: '', weightKg: 6.5, requirement: { rawExpression: '(2|3|5|6|7|9|26|10|19|20|22)&!30', allowedClassIds:[2,3,5,6,7,9,26,10,19,20,22], blockedClassIds:[30], minimumAttributes:{},hasUnverifiedGate:false }, rawFields:[] };
test('Jump Trooper strength 18 has 48 kg maximum carry', () => { const result=calculateBuild({classId:2,attributes:{...EMPTY_ATTRIBUTES,strength:18},entries:[]},[jt],[greaves]); assert.equal(result.maxCarryKg,48); });
test('Drop Trooper cannot use Greaves - Alloy', () => { assert.equal(evaluateRequirement(greaves.requirement,drop,EMPTY_ATTRIBUTES).eligible,false); });
