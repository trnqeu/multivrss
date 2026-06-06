export class DomainGate {
  private inFlight = new Map<string, number>();
  private queues = new Map<string, Array<() => void>>();

  constructor(private maxPerDomain: number) {}

  async run<T>(url: string, fn: () => Promise<T>): Promise<T> {
    const domain = new URL(url).hostname;
    await this.acquire(domain);
    try {
      return await fn();
    } finally {
      this.release(domain);
    }
  }

  private acquire(domain: string): Promise<void> {
    const current = this.inFlight.get(domain) ?? 0;
    if (current < this.maxPerDomain) {
      this.inFlight.set(domain, current + 1);
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const queue = this.queues.get(domain) ?? [];
      queue.push(resolve);
      this.queues.set(domain, queue);
    });
  }

  private release(domain: string): void {
    const queue = this.queues.get(domain);
    if (queue && queue.length > 0) {
      queue.shift()!();
    } else {
      const current = this.inFlight.get(domain) ?? 1;
      if (current <= 1) {
        this.inFlight.delete(domain);
      } else {
        this.inFlight.set(domain, current - 1);
      }
    }
  }
}
