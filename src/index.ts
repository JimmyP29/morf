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

console.log(`${CYAN}%s${RESET}`, 'Starting...');

const getDataFromOriginFile = async (
  pathToFile: string,
): Promise<Array<{ chunk: any; type: string }>> => {
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

const fromJSONToCSV = (json: any) => {
  try {
    const csv = json.map((row: any) => Object.values(row));
    csv.unshift(Object.keys(json[0]));
    return csv.join('\n');
  } catch (error) {
    console.error(`${RED}${error}${RESET}`);
  }
};

const convertFile = async (from: string, as: string, destination: string) => {
  const fileData: { chunk: any; type: string }[] =
    await getDataFromOriginFile(from);

  if (!fileData || fileData.length === 0)
    throw Error(`${RED}No file data found${RESET}`);

  let convertedFileData = null;

  if (fileData[0].type === '.json') {
    const json = JSON.parse(fileData[0].chunk);

    console.log('FILE DATA: ', json);

    if (as === '.csv') {
      convertedFileData = fromJSONToCSV([json]);
      console.log(`${CYAN}%s${RESET}`, 'Morphing...');
      createFileAtDestination(
        [{ chunk: convertedFileData, type: '.csv' }],
        destination,
      );
    }
  }
};

// const jsonFile = await getDataFromOriginFile('./test-data/origin/dummy1.json');
// const csvFile = await getDataFromOriginFile('./test-data/origin/dummy1.csv');

// createFileAtDestination(jsonFile as [], './test-data/destination');

convertFile(
  './test-data/origin/dummy1.json',
  '.csv',
  './test-data/destination/converted',
);
