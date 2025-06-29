const { spawn } = require("child_process");
const fs = require("fs");

Module.register("MMM-DeepSpaceSignals", {
  defaults: {
    updateInterval: 10 * 60 * 1000,
    sources: {
      frb: true,
      gravitational: true,
      pulsar: false
    },
    apiUrls: {
      frb: "https://chime-frb-open-data.github.io/voevents.json",
      gravitational: "https://gwosc.org/api/v2/events",
      pulsar: "" // hanteras via Python
    },
    minStrength: {
      frb: null,
      gravitational: null,
      pulsar: null
    }
  },

  start: function () {
    this.events = [];
    this.fetchData();
    setInterval(() => this.fetchData(), this.config.updateInterval);
  },

  fetchData: function () {
    const promises = [];

    // FRB-data (CHIME)
    if (this.config.sources.frb) {
      promises.push(
        fetch(this.config.apiUrls.frb)
          .then(res => res.json())
          .then(data => {
            return (data.events || []).map(ev => ({
              type: "FRB",
              time: ev.time || "",
              intensity: ev.intensity || "",
              url: ev.voevent_url || "",
              level: "frb"
            }));
          })
          .catch(err => {
            console.error("FRB error:", err);
            return [];
          })
      );
    }

    // Gravitationsvågor (LIGO)
    if (this.config.sources.gravitational) {
      promises.push(
        fetch(this.config.apiUrls.gravitational)
          .then(res => res.json())
          .then(data => {
            return Object.values(data.events || {}).map(ev => ({
              type: "GW",
              time: ev.time || "",
              intensity: ev.far || "",
              url: ev.links?.["json"] || "",
              level: "gravitational"
            }));
          })
          .catch(err => {
            console.error("GW error:", err);
            return [];
          })
      );
    }

    // Pulsar-data via Python (om aktiverat)
    if (this.config.sources.pulsar) {
      promises.push(new Promise((resolve, reject) => {
        const py = spawn("python3", ["modules/MMM-DeepSpaceSignals/pulsar_fetcher.py"]);
        py.on("close", (code) => {
          if (code !== 0) {
            console.error("Python pulsar script failed with code", code);
            return resolve([]);
          }

          fs.readFile("modules/MMM-DeepSpaceSignals/pulsars.json", "utf8", (err, data) => {
            if (err) {
              console.error("Could not read pulsars.json:", err);
              return resolve([]);
            }

            try {
              const json = JSON.parse(data);
              const result = json.map(ev => ({
                type: "Pulsar",
                time: "",
                intensity: ev.period,
                url: "",
                level: "pulsar"
              }));
              resolve(result);
            } catch (e) {
              console.error("JSON parse error:", e);
              resolve([]);
            }
          });
        });
      }));
    }

    // Samla data
    Promise.all(promises)
      .then(results => {
        this.events = results.flat();
        this.sendSocketNotification("DATA", this.events);
      })
      .catch(err => console.error("Data fetch error:", err));
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "DATA") {
      this.events = payload;
      this.updateDom();
    }
  },

  getStyles: function () {
    return ["styles.css"];
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    if (!this.events.length) {
      wrapper.innerHTML = "No data";
      return wrapper;
    }

    const table = document.createElement("table");
    table.className = "dss-table";

    this.events.forEach(ev => {
      const row = document.createElement("tr");
      row.className = "dss-row " + ev.level;
      row.innerHTML = `
        <td class="dss-type">${ev.type}</td>
        <td class="dss-time">${ev.time}</td>
        <td class="dss-intensity">${ev.intensity || ""}</td>
        <td class="dss-link"><a href="${ev.url || "#"}" target="_blank">link</a></td>`;
      table.appendChild(row);
    });

    wrapper.appendChild(table);
    return wrapper;
  }
});
