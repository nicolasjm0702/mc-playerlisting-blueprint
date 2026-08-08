import { faUsers } from "@fortawesome/free-solid-svg-icons";
import http from "@/api/http";
import { ServerContext } from "@/state/server";
import React, { useEffect, useState } from "react";
import StatBlock from "@/components/server/console/StatBlock";

interface PlayersResponse {
    online: boolean;
    players?: number;
    max?: number;
}

type Status = PlayersResponse | "error" | null;

const POLL_INTERVAL_MS = 20 * 1000; // 20 seconds

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.id);
    const variables = ServerContext.useStoreState(
        (state) => state.server.data?.variables,
    );
    const [status, setStatus] = useState<Status>(null);

    const isMinecraft =
        variables?.some((v) => v.envVariable === "SERVER_JARFILE") ?? false;

    useEffect(() => {
        if (!isMinecraft || !uuid) {
            return;
        }

        let cancelled = false;
        const fetchStatus = () => {
            http.get(
                `/api/client/extensions/playerlisting/servers/${uuid}/players`,
            )
                .then(({ data }) => !cancelled && setStatus(data))
                .catch((error) => {
                    console.error("[playerlisting] request failed", error);
                    if (!cancelled) setStatus("error");
                });
        };

        fetchStatus();
        const interval = window.setInterval(fetchStatus, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [isMinecraft, uuid]);

    if (!isMinecraft) {
        return null;
    }

    return (
        <StatBlock icon={faUsers} title={"Players"}>
            {(() => {
                if (status === "error") {
                    return <span className="text-red-400">Error</span>;
                }

                if (status?.online) {
                    return (
                        <span className="text-gray-50">
                            {status.players}{" "}
                            <span className="text-gray-300 text-[70%] select-none">
                                / {status.max}
                            </span>
                        </span>
                    );
                }

                return <span className="text-gray-400">Offline</span>;
            })()}
        </StatBlock>
    );
};
