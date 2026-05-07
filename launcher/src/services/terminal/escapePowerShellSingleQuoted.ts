export function escapePowerShellSingleQuoted(value: string): string {
	return value.replace(/'/g, "''");
}
