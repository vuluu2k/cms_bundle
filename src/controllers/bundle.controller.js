const { OK } = require('../core/success.response');
const bundleService = require('../services/bundle.service');

class BundleController {
  async bundle(req, res) {
    const { content } = req.body;

    new OK({
      message: 'Bundle created successfully',
      metadata: await bundleService.bundle(content),
    }).send(res);
  }

  async execute(req, res) {
    const { minify_content, functionName, params } = req.body;

    new OK({
      message: 'Function executed successfully',
      metadata: await bundleService.executeFunction(
        minify_content,
        functionName,
        params
      ),
    }).send(res);
  }
}

module.exports = new BundleController();
