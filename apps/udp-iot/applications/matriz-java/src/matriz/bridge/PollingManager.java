package matriz.bridge;

import lib.logging.Logger;
import matriz.config.ConfigManager;
import matriz.model.MatrizConfig;
import matriz.network.udp.UdpClient;
import matriz.state.FilialStateTracker;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class PollingManager {

	private static final Logger logger = Logger.getLogger(PollingManager.class);

	private final ConfigManager configManager;
	private final FilialPollTask pollTask;

	private final AtomicBoolean running = new AtomicBoolean(false);
	private ScheduledExecutorService scheduler;

	public PollingManager(ConfigManager configManager, UdpClient udpClient,
						  BridgeManager bridgeManager,
						  FilialStateTracker stateTracker) {
		this.configManager = configManager;
		this.pollTask = new FilialPollTask(configManager, udpClient, bridgeManager, stateTracker);
	}

	public synchronized void restart() {
		stop();
		start();
	}

	public void start() {
		if (running.getAndSet(true)) return;

		MatrizConfig cfg = configManager.getConfig();
		if (cfg.pollingMs() <= 0) {
			logger.info("Polling: Disabled (polling_ms = 0)");
			running.set(false);
			return;
		}

		scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
			Thread t = new Thread(r, "polling-manager");
			t.setDaemon(true);
			return t;
		});

		scheduler.scheduleAtFixedRate(
			this::pollCycle,
			1000,
			cfg.pollingMs(),
			TimeUnit.MILLISECONDS
		);

		logger.info("Polling: Started (interval={}ms, {} filiais)", cfg.pollingMs(), cfg.filiais().size());
	}

	public void stop() {
		running.set(false);
		if (scheduler != null) {
			scheduler.shutdown();
		}
	}

	public boolean isRunning() {
		return running.get();
	}

	private void pollCycle() {
		MatrizConfig cfg;
		try {
			cfg = configManager.getConfig();
		} catch (Exception e) {
			return;
		}

		if (cfg.filiais().isEmpty()) {
			return;
		}

		for (var filial : cfg.filiais()) {
			pollTask.poll(filial, cfg);
		}
	}
}
