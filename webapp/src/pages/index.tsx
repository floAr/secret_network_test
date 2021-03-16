import * as React from 'react'

import Page from '../components/Page'
import IndexLayout from '../layouts'
import ConnectContextProvider from '../secretReact/ConnectContext'

const IndexPage = () => (
  <IndexLayout>
    <Page>
      <ConnectContextProvider>
        dummy
      </ConnectContextProvider>
    </Page>
  </IndexLayout>
)

export default IndexPage
