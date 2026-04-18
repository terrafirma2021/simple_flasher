import "./styles.css";

import { MAKCUESPLoader, Transport } from "./lib/makcu-esptool.js";

const FIRMWARE_API_URL =
  "https://api.github.com/repos/terrafirma2021/MAKCM_v2_files/contents";
const FLASH_BAUD_RATE = 921600;

const state = {
  firmwareMode: "online",
  firmwareList: [],
  previsionEnabled: false,
  selectedFile: null,
  port: null,
  transport: null,
  loader: null,
  isBusy: false,
  isConnected: false,
  isBrave: false,
  browserMessage: "Checking browser compatibility...",
};

const elements = {
  browserNotice: document.querySelector("#browserNotice"),
  chipName: document.querySelector("#chipName"),
  clearLogButton: document.querySelector("#clearLogButton"),
  connectButton: document.querySelector("#connectButton"),
  connectionMode: document.querySelector("#connectionMode"),
  disconnectButton: document.querySelector("#disconnectButton"),
  encryptHeroNote: document.querySelector("#encryptHeroNote"),
  firmwareMeta: document.querySelector("#firmwareMeta"),
  firmwareModeNote: document.querySelector("#firmwareModeNote"),
  firmwareModeSlider: document.querySelector("#firmwareModeSlider"),
  firmwareSelect: document.querySelector("#firmwareSelect"),
  flashOfflineButton: document.querySelector("#flashOfflineButton"),
  flashOnlineButton: document.querySelector("#flashOnlineButton"),
  logOutput: document.querySelector("#logOutput"),
  offlineFileInput: document.querySelector("#offlineFileInput"),
  offlineFileMeta: document.querySelector("#offlineFileMeta"),
  offlinePanel: document.querySelector("#offlinePanel"),
  onlinePanel: document.querySelector("#onlinePanel"),
  previsionNote: document.querySelector("#previsionNote"),
  previsionToggle: document.querySelector("#previsionToggle"),
  previsionToggleLabel: document.querySelector("#previsionToggleLabel"),
  progressBar: document.querySelector("#progressBar"),
  progressLabel: document.querySelector("#progressLabel"),
  refreshListButton: document.querySelector("#refreshListButton"),
  statusBadge: document.querySelector("#statusBadge"),
  themeToggle: document.querySelector("#themeToggle"),
};

function appendLog(message) {
  const stamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  elements.logOutput.textContent += `[${stamp}] ${message}\n`;
  elements.logOutput.scrollTop = elements.logOutput.scrollHeight;
}

function setProgress(percent) {
  const safePercent = Math.max(0, Math.min(100, percent));
  elements.progressBar.style.width = `${safePercent}%`;
  elements.progressLabel.textContent = `${safePercent.toFixed(1)}%`;
}

function setBusy(isBusy) {
  state.isBusy = isBusy;
  render();
}

function updateStatus(label, tone = "neutral") {
  elements.statusBadge.textContent = label;
  elements.statusBadge.dataset.tone = tone;
  if (tone === "success") {
    elements.statusBadge.style.color = "var(--success)";
  } else if (tone === "warning") {
    elements.statusBadge.style.color = "var(--accent)";
  } else {
    elements.statusBadge.style.color = "var(--muted)";
  }
}

async function detectBrave() {
  if (!("serial" in navigator)) {
    return {
      isBrave: false,
      message:
        "Web Serial is not available here. Use desktop Brave to connect and flash.",
    };
  }

  const braveApi = navigator.brave;
  if (!braveApi || typeof braveApi.isBrave !== "function") {
    return {
      isBrave: false,
      message:
        "Brave browser must be used when flashing. Open this page in desktop Brave.",
    };
  }

  try {
    const result = await braveApi.isBrave();
    return result
      ? {
          isBrave: true,
          message:
            "Brave detected. Put the device in flash mode first, then connect.",
        }
      : {
          isBrave: false,
          message:
            "Brave browser must be used when flashing. Open this page in desktop Brave.",
        };
  } catch (_error) {
    return {
      isBrave: false,
      message:
        "Unable to verify Brave. Reopen this page in desktop Brave before flashing.",
    };
  }
}

function safeText(value) {
  return value || "Not connected";
}

function isEncryptedFlashEnabled() {
  return !state.previsionEnabled;
}

function renderFirmwareList() {
  const { firmwareList } = state;
  const select = elements.firmwareSelect;
  select.innerHTML = "";

  if (!firmwareList.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No firmware available";
    select.append(option);
    elements.firmwareMeta.textContent =
      "No online firmware found. Refresh the list or switch to offline mode.";
    return;
  }

  firmwareList.forEach((firmware, index) => {
    const option = document.createElement("option");
    option.value = firmware.name;
    option.textContent = firmware.name;
    if (index === 0) {
      option.selected = true;
    }
    select.append(option);
  });

  updateSelectedFirmwareMeta();
}

