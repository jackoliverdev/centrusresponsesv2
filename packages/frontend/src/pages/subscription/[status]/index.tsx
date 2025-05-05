import { USER_APP_ROUTES } from "@/routing/routes";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { Button } from "antd";
import { AlertCircleIcon, CheckCircleIcon } from "lucide-react";

export default function SubscriptionCallback() {
  const { replace } = useRouter();
  const { status } = useParams();

  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <div className="text-center">
        <div className="text-2xl font-bold mb-4 flex gap-2 items-center">
          {status === "success" ? (
            <>
              <CheckCircleIcon className="w-8 text-green-700" />
              <h1 className="text-2xl font-bold">Payment Success</h1>
            </>
          ) : (
            <>
              <AlertCircleIcon className="w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-red-500">
                Payment failed
              </h1>
            </>
          )}
        </div>
        <Button
          type="text"
          onClick={() => replace(USER_APP_ROUTES.getPath("settingsBilling"))}
        >
          Go back
        </Button>
      </div>
    </div>
  );
}
