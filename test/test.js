/**
 * @file Unit tests for `../run_tests.js`.
 */

'use strict';

var fs = require( 'fs' );
var tape = require( 'tape' );
var runTests = require( '../run_tests' );
var apiKey = require( '../apiKey' );

tape( 'equalProperties() works.', function ( test ){
  var testCases = [
    {
      expected: {a: 1, b: 2},
      actual: {a: 1},
      match: false
    },
    {
      expected: {a: 1, b: 2},
      actual: {a: 1, b: 2},
      match: true
    },
    {
      expected: {a: 1, b: 2},
      actual: {a: 1, b: 3},
      match: false
    },
    {
      expected: {a: 1},
      actual: {a: 1, b: 2},
      match: true
    },
    {
      expected: {a: 1},
      actual: {a: 1},
      match: true
    }
  ];

  testCases.forEach( function ( testCase ){
    var match = runTests.equalProperties( testCase.expected, testCase.actual );
    test.equal( match, testCase.match, 'Properties match succesful.' );
  });
  test.end();
});

tape( 'evalTest() evaluates all edge cases correctly', function ( test ){
  var tests = [
    {
      description: '0 API results results in failure.',
      priorityThresh: 1,
      apiResults: [],
      testCase: {
        expected: {
          properties: []
        }
      },
      expected: 'fail'
    },
    {
      description: 'A result in the priority threshold matches as expected.',
      priorityThresh: 1,
      apiResults: [{
        properties: {a: 1}
      }],
      testCase: {
        expected: {
          properties: [{
            a: 1
          }]
        }
      },
      expected: 'pass'
    },
    {
      description: 'A result outside of the priority threshold fails.',
      priorityThresh: 1,
      apiResults: [{ properties: {} }, { properties: { a: 1 }}],
      testCase: {
        expected: {
          properties: [{
            a: 1
          }]
        }
      },
      expected: 'fail'
    },
    {
      description: 'Test case with no `expected`/`unexpected` props identified as a placeholder.',
      priorityThresh: -1,
      apiResults: [],
      testCase: {},
      expected: 'placeholder'
    },
    {
      description: 'Test case with no `locations.json` props identified as a placeholder.',
      priorityThresh: -1,
      apiResults: [{ properties: {} }, { properties: { a: 1 }}],
      testCase: {
        expected: {
          properties: [
            'This hopefully isn\'t in locations.json'
          ]
        }
      },
      expected: 'placeholder'
    },
    {
      description: 'Unexpected properties passes when no match found.',
      priorityThresh: 0,
      apiResults: [{ properties: {} }],
      testCase: {
        unexpected: {
          properties: [{
            a: 1
          }]
        },
      },
      expected: 'pass'
    },
    {
      description: 'Unexpected properties fails when a match was found.',
      priorityThresh: 0,
      apiResults: [{ properties: {a: 1} }],
      testCase: {
        unexpected: {
          properties: [{
            a: 1
          }]
        },
      },
      expected: 'fail'
    },
    {
      description: 'Expected/unexpected properties work as expected when both are specified..',
      priorityThresh: 1,
      apiResults: [{ properties: {a: 1} }],
      testCase: {
        expected: {
          properties: [{
            a: 1
          }]
        },
        unexpected: {
          properties: [{
            b: 1
          }]
        },
      },
      expected: 'pass'
    },
    {
      description: 'Multiple expected blocks should ALL be found',
      priorityThresh: 3,
      apiResults: [
        { properties: {a:1, b:2} },
        { properties: {a:3, b:5} },
        { properties: {a:4, b:6} }
      ],
      testCase: {
        expected: {
          properties: [
            {a:1, b:2},
            {a:4, b:6}
          ]
        }
      },
      expected: 'pass'
    },
    {
      description: 'Only one of multiple expected blocks found should fail',
      priorityThresh: 3,
      apiResults: [
        { properties: {a:1, b:2} },
        { properties: {a:3, b:5} }
      ],
      testCase: {
        expected: {
          properties: [
            {a:1, b:2},
            {a:4, b:6}
          ]
        }
      },
      expected: 'fail'
    },
    {
      description: 'Multiple expected blocks should ALL be found within priority threshold',
      priorityThresh: 2,
      apiResults: [
        { properties: {a:1, b:2} },
        { properties: {a:3, b:5} },
        { properties: {a:4, b:6} }
      ],
      testCase: {
        expected: {
          properties: [
            {a:1, b:2},
            {a:4, b:6}
          ]
        }
      },
      expected: 'fail'
    }
  ];

  tests.forEach( function ( testCase ){
    var result = runTests.evalTest(
      testCase.priorityThresh, testCase.testCase, testCase.apiResults
    );
    test.equal( result.result, testCase.expected, testCase.description );
  });

  test.end();
});

tape( 'execTestSuite() throws on bad test-cases.', function ( test ){
  test.throws( function (){
    var testSuite = {
      tests: [ { status: 'not a real status' } ]
    };
    runTests.execTestSuite( 'not a url', testSuite, null);
  }, /Invalid test status/, 'Throws exception on invalid test status.' );

  test.throws( function (){
    var testSuite = {
      tests: [{
        unexpected: {
          properties: [
            'a string?!'
          ]
        }
      }]
    };
    runTests.execTestSuite( 'not a url', testSuite, null);
  }, /MUST be objects/, 'Throws exception on non-object unexpected text-case.' );
  test.end();
});

tape( 'api_key not found in config', function ( test ){

  var config = '{}';

  // write a temporary pelias config
  fs.writeFileSync( '/tmp/pelias_temp.json', config, 'utf8' );

  // set the PELIAS_CONFIG env var
  process.env.PELIAS_CONFIG = '/tmp/pelias_temp.json';

  // staging
  test.equal( apiKey( 'http://pelias.stage.mapzen.com/foo' ), null, 'api key not found' );

  // unset the PELIAS_CONFIG env var
  delete process.env.PELIAS_CONFIG;

  // delete temp file
  fs.unlink( '/tmp/pelias_temp.json' );

  test.end();
});

tape( 'stage api_key imported from pelias config', function ( test ){

  var config = '{ "mapzen": { "api_key": { "pelias.stage.mapzen.com": "my_api_key" } } }';

  // write a temporary pelias config
  fs.writeFileSync( '/tmp/pelias_temp2.json', config, 'utf8' );

  // set the PELIAS_CONFIG env var
  process.env.PELIAS_CONFIG = '/tmp/pelias_temp2.json';

  // staging
  test.equal( apiKey( 'http://pelias.stage.mapzen.com/foo' ), 'my_api_key', 'api key loaded' );

  // unset the PELIAS_CONFIG env var
  delete process.env.PELIAS_CONFIG;

  // delete temp file
  fs.unlink( '/tmp/pelias_temp2.json' );

  test.end();
});

tape( 'avoid matching partial urls', function ( test ){

  var config = '{ "mapzen": { "api_key": { "pelias.stage.mapzen.com": "my_api_key" } } }';

  // write a temporary pelias config
  fs.writeFileSync( '/tmp/pelias_temp3.json', config, 'utf8' );

  // set the PELIAS_CONFIG env var
  process.env.PELIAS_CONFIG = '/tmp/pelias_temp3.json';

  // staging
  test.equal( apiKey( 'http://mapzen.com/foo' ), null, 'api not found' );

  // unset the PELIAS_CONFIG env var
  delete process.env.PELIAS_CONFIG;

  // delete temp file
  fs.unlink( '/tmp/pelias_temp3.json' );

  test.end();
});
