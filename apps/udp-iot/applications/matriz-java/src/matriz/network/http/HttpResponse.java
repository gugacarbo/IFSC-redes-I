package matriz.network.http;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class HttpResponse {

	private HttpResponse() {}

	public static void sendJson(OutputStream out, int statusCode,
								  String statusText, String body) throws IOException {
		send(out, statusCode, statusText, "application/json", body);
	}

	public static void send(OutputStream out, int statusCode,
							 String statusText, String contentType,
							 String body) throws IOException {
		byte[] bodyBytes = body.getBytes(StandardCharsets.UTF_8);
		String response = "HTTP/1.1 " + statusCode + " " + statusText + "\r\n"
			+ "Content-Type: " + contentType + "\r\n"
			+ "Content-Length: " + bodyBytes.length + "\r\n"
			+ "Access-Control-Allow-Origin: *\r\n"
			+ "Access-Control-Allow-Methods: GET, PUT, OPTIONS\r\n"
			+ "Access-Control-Allow-Headers: Content-Type\r\n"
			+ "Connection: close\r\n"
			+ "\r\n";
		out.write(response.getBytes(StandardCharsets.US_ASCII));
		out.write(bodyBytes);
		out.flush();
	}

	public static String statusText(int code) {
		return switch (code) {
			case 200 -> "OK";
			case 204 -> "No Content";
			case 400 -> "Bad Request";
			case 404 -> "Not Found";
			case 405 -> "Method Not Allowed";
			case 500 -> "Internal Server Error";
			default -> "Unknown";
		};
	}
}
