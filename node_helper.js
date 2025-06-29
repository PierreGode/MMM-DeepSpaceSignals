const NodeHelper = require("node_helper");
const { parseStringPromise } = require("xml2js");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

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

  async fetchAll() {
    console.log('[DSS helper] Fetching all sources');
    let results = [];
    if (this.config.sources.frb) {
      const frb = await this.fetchFRB();
      results = results.concat(frb);
    }
    if (this.config.sources.gravitational) {
      const grav = await this.fetchGravitational();
      results = results.concat(grav);
    }
    if (this.config.sources.pulsar) {
      const pulsars = await this.fetchPulsar();
      results = results.concat(pulsars);
    }
    if (this.config.sources.apod) {
      const apod = await this.fetchAPOD();
      results = results.concat(apod);
    }
    this.events = results;
    console.log('[DSS helper] Sending', results.length, 'events to module');
    if (results.length) {
      console.log('[DSS helper] Sample events to module:', JSON.stringify(results.slice(0, 3), null, 2));
    }
    this.sendSocketNotification("DATA", results);
  },

  async fetchFRB() {
    try {
      const url = this.config.apiUrls?.frb || "";
      console.log("[DSS helper] Fetching FRB from", url);
      const res = await fetch(url);
      if (!res.ok) {
        console.error("[DSS helper] FRB fetch HTTP error", res.status);
        return this.loadLocalFRBSample();
      }

      const text = await res.text();
      console.log("[DSS helper] FRB raw data length:", text.length);

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("[DSS helper] FRB JSON parse error", err);
        return [];
      }

      const items = data.events || data.voevents || data || [];
      console.log("[DSS helper] FRB parsed items count:", Array.isArray(items) ? items.length : Object.keys(items).length);

      const arr = Array.isArray(items) ? items : Object.values(items);

      const result = arr.slice(0, 5).map(item => ({
        type: "FRB",
        time: item.time || item.date || item.detected || item.datetime || "",
        intensity: item.fluence || item.signal || item.snr || "",
        url: item.url || item.voevent || item.link || "",
        level: "red"
      }));

      console.log('[DSS helper] FRB events fetched', result.length);
      return result;

    } catch (e) {
      console.error("[DSS helper] FRB fetch error", e);
      return this.loadLocalFRBSample();
    }
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
      const url = this.config.apiUrls?.pulsar || "";
      if (!url) {
        console.log("[DSS helper] Pulsar fetch skipped, no URL configured");
        return [];
      }
      console.log("[DSS helper] Fetching Pulsar from", url);
      const res = await fetch(url);
      if (!res.ok) {
        console.error("[DSS helper] Pulsar fetch HTTP error", res.status);
        return [];
      }

      const text = await res.text();
      console.log("[DSS helper] Pulsar raw data length:", text.length);

      let json;
      try {
        json = await parseStringPromise(text);
      } catch (err) {
        console.error("[DSS helper] Pulsar XML parse error", err);
        return [];
      }

      const records = (json.records && json.records.record) || [];
      console.log("[DSS helper] Pulsar records count:", records.length);

      const result = records.map(p => ({
        type: "Pulsar",
        time: p.observationTime ? p.observationTime[0] : "",
        intensity: p.intensity ? p.intensity[0] : "",
        url: p.link ? p.link[0] : "",
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
        description: data.explanation || ""
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
      return arr.map(item => ({
        type: 'FRB',
        time: item.time || item.date || '',
        intensity: item.fluence || item.signal || '',
        url: item.url || '',
        level: 'grey'
      }));
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
