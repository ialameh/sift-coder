#!/usr/bin/env node
'use strict';
// sift-compress — CLI entry. Dispatches subcommands.

const subcommands = {
  doctor: () => require('./doctor'),
  codegen: () => require('./codegen'),
  compress: () => require('./compress'),
};

function usage() {
  console.error('usage: sift-compress <command>');
  console.error('commands:');
  for (const k of Object.keys(subcommands)) console.error('  ' + k);
  process.exit(2);
}

const [cmd, ...rest] = process.argv.slice(2);
if (!cmd || !(cmd in subcommands)) usage();
// Subcommands read from process.argv.slice(2); strip our own dispatch token.
process.argv = [process.argv[0], process.argv[1], ...rest];
subcommands[cmd]();
