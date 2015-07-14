/**
 * @file Several functions that handle test-running and statistics collection.
 */

'use strict';

var locations = require( './locations.json' );
var util = require( 'util' );
var isObject = require( 'is-object' );
var request = require( 'request' );

/**
 * Return a boolean indicating whether `actual` has all the key value pairs
 * contained in `expected`.
 */
function equalProperties( expected, actual ){
  for( var prop in expected ){
    if ( typeof expected[ prop ] !== typeof actual[ prop ] ) {
      return false;
    }

    if ( typeof expected[ prop ] === 'object' ) {
      return equalProperties( expected[ prop ], actual[ prop ] );
    }

    if( actual[ prop ] !== expected[ prop ] ){
      return false;
    }
  }
  return true;
}

/**
 * Given a test-case, the API results for the input it specifies, and a
 * priority-threshold to find the results in, return an object indicating the
 * status of this test (whether it passed, failed, is a placeholder, etc.)
 */
function evalTest( priorityThresh, testCase, apiResults ){
  if( (!( 'expected' in testCase ) || testCase.expected.properties === null) &&
      !( 'unexpected' in testCase ) ){
    return {
      result: 'placeholder',
      msg: 'Placeholder test, no `expected` specified.'
    };
  }

  if ( !isObject(apiResults) || apiResults.length === 0 ) {
    return {
      result: 'fail',
      msg: 'no results returned'
    };
  }

  var ind;
  var expected = [];
  if( 'expected' in testCase ){
    for( ind = 0; ind < testCase.expected.properties.length; ind++ ){
      var testCaseProps = testCase.expected.properties[ ind ];
      if( typeof testCaseProps === 'string' ){
        if( testCaseProps in locations ){
          expected.push(locations[ testCaseProps ]);
        }
        else {
          return {
            result: 'placeholder',
            msg: 'Placeholder test, no `out` object matches in `locations.json`.'
          };
        }
      }
      else {
        expected.push( testCaseProps );
      }
    }

    if( 'priorityThresh' in testCase.expected ){
      priorityThresh = testCase.expected.priorityThresh;
    }
  }

  var unexpected = ( testCase.hasOwnProperty( 'unexpected' ) ) ?
    testCase.unexpected.properties : [];

  var expectedResultsFound = [];

  for( ind = 0; ind < apiResults.length; ind++ ){
    var result = apiResults[ ind ];
    for( var expectedInd = 0; expectedInd < expected.length; expectedInd++ ){
      if( expectedResultsFound.indexOf( expectedInd ) === -1 &&
        equalProperties( expected[ expectedInd ], result.properties ) ){
        var success = ( ind + 1 ) <= priorityThresh;
        if( !success ){
          return {
            result: 'fail',
            msg: util.format( 'Result found, but not in top %s. (%s)', priorityThresh, ind+1 )
          };
        }
        else {
          expectedResultsFound.push( expectedInd );
        }
      }
    }

    for( var unexpectedInd = 0; unexpectedInd < unexpected.length; unexpectedInd++ ){
      if( equalProperties( unexpected[ unexpectedInd ], result.properties ) ){
        return {
          result: 'fail',
          msg: util.format( 'Unexpected result found.' )
        };
      }
    }
  }

  if ( expectedResultsFound.length === expected.length ) {
    return { result: 'pass' };
  }

  if ( expected.length === 0 && unexpected.length > 0 ) {
    return {result: 'pass'};
  }

  return {
      result: 'fail',
      msg: 'No matching result found.'
    };
}

var validTestStatuses = [ 'pass', 'fail', undefined ];
/**
 * Execute all the tests in a test-suite file with `evalTest()`, and pass an
 * object containing the results to `cb()`. `apiUrl` contains the URL of the
 * Pelias API to query.
 */
