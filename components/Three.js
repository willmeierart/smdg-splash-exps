import React, { Component } from 'react'
import DOM from 'react-dom'
import PropTypes from 'prop-types'
import raf from 'raf'
import * as THREE from 'three'
import { binder } from '../lib/_utils'
const OrbitControls = require('three-orbit-controls')(THREE)
// import { Shaders, GLSL } from 'gl-react'
// const vertexShader = require('./shaders/vertex.glsl')
// const fragmentShader = require('./shaders/fragment.glsl')
// const THREE = require('three')

class Three extends Component {
  constructor (props) {
    super(props)
    this.state = { supportsExtension: true, inited: false, mounted: false }
    binder(this, ['renderThree', 'init', 'setupScene', 'setupPost', 'onWindowResize', 'varsNeedUpdate'])
    const initialVars = ['renderer', 'camera', 'scene', 'target', 'postScene', 'postCamera']
    initialVars.forEach(v => { this[v] = null })
  }

  shouldComponentUpdate (prevProps, prevState) {
    if (this.state.inited !== prevState.inited || this.props.server !== prevProps.server) {
      return true
    }
    return false
  }

  componentDidMount () { this.setupThree() }
  componentDidUpdate () { this.setupThree() }

  varsNeedUpdate () {
    return this.renderer === null ||
      this.camera === null ||
      this.scene === null ||
      this.target === null ||
      this.postScene === null ||
      this.postCamera === null
  }

  setupThree () {
    if (!this.props.server && this.varsNeedUpdate()) {
      this.init()
      this.renderThree()
      if (!this.state.inited) { this.forceUpdate() }
    } else {
      // console.log(this, this.varsNeedUpdate(), !this.props.server);
    }
  }

  init () {
    const { w, h } = this.props
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    if (!this.renderer.extensions.get('WEBGL_depth_texture')) {
      this.setState({ supportsExtension: false })
    }
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(w, h)

    if (this.camera === null) {
      this.camera = new THREE.PerspectiveCamera(70, w / h, 0.01, 50)
    }

    this.camera.position.z = 4

    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.35
    controls.rotateSpeed = 0.35

    this.target = new THREE.WebGLRenderTarget(w, h)
    this.target.texture.format = THREE.RGBFormat
    this.target.texture.minFilter = THREE.NearestFilter
    this.target.texture.magFilter = THREE.NearestFilter
    this.target.texture.generateMipmaps = false
    this.target.stencilBuffer = false
    this.target.depthBuffer = true
    this.target.depthTexture = new THREE.DepthTexture()
    this.target.depthTexture.type = THREE.UnsignedShortType

    this.scene = new THREE.Scene()
    this.setupScene()

    this.setupPost()

    this.onWindowResize()
    window.addEventListener('resize', this.onWindowResize, false)

    const tryToMount = () => {
      if (this.mount !== undefined) {
        // console.log('mounting renderer domElement')
        this.mount.appendChild(this.renderer.domElement)
        this.setState({ mounted: true })
      } else {
        setTimeout(() => { tryToMount() }, 200)
      }
    }
    tryToMount()
    this.setState({ inited: true })
  }

  setupPost () {
    // const shaders = Shaders.create({
    //   postVert: {
    //     frag: GLSL`
    //       varying vec2 vUv;
    //       void main() {
    //         vUv = uv;
    //         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    //       }`
    //   },
    //   postFrag: {
    //     frag: GLSL`
    //     #include <packing>
    //     varying vec2 vUv;
    //     uniform sampler2D tDiffuse;
    //     uniform sampler2D tDepth;
    //     uniform float cameraNear;
    //     uniform float cameraFar;
    //     float readDepth( sampler2D depthSampler, vec2 coord ) {
    //       float fragCoordZ = texture2D( depthSampler, coord ).x;
    //       float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
    //       return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
    //     }
    //     void main() {
    //       //vec3 diffuse = texture2D( tDiffuse, vUv ).rgb;
    //       float depth = readDepth( tDepth, vUv );
    //       gl_FragColor.rgb = 1.0 - vec3( depth );
    //       gl_FragColor.a = 1.0;
    //     }`
    //   }
    // })
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const postMaterial = new THREE.ShaderMaterial({
      // vertexShader,
      // fragmentShader,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
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
        }`,
      uniforms: {
        cameraNear: { value: this.camera.near },
        cameraFar: { value: this.camera.far },
        tDiffuse: { value: this.target.texture },
        tDepth: { value: this.target.depthTexture }
      }
    })
    // console.log(shaders);
    // console.log(postMaterial)
    const postPlane = new THREE.PlaneBufferGeometry(2, 2)
    const postQuad = new THREE.Mesh(postPlane, postMaterial)
    this.postScene = new THREE.Scene()
    this.postScene.add(postQuad)
  }

  setupScene () {
    const geometry = new THREE.TorusBufferGeometry(1, 0.3, 128, 64)
    const material = new THREE.MeshBasicMaterial({ color: 'red' })
    const count = 50
    const scale = 5

    for (var i = 0; i < count; i++) {
      const r = Math.random() * 2.0 * Math.PI
      const z = (Math.random() * 2.0) - 1.0
      const zScale = Math.sqrt(1.0 - z * z) * scale

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(
        Math.cos(r) * zScale,
        Math.sin(r) * zScale,
        z * scale
      )
      mesh.rotation.set(Math.random(), Math.random(), Math.random())
      this.scene.add(mesh)
    }
  }

  onWindowResize () {
    if (this.camera !== null && this.camera instanceof THREE.Camera) {
      const { w, h } = this.props
      const aspect = w / h
      this.camera.aspect = aspect
      this.camera.updateProjectionMatrix()

      const dpr = this.renderer.getPixelRatio()
      this.target.setSize(w * dpr, h * dpr)
      this.renderer.setSize(w, h)
    }
  }

  renderThree () {
    // console.log('this.camera instanceof THREE.Camera: ', this.camera instanceof THREE.Camera)
    // console.log('this.postCamera instanceof THREE.Camera: ', this.postCamera instanceof THREE.Camera)
    // console.log('three.camera.isCamera: ', this.camera.isCamera)
    // console.log('three.postCamera.isCamera: ', this.postCamera.isCamera)
    if (!this.state.supportsExtension) return <div />

    if (!this.varsNeedUpdate()) {
      raf(this.renderThree)
      // setTimeout(() => { this.renderThree() }, 2000)
      this.renderer.render(this.scene, this.camera, this.target)
      this.renderer.render(this.postScene, this.postCamera) // THIS IS THE PROBLEM LINE
    }
  }

  render () {
    const { w, h } = this.props
    return (
      <div>
        { this.state.supportsExtension && this.camera instanceof THREE.Camera
          ? <div>
            <div style={{ width: w, height: h }} ref={ref => { this.mount = ref }} />
            {/* ? <canvas width={w} height={h} ref={ref => { this.canvas = ref }} /> */}
          </div>
          : <div>oh no! something went wrong...</div>
        }
      </div>
    )
  }
}

Three.propTypes = {
  w: PropTypes.number.isRequired,
  h: PropTypes.number.isRequired,
  server: PropTypes.bool.isRequired
}

export default Three
