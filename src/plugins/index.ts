import _ from 'lodash';
import * as gitOverrides from './git';
import {yarn} from './yarn';
import {rm} from './rm';
import {dockerCompose} from './docker-compose';
import {CommandTree} from '../types';
import git from './git/command.json';
// const git = require('./git/commands.json');

Object.keys(gitOverrides).map((key) => {
  // @ts-ignore
  Object.assign(git.subcommands[key], gitOverrides[key]);
})


export const commandTree: CommandTree = {
  yarn,
  rm,
  git,
  'docker-compose': dockerCompose,
};
