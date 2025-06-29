Module.register("MMM-DeepSpaceSignals", {
  defaults: {
    updateInterval: 10 * 60 * 1000,
    sources: {
      frb: true,
      gravitational: true,
      pulsar: false
    },
    apiUrls: {
      frb: "https://raw.githubusercontent.com/chime-frb-open-data/voevents/main/voevents.json",
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
    Log.log("[DSS] Starting module with config", this.config);
    this.events = [];
    this.sendSocketNotification("CONFIG", this.config);
  },


  socketNotificationReceived: function (notification, payload) {
    if (notification === "DATA") {
      Log.log("[DSS] Received data from helper", payload.length);
      this.events = payload;
      this.updateDom();
    }
  },

  getStyles: function () {
    return ["styles.css"];
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
