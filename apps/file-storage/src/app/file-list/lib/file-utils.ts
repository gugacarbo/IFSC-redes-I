/**
 * Utility functions for file operations
 */

/**
 * Converts a File to base64 string (without data URL prefix)
 */
export function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			const base64String = reader.result as string;
			// Remove data URL prefix (e.g., "data:image/png;base64,")
			const base64Content = base64String.split(",")[1];
			resolve(base64Content);
		};
		reader.onerror = (error) => reject(error);
	});
}

/**
 * Calculates SHA-256 hash of a file
 */
export async function calculateHash(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
