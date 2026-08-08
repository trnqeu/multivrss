// Tracks whether the current tab has performed at least one in-app
// client-side navigation since the JS runtime loaded. `window.history.length`
// can't answer this: it counts the whole tab's joint session history,
// including pages visited before the user ever arrived at this app (an
// external referrer, a previous site in the same tab), so it stays > 1 even
// when there is no in-app page to go back to. A module-level counter reset
// by every fresh page load (hard navigation or reload) and incremented only
// by real client-side route changes gives an accurate signal instead.
let inAppNavigationCount = 0;

export function recordAppNavigation(): void {
    inAppNavigationCount += 1;
}

export function hasInAppHistory(): boolean {
    return inAppNavigationCount > 0;
}
