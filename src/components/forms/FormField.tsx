import React from 'react'
import { FormField as FormFieldType } from '@/types'
import Input from '../ui/Input'
import { cn } from '@/utils'

interface FormFieldProps {
  field: FormFieldType
  value: any
  onChange: (value: any) => void
  error?: string
  className?: string
}

const FormField: React.FC<FormFieldProps> = ({
  field,
  value,
  onChange,
  error,
  className,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = field.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked
      : e.target.value
    onChange(newValue)
  }

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            className={cn(
              'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500',
              error && 'border-red-300 focus:ring-red-500 focus:border-red-500'
            )}
            rows={4}
          />
        )
      
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={handleChange}
            className={cn(
              'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500',
              error && 'border-red-300 focus:ring-red-500 focus:border-red-500'
            )}
          >
            <option value="">선택하세요</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              {field.label}
            </label>
          </div>
        )
      
      default:
        return (
          <Input
            type={field.type}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            error={error || ''}
          />
        )
    }
  }

  return (
    <div className={cn('space-y-1', className)}>
      {field.type !== 'checkbox' && (
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default FormField
