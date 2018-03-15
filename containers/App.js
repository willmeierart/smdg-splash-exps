// main wrapper component - layout, universal styles, etc.
import React, { Component } from 'react'
// import axios from 'axios'
import Head from '../components/Head'
// require('dotenv').config()

// import globalStyles from '../../styles/index.scss'

export default class App extends Component {
  constructor (props) {
    super(props)
  }
  render () {
    const { children, title } = this.props
    return (
      <div className='app-outer'>
        <Head title={title} />
        { children }
        <style jsx global>{`
          body, .app-outer {
            margin: 0;
            padding: 0; 
            width: 100vw;
            height: 100vh;
           }
        `}</style>
        {/* <style dangerouslySetInnerHTML={{ __html: globalStyles }} /> */}
      </div>
    )
  }
}
