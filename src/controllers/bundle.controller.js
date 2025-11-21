const { OK } = require('../core/success.response');
const bundleService = require('../services/bundle.service');

class BundleController {
  async bundle(req, res) {
    const { content } = req.body;

    new OK({
      message: 'Bundle created successfully',
      metadata: await bundleService.bundle(content)
    }).send(res);
  }

  async execute(req, res) {
    const { content, functionName, args } = req.body;

    new OK({
      message: 'Function executed successfully',
      metadata: await bundleService.executeFunction(content, functionName, args)
    }).send(res);
  }
}

module.exports = new BundleController();
