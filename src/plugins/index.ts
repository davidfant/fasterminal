import _ from 'lodash';
import * as gitOverrides from './git';
import {yarn} from './yarn';
import {dockerCompose} from './docker-compose';
import {CommandTree} from '../types';

export const commandTree: CommandTree = {
  yarn,
  git: _.merge(require('./git/command.json'), {subcommands: gitOverrides}),
  'docker-compose': dockerCompose,
};
