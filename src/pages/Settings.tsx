import React from 'react'
import { ProfileForm, PasswordChangeForm, NotificationSettings, SystemSettings } from '@/components/profile'

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">설정</h1>
          <p className="text-gray-600">시스템 및 계정 설정 관리</p>
        </div>
      </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProfileForm />
                <PasswordChangeForm />
                <NotificationSettings />
                <SystemSettings />
              </div>
    </div>
  )
}

export default Settings
