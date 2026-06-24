package matriz.network.ws;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

class WebSocketFrameIO {

	private WebSocketFrameIO() {}

	static void sendText(OutputStream out, String text) throws IOException {
		byte[] payload = text.getBytes(StandardCharsets.UTF_8);
		sendFrame(out, Frame.OPCODE_TEXT, payload);
	}

	static void sendClose(OutputStream out) throws IOException {
		sendFrame(out, Frame.OPCODE_CLOSE, new byte[0]);
	}

	static void sendPong(OutputStream out, byte[] payload) throws IOException {
		sendFrame(out, Frame.OPCODE_PONG, payload);
	}

	static void sendFrame(OutputStream out, int opcode, byte[] payload) throws IOException {
		int len = payload.length;
		out.write(0x80 | opcode);

		if (len < 126) {
			out.write(len);
		} else if (len < 65536) {
			out.write(126);
			out.write((len >>> 8) & 0xFF);
			out.write(len & 0xFF);
		} else {
			out.write(127);
			for (int i = 7; i >= 0; i--) {
				out.write((len >>> (i * 8)) & 0xFF);
			}
		}

		out.write(payload);
		out.flush();
	}

	static Frame readFrame(InputStream in) throws IOException {
		int b1 = in.read();
		if (b1 == -1) return null;
		int b2 = in.read();
		if (b2 == -1) return null;

		boolean masked = (b2 & 0x80) != 0;
		int len = b2 & 0x7F;

		if (len == 126) {
			len = (in.read() << 8) | in.read();
		} else if (len == 127) {
			long longLen = 0;
			for (int i = 0; i < 8; i++) {
				longLen = (longLen << 8) | (in.read() & 0xFF);
			}
			if (longLen > Integer.MAX_VALUE) {
				throw new IOException("Frame too large: " + longLen);
			}
			len = (int) longLen;
		}

		byte[] mask = null;
		if (masked) {
			mask = new byte[4];
			int read = in.readNBytes(mask, 0, 4);
			if (read < 4) return null;
		}

		byte[] payload = new byte[len];
		int totalRead = 0;
		while (totalRead < len) {
			int n = in.read(payload, totalRead, len - totalRead);
			if (n == -1) return null;
			totalRead += n;
		}

		if (masked) {
			for (int i = 0; i < len; i++) {
				payload[i] ^= mask[i % 4];
			}
		}

		return new Frame(b1 & 0x0F, payload);
	}
}
