import test from 'node:test';
import assert from 'node:assert/strict';
import { validateUpload, storageEnabled, requireStorageConfig, encodeFileKey, decodeFileKey, safeFileName, fileDisposition } from '../src/lib/storage-policy.ts';
const secret = 'a'.repeat(64);
const key = 'uploads/01234567-89ab-cdef-0123-456789abcdef';
const config = { STORAGE_PROVIDER:'b2', B2_ENDPOINT:'https://s3.us-west-004.backblazeb2.com', B2_REGION:'us-west-004', B2_BUCKET:'test-private', B2_KEY_ID:'test', B2_APPLICATION_KEY:'test', STORAGE_TOKEN_SECRET:secret };
test('limits reject oversized, empty, fractional and executable uploads', () => {
  validateUpload('image/png',20*1024*1024);
  validateUpload('application/pdf',100*1024*1024);
  for(const [type,size] of [['image/png',20*1024*1024+1],['application/pdf',100*1024*1024+1],['image/png',0],['image/png',0.5],['image/svg+xml',10],['text/html',10]]) assert.throws(()=>validateUpload(type,size));
});
test('default stays on legacy storage; enabled incomplete configuration fails closed',()=>{
  assert.equal(storageEnabled({}),false);
  assert.equal(storageEnabled(config),true);
  assert.throws(()=>requireStorageConfig({STORAGE_PROVIDER:'b2'}));
  assert.equal(requireStorageConfig(config).bucket,'test-private');
  assert.equal(requireStorageConfig({...config,STORAGE_PROVIDER:'uploadthing'}).bucket,'test-private');
});
test('credentials can only be sent to the Backblaze HTTPS endpoint',()=>{
  for(const endpoint of ['http://s3.us-west-004.backblazeb2.com','https://evil.example','https://s3.us-west-004.backblazeb2.com.evil.example','https://s3.us-west-004.backblazeb2.com/path','https://user:password@s3.us-west-004.backblazeb2.com']) assert.throws(()=>requireStorageConfig({...config,B2_ENDPOINT:endpoint}));
});
test('file links hide keys, use unique tokens, and reject tampering/wrong secrets',()=>{
  const token=encodeFileKey(key,secret);
  assert.equal(decodeFileKey(token,secret),key);
  assert.notEqual(encodeFileKey(key,secret),token);
  assert.ok(!token.includes(key));
  const altered=(token[0]==='a'?'b':'a')+token.slice(1);
  assert.throws(()=>decodeFileKey(altered,secret));
  assert.throws(()=>decodeFileKey(token,'b'.repeat(64)));
  assert.throws(()=>decodeFileKey('../etc/passwd',secret));
  assert.throws(()=>decodeFileKey(encodeFileKey('../etc/passwd',secret),secret));
});

test('download names cannot inject response headers or paths',()=>{
  assert.equal(safeFileName('folder/\\report\r\n.pdf'),'folderreport.pdf');
  const disposition=fileDisposition('Budget \"résumé\".pdf');
  assert.ok(disposition.startsWith('attachment;'));
  assert.ok(disposition.includes('filename*=UTF-8'));
  assert.ok(!disposition.includes('\r'));
  assert.ok(!disposition.includes('\n'));
  assert.ok(!fileDisposition('x\r\nSet-Cookie: bad').includes('\r\n'));
});

test('long filenames keep their extension after shortening',()=>{ const name=safeFileName('x'.repeat(190)+'.pdf'); assert.equal(name.length,160); assert.ok(name.endsWith('.pdf')); });
