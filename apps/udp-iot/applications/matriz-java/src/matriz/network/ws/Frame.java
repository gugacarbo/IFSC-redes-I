package matriz.network.ws;

public record Frame(int opcode, byte[] payload) {

	public static final int OPCODE_TEXT = 0x1;
	public static final int OPCODE_CLOSE = 0x8;
	public static final int OPCODE_PING = 0x9;
	public static final int OPCODE_PONG = 0xA;

	public String textPayload() {
		return new String(payload, java.nio.charset.StandardCharsets.UTF_8);
	}
}
