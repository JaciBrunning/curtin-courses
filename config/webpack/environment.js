const { environment } = require('@rails/webpacker')
const erb =  require('./loaders/erb')

// Preventing Babel from transpiling NodeModules packages
environment.loaders.delete('nodeModules');

environment.loaders.prepend('erb', erb)
module.exports = environment
