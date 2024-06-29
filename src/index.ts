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
  fileName: string,
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
  const now = new Date().toISOString();
  const finalFileName = `${fileName}-${now}`;
  const { chunk, type } = file[0];

  const writable = fs.createWriteStream(
    `${destination}/${finalFileName}${type}`,
    {
      encoding: 'utf-8',
    },
  );

  writable.write(chunk);
  writable.end();

  await finished(writable);

  console.log(
    `${GREEN}%s${RESET}`,
    `File (${finalFileName}${type}) created at ${destination}`,
  );
};

const fromJSONToCSV = (formerData: any) => {
  try {
    const csv = formerData.map((row: any) => Object.values(row));
    csv.unshift(Object.keys(formerData[0]));
    return csv.join('\n');
  } catch (error) {
    console.error(`${RED}${error}${RESET}`);
  }
};

const fromCSVToJSON = (formerData: any[]) => {
  const formattedData = [];
  const [head, ...body] = formerData;

  const headArray = head.split(',');
  const bodyArray = body.map((element) => element.split(','));

  try {
    const reduceData = (headArr: any[], bodyArr: any[]) =>
      headArr.reduce((prev: any, cur: any, index: number) => {
        return { ...prev, [cur]: bodyArr[index] };
      }, {});

    for (let i = 0; i < bodyArray.length; i++) {
      formattedData.push(reduceData(headArray, bodyArray[i]));
    }
  } catch (error) {
    console.error(`${RED}${error}${RESET}`);
  }

  return JSON.stringify(formattedData);
};

const convertFile = async (from: string, as: string, destination: string) => {
  const fileData: { chunk: any; type: string }[] =
    await getDataFromOriginFile(from);

  if (!fileData || fileData.length === 0)
    throw Error(`${RED}No file data found${RESET}`);

  let convertedFileData = '';

  console.log(`${CYAN}%s${RESET}`, 'Morphing...');

  if (fileData[0].type === '.json') {
    const formerData = JSON.parse(fileData[0].chunk);

    convertedFileData = fromJSONToCSV([formerData]);
  } else if (fileData[0].type === '.csv') {
    const formerData = fileData[0].chunk.toString().split('\n');

    convertedFileData = fromCSVToJSON(formerData);
  }

  const fileName = path.basename(from).split('.')[0];

  createFileAtDestination(
    [{ chunk: convertedFileData, type: as }],
    fileName,
    destination,
  );
};

// const jsonFile = await getDataFromOriginFile('./test-data/origin/dummy1.json');
// const csvFile = await getDataFromOriginFile('./test-data/origin/dummy1.csv');

// createFileAtDestination(jsonFile as [], './test-data/destination');

// convertFile(
//   './test-data/origin/dummy1.json',
//   '.csv',
//   './test-data/destination/converted',
// );
// convertFile(
//   './test-data/origin/people-100.csv',
//   '.json',
//   './test-data/destination/converted',
// );
convertFile(
  './test-data/origin/dummy1.json',
  '.csv',
  './test-data/destination/converted',
);

// setTimeout(() => {
//   convertFile(
//     './test-data/destination/converted/test.csv',
//     '.json',
//     './test-data/destination/converted',
//   );
// }, 1000);

// convertFile(
//   './test-data/destination/converted/test.json',
//   '.csv',
//   './test-data/destination/converted',
// );
