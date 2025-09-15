import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { requestToBecomeVendor, getSeller } from '@/services/blockchain'
import { SellerRegistrationParams, SellerStatus } from '@/utils/type.dt'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import AnvilAccountInfo from '@/components/AnvilAccountInfo'
import {
  Store,
  Mail,
  Phone,
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Wallet,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import withUserLayout from '@/components/hoc/withUserLayout'

const BecomeVendor = () => {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sellerStatus, setSellerStatus] = useState<SellerStatus | null>(null)
  const [formData, setFormData] = useState<SellerRegistrationParams>({
    businessName: '',
    description: '',
    email: '',
    phone: '',
    logo: '',
  })

  useEffect(() => {
    const checkSellerStatus = async () => {
      console.log('useEffect triggered - address:', address, 'isConnected:', isConnected)

      if (!address) {
        console.log('No address, setting loading to false')
        setLoading(false)
        return
      }

      try {
        console.log('Checking seller status for address:', address)
        const seller = await getSeller(address)
        console.log('Seller data:', seller)

        // Handle the case where seller exists and has a status
        if (seller && seller.status !== undefined) {
          // Convert BigInt to number if needed
          const status = typeof seller.status === 'bigint' ? Number(seller.status) : seller.status
          setSellerStatus(status as SellerStatus)
          console.log('Set seller status:', status)
        } else {
          // If no seller data or status is 0/undefined, user is unverified (can register)
          console.log('No seller data, setting status to Unverified')
          setSellerStatus(SellerStatus.Unverified)
        }
      } catch (error) {
        console.error('Error checking seller status:', error)
        // On error, assume user is unverified and can register
        setSellerStatus(SellerStatus.Unverified)
      } finally {
        console.log('Setting loading to false')
        setLoading(false)
      }
    }

    checkSellerStatus()
  }, [address, isConnected])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your vendor status...</p>
        </div>
      </div>
    )
  }

  // Show wallet connection if not connected
  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gray-900 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-6">
              <Wallet className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
            <p className="text-gray-400 text-lg mb-8">
              You need to connect your wallet to become a vendor
            </p>
            <ConnectButton />

            {/* Anvil Account Info for local development */}
            <div className="mt-8">
              <AnvilAccountInfo />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show message if already registered or pending (but not for Unverified status)
  if (sellerStatus !== null && sellerStatus !== SellerStatus.Unverified) {
    return (
      <div className="min-h-screen bg-gray-900 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6">
              {sellerStatus === SellerStatus.Pending ? (
                <div className="bg-yellow-500/10">
                  <AlertCircle className="w-8 h-8 text-yellow-400" />
                </div>
              ) : sellerStatus === SellerStatus.Verified ? (
                <div className="bg-green-500/10">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              ) : (
                <div className="bg-red-500/10">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              {sellerStatus === SellerStatus.Pending
                ? 'Verification Pending'
                : sellerStatus === SellerStatus.Verified
                ? 'Already Verified'
                : 'Registration Status'}
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              {sellerStatus === SellerStatus.Pending
                ? 'Your vendor application is currently under review. Please wait for admin approval.'
                : sellerStatus === SellerStatus.Verified
                ? 'You are already registered and verified as a vendor.'
                : 'Your vendor status needs attention.'}
            </p>
            <button
              onClick={() => router.push('/dashboard/user')}
              className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-500 
                text-white hover:bg-indigo-600 transition-colors"
            >
              Return to Profile
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      setIsSubmitting(true)
      await requestToBecomeVendor(formData, address)
      toast.success('Vendor registration submitted successfully!')
      router.push('/dashboard/user')
    } catch (error: any) {
      toast.error(error.message || 'Failed to register as vendor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Become a Vendor</h1>
          <p className="mt-2 text-gray-400">Start selling your products on our marketplace</p>
        </div>

        {/* Registration Form */}
        <div
          className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-xl 
          border border-gray-700/50"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
                <Store className="w-4 h-4" />
                Business Name
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl
                  focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
                  text-white placeholder-gray-400"
                placeholder="Enter your business name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl
                  focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
                  text-white placeholder-gray-400"
                placeholder="Enter your business email"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl
                  focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
                  text-white placeholder-gray-400"
                placeholder="Enter your business phone"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
                <FileText className="w-4 h-4" />
                Business Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl
                  focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
                  text-white placeholder-gray-400 resize-none"
                placeholder="Describe your business"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
                <ImageIcon className="w-4 h-4" />
                Logo URL
              </label>
              <input
                type="url"
                name="logo"
                value={formData.logo}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl
                  focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
                  text-white placeholder-gray-400"
                placeholder="Enter your logo URL (optional)"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 
                bg-blue-500 text-white rounded-xl hover:bg-blue-600 
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Register as Vendor'
              )}
            </button>
          </form>
        </div>

        {/* Terms Notice */}
        <p className="mt-4 text-sm text-gray-400 text-center">
          By registering, you agree to our Terms of Service and Vendor Guidelines
        </p>
      </div>
    </div>
  )
}

export default withUserLayout(BecomeVendor)