function execTestSuite( apiUrl, testSuite, cb ){
  var testResults = {
    stats: {
      pass: 0,
      fail: 0,
      placeholder: 0,
      regression: 0,
      timeTaken: null,
      name: testSuite.name
    },
    results: []
  };

  if( testSuite.tests.length === 0 ){
    process.nextTick( function (  ){
      cb( testResults );
    });
    return;
  }

  testSuite.tests.forEach( function ( testCase ){
    if( validTestStatuses.indexOf( testCase.status ) === -1 ){
      throw util.format(
        'Invalid test status: `%s`. Recognized statuses are: %s',
        testCase.status, JSON.stringify( validTestStatuses )
      );
    }

    if( 'unexpected' in testCase ){
      testCase.unexpected.properties.forEach( function ( props ){
        if( typeof props !== 'object' ){
          throw 'Unexpected properties MUST be objects! Strings are not supported. Exiting. ' +
            JSON.stringify( testCase, undefined, 4 );
        }
      });
    }
  });

  var startTime = new Date().getTime();
  var totalTestsNum = testSuite.tests.length;

  /**
   * Rate limit HTTP requests to one per 5ms, to prevent the API from
   * shutting us out.
   */
  var intervalTime = 50;
  testSuite.test408s = [];


  var intervalId = setInterval( function (){
    if( testSuite.tests.length === 0 ){
      if ( testSuite.test408s.length === 0 ) {
        return;  
      } else {
        // console.log('setting interval 500');
        testSuite.tests = testSuite.test408s;
        intervalTime = 500;
      }
    }

    var testCase = testSuite.tests.pop();

    var requestOpts = {
      url: testCase.endpoint || testSuite.endpoint || 'search',
      baseUrl: apiUrl,
      qs: testCase.in,
      json: true
    };

    request( requestOpts, function ( err, res ){
      var retry_codes = [408, 413, 429];
      if( err ){
        console.error( err );
        return;
      }
      else if( retry_codes.indexOf(res.statusCode) !== -1 ){
        if (res.statusCode === 408) {
          testSuite.test408s.push( testCase );
        } else {
          testSuite.tests.push( testCase );  
        }
        return;
      }
      else if( res.statusCode !== 200 ){
        console.error( 'Unexpected status code %s, exiting.\n'.red, res.statusCode );
        console.error(
          'Failed for test case:\n%s\n',
          JSON.stringify( testCase, undefined, 4 ).replace( /^|\n/g, '\n\t' )
        );
        console.error(
          'Response:\n%s\n',
          JSON.stringify( res, undefined, 4 ).replace( /^|\n/g, '\n\t' )
        );
        console.error( '\nInvestigate manually:\n  curl %s', res.request.url.href );
        process.exit( 1 );
      }

      stats.testsCompleted++;
      process.stderr.write( util.format(
        '\rTests completed: %s/%s', stats.testsCompleted.toString().bold,
        stats.testsTotal
      ));

      var results = evalTest( testSuite.priorityThresh, testCase, res.body.features );
      if( results.result === 'pass' && testCase.status === 'fail' ){
        results.progress = 'improvement';
      }
      else if( results.result === 'fail' && testCase.status === 'pass' ){
        // uncomment for debugging
        // require('fs').writeFileSync('fail_' + testCase.id + '.json', JSON.stringify(res.body.features));
        // end of debugging code

        // subtract the regression from fail count, so we don't double count them
        testResults.stats.fail--;
        testResults.stats.regression++;
        results.progress = 'regression';
      }

      results.testCase = testCase;
      testResults.stats[ results.result ]++;
      testResults.results.push( results );

      if( testResults.results.length === totalTestsNum ){
        clearInterval( intervalId );
        testResults.stats.timeTaken = new Date().getTime() - startTime;

        /**
         * Sort the test-cases by id to force some output uniformity across
         * test-runs (since otherwise it'd depend entirely on when a given
         * request returned, and would be effectively random). Separate and
         * sort string/number ids separately.
         */
        testResults.results.sort( function ( a, b ){
          var isAStr = typeof a.testCase.id === 'string';
          var isBStr = typeof b.testCase.id === 'string';
          if( ( isAStr && isBStr ) || ( !isAStr && !isBStr ) ){
            return a.testCase.id > b.testCase.id ? 1 : -1;
          }
          else {
            return isAStr ? 1 : -1;
          }
        });
        cb( testResults );
      }
    });
  }, intervalTime);
}

var stats = {
  testsCompleted: 0,
  testsTotal: 0
};

/**
 * Asynchronously execute the given `testSuites` against the Pelias API running
 * at `apiUrl`, and pass the results to the `outputGenerator` function.
 */
function execTestSuites( apiUrl, testSuites, outputGenerator, testType ){
  var suiteResults = {
    stats: {
      pass: 0,
      fail: 0,
      placeholder: 0,
      regression: 0,
      timeTaken: 0,
      url: apiUrl
    },
    results: []
  };

  testSuites.forEach( function ( suite ){
    suite.tests = suite.tests.filter( function ( testCase ){
      return testType === undefined || testCase.type === testType;
    });
  });

  stats.testsTotal = testSuites.reduce( function ( acc, suite ){
    return acc + suite.tests.length;
  }, 0);
  var numTestSuites = testSuites.length;
  function runNextSuite(){
    var suite = testSuites.pop();
    execTestSuite( apiUrl, suite, function ( testResults ){
      suiteResults.results.push( testResults );

      [ 'pass', 'fail', 'placeholder', 'timeTaken', 'regression' ].forEach( function ( propName ){
        suiteResults.stats[ propName ] += testResults.stats[ propName ];
      });

      if( suiteResults.results.length === numTestSuites ){
        process.stdout.write( '\r' ); // Clear the test-completion counter from the terminal.
        outputGenerator( suiteResults );
      }
      else {
        runNextSuite();
      }
    });
  }

  runNextSuite();
}

module.exports = {
  execTestSuite: execTestSuite,
  exec: execTestSuites,
  equalProperties: equalProperties,
  evalTest: evalTest
};
