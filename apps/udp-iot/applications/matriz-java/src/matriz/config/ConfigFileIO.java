package matriz.config;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

class ConfigFileIO {

	String readString(String configPath) throws IOException {
		return Files.readString(Path.of(configPath));
	}

	void writeAtomic(String jsonContent, String configPath) throws IOException {
		Path target = Path.of(configPath);
		Path parent = target.toAbsolutePath().getParent();
		if (parent != null) {
			Files.createDirectories(parent);
		}

		Path tempFile = Files.createTempFile(parent, target.getFileName().toString(), ".tmp");
		try {
			Files.writeString(tempFile, jsonContent);
			try {
				Files.move(
					tempFile,
					target,
					StandardCopyOption.REPLACE_EXISTING,
					StandardCopyOption.ATOMIC_MOVE
				);
			} catch (AtomicMoveNotSupportedException e) {
				Files.move(tempFile, target, StandardCopyOption.REPLACE_EXISTING);
			}
		} finally {
			Files.deleteIfExists(tempFile);
		}
	}
}
