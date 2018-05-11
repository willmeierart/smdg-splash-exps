import React, { Component } from 'react'
import DOM from 'react-dom'
import PropTypes from 'prop-types'
import raf from 'raf'
import * as THREE from 'three'
import { binder } from '../../lib/_utils'
const OrbitControls = require('three-orbit-controls')(THREE)
const OBJLoader = require('three-obj-loader')
OBJLoader(THREE)
// const vertexShader = require('./shaders/vertex.glsl')
// const fragmentShader = require('./shaders/fragment.glsl')

class Three extends Component {
  constructor (props) {
    super(props)
    this.state = { supportsExtension: true, inited: false, mounted: false, incrementWheel: false, wheelIncrement: 100, opacity: 1 }
    binder(this, ['renderThree', 'init', 'setupScene', 'setupPost', 'onWindowResize', 'varsNeedUpdate', 'handleWheel', 'manipulateControls', 'start', 'stop', 'rotateToruses'])
    const initialVars = ['renderer', 'camera', 'scene', 'target', 'postScene', 'postCamera', 'controls']
    initialVars.forEach(v => { this[v] = null })
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (this.state.inited !== nextState.inited ||
      this.state.opacity !== nextState.opacity ||
      this.props.server !== nextProps.server) {
      return true
    }
    return false
  }

  componentDidMount () { this.setupThree() }
  componentDidUpdate () { this.setupThree() }
  componentWillUnmount () { this.stop() }

  handleWheel (e) {
    if (e.target.object !== undefined) {
      console.log(e.target.object)
      this.manipulateControls(e)
    } else {
      // console.log(e.wheelDelta) // works all the time
      if (this.state.incrementWheel) {
        if (this.state.opacity <= 1) {
          this.setState({
            wheelIncrement: e.wheelDelta,
            opacity: this.state.opacity += e.wheelDelta / 1000
          })
          console.log(this.state.opacity)
          this.forceUpdate()
          if (this.state.opacity < 0) {
            window.location.reload()
          }
        } else {
          this.setState({ opacity: 1 })
        }
      }
    }
  }

  manipulateControls (e) {
    const camera = e.target.object
    const { z } = camera.position
    const rotY = camera.rotation._y
    // if controls position z is less than a certain amount (up to wall)
    // then switch mousebutton 0 to 'rotate' then if rotate hits 90
    // ... prob have to change some stuff to negative vals, etc
    // switch mousebutton 0 to pan then when pan pans left a certain amount ...
    console.log(z)
    console.log(rotY)
    console.log(90 * Math.PI / 180)

    if (Math.abs(z) <= 7) {
      console.log('in wall')
      // console.log(e.wheelDelta);
      this.controls.mouseButtons = {
        ORBIT: THREE.MOUSE.MIDDLE,
        PAN: THREE.MOUSE.RIGHT,
        ZOOM: THREE.MOUSE.LEFT
      }
      this.controls.autoRotate = true
      this.controls.autoRotateSpeed = 20
      if (rotY <= -1.5) {
        this.controls.autoRotate = false
        this.controls.enableZoom = false
        camera.up.y += 1
        this.setState({ incrementWheel: true })
        console.log('state wheel inc', this.state.wheelIncrement)
      }
    } else {
      this.controls.mouseButtons = {
        ORBIT: THREE.MOUSE.LEFT,
        PAN: THREE.MOUSE.RIGHT,
        ZOOM: THREE.MOUSE.MIDDLE
      }
      // e.target.object.rotation = 0
      this.controls.autoRotate = false
    }
  }

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
      this.renderThree(true)
      if (!this.state.inited) { this.forceUpdate() }
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

    // this.camera.position.z = 30
    this.camera.position.z = 55

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.8
    this.controls.rotateSpeed = 0.35
    // this.controls.minZoom = 55
    this.controls.maxDistance = 55
    this.controls.zoomSpeed = -1
    this.controls.minDistance = 7
    this.controls.addEventListener('change', this.handleWheel)