function updateSelectedFirmwareMeta() {
  const selected = state.firmwareList.find(
    (item) => item.name === elements.firmwareSelect.value,
  );

  if (!selected) {
    elements.firmwareMeta.textContent = "No firmware selected.";
    return;
  }

  const sizeKb = selected.size > 0 ? `${(selected.size / 1024).toFixed(1)} KB` : "Unknown size";
  elements.firmwareMeta.textContent = `${selected.name} | ${sizeKb} | Source: ${selected.path}`;
}

function render() {
  const connectDisabled = !state.isBrave || state.isBusy || state.isConnected;
  const disconnectDisabled = state.isBusy || !state.isConnected;
  const onlineDisabled =
    !state.isBrave ||
    state.isBusy ||
    !state.isConnected ||
    !state.firmwareList.length;
  const offlineDisabled =
    !state.isBrave ||
    state.isBusy ||
    !state.isConnected ||
    !state.selectedFile;

  document.documentElement.dataset.theme = getTheme();
  elements.browserNotice.textContent = state.browserMessage;
  elements.chipName.textContent = safeText(state.loader?.chip?.CHIP_NAME);
  elements.connectionMode.textContent = state.isConnected
    ? "Flash mode ready"
    : "Waiting";

  elements.connectButton.disabled = connectDisabled;
  elements.disconnectButton.disabled = disconnectDisabled;
  elements.flashOnlineButton.disabled = onlineDisabled;
  elements.flashOfflineButton.disabled = offlineDisabled;
  elements.firmwareModeSlider.disabled = state.isBusy;
  elements.previsionToggle.disabled = state.isBusy;
  elements.refreshListButton.disabled = state.isBusy;
  elements.firmwareSelect.disabled = state.isBusy || !state.firmwareList.length;
  elements.offlineFileInput.disabled = state.isBusy;
  elements.onlinePanel.hidden = state.firmwareMode !== "online";
  elements.offlinePanel.hidden = state.firmwareMode !== "offline";
  elements.firmwareModeSlider.dataset.mode = state.firmwareMode;
  elements.firmwareModeSlider.setAttribute(
    "aria-checked",
    String(state.firmwareMode === "offline"),
  );
  elements.firmwareModeNote.textContent =
    state.firmwareMode === "online" ? "Online firmware list" : "Local .bin file";
  elements.previsionToggle.classList.toggle("is-active", state.previsionEnabled);
  elements.previsionToggle.setAttribute(
    "aria-checked",
    String(state.previsionEnabled),
  );
  elements.previsionToggleLabel.textContent = state.previsionEnabled ? "On" : "Off";

  const encryptCopy = isEncryptedFlashEnabled()
    ? "Encrypted flash enabled."
    : "Encrypted flash disabled for prevision mode.";
  elements.previsionNote.textContent = encryptCopy;
  elements.encryptHeroNote.textContent = encryptCopy;

  if (state.isBusy) {
    updateStatus("Working", "warning");
  } else if (state.isConnected) {
    updateStatus("Connected", "success");
  } else {
    updateStatus("Disconnected");
  }
}

function getTheme() {
  const savedTheme = window.localStorage.getItem("simple-flasher-theme");
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return "dark";
}

function toggleTheme() {
  const nextTheme = getTheme() === "dark" ? "light" : "dark";
  window.localStorage.setItem("simple-flasher-theme", nextTheme);
  render();
}

function shouldRetryConnection(error) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes("invalid response") ||
    message.includes("read timeout") ||
    message.includes("failed to connect with the device") ||
    message.includes("no serial data received") ||
    message.includes("serial data stream stopped")
  );
}

