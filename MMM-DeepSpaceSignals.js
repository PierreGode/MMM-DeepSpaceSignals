Module.register("MMM-DeepSpaceSignals", {
  defaults: {
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
  },

  start: function () {
    this.events = [];
    this.sendSocketNotification("CONFIG", this.config);
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
