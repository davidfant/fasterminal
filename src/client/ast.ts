// @ts-ignore
import parseBash from 'bash-parser';
import {CommandOption} from '../types';
import {commit} from '../plugins/git';

type OptionValue = string | number | boolean | string[];

interface ASTCommandNode {
  type: 'command';
  command: string;
}

interface ASTOptionNode {
  type: 'option';
  name?: string;
  shortname?: string;
  value: OptionValue;
}

interface ASTOptionGroupNode {
  type: 'optionGroup';
  options: ASTOptionNode[];
}

interface ASTScriptNode {
  type: 'script';
  commands: ASTScriptNodes[];
}

type ASTScriptNodes = ASTCommandNode | ASTOptionNode | ASTOptionGroupNode;
export type ASTNode = ASTCommandNode | ASTOptionNode | ASTOptionGroupNode | ASTScriptNode;

function isOption(part: string): boolean {
  return part.startsWith('-');
}

const byShortname = (shortname: string) => (option: CommandOption): boolean => option.shortname === shortname;
const byName = (name: string) => (option: CommandOption): boolean => option.name === name;

function parseOptionValue(parts: string[], option: CommandOption): {
  value: OptionValue;
  partsCount: number;
} | undefined {
  if (option.type === 'select') {
    let value: string[] = [];
    let partsIndex = 0;
    for (; partsIndex < parts.length; partsIndex++) {
      const part = parts[partsIndex];
      if (isOption(part)) break;
      value.push(part);
    }

    return {value, partsCount: partsIndex + 1};
  }

  if (option.type === 'field') {
    if (option.fieldType === 'boolean') {
      return {value: true, partsCount: 0};
    }
    if (option.fieldType === 'number' && !!parts.length) {
      return {value: Number(parts[0]), partsCount: 1};
    }
    if (option.fieldType === 'string' && !!parts.length)
    return {value: parts[0], partsCount: 1};
  }

  return undefined;
}

function parseOption(option: CommandOption, parts: string[]): {
  option: ASTOptionNode;
  partsCount: number;
} | undefined {
  const parsed = parseOptionValue(parts, option);
  if (!parsed) return undefined;
  return {
    option: {
      value: parsed.value,
      type: 'option',
      name: option.name,
      shortname: option.shortname,
    },
    partsCount: parsed.partsCount,
  };
}

export function parse(
  commandString: string,
  options?: CommandOption[] | undefined
): ASTNode[] {
  const parsed = parseBash(commandString, {mode: 'bash'});
  if (!parsed) throw new Error(`Cannot parse command: "${commandString}"`);

  return parsed.commands.map((command: any): ASTScriptNode => {
    const nodes: ASTScriptNodes[] = [];
    nodes.push({
      type: 'command',
      command: command.name.text
    });

    const parts: string[] = command.suffix.map((p: any) => p.text);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith('--')) {
        const name = part.slice(2);
        const option = options?.find(byName(name));
        if (!option) continue;
        const parsed = parseOption(option, parts.slice(i + 1));
        if (!!parsed) {
          i += parsed.partsCount;
          nodes.push(parsed.option);
        }
      } else if (part.startsWith('-')) {
        const shortnames = part.slice(1).split('');
        nodes.push({
          type: 'optionGroup',
          options: shortnames
            .map((shortname, index): ASTOptionNode | undefined => {
              const option = options?.find(byShortname(shortname));
              if (!option) return undefined;

              if (index !== shortnames.length - 1) return parseOption(option, [])?.option;
              const parsed = parseOption(option, parts.slice(i + 1));
              if (!!parsed) i += parsed.partsCount;
              return parsed?.option;
            })
            .filter((option) => !!option) as ASTOptionNode[],
        });
      } else {
        nodes.push({
          type: 'command',
          command: part
        });
      }
    }

    return {type: 'script', commands: nodes};
  });
}

function optionValueToString(option: ASTOptionNode): string | undefined {
  if (option.value instanceof Array) {
    return option.value.map(String).join(' ');
  } else if (typeof option.value === 'number') {
    return String(option.value);
  } else if (typeof option.value === 'boolean') {
    return undefined;
  } else {
    return `"${option.value}"`;
  }

}

export function toString(nodes: ASTNode[]): string {
  return nodes.map((node): string => {
    let string = '';
    switch (node.type) {
      case 'script':
        string += toString(node.commands);
        break;
      case 'command':
        string += !!string ? ` ${node.command}`: node.command;
        break;
      case 'optionGroup':
        string += '-';
        node.options.forEach((option, index) => {
          string += option.shortname;
          if (index === node.options.length - 1) {
            const valueAsString = optionValueToString(option);
            if (!!valueAsString) string += ` ${valueAsString}`;
          }
        });
        break;
      case 'option':
        string += `--${node.name}`;
        const valueAsString = optionValueToString(node);
        if (!!valueAsString) string += ` ${valueAsString}`;
        break;
    }

    return string;
  })
    .join(' ');
}

/*
const res1 = parse('git commit -am "wow amaze"', commit.options);
console.warn(JSON.stringify(res1, null, 3));
console.warn(toString(res1));
const res2 = parse('git commit --message "wow amaze"', commit.options);
console.warn(JSON.stringify(res2, null, 3));
*/
