import { REST } from "@discordjs/rest";
import { LoaderFunction, useLoaderData } from "remix";
import { getSession } from "~/auth/localSession.server";
import { db } from "~/helpers/prisma.server";
import { USER_SESSION_KEY } from "./oauth/discord";
import type { APIGuildScheduledEvent } from "discord-api-types/v9";

const BASE_URL = "https://discord.com/api/v9";
export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("cookie"));
  const user = session.get(USER_SESSION_KEY);
  const userRecord = await db.users.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!userRecord?.accesstoken)
    throw new Error("User not found or access token not available");

  const discordRest = new REST({ version: "9" }).setToken(
    process.env.DISCORD_BOT_TOKEN || ""
  );
  const { Routes } = await import("discord-api-types/v9");

  console.log(Routes.guildScheduledEvents("105756917887950848"));

  const discordEvents = await discordRest.get(
    Routes.guildScheduledEvents("105756917887950848") as any,
    { authPrefix: "Bot" }
  );

  return discordEvents;
};

interface Event {
  id: string;
  name: string;
}

export default function Events() {
  const events = useLoaderData() as APIGuildScheduledEvent[];
  return (
    <div>
      <h1>Events</h1>
      <ul>
        {events.map((e) => (
          <li key={e.id}>
            {e.name} - {new Date(e.scheduled_start_time).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
