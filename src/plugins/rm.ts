import {Command} from "../types";

export const rm: Command = {
  name: 'Remove files and folders',
  options: [{
    type: 'field',
    fieldType: 'boolean',
    title: 'Force remove ⚠️',
    name: 'f',
    shortname: 'f',
  }, {
    type: 'field',
    fieldType: 'boolean',
    title: 'Recursive (for folders)',
    name: 'r',
    shortname: 'r',
  }, {
    type: 'select',
    title: 'Select files and folders to remove',
    name: '',
    multi: true,
    items: [
      {value: 'node_modules'},
      {value: 'package.json'},
      {value: 'src'}
    ]
  }]
};