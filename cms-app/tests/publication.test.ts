import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Octokit } from '@octokit/rest';
import { commitDocuments } from '../lib/repository';
import { checkOrigin, validateDocuments } from '../lib/validation';
import { resizeScreens } from '../editor/mediaEditorState';
import type { MediaSpec } from '../editor/mediaTypes';
const revision = 'a'.repeat(40);
function github(current = revision, sameTree = false, concurrent = false) {
 const calls: { kind: string; data?: Record<string, unknown> }[] = [];
 const api = { rest: { git: {
  getRef: async () => ({ data: { object: { sha: current } } }),
  getCommit: async () => ({ data: { tree: { sha: 'old-tree' } } }),
  createTree: async (data: Record<string, unknown>) => { calls.push({kind:'tree',data}); return {data:{sha:sameTree?'old-tree':'new-tree'}}; },
  createCommit: async (data: Record<string, unknown>) => { calls.push({kind:'commit',data}); return {data:{sha:'new-commit'}}; },
  updateRef: async (data: Record<string, unknown>) => { calls.push({kind:'ref',data}); if(concurrent) throw Object.assign(new Error('Conflict'),{status:422}); },
 } } } as unknown as Octokit;
 return {api,calls};
}
test('stale editor cannot overwrite newer GitHub content', async () => { const {api,calls}=github('b'.repeat(40)); await assert.rejects(commitDocuments(api,revision,'case',{'content/cases/case.json':{}},[]),{status:409}); assert.equal(calls.length,0); });
test('publishes documents and uploaded assets in one non-forced commit', async () => { const {api,calls}=github(); const saved=await commitDocuments(api,revision,'case',{'content/cases/case.json':{title:'Test'}},[{path:'public/assets/test.png',sha:'blob'}]); assert.equal(saved.revision,'new-commit'); assert.equal(calls.length,3); assert.equal(calls[0].data?.base_tree,'old-tree'); assert.equal((calls[0].data?.tree as unknown[]).length,2); assert.deepEqual(calls[1].data?.parents,[revision]); assert.equal(calls[2].data?.force,false); });
test('another write during publication does not force the reference', async () => { const {api,calls}=github(revision,false,true); await assert.rejects(commitDocuments(api,revision,'case',{'content/cases/case.json':{}},[])); assert.equal(calls.at(-1)?.data?.force,false); });
test('unchanged content does not create a commit or change update time', async () => { const {api,calls}=github(revision,true); assert.equal((await commitDocuments(api,revision,'case',{'content/cases/case.json':{}},[])).changed,false); assert.deepEqual(calls.map(x=>x.kind),['tree']); });
test('save accepts only documents belonging to the selected view', () => { assert.throws(()=>validateDocuments('profile',{'content/profile.json':{name:'Vlad',role:'Designer',sections:[]},'README.md':'bad'})); assert.throws(()=>validateDocuments('../README',{'content/cases/../README.json':{}})); assert.doesNotThrow(()=>validateDocuments('profile',{'content/profile.json':{name:'Vlad',role:'Designer',sections:[]}})); });
test('mutations require the canonical origin', () => { assert.equal(checkOrigin(null,'https://cms.netlify.app'),false); assert.equal(checkOrigin('https://cms.netlify.app.evil.com','https://cms.netlify.app'),false); assert.equal(checkOrigin('https://cms.netlify.app','https://cms.netlify.app/'),true); });
test('reducing mockup count preserves screens and their order', () => { const original: MediaSpec={mode:'mockup',motion:'static',mockupId:'iphone',screens:[{id:'first',src:'first.png'},{id:'second',src:'second.png'},{id:'third',src:'third.mp4',kind:'video'}],background:{mode:'photo'}}; const small=resizeScreens(original,1,()=> 'new'); assert.equal(small.screens.length,1); small.screens[0]={id:'changed',src:'changed.png'}; const medium=resizeScreens(small,2,()=> 'new'); assert.deepEqual(medium.screens.map(x=>x.id),['changed','second']); const restored=resizeScreens(medium,3,()=> 'new'); assert.deepEqual(restored.screens.map(x=>x.id),['changed','second','third']); assert.equal(restored.screens[2].kind,'video'); });
