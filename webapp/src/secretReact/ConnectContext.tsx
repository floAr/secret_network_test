import React, { useEffect, useState } from "react";
import { SigningCosmWasmClient, Account } from "secretjs";

const chainId = "holodeck-2";

interface ConnectContextProps {
    keplrReady: boolean
    account?: Account
}

const ConnectContext = React.createContext<ConnectContextProps>({
    account: undefined,
    keplrReady: false
});

const ConnectContextProvider: React.FC = ({children}) => {
    const [keplrReady, setKeplrReady] = useState<boolean>(false)
    const [account, setAccount] = useState<Account>(false)
    //   async componentDidMount() {
    //     await this.setupKeplr();

    //     const account = await this.secretjs.getAccount(this.state.account.address);
    //     this.setState({ account });
    //   }

   
    const setupKeplr = async () => {
        // Define sleep
        const sleep = (ms) => new Promise((accept) => setTimeout(accept, ms));

       
        // Wait for Keplr to be injected to the page
        while (
            !window.keplr &&
            !window.getOfflineSigner &&
            !window.getEnigmaUtils
        ) {
            await sleep(10);
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
                coinType: 529,
            },
            coinType: 529,
            stakeCurrency: {
                coinDenom: 'SCRT',
                coinMinimalDenom: 'uscrt',
                coinDecimals: 6,
            },
            bech32Config: {
                bech32PrefixAccAddr: 'secret',
                bech32PrefixAccPub: 'secretpub',
                bech32PrefixValAddr: 'secretvaloper',
                bech32PrefixValPub: 'secretvaloperpub',
                bech32PrefixConsAddr: 'secretvalcons',
                bech32PrefixConsPub: 'secretvalconspub',
            },
            currencies: [
                {
                    coinDenom: 'SCRT',
                    coinMinimalDenom: 'uscrt',
                    coinDecimals: 6,
                },
            ],
            feeCurrencies: [
                {
                    coinDenom: 'SCRT',
                    coinMinimalDenom: 'uscrt',
                    coinDecimals: 6,
                },
            ],
            gasPriceStep: {
                low: 0.1,
                average: 0.25,
                high: 0.4,
            },
            features: ['secretwasm'],
        });

        // Enable Keplr.
        // This pops-up a window for the user to allow keplr access to the webpage.
        await window.keplr.enable(chainId);
        // Setup SecrtJS with Keplr's OfflineSigner
        // This pops-up a window for the user to sign on each tx we sent
       const keplrOfflineSigner = window.getOfflineSigner(chainId);
        const accounts = await keplrOfflineSigner.getAccounts();

       const secretjs = new SigningCosmWasmClient(
            "https://bootstrap.secrettestnet.io", // holodeck - https://bootstrap.secrettestnet.io; mainnet - user your LCD/REST provider
            accounts[0].address,
            keplrOfflineSigner,
            window.getEnigmaUtils(chainId),
            {
                // 300k - Max gas units we're willing to use for init
                init: {
                    amount: [{ amount: "300000", denom: "uscrt" }],
                    gas: "300000",
                },
                // 300k - Max gas units we're willing to use for exec
                exec: {
                    amount: [{ amount: "300000", denom: "uscrt" }],
                    gas: "300000",
                },
            }
        );

        setAccount(accounts[0])
        setKeplrReady(true)
    }

 
    useEffect(()=>{   setupKeplr()},[])

    return (
      <>
      <h3>Hello {account.address}, you have {account.balance} SCRT</h3>
       <ConnectContext.Provider value={{keplrReady,account}}>
           {children}
       </ConnectContext.Provider>
       </>
    
    )
}

export default ConnectContextProvider