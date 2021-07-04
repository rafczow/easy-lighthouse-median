const yargs = require('yargs');
const { hideBin } = require('yargs/helpers')

const spawnSync = require('child_process').spawnSync;
const lighthouseCli = require.resolve('lighthouse/lighthouse-cli');
const { computeMedianRun } = require('lighthouse/lighthouse-core/lib/median-run.js');

const argv = yargs(hideBin(process.argv))
  .command('run <url>', 'run lightouse cli and compute median', (yargs) => {
    return yargs
      .positional('url', {
        describe: 'Url for which lightouse will run',
        require: true
      })
  })
  .option('mobileCounter', {
    alias: 'm',
    description: 'Sets number of runs for default (mobile) config.',
    type: 'number',
    default: 5
  })
  .option('desktopCounter', {
    alias: 'd',
    description: 'Sets number of runs for desktop config.',
    type: 'number',
    default: 5
  })
  .option('report', {
    alias: 'r',
    description: 'Generate default html report at the end. Outputs to ./report/<HOST>_<DATE>.html',
    type: 'boolean',
    default: false
  })
  .option('max-buffer', {
    alias: 'b',
    description: 'Set node child_process module max buffer. Sometimes default buffer size is not enough to complete test, with this option you can set a custom value.',
    type: 'number',
    default: 1024 * 1024
  })
  .option('config-mobile', {
    alias: 'mobileConfigPath',
    description: 'Set custom config path for mobile runs.',
    type: 'string',
    default: './node_modules/lighthouse/lighthouse-core/config/lr-mobile-config.js'
  })
  .option('config-desktop', {
    alias: 'desktopConfigPath',
    description: 'Set custom config path for desktop runs.',
    type: 'string',
    default: './node_modules/lighthouse/lighthouse-core/config/lr-desktop-config.js'
  })
  .argv;

// const results = [];
// const resultsDesktop = [];
// const lowHigh = [];
// const lowHighDesktop = [];

// lowHigh[0] = 100;
// lowHigh[1] = 0;
// lowHighDesktop[0] = 100;
// lowHighDesktop[1] = 0;

if (argv.mobileCounter) {
  run(argv.mobileCounter, argv.mobileConfigPath, false);
}

if (argv.desktopCounter) {
  run(argv.desktopCounter, argv.desktopConfigPath, false);
}

if (argv.report) {
  run(1, argv.mobileConfigPath, true);
}

function run(counter, configPath, isReport) {
  let output = 'json';

  if (isReport) {
    let fileName = createReportName();
    let output = 'html';
    let outputPath = `./report/${fileName}.html`;
  }

  for (let i = 0; i < counter; i++) {
    console.log(`Running Lighthouse attempt #${i + 1}...`);
    const {status = -1, stdout, stderr} = spawnSync('node', [
        lighthouseCli,
        argv.url,
        `--output=${output}`, 
        `--config-path=${configPath}`,
        isReport ? `--output-path=${outputPath}` : ``
      ],
      {
        maxBuffer: argv.maxBuffer
      }
    );

    if (status !== 0) {
      console.log('Lighthouse failed, skipping run...');
      console.log('Error output: ', stderr);
      continue;
    }

    let parsed = JSON.parse(stdout);
    console.log('Run score: ' + parsed.categories.performance.score * 100);

    lowHigh[0] = parsed.categories.performance.score < lowHigh[0] ? parsed.categories.performance.score : lowHigh[0];
    lowHigh[1] = parsed.categories.performance.score > lowHigh[1] ? parsed.categories.performance.score : lowHigh[1];
    
    results.push(parsed);
  }
}

function createReportName() {
  let date_ob = new Date();
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  const url = new URL(argv.url);

  reportName = `${url.host}_`;
  reportName += date_ob.getFullYear() + "-" + month + "-" + day + "_" + date_ob.getHours() + "-" + date_ob.getMinutes() + "-" + date_ob.getSeconds();

  return reportName;
}

// if (results.length) {
//   const median = computeMedianRun(results);

//   console.log('Lowest and highest mobile score:', lowHigh[0] * 100 + ' - ' + lowHigh[1] * 100);
//   console.log('Median mobile performance score was', median.categories.performance.score * 100);
// }

// if (resultsDesktop.length) {
//   const medianDesktop = computeMedianRun(resultsDesktop);

//   console.log('Lowest and highest desktop score:', lowHighDesktop[0] + ' - ' + lowHighDesktop[1]);
//   console.log('Median desktop performance score was', medianDesktop.categories.performance.score * 100);
// }

// if (argv.r) {
//   console.log('Report generated to `./report/<HOST>_<DATE>.report.html`');
// }
