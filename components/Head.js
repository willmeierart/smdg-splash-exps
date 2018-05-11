// literally HTML head - all SEO stuff, etc.
import Head from 'next/head'

const initialProps = {
  title: 'Agency Zero Issue Calendar',
  initialScale: '1.0'
}

export default (props = initialProps) => {
  const { title, initialScale } = props
  return <Head>
    <title key='title'>{title}</title>
    <meta key='charset' charSet='utf-8' />
    <meta key='viewport' name='viewport' content={`initial-scale=${initialScale || initialProps.initialScale}, width=device-width, shrink-to-fit=no`} />
    <meta key='meta-title' name='title' content='Agency Zero' />
    <link rel='shortcut icon' href='/static/favicon.ico' />
    
    {/* <script id="post-vert" type="x-shader/x-vertex">
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      </script>
      <script id="post-frag" type="x-shader/x-fragment">
        #include <packing>
        varying vec2 vUv;
        uniform sampler2D tDiffuse;
        uniform sampler2D tDepth;
        uniform float cameraNear;
        uniform float cameraFar;
        float readDepth( sampler2D depthSampler, vec2 coord ) {
          float fragCoordZ = texture2D( depthSampler, coord ).x;
          float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
          return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
        }
        void main() {
          //vec3 diffuse = texture2D( tDiffuse, vUv ).rgb;
          float depth = readDepth( tDepth, vUv );
          gl_FragColor.rgb = 1.0 - vec3( depth );
          gl_FragColor.a = 1.0;
        }
      </script> */}
    {/* <script async src='https://www.googletagmanager.com/gtag/js?id=UA-XXXXXXXX-X' /> */}
  </Head>
}
