import { ESPLoader as BaseESPLoader, Transport } from "esptool-js";

class MAKCUESPLoader extends BaseESPLoader {
  async connect(mode = "default_reset", attempts = mode === "no_reset" ? 2 : 7, detecting = true) {
    return super.connect(mode, attempts, detecting);
  }

  async flashBegin(size, offset) {
    const numBlocks = Math.floor((size + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE);
    const eraseSize = this.chip.getEraseSize(offset, size);
    const startedAt = Date.now();
    let timeout = 3000;

    if (this.IS_STUB === false) {
      timeout = this.timeoutPerMb(this.ERASE_REGION_TIMEOUT_PER_MB, size);
    }

    this.debug(
      "flash begin " +
        eraseSize +
        " " +
        numBlocks +
        " " +
        this.FLASH_WRITE_SIZE +
        " " +
        offset +
        " " +
        size,
    );

    let pkt = this._appendArray(this._intToByteArray(eraseSize), this._intToByteArray(numBlocks));
    pkt = this._appendArray(pkt, this._intToByteArray(this.FLASH_WRITE_SIZE));
    pkt = this._appendArray(pkt, this._intToByteArray(offset));

    if (this.IS_STUB === false) {
      pkt = this._appendArray(pkt, this._intToByteArray(1));
    }

    await this.checkCommand("enter Flash download mode", this.ESP_FLASH_BEGIN, pkt, undefined, timeout);

    if (size !== 0 && this.IS_STUB === false) {
      const elapsed = Date.now() - startedAt;
      this.info(`Took ${elapsed / 1000}.${elapsed % 1000}s to erase flash block`);
    }

    return numBlocks;
  }

  async flashDeflBegin(size, compsize, offset) {
    const numBlocks = Math.floor((compsize + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE);
    const eraseBlocks = Math.floor((size + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE);
    const startedAt = Date.now();

    let writeSize;
    let timeout;

    if (this.IS_STUB) {
      writeSize = size;
      timeout = this.DEFAULT_TIMEOUT;
    } else {
      writeSize = eraseBlocks * this.FLASH_WRITE_SIZE;
      timeout = this.timeoutPerMb(this.ERASE_REGION_TIMEOUT_PER_MB, writeSize);
    }

    this.info(`Compressed ${size} bytes to ${compsize}...`);

    let pkt = this._appendArray(this._intToByteArray(writeSize), this._intToByteArray(numBlocks));
    pkt = this._appendArray(pkt, this._intToByteArray(this.FLASH_WRITE_SIZE));
    pkt = this._appendArray(pkt, this._intToByteArray(offset));

    if (
      (this.chip.CHIP_NAME === "ESP32-S2" ||
        this.chip.CHIP_NAME === "ESP32-S3" ||
        this.chip.CHIP_NAME === "ESP32-C3" ||
        this.chip.CHIP_NAME === "ESP32-C2") &&
      this.IS_STUB === false
    ) {
      pkt = this._appendArray(pkt, this._intToByteArray(1));
    }

    await this.checkCommand(
      "enter compressed flash mode",
      this.ESP_FLASH_DEFL_BEGIN,
      pkt,
      undefined,
      timeout,
    );

    if (size !== 0 && this.IS_STUB === false) {
      const elapsed = Date.now() - startedAt;
      this.info(`Took ${elapsed / 1000}.${elapsed % 1000}s to erase flash block`);
    }

    return numBlocks;
  }
}

export { MAKCUESPLoader, Transport };
