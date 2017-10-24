# acceptance tests

[![Greenkeeper badge](https://badges.greenkeeper.io/pelias/acceptance-tests.svg)](https://greenkeeper.io/)

This repository contains all of the Pelias API "acceptance" tests, which are automated tests used to identify
improvements and regressions between various versions of the API and the underlying data. Since it's
difficult/impossible to manually verify whether things have begun silently failing (eg, a certain query stopped
returning the right results) after a data or search logic change, the acceptance tests should provide us with a
shotgun overview of the status of any Pelias instance.

## prerequisites

You will need to have `npm` version `2.0` or higher installed.

## Setup

```bash
$ npm install
```

You'll want to add your api key to the config, and possibly change the endpoints. Both of those should be done
using a json config file. It can look as follows.
_Be sure to replace the invalid key with your own API key, which you can sign up for [here](mapzen.com/developers)._

```javascript
{
  "mapzen": {
    "api_key": {
      "search.mapzen.com": "search-XXXXXX"
    }
  },
  "acceptance-tests": {
    "endpoints": {
      "prod": "http://search.mapzen.com/v1/"
    }
  }
}
```

Once you've saved that config file somewhere, let's say `/etc/config.json` for example. You'll need to set the 
environment variable `PELIAS_CONFIG` to the path at which the file can be found. So do something like this, but with your path.

```bash
$ export PELIAS_CONFIG=/etc/config.json
```

## Usage

default to running all tests against production

```bash
$ npm test
```

specify an environment manually
```bash
$ npm test -- -e bigdev
```

specify an environment and only run tests that work against dev (small dataset of just NYC and London)

```bash
$ npm test -- -e dev -t dev
```

dump results from failing tests into json files, one per failing test

```bash
$ npm test -- -e dev -o json
```


## Test Case Files

For a full description of what can go in tests, see the
[pelias-fuzzy-tester](https://github.com/pelias/fuzzy-tester) documentation
