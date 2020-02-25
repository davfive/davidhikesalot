const tinify = require('tinify')
const ArgumentParser = require('argparse').ArgumentParser;
const path = require('path')

const parser = new ArgumentParser({ version: '0.0.1', addHelp:true, description: 'Tinify pngs (tinypng.com)'})
parser.addArgument('apikey', { help: 'tinypng.com API key from https://tinypng.com/dashboard/api'})
parser.addArgument('infile', { help: 'Path to png to be tinified'})
const args = parser.parseArgs()
args.outwfile = `${path.dirname(args.infile)}${path.sep}${path.basename(args.infile, '.png')}.w.png`
args.outmfile = `${path.dirname(args.infile)}${path.sep}${path.basename(args.infile, '.png')}.m.png`
console.dir(args)

tinify.key = args.apikey
const wresized = tinify.fromFile(args.infile).resize({method: 'scale', width: 1200})
wresized.toFile(args.outwfile)

const mresized = tinify.fromFile(args.infile).resize({method: 'scale', width: 300})
mresized.toFile(args.outmfile)