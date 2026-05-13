export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}
export function wrap(value: number, min: number, max: number): number {
	if (max < min) return min;
	const range = max - min + 1;
	return ((value - min) % range + range) % range + min;
}
