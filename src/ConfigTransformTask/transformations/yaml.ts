import yaml from 'js-yaml';
import transformJson from './json';

export default function transformYaml(targetYaml: string, transformations: string) {
	const targetObject = yaml.load(targetYaml);
	const resultJson = transformJson(JSON.stringify(targetObject), transformations);

	return yaml.dump(JSON.parse(resultJson));
}
