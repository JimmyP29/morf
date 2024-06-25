#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import util from 'util';
import stream from 'stream';

const finished = util.promisify(stream.finished);

console.log('Working...');

const getDataFromOriginFile = async (pathToFile: string) => {
  const ext = path.extname(pathToFile);

  if (!ext) throw Error('Please provide a valid file (.json or .csv)');

  return new Promise((resolve) => {
    const chunks: any = [];
    fs.createReadStream(pathToFile, 'utf-8')
      .on('error', (err) => {
        console.error('ERROR: ', err);
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
  if (!file || file.length === 0) throw Error('No file found');

  try {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination);
      const folder = path.basename(destination);
      const parentFolder = path.dirname(destination);
      console.log(`New folder - '${folder}' created at ${parentFolder}`);
    }
  } catch (error) {
    console.error(error);
  }

  const { chunk, type } = file[0];

  const writable = fs.createWriteStream(`${destination}/test${type}`, {
    encoding: 'utf-8',
  });

  writable.write(chunk);
  writable.end();

  await finished(writable);

  console.log(`File (test${type}) created at ${destination}`);
};

const jsonFile = await getDataFromOriginFile('./test-data/origin/dummy1.json');
const csvFile = await getDataFromOriginFile('./test-data/origin/dummy1.csv');

createFileAtDestination(jsonFile as [], './test-data/destination');
