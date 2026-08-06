import { faUsers } from '@fortawesome/free-solid-svg-icons';
import http from '@/api/http';
import Icon from '@/components/elements/Icon';
import styles from '@/components/server/console/style.module.css';
import { ServerContext } from '@/state/server';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

interface PlayersResponse {
    online: boolean;
    players?: number;
    max?: number;
}

type Status = PlayersResponse | 'error' | null;

const POLL_INTERVAL_MS = 15000;

export default ({ className }: { className?: string }) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.id);
    const variables = ServerContext.useStoreState((state) => state.server.data?.variables);
    const [status, setStatus] = useState<Status>(null);

    const isMinecraft = variables?.some((v) => v.envVariable === 'SERVER_JARFILE') ?? false;

    useEffect(() => {
        if (!isMinecraft || !uuid) {
            return;
        }

        let cancelled = false;
        const fetchStatus = () => {
            http.get(`/api/client/extensions/playerlisting/servers/${uuid}/players`)
                .then(({ data }) => !cancelled && setStatus(data))
                .catch((error) => {
                    console.error('[playerlisting] request failed', error);
                    if (!cancelled) setStatus('error');
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
        <div className={classNames('grid grid-cols-6 gap-2 md:gap-4 mt-2', className)} style={{ gridColumn: 'span 6 / span 6' }}>
            <div className={classNames(styles.stat_block, 'bg-gray-600')} >
                <div className={classNames(styles.icon, 'bg-gray-700')}>
                    <Icon icon={faUsers} className={'text-gray-100'} />
                </div>
                <div className={'flex flex-col justify-center overflow-hidden w-full min-w-fit'}>
                    <p className={'font-header font-medium leading-tight text-xs md:text-sm text-gray-200'}>
                        Players
                    </p>
                    <div className={'text-sm md:text-base font-semibold text-gray-50 truncate'}>
                        {status === 'error' ? (
                            <span className={'text-red-400'}>Error</span>
                        ) : status?.online ? (
                            `${status.players} / ${status.max}`
                        ) : (
                            <span className={'text-gray-400'}>Offline</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
