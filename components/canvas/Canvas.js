import React, { Component } from 'react'
import DOM from 'react-dom'
import PropTypes from 'prop-types'
import raf from 'raf'
import { binder } from '../../lib/_utils'

class Canvas extends Component {
  constructor (props) {
    super(props)
    binder(this, ['renderCanvas'])
  }

  componentDidMount () {
    this.ctx = this.canvas.getContext('2d')
    this.renderCanvas()
  }

  renderCanvas () {
    const c = DOM.findDOMNode(this.canvas)
    const options = {
      paths: 'M58.5,36.5c-9.06,9.06-10,9-14,22s0,19,0,19,7,17,23,17c7.07,0,17.1-10.21,19-14,2-4,1.9-12.16-4-21-2-3-.32-11.05,0-12,1-3,4-14,1-17C80.34,27.34,71.5,23.5,58.5,36.5Z',
      pointsNumber: '100',
      maxDistance: '70',
      color: 'red',
      debug: true
      // centroid
    }
    // const
  }

  render () {
    const { w, h } = this.props
    console.log(w, h)
    return (
      <canvas className='jelly-canvas' width={w} height={h} ref={ref => { this.canvas = ref }} /> 
    )
  }
}

Canvas.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired
}

export default Canvas
