const KEY_PURPOSE_NAMES = {
  0: "USER/EMPTY",
  1: "RESERVED",
  2: "XTS_AES_256_KEY_1",
  3: "XTS_AES_256_KEY_2",
  4: "XTS_AES_128_KEY",
  5: "HMAC_DOWN_ALL",
  6: "HMAC_DOWN_JTAG",
  7: "HMAC_DOWN_DIGITAL_SIGNATURE",
  8: "HMAC_UP",
  9: "SECURE_BOOT_DIGEST0",
  10: "SECURE_BOOT_DIGEST1",
  11: "SECURE_BOOT_DIGEST2",
};

const FLASH_ENCRYPTION_PURPOSE = 4;
const WRITE_WINDOW_WORDS = 8;
const EFUSE_IDLE_MASK = 0x3;
const EFUSE_TIMEOUT_MS = 10000;

const commonFields = {
  RD_DIS: { name: "RD_DIS", label: "RD_DIS", block: 0, word: 1, bitOffset: 0, bitLength: 7, description: "Read protection bitmap for key blocks." },
  DIS_DOWNLOAD_ICACHE: { name: "DIS_DOWNLOAD_ICACHE", label: "DIS_DOWNLOAD_ICACHE", block: 0, word: 1, bitOffset: 10, bitLength: 1, description: "Disable instruction cache in download mode." },
  DIS_DOWNLOAD_DCACHE: { name: "DIS_DOWNLOAD_DCACHE", label: "DIS_DOWNLOAD_DCACHE", block: 0, word: 1, bitOffset: 11, bitLength: 1, description: "Disable data cache in download mode." },
  HARD_DIS_JTAG: { name: "HARD_DIS_JTAG", label: "HARD_DIS_JTAG", block: 0, word: 1, bitOffset: 0, bitLength: 1, description: "Hard disable JTAG." },
  DIS_DOWNLOAD_MANUAL_ENCRYPT: { name: "DIS_DOWNLOAD_MANUAL_ENCRYPT", label: "DIS_DOWNLOAD_MANUAL_ENCRYPT", block: 0, word: 1, bitOffset: 0, bitLength: 1, description: "Disable ROM manual encryption (`--encrypt`) in download mode." },
  SPI_BOOT_CRYPT_CNT: { name: "SPI_BOOT_CRYPT_CNT", label: "SPI_BOOT_CRYPT_CNT", block: 0, word: 2, bitOffset: 18, bitLength: 3, description: "Flash encryption enable counter." },
  KEY_PURPOSE_0: { name: "KEY_PURPOSE_0", label: "KEY_PURPOSE_0", block: 0, word: 2, bitOffset: 24, bitLength: 4, description: "Purpose for BLOCK_KEY0." },
  KEY_PURPOSE_1: { name: "KEY_PURPOSE_1", label: "KEY_PURPOSE_1", block: 0, word: 2, bitOffset: 28, bitLength: 4, description: "Purpose for BLOCK_KEY1." },
  KEY_PURPOSE_2: { name: "KEY_PURPOSE_2", label: "KEY_PURPOSE_2", block: 0, word: 3, bitOffset: 0, bitLength: 4, description: "Purpose for BLOCK_KEY2." },
  KEY_PURPOSE_3: { name: "KEY_PURPOSE_3", label: "KEY_PURPOSE_3", block: 0, word: 3, bitOffset: 4, bitLength: 4, description: "Purpose for BLOCK_KEY3." },
  KEY_PURPOSE_4: { name: "KEY_PURPOSE_4", label: "KEY_PURPOSE_4", block: 0, word: 3, bitOffset: 8, bitLength: 4, description: "Purpose for BLOCK_KEY4." },
  KEY_PURPOSE_5: { name: "KEY_PURPOSE_5", label: "KEY_PURPOSE_5", block: 0, word: 3, bitOffset: 12, bitLength: 4, description: "Purpose for BLOCK_KEY5." },
  DIS_USB_JTAG: { name: "DIS_USB_JTAG", label: "DIS_USB_JTAG", block: 0, word: 3, bitOffset: 22, bitLength: 1, description: "Disable USB JTAG." },
  DIS_DIRECT_BOOT: { name: "DIS_DIRECT_BOOT", label: "DIS_DIRECT_BOOT", block: 0, word: 4, bitOffset: 1, bitLength: 1, description: "Disable direct boot." },
  ENABLE_SECURITY_DOWNLOAD: { name: "ENABLE_SECURITY_DOWNLOAD", label: "ENABLE_SECURITY_DOWNLOAD", block: 0, word: 4, bitOffset: 5, bitLength: 1, description: "Enable secure download mode." },
};

