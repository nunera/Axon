import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envFilePath = resolve('.env');

function parseEnv(contents: string): Record<string, string> {
	const result: Record<string, string> = {};
	const lines = contents.split(/\r?\n/);

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;

		const equalIndex = line.indexOf('=');
		if (equalIndex === -1) continue;

		const key = line.slice(0, equalIndex).trim();
		let value = line.slice(equalIndex + 1).trim();

		if (!key) continue;

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		result[key] = value;
	}

	return result;
}

let fileEnv: Record<string, string> = {};

try {
	const envFile = readFileSync(envFilePath, 'utf-8');
	fileEnv = parseEnv(envFile);
} catch (error: unknown) {
	if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
		console.warn('Unable to read .env file:', error);
	}
}

export function getEnv(key: string, fallback?: string): string | undefined {
	if (key in fileEnv) {
		return fileEnv[key];
	}

	if (process.env[key] !== undefined) {
		return process.env[key];
	}

	return fallback;
}
