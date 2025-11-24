'use strict';
const ivm = require('isolated-vm');

const createIsolate = async () => {
  const isolate = new ivm.Isolate({
    memoryLimit: 16,
    inspector: false,
  });
  const context = isolate.createContextSync();
  const jail = context.global;
  return { isolate, context, jail };
};

module.exports = { createIsolate };
