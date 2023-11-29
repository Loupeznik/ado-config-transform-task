export default function transformJson(target: string, transformations: string) {
	const targetJson = JSON.parse(target);
	const transformedTarget = transformJsonInternal(targetJson, JSON.parse(transformations));

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
