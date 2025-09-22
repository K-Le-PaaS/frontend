import React, { FormEvent } from 'react'
import { BaseComponentProps } from '@/types'
import { cn } from '@/utils'

interface FormProps extends BaseComponentProps {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  loading?: boolean
}

const Form: React.FC<FormProps> = ({
  children,
  className,
  onSubmit,
  loading = false,
}) => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!loading) {
      onSubmit(e)
    }
  }

  return (
    <form
      className={cn('space-y-4', className)}
      onSubmit={handleSubmit}
    >
      {children}
    </form>
  )
}

export default Form
