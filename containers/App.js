// main wrapper component - layout, universal styles, etc.
import React, { Component } from 'react'
import Head from '../components/Head'
import { binder } from '../lib/_utils'

// import globalStyles from '../../styles/index.scss'

export default class App extends Component {
  constructor (props) {
    super(props)
    // binder(this, ['endIntro'])
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
            position: fixed;
            overflow: hidden;
           }
        `}</style>
        {/* <style dangerouslySetInnerHTML={{ __html: globalStyles }} /> */}
      </div>
    )
  }
}
