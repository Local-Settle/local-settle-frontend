# Protected route performance budgets

CI checks the compressed JavaScript listed for `/p2p`, `/p2p/orders/[orderId]`, and `/send` in Next's App Router build manifest. Budgets are in `bundle-budgets.json`; the check reports the measured gzip bytes for each route and fails if a route exceeds its limit or cannot be matched in the manifest.

The `analyze:bundle` script writes Next's reproducible static analyzer output to `.next/diagnostics/analyze`, which CI uploads as an artifact. An intentional exception belongs in the `exceptions` object with both a replacement `maxGzipBytes` and a short `reason` in the same change. No user data or runtime telemetry is collected by the budget job.
