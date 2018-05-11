import React, { Component } from 'react'
import App from '../containers/App'
import Three from '../components/three/Three'
import { binder } from '../lib/_utils'

export default class HomePage extends Component {
  constructor (props) {
    super(props)
    this.state = { width: 0, height: 0, component: 'three', server: true }
    binder(this, ['getDims'])
  }
  // static async getInitialProps ({ req }) {
  // }
  componentDidMount () {
    this.getDims()
  }
  getDims () {
    if (typeof window !== 'undefined') {
      this.setState({
        width:
          window.innerWidth % 2 === 0
            ? window.innerWidth
            : window.innerWidth + 1,
        height:
          window.innerHeight % 2 === 0
            ? window.innerHeight
            : window.innerHeight + 1,
        server: false
      })
      window.addEventListener('resize', () => { this.getDims() })
      // return { width: window.innerWidth, height: window.innerHeight }
    } else {
      setTimeout(() => { this.getDims() }, 200)
    }
  }
  render () {
    return (
      <App title='Home'>
        <div className='canvas-wrapper'>
          { this.state.component === 'three' && <Three w={this.state.width || 0} h={this.state.height || 0} server={this.state.server} /> }
        </div>
        <style jsx>{`
          .canvas-wrapper {
            width: 100vw;
            height: 100vh;
          }
        `}</style>
      </App>
    )
  }
}
