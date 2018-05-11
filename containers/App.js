// main wrapper component - layout, universal styles, etc.
import React, { Component } from 'react'

// import globalStyles from '../../styles/index.scss'

export default class App extends Component {
  render () {
    const { children } = this.props
    return (
      <div className='app-outer'>
        { children }
        <style jsx global>{`
          body, .app-outer {
            margin: 0;
            padding: 0; 
            width: 100vw;
            height: 100vh;
            position: fixed;
            overflow: hidden;
           }
        `}</style>
        {/* <style dangerouslySetInnerHTML={{ __html: globalStyles }} /> */}
      </div>
    )
  }
}
