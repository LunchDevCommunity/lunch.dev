import { FaDiscord } from "react-icons/fa";
import { ActionFunction } from "remix";
import { SignInButton } from "~/components/SignInButton";
export default function Login() {
  return (
    <div>
      <h1>Login</h1>
      <SignInButton
        provider="discord"
        title="Discord"
        icon={<FaDiscord />}
        className=""
      />
    </div>
  );
}
