# 🛰️ MMM-DeepSpaceSignals – AGENT.md

## 📋 Purpose

MMM-DeepSpaceSignals is a MagicMirror² module that displays live deep space signals and astronomy data (e.g., Fast Radio Bursts, gravitational waves, pulsar discoveries, and major space news/images).  
The goal: to give real-time, visually rich insight into cosmic phenomena, updated automatically.

---

## ⚙️ How It Works

- The NodeHelper polls remote APIs at intervals (default: every 10 minutes).
- It fetches, parses, and caches events as objects, then emits them to the front end for display.
- If no data or an error occurs, the module displays an "offline" status per source.

**Core sources:**
- FRB: Fast Radio Burst real-time events
- Gravitational waves: GW alerts (e.g., from LIGO/Virgo/KAGRA)
- Pulsar discoveries: Pulsar catalogue updates
- Space news/images: NASA/ESA RSS and APIs

---

## 🗂️ API Source Configuration

**Configure valid API endpoints for each data source.**  
Example config:

```js
config.js:

{
  module: "MMM-DeepSpaceSignals",
  position: "top_right",
  config: {
    updateInterval: 10 * 60 * 1000,
    maxWidth: "340px",
    sources: {
      frb: true,
      gravitational: true,
      pulsar: false,
      apod: true
    },
    apiUrls: {
      frb: "https://chime-frb-open-data.github.io/voevents/voevents.json",
      gravitational: "https://gwosc.org/eventapi/jsonfull/allevents/",
      pulsar: "https://www.herta-experiment.org/frbstats/catalogue.json",
      apod: "https://api.nasa.gov/planetary/apod?api_key=*****"
    },
    minStrength: {
      frb: null,
      gravitational: null,
      pulsar: null,
      apod: null
    }
  }
},

```

**Supported data sources and their URLs:**

| Type              | Example API URL                                                                                  | Format        | Auth     |
|-------------------|--------------------------------------------------------------------------------------------------|--------------|----------|
| FRB               | https://chime-frb-open-data.github.io/voevents/voevents.json                                     | JSON         | No       |
| FRB (backup)      | https://www.herta-experiment.org/frbstats/catalogue.json                                         | JSON         | No       |
| Gravitational GW  | https://gwosc.org/eventapi/jsonfull/allevents/                                                   | JSON         | No       |
| Pulsar            | Use psrqpy script to generate `/home/pi/pulsars.json` from ATNF catalog                          | JSON         | No       |
| NASA APOD         | https://api.nasa.gov/planetary/apod?api_key=YOUR_KEY                                             | JSON         | Yes*     |
| NASA News         | https://www.nasa.gov/news-release/feed/                                                          | RSS/XML      | No       |
| ESA Science News  | https://sci.esa.int/newssyndication/rss/sciweb.xml                                               | RSS/XML      | No       |

*You can use the demo key: `DEMO_KEY` (rate-limited), or get your own [here](https://api.nasa.gov/).

---

## 🛠️ Troubleshooting & Debugging

**If you see only:**  
`FRB (offline) [timestamp] N/A link`  
or a blank/empty table:

- **Check your config:** Ensure all URLs are reachable and not placeholders.
- **Check internet/network:** Your device must access external APIs.
- **Inspect logs:**  
  - `pm2 logs mm` or `~/.pm2/logs/mm-error.log`
  - Look for HTTP errors, timeouts, or parsing errors.
- **API changes:** Data structures or endpoints may change. Update the URLs if data sources move or are deprecated.

---

## 📝 Data Format Examples

**FRB event (CHIME/FRB):**
```json
{
  "name": "FRB20250101A",
  "date": "2025-01-01T12:34:56.000Z",
  "fluence": 2.1,
  "url": "https://chime-frb-open-data.github.io/voevents/2025/01/01/FRB20250101A.voevent"
}
```

**Gravitational wave event (GWOSC):**
```json
{
  "event": "S230518h",
  "date": "2023-05-18T17:42:00Z",
  "significance": 0.98,
  "link": "https://gracedb.ligo.org/superevents/S230518h/"
}
```

**Pulsar (ATNF, via psrqpy):**
```json
{
  "JNAME": "J0437-4715",
  "P0": 0.005757,
  "DM": 2.64,
  "RAJ": "04:37:15.8",
  "DECJ": "-47:15:09"
}
```

**NASA APOD (Astronomy Picture of the Day):**
```json
{
  "date": "2025-06-29",
  "title": "Galactic Fireworks in NGC 1275",
  "explanation": "A stunning new image from ...",
  "media_type": "image",
  "url": "https://apod.nasa.gov/apod/image/2506/PerseusGalaxyCluster.jpg"
}
```

---

## 🤖 Integration & Automation Guidance

- **For AI/Codex/agents:**  
  - Always validate URLs and check JSON/XML structure before parsing.
  - If a data source returns empty or invalid, trigger a fallback or error message.
  - For RSS feeds, extract latest headlines, summaries, and links.
  - On first startup, create example config using the latest recommended URLs.
  - If `updateInterval` is missed or data is unchanged, log a warning for debugging.

- **For human contributors:**  
  - Pull requests for new API integrations are welcome!
  - Clearly document any API structure changes in this file.
  - Keep all dependencies (e.g. `xml2js`) updated in `package.json`.
  - For new data sources, add a sample object to the examples above.
  - Always include full, working code with no placeholders.

---

## 🔗 Useful Links

- [CHIME/FRB Open Data](https://chime-frb-open-data.github.io/)
- [FRBSTATS Catalog](https://www.herta-experiment.org/frbstats/)
- [LIGO/Virgo GWOSC Events](https://gwosc.org/)
- [NASA APOD](https://apod.nasa.gov/apod/astropix.html)
- [NASA API Registration](https://api.nasa.gov/)
- [ESA Science & Technology](https://sci.esa.int/web/guest/home)
- [psrqpy (Pulsar data Python)](https://psrqpy.readthedocs.io/)

---

**Keep your API endpoints up to date and your module will always show the latest deep space discoveries!**
