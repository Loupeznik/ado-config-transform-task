import yaml from 'js-yaml';
import transformJson from './json';

export default function transformYaml(targetYaml: string, transformations: string) {
	let parsedTarget: unknown;
	try {
		parsedTarget = yaml.load(targetYaml);
	} catch (error) {
		throw new Error(`Failed to parse target YAML file: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}

	if (typeof parsedTarget !== 'object' || parsedTarget === null || Array.isArray(parsedTarget)) {
		throw new Error('Target YAML must be a YAML object');
	}

	const resultJson = transformJson(JSON.stringify(parsedTarget), transformations);

	return yaml.dump(JSON.parse(resultJson));
}
