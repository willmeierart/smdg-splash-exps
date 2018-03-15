const path = require('path')
const glob = require('glob')
const webpack = require('webpack')
const { parsed: localEnv } = require('dotenv').config()

module.exports = {
  webpack: (config, { dev }) => {
    config.module.rules.push(
      {
        test: /\.(css|scss)/,
        loader: 'emit-file-loader',
        options: {
          name: 'dist/[path][name].[ext]'
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          'postcss-loader'
        ]
      },
      {
        test: /\.s(a|c)ss$/,
        use: [
          'babel-loader',
          'raw-loader',
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              includePaths: ['styles', 'node_modules']
                .map(d => path.join(__dirname, d))
                .map(g => glob.sync(g))
                .reduce((a, c) => a.concat(c), [])
            }
          }
        ]
      },
      { test: /\.js$/,
        exclude: /node_modules(?!\/react-calendar-timeline)/,
        loader: 'babel-loader'
      },
      {
        test: /\.glsl$/,
        loader: 'webpack-glsl-loader'
      }
    )
    config.plugins.push(
      new webpack.EnvironmentPlugin(localEnv)
    )
    // config.node = { fs: 'empty' }
    return config
  }
}
