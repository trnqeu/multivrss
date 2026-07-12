export function frontpageTag(userId: string): string {
    return `frontpage:${userId}:${new Date().toISOString().split('T')[0]}`;
}
