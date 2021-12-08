import { ActionFunction, redirect } from "remix";
import crypto from "crypto";

export const action: ActionFunction = async ({ request }) => {
  const type = new URL(request.url).searchParams.get("type");
  const state = crypto
    .createHmac("sha256", process.env.COOKIE_SECRET || "")
    .update(`oauth-token`)
    .digest("hex");

  switch (type) {
    case "discord": {
      const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || "",
        redirect_uri: `${process.env.APP_URL}/oauth/discord`,
        scope: "identify email guilds guilds.join",
        state,
        response_type: "code",
      });
      const url = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
      return redirect(url);
    }
    default:
      return redirect("/profile");
  }
  return {};
};
