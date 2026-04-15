type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type TransformationsObject = { [key: string]: JsonValue };
type JsonContainer = JsonObject | JsonValue[];

function removeBom(str: string): string {
	if (str.charCodeAt(0) === 0xfeff) {
		return str.slice(1);
	}
	return str;
}

export default function transformJson(target: string, transformations: string) {
	let targetJson: JsonObject;
	let transformationsJson: TransformationsObject;

	try {
		targetJson = JSON.parse(target);
	} catch (error) {
		throw new Error(
			`Failed to parse target JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}

	try {
		const cleanTransformations = removeBom(transformations.trim());
		transformationsJson = JSON.parse(cleanTransformations);
	} catch (error) {
		throw new Error(
			`Failed to parse transformations JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}

	const transformedTarget = transformJsonInternal(targetJson, transformationsJson);

	return JSON.stringify(transformedTarget);
}

function transformJsonInternal(target: JsonObject, transformations: TransformationsObject): JsonObject {
	Object.keys(transformations).forEach(transformKey => {
		const keys = transformKey.split('.');
		let currentContainer: JsonContainer = target;

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const isLastKey = i === keys.length - 1;
			const nextKey = keys[i + 1];

			if (Array.isArray(currentContainer)) {
				const index = Number(key);
				if (!Number.isInteger(index) || index < 0) {
					throw new Error(`Invalid array index in transformation path: ${transformKey}`);
				}

				if (isLastKey) {
					currentContainer[index] = transformations[transformKey];
					continue;
				}

				currentContainer[index] = ensureContainer(currentContainer[index], nextKey);

				currentContainer = currentContainer[index] as JsonContainer;
				continue;
			}

			if (isLastKey) {
				currentContainer[key] = transformations[transformKey];
			} else {
				currentContainer[key] = ensureContainer(currentContainer[key], nextKey);
				currentContainer = currentContainer[key] as JsonContainer;
			}
		}
	});

	return target;
}

function isContainer(value: JsonValue | undefined): value is JsonContainer {
	return typeof value === 'object' && value !== null;
}

function isArrayIndex(key: string | undefined) {
	return key !== undefined && /^\d+$/.test(key);
}

function ensureContainer(value: JsonValue | undefined, nextKey: string | undefined): JsonContainer {
	if (isArrayIndex(nextKey)) {
		if (Array.isArray(value)) {
			return value;
		}

		return value === undefined ? [] : [value];
	}

	if (isContainer(value) && !Array.isArray(value)) {
		return value;
	}

	return {};
}
