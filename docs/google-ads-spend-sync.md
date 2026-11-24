# Google Ads → dashboard spend sync

Google Ads cost reaches the admin dashboard automatically through a **Google Ads
Script** that runs **hourly** inside the Amorfos Ads account (475-290-1970). It
reads cost per campaign per day for the last 14 days (including today) and POSTs
it to `https://amorfos.in/api/ingest/ad-spend`. That endpoint sums the campaigns per
day and overwrites the "Google Ads" row in `marketing_spend`, so today's partial
figure corrects itself every hour. Google's own cost data lags by up to a few
hours, so this is as fresh as the numbers get.

Why a script and not the Google Ads API: scripts run inside the account, so
there's no developer token approval, no Cloud project and no OAuth refresh token
to keep alive.

- **Where:** Google Ads → Tools → Bulk actions → Scripts → "Amorfos spend sync"
- **Schedule:** Hourly
- **Secret:** header `x-ingest-key` must equal the Vercel env var
  `AD_SPEND_INGEST_KEY` (production). The script holds a copy of it. To rotate:
  set a new value in Vercel, redeploy, and paste the same value into the script.
- **Health:** the dashboard's Ad spend card shows the last sync time and flags it
  if it's over 3 hours old. Run history and logs are under the script's "Runs".

## Script

```javascript
// Amorfos spend sync: sends daily Google Ads cost to the amorfos.in dashboard.
var ENDPOINT = 'https://amorfos.in/api/ingest/ad-spend';
var KEY = 'PASTE_AD_SPEND_INGEST_KEY_HERE';
var DAYS = 14;

function main() {
  var tz = AdsApp.currentAccount().getTimeZone();
  var today = new Date();
  var start = new Date(today.getTime() - (DAYS - 1) * 24 * 3600 * 1000);
  var fmt = function (d) { return Utilities.formatDate(d, tz, 'yyyy-MM-dd'); };

  var query =
    'SELECT segments.date, campaign.name, metrics.cost_micros FROM campaign ' +
    "WHERE segments.date BETWEEN '" + fmt(start) + "' AND '" + fmt(today) + "' " +
    'AND metrics.cost_micros > 0';

  var rows = [];
  var it = AdsApp.search(query);
  while (it.hasNext()) {
    var r = it.next();
    rows.push({
      date: r.segments.date,
      campaign: r.campaign.name,
      cost: Number(r.metrics.costMicros) / 1000000
    });
  }

  var res = UrlFetchApp.fetch(ENDPOINT, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-ingest-key': KEY },
    payload: JSON.stringify({ source: 'google_ads', rows: rows }),
    muteHttpExceptions: true
  });
  Logger.log(res.getResponseCode() + ' ' + res.getContentText());
  if (res.getResponseCode() !== 200) {
    throw new Error('Spend sync failed: ' + res.getResponseCode());
  }
}
```
