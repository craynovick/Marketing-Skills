import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModelCallToUIChunkTransform } from '@ai-sdk/workflow';
import { WorkflowChatTransport } from '@ai-sdk/workflow/client';

async function replay(parts, uiStartIndex = 0) {
  const source = new ReadableStream({ start(controller) { for (const part of parts) controller.enqueue(part); controller.close(); } });
  return Array.fromAsync(source.pipeThrough(createModelCallToUIChunkTransform({ uiStartIndex })));
}

test('reconnect cursor skips UI chunks without skipping raw model output', async () => {
  const parts = [
    { type: 'text-start', id: 'post' }, { type: 'text-delta', id: 'post', text: 'Paper ' },
    { type: 'text-delta', id: 'post', text: 'Harbor' }, { type: 'text-end', id: 'post' }, { type: 'finish' },
  ];
  const complete = await replay(parts);
  assert.ok(complete.length > parts.length, 'transform inserts UI lifecycle chunks');
  for (let index = 0; index <= complete.length; index++) {
    assert.deepEqual(await replay(parts, index), complete.slice(index));
  }
});

test('submission acknowledges immediately and transport reconnects through app run ID', async () => {
  const calls = [];
  let acknowledged = false;
  const transport = new WorkflowChatTransport({ api: '/api/cookbook/runs', onChatSendMessage: () => { acknowledged = true; },
    fetch: async (url, init) => {
      calls.push({ url, method: init?.method });
      if (init?.method === 'POST') return new Response('', { headers: { 'x-workflow-run-id': 'app-run' } });
      assert.equal(acknowledged, true);
      return new Response('data: {"type":"start","messageId":"answer"}\n\ndata: {"type":"finish"}\n\n');
    },
  });
  const stream = await transport.sendMessages({ chatId: 'task', trigger: 'submit-message', messages: [{ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Help me build my brand' }] }] });
  assert.deepEqual((await Array.fromAsync(stream)).map(chunk => chunk.type), ['start', 'finish']);
  assert.equal(calls[1].url, '/api/cookbook/runs/app-run/stream?startIndex=0');
});
