package matriz.api;

import shared.Json;
import shared.LogCapture;

import java.util.List;

class LogHelper {

	private LogHelper() {}

	static String jsonError(int code, String message) {
		return "{\"error\":\"" + message + "\"}";
	}

	static String logsToJson(List<LogCapture.LogEntry> logEntries) {
		StringBuilder sb = new StringBuilder("[");
		boolean first = true;
		for (LogCapture.LogEntry e : logEntries) {
			if (!first) sb.append(",");
			first = false;
			sb.append("{\"level\":\"").append(e.level)
			  .append("\",\"message\":").append(Json.escape(e.message))
			  .append(",\"ts\":").append(e.ts).append("}");
		}
		sb.append("]");
		return sb.toString();
	}
}
