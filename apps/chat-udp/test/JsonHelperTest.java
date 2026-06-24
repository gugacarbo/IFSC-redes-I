import util.JsonHelper;

public final class JsonHelperTest {

	private JsonHelperTest() {
	}

	public static void main(String[] args) {
		extractsFromMinifiedJson();
		extractsFromPrettyJson();
		extractsRegardlessOfKeyOrder();
		decodesEscapedCharacters();
		decodesUnicodeEscapes();
		ignoresSimilarTextInsideValues();
		returnsEmptyForMissingOrNonStringValues();
		buildMessageEscapesPayloadFields();

		System.out.println("JsonHelperTest: todos os testes passaram.");
	}

	private static void extractsFromMinifiedJson() {
		String json = "{\"date\":\"28/05/2026\",\"time\":\"11:20:10\","
				+ "\"username\":\"Ana\",\"message\":\"Oi\"}";

		assertEquals("28/05/2026", JsonHelper.extractValue(json, "date"));
		assertEquals("11:20:10", JsonHelper.extractValue(json, "time"));
		assertEquals("Ana", JsonHelper.extractValue(json, "username"));
		assertEquals("Oi", JsonHelper.extractValue(json, "message"));
	}

	private static void extractsFromPrettyJson() {
		String json = """
				{
				  "date" : "28/05/2026",
				  "time" : "11:20:10",
				  "username" : "Bruno",
				  "message" : "Mensagem formatada"
				}
				""";

		assertEquals("Bruno", JsonHelper.extractValue(json, "username"));
		assertEquals("Mensagem formatada", JsonHelper.extractValue(json, "message"));
	}

	private static void extractsRegardlessOfKeyOrder() {
		String json = "{\"message\":\"Cheguei\",\"username\":\"Carol\","
				+ "\"time\":\"08:00:00\",\"date\":\"01/06/2026\"}";

		assertEquals("Carol", JsonHelper.extractValue(json, "username"));
		assertEquals("Cheguei", JsonHelper.extractValue(json, "message"));
		assertEquals("01/06/2026", JsonHelper.extractValue(json, "date"));
	}

	private static void decodesEscapedCharacters() {
		String json = "{\"message\":\"linha 1\\nlinha 2\\t\\\\\\\"fim\\\"\","
				+ "\"username\":\"Davi\"}";

		assertEquals("linha 1\nlinha 2\t\\\"fim\"", JsonHelper.extractValue(json, "message"));
	}

	private static void decodesUnicodeEscapes() {
		String json = "{\"username\":\"Jo\\u00e3o\",\"message\":\"Ol\\u00e1\"}";

		assertEquals("João", JsonHelper.extractValue(json, "username"));
		assertEquals("Olá", JsonHelper.extractValue(json, "message"));
	}

	private static void ignoresSimilarTextInsideValues() {
		String json = "{\"note\":\"texto com \\\"message\\\" : \\\"errado\\\"\","
				+ "\"message\":\"certo\"}";

		assertEquals("certo", JsonHelper.extractValue(json, "message"));
	}

	private static void returnsEmptyForMissingOrNonStringValues() {
		String json = "{\"username\":\"Eva\",\"message\":123}";

		assertEquals("", JsonHelper.extractValue(json, "message"));
		assertEquals("", JsonHelper.extractValue(json, "date"));
		assertEquals("", JsonHelper.extractValue(null, "date"));
		assertEquals("", JsonHelper.extractValue(json, null));
	}

	private static void buildMessageEscapesPayloadFields() {
		String json = JsonHelper.buildMessage("A\"na", "oi\nmundo\\teste");

		assertEquals("A\"na", JsonHelper.extractValue(json, "username"));
		assertEquals("oi\nmundo\\teste", JsonHelper.extractValue(json, "message"));
	}

	private static void assertEquals(String expected, String actual) {
		if (!expected.equals(actual)) {
			throw new AssertionError("Esperado [" + expected + "], recebido [" + actual + "]");
		}
	}
}
