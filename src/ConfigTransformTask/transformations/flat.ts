type FlatValue = string | number | boolean | null;
type FlatTransformations = Record<string, FlatValue>;

function parseTransformations(transformations: string): FlatTransformations {
	let parsedTransformations: unknown;

	try {
		parsedTransformations = JSON.parse(transformations);
	} catch (error) {
		throw new Error(
			`Failed to parse transformations JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}

	if (
		typeof parsedTransformations !== 'object' ||
		parsedTransformations === null ||
		Array.isArray(parsedTransformations)
	) {
		throw new Error('Transformations must be a JSON object');
	}

	const transformationsObject = parsedTransformations as Record<string, unknown>;
	const result: FlatTransformations = {};

	Object.keys(transformationsObject).forEach(key => {
		const value = transformationsObject[key];
		if (
			typeof value !== 'string' &&
			typeof value !== 'number' &&
			typeof value !== 'boolean' &&
			value !== null
		) {
			throw new Error(`Transformation value for '${key}' must be a primitive value`);
		}
		result[key] = value;
	});

	return result;
}

function stringifyFlatValue(value: FlatValue): string {
	if (value === null) {
		return '';
	}
	return String(value);
}

export default function transformFlatFile(target: string, transformations: string, separator: string) {
	const transformationsObject = parseTransformations(transformations);
	const lines = target.split('\n');
	const keysToTransform = new Set(Object.keys(transformationsObject));

	const transformedLines = lines.map(line => {
		const trimmedLine = line.trimStart();
		if (trimmedLine.startsWith('#') || trimmedLine.startsWith(';') || line.trim() === '') {
			return line;
		}

		const separatorIndex = line.indexOf(separator);
		if (separatorIndex === -1) {
			return line;
		}

		const originalKeyPart = line.slice(0, separatorIndex);
		const normalizedKey = originalKeyPart.trim();
		if (!normalizedKey || !(normalizedKey in transformationsObject)) {
			return line;
		}

		keysToTransform.delete(normalizedKey);
		return `${originalKeyPart}${separator}${stringifyFlatValue(transformationsObject[normalizedKey])}`;
	});

	keysToTransform.forEach(key => {
		transformedLines.push(`${key}${separator}${stringifyFlatValue(transformationsObject[key])}`);
	});

	return transformedLines.join('\n');
}
