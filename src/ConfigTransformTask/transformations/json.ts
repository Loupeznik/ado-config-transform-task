type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type TransformationsObject = { [key: string]: JsonValue };

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
		let currentTarget: JsonObject = target;

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (i === keys.length - 1) {
				currentTarget[key] = transformations[transformKey];
			} else {
				if (!currentTarget[key] || typeof currentTarget[key] !== 'object' || Array.isArray(currentTarget[key])) {
					currentTarget[key] = {};
				}
				currentTarget = currentTarget[key] as JsonObject;
			}
		}
	});

	return target;
}
