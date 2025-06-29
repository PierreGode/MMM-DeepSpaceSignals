# MMM-DeepSpaceSignals

A MagicMirror² module that polls various astronomy data sources for new and unusual
signals. It can show recent Fast Radio Bursts, gravitational wave alerts and
pulsar observations. It can also display the latest NASA Astronomy Picture of
the Day (APOD).

## Installation

```bash
cd ~/MagicMirror/modules
git clone <repository-url> MMM-DeepSpaceSignals
cd MMM-DeepSpaceSignals
npm install
```

The module uses a Node helper to fetch data server-side. Your configuration is
sent to the helper when the module starts, and it handles periodic updates.

## Configuration
Add the module to the `modules` array in `config.js`:

```javascript
{
  module: "MMM-DeepSpaceSignals",
  position: "top_right",
  config: {
    updateInterval: 10 * 60 * 1000,
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

## Data Sources
The helper polls a few public APIs:
- **CHIME/FRB** – recent Fast Radio Burst detections
- **LIGO/Virgo** – gravitational wave alerts
- **ATNF Pulsar Database** – pulsar observations
- **NASA APOD** – daily astronomy image and description

The repository also includes a small Python helper script used for querying the
ATNF database directly. If you plan to run it, install `psrqpy` and `astropy`
and execute `pulsar_fetcher.py` manually or from a cron job.

The default URLs shown above are examples. The FRB URL points to the CHIME/FRB
open data JSON file, while the others should be replaced with the appropriate
endpoints for your setup in the `apiUrls` section of the module configuration.
For the NASA APOD API you can use the `DEMO_KEY` or register your own API key at
<https://api.nasa.gov/>.

## License
MIT
