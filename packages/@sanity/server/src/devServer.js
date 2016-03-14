import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import {getBaseServer, applyStaticRoutes} from './baseServer'
import getWebpackDevConfig from './configs/webpack.config.dev'
import find from 'lodash/find'
import get from 'lodash/get'
import set from 'lodash/set'

export default function getDevServer(config = {}) {
  const app = getBaseServer()
  const webpackConfig = config.webpack || getWebpackDevConfig(config)

  const babelLoader = find(webpackConfig.module.loaders, {loader: 'babel'})
  if (babelLoader) {
    const presets = get(babelLoader, 'query.env.development.presets', [])
    if (presets.indexOf('react-hmre') === -1) {
      set(babelLoader, 'query.env.development.presets', presets.concat('react-hmre'))
    }
  }

  const compiler = webpack(webpackConfig)

  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath,
    stats: true,
    debug: true
  }))

  app.use(webpackHotMiddleware(compiler))

  return applyStaticRoutes(app, config)
}