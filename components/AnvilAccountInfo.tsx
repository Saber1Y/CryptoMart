import React from 'react'

const AnvilAccountInfo = () => {
  const anvilAccounts = [
    {
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      balance: '~10,000 ETH',
    },
    {
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      balance: '~10,000 ETH',
    },
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    console.log('Copied to clipboard:', text)
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Anvil Test Accounts</h3>
      <div className="space-y-4">
        {anvilAccounts.map((account, index) => (
          <div key={index} className="bg-gray-900 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-300">Account {index + 1}</div>
              <div className="text-sm text-green-400">{account.balance}</div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-400 mb-1">Address:</div>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-gray-700 px-2 py-1 rounded font-mono text-gray-200 flex-1">
                    {account.address}
                  </code>
                  <button
                    onClick={() => copyToClipboard(account.address)}
                    className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-1">Private Key:</div>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-gray-700 px-2 py-1 rounded font-mono text-gray-200 flex-1 truncate">
                    {account.privateKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(account.privateKey)}
                    className="text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded">
        <div className="text-sm font-medium text-blue-300 mb-2">How to import:</div>
        <ol className="text-xs text-blue-200 space-y-1">
          <li>1. Open MetaMask</li>
          <li>2. Click account circle → &quot;Import Account&quot;</li>
          <li>3. Select &quot;Private Key&quot;</li>
          <li>4. Paste the private key above</li>
          <li>5. Click &quot;Import&quot;</li>
        </ol>
      </div>
    </div>
  )
}

export default AnvilAccountInfo
