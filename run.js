const yargs = require('yargs');
const spawnSync = require('child_process').spawnSync;
const lighthouseCli = require.resolve('lighthouse/lighthouse-cli');
const {computeMedianRun} = require('lighthouse/lighthouse-core/lib/median-run.js');
// const config = require('lighthouse/lighthouse-core/config/lr-mobile-config.js');
// const desktopConfig = require('lighthouse/lighthouse-core/config/lr-desktop-config.js');

const argv = yargs
    .option('url', {
        alias: 'u',
        description: 'Url to test',
        type: 'string',
    })
    .option('run', {
      alias: 'r',
      description: 'How many mobile runs',
      type: 'number',
      default: 0
    })
    .option('runDesktop', {
        alias: 'rd',
        description: 'How many desktop runs',
        type: 'number',
        default: 0
    })
    .option('html', {
      alias: 'h',
      description: 'Generate default html report',
      type: 'boolean',
      default: true
    })
    .option('maxBuffer', {
      alias: 'b',
      description: 'Set node child_process module max buffer.  Default: 1024 * 1024.',
      type: 'number',
      //default: 1024 * 1024
      default: 1024 * 12000
    })
    .argv;

const results = [];
const resultsDesktop = [];
const lowHigh = [];
const lowHighDesktop = [];

lowHigh[0] = 100;
lowHigh[1] = 0;
lowHighDesktop[0] = 100;
lowHighDesktop[1] = 0;

if (argv.run) {
  run();
}

if (argv.runDesktop) {
  runDesktop();
}

if (argv.html) {
  runHtml();
}

function run() {
  for (let i = 0; i < argv.run; i++) {
    console.log(`Running Lighthouse attempt #${i + 1}...`);
    const {status = -1, stdout, stderr} = spawnSync('node', [
        lighthouseCli,
        argv.url,
        '--output=json', '--config-path=./node_modules/lighthouse/lighthouse-core/config/lr-mobile-config.js'
      ],
      {
        maxBuffer: argv.maxBuffer
      }
    );

    if (status !== 0) {
      console.log(stderr);
      console.log('Lighthouse failed, skipping run...');
      continue;
    }

    let parsed = JSON.parse(stdout);
    console.log('Run score: ' + parsed.categories.performance.score * 100);

    lowHigh[0] = parsed.categories.performance.score < lowHigh[0] ? parsed.categories.performance.score : lowHigh[0];
    lowHigh[1] = parsed.categories.performance.score > lowHigh[1] ? parsed.categories.performance.score : lowHigh[1];
    
    results.push(parsed);
  }
}

function runDesktop() {
  for (let i = 0; i < argv.runDesktop; i++) {
    console.log(`Running Lighthouse attempt #${i + 1}...`);
    const {status = -1, stdout, stderr} = spawnSync('node', [
        lighthouseCli,
        argv.url,
        '--output=json', '--config-path=./node_modules/lighthouse/lighthouse-core/config/lr-desktop-config.js'
      ],
      {
        maxBuffer: argv.maxBuffer
      }
    );

    if (status !== 0) {
      console.log('Lighthouse failed, skipping run...');
      continue;
    }

    let parsed = JSON.parse(stdout);
    console.log('Run score: ' + parsed.categories.performance.score * 100);

    lowHighDesktop[0] = parsed.categories.performance.score < lowHighDesktop[0] ? parsed.categories.performance.score : lowHighDesktop[0];
    lowHighDesktop[1] = parsed.categories.performance.score > lowHighDesktop[1] ? parsed.categories.performance.score : lowHighDesktop[1];
    
    resultsDesktop.push(parsed);
  }
}

function runHtml() {
  console.log(`Running default Lighthouse config for html report...`);
  const {status = -1, stdout, stderr} = spawnSync('node', [
      lighthouseCli,
      argv.url,
      '--output=html'
    ],
    {
      maxBuffer: argv.maxBuffer
    }
  );
}

if (results.length) {
  const median = computeMedianRun(results);

  console.log('Lowest and highest mobile score:', lowHigh[0] * 100 + ' - ' + lowHigh[1] * 100);
  console.log('Median mobile performance score was', median.categories.performance.score * 100);
}

if (resultsDesktop.length) {
  const medianDesktop = computeMedianRun(resultsDesktop);

  console.log('Lowest and highest desktop score:', lowHighDesktop[0] + ' - ' + lowHighDesktop[1]);
  console.log('Median desktop performance score was', medianDesktop.categories.performance.score * 100);
}

if (argv.html) {
  console.log('Report generated to `./<HOST>_<DATE>.report.html`');
}
