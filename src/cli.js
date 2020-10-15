import arg from 'arg';

function parseArgToOpt(rawArgs) {
    const args = arg({
        '--validate': git,
        '--generate': String,
        '-v': '--validate',
        '-g': '--generate'
    }, {
        argv: rawArgs.slice(2)
    })
    return {
        generate: args['--generate'],
        validate: args['--validate']
    }
}
export function cli(args) {
    let options = parseArgToOpt(args);
    console.log(options);
}