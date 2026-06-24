package matriz.network.ws;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.util.concurrent.atomic.AtomicBoolean;

public class WebSocketSession {

	private final Socket socket;
	private final InputStream in;
	private final OutputStream out;
	private final AtomicBoolean open = new AtomicBoolean(true);
	private final String remoteAddr;

	public WebSocketSession(Socket socket, InputStream inputStream, OutputStream outputStream) {
		this.socket = socket;
		this.in = inputStream;
		this.out = outputStream;
		this.remoteAddr = socket.getInetAddress().getHostAddress() + ":" + socket.getPort();
	}

	public String remoteAddress() { return remoteAddr; }

	public boolean isOpen() { return open.get() && !socket.isClosed(); }

	public synchronized void sendText(String text) throws IOException {
		if (!isOpen()) return;
		WebSocketFrameIO.sendText(out, text);
	}

	public String readFrame() throws IOException {
		if (!isOpen()) return null;

		Frame frame = WebSocketFrameIO.readFrame(in);
		if (frame == null) {
			close();
			return null;
		}

		return switch (frame.opcode()) {
			case Frame.OPCODE_TEXT -> frame.textPayload();
			case Frame.OPCODE_CLOSE -> { close(); yield null; }
			case Frame.OPCODE_PING -> {
				synchronized (this) {
					WebSocketFrameIO.sendPong(out, frame.payload());
				}
				yield null;
			}
			case Frame.OPCODE_PONG -> null;
			default -> null;
		};
	}

	public void close() {
		if (!open.compareAndSet(true, false)) return;
		try {
			synchronized (this) {
				if (!socket.isClosed()) {
					WebSocketFrameIO.sendClose(out);
				}
			}
		} catch (Exception ignored) {}
		try { socket.close(); } catch (Exception ignored) {}
	}
}
