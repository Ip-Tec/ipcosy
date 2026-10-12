import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import {validateSharedCity,locationSource} from '../src/lib/shared-city.ts';
const {messageView}=load('../src/lib/message-view.ts',{locationSource},['messageView']);
const message={id:'m',userId:'sender',content:'test',createdAt:new Date(),isAnonymous:true,user:{email:'private@example.test',username:'private-name'},deviceType:'Mobile',deviceOS:'Android',browser:'Chrome',city:'Lagos',country:'NG',ipAddress:'secret',deviceId:'secret',latitude:12,longitude:34};
test('only paid recipients see coarse clues; raw identity and security data never leave history',()=>{
  assert.equal(messageView(message,'free',false).metadata,null);
  assert.equal(messageView(message,'sender',true).metadata,null);
  const paid=messageView(message,'paid',true);
  assert.equal(paid.alias,'Anonymous');assert.equal(paid.visitorId,'anonymous');
  assert.deepEqual(Object.keys(paid.metadata),['deviceType','deviceOS','browser','city','country','locationSource']);
  for(const key of ['email','user','ipAddress','deviceId','latitude','longitude','userAgent']) assert.equal(paid[key],undefined);
});
function load(path,context,names){
  const source=stripTypeScriptTypes(readFileSync(new URL(path,import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
  const scope=vm.createContext(context);vm.runInContext(source+'\nthis.exports={'+names.join(',')+'};',scope);return scope.exports;
}
test('metadata is captured from the request and platform geolocation with accurate Opera parsing',async()=>{
  const values={'user-agent':'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 OPR/106.0','x-forwarded-for':'203.0.113.4','x-vercel-ip-city':'New%20York','x-vercel-ip-country':'US'};
  const api=load('../src/lib/metadata.ts',{console,headers:async()=>({get:key=>values[key]||null}),fetch:()=>{throw Error('Platform geolocation must avoid external lookup');},AbortSignal},['captureMessageMetadata']);
  const meta=await api.captureMessageMetadata();
  assert.equal(meta.browser,'Opera');assert.equal(meta.deviceOS,'Windows');assert.equal(meta.city,'New York');assert.equal(meta.country,'US');assert.equal(meta.ipAddress,'203.0.113.4');
});
function sendRoute({premium=false,banned=false,member=true,blocked=false,session=true,limit=0}={}){
  const writes=[];const user={id:'sender',isPremium:premium,isBanned:banned,email:'sender@test',username:'sender'};
  const chat={id:'private-chat',participants:member?[{userId:user.id}]:[]};
  const prisma={user:{findUnique:async()=>user},chat:{findUnique:async()=>chat,update:async()=>{}},chatBlock:{findUnique:async()=>blocked?{}:null},message:{count:async()=>limit,create:async({data})=>{writes.push(data);return {...message,...data,user};}}};
  prisma.$transaction=async fn=>fn(prisma);
  const api=load('../src/app/api/messages/send/route.ts',{console,validateSharedCity,authOptions:{},getServerSession:async()=>session?{user:{id:user.id}}:null,prisma,messageView,notifyNewMessage:async()=>{},captureMessageMetadata:async(sharedCity)=>({deviceType:'Mobile',deviceOS:'Android',browser:'Chrome',city:sharedCity?.city||'Lagos',country:sharedCity?.country||'NG'}),NextResponse:{json:(body,options={})=>({body,status:options.status||200})}},['POST']);
  const request=(extra={},origin='https://ipcosy.vercel.app')=>({headers:{get:()=>origin},nextUrl:{origin:'https://ipcosy.vercel.app'},cookies:{get:()=>undefined},json:async()=>({chatId:'private-chat',text:'test',isAnonymous:true,...extra})});
  return {...api,writes,request};
}
test('chat sends persist request metadata, ignore spoofed client fields and return a safe saved message',async()=>{
  const api=sendRoute();const result=await api.POST(api.request({metadata:{city:'Fake'},visitorId:'someone-else',isPremium:true}));
  assert.equal(result.status,200);assert.equal(api.writes[0].city,'Lagos');assert.equal(api.writes[0].userId,'sender');assert.equal(result.body.metadata,null);assert.equal(result.body.id,'m');
});
test('sending rejects unauthenticated, banned, blocked, nonmember, rate-limited and cross-origin requests',async()=>{
  for(const [options,status] of [[{session:false},401],[{banned:true},403],[{member:false},403],[{blocked:true},403],[{limit:20},429]]){
    const api=sendRoute(options);assert.equal((await api.POST(api.request())).status,status);assert.equal(api.writes.length,0);
  }
  const api=sendRoute();assert.equal((await api.POST(api.request({},'https://evil.test'))).status,403);assert.equal(api.writes.length,0);
});
test('city sharing passes only city names to message storage and rejects coordinates',async()=>{
  const api=sendRoute();
  assert.equal((await api.POST(api.request({sharedCity:{city:'Benin City',country:'Nigeria'}}))).status,200);
  assert.equal(api.writes[0].city,'Benin City');
  assert.equal((await api.POST(api.request({sharedCity:{city:'Benin City',country:'Nigeria',latitude:6.3}}))).status,400);
  assert.equal(api.writes.length,1);
});
test('device-shared city overrides network city, while omitted city preserves fallback and old provenance',async()=>{
  const values={'user-agent':'Chrome/130.0','x-forwarded-for':'203.0.113.4','x-vercel-ip-city':'Lagos','x-vercel-ip-country':'NG'};
  const api=load('../src/lib/metadata.ts',{console,headers:async()=>({get:key=>values[key]||null}),AbortSignal},['captureMessageMetadata']);
  const shared=await api.captureMessageMetadata({city:'Benin City',country:'Nigeria'});
  assert.equal(shared.city,'Benin City');assert.equal(shared.latitude,undefined);assert.equal(shared.longitude,undefined);
  assert.equal(locationSource(shared.browserFingerprint),'shared-city');
  const fallback=await api.captureMessageMetadata();assert.equal(fallback.city,'Lagos');assert.equal(locationSource(fallback.browserFingerprint),'network');
  assert.equal(locationSource('old-invalid-value'),'network');
});