    console.log(this.controls)

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
        this.mount.appendChild(this.renderer.domElement)
        this.setState({ mounted: true })
        this.renderer.domElement.addEventListener('wheel', this.handleWheel)
      } else {
        setTimeout(() => { tryToMount() }, 200)
      }
    }
    tryToMount()
    this.setState({ inited: true })
  }

  setupPost () {
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
        uniform vec3 baseColor;
        float readDepth( sampler2D depthSampler, vec2 coord ) {
          float fragCoordZ = texture2D( depthSampler, coord ).x;
          float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
          return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
        }
        void main() {
          vec3 diffuse = texture2D( tDiffuse, vUv ).rgb;
          float depth = readDepth( tDepth, vUv );
          // gl_FragColor.rgb = vec3( depth );
          gl_FragColor.rgb = baseColor * vec3( depth );
          gl_FragColor.a = 1.0;
          // gl_FragColor.r = 0.9;
          // gl_FragColor = vec4( vec3( vUv, 0. ), 1. );
          // gl_FragColor = vec4(gl_FragCoord.z);
        }`,
      uniforms: {
        cameraNear: { value: this.camera.near },
        cameraFar: { value: this.camera.far },
        tDiffuse: { value: this.target.texture },
        tDepth: { value: this.target.depthTexture },
        baseColor: { value: new THREE.Color(0xff0000) }
      }
    })

    postMaterial.fog = true
    // const fog = new THREE.Fog(0xff0000)
    console.log(postMaterial)

    const postPlane = new THREE.PlaneBufferGeometry(2, 2)
    const postQuad = new THREE.Mesh(postPlane, postMaterial)
    this.postScene = new THREE.Scene()
    this.postScene.add(postQuad)
    // this.postScene.background = new THREE.Color(0xe50000)
  }

  setupScene (blender) {
    const { w, h } = this.props
    const geometry = new THREE.TorusBufferGeometry(1, 0.3, 128, 64)
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.4,
      vertexColors: THREE.NoColors
    })

    if (blender) {
      const manager = new THREE.LoadingManager()
      manager.onStart = function (url, itemsLoaded, itemsTotal) {
        console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' )
      }
      manager.onLoad = function () {
        console.log('Loading complete!')
      }
      manager.onProgress = function (url, itemsLoaded, itemsTotal) {
        console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' )
      }
      manager.onError = function (url) {
        console.log('There was an error loading ' + url )
      }

      const blenderLoader = new THREE.OBJLoader(manager)
      blenderLoader.load('static/assets/torus2.obj', object => {
        object.scale.multiplyScalar(0.2)

        const count = 1000
        const scale = 5

        for (var i = 0; i < count; i++) {
          const r = Math.random() * 2.0 * Math.PI
          const z = (Math.random() * 2.0) - 1.0
          const zScale = Math.sqrt(1.0 - z * z) * scale

          const x = Math.cos(r) * zScale * Math.random() * (w / 50)
          const y = Math.sin(r) * zScale * Math.random() * (h / 50)

          const mesh = new THREE.Mesh(object.children[0].geometry, material)

          mesh.position.set(x, y, z * scale)

          mesh.rotation.set(Math.random(), Math.random(), Math.random())
          this.scene.add(mesh)

          // this.scene.fog = fog
          this.scene.background = new THREE.Color(0xe50000)
        }
      })
    } else {
      const count = 2000
      const scale = 5

      for (var i = 0; i < count; i++) {
        const r = Math.random() * 2.0 * Math.PI
        const z = (Math.random() * 2.0) - 1.0
        const zScale = Math.sqrt(1.0 - z * z) * scale

        const x = Math.cos(r) * zScale * Math.random() * (w / 50)
        const y = Math.sin(r) * zScale * Math.random() * (h / 50)

        const mesh = new THREE.Mesh(geometry, material)
        
        mesh.position.set(x, y, z * scale)

        mesh.rotation.set(Math.random(), Math.random(), Math.random())
        this.scene.add(mesh)

        // this.scene.fog = fog
        this.scene.background = new THREE.Color(0xe50000)
      }
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
    if (!this.state.supportsExtension) return <div />

    if (!this.varsNeedUpdate()) {
      this.start()
      this.rotateToruses()
      this.renderer.render(this.scene, this.camera, this.target)
      this.renderer.render(this.postScene, this.postCamera)
      // console.log(this.scene)
    }
  }

  rotateToruses () {
    this.scene.children.forEach(mesh => {
      const random = fl => { return Math.random() * fl }
      // mesh.rotation.x -= random(0.008)
      // mesh.rotation.y -= random(0.004)
      // mesh.rotation.z -= random(0.012)
      mesh.rotation.x -= Math.random() * 0.008
      mesh.rotation.y -= Math.random() * 0.004
      mesh.rotation.z -= Math.random() * 0.012
    })
  }

  start () { 
    if (!this.frameId) { raf(this.renderThree) }
    // setTimeout(() => { this.renderThree() }, 2000)
  }
  stop () { raf.cancel(this.frameId) }

  render () {
    const { w, h } = this.props
    return (
      <div style={{ backgroundColor: '#ff0000', width: '100vw', height: '100vh', position: 'fixed' }} >
        { this.state.supportsExtension
          ? <div>
            <div /* onWheel={this.handleWheel} */ style={{ width: w, height: h, filter: 'blur(2px)', opacity: this.state.opacity, position: 'fixed' }}
              ref={ref => { this.mount = ref }} />
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
