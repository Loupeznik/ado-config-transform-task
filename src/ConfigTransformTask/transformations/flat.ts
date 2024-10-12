export default function transformFlatFile(target: string, transformations: string, separator: string) {
	const transformationsObject = JSON.parse(transformations);
	const lines = target.split('\n');

	let keysToTransform = Object.keys(transformationsObject);

	const transformedLines = lines.map(line => {
		const lineParts = line.split(separator);
		const key = lineParts[0];

		if (transformationsObject[key]) {
			keysToTransform = keysToTransform.filter(k => k !== key);
			return `${key}${separator}${transformationsObject[key]}`;
		}

		return line;
	});

	if (keysToTransform.length > 0) {
		keysToTransform.forEach(key => {
			transformedLines.push(`${key}${separator}${transformationsObject[key]}`);
		});
	}

	return transformedLines.join('\n');
}
