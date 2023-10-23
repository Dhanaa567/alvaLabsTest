class Message {
    constructor() {
        this.headers = {};
        this.payload = new Uint8Array(0);
    }
  }
  
  class MessageCodec {
    encode(message) {
        const maxHeaderCount = 63;
        const maxHeaderSize = 1023;
        const maxPayloadSize = 256 * 1024;
  
        if (Object.keys(message.headers).length > maxHeaderCount) {
            throw new Error("Exceeded maximum header count (63).");
        }
  
        const headerCount = Object.keys(message.headers).length;
        const headerBuffer = new Uint8Array(2 + headerCount * (2 + maxHeaderSize * 2));
  
        const view = new DataView(headerBuffer.buffer);
        let offset = 0;
  
        view.setUint8(offset++, headerCount);
  
        for (const name in message.headers) {
            if (message.headers.hasOwnProperty(name)) {
                const value = message.headers[name];
  
                if (name.length > maxHeaderSize || value.length > maxHeaderSize) {
                    throw new Error("Exceeded maximum header name or value size (1023 bytes).");
                }
  
                view.setUint16(offset, name.length);
                offset += 2;
                const nameBytes = new TextEncoder().encode(name);
                headerBuffer.set(nameBytes, offset);
                offset += name.length;
  
                view.setUint16(offset, value.length);
                offset += 2;
                const valueBytes = new TextEncoder().encode(value);
                headerBuffer.set(valueBytes, offset);
                offset += value.length;
            }
        }
  
        if (message.payload.length > maxPayloadSize) {
            throw new Error("Exceeded maximum payload size (256 KiB).");
        }
  
        const encodedMessage = new Uint8Array(headerBuffer.length + message.payload.length);
        encodedMessage.set(headerBuffer, 0);
        encodedMessage.set(message.payload, headerBuffer.length);
  
        return encodedMessage;
    }
  
    decode(data) {
        const view = new DataView(data.buffer);
        let offset = 0;
  
        const headerCount = view.getUint8(offset++);
        const headers = {};
  
        for (let i = 0; i < headerCount; i++) {
            const nameLength = view.getUint16(offset);
            offset += 2;
            const nameBytes = data.subarray(offset, offset + nameLength);
            const name = new TextDecoder().decode(nameBytes);
            offset += nameLength;
  
            const valueLength = view.getUint16(offset);
            offset += 2;
            const valueBytes = data.subarray(offset, offset + valueLength);
            const value = new TextDecoder().decode(valueBytes);
            offset += valueLength;
  
            headers[name] = value;
        }
  
        const payload = data.subarray(offset);
  
        const message = new Message();
        message.headers = headers;
        message.payload = payload;
  
        return message;
    }
  }
  
  