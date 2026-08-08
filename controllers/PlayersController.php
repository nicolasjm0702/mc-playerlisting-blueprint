<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcsimpleplayerlisting;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;

class PlayersController
{
    public function players(Server $server): JsonResponse
    {
        $allocation = $server->allocation;
        if (!$allocation) {
            return new JsonResponse(['online' => false]);
        }

        $host = $allocation->ip === '0.0.0.0' ? $server->node->fqdn : $allocation->ip;
        $status = $this->ping($host, (int) $allocation->port);

        return new JsonResponse($status ?? ['online' => false]);
    }

    /**
     * Minecraft Server List Ping handshake — same protocol a vanilla client uses
     * to show player count in the multiplayer server list. Read-only, no RCON.
     */
    private function ping(string $host, int $port): ?array
    {
        $socket = @fsockopen($host, $port, $errno, $errstr, 1.5);
        if (!$socket) {
            return null;
        }
        stream_set_timeout($socket, 1, 500000);

        try {
            fwrite($socket, $this->handshakePacket($host, $port));
            fwrite($socket, $this->packet("\x00"));

            if ($this->readVarInt($socket) === null) {
                return null;
            }
            $this->readVarInt($socket); // packet id, unused
            $jsonLength = $this->readVarInt($socket);
            if ($jsonLength === null) {
                return null;
            }

            $data = json_decode($this->readExact($socket, $jsonLength), true);
            if (!isset($data['players']['online'], $data['players']['max'])) {
                return null;
            }

            return [
                'online' => true,
                'players' => (int) $data['players']['online'],
                'max' => (int) $data['players']['max'],
            ];
        } finally {
            fclose($socket);
        }
    }

    private function handshakePacket(string $host, int $port): string
    {
        $body = $this->varInt(0x00)
            . $this->varInt(-1)
            . $this->varIntPrefixedString($host)
            . pack('n', $port)
            . $this->varInt(1);

        return $this->packet($body);
    }

    private function packet(string $body): string
    {
        return $this->varInt(strlen($body)) . $body;
    }

    private function varInt(int $value): string
    {
        $out = '';
        $value &= 0xFFFFFFFF;
        do {
            $byte = $value & 0x7F;
            $value >>= 7;
            $out .= pack('C', $value !== 0 ? ($byte | 0x80) : $byte);
        } while ($value !== 0);

        return $out;
    }

    private function varIntPrefixedString(string $value): string
    {
        return $this->varInt(strlen($value)) . $value;
    }

    private function readVarInt($socket): ?int
    {
        $result = 0;
        for ($i = 0; $i < 5; $i++) {
            $byte = fread($socket, 1);
            if ($byte === '' || $byte === false) {
                return null;
            }
            $byte = ord($byte);
            $result |= ($byte & 0x7F) << (7 * $i);
            if (($byte & 0x80) === 0) {
                return $result;
            }
        }

        return null;
    }

    private function readExact($socket, int $length): string
    {
        $data = '';
        while (strlen($data) < $length) {
            $chunk = fread($socket, $length - strlen($data));
            if ($chunk === false || $chunk === '') {
                break;
            }
            $data .= $chunk;
        }

        return $data;
    }
}
