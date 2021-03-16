import React, { useEffect, useState } from 'react'
import { SigningCosmWasmClient, Account } from 'secretjs'
import { HandleMsg } from '../types/handle_msg'
import { QueryMsg } from '../types/query_msg'

const chainId = 'holodeck-2'
const contractAddress = 'secret166vullxuz7wtdq80t4mrzzvje3076s4sx3k2ky'

interface ConnectContextProps {
  keplrReady: boolean
  account?: Account
}

const ConnectContext = React.createContext<ConnectContextProps>({
  account: undefined,
  keplrReady: false
})

const ConnectContextProvider: React.FC = ({ children }) => {
  const [keplrReady, setKeplrReady] = useState<boolean>(false)
  const [account, setAccount] = useState<Account | undefined>(undefined)
  const [client, setClient] = useState<SigningCosmWasmClient | undefined>(undefined)
  const [reminder, setReminder] = useState(" ");

  const handleInput = event => {
    setReminder(event.target.value);
  };

  const logValue = () => {
    console.log(name);
  };




  const setupKeplr = async () => {
    // Define sleep
    const sleep = (ms: number) => new Promise(accept => setTimeout(accept, ms))

    // Wait for Keplr to be injected to the page
    while (!window.keplr && !window.getOfflineSigner && !window.getEnigmaUtils) {
      await sleep(10)
    }

    console.log(window.keplr)
    console.log(window.getOfflineSigner)
    console.log(window.getEnigmaUtils)

    await window.keplr.experimentalSuggestChain({
      chainId: chainId,
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

    setClient(new SigningCosmWasmClient(
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
          amount: [{ amount: '300000', denom: 'uscrt' }],
          gas: '300000'
        }
      }
    ))
  }

  const setupAccount = async () => {
    const scrtAccount = await client?.getAccount(account?.address)
    setAccount(scrtAccount)
  }

  const connectContract = async () => {
    // Query the current count
    console.log('Querying contract for current count');
    let response = await client?.queryContractSmart(contractAddress, { "stats": {} });
    console.log((response as QueryMsg).stats)
  }

  const queryMyPosts = async () => {
    // Increment the counter
    const handleMsg: HandleMsg = { read: {} }
    console.log('Updating count');
    const response = await client?.execute(contractAddress, handleMsg);
    const decoded = new TextDecoder().decode(response?.data);
    let message = JSON.parse(decoded);
    console.log('read: ', message)


  }

  useEffect(() => {
    setupKeplr()
  }, [])


  useEffect(() => {
    if (keplrReady) {
      setupClient();
    }
  }, [keplrReady])


  useEffect(() => {
    if (client) {
      setupAccount();
      connectContract();
    }
  }, [client])


  const addReminder = async (reminderText: string) => {
    // Increment the counter
    const handleMsg = { record: { "reminder": reminderText } };
    console.log('Updating count');
    const response = await client?.execute(contractAddress, handleMsg);
    console.log('response: ', response);

  }

  return (
    <>
      <h3>
        Hello {account?.address}, you have {account?.balance[0].amount} SCRT
      </h3>
      <button onClick={(e) => { queryMyPosts() }}>Read</button>
      <div>

        <input onChange={handleInput} placeholder={reminder} />

        <button onClick={(e) => { addReminder(reminder) }}>Post</button>
      </div>
      <ConnectContext.Provider value={{ keplrReady, account }}>{children}</ConnectContext.Provider>
    </>
  )
}

export default ConnectContextProvider
