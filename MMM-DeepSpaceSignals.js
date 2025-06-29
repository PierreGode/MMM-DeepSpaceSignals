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

      if (ev.type === "APOD" && ev.media_type === "image") {
        const imgRow = document.createElement("tr");
        const imgCell = document.createElement("td");
        imgCell.colSpan = 4;
        const img = document.createElement("img");
        img.src = ev.url;
        img.className = "dss-apod-image";
        imgCell.appendChild(img);
        imgRow.appendChild(imgCell);
        table.appendChild(imgRow);

        if (ev.description) {
          const descRow = document.createElement("tr");
          const descTd = document.createElement("td");
          descTd.colSpan = 4;
          descTd.className = "dss-apod-desc";
          descTd.innerHTML = ev.description;
          descRow.appendChild(descTd);
          table.appendChild(descRow);
        }
      }

      const row = document.createElement("tr");
      row.className = "dss-row " + (ev.level || "");

      const link = ev.url ? `<a href="${ev.url}" target="_blank">link</a>` : "";

      row.innerHTML = `
        <td class="dss-type">${ev.type || "No type"}</td>
        <td class="dss-time">${ev.time || "No time"}</td>
        <td class="dss-intensity">${ev.intensity || "No intensity"}</td>
        <td class="dss-link">${link}</td>
      `;

      table.appendChild(row);
    });

    wrapper.appendChild(table);
    return wrapper;
  }
});
