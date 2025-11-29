'use strict';
const { createIsolate } = require('./sandbox');
const fs = require('fs').promises;
const { BadRequestError } = require('../core/error.response');
const { injectGlobalFunctions } = require('../inject/global');
const { injectURLSearchParams } = require('../inject/url.searchparams');
const { injectConsole } = require('../inject/console');
const { injectFetch } = require('../inject/fetch');

const EXECUTION_TIMEOUT = 30000; // 30 seconds

async function runUserFunction(
  site_id,
  file_id,
  functionName,
  params,
  isDebug = false,
  customer = {}
) {
  // Validate and sanitize functionName to prevent injection
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(functionName)) {
    throw new BadRequestError('Invalid function name');
  }

  const { isolate, context, jail } = await createIsolate();
  let bundledScript = null;
  let callScript = null;

  const logs = [];

  try {
    // Set up global environment
    jail.setSync('global', jail.derefInto());

    // Inject all required APIs
    await injectGlobalFunctions(isolate, context);
    await injectURLSearchParams(isolate, context);
    await injectConsole(isolate, context, logs, isDebug);
    await injectFetch(isolate, context);

    // Read bundled code asynchronously
    const bundledCode = await fs.readFile(
      `bundle/${site_id}/${file_id}.js`,
      'utf8'
    );

    // Compile bundled code for better performance and security
    bundledScript = await isolate.compileScript(bundledCode);
    await bundledScript.run(context, { timeout: EXECUTION_TIMEOUT });

    // Safely construct the function call script
    const paramsJson = JSON.stringify(params);
    const customerJson = JSON.stringify(customer);
    callScript = await isolate.compileScript(`
      (async () => {
        if (typeof MyModule === 'undefined' || typeof MyModule.${functionName} !== 'function') {
          throw new Error('Function ${functionName} not found in MyModule');
        }
        const params = ${paramsJson};
        const customer = ${customerJson};
        const result = await MyModule.${functionName}({ params, customer });
        return JSON.stringify(result);
      })()
    `);

    // Execute with timeout
    const result = await Promise.race([
      callScript.run(context, { promise: true, timeout: EXECUTION_TIMEOUT }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Execution timeout')),
          EXECUTION_TIMEOUT
        )
      ),
    ]);

    return { result: JSON.parse(result), logs };
  } catch (err) {
    const errorMessage = err.message || 'Unknown error';
    if (isDebug)
      return {
        result: 'No error detected results',
        logs,
        error: { message: errorMessage },
      };
    throw new BadRequestError(`Execution failed: ${errorMessage}`);
  } finally {
    context.release();

    if (bundledScript) {
      bundledScript.release();
    }

    if (callScript) {
      callScript.release();
    }
  }
}

module.exports = { runUserFunction };
