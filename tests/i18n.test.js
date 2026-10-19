import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/translations.js';
import {translate} from '../src/i18n.js';
import {RECIPES,INGREDIENTS} from '../src/engine.js';
import {STAGES} from '../src/stages.js';
const vietnamese=/[ăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/iu;
for(const lang of ['en','ja','ko']){
 test(`${lang}: all dishes, ingredients, stages and stage lessons localized`,()=>{
  for(const item of [...RECIPES,...Object.values(INGREDIENTS),...STAGES]){
   assert.notEqual(translate(item.name,lang),item.name,`${lang}: ${item.name}`);
   assert.ok(!vietnamese.test(translate(item.name,lang)),`${lang}: ${item.name}`);
  }
  for(const s of STAGES)assert.ok(!vietnamese.test(translate(s.lesson,lang)),s.lesson);
 });
 test(`${lang}: dynamic buffet orders retain table, bonus and recipe`,()=>{
  const result=translate('Bàn 3 gọi Nigiri cá hồi. Mang đúng món tới nhé.',lang);
  assert.ok(result.includes('3'));assert.ok(!vietnamese.test(result));
  assert.ok(translate('Khách chung · tận bàn +25% · băng chuyền giá chuẩn · giao trước nhận tiền',lang).includes('+25%'));
 });
}
test('Vietnamese stays unchanged and longest recipe match wins',()=>{
 assert.equal(translate('Bàn 2 · Súp cà chua','vi'),'Bàn 2 · Súp cà chua');
 assert.equal(translate('Súp cà chua','en'),'Tomato soup');
 assert.equal(translate('Camera · Kitchen Rush · WASD · E · F','en'),'Camera · Kitchen Rush · WASD · E · F');
});