const CHIP_CONFIGS = {
  "ESP32-S3": {
    chipName: "ESP32-S3",
    programDataReg: 0x60007000,
    confReg: 0x600071cc,
    cmdReg: 0x600071d4,
    readOpcode: 0x5aa5,
    writeOpcode: 0x5a5a,
    readCmd: 0x1,
    programCmd: 0x2,
    keyBlockIndexes: [4, 5, 6, 7, 8],
    blocks: [
      { index: 0, name: "BLOCK0", readAddress: 0x6000702c, wordCount: 6, purposeField: null, readProtectBit: null },
      { index: 4, name: "BLOCK_KEY0", readAddress: 0x6000709c, wordCount: 8, purposeField: "KEY_PURPOSE_0", readProtectBit: 0 },
      { index: 5, name: "BLOCK_KEY1", readAddress: 0x600070bc, wordCount: 8, purposeField: "KEY_PURPOSE_1", readProtectBit: 1 },
      { index: 6, name: "BLOCK_KEY2", readAddress: 0x600070dc, wordCount: 8, purposeField: "KEY_PURPOSE_2", readProtectBit: 2 },
      { index: 7, name: "BLOCK_KEY3", readAddress: 0x600070fc, wordCount: 8, purposeField: "KEY_PURPOSE_3", readProtectBit: 3 },
      { index: 8, name: "BLOCK_KEY4", readAddress: 0x6000711c, wordCount: 8, purposeField: "KEY_PURPOSE_4", readProtectBit: 4 },
      { index: 9, name: "BLOCK_KEY5", readAddress: 0x6000713c, wordCount: 8, purposeField: "KEY_PURPOSE_5", readProtectBit: 5 },
    ],
    fields: {
      ...commonFields,
      HARD_DIS_JTAG: { ...commonFields.HARD_DIS_JTAG, bitOffset: 19 },
      DIS_DOWNLOAD_MANUAL_ENCRYPT: { ...commonFields.DIS_DOWNLOAD_MANUAL_ENCRYPT, bitOffset: 20 },
    },
    timingSteps: [
      { address: 0x600071e8, mask: 0xff << 9, shift: 9, value: 0xff },
      { address: 0x600071e8, mask: 0xff, shift: 0, value: 0x28 },
      { address: 0x600071f4, mask: 0xffff << 8, shift: 8, value: 0x3000 },
      { address: 0x600071f8, mask: 0xffff, shift: 0, value: 0x190 },
    ],
  },
  "ESP32-S2": {
    chipName: "ESP32-S2",
    programDataReg: 0x3f41a000,
    confReg: 0x3f41a1cc,
    cmdReg: 0x3f41a1d4,
    readOpcode: 0x5aa5,
    writeOpcode: 0x5a5a,
    readCmd: 0x1,
    programCmd: 0x2,
    keyBlockIndexes: [4, 5, 6, 7, 8, 9],
    blocks: [
      { index: 0, name: "BLOCK0", readAddress: 0x3f41a02c, wordCount: 6, purposeField: null, readProtectBit: null },
      { index: 4, name: "BLOCK_KEY0", readAddress: 0x3f41a09c, wordCount: 8, purposeField: "KEY_PURPOSE_0", readProtectBit: 0 },
      { index: 5, name: "BLOCK_KEY1", readAddress: 0x3f41a0bc, wordCount: 8, purposeField: "KEY_PURPOSE_1", readProtectBit: 1 },
      { index: 6, name: "BLOCK_KEY2", readAddress: 0x3f41a0dc, wordCount: 8, purposeField: "KEY_PURPOSE_2", readProtectBit: 2 },
      { index: 7, name: "BLOCK_KEY3", readAddress: 0x3f41a0fc, wordCount: 8, purposeField: "KEY_PURPOSE_3", readProtectBit: 3 },
      { index: 8, name: "BLOCK_KEY4", readAddress: 0x3f41a11c, wordCount: 8, purposeField: "KEY_PURPOSE_4", readProtectBit: 4 },
      { index: 9, name: "BLOCK_KEY5", readAddress: 0x3f41a13c, wordCount: 8, purposeField: "KEY_PURPOSE_5", readProtectBit: 5 },
    ],
    fields: {
      ...commonFields,
      HARD_DIS_JTAG: { ...commonFields.HARD_DIS_JTAG, bitOffset: 18 },
      DIS_DOWNLOAD_MANUAL_ENCRYPT: { ...commonFields.DIS_DOWNLOAD_MANUAL_ENCRYPT, bitOffset: 19 },
      DIS_LEGACY_SPI_BOOT: { ...commonFields.DIS_DIRECT_BOOT, name: "DIS_LEGACY_SPI_BOOT", label: "DIS_LEGACY_SPI_BOOT", description: "Disable legacy SPI boot." },
    },
    timingSteps: [
      { address: 0x3f41a1f4, mask: 0xff, shift: 0, value: 0x1 },
      { address: 0x3f41a1f0, mask: 0xffff << 16, shift: 16, value: 0x190 },
      { address: 0x3f41a1f0, mask: 0xff, shift: 0, value: 0x1 },
      { address: 0x3f41a1f0, mask: 0xff << 8, shift: 8, value: 0x2 },
      { address: 0x3f41a1e8, mask: 0xff, shift: 0, value: 0x50 },
      { address: 0x3f41a1f4, mask: 0xffff << 8, shift: 8, value: 0x5100 },
      { address: 0x3f41a1f8, mask: 0xffff, shift: 0, value: 0x80 },
      { address: 0x3f41a1ec, mask: 0xff << 8, shift: 8, value: 0x2 },
      { address: 0x3f41a1ec, mask: 0xff, shift: 0, value: 0x1 },
    ],
  },
};

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function popcount(value) {
  let remaining = value >>> 0;
  let count = 0;
  while (remaining) {
    remaining &= remaining - 1;
    count += 1;
  }
  return count;
}

