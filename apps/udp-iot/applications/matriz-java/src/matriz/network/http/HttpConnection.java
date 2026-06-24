package matriz.network.http;

import matriz.api.ApiHandler;
import matriz.bridge.BridgeManager;
import matriz.network.ws.WebSocketHandshake;
import matriz.network.ws.WebSocketSession;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

public class HttpConnection {

	private static final String UPGRADE_HEADER = "upgrade: websocket";
	private static final int BUFFER_SIZE = 8192;

	private final Socket client;
	private final InputStream in;
	private final OutputStream out;
	private final BridgeManager bridge;
	private final ApiHandler apiHandler;
	private final WebSocketHandshake handshake;

	public HttpConnection(Socket client, BridgeManager bridge,
						  ApiHandler apiHandler, WebSocketHandshake handshake) throws IOException {
		this.client = client;
		this.in = client.getInputStream();
		this.out = client.getOutputStream();
		this.bridge = bridge;
		this.apiHandler = apiHandler;
		this.handshake = handshake;
		client.setSoTimeout(15000);
	}

	public void handle() throws IOException {
		byte[] buf = new byte[BUFFER_SIZE];
		int totalRead = 0;

		while (totalRead < buf.length) {
			int n = in.read(buf, totalRead, buf.length - totalRead);
			if (n == -1) {
				client.close();
				return;
			}
			totalRead += n;

			String headerSection = new String(buf, 0, totalRead, StandardCharsets.US_ASCII);
			int headerEnd = headerSection.indexOf("\r\n\r\n");
			if (headerEnd == -1) continue;

			String headers = headerSection.substring(0, headerEnd);
			int bodyStart = headerEnd + 4;

			if (headers.toLowerCase().contains(UPGRADE_HEADER)) {
				handleWebSocket(buf, totalRead, headers);
				return;
			} else {
				handleRest(headers, bodyStart, buf, totalRead);
				return;
			}
		}

		client.close();
	}

	private void handleWebSocket(byte[] buf, int totalRead,
								  String headers) throws IOException {
		if (handshake.perform(new java.io.ByteArrayInputStream(buf, 0, totalRead), out)) {
			WebSocketSession session = new WebSocketSession(client, in, out);
			bridge.onSessionOpened(session);
			bridge.sessionReadLoop(session);
		} else {
			HttpResponse.sendJson(out, 400, "Bad Request",
				"{\"error\":\"WebSocket handshake failed\"}");
		}
	}

	private void handleRest(String headers, int bodyStart, byte[] buf,
							 int totalRead) throws IOException {
		byte[] bodyBytes = new byte[totalRead - bodyStart];
		System.arraycopy(buf, bodyStart, bodyBytes, 0, bodyBytes.length);

		int contentLength = parseContentLength(headers);
		int alreadyRead = bodyBytes.length;
		if (contentLength > alreadyRead) {
			byte[] remaining = in.readNBytes(contentLength - alreadyRead);
			byte[] combined = new byte[bodyBytes.length + remaining.length];
			System.arraycopy(bodyBytes, 0, combined, 0, bodyBytes.length);
			System.arraycopy(remaining, 0, combined, bodyBytes.length, remaining.length);
			bodyBytes = combined;
		}

		String body = new String(bodyBytes, StandardCharsets.UTF_8);
		String requestLine = headers.substring(0, headers.indexOf("\r\n"));
		String[] parts = requestLine.split(" ");
		String method = parts.length > 0 ? parts[0].toUpperCase() : "GET";
		String path   = parts.length > 1 ? parts[1] : "/";

		String responseBody = apiHandler.handle(method, path, body);
		int statusCode = apiHandler.lastStatusCode();
		String contentType = responseBody.startsWith("{") || responseBody.startsWith("[")
			? "application/json"
			: "text/plain";
		HttpResponse.send(out, statusCode, HttpResponse.statusText(statusCode),
			contentType, responseBody);
	}

	private int parseContentLength(String headers) {
		for (String line : headers.split("\r\n")) {
			if (line.toLowerCase().startsWith("content-length:")) {
				try {
					return Integer.parseInt(line.substring(15).trim());
				} catch (NumberFormatException e) {
					return 0;
				}
			}
		}
		return 0;
	}
}
