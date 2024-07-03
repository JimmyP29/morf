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

enum FileType {
  JSON = '.json',
  CSV = '.csv',
}

const getDataFromOriginFile = async (
  pathToFile: string,
): Promise<Array<{ chunk: any; type: FileType }>> => {
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
  file: { chunk: any; type: FileType }[],
  fileName: string,
  destination: string,
): Promise<void> => {
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

const fromJSONToCSV = (formerData: any): string => {
  let csv;
  try {
    csv = formerData.map((row: any) => Object.values(row));

    csv.unshift(Object.keys(formerData[0]));
  } catch (error) {
    console.error(`${RED}${error}${RESET}`);
  }
  return csv.join('\n');
};

const fromCSVToJSON = (formerData: any[]): string => {
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

    console.table(formattedData);
  } catch (error) {
    console.error(`${RED}${error}${RESET}`);
  }

  return JSON.stringify(formattedData);
};

const convertFile = async (
  from: string,
  convertTo: FileType,
  destination: string,
): Promise<void> => {
  const fileData: { chunk: any; type: FileType }[] =
    await getDataFromOriginFile(from);

  if (!fileData || fileData.length === 0)
    throw Error(`${RED}No file data found${RESET}`);

  const ext = `.${path.basename(from).split('.')[1]}`;

  if (ext === convertTo.toString())
    throw Error(
      `${RED}Origin file type of ${ext} cannot be the same as the intended conversion type ${convertTo} - Use createFileAtDestination() instead.${RESET}`,
    );

  console.log(`${CYAN}%s${RESET}`, 'Morphing...');

  let convertedFileData = '';

  if (fileData[0].type === FileType.JSON) {
    const formerData = JSON.parse(fileData[0].chunk);

    convertedFileData = fromJSONToCSV([formerData]);
  } else if (fileData[0].type === FileType.CSV) {
    const formerData = fileData[0].chunk.toString().split('\n');

    convertedFileData = fromCSVToJSON(formerData);
  }

  const fileName = path.basename(from).split('.')[0];

  createFileAtDestination(
    [{ chunk: convertedFileData, type: convertTo }],
    fileName,
    destination,
  );
};

const aggregateJSONToCSV = (from: string[], destinantion: string) => {};

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
  './test-data/origin/dummy1.csv',
  FileType.JSON,
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
