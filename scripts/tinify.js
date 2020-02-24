const tinify = require('tinify')
const ArgumentParser = require('argparse').ArgumentParser;
const path = require('path')

const parser = new ArgumentParser({ version: '0.0.1', addHelp:true, description: 'Tinify pngs (tinypng.com)'})
parser.addArgument('apikey', { help: 'tinypng.com API key from https://tinypng.com/dashboard/api'})
parser.addArgument('infile', { help: 'Path to png to be tinified'})
const args = parser.parseArgs()
args.outfile = `${path.dirname(args.infile)}${path.sep}${path.basename(args.infile, '.png')}.m.png`
console.dir(args)

tinify.key = args.apikey
const resized = tinify.fromFile(args.infile).resize({method: 'scale', width: 300})
resized.toFile(args.outfile)