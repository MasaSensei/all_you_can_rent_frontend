'use client'

import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common'
import { CustomerForm, type CustomerFormValues } from '@/components/features/customer/CustomerForm'
import { useCustomer } from '@/lib/hooks'
import { customerApi } from '@/lib/api/modules/index'

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { data: customer, isLoading } = useCustomer(id)

  const updateCustomer = useMutation({
    mutationFn: (data: Partial<CustomerFormValues>) => customerApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', id] })
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer berhasil diperbarui')
      router.push(`/customers/${id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  async function handleSubmit(values: CustomerFormValues) {
    await updateCustomer.mutateAsync(values)
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Edit Customer"
        breadcrumbs={[
          { label: 'Customer', href: '/customers' },
          {
            label: customer ? `${customer.first_name} ${customer.last_name}` : '...',
            href: `/customers/${id}`,
          },
          { label: 'Edit' },
        ]}
      />
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <CustomerForm
          defaultValues={customer}
          onSubmit={handleSubmit}
          isLoading={updateCustomer.isPending}
          submitLabel="Simpan Perubahan"
        />
      </div>
    </div>
  )
}
