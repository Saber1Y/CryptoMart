import { useWalletClient, useAccount } from 'wagmi'

export function useSigner() {
  const { data: walletClient } = useWalletClient()
  const { address, isConnected } = useAccount()

  return { walletClient, address, isConnected }
}
