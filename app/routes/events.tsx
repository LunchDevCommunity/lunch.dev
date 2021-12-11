import { REST } from "@discordjs/rest";
import { LoaderFunction, useLoaderData } from "remix";
import { getSession } from "~/auth/localSession.server";
import { db } from "~/helpers/prisma.server";
import { USER_SESSION_KEY } from "./oauth/discord";
import type { APIGuildScheduledEvent } from "discord-api-types/v9";
import { comparators } from 'generate-comparators';

const byScheduledStartTime = comparators(function (guildEvent: APIGuildScheduledEvent) {
	const startTime = new Date(guildEvent.scheduled_start_time);
	return startTime;
});

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
  const discordEvents = await discordRest.get(
    "/guilds/105756917887950848/scheduled-events",
    { authPrefix: "Bot" }
  );

  (discordEvents as APIGuildScheduledEvent[]).sort(byScheduledStartTime.asc);

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
      <h1 className="text-red-500">Events</h1>
      <ul className="text-blue-500">
        {events.map((e) => (
          <li key={e.id}>
            {e.name} - {new Date(e.scheduled_start_time).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
