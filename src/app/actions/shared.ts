import { editionDateKey } from '@/lib/frontpage';

export function frontpageTag(userId: string): string {
    return `frontpage:${userId}:${editionDateKey()}`;
}
