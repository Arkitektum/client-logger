export function createUUID(): string {
    // crypto.getRandomValues works in insecure contexts (plain http on a LAN
    // IP/hostname), unlike crypto.randomUUID which requires a secure context.
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx

    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
        hex += (bytes[i] + 0x100).toString(16).slice(1);
    }

    return (
        hex.slice(0, 8) +
        "-" +
        hex.slice(8, 12) +
        "-" +
        hex.slice(12, 16) +
        "-" +
        hex.slice(16, 20) +
        "-" +
        hex.slice(20, 32)
    );
}
