import test from 'node:test';
import assert from 'node:assert/strict';
import {attachmentInfo, validateAttachment, IMAGE_LIMIT, FILE_LIMIT} from '../src/lib/attachment-info.ts';
test('file selection allows exact image/file boundaries and normalizes non-image content',()=>{
  assert.equal(validateAttachment({type:'image/png',size:IMAGE_LIMIT}),'image/png');
  assert.equal(validateAttachment({type:'application/pdf',size:FILE_LIMIT}),'application/pdf');
  assert.equal(validateAttachment({type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',size:FILE_LIMIT}),'application/octet-stream');
  assert.equal(validateAttachment({type:'image/svg+xml',size:100}),'application/octet-stream');
  assert.throws(()=>validateAttachment({type:'image/png',size:IMAGE_LIMIT+1}));
  assert.throws(()=>validateAttachment({type:'application/pdf',size:FILE_LIMIT+1}));
  assert.throws(()=>validateAttachment({type:'',size:0}));
});
test('attachment previews preserve image detection with metadata and use safe download links',()=>{
  const image=attachmentInfo('https://ipcosy.vercel.app/api/storage/file/token.png?name=Holiday.png&size=5000');
  assert.equal(image.image,true); assert.equal(image.name,'Holiday.png'); assert.equal(image.size,5000);
  assert.equal(new URL(image.downloadUrl).searchParams.get('download'),'1');
  assert.equal(attachmentInfo('https://example.com/file.pdf').image,false);
  assert.equal(attachmentInfo('javascript:alert(1)'),null);
  assert.equal(attachmentInfo('data:text/html,test'),null);
});