async function fetchFirmwareList() {
  appendLog("Fetching online firmware list...");

  try {
    const response = await fetch(FIRMWARE_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const files = await response.json();
    state.firmwareList = files
      .filter((file) => file.type === "file" && file.name.endsWith(".bin"))
      .filter((file) => Boolean(file.download_url))
      .sort((left, right) =>
        right.name.localeCompare(left.name, undefined, { numeric: true }),
      )
      .map((file) => ({
        downloadUrl: file.download_url,
        name: file.name,
        path: file.path,
        size: file.size,
      }));

    renderFirmwareList();
    appendLog(`Loaded ${state.firmwareList.length} online firmware file(s).`);
  } catch (error) {
    state.firmwareList = [];
    renderFirmwareList();
    appendLog(
      `Failed to fetch online firmware list: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function safeClosePort(port) {
  if (!port) {
    return;
  }

  try {
    if (port.readable?.locked) {
      try {
        const reader = port.readable.getReader();
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      } catch (_error) {}
    }

    if (port.writable?.locked) {
      try {
        const writer = port.writable.getWriter();
        writer.releaseLock();
      } catch (_error) {}
    }

    if (port.readable || port.writable) {
      await port.close();
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }
  } catch (_error) {}
}

async function hardClosePort(port) {
  try {
    if (port.readable) {
      try {
        const reader = port.readable.getReader();
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      } catch (_error) {}
    }

    if (port.writable) {
      try {
        const writer = port.writable.getWriter();
        writer.releaseLock();
      } catch (_error) {}
    }

    if (port.readable || port.writable) {
      await port.close().catch(() => {});
    }
  } catch (_error) {}
}

function createTerminal() {
  return {
    clean() {},
    write(value) {
      appendLog(String(value).trimEnd());
    },
    writeLine(value) {
      appendLog(String(value));
    },
  };
}

async function connectDevice() {
  if (!state.isBrave || state.isBusy) {
    return;
  }

  setBusy(true);
  appendLog("Requesting serial port...");

  try {
    const port = await navigator.serial.requestPort();
    await safeClosePort(port);

    const buildLoader = () => {
      const transport = new Transport(port, false, true);
      const loader = new MAKCUESPLoader({
        baudrate: FLASH_BAUD_RATE,
        debugLogging: false,
        enableTracing: true,
        flashSize: "detect",
        terminal: createTerminal(),
        transport,
      });

      return { loader, transport };
    };

    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      let transport = null;

      try {
        await hardClosePort(port);
        await safeClosePort(port);
        await new Promise((resolve) => window.setTimeout(resolve, 300));

        const { loader, transport: nextTransport } = buildLoader();
        transport = nextTransport;
        appendLog(
          `Connecting in flash mode (attempt ${attempt}/3, flash baud ${FLASH_BAUD_RATE})...`,
        );
        await loader.main("no_reset");

        state.port = port;
        state.loader = loader;
        state.transport = transport;
        state.isConnected = true;

        appendLog(
          `Connected to ${loader.chip?.CHIP_NAME || "device"} in flash mode.`,
        );
        render();
        return;
      } catch (error) {
        lastError = error;
        if (transport) {
          try {
            await transport.disconnect();
          } catch (_error) {}
        }
        await safeClosePort(port);
        appendLog(
          `Flash connection attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`,
        );

        if (attempt < 3 && shouldRetryConnection(error)) {
          appendLog("Retrying flash-mode connect...");
          await new Promise((resolve) => window.setTimeout(resolve, 250));
          continue;
        }

        break;
      }
    }

    throw lastError || new Error("Unable to connect in flash mode.");
  } catch (error) {
    appendLog(
      `Connect failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    setBusy(false);
  }
}

async function disconnectDevice() {
  if (state.isBusy) {
    return;
  }

  setBusy(true);

  try {
    await safeClosePort(state.port);
  } finally {
    state.port = null;
    state.transport = null;
    state.loader = null;
    state.isConnected = false;
    appendLog("Disconnected.");
    setBusy(false);
  }
}

function bufferToBinaryString(buffer) {
  return new TextDecoder("latin1").decode(new Uint8Array(buffer));
}

function readFlashSettings(buffer) {
  const bytes = new Uint8Array(buffer.slice(0, 16));
  const magicByte = bytes[0];
  const validMagicBytes = [0xe9, 0xea, 0x20, 0x18];

  if (!validMagicBytes.includes(magicByte)) {
    appendLog(
      `Warning: unexpected firmware magic byte 0x${magicByte.toString(16).toUpperCase()}.`,
    );
  }

  let flashMode;
  let flashFreq;

  if (buffer.byteLength >= 4) {
    const flashModeSize = (bytes[2] << 8) | bytes[3];
    if (flashModeSize !== 0 && flashModeSize !== 0xffff && flashModeSize !== 0xff) {
      const flashModeMap = {
        0: "qio",
        1: "qout",
        2: "dio",
        3: "dout",
      };
      const flashFreqMap = {
        0: "40m",
        1: "26m",
        2: "20m",
        3: "80m",
      };

      flashMode = flashModeMap[(flashModeSize >> 8) & 0x07];
      flashFreq = flashFreqMap[(flashModeSize >> 3) & 0x03];
    }
  }

  if (!flashMode || !flashFreq) {
    throw new Error("Flash settings could not be parsed from the image header.");
  }

  return { flashFreq, flashMode };
}

function createFlashOptions(buffer) {
  const { flashFreq, flashMode } = readFlashSettings(buffer);
  const data = bufferToBinaryString(buffer);

  return {
    compress: true,
    eraseAll: false,
    flashSize: "keep",
    fileArray: [
      {
        address: 0x0,
        data,
      },
    ],
    flashFreq,
    flashMode,
    reportProgress(_fileIndex, written, total) {
      setProgress((written / total) * 100);
    },
  };
}

async function flashBuffer(buffer, label) {
  if (!state.loader || !state.isConnected) {
    appendLog("Connect the device in flash mode before starting a flash.");
    return;
  }

  setBusy(true);
  setProgress(0);

  try {
    appendLog(`Preparing ${label}...`);
    state.loader.encryptedFlashEnabled = isEncryptedFlashEnabled();
    appendLog(
      isEncryptedFlashEnabled()
        ? "Encrypted flashing is enabled for this flash."
        : "Prevision mode enabled. Encrypted flashing is disabled for this flash.",
    );

    const flashOptions = createFlashOptions(buffer);
    await state.loader.writeFlash(flashOptions);
    await state.loader.after();

    appendLog(`Flash complete for ${label}. Device reset requested.`);

    await safeClosePort(state.port);
    state.port = null;
    state.transport = null;
    state.loader = null;
    state.isConnected = false;
  } catch (error) {
    appendLog(
      `Flash failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    setProgress(0);
    setBusy(false);
  }
}

async function flashSelectedOnlineFirmware() {
  const selected = state.firmwareList.find(
    (item) => item.name === elements.firmwareSelect.value,
  );

  if (!selected) {
    appendLog("Choose an online firmware first.");
    return;
  }

  setBusy(true);
  appendLog(`Downloading ${selected.name}...`);

  try {
    const response = await fetch(selected.downloadUrl);
    if (!response.ok) {
      throw new Error(`Download returned ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    if (selected.size > 0 && buffer.byteLength !== selected.size) {
      appendLog(
        `Warning: expected ${selected.size} bytes but received ${buffer.byteLength} bytes.`,
      );
    }

    setBusy(false);
    await flashBuffer(buffer, selected.name);
  } catch (error) {
    appendLog(
      `Firmware download failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    setBusy(false);
  }
}

async function flashSelectedOfflineFirmware() {
  if (!state.selectedFile) {
    appendLog("Choose an offline .bin file first.");
    return;
  }

  const buffer = await state.selectedFile.arrayBuffer();
  await flashBuffer(buffer, state.selectedFile.name);
}

function handleOfflineFileSelection(event) {
  const [file] = event.target.files || [];
  state.selectedFile = file || null;
  elements.offlineFileMeta.textContent = file
    ? `${file.name} | ${(file.size / 1024).toFixed(1)} KB`
    : "No local firmware selected yet.";
  render();
}

function setFirmwareMode(mode) {
  state.firmwareMode = mode;
  render();
}

function handleFirmwareModeSliderClick(event) {
  const bounds = elements.firmwareModeSlider.getBoundingClientRect();
  const midpoint = bounds.left + bounds.width / 2;
  setFirmwareMode(event.clientX >= midpoint ? "offline" : "online");
}

function togglePrevisionMode() {
  state.previsionEnabled = !state.previsionEnabled;
  render();
}

function attachEvents() {
  elements.clearLogButton.addEventListener("click", () => {
    elements.logOutput.textContent = "";
  });
  elements.connectButton.addEventListener("click", connectDevice);
  elements.disconnectButton.addEventListener("click", disconnectDevice);
  elements.firmwareSelect.addEventListener("change", updateSelectedFirmwareMeta);
  elements.firmwareModeSlider.addEventListener("click", handleFirmwareModeSliderClick);
  elements.flashOfflineButton.addEventListener("click", flashSelectedOfflineFirmware);
  elements.flashOnlineButton.addEventListener("click", flashSelectedOnlineFirmware);
  elements.offlineFileInput.addEventListener("change", handleOfflineFileSelection);
  elements.previsionToggle.addEventListener("click", togglePrevisionMode);
  elements.refreshListButton.addEventListener("click", fetchFirmwareList);
  elements.themeToggle.addEventListener("click", toggleTheme);

  if ("serial" in navigator) {
    navigator.serial.addEventListener("disconnect", async () => {
      appendLog("Serial device disconnected.");
      state.port = null;
      state.transport = null;
      state.loader = null;
      state.isConnected = false;
      render();
    });
  }
}

async function init() {
  appendLog("Simple flasher ready.");
  appendLog("Desktop Brave is required for flashing.");
  appendLog("Prevision is off by default.");
  appendLog("Encrypted flash is enabled while prevision stays off.");

  const braveState = await detectBrave();
  state.isBrave = braveState.isBrave;
  state.browserMessage = braveState.message;

  await fetchFirmwareList();
  render();
}

attachEvents();
render();
init();
