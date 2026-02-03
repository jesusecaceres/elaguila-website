'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ClasificadosLoginRedirect() {
  const searchParams = useSearchParams()!;

  useEffect(() => {
    const redirectTo =
      searchParams.get('redirect') || '/clasificados/publicar';

    window.location.href = `/login?redirect=${encodeURIComponent(redirectTo)}`;
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-gray-300">
      <p>Redirigiendo al inicio de sesión…</p>
    </div>
  );
}
