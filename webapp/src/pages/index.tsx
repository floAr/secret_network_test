import * as React from 'react'
import { Link } from 'gatsby'

import Page from '../components/Page'
import Container from '../components/Container'
import IndexLayout from '../layouts'
import ConnectContextProvider from '../secretReact/ConnectContext'

const IndexPage = () => (
  <IndexLayout>
    <Page>
      <ConnectContextProvider>

        <Container>
          <h1>Hi people</h1>
          <p>Welcome to your new Gatsby site.</p>
          <p>Now go build something great.</p>
          <Link to="/page-2/">Go to page 2</Link>
        </Container>
      </ConnectContextProvider>
    </Page>
  </IndexLayout>
)

export default IndexPage
