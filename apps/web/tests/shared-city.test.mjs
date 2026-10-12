import test from 'node:test';
import assert from 'node:assert/strict';
import {findDeviceCity} from '../src/utils/share-city.ts';
import {validateSharedCity} from '../src/lib/shared-city.ts';
const position={coords:{latitude:6.34,longitude:5.62,accuracy:30}};
test('consented browser lookup sends current coordinates only to fixed provider and returns only city/country',async()=>{
  let options;
  const geo={getCurrentPosition:(success,error,input)=>{options=input;success(position);}};
  const city=await findDeviceCity(geo,async(url,settings)=>{
    assert.equal(new URL(url).origin,'https://api.bigdatacloud.net');assert.equal(new URL(url).searchParams.get('latitude'),'6.34');
    assert.equal(settings.credentials,'omit');assert.equal(settings.referrerPolicy,'no-referrer');
    return {ok:true,json:async()=>({city:'Benin City',countryName:'Nigeria',latitude:6.34,longitude:5.62,postcode:'secret',locality:'precise neighborhood'})};
  });
  assert.deepEqual(city,{city:'Benin City',country:'Nigeria'});assert.equal(options.maximumAge,0);assert.equal(options.enableHighAccuracy,true);
});
test('denied, inaccurate or cancelled location never sends coordinates to a lookup provider',async()=>{
  let requests=0;const fetcher=async()=>{requests++;throw Error('Must not call');};
  await assert.rejects(findDeviceCity({getCurrentPosition:(ok,error)=>error({code:1})},fetcher));
  await assert.rejects(findDeviceCity({getCurrentPosition:ok=>ok({coords:{...position.coords,accuracy:50000}})},fetcher));
  const controller=new AbortController();controller.abort();
  await assert.rejects(findDeviceCity({getCurrentPosition:()=>{throw Error('Must not request location');}},fetcher,controller.signal));
  assert.equal(requests,0);
});
test('lookup failure or missing city safely leaves network fallback instead of sharing a neighborhood',async()=>{
  const geo={getCurrentPosition:ok=>ok(position)};
  await assert.rejects(findDeviceCity(geo,async()=>({ok:false})),/unavailable/);
  await assert.rejects(findDeviceCity(geo,async()=>({ok:true,json:async()=>({locality:'street',countryName:'Nigeria'})})),/No city/);
});
test('server accepts only bounded city/country strings and never GPS coordinates or arbitrary metadata',()=>{
  assert.equal(validateSharedCity(null),undefined);
  assert.deepEqual(validateSharedCity({city:' Benin City ',country:' Nigeria '}),{city:'Benin City',country:'Nigeria'});
  for(const value of [{city:'x',country:'y',longitude:5.6},{city:'',country:'Nigeria'},{city:'x'.repeat(121),country:'Nigeria'},{city:'Benin\nCity',country:'Nigeria'},'Benin City']) assert.throws(()=>validateSharedCity(value));
});
