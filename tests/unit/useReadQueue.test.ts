import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedMarkManyRead = vi.fn();

vi.mock('@/app/actions/feed-items', () => ({
    markManyRead: mockedMarkManyRead,
}));

// The queue (pending Set, flushTimer) is a module-level singleton by design
// (see comment in src/lib/useReadQueue.ts) — reset modules between tests so
// each test gets its own isolated queue instead of leaking state.
describe('useReadQueue (queueRead / flushReadQueue)', () => {
    beforeEach(() => {
        vi.resetModules();
        mockedMarkManyRead.mockClear();
    });

    it('does not call markManyRead when items are queued but not flushed', async () => {
        const { queueRead } = await import('@/lib/useReadQueue');

        queueRead('item_1');
        queueRead('item_2');

        expect(mockedMarkManyRead).not.toHaveBeenCalled();
    });

    it('flush sends all queued ids in a single batched call', async () => {
        const { queueRead, flushReadQueue } = await import('@/lib/useReadQueue');

        queueRead('item_1');
        queueRead('item_2');
        queueRead('item_3');
        flushReadQueue();

        expect(mockedMarkManyRead).toHaveBeenCalledTimes(1);
        expect(mockedMarkManyRead).toHaveBeenCalledWith(['item_1', 'item_2', 'item_3']);
    });

    it('flushing an empty queue is a no-op', async () => {
        const { flushReadQueue } = await import('@/lib/useReadQueue');

        flushReadQueue();

        expect(mockedMarkManyRead).not.toHaveBeenCalled();
    });

    it('clears the queue after a flush, so a second flush without new reads is a no-op', async () => {
        const { queueRead, flushReadQueue } = await import('@/lib/useReadQueue');

        queueRead('item_1');
        flushReadQueue();
        flushReadQueue();

        expect(mockedMarkManyRead).toHaveBeenCalledTimes(1);
    });

    it('collapses duplicate ids via Set semantics', async () => {
        const { queueRead, flushReadQueue } = await import('@/lib/useReadQueue');

        queueRead('item_1');
        queueRead('item_1');
        queueRead('item_1');
        flushReadQueue();

        expect(mockedMarkManyRead).toHaveBeenCalledTimes(1);
        expect(mockedMarkManyRead).toHaveBeenCalledWith(['item_1']);
    });
});
