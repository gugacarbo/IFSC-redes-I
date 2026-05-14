const { execSync } = require("child_process");
const { existsSync, unlinkSync, statSync, readFileSync } = require("fs");
const { resolve } = require("path");

const TEST_URL = "https://raw.githubusercontent.com/facebook/react/main/README.md";

describe("download-checkstyle", () => {
	const outputDir = __dirname;
	const outputFile = "README.md";
	const outputPath = resolve(outputDir, outputFile);

	beforeEach(() => {
		// Clean up before each test
		if (existsSync(outputPath)) {
			unlinkSync(outputPath);
		}
	});

	afterAll(() => {
		// Clean up after all tests
		if (existsSync(outputPath)) {
			unlinkSync(outputPath);
		}
	});

	it("should download file when --url flag is provided", () => {
		// Verify file doesn't exist before download
		expect(existsSync(outputPath)).toBe(false);

		// Run download
		execSync(`node checkstyle-runner.cjs --url "${TEST_URL}"`, {
			cwd: outputDir,
			stdio: "pipe",
		});

		// Verify file was downloaded
		expect(existsSync(outputPath)).toBe(true);

		// Verify file has content
		const stats = statSync(outputPath);
		expect(stats.size).toBeGreaterThan(0);
		console.log(`Downloaded file size: ${stats.size} bytes`);
	});

	it("should skip download if file already exists", () => {
		// First download
		execSync(`node checkstyle-runner.cjs --url "${TEST_URL}"`, {
			cwd: outputDir,
			stdio: "pipe",
		});

		const statsBefore = statSync(outputPath);

		// Second run should skip download
		execSync(`node checkstyle-runner.cjs --url "${TEST_URL}"`, {
			cwd: outputDir,
			stdio: "pipe",
		});

		const statsAfter = statSync(outputPath);
		expect(statsAfter.size).toBe(statsBefore.size);
	});

	it("should have valid markdown content", () => {
		// Download the file
		execSync(`node checkstyle-runner.cjs --url "${TEST_URL}"`, {
			cwd: outputDir,
			stdio: "pipe",
		});

		// Read and verify content
		const content = readFileSync(outputPath, "utf-8");
		expect(content).toContain("React");
		expect(content.length).toBeGreaterThan(100);
	});
});
