#!/usr/bin/env node
import { Command } from 'commander';
const program = new Command();

program
  .name('Morf')
  .description('CLI to convert files from one thing into another.')
  .version('1.0.0');
// program
//   .version('1.0.0')
//   .description('morf')
//   .option('-n, --name <type>', 'Add your name')
//   .action((options) => {
//     console.log(`Hey ${options.name}`);
//   });
program
  .command('from')
  .description('Convert file at given path to new file type.')
  .argument('<string>', 'Path to existing file')
  .option('--to', 'Blah')
  .option('-s, --separator <char>', 'separator character', ',')
  .action((str, options) => {
    const limit = options.first ? 1 : undefined;
    console.log(str.split(options.separator, limit));
  });

// program
//   .argument('<string>') // 'Starting file and location path'
//   .action((path: string) => {
//     console.log('PATH: ', path);
//   })
//   .description('The path to the starting file');

program.parse(process.argv);
