'use strict';
const ivm = require('isolated-vm');

const createIsolate = async () => {
  const isolate = new ivm.Isolate({
    memoryLimit: 128,
    inspector: false,
  });
  const context = await isolate.createContext();
  const jail = context.global;
  return { isolate, context, jail };
};

module.exports = { createIsolate };
