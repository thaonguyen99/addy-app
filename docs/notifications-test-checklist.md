# Notifications + realtime: two-device test checklist

**Setup:** phone **A** (recipient) and phone **B** (actor), each signed in to a different account and friends with each other. Also set up a third account C that isn't friends with A yet. Use real devices: push doesn't work on simulators.

**App states:**
- **killed:** swiped away from the app switcher
- **background:** home button, app still in the switcher
- **foreground:** the app is open and the socket is connected

While the app is open, the server sends no push. You get the socket row and the in-app banner instead.

**Live event viewer:** in addy-be, run `ACCESS_TOKEN=… yarn tsx src/scripts/realtime-smoke.ts <memoryId>`

## 1. Every notification type (🔔 list and push)

| # | B does | A expects in 🔔 | A push (A in background) |
|---|---|---|---|
| 1.1 | C sends A a friend request | "**c** wants to be friends", inline **Accept** | same title |
| 1.2 | A taps Accept on that row | button → "friends ✓", row turns read, friends list updates | – |
| 1.3 | B accepts A's request | "**b** accepted your friend request", "profile ›" | same |
| 1.4 | B adds A via A's invite link / QR | "**b** is now your friend" | same |
| 1.5 | B tags A in a new memory | "**b** tagged you", second line "📍 place · “caption”", thumb | same |
| 1.6 | B @mentions A in a message | "**b** mentioned you", “quote” | same |
| 1.7 | B messages on A's memory, twice, plus C once | one grouped row: "**c** and 1 other in your memory", preview = latest | at most one push per 60s |
| 1.8 | Likes **off** (default): B likes A's memory | nothing | nothing |
| 1.9 | Likes **on**: B likes A's memory, then C does | "**c** and 1 other liked your memory", two overlapping avatars | same |
| 1.10 | B likes A's message | "**b** liked your message" | same |
| 1.11 | B likes → unlikes → likes again | no second notification | none |
| 1.12 | A blocks B | B's rows disappear live (`notification:removed`) | – |

## 2. Tap targets × app state

Run every row from **killed**, **background** and **foreground** (foreground = tap the in-app banner):

| Type | Opens |
|---|---|
| FRIEND_REQUEST / FRIEND_ACCEPTED | B's profile (`/user/<username>`) |
| TAGGED / MEMORY_LIKE | memory chat, at the top |
| MEMORY_MESSAGE / MENTIONED / COMMENT_LIKE | memory chat, scrolled to the message, pale-pink wash for about 1.5s |
| MEMORY_MESSAGE whose message is more than 30 messages back | older pages load until it's found, then it scrolls and highlights |
| ON_THIS_DAY (local) | memory with the print-in flash and the "on this day" pill |

For each one:
- The row turns read.
- A's badge and unread count update on **both** of A's devices if A is signed in twice.
- After a killed-state tap, closing and reopening the app does **not** replay that tap.

## 3. 🔔 list and bell
- [ ] Badge hidden at 0. Shows 1–9, then "9+" from 10.
- [ ] Opening the list clears the badge (`/notifications/seen`), but rows stay tinted with the pink dot.
- [ ] "New" holds unread rows with a count, "Earlier" holds read rows. "Read all" clears the tint and hides itself.
- [ ] Scrolling past 30 rows loads the next page. Pull to refresh reloads the list, the On this day card and the counts.
- [ ] A fresh account shows "All caught up", and "💌 Invite a friend" opens Friends › invite.
- [ ] On this day card: shows when A has a memory from today's date in an earlier year. "Relive it ›" plays the reveal.

## 4. Settings › Notifications
- [ ] Each switch (Friend requests, Tags, Messages, Likes, On this day) flips instantly and sends a PATCH. In airplane mode it flips back.
- [ ] Friend requests off → neither requests nor accepts notify A (it writes `friendRequests` and `friendAccepted`).
- [ ] The Messages subtitle reads "Messages in your memories".
- [ ] Changing the On this day time reschedules it. Check `Notifications.getAllScheduledNotificationsAsync()` for one entry with id `on-this-day` at the new time. Switching it off removes the entry.
- [ ] Time set 2 minutes ahead, app in background → the local notification fires: "On this day ☺️ · One year ago you were at …".

## 5. Permission off
- [ ] Deny permission → Settings shows "Notifications are off for Addy · You'll still see them in the 🔔 list".
- [ ] Turn on: the in-app prompt if the OS still allows asking, otherwise the system Settings app. Back in the app with it enabled → the banner disappears and the token registers.
- [ ] With permission off, the 🔔 list and in-app banners still work.

## 6. Push token lifecycle
- [ ] Fresh install, cold start → **no** permission prompt.
- [ ] Prompt appears on finishing the onboarding tour, or after the first friend action (send/accept request, invite add). It's asked once only.
- [ ] `POST /push-tokens` with `schedulesOnThisDay: true` on login and on every launch.
- [ ] Log out → `DELETE /push-tokens/<encoded token>` returns 200 **before** the session clears. No pushes arrive afterward.
- [ ] Delete account → the token DELETE happens **before** `DELETE /users/me` (no 401).

## 7. Live memory chat (A and B both in the same chat)
- [ ] B sends → A gets the bubble with a soft slide-in. B sees exactly one bubble (the optimistic one swapped via `clientTempId`, no duplicate).
- [ ] B edits → A's bubble updates. B deletes → it disappears on A, and the message count drops.
- [ ] B likes A's message → A's count changes and A's own ♥ state stays put.
- [ ] B likes the memory → A's post like count updates.
- [ ] B edits caption, mood, place or tags → A's header and post update without a refetch.
- [ ] A is scrolled up → B's message shows the "New messages ↓" pill, and tapping it scrolls down. A near the bottom → it auto-scrolls instead.
- [ ] A has the chat open → **no** banner for messages in that memory. Banners for other memories still show.
- [ ] B deletes the memory or makes it private → A sees "This memory is no longer available".

## 8. Socket lifecycle
- [ ] Background A → the socket disconnects, and B's events now arrive as pushes.
- [ ] Foreground A → the socket reconnects, the open chat re-joins its room, and the 🔔 list and counts refresh.
- [ ] Token expiry (wait it out, or shorten it on the server) → the socket reconnects with a fresh token, without signing out.
- [ ] Sign out → the socket closes, and sign-in as another user connects fresh.

## 9. Feed and friends
- [ ] A on the Map with the Friends layer on, B shares a memory → the "✦ New memories from friends" pill shows, and tapping it refetches the pins.
- [ ] A on another tab when B shares → no pill. Going back to the Map refetches.
- [ ] A pins a memory → the queued pin hands over to the real pin without a blink.
- [ ] A has the QR sheet open or the Friends tab showing, and B adds A by QR → the "You're friends" moment on A, and the friends list updates.
