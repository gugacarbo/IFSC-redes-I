package filial.network.ws;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class WebSocketHandshake {

    private static final String MAGIC_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

    public static boolean performHandshake(InputStream in, OutputStream out) throws IOException {
        StringBuilder request = new StringBuilder();
        int ch;
        while ((ch = in.read()) != -1) {
            request.append((char) ch);
            if (request.toString().endsWith("\r\n\r\n")) break;
        }
        String reqStr = request.toString();
        if (reqStr.isEmpty()) return false;
        String keyPrefix = "Sec-WebSocket-Key: ";
        int keyStart = reqStr.indexOf(keyPrefix);
        if (keyStart == -1) return false;
        keyStart += keyPrefix.length();
        int keyEnd = reqStr.indexOf("\r\n", keyStart);
        if (keyEnd == -1) return false;
        String key = reqStr.substring(keyStart, keyEnd).trim();
        String acceptKey;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            md.update(key.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            md.update(MAGIC_GUID.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            acceptKey = Base64.getEncoder().encodeToString(md.digest());
        } catch (NoSuchAlgorithmException e) {
            return false;
        }
        String response = "HTTP/1.1 101 Switching Protocols\r\n"
            + "Upgrade: websocket\r\n"
            + "Connection: Upgrade\r\n"
            + "Sec-WebSocket-Accept: " + acceptKey + "\r\n"
            + "Access-Control-Allow-Origin: *\r\n"
            + "\r\n";
        out.write(response.getBytes(java.nio.charset.StandardCharsets.US_ASCII));
        out.flush();
        return true;
    }
}
