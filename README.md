# 🛰️ MMM-DeepSpaceSignals

A MagicMirror² module that polls various astronomy data sources for new and unusual signals.  
It can show recent **Fast Radio Bursts**, **gravitational wave alerts**, and **pulsar observations**.  
It can also display the latest **NASA Astronomy Picture of the Day (APOD)**.

---

## 🛠️ Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/PierreGode/MMM-DeepSpaceSignals
cd MMM-DeepSpaceSignals
npm install
```

The module uses a Node helper to fetch data server-side. Your configuration is sent to the helper when the module starts, and it handles periodic updates.

---

## 🔄 Update

```bash
cd ~/MagicMirror/modules/MMM-DeepSpaceSignals
git pull
npm install
```

---

## 🐍 Optional: Python Pulsar Support (ATNF Fetcher)

If you want to use the included Python script `pulsar_fetcher.py` to fetch pulsar data from the ATNF catalog, install the required Python packages.

**On Raspberry Pi:**

```bash
pip install psrqpy astropy --break-system-packages
```

This will generate a `pulsars.json` file that the module can use.

---

## ⚙️ Configuration

Add the module to the `modules` array in `config.js`:

```javascript
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
      frbBackup: "https://www.herta-experiment.org/frbstats/catalogue.json",
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
}
```

`intensity` values depend on the data source:  
- FRB events use **fluence (Jy·ms)**  
- Gravitational waves show **significance**  
- Pulsars may report **signal-to-noise ratio (SNR)**

---

## 🧠 Signal Types Explained

This module detects and displays multiple types of deep space signals. Here's what each one means:

### 💥 FRB – Fast Radio Burst
Fast Radio Bursts are extremely brief but powerful pulses of radio waves from deep space.  
- Duration: milliseconds  
- Possible sources: magnetars, neutron stars, or unknown phenomena  
- Measured in **fluence** (Jy·ms)  
- Often mysterious and still under research

### 🌊 GE – Gravitational Events (Gravitational Waves)
Gravitational waves are ripples in the fabric of spacetime, typically caused by:  
- Colliding black holes  
- Merging neutron stars  
- Detected by observatories like **LIGO** and **Virgo**  
- Strength is indicated by a **significance score** or **FAP** (False Alarm Probability)

### 🌟 Pulsar
Pulsars are fast-rotating neutron stars that emit beams of electromagnetic radiation.  
- Often observed as regular pulses (like a cosmic lighthouse)  
- Identified by **SNR** (Signal-to-Noise Ratio), rotation speed, or pulse period  
- Useful for studying extreme physics like gravity and magnetism

---

## 🌐 Data Sources

The helper polls the following public APIs:

| Source          | Description                         | API Key Required |
|-----------------|-------------------------------------|------------------|
| **CHIME/FRB**   | Recent Fast Radio Burst detections  | ❌ No            |
| **CHIME/FRB (backup)** | Mirror of FRB events             | ❌ No            |
| **LIGO/Virgo**  | Gravitational wave alerts           | ❌ No            |
| **ATNF Pulsars**| Pulsar observations (JSON or script)| ❌ / Optional    |
| **NASA APOD**   | Daily astronomy image + caption     | ✅ Yes (free)    |

> When enabled, the module displays the APOD image and its explanation directly in the table if the media type is an image. The image is constrained to a maximum width of 200 px to fit nicely inside the module.

If the primary FRB endpoint is unreachable (e.g., 404 error), the module
tries the `frbBackup` URL. If that also fails, it loads the local file
`data/frb_sample.json`.

To get your own NASA API key, visit: [https://api.nasa.gov/](https://api.nasa.gov/)

---

## 📃 License

MIT © [Pierre Gode](https://github.com/PierreGode)
