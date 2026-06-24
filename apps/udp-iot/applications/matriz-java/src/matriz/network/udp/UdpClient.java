package matriz.network.udp;

import lib.logging.Logger;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;

public class UdpClient {

	private static final Logger logger = Logger.getLogger(UdpClient.class);

	private static final int MAX_DATAGRAM_SIZE = 2048;
	private static final int DEFAULT_TIMEOUT_MS = 3000;

	public String sendAndReceive(String ip, int port, String json, int timeoutMs) {
		try (DatagramSocket socket = new DatagramSocket()) {
			socket.setSoTimeout(timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS);

			InetAddress addr = InetAddress.getByName(ip);
			byte[] sendData = json.getBytes(StandardCharsets.UTF_8);
			DatagramPacket sendPacket = new DatagramPacket(sendData, sendData.length, addr, port);
			socket.send(sendPacket);

			byte[] recvBuf = new byte[MAX_DATAGRAM_SIZE];
			DatagramPacket recvPacket = new DatagramPacket(recvBuf, recvBuf.length);
			socket.receive(recvPacket);

			return new String(recvPacket.getData(), 0, recvPacket.getLength(), StandardCharsets.UTF_8);
		} catch (java.net.SocketTimeoutException e) {
			logger.warn("UdpClient: Timeout waiting for response from {}:{}", ip, port);
			return null;
		} catch (Exception e) {
			logger.error("UdpClient: Error communicating with {}:{} -- {}", ip, port, e.getMessage());
			return null;
		}
	}

	public String sendAndReceive(String ip, int port, String json) {
		return sendAndReceive(ip, port, json, DEFAULT_TIMEOUT_MS);
	}

	public void send(String ip, int port, String json) {
		try (DatagramSocket socket = new DatagramSocket()) {
			InetAddress addr = InetAddress.getByName(ip);
			byte[] data = json.getBytes(StandardCharsets.UTF_8);
			DatagramPacket packet = new DatagramPacket(data, data.length, addr, port);
			socket.send(packet);
		} catch (Exception e) {
			logger.error("UdpClient: Error sending to {}:{} -- {}", ip, port, e.getMessage());
		}
	}
}
