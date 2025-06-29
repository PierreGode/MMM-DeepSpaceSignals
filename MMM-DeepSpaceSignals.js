Module.register("MMM-DeepSpaceSignals", {
  defaults: {
    updateInterval: 10 * 60 * 1000, // 10 minuter
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
      apod: "https://api.nasa.gov/planetary/apod?api_key=DIN_NASA_API_NYCKEL"
    },
    minStrength: {
      frb: null,
      gravitational: null,
      pulsar: null,
      apod: null
    }
  },

  start: function () {
    Log.log("[DSS] Starting module with config", this.config);
    this.events = [];
    this.sendSocketNotification("CONFIG", this.config);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "DATA") {
      Log.log("[DSS] Received data from helper with", payload.length, "events");
      this.events = payload;
      this.updateDom();
    }
  },

  getStyles: function () {
    return ["MMM-DeepSpaceSignals.css"];
  },

  getDom: function () {
    Log.log("[DSS] Building DOM with", this.events.length, "events");
    const wrapper = document.createElement("div");
    if (!this.events.length) {
      wrapper.innerHTML = "No data";
      return wrapper;
    }

    const table = document.createElement("table");
    table.className = "dss-table";

    this.events.forEach(ev => {
      console.log("[DSS] Rendering event:", ev);
      const row = document.createElement("tr");
      row.className = "dss-row " + (ev.level || "");

      row.innerHTML = `
        <td class="dss-type">${ev.type || "No type"}</td>
        <td class="dss-time">${ev.time || "No time"}</td>
        <td class="dss-intensity">${ev.intensity || "No intensity"}</td>
        <td class="dss-link"><a href="${ev.url || "#"}" target="_blank">link</a></td>
      `;

      table.appendChild(row);
    });

    wrapper.appendChild(table);
    return wrapper;
  }
});
