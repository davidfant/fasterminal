import {Command} from "../types";

export const git: Command = {
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
};
