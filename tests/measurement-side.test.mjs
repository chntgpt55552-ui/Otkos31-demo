import test from 'node:test';
import assert from 'node:assert/strict';
import { splitMeasurementSide } from '../src/measurement-side.mjs';
for (const [length, expected] of [[1500,[1500]],[3000,[3000]],[3001,[3000,1]],[6000,[3000,3000]],[7200,[3000,3000,1200]]]) {
  test('split '+length, () => {
    const parts = splitMeasurementSide(length, 250);
    assert.deepEqual(parts.map(p=>p.length), expected);
    assert.equal(parts.reduce((s,p)=>s+p.length,0),length);
    assert.ok(parts.every(p=>p.length>0 && p.length<=3000 && p.depth===250));
  });
}
test('invalid dimensions',()=> {
  for(const [l,d] of [[0,250],[-1,250],[1.5,250],[Infinity,250],[3000,0],[3000,NaN]]) assert.throws(()=>splitMeasurementSide(l,d),RangeError);
});
