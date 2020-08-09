import React, {FC, ReactNode, KeyboardEvent, useState, useCallback, useContext, useEffect, useMemo} from 'react';
import * as _ from 'lodash';
import { Popover, Dropdown, Container, FormGroup, ControlLabel, HelpBlock, FormControl, Form, CheckPicker, Toggle } from 'rsuite';
import {TerminalInput} from './components/TerminalInput';
import {TerminalOutput} from './components/TerminalOutput';
import {SuggestionItem} from './components/TerminalInput/suggestion';
import {ShellContext} from './client/shellContext';
import {useStackoverflowSearch} from './plugins/stackoverflow';
import {AutocompleteSuggestion} from './types';

type CommandTree = {[key: string]: Command};

interface CommandFieldOption {
  type: 'field';
  title: string;
  name: string;
  shortname?: string;
  fieldType: 'string' | 'email' | 'number' | 'boolean';
  description?: string;
  required?: boolean;
}

interface CommandSelectOption {
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

type CommandOption = CommandFieldOption | CommandSelectOption;

interface Command {
  name?: string;
  description?: string;
  options?: CommandOption[];
  subcommands?: CommandTree;
}

const commandTree: {[key: string]: Command} = {
  git: {
    name: 'the stupid content tracker',
    description: `Git is a fast, scalable, distributed revision control system with an
    unusually rich command set that provides both high-level operations and
    full access to internals.

    See gittutorial(7) to get started, then see giteveryday(7) for a useful
    minimum set of commands. The Git User's Manual[1] has a more in-depth
    introduction.

    After you mastered the basic concepts, you can come back to this page
    to learn what commands Git offers. You can learn more about individual
    Git commands with "git help command". gitcli(7) manual page gives you
    an overview of the command-line command syntax.

    A formatted and hyperlinked copy of the latest Git documentation can be
    viewed at https://git.github.io/htmldocs/git.html or
    https://git-scm.com/docs.`,
    subcommands: {
      commit: {
        name: 'Commit changes',
        options: [{
          type: 'field',
          name: 'message',
          shortname: 'm',
          fieldType: 'string',
          title: 'Message',
          description: 'Describe your changes',
          required: true,
        }],
      },
      stash: {
        name: 'Stash the current changes',
        description: `Use git stash when you want to record the current state of the
  working directory and the index, but want to go back to a clean
  working directory. The command saves your local modifications away
  and reverts the working directory to match the HEAD commit.`,
        subcommands: {
          list: {
            name: 'List recent stashes',
          }
        }
      },
      push: {},
      pull: {}
    }
  },
  'docker-compose': {
    name: 'Define and run multi-container applications with Docker.',
    subcommands: {
      build: {name: 'Build or rebuild services'},
      config: {name: 'Validate and view the Compose file'},
      create: {name: 'Create services'},
      down: {name: 'Stop and remove containers, networks, images, and volumes'},
      events: {name: 'Receive real time events from containers'},
      exec: {name: 'Execute a command in a running container'},
      help: {name: 'Get help on a command'},
      images: {name: 'List images'},
      kill: {name: 'Kill containers'},
      logs: {
        name: 'View output from containers',
        options: [{
          type: 'field',
          title: 'Tail logs',
          name: 'follow',
          shortname: 'f',
          fieldType: 'boolean',
        }, {
          type: 'select',
          title: 'Select Containers (leave empty to show all)',
          name: '',
          multi: true,
          items: [
            {value: 'core-api'},
            {value: 'frontend'},
            {value: 'legacy-api'},
            {value: 'elasticsearch'},
          ]
        }]
      },
      pause: {name: 'Pause services'},
      port: {name: 'Print the public port for a port binding'},
      ps: {name: 'List containers'},
      pull: {name: 'Pull service images'},
      push: {name: 'Push service images'},
      restart: {name: 'Restart services'},
      rm: {name: 'Remove stopped containers'},
      run: {name: 'Run a one-off command'},
      scale: {name: 'Set number of containers for a service'},
      start: {name: 'Start services'},
      stop: {name: 'Stop services'},
      top: {name: 'Display the running processes'},
      unpause: {name: 'Unpause services'},
      up: {name: 'Create and start containers'},
      version: {name: 'Show the Docker-Compose version information'},
    }
  },
  yarn: {
    subcommands: {
      install: {
        name: 'Type specific packages, or leave empty to install all missing packages',
      },
      'start:web': {name: 'Script from package.json'},
      'start:backend': {name: 'Script from package.json'}
    }
  }
};

function findCommandLeafRecursive(command: string, tree: CommandTree = commandTree): Command | undefined {
  const parts = command.split(' ').filter((p) => !!p);
  const subtree = tree[parts[0]];
  if (!!subtree) {
    if (parts.length === 1) return subtree;
    if (!!subtree.subcommands) {
      return findCommandLeafRecursive(parts.slice(1).join(' '), subtree.subcommands);
    }
  }

  return undefined;
}

function useSubcommandSuggestions(fullCommand: string): AutocompleteSuggestion[] {
  const commandTreeLeaf = findCommandLeafRecursive(fullCommand);

  if (!commandTreeLeaf?.subcommands) return [];
  return Object.keys(commandTreeLeaf.subcommands).map((subcommand) => ({
    command: subcommand,
    name: commandTreeLeaf.subcommands?.[subcommand].name,
    description: commandTreeLeaf.subcommands?.[subcommand].description,
    fullCommand: [fullCommand, subcommand, ''].map((c) => c.trim()).join(' ')
  }));
}

function useCommandAutocomplete(fullCommand: string): AutocompleteSuggestion[] {
  if (!fullCommand.trim().length) return [];
  const commandParts = fullCommand.trim().split(' ');
  const commandWithoutLastPart = commandParts.slice(0, commandParts.length - 1).join(' ');
  const commandLastPart = commandParts[commandParts.length - 1];

  const subcommands = !!commandWithoutLastPart
    ? findCommandLeafRecursive(commandWithoutLastPart)?.subcommands
    : commandTree;
  if (!subcommands) return [];
  return Object
    .keys(subcommands)
    .filter((subcommand) => !commandLastPart || subcommand.startsWith(commandLastPart) && subcommand !== commandLastPart)
    .map((subcommand) => ({
      command: subcommand,
      name: subcommands?.[subcommand].name,
      description: subcommands?.[subcommand].description,
      fullCommand: (!!commandWithoutLastPart ? [commandWithoutLastPart, subcommand, ''] : [subcommand, '']).join(' ')
    }));
}

function useCurrentCommand(fullCommand: string): Command | undefined {
  return findCommandLeafRecursive(fullCommand);
}
function useCommandOptionsForm(options: CommandOption[] | undefined): {
  string: string | undefined;
  component: ReactNode;
  onChange(formValues: object): void
} {
  const [formValues, setFormValues] = useState<{[key: string]: any}>({});

  const component = useMemo((): ReactNode => {
    return options?.map((option) => (
      <FormGroup>
        <ControlLabel>{option.title}</ControlLabel>
        {(() => {
          if (option.type === 'select') {
            /*
            const ItemComponent = option.multi ? Checkbox : Radio;
            const GroupComponent = option.multi ? CheckboxGroup : RadioGroup;
            return (
              <FormControl name={option.name} accepter={GroupComponent} inline>
                {option.items.map(({value, label}) => (
                  <ItemComponent value={value}>{value || label}</ItemComponent>
                ))}
              </FormControl>
            );
            */
           
            return (
              <FormControl
                name={option.name}
                accepter={CheckPicker}
                placement="topStart"
                data={option.items.map(({value, label}) => ({value, label: label || value}))}
              />
            );
          }

          if (option.type === 'field') {
            if (option.fieldType === 'boolean') {
              return <FormControl name={option.name} accepter={Toggle} />;
            }
          }


          return <FormControl name={option.name} type={option.type} />;
        })()}
        {option.required && <HelpBlock tooltip>Required</HelpBlock>}
      </FormGroup>
    ));
  }, [options]);

  return {
    string: !options ? undefined : options
      .filter((option) => formValues[option.name] !== undefined)
      .map((option) => {
        if (option.type === 'field') {
          if (option.fieldType === 'number') return `--${option.name} ${formValues[option.name]}`;
          if (option.fieldType === 'boolean') {
            return formValues[option.name] ? `--${option.name}` : undefined;
          }
          return `--${option.name} "${formValues[option.name]}"`;
        }

        if (option.type === 'select') {
          const items: any[] = formValues[option.name];
          return items.map((item) => !!option.name ? `--${option.name} "${item}"` : item).join(' ');
        }

        return undefined;
      })
      .filter((value) => !!value)
      .join(' '),
    component,
    onChange: setFormValues,
  }
}

const App: FC = () => {
  const [command, setCommand] = useState('');
  const {runCommand} = useContext(ShellContext);

  const subcommandSuggestions = useSubcommandSuggestions(command);
  const commandAutocompleteSuggestions = useCommandAutocomplete(command);
  const suggestions = [...subcommandSuggestions, ...commandAutocompleteSuggestions];

  const [selectedSuggestion, setSelectedSuggestion] = useState<AutocompleteSuggestion | undefined>(suggestions[0]);

  const currentCommand = useCurrentCommand(command);
  const stackoverflowSearch = useStackoverflowSearch(command, !suggestions.length && !currentCommand?.options);

  const selectSuggestion = useCallback((suggestion: AutocompleteSuggestion) => {
    // whisperRef.current?.hide();
    setCommand(suggestion.fullCommand);
    // TODO(fant): refocus input
  }, []);

  const selectNextSuggestion = useCallback(() => {
    const index = suggestions.findIndex((s) => s.fullCommand === selectedSuggestion?.fullCommand);
    const nextIndex = (index + 1 + suggestions.length) % suggestions.length;
    setSelectedSuggestion(suggestions[nextIndex]);
  }, [suggestions, selectedSuggestion]);

  const selectPrevSuggestion = useCallback(() => {
    const index = suggestions.findIndex((s) => s.fullCommand === selectedSuggestion?.fullCommand);
    if (index === -1) {
      setSelectedSuggestion(suggestions[suggestions.length - 1]);
      return;
    }
    const nextIndex = (index - 1 + suggestions.length) % suggestions.length;
    setSelectedSuggestion(suggestions[nextIndex]);
  }, [suggestions, selectedSuggestion]);

  useEffect(() => {
    if (!selectedSuggestion || !suggestions.find((s) => s.fullCommand === selectedSuggestion.fullCommand)) {
      setSelectedSuggestion(suggestions[0]);
    }

    /*
    if (!!selectedSuggestion && !suggestions.find((s) => s.fullCommand === selectedSuggestion.fullCommand)) {
      setSelectedSuggestion(undefined);
    }
    */
  }, [selectedSuggestion, suggestions]);

  const optionsForm = useCommandOptionsForm(currentCommand?.options);

  const autocomplete = (() => {
    if (!!selectedSuggestion) return selectedSuggestion.fullCommand;
    if (!!optionsForm) return [command.trimEnd(), optionsForm.string].join(' ');
    return undefined;
  })();

  const selectAutocomplete = useCallback(() => {
    if (!!autocomplete) {
      setCommand(autocomplete);
    }
  }, [autocomplete]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    console.warn(event.nativeEvent.key);

    if (event.nativeEvent.key === 'ArrowUp') {
      selectPrevSuggestion();
      event.preventDefault();
    } else if (event.nativeEvent.key === 'ArrowDown') {
      selectNextSuggestion();
      event.preventDefault();
    } else if (event.nativeEvent.key === 'Escape') {
      setSelectedSuggestion(undefined);
      event.preventDefault();
    } else if (event.nativeEvent.key === 'Tab') {
      selectAutocomplete();
      /*
      if (!!selectedSuggestion) {
      } else if (!!suggestions.length) {
        setSelectedSuggestion(suggestions[0]);
      }
      */
      event.preventDefault();
    } else if (event.nativeEvent.key === 'Enter') {
      /*
      if (!!selectedSuggestion) {
        selectSuggestion(selectedSuggestion);
        event.preventDefault();
      } else if (!event.shiftKey) {
        */
        runCommand(command);
        setCommand('');
        event.preventDefault();
      // }
    }
  }, [selectPrevSuggestion, selectNextSuggestion, selectAutocomplete, runCommand, command]);

  return (
    <Container style={{height: '100vh', display: 'flex'}}>
      <div style={{flex: 1, overflow: 'hidden', padding: 8}}>
        <TerminalOutput/>
      </div>
      <div style={{padding: 8}}>
        <div style={{position: 'relative'}}>
          <Popover
            full
            visible
            style={{top: 'unset', bottom: 'calc(100% + 8px)', maxHeight: 290, overflow: 'scroll'}}
          >
            {!!currentCommand?.options && (
              <Form onChange={optionsForm.onChange}>
                {optionsForm.component}
              </Form>
            )}

            {!!suggestions.length && (
              <Dropdown.Menu onSelect={selectSuggestion}>
                {suggestions.map((suggestion) => (
                  <SuggestionItem
                    key={suggestion.fullCommand}
                    suggestion={suggestion}
                    selected={suggestion.fullCommand === selectedSuggestion?.fullCommand}
                  />
                ))}
              </Dropdown.Menu>
            )}

            {stackoverflowSearch.component}
          </Popover>
          <TerminalInput
            autoFocus
            value={command}
            autocomplete={autocomplete}
            onChange={setCommand}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    </Container>
  );
}

export default App;