function ensureSupportedChip(loader) {
  const chipName = loader?.chip?.CHIP_NAME;
  const config = CHIP_CONFIGS[chipName];
  if (!config) {
    throw new Error(`Unsupported chip for eFuse actions: ${chipName || "unknown"}`);
  }
  return config;
}

function normalizeEfuseHexKey(value) {
  return value.replace(/[\s:-]/g, "");
}

function isValidEfuseHexKey(value) {
  return /^[0-9a-fA-F]{64}$/.test(normalizeEfuseHexKey(value));
}

function getFieldMask(field) {
  return field.bitLength >= 32 ? 0xffffffff : (1 << field.bitLength) - 1;
}

function getFieldValue(words, field) {
  return ((words[field.word] >>> 0) >>> field.bitOffset) & getFieldMask(field);
}

function getOptionalFieldValue(words, field) {
  return field ? getFieldValue(words, field) : null;
}

function formatFieldValue(field, value) {
  switch (field.name) {
    case "SPI_BOOT_CRYPT_CNT":
      return `${value} (${popcount(value) % 2 === 1 ? "enabled" : "disabled"})`;
    case "DIS_DOWNLOAD_MANUAL_ENCRYPT":
    case "ENABLE_SECURITY_DOWNLOAD":
    case "DIS_DOWNLOAD_ICACHE":
    case "DIS_DOWNLOAD_DCACHE":
    case "HARD_DIS_JTAG":
    case "DIS_USB_JTAG":
    case "DIS_DIRECT_BOOT":
    case "DIS_LEGACY_SPI_BOOT":
      return value ? "1 (burned)" : "0 (clear)";
    default:
      if (field.name.startsWith("KEY_PURPOSE_")) {
        return `${value} (${KEY_PURPOSE_NAMES[value] || "UNKNOWN"})`;
      }
      if (field.name === "RD_DIS") {
        return `0x${(value >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
      }
      return `${value}`;
  }
}

function wordsToBytes(words) {
  const output = new Uint8Array(words.length * 4);
  const view = new DataView(output.buffer);
  words.forEach((word, index) => view.setUint32(index * 4, word >>> 0, true));
  return output;
}

function bytesToWords(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const words = [];
  for (let offset = 0; offset < bytes.length; offset += 4) {
    words.push(view.getUint32(offset, true) >>> 0);
  }
  return words;
}

async function readBlockWords(loader, block) {
  const words = [];
  for (let index = 0; index < block.wordCount; index += 1) {
    words.push((await loader.readReg(block.readAddress + index * 4)) >>> 0);
  }
  return words;
}

async function updateMaskedRegister(loader, address, mask, shift, value) {
  const current = (await loader.readReg(address)) >>> 0;
  const next = ((current & ~mask) | ((value << shift) & mask)) >>> 0;
  if (next !== current) {
    await loader.writeReg(address, next);
  }
}

async function ensureEfuseTiming(loader, config) {
  const crystalFreq = await loader.chip.getCrystalFreq(loader);
  if (crystalFreq !== 40) {
    throw new Error(`eFuse burning requires 40MHz XTAL, got ${crystalFreq}MHz.`);
  }
  for (const step of config.timingSteps) {
    await updateMaskedRegister(loader, step.address, step.mask, step.shift, step.value);
  }
}

async function waitForEfuseIdle(loader, config) {
  const deadline = Date.now() + EFUSE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const cmd1 = (await loader.readReg(config.cmdReg)) >>> 0;
    if ((cmd1 & EFUSE_IDLE_MASK) === 0) {
      const cmd2 = (await loader.readReg(config.cmdReg)) >>> 0;
      if ((cmd2 & EFUSE_IDLE_MASK) === 0) {
        return;
      }
    }
    await sleep(20);
  }
  throw new Error("Timed out waiting for the eFuse controller to become idle.");
}

async function clearProgramRegisters(loader, config) {
  await waitForEfuseIdle(loader, config);
  for (let index = 0; index < WRITE_WINDOW_WORDS; index += 1) {
    await loader.writeReg(config.programDataReg + index * 4, 0);
  }
}

async function triggerEfuseRead(loader, config) {
  await waitForEfuseIdle(loader, config);
  await loader.writeReg(config.confReg, config.readOpcode);
  await loader.writeReg(config.cmdReg, config.readCmd, 0xffffffff, 0, 1000);
  await waitForEfuseIdle(loader, config);
}

async function programEfuseBlock(loader, config, blockIndex, words) {
  await ensureEfuseTiming(loader, config);
  await clearProgramRegisters(loader, config);
  for (let index = 0; index < words.length; index += 1) {
    const value = words[index] >>> 0;
    if (value !== 0) {
      await loader.writeReg(config.programDataReg + index * 4, value);
    }
  }
  await waitForEfuseIdle(loader, config);
  await loader.writeReg(config.confReg, config.writeOpcode);
  await loader.writeReg(config.cmdReg, config.programCmd | (blockIndex << 2));
  await waitForEfuseIdle(loader, config);
  await clearProgramRegisters(loader, config);
  await triggerEfuseRead(loader, config);
}

function stageFieldValue(words, field, targetValue, stagedWords) {
  const currentValue = getFieldValue(words, field);
  if (((currentValue | targetValue) >>> 0) !== targetValue) {
    throw new Error(`${field.name} is already burned to an incompatible value (${currentValue}).`);
  }
  const delta = targetValue & ~currentValue;
  if (delta !== 0) {
    stagedWords[field.word] |= (delta << field.bitOffset) >>> 0;
  }
  return delta !== 0;
}

function normalizeKeyBytes(value) {
  const normalized = normalizeEfuseHexKey(value);
  if (!isValidEfuseHexKey(normalized)) {
    throw new Error("AES key must be exactly 64 hexadecimal characters.");
  }
  const bytes = new Uint8Array(32);
  for (let index = 0; index < 32; index += 1) {
    bytes[index] = parseInt(normalized.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function decodeReadableKey(words) {
  return Uint8Array.from(wordsToBytes(words)).reverse();
}

function keyBytesEqual(left, right) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function getSortedChipFields(config) {
  return Object.values(config.fields).sort((left, right) => {
    if (left.block !== right.block) return left.block - right.block;
    if (left.word !== right.word) return left.word - right.word;
    if (left.bitOffset !== right.bitOffset) return left.bitOffset - right.bitOffset;
    return left.name.localeCompare(right.name);
  });
}

async function readEfuseSummary(loader) {
  const config = ensureSupportedChip(loader);
  const block0 = config.blocks.find((block) => block.index === 0);
  const block0Words = await readBlockWords(loader, block0);
  const fieldRows = getSortedChipFields(config).map((field) => {
    const rawValue = getFieldValue(block0Words, field);
    return {
      name: field.name,
      label: field.label,
      rawValue,
      displayValue: formatFieldValue(field, rawValue),
      description: field.description,
    };
  });

  const rdDisValue = getFieldValue(block0Words, config.fields.RD_DIS);
  const keyBlocks = [];
  for (const block of config.blocks.filter((entry) => entry.purposeField)) {
    const words = await readBlockWords(loader, block);
    const purposeValue = getFieldValue(block0Words, config.fields[block.purposeField]);
    keyBlocks.push({
      index: block.index,
      name: block.name,
      purposeField: block.purposeField,
      purposeValue,
      purposeName: KEY_PURPOSE_NAMES[purposeValue] || "UNKNOWN",
      isEmpty: words.every((word) => word === 0),
      readProtected: block.readProtectBit !== null ? ((rdDisValue >> block.readProtectBit) & 0x1) === 1 : false,
      rawWords: words,
    });
  }

  for (const block of keyBlocks) {
    block.stateLabel = block.readProtected && block.isEmpty ? "unreadable" : block.isEmpty ? "empty" : "programmed";
  }

  const spiBootCryptCnt = getFieldValue(block0Words, config.fields.SPI_BOOT_CRYPT_CNT);
  const flashEncryptionEnabled = popcount(spiBootCryptCnt) % 2 === 1;
  const manualEncryptAllowed = getFieldValue(block0Words, config.fields.DIS_DOWNLOAD_MANUAL_ENCRYPT) === 0;
  const secureDownloadDisabled = getFieldValue(block0Words, config.fields.ENABLE_SECURITY_DOWNLOAD) === 0;
  const downloadIcacheDisabled = getFieldValue(block0Words, config.fields.DIS_DOWNLOAD_ICACHE) === 1;
  const downloadDcacheDisabled = getFieldValue(block0Words, config.fields.DIS_DOWNLOAD_DCACHE) === 1;
  const hardJtagDisabled = getFieldValue(block0Words, config.fields.HARD_DIS_JTAG) === 1;
  const usbJtagDisabled = getOptionalFieldValue(block0Words, config.fields.DIS_USB_JTAG);
  const directBootField = config.fields.DIS_DIRECT_BOOT || config.fields.DIS_LEGACY_SPI_BOOT || null;
  const directBootDisabled = getOptionalFieldValue(block0Words, directBootField);
  const safeHardeningReady =
    downloadIcacheDisabled &&
    downloadDcacheDisabled &&
    hardJtagDisabled &&
    (usbJtagDisabled === null || usbJtagDisabled === 1) &&
    (directBootDisabled === null || directBootDisabled === 1);
  const xtsKeyBlock = keyBlocks.find((block) => block.purposeValue === FLASH_ENCRYPTION_PURPOSE) || null;
  const recommendedKeyBlock =
    keyBlocks.find((block) => config.keyBlockIndexes.includes(block.index) && block.isEmpty && (block.purposeValue === 0 || block.purposeValue === null)) ||
    null;

  return {
    chipName: config.chipName,
    block0Words,
    fieldRows,
    keyBlocks,
    flashEncryptionEnabled,
    spiBootCryptCnt,
    manualEncryptAllowed,
    secureDownloadDisabled,
    downloadIcacheDisabled,
    downloadDcacheDisabled,
    hardJtagDisabled,
    usbJtagDisabled: usbJtagDisabled === null ? null : usbJtagDisabled === 1,
    directBootDisabled: directBootDisabled === null ? null : directBootDisabled === 1,
    safeHardeningReady,
    xtsKeyBlock,
    recommendedKeyBlock,
    provisionStageReady:
      Boolean(xtsKeyBlock) &&
      flashEncryptionEnabled &&
      manualEncryptAllowed &&
      secureDownloadDisabled &&
      safeHardeningReady,
    lockdownReady:
      Boolean(xtsKeyBlock) &&
      !xtsKeyBlock.readProtected &&
      flashEncryptionEnabled &&
      manualEncryptAllowed &&
      secureDownloadDisabled &&
      safeHardeningReady,
  };
}

function getProvisionKeyStatus(summary, keyValue) {
  if (!summary) {
    if (!isValidEfuseHexKey(keyValue)) {
      return { status: "invalid", message: "Enter the 64-character AES key to enable burning." };
    }
    return { status: "ready", message: "AES key is valid. Read eFuses to continue." };
  }

  const xtsBlock = summary.xtsKeyBlock;
  if (xtsBlock) {
    if (xtsBlock.readProtected) {
      return { status: "locked", blockName: xtsBlock.name, message: `${xtsBlock.name} already holds a flash-encryption key and is read-protected.` };
    }
    if (!isValidEfuseHexKey(keyValue)) {
      return { status: "burned", blockName: xtsBlock.name, message: `${xtsBlock.name} already holds a flash-encryption key and is still readable.` };
    }
    const desiredKey = normalizeKeyBytes(keyValue);
    if (keyBytesEqual(decodeReadableKey(xtsBlock.rawWords), desiredKey)) {
      return { status: "matches", blockName: xtsBlock.name, message: `${xtsBlock.name} already contains this AES key.` };
    }
    return { status: "different", blockName: xtsBlock.name, message: `${xtsBlock.name} already contains a different flash-encryption key.` };
  }

  if (!isValidEfuseHexKey(keyValue)) {
    return { status: "invalid", message: "Enter the 64-character AES key to enable burning." };
  }

  const desiredKey = normalizeKeyBytes(keyValue);

  const matchingUserBlock = summary.keyBlocks.find((block) => !block.readProtected && !block.isEmpty && keyBytesEqual(decodeReadableKey(block.rawWords), desiredKey));
  if (matchingUserBlock) {
    return { status: "ready", message: `${matchingUserBlock.name} already contains this key and only needs the XTS AES purpose.` };
  }
  if (!summary.recommendedKeyBlock) {
    return { status: "occupied", blockName: "all key blocks", message: "No empty key block is available for the AES key burn." };
  }
  return { status: "ready", message: `AES key is valid. ${summary.recommendedKeyBlock.name} is ready for burning.` };
}

async function burnBlock0FieldValues(loader, config, targets) {
  const summary = await readEfuseSummary(loader);
  const stagedWords = new Array(WRITE_WINDOW_WORDS).fill(0);
  let hasChanges = false;
  for (const target of targets) {
    hasChanges = stageFieldValue(summary.block0Words, config.fields[target.fieldName], target.value, stagedWords) || hasChanges;
  }
  if (!hasChanges) return false;
  await programEfuseBlock(loader, config, 0, stagedWords);
  return true;
}

async function burnKeyBlock(loader, config, block, keyBytes) {
  await programEfuseBlock(loader, config, block.index, bytesToWords(Uint8Array.from(keyBytes).reverse()));
}

function resolveTargetKeyBlock(summary, keyBytes) {
  const matchingBlock = summary.keyBlocks.find((block) => !block.isEmpty && !block.readProtected && keyBytesEqual(decodeReadableKey(block.rawWords), keyBytes));
  if (matchingBlock) return matchingBlock;
  if (summary.recommendedKeyBlock) return summary.recommendedKeyBlock;
  throw new Error("No empty key block is available for the AES key burn.");
}

async function ensureXts128Purpose(loader, config, block) {
  if (block.purposeValue === FLASH_ENCRYPTION_PURPOSE) return false;
  return burnBlock0FieldValues(loader, config, [{ fieldName: block.purposeField, value: FLASH_ENCRYPTION_PURPOSE }]);
}

async function ensureFlashEncryptionDevelopmentMode(loader, config, summary) {
  if (summary.flashEncryptionEnabled) return false;
  let nextValue = summary.spiBootCryptCnt;
  for (let bitIndex = 0; bitIndex < config.fields.SPI_BOOT_CRYPT_CNT.bitLength; bitIndex += 1) {
    const bit = 1 << bitIndex;
    if ((nextValue & bit) === 0) {
      nextValue |= bit;
      break;
    }
  }
  if (nextValue === summary.spiBootCryptCnt) {
    throw new Error("SPI_BOOT_CRYPT_CNT cannot be advanced to an enabled development value.");
  }
  return burnBlock0FieldValues(loader, config, [{ fieldName: "SPI_BOOT_CRYPT_CNT", value: nextValue }]);
}

async function ensureSafeHardening(loader, config, summary) {
  const targets = [
    { fieldName: "DIS_DOWNLOAD_ICACHE", value: 1, description: "Disabled instruction cache in download mode." },
    { fieldName: "DIS_DOWNLOAD_DCACHE", value: 1, description: "Disabled data cache in download mode." },
    { fieldName: "HARD_DIS_JTAG", value: 1, description: "Hard-disabled JTAG." },
  ];

  if (config.fields.DIS_USB_JTAG && !summary.usbJtagDisabled) {
    targets.push({ fieldName: "DIS_USB_JTAG", value: 1, description: "Disabled USB JTAG." });
  }

  if (config.fields.DIS_DIRECT_BOOT && !summary.directBootDisabled) {
    targets.push({ fieldName: "DIS_DIRECT_BOOT", value: 1, description: "Disabled direct boot." });
  } else if (config.fields.DIS_LEGACY_SPI_BOOT && !summary.directBootDisabled) {
    targets.push({ fieldName: "DIS_LEGACY_SPI_BOOT", value: 1, description: "Disabled legacy SPI boot." });
  }

  const pendingTargets = targets.filter((target) => {
    switch (target.fieldName) {
      case "DIS_DOWNLOAD_ICACHE":
        return !summary.downloadIcacheDisabled;
      case "DIS_DOWNLOAD_DCACHE":
        return !summary.downloadDcacheDisabled;
      case "HARD_DIS_JTAG":
        return !summary.hardJtagDisabled;
      default:
        return true;
    }
  });

  if (!pendingTargets.length) return [];
  await burnBlock0FieldValues(loader, config, pendingTargets.map(({ fieldName, value }) => ({ fieldName, value })));
  return pendingTargets.map((target) => target.description);
}

async function applyStagedProvisioning(loader, keyValue) {
  const config = ensureSupportedChip(loader);
  const keyBytes = normalizeKeyBytes(keyValue);
  const actions = [];
  let summary = await readEfuseSummary(loader);

  const keyStatus = getProvisionKeyStatus(summary, keyValue);
  if (["invalid", "different", "occupied", "locked"].includes(keyStatus.status)) {
    throw new Error(keyStatus.message);
  }
  if (!summary.secureDownloadDisabled) {
    throw new Error("ENABLE_SECURITY_DOWNLOAD is already burned. This flow must stay disabled for `--encrypt`.");
  }
  if (!summary.manualEncryptAllowed) {
    throw new Error("DIS_DOWNLOAD_MANUAL_ENCRYPT is already burned, so `--encrypt` is no longer allowed.");
  }

  const targetBlock = resolveTargetKeyBlock(summary, keyBytes);
  if (targetBlock.isEmpty) {
    await burnKeyBlock(loader, config, targetBlock, keyBytes);
    actions.push(`Burned AES key into ${targetBlock.name}.`);
    summary = await readEfuseSummary(loader);
  }

  const blockAfterBurn = summary.keyBlocks.find((entry) => entry.index === targetBlock.index) || targetBlock;
  if (blockAfterBurn.purposeValue !== FLASH_ENCRYPTION_PURPOSE) {
    if (await ensureXts128Purpose(loader, config, blockAfterBurn)) {
      actions.push(`Set ${blockAfterBurn.purposeField} to XTS_AES_128_KEY.`);
      summary = await readEfuseSummary(loader);
    }
  }

  if (!summary.flashEncryptionEnabled) {
    if (await ensureFlashEncryptionDevelopmentMode(loader, config, summary)) {
      actions.push("Enabled flash encryption development mode (SPI_BOOT_CRYPT_CNT).");
      summary = await readEfuseSummary(loader);
    }
  }

  if (!summary.safeHardeningReady) {
    const hardeningActions = await ensureSafeHardening(loader, config, summary);
    if (hardeningActions.length) {
      actions.push(...hardeningActions);
      summary = await readEfuseSummary(loader);
    }
  }

  return { actions, summary };
}

async function applyProvisionLockdown(loader, keyValue) {
  const config = ensureSupportedChip(loader);
  let summary = await readEfuseSummary(loader);

  if (!summary.xtsKeyBlock) {
    throw new Error("No flash-encryption key block is programmed yet.");
  }
  if (summary.xtsKeyBlock.readProtected) {
    return { actions: [], summary };
  }
  if (!summary.provisionStageReady) {
    throw new Error("Complete Stage 1 test provisioning before locking down RD_DIS.");
  }

  const keyStatus = getProvisionKeyStatus(summary, keyValue);
  if (keyStatus.status !== "matches") {
    throw new Error("Enter the exact readable AES key from Stage 1 before locking down RD_DIS.");
  }

  const currentRdDis = getFieldValue(summary.block0Words, config.fields.RD_DIS);
  const nextRdDis = currentRdDis | (1 << summary.xtsKeyBlock.readProtectBit);
  await burnBlock0FieldValues(loader, config, [{ fieldName: "RD_DIS", value: nextRdDis }]);
  summary = await readEfuseSummary(loader);
  return {
    actions: [`Burned RD_DIS for ${summary.xtsKeyBlock.name}; the AES key is now unreadable.`],
    summary,
  };
}

export {
  applyProvisionLockdown,
  applyStagedProvisioning,
  getProvisionKeyStatus,
  normalizeEfuseHexKey,
  readEfuseSummary,
};
