import {Command} from "../types";

export const yarn: Command = {
  subcommands: {
    install: {
      name: 'Type specific packages, or leave empty to install all missing packages',
    },
    'start:web': {name: 'Script from package.json'},
    'start:backend': {name: 'Script from package.json'}
  }
}