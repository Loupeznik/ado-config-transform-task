export default function transformFlatFile(target: string, transformations: string, separator: string) {
	const transformationsObject = JSON.parse(transformations);
	const lines = target.split('\n');

	const transformedLines = lines.map(line => {
		const lineParts = line.split(separator);
		const key = lineParts[0];

		if (transformationsObject[key]) {
			return `${key}${separator}${transformationsObject[key]}`;
		}

		return line;
	});

	return transformedLines.join('\n');
}
