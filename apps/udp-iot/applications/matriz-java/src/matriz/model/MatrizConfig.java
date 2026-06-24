package matriz.model;

import java.util.List;

public record MatrizConfig(
	String user,
	String pass,
	int pollingMs,
	List<FilialInfo> filiais
) {}
