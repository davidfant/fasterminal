
import {git} from './git';
import {yarn} from './yarn';
import {dockerCompose} from './docker-compose';
import {CommandTree} from '../types';

export const commandTree: CommandTree = {
  git,
  yarn,
  'docker-compose': dockerCompose,
};
