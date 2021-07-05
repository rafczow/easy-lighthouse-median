const yargs = require('yargs');
const { hideBin } = require('yargs/helpers')

const spawnSync = require('child_process').spawnSync;
const lighthouseCli = require.resolve('lighthouse/lighthouse-cli');
const { computeMedianRun } = require('lighthouse/lighthouse-core/lib/median-run.js');

const argv = yargs(hideBin(process.argv))
  .command('run <url>', 'run lightouse cli and compute median', (yargs) => {
    yargs.positional('url', {
        describe: 'url for which lightouse will run',
        type: 'string'
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
  
let scores = { 
  desktop: { output: [], lowest: 100, highest: 0}, 
  mobile: { output: [], lowest: 100, highest: 0}
};

if (argv.mobileCounter) {
  run(argv.mobileCounter, argv.mobileConfigPath, false);
}

if (argv.desktopCounter) {
  run(argv.desktopCounter, argv.desktopConfigPath, false, 'desktop');
}

if (argv.report) {
  run(1, argv.mobileConfigPath, true);
}

results();

function run(counter, configPath, isReport, platform = 'mobile') {
  let fileName;
  let outputPath;

  if (isReport) {
    fileName = createReportName();
    outputPath = `./report/${fileName}.html`;
  }

  for (let i = 0; i < counter; i++) {
    console.log(`Running Lighthouse attempt #${i + 1} for ${platform}...`);
    const {status = -1, stdout, stderr} = spawnSync('node', [
        lighthouseCli,
        argv.url,
        isReport ? `--output=html` : `--output=json`,
        `--config-path=${configPath}`,
        isReport ? `--output-path=${outputPath}` : ` `
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

    if (isReport) {
      continue;
    }

    let parsed = JSON.parse(stdout);
    console.log('Run score: ' + parsed.categories.performance.score * 100, '\n');

    if (platform !== 'mobile') {
      scores.desktop.lowest = parsed.categories.performance.score < scores.desktop.lowest ? parsed.categories.performance.score : scores.desktop.lowest;
      scores.desktop.highest = parsed.categories.performance.score > scores.desktop.highest ? parsed.categories.performance.score : scores.desktop.highest;
      scores.desktop.output.push(parsed);
    } else {
      scores.mobile.lowest = parsed.categories.performance.score < scores.mobile.lowest ? parsed.categories.performance.score : scores.mobile.lowest;
      scores.mobile.highest = parsed.categories.performance.score > scores.mobile.highest ? parsed.categories.performance.score : scores.mobile.highest;
      scores.mobile.output.push(parsed);
    }
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

function results() {
  if (scores.mobile.output.length) {
    const median = computeMedianRun(scores.mobile.output);

    console.log('Lowest and highest mobile score:', scores.mobile.lowest * 100 + ' - ' + scores.mobile.highest * 100);
    console.log('Median mobile performance score:', median.categories.performance.score * 100, '\n');
  }

  if (scores.desktop.output.length) {
    const medianDesktop = computeMedianRun(scores.desktop.output);

    console.log('Lowest and highest desktop score:', scores.desktop.lowest * 100 + ' - ' + scores.desktop.highest * 100);
    console.log('Median desktop performance score:', medianDesktop.categories.performance.score * 100, '\n');
  }

  if (argv.r) {
    console.log('Report generated to `./report/<HOST>_<DATE>.html`');
  }
}
