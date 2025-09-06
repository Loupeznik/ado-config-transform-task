function removeBom(str: string): string {
	// Remove UTF-8 BOM (EF BB BF) if present
	if (str.charCodeAt(0) === 0xFEFF) {
		return str.slice(1);
	}
	return str;
}

export default function transformJson(target: string, transformations: string) {
	let targetJson: any;
	let transformationsJson: any;

	// Parse target JSON with better error handling
	try {
		targetJson = JSON.parse(target);
	} catch (error) {
		throw new Error(`Failed to parse target JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}

	// Clean and parse transformations JSON with better error handling
	try {
		// Remove BOM and trim whitespace from transformations
		const cleanTransformations = removeBom(transformations.trim());
		transformationsJson = JSON.parse(cleanTransformations);
	} catch (error) {
		throw new Error(`Failed to parse transformations JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}

	const transformedTarget = transformJsonInternal(targetJson, transformationsJson);

	return JSON.stringify(transformedTarget);
}

function transformJsonInternal(target: any, transformations: any) {
	Object.keys(transformations).forEach(transformKey => {
		const keys = transformKey.split('.');
		let currentTarget = target;

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (i === keys.length - 1) {
				currentTarget[key] = transformations[transformKey];
			} else {
				currentTarget[key] = currentTarget[key] || {};
				currentTarget = currentTarget[key];
			}
		}
	});

	return target;
}
