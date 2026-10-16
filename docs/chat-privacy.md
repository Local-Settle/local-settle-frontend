# Trade chat delivery and read receipts

The chat marks an outgoing message **Sent** after the server acknowledges persistence and returns the stored message timestamp. A timeout or rejected send remains **Failed**; the UI does not treat a locally composed message as delivered.

Read receipts are off by default. Each signed-in user can enable them from the chat header; the preference is stored in that user's browser on that device. When enabled, this client sends a read acknowledgement only for messages in the currently open order while the page is visible and the reader is near the latest messages. It does not advertise global presence or send conversation contents with the acknowledgement.

The socket contract needed by this UI is order scoped: the client emits `mark-read` with `{ orderId, messageId }`, and the server acknowledges only for an authorized order participant. The server may broadcast `message-read` with `{ orderId, messageId, readerId, readAt }` to that order's participants. The UI displays **Read** only after receiving that server timestamp. The server must enforce participant access, prevent marking another participant's message as one's own, and avoid broadcasting receipts outside that order.
