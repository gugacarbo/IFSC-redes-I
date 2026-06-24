package matriz.model;

public record FilialInfo(String name, String ip, int port) {

	public String displayString() {
		return name + " (" + ip + ":" + port + ")";
	}
}
