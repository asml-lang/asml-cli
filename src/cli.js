import arg from 'arg';
import AsmlValidator from 'asml-validator';
import fs from 'fs';
import path from 'path';
import { quicktype, InputData, jsonInputForTargetLanguage, JSONSchemaInput, JSONSchemaStore } from "quicktype-core";

const asml = new AsmlValidator();
const langauges = { "Ruby": "rb", "JavaScript": "js", "Flow": "js", "Rust": "rs", "Kotlin": "kt", "Dart": "dart", "Python": "py", "C#": "cs", "Go": "go", "C++": "cpp", "Java": "java", "TypeScript": "ts", "Swift": "swift", "Objective-C": ".m", "Elm": "elm" };

function parseArgToOpt(rawArgs) {
    const args = arg({
        '--validate': String,
        '--generate': String,
        '--langauge': String,
        '--output': String,
        '-v': '--validate',
        '-g': '--generate',
        '-l': '--langauge',
        '-o': '--output'
    }, {
        argv: rawArgs.slice(2)
    })
    return {
        generate: args['--generate'],
        validate: args['--validate'],
        langauge: args['--langauge'],
        output: args['--output'] || args['--generate'],
    }
}
export function cli(args) {
    let options = parseArgToOpt(args);

    if (options.validate !== undefined) {
        const input_path = options.validate;
        if (fs.existsSync(input_path)) {
            if (fs.statSync(input_path).isDirectory()) {
                console.log(`Loading models from directory...`);
                fs.readdir(input_path, (err, files) => {
                    files.forEach(file => {
                        if (path.parse(file).ext.toLowerCase() == '.json') {
                            validateModelFile(input_path + '/' + file);
                        }
                    });
                });
            } else {
                validateModelFile(input_path);
            }
        } else {
            console.log(`file or directory is not exist: ${input_path}`)
        }
    }

    if (options.generate !== undefined) {
        const lang = Object.keys(langauges).find(l => l.toLowerCase() === options.langauge);
        if (options.langauge !== undefined && lang) {
            const input_path = options.generate;
            if (fs.existsSync(input_path)) {
                if (fs.statSync(input_path).isDirectory()) {
                    console.log(`Loading models from directory...`);
                    fs.readdir(input_path, (err, files) => {
                        files.forEach(file => {
                            if (path.parse(file).ext.toLowerCase() == '.json') {
                                generateModelFile(input_path + '/' + file, options.output, lang);
                            }
                        });
                    });
                } else {
                    generateModelFile(input_path, path.dirname(options.output), lang);
                }
            } else {
                console.log(`file or directory is not exist: ${input_path}`)
            }
        } else {
            console.log('Laguage has to be defined with --langauge or -l.');
            console.log('Laguage must be: ' + Object.keys(langauges).join(', '));
        }
    }
}

function validateModelFile(input_path) {
    console.log(`Validating the model: ${path.basename(input_path)}`)
    fs.readFile(input_path, 'utf8', function (err, data) {
        if (err) {
            console.log(err);
        }
        asml.validateModel(data);
        if (asml.errors !== null) {
            console.log(asml.errors);
            return false;
        } else {
            console.log(`Validated the model: ${path.basename(input_path)}`);
            return true;
        }
    });
}

function generateModelFile(input_path, output_path, lang) {
    console.log(`Validating the model: ${path.basename(input_path)}`)
    fs.readFile(input_path, 'utf8', async function (err, data) {
        if (err) {
            console.log(err);
        }
        asml.validateModel(data);
        if (asml.errors !== null) {
            console.log(asml.errors);
            return false;
        } else {
            const input_pascal_case = toPascalCase(path.parse(input_path).name);
            const output_filepath = `${output_path}/${input_pascal_case}.${langauges[lang]}`;
            console.log(`Validated the model: ${path.basename(input_path)}`);
            console.log(`Generating the interface: ${path.basename(output_filepath)}`);
            const { lines: model } = await quicktypeJSONSchema(lang, input_pascal_case, data);

            fs.writeFile(output_filepath, model.join("\n"), function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log(`Generated the interface: ${output_path}/${path.basename(output_filepath)}`);
            });
            return true;
        }
    });
}

async function quicktypeJSONSchema(targetLanguage, typeName, jsonSchemaString) {
    const schemaInput = new JSONSchemaInput(new JSONSchemaStore());

    await schemaInput.addSource({ name: typeName, schema: jsonSchemaString });

    const inputData = new InputData();
    inputData.addInput(schemaInput);

    return await quicktype({
        inputData,
        lang: targetLanguage,
    });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function toCamelCase(text) {
    return text.replace(/-\w/g, clearAndUpper);
}

function toPascalCase(text) {
    return text.replace(/(^\w|-\w)/g, clearAndUpper);
}

function clearAndUpper(text) {
    return text.replace(/-/, "").toUpperCase();
}