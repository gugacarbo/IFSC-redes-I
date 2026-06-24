package matriz.network.http;

import lib.logging.Logger;
import matriz.api.ApiHandler;
import matriz.bridge.BridgeManager;
import matriz.network.ws.WebSocketHandshake;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class AppServer {

	private static final Logger logger = Logger.getLogger(AppServer.class);

	private final int port;
	private final BridgeManager bridge;
	private final ApiHandler apiHandler;
	private final WebSocketHandshake handshake;

	private ServerSocket serverSocket;
	private Thread acceptThread;
	private final AtomicBoolean running = new AtomicBoolean(false);
	private ExecutorService connectionPool;

	public AppServer(int port, BridgeManager bridge,
					 ApiHandler apiHandler, WebSocketHandshake handshake) {
		this.port = port;
		this.bridge = bridge;
		this.apiHandler = apiHandler;
		this.handshake = handshake;
	}

	public boolean start() {
		if (running.get()) return true;

		connectionPool = Executors.newCachedThreadPool();

		try {
			serverSocket = new ServerSocket(port);
			serverSocket.setReuseAddress(true);
			running.set(true);
		} catch (IOException e) {
			logger.error("AppServer: Failed to bind port {}: {}", port, e.getMessage());
			return false;
		}

		acceptThread = new Thread(this::acceptLoop, "app-server-accept");
		acceptThread.setDaemon(true);
		acceptThread.start();

		logger.info("AppServer: Listening on port {} (REST + WebSocket)", port);
		return true;
	}

	public void stop() {
		running.set(false);
		if (serverSocket != null && !serverSocket.isClosed()) {
			try { serverSocket.close(); } catch (IOException ignored) {}
		}
		if (connectionPool != null) connectionPool.shutdownNow();
	}

	private void acceptLoop() {
		while (running.get()) {
			try {
				Socket client = serverSocket.accept();
				connectionPool.submit(() -> {
					try {
						new HttpConnection(client, bridge, apiHandler, handshake).handle();
					} catch (IOException e) {
						try { client.close(); } catch (IOException ignored) {}
					}
				});
			} catch (java.net.SocketException e) {
				if (!running.get()) break;
				logger.error("AppServer: Accept error: {}", e.getMessage());
			} catch (IOException e) {
				if (running.get()) {
					logger.error("AppServer: Accept error: {}", e.getMessage());
				}
			}
		}
	}
}
