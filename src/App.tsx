import React, {FC, ReactNode, KeyboardEvent, useState, useCallback, useContext, useEffect, useMemo} from 'react';
import * as _ from 'lodash';
import { Popover, Dropdown, Container, FormGroup, ControlLabel, HelpBlock, FormControl, Form, CheckPicker, Toggle } from 'rsuite';
import {TerminalInput} from './components/TerminalInput';
import {TerminalOutput} from './components/TerminalOutput';
import {SuggestionItem} from './components/TerminalInput/suggestion';
import {ShellContext} from './client/shellContext';
import {useStackoverflowSearch} from './plugins/stackoverflow';
import {AutocompleteSuggestion, Command, CommandTree, CommandOption} from './types';
import {commandTree} from './plugins';
import {ASTNode, ASTCommandNode, parse as parseCommandToAST, toString as convertASTToString} from './client/ast';

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

function useSubcommandSuggestions(ast: ASTNode[]): AutocompleteSuggestion[] {
  const path = ast
    .filter((node) => node.type === 'command')
    .map((node) => (node as ASTCommandNode).command)
    .join('.');
  
  const command = _.get(commandTree, path);
  if (!command?.subcommands) return [];
  return Object.keys(command.subcommands).map((subcommand) => ({
    command: subcommand,
    name: command.subcommands?.[subcommand].name,
    description: command.subcommands?.[subcommand].description,
    fullCommand: convertASTToString([
      ...ast,
      {type: 'command', command: subcommand},
    ]),
  }));

  
  
/*
  const commandTreeLeaf = findCommandLeafRecursive(fullCommand);

  if (!commandTreeLeaf?.subcommands) return [];
  return Object.keys(commandTreeLeaf.subcommands).map((subcommand) => ({
    command: subcommand,
    name: commandTreeLeaf.subcommands?.[subcommand].name,
    description: commandTreeLeaf.subcommands?.[subcommand].description,
    fullCommand: [fullCommand, subcommand, ''].map((c) => c.trim()).join(' ')
  }));
  */
}

function useCommandAutocomplete(fullCommand: string): AutocompleteSuggestion[] {
  if (!fullCommand.trim().length) return [];
  const commandParts = fullCommand.split(' ');
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
  useEffect(() => {
    if (!options) setFormValues({});
  }, [options]);

  const component = useMemo((): ReactNode => {
    return options?.map((option, index) => (
      <FormGroup key={index} style={{marginBottom: 8}}>
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
        const pre = option.name === option.shortname ? `-${option.shortname}` : `--${option.name}`;
        if (option.type === 'field') {
          if (option.fieldType === 'number') return `${pre} ${formValues[option.name]}`;
          if (option.fieldType === 'boolean') {
            return formValues[option.name] ? pre : undefined;
          }

          return `${pre} "${formValues[option.name]}"`;
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

  const ast = useMemo<ASTNode[]>(() => {
    try {
      const ast = parseCommandToAST(command);
      if (ast[0].type === 'script') return ast[0].commands;
      return [];
    } catch (error) {
      return [];
    }
  }, [command]);
  const subcommandSuggestions = useSubcommandSuggestions(ast);
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
              <Form style={{padding: 8}} onChange={optionsForm.onChange}>
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
