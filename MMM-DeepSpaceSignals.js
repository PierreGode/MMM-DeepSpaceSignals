Module.register("MMM-DeepSpaceSignals", {
  defaults: {
    updateInterval: 10 * 60 * 1000, // 10 minuter
    sources: {
      frb: true,
      gravitational: true,
      pulsar: false,
      apod: false
    },
    apiUrls: {
      frb: "https://chime-frb-open-data.github.io/voevents/voevents.json",
      gravitational: "https://gwosc.org/eventapi/jsonfull/allevents/",
      pulsar: "", // hanteras via extern Python-skript eller liknande
      apod: "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY"
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
      const row = document.createElement("tr");
      row.className = "dss-row " + ev.level;

      // Om APOD - visa bilden direkt i tabellen i en td, annars vanlig länk
      let urlCell;
      if (ev.type === "APOD" && ev.url) {
        urlCell = `
          <td class="dss-link">
            <a href="${ev.url}" target="_blank" title="${ev.intensity}">
              <img src="${ev.url}" alt="${ev.intensity}" style="max-height:50px; max-width:100px; object-fit:contain;">
            </a>
          </td>`;
      } else {
        urlCell = `
          <td class="dss-link">
            <a href="${ev.url || "#"}" target="_blank">link</a>
          </td>`;
      }

      row.innerHTML = `
        <td class="dss-type">${ev.type}</td>
        <td class="dss-time">${ev.time}</td>
        <td class="dss-intensity">${ev.intensity || ""}</td>
        ${urlCell}
      `;
      table.appendChild(row);
    });

    wrapper.appendChild(table);
    return wrapper;
  }
});
