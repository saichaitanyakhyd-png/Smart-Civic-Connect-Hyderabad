const state = {
  stream: null,
  photoData: "",
  location: null,
  reports: [],
};

const API_BASE = "";

const els = {
  tabs: document.querySelectorAll(".nav-tab"),
  reportPanel: document.querySelector("#report-panel"),
  reportsPanel: document.querySelector("#reports-panel"),
  form: document.querySelector("#reportForm"),
  startCameraBtn: document.querySelector("#startCameraBtn"),
  captureBtn: document.querySelector("#captureBtn"),
  photoInput: document.querySelector("#photoInput"),
  cameraPreview: document.querySelector("#cameraPreview"),
  photoPreview: document.querySelector("#photoPreview"),
  emptyPreview: document.querySelector("#emptyPreview"),
  cameraHint: document.querySelector("#cameraHint"),
  locationBtn: document.querySelector("#locationBtn"),
  locationText: document.querySelector("#locationText"),
  resetBtn: document.querySelector("#resetBtn"),
  reportsList: document.querySelector("#reportsList"),
  totalReports: document.querySelector("#totalReports"),
  photoReports: document.querySelector("#photoReports"),
  locationReports: document.querySelector("#locationReports"),
  clearReportsBtn: document.querySelector("#clearReportsBtn"),
  toast: document.querySelector("#toast"),
};

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 2600);
}

