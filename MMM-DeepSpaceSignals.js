// MMM-DeepSpaceSignals.js
Module.register("MMM-DeepSpaceSignals", {
  defaults: {
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
      frbBackup: "https://raw.githubusercontent.com/HeRTA/FRBSTATS/main/catalogue.json",
      gravitational: "https://gwosc.org/eventapi/jsonfull/allevents/",
      pulsar: "pulsars.json",
      apod: "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY"
    },
    minStrength: {}
  },

  start() {
    this.dataLoaded = false;
    this.events = [];
    this.apod = null;
    this.sendSocketNotification("CONFIG", this.config);
  },

  getStyles() {
    return ["MMM-DeepSpaceSignals.css"];
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "DATA") {
      this.events = payload.events || [];
      this.apod = payload.apod || null;
      this.dataLoaded = true;
      this.updateDom();
    }
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "dss-wrapper";

    if (!this.dataLoaded) {
      wrapper.innerText = "Loading space signals...";
      return wrapper;
    }

    const table = document.createElement("table");
    table.className = "dss-table";

    // Only show header if there are events to display
    if (this.events.length > 0) {
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");

      ["Type", "Time", "Intensity"].forEach(text => {
        const th = document.createElement("th");
        th.innerText = text;
        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);
    }

    const tbody = document.createElement("tbody");

    this.events.forEach(event => {
      const row = document.createElement("tr");
      row.className = `dss-row ${event.level || ""}`;

      const typeCell = document.createElement("td");
      typeCell.innerText = event.type || "";
      row.appendChild(typeCell);

      const timeCell = document.createElement("td");
      timeCell.innerText = event.time || "";
      row.appendChild(timeCell);

      const strengthCell = document.createElement("td");
      strengthCell.innerText = event.intensity !== null ? event.intensity : "";
      row.appendChild(strengthCell);


      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);

    // Show APOD image if available
    if (this.apod && this.apod.media_type === "image") {
      const apodContainer = document.createElement("div");
      apodContainer.className = "dss-apod";

      const img = document.createElement("img");
      img.src = this.apod.url;
      img.alt = this.apod.title || "APOD";
      img.style.maxWidth = "200px";
      apodContainer.appendChild(img);

      if (this.apod.explanation) {
        const captionWrapper = document.createElement("div");
        captionWrapper.className = "dss-apod-caption-wrapper";

        const caption = document.createElement("div");
        caption.className = "dss-apod-caption";
        caption.innerText = this.apod.explanation;
        captionWrapper.appendChild(caption);
        apodContainer.appendChild(captionWrapper);

        window.setTimeout(() => {
          const lineHeight = parseFloat(window.getComputedStyle(caption).lineHeight) || 16;
          const maxHeight = lineHeight * 10;
          captionWrapper.style.maxHeight = maxHeight + "px";
          if (caption.scrollHeight > maxHeight) {
            const scrollAmount = caption.scrollHeight - maxHeight;
            caption.style.setProperty("--scroll-distance", scrollAmount + "px");
            caption.classList.add("scrolling");
          }
        }, 100);
      }

      wrapper.appendChild(apodContainer);
    }

    return wrapper;
  }
});
