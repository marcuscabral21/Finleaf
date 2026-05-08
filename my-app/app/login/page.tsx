import { Suspense } from 'react'
import HomeClient from '../HomeClient'

export default function LoginPage() {
  return (
    <Suspense>
      <HomeClient />
    </Suspense>
  )
}
