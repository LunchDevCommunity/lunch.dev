import { LoaderFunction, redirect } from "remix";
import { commitSession, getSession } from "~/auth/localSession.server";
import { db } from "~/helpers/prisma.server";
import crypto from "crypto";
import { REST } from "@discordjs/rest";
import { User } from "discord.js";

export const USER_SESSION_KEY = "authenticated_user";

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams;
  const { error, error_description, error_uri, state, code } =
    Object.fromEntries(params.entries());
  const session = await getSession(request.headers.get("cookie"));
  try {
    if (error) {
      throw new Error(error_description);
    }
    if (!code) {
      throw new Error("No code provided.");
    }
    const expectedState = crypto
      .createHmac("sha256", process.env.COOKIE_SECRET || "")
      .update(`oauth-token`)
      .digest("hex");

    if (state !== expectedState) {
      throw new Error("Invalid state");
    }
    const { access_token, expires_in, refresh_token } = await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=authorization_code&code=${code}&redirect_uri=${process.env.APP_URL}/oauth/discord&client_id=${process.env.DISCORD_CLIENT_ID}&client_secret=${process.env.DISCORD_CLIENT_SECRET}`,
      }
    ).then((res) => res.json());

    // Do some extra stuff
    const { Routes } = await import("discord-api-types/v9");
    const discordRest = new REST({ version: "9" }).setToken(access_token);

    const discordUser = (await discordRest.get(
      Routes.oauth2CurrentAuthorization(),
      { authPrefix: "Bearer" }
    )) as { user: User };

    const moreDiscordUser = (await discordRest.get(Routes.user(), {
      authPrefix: "Bearer",
    })) as { email: string; username: string; id: string };

    const createdUser = await db.users.create({
      data: {
        accesstoken: access_token,
        refreshtoken: refresh_token,
        expiresat: new Date(Date.now() + expires_in * 1000),
        discorduserid: discordUser.user.id,
        displayname: moreDiscordUser.username,
        email: moreDiscordUser.email,
        profilepictureurl: "",
      },
    });

    const { accesstoken, refreshtoken, expiresat, ...splitUser } = createdUser;

    session.set(USER_SESSION_KEY, splitUser);

    // Add the user to the guild
    discordRest.setToken(process.env.DISCORD_BOT_TOKEN || "");

    // await discordRest.put(
    //   Routes.guildMember(process.env.GUILD_ID || "", discordUser.user.id),
    //   { body: { access_token }, authPrefix: "Bot" }
    // );
    // // Give the user the 'Thorium Account' role
    // await discordRest.put(
    //   Routes.guildMemberRole(
    //     process.env.GUILD_ID || "",
    //     discordUser.user.id,
    //     process.env.DISCORD_ROLE_ID || ""
    //   ),
    //   { body: { access_token }, authPrefix: "Bot" }
    // );

    session.flash("toast", "Discord Connected");
  } catch (err) {
    console.error(err);
    if (err instanceof Error) {
      session.flash("error", err.message);
    }
  }
  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};
