# Easy Lighthouse Median

Using this script you can easly run Google Lighthouse report specified amount of times and get median result. 

Example output:
```
Running Lighthouse attempt #1 for mobile...
Run score: 19 

...

Running Lighthouse attempt #5 for mobile...
Run score: 23 

Running Lighthouse attempt #1 for desktop...
Run score: 61 

...

Running Lighthouse attempt #5 for desktop...
Run score: 58

Running Lighthouse for report... 

Lowest and highest mobile score: 19 - 23
Median mobile performance score: 20 

Lowest and highest desktop score: 58 - 68
Median desktop performance score: 63 

Report generated to `./report/<HOST>_<DATE>.html`
```

Based on example from original docs:
https://github.com/GoogleChrome/lighthouse/blob/master/docs/variability.md


## Quick start

### Requirements
- Node (Lighthouse requires Node 12 LTS (12.x) or later.)
- NPM

### Install dependencies:
```
npm install
```

### Run it:
```
node median.js https://example.com/
```

By default lighthouse will run 5 times for each config (mobile, desktop) and then calculate median score of these runs. Using cli options you can modify amount of runs for each config, provide custom config files and decide to save single html report to file.

## CLI options
```
$ node median.js run --help                                    
median.js run <url>

run lightouse cli and compute median

Positionals:
  url  url for which lightouse will run                      [string] [required]

Options:
      --help                                Show help                  [boolean]
      --version                             Show version number        [boolean]
  -m, --mobileCounter                       Sets number of runs for default
                                            (mobile) config.
                                                           [number] [default: 5]
  -d, --desktopCounter                      Sets number of runs for desktop
                                            config.        [number] [default: 5]
  -r, --report                              Generate default html report at the
                                            end. Outputs to
                                            ./report/<HOST>_<DATE>.html
                                                      [boolean] [default: false]
  -b, --max-buffer                          Set node child_process module max
                                            buffer. Sometimes default buffer
                                            size is not enough to complete test,
                                            with this option you can set a
                                            custom value.
                                                     [number] [default: 1048576]
      --config-mobile, --mobileConfigPath   Set custom config path for mobile
                                            runs.             [string] [default:
         "./node_modules/lighthouse/lighthouse-core/config/lr-mobile-config.js"]
      --config-desktop,                     Set custom config path for desktop
      --desktopConfigPath                   runs.             [string] [default:
        "./node_modules/lighthouse/lighthouse-core/config/lr-desktop-config.js"]
```

## Configuration

By default script is using configuration files that are maintained as part of Lighthouse:
- lighthouse/lighthouse-core/config/lr-mobile-config.js
- lighthouse/lighthouse-core/config/lr-desktop-config.js

You can create your own config file and use `config-mobile` or `config-desktop` command arguments to set a custom path to be used.

Find out more about lighthouse configuration and how to create custom file [here](https://github.com/GoogleChrome/lighthouse/blob/master/docs/configuration.md).
