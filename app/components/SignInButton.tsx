import { Form, useTransition } from "@remix-run/react";
import { ReactNode } from "react";
import { FaSpinner } from "react-icons/fa";

export function SignInButton({
  provider,
  title,
  className,
  icon,
}: {
  provider: string;
  title: string;
  className: string;
  icon: ReactNode;
}) {
  const pendingForm = useTransition().submission;
  return (
    <Form action={`/api/connectAccount?type=${provider}`} method="post">
      <button
        className={`${className} font-bold py-2 px-4 rounded flex items-center`}
      >
        <div className="mr-4">
          {pendingForm?.action === `/api/connectAccount?type=${provider}` ? (
            <FaSpinner className="animate-spin" />
          ) : (
            `Sign In with ${title}`
          )}
        </div>
        {icon}
      </button>
    </Form>
  );
}
