const tinify = require('tinify')
const ArgumentParser = require('argparse').ArgumentParser
const path = require('path')

function tinifyBannerImage(args) {
  const extname = path.extname(args.infile)
  const basename = path.basename(args.infile, extname)

  args.outbfile = `${path.dirname(args.infile)}${path.sep}${basename}.b${extname}`
  console.dir(args)

  tinify.fromFile(args.infile).toFile(args.outbfile)
}

function tinifyTrailsHikedImage(args) {
  const extname = path.extname(args.infile)
  const basename = path.basename(args.infile, extname)

  args.outwfile = `${path.dirname(args.infile)}${path.sep}${basename}.w${extname}`
  args.outmfile = `${path.dirname(args.infile)}${path.sep}${basename}.m${extname}`
  console.dir(args)

  const wresized = tinify.fromFile(args.infile).resize({method: 'scale', width: 1200})
  wresized.toFile(args.outwfile)

  const mresized = tinify.fromFile(args.infile).resize({method: 'scale', width: 300})
  mresized.toFile(args.outmfile)
}

// == MAIN ==
const parser = new ArgumentParser({addHelp: true, description: 'David Hikes a Lot Utils'})
const cmds = parser.addSubparsers({title: 'subcommands', dest: 'cmd'})

const tinyArgs = new ArgumentParser({addHelp: false})
tinyArgs.addArgument('apikey', {help: 'tinypng.com API key from https://tinypng.com/dashboard/api'})

let cmd = cmds.addParser('parks', {aliases: ['p'], dest: 'tinify', parents: [tinyArgs],
  addHelp: true, description: 'Make web/mobile images with tinypng.org',
})
cmd.addArgument('infile', {help: 'Path to TrailsHiked image'})
cmd.setDefaults({func: tinifyTrailsHikedImage})

cmd = cmds.addParser('banner', {aliases: ['b'], dest: 'banner', parents: [tinyArgs],
  addHelp: true, description: 'Make web/mobile images with tinypng.org',
})
cmd.addArgument('infile', {help: 'Path to banner image'})
cmd.setDefaults({func: tinifyBannerImage})

const args = parser.parseArgs()
if (args.apikey) {
  tinify.key = args.apikey
}
args.func(args)
