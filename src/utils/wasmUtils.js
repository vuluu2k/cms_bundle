'use strict';

const injectConsole = (vm) => {
  const dump = (v) => vm.dump(v);

  // Create real console.log function
  const logFn = vm.newFunction('log', (...args) => {
    // eslint-disable-next-line no-console
    console.log('VM LOG:', ...args.map(dump));
  });

  const warnFn = vm.newFunction('warn', (...args) => {
    // eslint-disable-next-line no-console
    console.warn('VM WARN:', ...args.map(dump));
  });

  const errorFn = vm.newFunction('error', (...args) => {
    // eslint-disable-next-line no-console
    console.error('VM ERROR:', ...args.map(dump));
  });

  // Create console object
  const consoleObj = vm.newObject();
  vm.setProp(consoleObj, 'log', logFn);
  vm.setProp(consoleObj, 'warn', warnFn);
  vm.setProp(consoleObj, 'error', errorFn);

  // Inject into global
  vm.setProp(vm.global, 'console', consoleObj);
};

const convertToVMHandle = (vm, value) => {
  // Null hoặc undefined
  if (value === null) return vm.null;
  if (value === undefined) return vm.undefined;

  // Boolean
  if (typeof value === 'boolean') {
    return value ? vm.true : vm.false;
  }

  // Number
  if (typeof value === 'number') {
    return vm.newNumber(value);
  }

  // String
  if (typeof value === 'string') {
    return vm.newString(value);
  }

  // Array
  if (Array.isArray(value)) {
    const arrayHandle = vm.newArray();
    value.forEach((item, index) => {
      const itemHandle = this.convertToVMHandle(vm, item);
      vm.setProp(arrayHandle, index, itemHandle);
      itemHandle.dispose();
    });
    return arrayHandle;
  }

  // Object
  if (typeof value === 'object') {
    const objHandle = vm.newObject();
    for (const [key, val] of Object.entries(value)) {
      const valueHandle = this.convertToVMHandle(vm, val);
      vm.setProp(objHandle, key, valueHandle);
      valueHandle.dispose();
    }
    return objHandle;
  }

  // Fallback: convert to string
  return vm.newString(String(value));
};

module.exports = { injectConsole, convertToVMHandle };
