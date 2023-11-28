import yaml from 'js-yaml';
import transformJson from './json';

function transformYaml(targetYaml: any, transformations: any) {
    const targetObject = yaml.load(targetYaml);

    const resultJson = transformJson(JSON.stringify(targetObject), transformations);

    return yaml.dump(JSON.parse(resultJson));
}

export default transformYaml;
