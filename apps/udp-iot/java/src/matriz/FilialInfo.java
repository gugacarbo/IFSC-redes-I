package matriz;

/**
 * Connection information for a configured branch (filial).
 *
 * @param name Human-readable branch label (e.g. "Filial A")
 * @param ip   IP address of the filial (e.g. "192.168.1.100")
 * @param port UDP port of the filial (default 51000)
 */
public record FilialInfo(String name, String ip, int port) {

    /** Human-friendly summary string. */
    public String displayString() {
        return name + " (" + ip + ":" + port + ")";
    }
}
