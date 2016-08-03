#!/usr/bin/env node

const path = require('path');
const CmdLine = require('cmdline');
const cluster = require('cluster');
const pkg = require('../package.json');
const os = require('os');
const fs = require('fs');
const console = require('console3');
const stp = require('stp');
const cmdline = require('cmdline');

cmdline.NAME = pkg.name;
cmdline.VERSION = pkg.version;
cmdline.CONFIG_FILE_NAME = `${pkg.name}file.js`;
cmdline.CONFIG_FILE_REGEXP = /\.js$/i;

if (cluster.isMaster) {
  cmdline.HELP_INFO = stp(fs.readFileSync(path.normalize(`${__dirname}/help.txt`)).toString(), {
    cmd: cmdline.NAME,
    conf: cmdline.CONFIG_FILE_NAME
  }) + os.EOL;
}

cmdline
  .error(function (err) {
    console.error(err.message);
  })
  .version(`${cmdline.NAME.toUpperCase()} ${cmdline.VERSION}${os.EOL}`)
  .help(cmdline.HELP_INFO)
  .option(['-w', '--worker'], { type: 'number' })
  .option(['-p', '--port'], { type: 'number' })
  .option(['-s', '--secret'], { type: 'string' })
  .option(['-m', '--mode'], { type: 'string' })
  .option('--project', { type: 'string' })
  .option('--job', { type: 'string' })
  .option('--params', { type: 'string' })
  .handle(function ($0) {
    //计算 confPath
    cmdline.configFile = path.resolve(process.cwd(), $0 || './');
    if (!cmdline.CONFIG_FILE_REGEXP.test(cmdline.configFile)) {
      cmdline.configFile = path.normalize(`${cmdline.configFile}/${cmdline.CONFIG_FILE_NAME}`);
    }
  })
  .handle({ options: ['--project', '--job'] }, function (project, job) {
    console.log(project, job);
    require('./invoker')(cmdline);
    return false;
  })
  .handle(function () {
    require(cluster.isMaster ? './master' : './worker')(cmdline);
    return false;
  })
  .ready();