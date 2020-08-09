
export interface AutocompleteSuggestion {
  command: string;
  name?: string;
  description?: string;
  fullCommand: string;
}

export type CommandTree = {[key: string]: Command};

export interface CommandFieldOption {
  type: 'field';
  title: string;
  name: string;
  shortname?: string;
  fieldType: 'string' | 'email' | 'number' | 'boolean';
  description?: string;
  required?: boolean;
}

export interface CommandSelectOption {
  type: 'select';
  title: string;
  name: string;
  shortname?: string;
  description?: string;
  required?: boolean;
  multi?: true;
  items: {
    value: string;
    label?: string;
  }[];
}

export type CommandOption = CommandFieldOption | CommandSelectOption;

export interface Command {
  name?: string;
  description?: string;
  options?: CommandOption[];
  subcommands?: CommandTree;
}
