// tests/test-meili.ts
import { meili } from '../src/lib/meili';

async function testMeili() {
  console.log("🚀 Testing Meilisearch connectivity...");
  try {
    const stats = await meili.getStats();
    console.log("✅ Meilisearch connection successful!", stats);

    const index = meili.index('items');
    const task = await index.addDocuments([
      { id: 'test_123', title: 'Test Document', content: 'This is a test document for Meilisearch' }
    ]);
    console.log("📡 Document addition task submitted. Task UID:", task.taskUid);

    // Wait for the task to finish
    console.log("⏳ Waiting for Meilisearch indexing...");
    const status = await index.waitForTask(task.taskUid);

    if (status.status === 'succeeded') {
        console.log("✅ Document indexed successfully!");
    } else {
        console.error("❌ Task failed:", status.error);
    }

  } catch (error) {
    console.error("❌ Meilisearch test failed:", error);
  }
}

testMeili();
