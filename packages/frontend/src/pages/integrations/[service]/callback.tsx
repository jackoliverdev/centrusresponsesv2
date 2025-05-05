import { Loader } from '@/components/ui/loader';
import { USER_APP_ROUTES } from '@/routing/routes';
import { getAPI } from '@/utils/api';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function IntegrationCallback() {
  const {
    query: { service, code },
    replace,
  } = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!service) return;
    getAPI()
      .axios.get(`/${service}/callback?code=${code}`)
      .then(() => replace(USER_APP_ROUTES.getPath('trainIntegrations')))
      .catch(() => setError(true));
  }, [service, replace, code]);

  return (
    <div className="flex items-center justify-center h-screen w-screen">
      {!error ? (
        <Loader />
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold">Integration failed</h1>
          <Link href={USER_APP_ROUTES.getPath('trainIntegrations')}>
            Go back
          </Link>
        </div>
      )}
    </div>
  );
}