async function apiRequest(url, options = {}) {
  const response = await fetchWithFallback(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

async function fetchWithFallback(url, options = {}) {
  const requestOptions = {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  };
  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const directBackendUrls = isLocalhost
    ? Array.from({ length: 25 }, (_, index) => `http://127.0.0.1:${5600 + index}`)
    : [];
  const bases = [API_BASE, ...directBackendUrls];
  let lastError;

  for (const base of bases) {
    try {
      const response = await fetch(`${base}${url}`, requestOptions);
      if (response.status === 502 || (response.status === 404 && url.startsWith("/api/"))) {
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    lastError?.message === "Failed to fetch"
      ? "Cannot connect to backend. Make sure the server is running."
      : lastError?.message || "Request failed."
  );
}

async function loadReports() {
  try {
    const data = await apiRequest("/api/reports");
    state.reports = data.reports || [];
    renderReports();
  } catch {
    showToast("Backend is not reachable. Start it with npm start.");
  }
}

function switchTab(tabName) {
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  els.reportPanel.classList.toggle("active", tabName === "report");
  els.reportsPanel.classList.toggle("active", tabName === "reports");
  if (tabName === "reports") renderReports();
}

function setPreview(src) {
  state.photoData = src;
  els.photoPreview.src = src;
  els.photoPreview.hidden = false;
  els.emptyPreview.hidden = true;
  els.cameraPreview.hidden = true;
}

function resetPreview() {
  state.photoData = "";
  els.photoPreview.removeAttribute("src");
  els.photoPreview.hidden = true;
  els.emptyPreview.hidden = false;
  els.cameraPreview.hidden = true;
}

function stopCamera() {
  if (!state.stream) return;
  state.stream.getTracks().forEach((track) => track.stop());
  state.stream = null;
  els.captureBtn.disabled = true;
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast("Camera is not supported in this browser.");
    return;
  }

  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    els.cameraPreview.srcObject = state.stream;
    els.cameraPreview.hidden = false;
    els.photoPreview.hidden = true;
    els.emptyPreview.hidden = true;
    els.captureBtn.disabled = false;
    els.cameraHint.textContent = "Camera is active. Capture the photo when the issue is visible.";
  } catch {
    els.cameraHint.textContent = "Camera permission was blocked or unavailable.";
    showToast("Unable to open camera. Try uploading a photo instead.");
  }
}

function capturePhoto() {
  if (!state.stream) return;
  const video = els.cameraPreview;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  setPreview(canvas.toDataURL("image/jpeg", 0.88));
  stopCamera();
  els.cameraHint.textContent = "Photo captured successfully.";
}

function readUploadedPhoto(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Please choose an image file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    resizeImage(reader.result)
      .then((imageData) => {
        stopCamera();
        setPreview(imageData);
        els.cameraHint.textContent = "Photo uploaded and optimized for upload.";
      })
      .catch(() => {
        stopCamera();
        setPreview(reader.result);
        els.cameraHint.textContent = "Photo uploaded from your device.";
      });
  };
  reader.readAsDataURL(file);
}

function resizeImage(dataUrl, maxSize = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function getLocation() {
  if (!navigator.geolocation) {
    showToast("Location is not supported in this browser.");
    return;
  }

  els.locationBtn.disabled = true;
  els.locationBtn.textContent = "Getting...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.location = {
        lat: position.coords.latitude.toFixed(6),
        lng: position.coords.longitude.toFixed(6),
      };
      els.locationText.textContent = `${state.location.lat}, ${state.location.lng}`;
      els.locationBtn.textContent = "Update location";
      els.locationBtn.disabled = false;
      showToast("Location attached.");
    },
    () => {
      els.locationBtn.textContent = "Get location";
      els.locationBtn.disabled = false;
      showToast("Location permission was blocked.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function formValue(id) {
  return document.querySelector(`#${id}`).value.trim();
}

function resetForm() {
  stopCamera();
  els.form.reset();
  resetPreview();
  state.location = null;
  els.locationText.textContent = "No location attached yet";
  els.locationBtn.textContent = "Get location";
  els.cameraHint.textContent = "Camera works best on localhost or a secure browser context.";
}

async function submitReport(event) {
  event.preventDefault();

  if (!state.photoData) {
    showToast("Add a photo before uploading the report.");
    return;
  }

  const report = {
    name: formValue("reporterName") || "Anonymous citizen",
    phone: formValue("phoneNumber") || "Not provided",
    category: formValue("category"),
    landmark: formValue("landmark"),
    description: formValue("description"),
    photo: state.photoData,
    location: state.location,
  };

  try {
    const submitButton = els.form.querySelector(".primary-btn");
    submitButton.disabled = true;
    submitButton.textContent = "Uploading...";
    const data = await apiRequest("/api/reports", {
      method: "POST",
      body: JSON.stringify(report),
    });
    state.reports.unshift(data.report);
    resetForm();
    renderReports();
    showToast("Report uploaded successfully.");
    switchTab("reports");
  } catch (error) {
    showToast(error.message);
  } finally {
    const submitButton = els.form.querySelector(".primary-btn");
    submitButton.disabled = false;
    submitButton.textContent = "Upload report";
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function renderReports() {
  els.totalReports.textContent = state.reports.length;
  els.photoReports.textContent = state.reports.filter((report) => report.photoUrl).length;
  els.locationReports.textContent = state.reports.filter((report) => report.location).length;

  if (!state.reports.length) {
    els.reportsList.innerHTML =
      '<div class="empty-list">No complaints submitted yet. Create your first report from the Report issue tab.</div>';
    return;
  }

  els.reportsList.innerHTML = state.reports
    .map((report) => {
      const location = report.location
        ? `${report.location.lat}, ${report.location.lng}`
        : "No GPS location";
      const phone = report.phone === "Not provided" ? "Phone not provided" : report.phone;

      const statuses = ["Submitted", "In Progress", "Resolved"];
      const statusOptions = statuses
        .map(
          (status) =>
            `<option value="${status}" ${report.status === status ? "selected" : ""}>${status}</option>`
        )
        .join("");

      return `
        <article class="report-card">
          ${
            report.photoUrl
              ? `<img src="${photoSrc(report.photoUrl)}" alt="${escapeHtml(report.category)} report photo" />`
              : '<div class="thumb-placeholder">No photo</div>'
          }
          <div>
            <h3>${escapeHtml(report.category)}</h3>
            <p>${escapeHtml(report.description)}</p>
            <div class="meta">
              <span>${escapeHtml(report.landmark)}</span>
              <span>${escapeHtml(location)}</span>
              <span>${escapeHtml(report.name)}</span>
              <span>${escapeHtml(phone)}</span>
              <span>${formatDate(report.createdAt)}</span>
            </div>
          </div>
          <label class="status-control">
            Status
            <select data-report-status="${escapeHtml(report.id)}">
              ${statusOptions}
            </select>
          </label>
        </article>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function photoSrc(value) {
  if (!value) return "";
  if (value.startsWith("http") || value.startsWith("data:")) return value;
  return `${API_BASE}${value}`;
}

els.tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

els.startCameraBtn.addEventListener("click", startCamera);
els.captureBtn.addEventListener("click", capturePhoto);
els.photoInput.addEventListener("change", (event) => readUploadedPhoto(event.target.files[0]));
els.locationBtn.addEventListener("click", getLocation);
els.resetBtn.addEventListener("click", resetForm);
els.form.addEventListener("submit", submitReport);
els.clearReportsBtn.addEventListener("click", () => {
  apiRequest("/api/reports", { method: "DELETE" })
    .then(() => {
      state.reports = [];
      renderReports();
      showToast("Demo reports cleared.");
    })
    .catch((error) => showToast(error.message));
});

els.reportsList.addEventListener("change", (event) => {
  const reportId = event.target.dataset.reportStatus;
  if (!reportId) return;

  apiRequest(`/api/reports/${reportId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: event.target.value }),
  })
    .then(({ report }) => {
      state.reports = state.reports.map((item) => (item.id === report.id ? report : item));
      showToast("Status updated.");
    })
    .catch((error) => showToast(error.message));
});

loadReports();
