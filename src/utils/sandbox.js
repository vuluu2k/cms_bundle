'use strict';
const ivm = require('isolated-vm');
const isolate = new ivm.Isolate({
  memoryLimit: 4 * 1024,
  inspector: false,
});

const createIsolate = async () => {
  const context = await isolate.createContext();
  const jail = context.global;
  return { isolate, context, jail };
};

module.exports = { createIsolate };
