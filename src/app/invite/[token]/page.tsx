import { getInvitationByToken, getInvitationStatus } from '@/lib/use-cases/invitations'
import { InviteForm } from './InviteForm'

type Props = { params: Promise<{ token: string }> }

const STATUS_MESSAGES: Record<string, string> = {
  accepted: 'This invitation has already been used.',
  expired: 'This invitation has expired.',
  revoked: 'This invitation has been revoked.',
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const invitation = await getInvitationByToken(token)

  if (!invitation) {
    return <ErrorPage message="Invalid invitation link." />
  }

  const status = getInvitationStatus(invitation)
  if (status !== 'pending') {
    return <ErrorPage message={STATUS_MESSAGES[status]} />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo-icon.svg" alt="Logo" width={36} height={36} className="mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-900">You have been invited</h1>
          <p className="text-sm text-slate-400 mt-1">{invitation.title}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <InviteForm
            token={token}
            lockedEmail={invitation.email}
            role={invitation.role}
          />
        </div>
      </div>
    </div>
  )
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </div>
  )
}
