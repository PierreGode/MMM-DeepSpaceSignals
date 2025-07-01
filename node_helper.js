const NodeHelper = require("node_helper");
const { parseStringPromise } = require("xml2js");
const fetch = require("node-fetch");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");

async function readLocalFileFlexible(relPath) {
  const attempts = [
    path.resolve(__dirname, relPath),
    path.join(__dirname, "data", path.basename(relPath))
  ];
  for (const p of attempts) {
    try {
      const text = await fsp.readFile(p, { encoding: "utf-8" });
      console.log("[DSS helper] Reading local file:", p);
      return text;
    } catch (err) {
      console.warn("[DSS helper] Local file not found at", p);
    }
  }
  throw new Error(`Local file not found: ${relPath}`);
}

module.exports = NodeHelper.create({
  start() {
    this.config = {};
    this.events = [];
    console.log('[DSS helper] started');
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "CONFIG") {
      console.log('[DSS helper] Received config');
      this.config = payload;
      this.fetchAll();
      this.scheduleFetch();
    }
  },

  scheduleFetch() {
    clearInterval(this.fetchTimer);
    console.log('[DSS helper] Scheduling fetch every', this.config.updateInterval || 600000, 'ms');
    this.fetchTimer = setInterval(() => {
      this.fetchAll();
    }, this.config.updateInterval || 600000);
  },

  filterEvents(events) {
    return events.filter(ev => {
      if (!ev || !ev.type) return false;
      if (!ev.time || ev.time === 'No time') return false;
      if (!ev.intensity || ev.intensity === 'No intensity') return false;
      return true;
    });
  },

  async fetchAll() {
    console.log('[DSS helper] Fetching all sources');
    let events = [];
    let apod = null;

    if (this.config.sources.frb) {
      const frb = await this.fetchFRB();
      events = events.concat(frb);
    }

    if (this.config.sources.gravitational) {
      const grav = await this.fetchGravitational();
      events = events.concat(grav);
    }

    if (this.config.sources.pulsar) {
      const pulsars = await this.fetchPulsar();
      events = events.concat(pulsars);
    }

    if (this.config.sources.apod) {
      const apodData = await this.fetchAPOD();
      if (Array.isArray(apodData) && apodData.length) {
        apod = apodData[0];
      }
    }

    const filtered = this.filterEvents(events);
    this.events = filtered;

    const payload = { events: filtered, apod };

    console.log('[DSS helper] Sending', filtered.length, 'events to module');
    if (filtered.length) {
      console.log('[DSS helper] Sample events to module:', JSON.stringify(filtered.slice(0, 3), null, 2));
    }

    this.sendSocketNotification('DATA', payload);
  },

  async fetchFRB() {
    const primary = this.config.apiUrls?.frb;
    const backup = this.config.apiUrls?.frbBackup ||
      "https://raw.githubusercontent.com/HeRTA/FRBSTATS/main/catalogue.json";

    const urls = [primary, backup].filter(Boolean);

    for (const url of urls) {
      try {
        console.log("[DSS helper] Fetching FRB from", url);
        let text;

        if (url.startsWith("http://") || url.startsWith("https://")) {
          const res = await fetch(url);
          if (!res.ok) {
            console.error("[DSS helper] FRB fetch HTTP error", res.status, "for", url);
            continue;
          }
          text = await res.text();

          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("json")) {
            console.error("[DSS helper] FRB fetch non-JSON content-type", ct);
            continue;
          }
        } else {
          try {
            text = await readLocalFileFlexible(url);
          } catch (err) {
            console.error("[DSS helper] FRB local file error", err);
            continue;
          }
        }

        console.log("[DSS helper] FRB raw data length:", text.length);

        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("[DSS helper] FRB JSON parse error", err);
          continue;
        }

        const items = data.events || data.voevents || data || [];
        console.log("[DSS helper] FRB parsed items count:", Array.isArray(items) ? items.length : Object.keys(items).length);

        const arr = Array.isArray(items) ? items : Object.values(items);

        const result = arr.slice(0, 5).map(item => {
          const fluence = parseFloat(item.fluence);
          let level = "grey";
          if (!isNaN(fluence)) {
            if (fluence > 100) level = "red";
            else if (fluence > 20) level = "orange";
            else if (fluence >= 5) level = "yellow";
            else if (fluence >= 1) level = "green";
            else level = "blue";
          }
          return {
            type: "FRB",
            time: item.time || item.date || item.detected || item.datetime || "",
            intensity: item.fluence || item.signal || item.snr || "",
            url: item.url || item.voevent || item.link || "",
            level
          };
        });

        console.log('[DSS helper] FRB events fetched', result.length);
        return result;

      } catch (e) {
        console.error("[DSS helper] FRB fetch error", e);
      }
    }

    console.warn('[DSS helper] Falling back to local FRB sample');
    return this.loadLocalFRBSample();
  },

  async fetchGravitational() {
    try {
      const url = this.config.apiUrls?.gravitational || "";
      console.log("[DSS helper] Fetching GW from", url);
      const res = await fetch(url);
      if (!res.ok) {
        console.error("[DSS helper] Gravitational fetch HTTP error", res.status);
        return [];
      }

      const text = await res.text();
      console.log("[DSS helper] GW raw data length:", text.length);

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("[DSS helper] GW JSON parse error", err);
        return [];
      }

      const eventsObj = data.events || {};
      const eventsArray = Array.isArray(eventsObj) ? eventsObj : Object.values(eventsObj);

      console.log("[DSS helper] GW parsed events count:", eventsArray.length);

      const result = eventsArray.map(ev => ({
        type: "GW",
        time: ev.time || ev.event_time || ev.event_date || ev.start_time || ev.gps_time || ev.date || "No time",
        intensity: ev.significance || ev.false_alarm_rate || ev.snr || ev.far || ev.bayes_factor || "No intensity",
        url: ev.url || ev.link || ev.superevent || "#",
        level: (ev.significance && ev.significance > 0.9) ? "red" : "yellow"
      }));

      console.log('[DSS helper] GW events fetched', result.length);
      if (result.length) {
        console.log('[DSS helper] GW sample events:', JSON.stringify(result.slice(0, 3), null, 2));
      }
      return result;

    } catch (e) {
      console.error("[DSS helper] GW fetch error", e);
      return [];
    }
  },

  async fetchPulsar() {
    try {
      let url = this.config.apiUrls?.pulsar || "";
      if (!url) {
        console.log("[DSS helper] Pulsar fetch skipped, no URL configured");
        return [];
      }
      console.log("[DSS helper] Fetching Pulsar from", url);

      let text;

      if (url.endsWith(".py")) {
        try {
          const scriptPath = path.resolve(__dirname, url);
          text = await new Promise((resolve, reject) => {
            exec(`python3 ${scriptPath}`, { cwd: __dirname }, (error, stdout, stderr) => {
              if (error) {
                console.error(`[DSS helper] ${url} error: ${error.message}`);
                return reject(error);
              }
              resolve(stdout);
            });
          });
        } catch (err) {
          console.error("[DSS helper] Pulsar script execution error", err);
          return [];
        }
      } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
        const filePath = path.resolve(__dirname, url);
        try {
          await fsp.access(filePath);
          console.log(`[DSS helper] Local pulsar file exists: ${filePath}`);
        } catch {
          console.log(`[DSS helper] Local pulsar file missing. Running pulsar_fetcher.py ...`);
          await new Promise((resolve, reject) => {
            exec("python3 pulsar_fetcher.py", { cwd: __dirname }, (error, stdout, stderr) => {
              if (error) {
                console.error(`[DSS helper] pulsar_fetcher.py error: ${error.message}`);
                return reject(error);
              }
              console.log("[DSS helper] pulsar_fetcher.py finished");
              resolve();
            });
          });
        }
        try {
          text = await readLocalFileFlexible(url);
        } catch (err) {
          console.error("[DSS helper] Pulsar local file error", err);
          return [];
        }
      } else if (url.startsWith("http://") || url.startsWith("https://")) {
        const res = await fetch(url);
        if (!res.ok) {
          console.error("[DSS helper] Pulsar fetch HTTP error", res.status);
          return [];
        }
        text = await res.text();
      }

      console.log("[DSS helper] Pulsar raw data length:", text.length);

      // Trim any warnings or log lines before the JSON/XML content
      let cleaned = text.trim();
      const jsonStart = cleaned.search(/[\[{]/);
      if (jsonStart > 0) {
        console.warn(
          `[DSS helper] Pulsar output has ${jsonStart} leading non-JSON characters, trimming`
        );
        cleaned = cleaned.slice(jsonStart);
      }

      let records = [];
      if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
        try {
          const json = JSON.parse(cleaned);
          records = Array.isArray(json)
            ? json
            : json.records || json.items || json.data || [];
        } catch (jsonErr) {
          console.error("[DSS helper] Pulsar JSON parse error", jsonErr);
          return [];
        }
      } else if (cleaned.startsWith("<")) {
        try {
          const xml = await parseStringPromise(cleaned);
          records = (xml.records && xml.records.record) || [];
        } catch (xmlErr) {
          console.error("[DSS helper] Pulsar parse error", xmlErr);
          return [];
        }
      } else {
        console.error("[DSS helper] Pulsar unrecognized content");
        return [];
      }

      console.log("[DSS helper] Pulsar records count:", records.length);

      const result = records.map(p => ({
        type: "Pulsar",
        time: (p.observationTime && p.observationTime[0]) || (p.time && p.time[0]) || p.date?.[0] || p.time || p.date || "",
        intensity: (p.intensity && p.intensity[0]) || (p.snr && p.snr[0]) || (p.period && p.period[0]) || (p.P0 && p.P0[0]) || p.intensity || p.snr || p.period || p.P0 || "",
        url: (p.link && p.link[0]) || (p.url && p.url[0]) || p.link || p.url || "",
        level: "green"
      }));

      console.log('[DSS helper] Pulsar records fetched', result.length);
      return result;

    } catch (e) {
      console.error("[DSS helper] Pulsar fetch error", e);
      return [];
    }
  },

  async fetchAPOD() {
    try {
      const url = this.config.apiUrls?.apod || "";
      console.log("[DSS helper] Fetching APOD from", url);
      const res = await fetch(url);
      if (!res.ok) {
        console.error("[DSS helper] APOD fetch HTTP error", res.status);
        return [];
      }

      const text = await res.text();
      console.log("[DSS helper] APOD raw data length:", text.length);

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("[DSS helper] APOD JSON parse error", err);
        return [];
      }

      if (!data.date) {
        console.warn("[DSS helper] APOD response missing date");
        return [];
      }

      const result = [{
        type: "APOD",
        time: data.date,
        intensity: data.title || "",
        url: data.url || data.hdurl || "",
        level: "blue",
        media_type: data.media_type,
        explanation: data.explanation || ""
      }];

      console.log('[DSS helper] APOD fetched', result.length);
      return result;

    } catch (e) {
      console.error("[DSS helper] APOD fetch error", e);
      return [];
    }
  },

  loadLocalFRBSample() {
    try {
      const file = path.join(__dirname, 'data', 'frb_sample.json');
      const raw = fs.readFileSync(file, 'utf8');
      const json = JSON.parse(raw);
      const arr = Array.isArray(json) ? json : (json.events || []);
      return arr.map(item => {
        const fluence = parseFloat(item.fluence);
        let level = 'grey';
        if (!isNaN(fluence)) {
          if (fluence > 100) level = 'red';
          else if (fluence > 20) level = 'orange';
          else if (fluence >= 5) level = 'yellow';
          else if (fluence >= 1) level = 'green';
          else level = 'blue';
        }
        return {
          type: 'FRB',
          time: item.time || item.date || '',
          intensity: item.fluence || item.signal || '',
          url: item.url || '',
          level
        };
      });
    } catch (err) {
      console.error('[DSS helper] Failed to load local FRB sample', err);
      return [{
        type: 'FRB (offline)',
        time: new Date().toISOString(),
        intensity: 'N/A',
        url: 'https://chime-frb-open-data.github.io/',
        level: 'grey'
      }];
    }
  }
});
