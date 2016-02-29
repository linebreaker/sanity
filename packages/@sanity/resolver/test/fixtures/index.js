import merge from 'lodash/merge'

function sanityManifest(plugins) {
  return JSON.stringify({
    server: {
      port: 7777
    },
    plugins: plugins || []
  }, null, 2)
}

function pluginManifest(props) {
  return JSON.stringify(props, null, 2)
}

function instagramManifest() {
  return pluginManifest({
    provides: [{
      role: 'instagram/commentsListComponent',
      path: './src/components/CommentsList',
    }, {
      role: 'instagram/commentComponent',
      path: './src/components/Comment'
    }],
    fulfills: [{
      role: 'standard-layout/tool',
      path: './src/components/InstagramTool'
    }, {
      role: 'standard-layout/tool',
      path: './src/components/InstaDiscoverTool'
    }]
  })
}

function standardLayout() {
  return {
    'sanity.json': pluginManifest({
      provides: [{
        role: 'standard-layout/tool',
        multiple: true
      }, {
        role: 'standard-layout/settings-pane',
        multiple: true
      }],
      fulfills: [{
        role: 'core/mainComponent',
        path: './src/components/Main'
      }]
    })
  }
}

function sanityCore() {
  return {
    'core': {
      'sanity.json': pluginManifest({
        plugins: [
          '@sanity/standard-layout'
        ],
        provides: [{role: 'core/mainComponent'}]
      })
    },
    'standard-layout': standardLayout()
  }
}

export function getResolutionOrderFixture({chosenMethod}) {
  const order = ['fullLocalPath', 'shortLocalPath', 'subNodeModules', 'nodeModules']
  const paths = {
    fullLocalPath: '/sanity/plugins/sanity-plugin-bar/sanity.json',
    shortLocalPath: '/sanity/plugins/bar/sanity.json',
    subNodeModules: '/sanity/node_modules/sanity-plugin-foo/node_modules/sanity-plugin-bar/sanity.json',
    nodeModules: '/sanity/node_modules/sanity-plugin-bar/sanity.json'
  }

  const base = {
    '/sanity/sanity.json': sanityManifest(['foo']),
    '/sanity/node_modules/sanity-plugin-foo/sanity.json': pluginManifest({plugins: ['bar']})
  }

  const extendWith = {}
  const startIndex = order.indexOf(chosenMethod)
  for (let i = startIndex; i < order.length; i++) {
    const method = order[i]
    extendWith[paths[method]] = pluginManifest({})
  }

  return Object.assign({}, base, extendWith)
}

export function getBasicTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['@sanity/core', 'instagram']),
    '/sanity/node_modules': {
      'sanity-plugin-instagram': {
        'sanity.json': instagramManifest(),
      },
      '@sanity': sanityCore()
    }
  }
}

export function getDeepTree({missingPlugin, missingManifest} = {}) {
  const plugins = ['@sanity/core', 'foo']
  if (missingPlugin) {
    plugins.push('missing')
  }

  return merge(getBasicTree(), {
    '/sanity/sanity.json': sanityManifest(plugins),
    '/sanity/node_modules': {
      'sanity-plugin-foo': {
        'sanity.json': pluginManifest({
          plugins: ['bar'],
          fulfills: [{
            role: 'bar/baz',
            path: './someFile'
          }]
        })
      },
      'sanity-plugin-bar': {
        'sanity.json': pluginManifest({
          plugins: ['baz'],
          provides: [{role: 'bar/baz'}]
        })
      },
      'sanity-plugin-baz': !missingManifest && {
        'sanity.json': pluginManifest({
          provides: []
        })
      }
    }
  })
}

export function getInvalidJson({atRoot}) {
  return {
    '/sanity/sanity.json': atRoot ? '{foo:bar' : sanityManifest(['instagram']),
    '/sanity/node_modules/sanity-plugin-instagram/sanity.json': '{"invalid"'
  }
}

export function getInvalidManifest({atRoot}) {
  return {
    '/sanity/sanity.json': atRoot ? '{"plugins":"foo"}' : sanityManifest('instagram'),
    '/sanity/node_modules/sanity-plugin-instagram/sanity.json': pluginManifest({
      provides: {
        role: 'path'
      }
    })
  }
}