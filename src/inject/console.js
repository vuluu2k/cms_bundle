const ivm = require('isolated-vm');
const isDev = process.env.NODE_ENV === 'development';

async function injectConsole(isolate, context, logs, isDebug = false) {
  const jail = context.global;

  // Create console method references
  const logRef = new ivm.Reference((...args) => {
    if (isDev) console.log(...args);
    if (isDebug)
      logs.push({
        type: 'log',
        args: Array.from(args.map((dump) => JSON.stringify(dump, null, 2))),
      });
  });

  const warnRef = new ivm.Reference((...args) => {
    if (isDev) console.warn(...args);
    if (isDebug)
      logs.push({
        type: 'warn',
        args: Array.from(args.map((dump) => JSON.stringify(dump, null, 2))),
      });
  });

  const errorRef = new ivm.Reference((...args) => {
    if (isDev) console.error(...args);
    if (isDebug)
      logs.push({
        type: 'error',
        args: Array.from(args.map((dump) => JSON.stringify(dump, null, 2))),
      });
  });

  // Set references in jail
  jail.setSync('_consoleLog', logRef);
  jail.setSync('_consoleWarn', warnRef);
  jail.setSync('_consoleError', errorRef);

  // Compile and inject console wrapper functions
  const consoleScript = await isolate.compileScript(`
      global.console = {
        log: function(...args) {
          return _consoleLog.apply(undefined, args, {
            arguments: { copy: true },
            result: { copy: true }
          });
        },
        warn: function(...args) {
          return _consoleWarn.apply(undefined, args, {
            arguments: { copy: true },
            result: { copy: true }
          });
        },
        error: function(...args) {
          return _consoleError.apply(undefined, args, {
            arguments: { copy: true },
            result: { copy: true }
          });
        }
      };
    `);

  try {
    await consoleScript.run(context);
  } finally {
    consoleScript.release();
  }
}

module.exports = { injectConsole };
