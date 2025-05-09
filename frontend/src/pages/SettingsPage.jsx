import { useState } from 'react'
import { authStore } from '../store/useAuthStore'

export const SettingsPage = () => {
  const { authUser } = authStore()
  const [notifications, setNotifications] = useState(true)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Notifications</h3>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-indigo-600"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <span className="ml-2">
                  Receive notifications about new messages and updates
                </span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium">Account Information</h3>
            <div className="mt-2">
              <div className="text-sm text-gray-600">
                <p>Name: {authUser?.fullName}</p>
                <p>Email: {authUser?.email}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <p className="text-sm text-gray-500">
              More settings will be available soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}