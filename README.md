<p align="center">
  <img height="100" src="https://raw.githubusercontent.com/pelias/design/master/logo/pelias_github/Github_markdown_hero.png">
</p>
<h3 align="center">A modular, open-source search engine for our world.</h3>
<p align="center">Pelias is a geocoder powered completely by open data, available freely to everyone.</p>
<p align="center">
<a href="https://en.wikipedia.org/wiki/MIT_License"><img src="https://img.shields.io/github/license/pelias/api?style=flat&color=orange" /></a>
<a href="https://hub.docker.com/u/pelias"><img src="https://img.shields.io/docker/pulls/pelias/api?style=flat&color=informational" /></a>
<a href="https://gitter.im/pelias/pelias"><img src="https://img.shields.io/gitter/room/pelias/pelias?style=flat&color=yellow" /></a>
</p>
<p align="center">
	<a href="https://github.com/pelias/docker">Local Installation</a> ·
        <a href="https://geocode.earth">Cloud Webservice</a> ·
	<a href="https://github.com/pelias/documentation">Documentation</a> ·
	<a href="https://gitter.im/pelias/pelias">Community Chat</a>
</p>
<details open>
<summary>What is Pelias?</summary>
<br />
Pelias is a search engine for places worldwide, powered by open data. It turns addresses and place names into geographic coordinates, and turns geographic coordinates into places and addresses. With Pelias, you’re able to turn your users’ place searches into actionable geodata and transform your geodata into real places.
<br /><br />
We think open data, open source, and open strategy win over proprietary solutions at any part of the stack and we want to ensure the services we offer are in line with that vision. We believe that an open geocoder improves over the long-term only if the community can incorporate truly representative local knowledge.
</details>

# Pelias Geocoder Acceptance Tests

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

## Configuration

The acceptance tests need to know how to contact your Pelias instance, and this can be configured through `pelias.json`.

If your Pelias instance has an API key, you can also specify it in the `mapzen`
section (the name will be [changed soon](https://github.com/pelias/acceptance-tests/issues/465)).

```javascript
{
  "mapzen": {
    "api_key": {
      "domain-name-of-your-pelias": "your-api-key"
    }
  },
  "acceptance-tests": {
    "endpoints": {
      "prod": "http://domain-name-of-your-pelias/v1/"
    }
  }
}
```

Save that config file somewhere, `/etc/config.json` for example. You'll need to
set the environment variable `PELIAS_CONFIG` to the path at which the file can
be found. So do something like this, but with your path.

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
