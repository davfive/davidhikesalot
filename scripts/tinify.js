const tinify = require('tinify')
const ArgumentParser = require('argparse').ArgumentParser;
const path = require('path')

const parser = new ArgumentParser({ version: '0.0.1', addHelp:true, description: 'Tinify pngs (tinypng.com)'})
parser.addArgument('apikey', { help: 'tinypng.com API key from https://tinypng.com/dashboard/api'})
parser.addArgument('infile', { help: 'Path to png to be tinified'})
parser.addArgument(['-b', '--banner'], {action: 'storeTrue', help: 'Just tinify the image, keep scale'})
const args = parser.parseArgs()
tinify.key = args.apikey

const extname = path.extname(args.infile)
const basename = path.basename(args.infile, extname)

if (args.banner) {
  args.outbfile = `${path.dirname(args.infile)}${path.sep}${basename}.b${extname}`
  console.dir(args)

  tinify.fromFile(args.infile).toFile(args.outbfile)
} else {
  args.outwfile = `${path.dirname(args.infile)}${path.sep}${basename}.w${extname}`
  args.outmfile = `${path.dirname(args.infile)}${path.sep}${basename}.m${extname}`
  console.dir(args)

  const wresized = tinify.fromFile(args.infile).resize({method: 'scale', width: 1200})
  wresized.toFile(args.outwfile)

  const mresized = tinify.fromFile(args.infile).resize({method: 'scale', width: 300})
  mresized.toFile(args.outmfile)
}
