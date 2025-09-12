import React, { useState, useEffect } from 'react'
import withAdminLayout from '@/components/hoc/withAdminLayout'
import { getAllSellers, updateSellerStatus } from '@/services/blockchain'
import { SellerData, SellerStatus } from '@/utils/type.dt'
import { 
  Loader2, Search, Users, TrendingUp, AlertCircle,
  ArrowUpRight
} from 'lucide-react'
import { toast } from 'react-toastify'
import Link from 'next/link'

const AdminSellers = () => {
  const [sellers, setSellers] = useState<SellerData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SellerStatus>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchSellers()
  }, [])

  const fetchSellers = async () => {
    try {
      const data = await getAllSellers()
      setSellers(data)
    } catch (error) {
      console.error('Error fetching sellers:', error)
      toast.error('Failed to fetch sellers')
    } finally {
      setLoading(false)
    }
  }

  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch = 
      seller.profile.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.address.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || seller.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusCounts = () => {
    return sellers.reduce((acc, seller) => {
      acc[seller.status] = (acc[seller.status] || 0) + 1
      return acc
    }, {} as Record<SellerStatus, number>)
  }

  const handleUpdateStatus = async (address: string, newStatus: SellerStatus) => {
    setUpdating(address)
    try {
      await updateSellerStatus(address, newStatus)
      await fetchSellers()
      toast.success('Seller status updated successfully')
    } catch (error) {
      toast.error('Failed to update seller status')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
          <p className="text-gray-400">Loading sellers data...</p>
        </div>
      </div>
    )
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start"></div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-6 
          border border-green-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Sellers</p>
              <p className="text-2xl font-bold text-white">
                {statusCounts[SellerStatus.Verified] || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl p-6 
          border border-yellow-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Users className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending Verification</p>
              <p className="text-2xl font-bold text-white">
                {statusCounts[SellerStatus.Pending] || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl p-6 
          border border-red-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Suspended</p>
              <p className="text-2xl font-bold text-white">
                {statusCounts[SellerStatus.Suspended] || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 
        border border-gray-700/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by business name, email, or wallet address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 rounded-xl border border-gray-700
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white
                placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | SellerStatus)}
              className="px-4 py-2.5 bg-gray-900/50 rounded-xl border border-gray-700
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white
                appearance-none pr-10 min-w-[160px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              <option value="all">All Statuses</option>
              <option value={SellerStatus.Verified}>Verified</option>
              <option value={SellerStatus.Pending}>Pending</option>
              <option value={SellerStatus.Suspended}>Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sellers Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Business Name</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Email</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Balance</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredSellers.map((seller) => (
                <tr key={seller.address} className="hover:bg-gray-700/20">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {seller.profile.logo && (
                        <img 
                          src={seller.profile.logo} 
                          alt={seller.profile.businessName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="text-white font-medium">{seller.profile.businessName}</p>
                        <p className="text-sm text-gray-400">{seller.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{seller.profile.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      seller.status === SellerStatus.Verified ? 'bg-green-500/20 text-green-400' :
                      seller.status === SellerStatus.Pending ? 'bg-yellow-500/20 text-yellow-400' :
                      seller.status === SellerStatus.Suspended ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {SellerStatus[seller.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {seller.balance?.toFixed(4)} ETH
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {seller.status === SellerStatus.Pending && (
                        <button
                          onClick={() => handleUpdateStatus(seller.address, SellerStatus.Verified)}
                          disabled={updating === seller.address}
                          className="px-3 py-1 text-sm bg-green-500/20 text-green-400 
                            rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                          {updating === seller.address ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Verify'
                          )}
                        </button>
                      )}
                      {seller.status === SellerStatus.Verified && (
                        <button
                          onClick={() => handleUpdateStatus(seller.address, SellerStatus.Suspended)}
                          disabled={updating === seller.address}
                          className="px-3 py-1 text-sm bg-red-500/20 text-red-400 
                            rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          {updating === seller.address ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Suspend'
                          )}
                        </button>
                      )}
                      <Link
                        href={`/dashboard/admin/sellers/${seller.address}`}
                        className="p-1.5 text-gray-400 hover:text-white 
                          hover:bg-gray-700/50 rounded-lg transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default withAdminLayout(AdminSellers)
