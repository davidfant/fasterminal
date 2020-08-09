import * as fs from 'fs';
import * as path from 'path';
import * as ChildProcess from 'child_process';
import * as Bluebird from 'bluebird';
import _ from 'lodash';
import {Command} from '../types';

function exec(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ChildProcess.exec(command, (err, stdout) => !!err ? reject(err) : resolve(stdout));
  });
}

(async () => {
  const gitHelp = await exec('git help -a');
  const subcommandMatches = gitHelp
    .split('\n')
    .map((line) => line.match(/^[ ]+([a-z-]+)[ ]+(.*)$/) as RegExpMatchArray)
    .filter((match) => !!match);
  
  const subcommands: {[key: string]: Command} = _(subcommandMatches)
    .keyBy((match) => match[1])
    .mapValues((match): Command => ({
      name: match[2],
    }))
    .value();

  const command: Command = {
    name: 'The stupid content tracker',
    subcommands,
  };

  fs.writeFileSync(
    path.join(__dirname, '../../src/plugins/git/command.json'),
    JSON.stringify(command, null, 3),
  );

  console.warn(command);
  console.warn(path.join(__dirname, '../plugins/git/command.json'));
})();
