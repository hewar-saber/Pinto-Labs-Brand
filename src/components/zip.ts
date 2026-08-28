/**
 * A minimal ZIP writer: stored (uncompressed) entries only, no dependency.
 *
 * The bundle is almost entirely PNG, WOFF2 and TTF, all of which are already
 * compressed, so deflating them would cost CPU and save nothing. Storing them
 * keeps this to a CRC table and three record layouts.
 *
 * Everything is held in memory and emitted as one Blob, which is fine at the
 * few-megabyte scale of the brand bundle.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++)
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  /** Path inside the archive, forward slashes, no leading slash. */
  path: string;
  data: Uint8Array;
}

/**
 * DOS date/time. Zip stores local time with two-second resolution and cannot
 * represent anything before 1980, so clamp rather than emit a negative year.
 */
function dosStamp(d: Date): { time: number; date: number } {
  const year = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

class Writer {
  private parts: Uint8Array[] = [];
  length = 0;

  push(bytes: Uint8Array) {
    this.parts.push(bytes);
    this.length += bytes.length;
  }

  /** Little-endian record builder; `spec` is a list of [byteWidth, value]. */
  record(spec: [number, number][]) {
    const size = spec.reduce((n, [w]) => n + w, 0);
    const buf = new Uint8Array(size);
    const view = new DataView(buf.buffer);
    let at = 0;
    for (const [width, value] of spec) {
      if (width === 2) view.setUint16(at, value, true);
      else view.setUint32(at, value >>> 0, true);
      at += width;
    }
    this.push(buf);
  }

  blob() {
    return new Blob(this.parts as BlobPart[], { type: "application/zip" });
  }
}

export function makeZip(entries: ZipEntry[], now = new Date()): Blob {
  const { time, date } = dosStamp(now);
  const encoder = new TextEncoder();
  const out = new Writer();
  const central: { name: Uint8Array; crc: number; size: number; at: number }[] =
    [];

  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    const crc = crc32(entry.data);
    const at = out.length;

    // Local file header. Bit 11 of the flags marks the name as UTF-8.
    out.record([
      [4, 0x04034b50],
      [2, 20], // version needed
      [2, 0x0800], // flags: UTF-8 name
      [2, 0], // method: stored
      [2, time],
      [2, date],
      [4, crc],
      [4, entry.data.length], // compressed size
      [4, entry.data.length], // uncompressed size
      [2, name.length],
      [2, 0], // extra field length
    ]);
    out.push(name);
    out.push(entry.data);

    central.push({ name, crc, size: entry.data.length, at });
  }

  const centralAt = out.length;
  for (const e of central) {
    out.record([
      [4, 0x02014b50],
      [2, 20], // version made by
      [2, 20], // version needed
      [2, 0x0800],
      [2, 0],
      [2, time],
      [2, date],
      [4, e.crc],
      [4, e.size],
      [4, e.size],
      [2, e.name.length],
      [2, 0], // extra
      [2, 0], // comment
      [2, 0], // disk number
      [2, 0], // internal attrs
      [4, 0], // external attrs
      [4, e.at], // offset of local header
    ]);
    out.push(e.name);
  }

  out.record([
    [4, 0x06054b50],
    [2, 0], // this disk
    [2, 0], // disk with central directory
    [2, central.length],
    [2, central.length],
    [4, out.length - centralAt],
    [4, centralAt],
    [2, 0], // comment length
  ]);

  return out.blob();
}
