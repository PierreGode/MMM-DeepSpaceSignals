# MMM-DeepSpaceSignals

A MagicMirror² module that polls various astronomy data sources for new and unusual
signals. It can show recent Fast Radio Bursts, gravitational wave alerts and
pulsar observations.

## Installation

```bash
cd ~/MagicMirror/modules
git clone <repository-url> MMM-DeepSpaceSignals
cd MMM-DeepSpaceSignals
npm install
pip install psrqpy
pip install astropy
```

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
      pulsar: false
    },
    apiUrls: {
      frb: "https://chimefrb-open-data-api.naic.edu/frb",
      gravitational: "https://example.com/ligo/api",
      pulsar: "https://pulsar.example.com/api"
    },
    minStrength: {
      frb: null,
      gravitational: null,
      pulsar: null
    }
  }
}
```

## Data Sources
The helper polls a few public APIs:
- **CHIME/FRB** – recent Fast Radio Burst detections
- **LIGO/Virgo** – gravitational wave alerts
- **ATNF Pulsar Database** – pulsar observations

The default URLs shown above are placeholders. Replace them with the real API
endpoints for your setup in the `apiUrls` section of the module configuration.

## License
MIT
