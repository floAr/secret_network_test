import * as React from 'react'
import { useEffect, useState } from 'react'
import { SigningCosmWasmClient } from 'secretjs'

import contracts from '../secretReact/contracts'
import { useInterval } from '../secretReact/useInterval'

const chainId = 'holodeck-2'

interface Token {
  id: string
  name: string
  weapons: number
  engineering: number
  biotech: number
  psychics: number
}
interface PollingData {
  tokens: Token[]
}

const IndexPage = () => {
  const isBrowser = typeof window !== 'undefined'

  const [keplrReady, setKeplrReady] = useState<boolean>(false)
  const [account, setAccount] = useState<Account | undefined>(undefined)
  const [client, setClient] = useState<SigningCosmWasmClient | undefined>(undefined)
  const [pollingData, setPollingData] = useState<PollingData>({ tokens: [] })
  const [viewingKey, setViewingKey] = useState<string>()
  const [unityInstance, setUnityInstance] = useState(undefined)

  if (isBrowser) window.registerUnityInstance = setUnityInstance

  const hideFullScreenButton = ''
  const buildUrl = 'Build'
  const loaderUrl = `${buildUrl}/_build.loader.js`
  const config = {
    dataUrl: `${buildUrl}/_build.data`,
    frameworkUrl: `${buildUrl}/_build.framework.js`,
    codeUrl: `${buildUrl}/_build.wasm`,
    streamingAssetsUrl: 'StreamingAssets',
    companyName: 'DefaultCompany',
    productName: 'Client',
    productVersion: '1.0'
  }

  //#region Function to connect
  const setupKeplr = async (chainId: string) => {
    // Define sleep
    const sleep = (ms: number) => new Promise(accept => setTimeout(accept, ms))

    // Wait for Keplr to be injected to the page
    while (!window.keplr && !window.getOfflineSigner && !window.getEnigmaUtils) {
      await sleep(10)
    }

    await window.keplr.experimentalSuggestChain({
      chainId,
      chainName: 'Secret Testnet',
      rpc: 'http://bootstrap.secrettestnet.io:26657',
      rest: 'https://bootstrap.secrettestnet.io',
      bip44: {
        coinType: 529
      },
      coinType: 529,
      stakeCurrency: {
        coinDenom: 'SCRT',
        coinMinimalDenom: 'uscrt',
        coinDecimals: 6
      },
      bech32Config: {
        bech32PrefixAccAddr: 'secret',
        bech32PrefixAccPub: 'secretpub',
        bech32PrefixValAddr: 'secretvaloper',
        bech32PrefixValPub: 'secretvaloperpub',
        bech32PrefixConsAddr: 'secretvalcons',
        bech32PrefixConsPub: 'secretvalconspub'
      },
      currencies: [
        {
          coinDenom: 'SCRT',
          coinMinimalDenom: 'uscrt',
          coinDecimals: 6
        }
      ],
      feeCurrencies: [
        {
          coinDenom: 'SCRT',
          coinMinimalDenom: 'uscrt',
          coinDecimals: 6
        }
      ],
      gasPriceStep: {
        low: 0.1,
        average: 0.25,
        high: 0.4
      },
      features: ['secretwasm']
    })

    // Enable Keplr.
    // This pops-up a window for the user to allow keplr access to the webpage.
    await window.keplr.enable(chainId)
    setKeplrReady(true)
  }

  const setupClient = async () => {
    // Setup SecrtJS with Keplr's OfflineSigner
    // This pops-up a window for the user to sign on each tx we sent
    const keplrOfflineSigner = window.getOfflineSigner(chainId)
    const accounts = await keplrOfflineSigner.getAccounts()

    const client = new SigningCosmWasmClient(
      'https://bootstrap.secrettestnet.io', // holodeck - https://bootstrap.secrettestnet.io; mainnet - user your LCD/REST provider
      accounts[0].address,
      keplrOfflineSigner,
      window.getEnigmaUtils(chainId),
      {
        // 300k - Max gas units we're willing to use for init
        init: {
          amount: [{ amount: '300000', denom: 'uscrt' }],
          gas: '300000'
        },
        // 300k - Max gas units we're willing to use for exec
        exec: {
          amount: [{ amount: '980000', denom: 'uscrt' }],
          gas: '980000'
        }
      }
    )
    if (isBrowser) window.scrtClient = client
    setClient(client)
  }

  // const query = async (address: string, msg: any) => {
  //   const response = await client?.queryContractSmart(address, msg)
  //   console.log(response)
  //   const decoded = new TextDecoder().decode(response.data)
  //   console.log('query: ', decoded)
  //   return JSON.parse(decoded)
  // }

  const execute = async (address: string, msg: any) => {
    const response = await client?.execute(address, msg)
    const decoded = new TextDecoder().decode(response?.data)
    console.log('exec: ', decoded)
    return JSON.parse(decoded)
  }

  const getToken = async (tokenId: string) => {
    const privateData = await client?.queryContractSmart(
      contracts.nft.address,
      contracts.nft.queries.privateMetadata(tokenId, account.address)
    )
    const skills: number[] = JSON.parse(privateData.private_metadata.image)
    const token: Token = {
      id: tokenId,
      name: privateData.private_metadata.name,
      weapons: skills[0],
      engineering: skills[1],
      biotech: skills[2],
      psychics: skills[3]
    }
    return token
  }

  const pollData = async () => {
    const tokens: Token[] = []
    const allTokens = await client?.queryContractSmart(
      contracts.nft.address,
      contracts.nft.queries.getAllTokens(window.scrtAccount.address)
    )
    const tokenIds: string[] = allTokens.token_list.tokens

    // eslint-disable-next-line no-restricted-syntax
    for (const tokenId of tokenIds) {
      // eslint-disable-next-line no-await-in-loop
      tokens.push(await getToken(tokenId))
    }
    if (unityInstance !== undefined && tokens.length > 0) {
      unityInstance.SendMessage('WebGlBridge', 'ReportTokens', JSON.stringify(tokens))
    }
  }

  const returnFigher = async () => {
    await client?.execute(contracts.bullpen.address, contracts.bullpen.messages.returnFigher())
  }

  const setupAccount = async () => {
    const scrtAccount = await client?.getAccount(account?.address)
    if (viewingKey === undefined) {
      const vKey = await execute(contracts.bullpen.address, contracts.bullpen.messages.setViewingKey())
      await execute(contracts.nft.address, contracts.nft.messages.setViewingKey())
      try {
        setViewingKey(vKey.viewing_key.key)
      } catch (error) {}
    }

    console.log('registering account!')
    console.log(scrtAccount)
    setAccount(scrtAccount)
  }

  const saveName = (name: string | null | undefined) => {
    if (name === undefined || name === null || name.length === 0) return contracts.getEntropy()
    return name
  }

  const registerMinting = (tokens: Token[]) => {
    console.log(unityInstance)
    if (unityInstance !== undefined) {
      unityInstance.SendMessage('WebGlBridge', 'RegisterMint', JSON.stringify(tokens))
    }
  }

  const mintHeroes = async () => {
    const name1 = saveName(prompt('Enter the name of your first hero'))
    const name2 = saveName(prompt('Enter the name of your second hero'))
    const name3 = saveName(prompt('Enter the name of your third hero'))

    const mintResult = await execute(contracts.minter.address, contracts.minter.messages.mint(name1, name2, name3))
    if (mintResult.status.status === 'Success') {
      const mintedTokens = []
      mintedTokens.push(await getToken(name1))
      mintedTokens.push(await getToken(name2))
      mintedTokens.push(await getToken(name3))
      registerMinting(mintedTokens)
    }
  }

  useEffect(() => {
    setupKeplr(chainId)
  }, [])

  useEffect(() => {
    if (keplrReady) {
      setupClient()
    }
  }, [keplrReady])

  useEffect(() => {
    if (client) {
      setupAccount()
    }
  }, [client])

  useInterval(async () => {
    if (account) {
      await pollData()
    }
  }, 30000)
  //#endregion

  if (isBrowser) {
    window.scrtContracts = contracts
    window.scrtAccount = account

    // window.scrtQuery = query
    window.scrtExec = execute

    window.scrtPoll = pollData
    window.scrtMint = mintHeroes
  }

  return account === undefined ? (
    <h1>Connecting</h1>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h1>Connected as {account.address}</h1>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <button onClick={() => mintHeroes()}>Recruit new heroes</button>
        <button>Send them to battle</button>
      </div>
    </div>
  )
}

export default IndexPage
