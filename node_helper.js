const NodeHelper = require("node_helper");
const { parseStringPromise } = require("xml2js");
const fetch = require("node-fetch");

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
    this.sendSocketNotification("DATA", results);
  },

  async fetchFRB() {
    try {
      const url = this.config.apiUrls?.frb || "";
      const res = await fetch(url);
      if (!res.ok) {
        console.error("[DSS helper] FRB fetch HTTP", res.status);

        // Fallback-testdata
        return [{
          type: "FRB (offline)",
          time: new Date().toISOString(),
          intensity: "N/A",
          url: "https://chime-frb-open-data.github.io/",
          level: "grey"
        }];
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("[DSS helper] FRB response not JSON", err);
        return [];
      }

      const items = data.events || data.voevents || data || [];
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
      console.error("FRB fetch error", e);
      return [];
    }
  },

  async fetchGravitational() {
    try {
      const url = this.config.apiUrls?.gravitational || "";
      const res = await fetch(url);
      if (!res.ok) {
        console.error("[DSS helper] Gravitational fetch HTTP", res.status);
        return [];
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("[DSS helper] Gravitational response not JSON", err);
        return [];
      }

      const result = Object.values(data.events || {}).map(ev => ({
        type: "GW",
        time: ev.time,
        intensity: ev.significance,
        url: ev.url,
        level: ev.significance > 0.9 ? "red" : "yellow"
      }));

      console.log('[DSS helper] GW events fetched', result.length);
      return result;

    } catch (e) {
      console.error("Gravitational fetch error", e);
      return [];
    }
  },

  async fetchPulsar() {
    try {
      const url = this.config.apiUrls?.pulsar || "";
      const res = await fetch(url);
      if (!res.ok) {
        console.error("[DSS helper] Pulsar fetch HTTP", res.status);
        return [];
      }

      const text = await res.text();
      let json;
      try {
        json = await parseStringPromise(text);
      } catch (err) {
        console.error("[DSS helper] Pulsar response not XML", err);
        return [];
      }

      const records = json.records || [];
      const result = records.map(p => ({
        type: "Pulsar",
        time: p.observationTime[0],
        intensity: p.intensity[0],
        url: p.link[0],
        level: "green"
      }));

      console.log('[DSS helper] Pulsar records fetched', result.length);
      return result;

    } catch (e) {
      console.error("Pulsar fetch error", e);
      return [];
    }
  },

  async fetchAPOD() {
    try {
      const url = this.config.apiUrls?.apod || "";
      const res = await fetch(url);
      if (!res.ok) {
        console.error("[DSS helper] APOD fetch HTTP", res.status);
        return [];
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("[DSS helper] APOD response not JSON", err);
        return [];
      }

      if (!data.date) {
        return [];
      }

      const result = [{
        type: "APOD",
        time: data.date,
        intensity: data.title || "",
        url: data.url || data.hdurl || "",
        level: "blue"
      }];

      console.log('[DSS helper] APOD fetched', result.length);
      return result;

    } catch (e) {
      console.error("APOD fetch error", e);
      return [];
    }
  }
});
