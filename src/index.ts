#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import util from 'util';
import stream from 'stream';

const finished = util.promisify(stream.finished);

// ANSI escape codes for text color
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

console.log(`${CYAN}%s${RESET}`, 'Working...');

const getDataFromOriginFile = async (pathToFile: string) => {
  const ext = path.extname(pathToFile);

  if (!ext)
    throw Error(`${RED}Please provide a valid file (.json or .csv)${RESET}`);

  return new Promise((resolve) => {
    const chunks: any = [];
    fs.createReadStream(pathToFile, 'utf-8')
      .on('error', (err) => {
        console.error(`${RED}%s${RESET}`, err);
      })
      .on('data', (chunk) => {
        chunks.push({ chunk: chunk, type: ext });
      })
      .on('end', () => {
        resolve(chunks);
      });
  });
};

const createFileAtDestination = async (
  file: { chunk: any; type: string }[],
  destination: string,
) => {
  if (!file || file.length === 0) throw Error(`${RED}No file found${RESET}`);

  try {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination);
      const folder = path.basename(destination);
      const parentFolder = path.dirname(destination);
      console.log(
        `${GREEN}%s${RESET}`,
        `New folder - '${folder}' created at ${parentFolder}`,
      );
    }
  } catch (error) {
    console.error(`${RED}%s${RESET}`, error);
  }

  const { chunk, type } = file[0];

  const writable = fs.createWriteStream(`${destination}/test${type}`, {
    encoding: 'utf-8',
  });

  writable.write(chunk);
  writable.end();

  await finished(writable);

  console.log(
    `${GREEN}%s${RESET}`,
    `File (test${type}) created at ${destination}`,
  );
};

const jsonFile = await getDataFromOriginFile('./test-data/origin/dummy1.json');
const csvFile = await getDataFromOriginFile('./test-data/origin/dummy1.csv');

createFileAtDestination(jsonFile as [], './test-data/destination');
