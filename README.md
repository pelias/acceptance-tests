#### status of [pelias.mapzen.com](http://pelias.mapzen.com): [![Build Status](https://travis-ci.org/pelias/fuzzy-tests.png)](https://travis-ci.org/pelias/fuzzy-tests)

# Fuzzy tests

This repository contains all of the Pelias API "fuzzy" tests, which are automated tests used to identify
improvements and regressions between various versions of the API and the underlying data.

Unlike the [acceptance-tests](https://github.com/pelias/acceptance-tests), which are carefully
curated and should nearly all be passing, the fuzzy tests are intended to focus on having lots of
tests, and looking more at the percentage of tests that pass over time rather than individual
failures. See the original [problem statement](https://github.com/pelias/acceptance-tests/issues/109) for more info.

This repo began as a clone of the acceptance-test repo, so they share a similar structure and usage.

## prerequisites

You will need to have `npm` version `2.0` or higher installed.

## Usage

```
npm test
npm test -- -e prod
npm test -- -e stage -t dev
```

## Test Case Files

For a full description of what can go in tests, see the
[pelias-fuzzy-tester](https://github.com/pelias/fuzzy-tester) documentation
